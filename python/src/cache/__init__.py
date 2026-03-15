"""
Caching module for Market Trend AI application.

Provides file-based and Redis-based caching with configurable expiration.
"""

import os
import json
import time
import hashlib
import logging
from pathlib import Path
from typing import Optional, Any, Dict, Union
from abc import ABC, abstractmethod
from dataclasses import dataclass, field
from datetime import datetime, timedelta

from ..config import get_config
from ..utils import JSON

logger = logging.getLogger("market_trend_ai.cache")


@dataclass
class CacheEntry:
    """Represents a single cache entry."""
    
    key: str
    value: Any
    created_at: float
    expires_at: float
    source: str
    
    @property
    def is_expired(self) -> bool:
        """Check if the cache entry has expired."""
        return time.time() > self.expires_at
    
    @property
    def age(self) -> float:
        """Get the age of the cache entry in seconds."""
        return time.time() - self.created_at
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for serialization."""
        return {
            "key": self.key,
            "value": self.value,
            "created_at": self.created_at,
            "expires_at": self.expires_at,
            "source": self.source,
        }
    
    @classmethod
    def from_dict(cls, data: Dict[str, Any]) -> "CacheEntry":
        """Create cache entry from dictionary."""
        return cls(
            key=data["key"],
            value=data["value"],
            created_at=data["created_at"],
            expires_at=data["expires_at"],
            source=data["source"],
        )


class CacheBackend(ABC):
    """Abstract base class for cache backends."""
    
    @abstractmethod
    def get(self, key: str) -> Optional[Any]:
        """
        Get a value from cache.
        
        Args:
            key: Cache key
        
        Returns:
            Cached value or None if not found/expired
        """
        pass
    
    @abstractmethod
    def set(self, key: str, value: Any, ttl: int, source: str) -> None:
        """
        Set a value in cache.
        
        Args:
            key: Cache key
            value: Value to cache
            ttl: Time to live in seconds
            source: Data source identifier
        """
        pass
    
    @abstractmethod
    def delete(self, key: str) -> bool:
        """
        Delete a value from cache.
        
        Args:
            key: Cache key
        
        Returns:
            True if deleted, False if not found
        """
        pass
    
    @abstractmethod
    def clear(self, source: Optional[str] = None) -> int:
        """
        Clear cache entries.
        
        Args:
            source: Optional source filter
        
        Returns:
            Number of entries cleared
        """
        pass
    
    @abstractmethod
    def exists(self, key: str) -> bool:
        """
        Check if a key exists in cache.
        
        Args:
            key: Cache key
        
        Returns:
            True if key exists and is not expired
        """
        pass


class FileCacheBackend(CacheBackend):
    """File-based cache backend."""
    
    def __init__(self, cache_dir: str = ".cache"):
        """
        Initialize file cache backend.
        
        Args:
            cache_dir: Directory to store cache files
        """
        self.cache_dir = Path(cache_dir)
        self.cache_dir.mkdir(parents=True, exist_ok=True)
        self._manifest_file = self.cache_dir / "manifest.json"
        self._manifest: Dict[str, Dict[str, Any]] = self._load_manifest()
        self._cleanup_expired()
    
    def _load_manifest(self) -> Dict[str, Dict[str, Any]]:
        """Load cache manifest from disk."""
        if self._manifest_file.exists():
            try:
                with open(self._manifest_file, "r") as f:
                    return json.load(f)
            except (json.JSONDecodeError, IOError) as e:
                logger.warning(f"Failed to load cache manifest: {e}")
        return {}
    
    def _save_manifest(self) -> None:
        """Save cache manifest to disk."""
        try:
            with open(self._manifest_file, "w") as f:
                json.dump(self._manifest, f, indent=2)
        except IOError as e:
            logger.error(f"Failed to save cache manifest: {e}")
    
    def _get_cache_path(self, key: str) -> Path:
        """Get file path for a cache key."""
        key_hash = hashlib.sha256(key.encode()).hexdigest()[:16]
        return self.cache_dir / f"{key_hash}.json"
    
    def _cleanup_expired(self) -> int:
        """Remove expired cache entries."""
        count = 0
        now = time.time()
        expired_keys = []
        
        for key, meta in self._manifest.items():
            if meta.get("expires_at", 0) < now:
                expired_keys.append(key)
        
        for key in expired_keys:
            path = self._get_cache_path(key)
            if path.exists():
                try:
                    path.unlink()
                except OSError:
                    pass
            del self._manifest[key]
            count += 1
        
        if count > 0:
            self._save_manifest()
            logger.debug(f"Cleaned up {count} expired cache entries")
        
        return count
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from cache."""
        meta = self._manifest.get(key)
        if not meta:
            return None
        
        if meta.get("expires_at", 0) < time.time():
            self.delete(key)
            return None
        
        path = self._get_cache_path(key)
        if not path.exists():
            del self._manifest[key]
            return None
        
        try:
            with open(path, "r") as f:
                data = json.load(f)
            return data.get("value")
        except (json.JSONDecodeError, IOError) as e:
            logger.warning(f"Failed to read cache entry {key}: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int, source: str) -> None:
        """Set a value in cache."""
        now = time.time()
        entry = CacheEntry(
            key=key,
            value=value,
            created_at=now,
            expires_at=now + ttl,
            source=source,
        )
        
        path = self._get_cache_path(key)
        try:
            with open(path, "w") as f:
                json.dump(entry.to_dict(), f, indent=2)
            
            self._manifest[key] = {
                "created_at": entry.created_at,
                "expires_at": entry.expires_at,
                "source": source,
            }
            self._save_manifest()
        except IOError as e:
            logger.error(f"Failed to write cache entry {key}: {e}")
    
    def delete(self, key: str) -> bool:
        """Delete a value from cache."""
        if key in self._manifest:
            path = self._get_cache_path(key)
            if path.exists():
                try:
                    path.unlink()
                except OSError:
                    pass
            del self._manifest[key]
            self._save_manifest()
            return True
        return False
    
    def clear(self, source: Optional[str] = None) -> int:
        """Clear cache entries."""
        count = 0
        keys_to_delete = []
        
        if source:
            for key, meta in self._manifest.items():
                if meta.get("source") == source:
                    keys_to_delete.append(key)
        else:
            keys_to_delete = list(self._manifest.keys())
        
        for key in keys_to_delete:
            path = self._get_cache_path(key)
            if path.exists():
                try:
                    path.unlink()
                except OSError:
                    pass
            del self._manifest[key]
            count += 1
        
        if count > 0:
            self._save_manifest()
        
        return count
    
    def exists(self, key: str) -> bool:
        """Check if a key exists in cache."""
        return self.get(key) is not None


class RedisCacheBackend(CacheBackend):
    """Redis-based cache backend."""
    
    def __init__(self, host: str = "localhost", port: int = 6379, 
                 db: int = 0, password: Optional[str] = None):
        """
        Initialize Redis cache backend.
        
        Args:
            host: Redis host
            port: Redis port
            db: Redis database number
            password: Redis password (optional)
        """
        self._redis = None
        self._host = host
        self._port = port
        self._db = db
        self._password = password
        self._connect()
    
    def _connect(self) -> None:
        """Connect to Redis."""
        try:
            import redis
            self._redis = redis.Redis(
                host=self._host,
                port=self._port,
                db=self._db,
                password=self._password if self._password else None,
                decode_responses=True,
                socket_timeout=5,
                socket_connect_timeout=5,
            )
            self._redis.ping()
            logger.info(f"Connected to Redis at {self._host}:{self._port}")
        except ImportError:
            logger.error("Redis package not installed. Install with: pip install redis")
            raise
        except Exception as e:
            logger.error(f"Failed to connect to Redis: {e}")
            raise
    
    def _get_ttl_key(self, key: str) -> str:
        """Get TTL metadata key."""
        return f"{key}:ttl"
    
    def get(self, key: str) -> Optional[Any]:
        """Get a value from cache."""
        if not self._redis:
            return None
        
        try:
            ttl_key = self._get_ttl_key(key)
            ttl = self._redis.get(ttl_key)
            
            if ttl is None:
                return None
            
            if int(ttl) < int(time.time()):
                self.delete(key)
                return None
            
            data = self._redis.get(key)
            if data:
                return json.loads(data)
            return None
        except Exception as e:
            logger.warning(f"Failed to get cache entry {key}: {e}")
            return None
    
    def set(self, key: str, value: Any, ttl: int, source: str) -> None:
        """Set a value in cache."""
        if not self._redis:
            return
        
        try:
            ttl_key = self._get_ttl_key(key)
            expires_at = int(time.time() + ttl)
            
            pipe = self._redis.pipeline()
            pipe.set(key, json.dumps(value))
            pipe.set(ttl_key, str(expires_at))
            pipe.expire(ttl_key, ttl)
            pipe.execute()
        except Exception as e:
            logger.error(f"Failed to set cache entry {key}: {e}")
    
    def delete(self, key: str) -> bool:
        """Delete a value from cache."""
        if not self._redis:
            return False
        
        try:
            ttl_key = self._get_ttl_key(key)
            pipe = self._redis.pipeline()
            pipe.delete(key)
            pipe.delete(ttl_key)
            pipe.execute()
            return True
        except Exception as e:
            logger.warning(f"Failed to delete cache entry {key}: {e}")
            return False
    
    def clear(self, source: Optional[str] = None) -> int:
        """Clear cache entries."""
        if not self._redis:
            return 0
        
        try:
            if source:
                # For source-specific clearing, we need to track keys differently
                pattern = f"cache:{source}:*"
            else:
                pattern = "cache:*"
            
            keys = list(self._redis.scan_iter(match=pattern))
            if keys:
                self._redis.delete(*keys)
            return len(keys)
        except Exception as e:
            logger.error(f"Failed to clear cache: {e}")
            return 0
    
    def exists(self, key: str) -> bool:
        """Check if a key exists in cache."""
        return self.get(key) is not None


class Cache:
    """
    Main cache manager with configurable backend.
    
    Provides a unified interface for caching API responses
    with automatic expiration and source-based management.
    """
    
    def __init__(self, backend: Optional[CacheBackend] = None):
        """
        Initialize cache manager.
        
        Args:
            backend: Cache backend (auto-created from config if not provided)
        """
        if backend is not None:
            self._backend = backend
        else:
            config = get_config()
            if config.cache.cache_type == "redis":
                self._backend = RedisCacheBackend(
                    host=config.cache.redis_host,
                    port=config.cache.redis_port,
                    db=config.cache.redis_db,
                    password=config.cache.redis_password if config.cache.redis_password else None,
                )
            else:
                self._backend = FileCacheBackend(cache_dir=config.cache.cache_dir)
        
        logger.info(f"Cache initialized with {type(self._backend).__name__} backend")
    
    def get(self, key: str, source: str) -> Optional[Any]:
        """
        Get a cached value.
        
        Args:
            key: Cache key
            source: Data source identifier
        
        Returns:
            Cached value or None if not found/expired
        """
        full_key = f"cache:{source}:{key}"
        return self._backend.get(full_key)
    
    def set(self, key: str, value: Any, source: str, 
            ttl: Optional[int] = None) -> None:
        """
        Set a cached value.
        
        Args:
            key: Cache key
            value: Value to cache
            source: Data source identifier
            ttl: Time to live in seconds (uses config default if not provided)
        """
        if ttl is None:
            config = get_config()
            ttl = config.get_cache_duration_for_source(source)
        
        full_key = f"cache:{source}:{key}"
        self._backend.set(full_key, value, ttl, source)
        logger.debug(f"Cached {source}:{key} with TTL={ttl}s")
    
    def delete(self, key: str, source: str) -> bool:
        """
        Delete a cached value.
        
        Args:
            key: Cache key
            source: Data source identifier
        
        Returns:
            True if deleted
        """
        full_key = f"cache:{source}:{key}"
        return self._backend.delete(full_key)
    
    def clear(self, source: Optional[str] = None) -> int:
        """
        Clear cache.
        
        Args:
            source: Optional source to clear (clears all if not provided)
        
        Returns:
            Number of entries cleared
        """
        return self._backend.clear(source)
    
    def cached(self, source: str, ttl: Optional[int] = None, 
               key_func: Optional[Callable[..., str]] = None):
        """
        Decorator for caching function results.
        
        Args:
            source: Data source identifier
            ttl: Time to live in seconds
            key_func: Function to generate cache key from args/kwargs
        
        Returns:
            Decorator function
        
        Example:
            @cache.cached(source="coingecko")
            def get_price(coin_id: str) -> dict:
                return api.fetch_price(coin_id)
        """
        def decorator(func: Callable[..., T]) -> Callable[..., T]:
            @wraps(func)
            def wrapper(*args: Any, **kwargs: Any) -> T:
                # Generate cache key
                if key_func:
                    cache_key = key_func(*args, **kwargs)
                else:
                    cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
                
                # Try to get from cache
                cached_value = self.get(cache_key, source)
                if cached_value is not None:
                    logger.debug(f"Cache hit: {source}:{cache_key}")
                    return cached_value
                
                # Call function and cache result
                result = func(*args, **kwargs)
                self.set(cache_key, result, source, ttl)
                return result
            
            return wrapper  # type: ignore
        return decorator


# Global cache instance
_cache: Optional[Cache] = None


def get_cache() -> Cache:
    """
    Get the global cache instance.
    
    Returns:
        Cache instance
    
    Example:
        >>> cache = get_cache()
        >>> value = cache.get("bitcoin_price", "coingecko")
    """
    global _cache
    if _cache is None:
        _cache = Cache()
    return _cache


def clear_cache(source: Optional[str] = None) -> int:
    """
    Clear the global cache.
    
    Args:
        source: Optional source to clear
    
    Returns:
        Number of entries cleared
    """
    return get_cache().clear(source)


# Import for decorator
from functools import wraps
from typing import TypeVar, Callable

T = TypeVar("T")

__all__ = [
    "CacheBackend",
    "FileCacheBackend",
    "RedisCacheBackend",
    "Cache",
    "CacheEntry",
    "get_cache",
    "clear_cache",
]
