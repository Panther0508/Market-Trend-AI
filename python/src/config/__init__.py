"""
Configuration module for Market Trend AI application.

This module provides a centralized configuration system using python-dotenv
for secure API key management and application settings.
"""

import os
import logging
from pathlib import Path
from typing import Optional, Dict, Any, List
from dataclasses import dataclass, field
from dotenv import load_dotenv

# Load environment variables from .env file
_env_path = Path(__file__).parent.parent.parent / ".env"
load_dotenv(_env_path)


@dataclass
class APIConfig:
    """Configuration for API settings."""
    
    # CoinGecko
    coingecko_api_key: str = field(default_factory=lambda: os.getenv("COINGECKO_API_KEY", ""))
    coingecko_rate_limit: int = field(default_factory=lambda: int(os.getenv("COINGECKO_RATE_LIMIT", "10")))
    
    # Hugging Face
    huggingface_api_key: str = field(default_factory=lambda: os.getenv("HUGGINGFACE_API_KEY", ""))
    huggingface_rate_limit: int = field(default_factory=lambda: int(os.getenv("HUGGINGFACE_RATE_LIMIT", "50")))
    
    # Alpha Vantage
    alpha_vantage_api_key: str = field(default_factory=lambda: os.getenv("ALPHA_VANTAGE_API_KEY", ""))
    alpha_vantage_rate_limit: int = field(default_factory=lambda: int(os.getenv("ALPHA_VANTAGE_RATE_LIMIT", "5")))


@dataclass
class CacheConfig:
    """Configuration for caching system."""
    
    cache_type: str = field(default_factory=lambda: os.getenv("CACHE_TYPE", "file"))
    cache_duration: int = field(default_factory=lambda: int(os.getenv("CACHE_DURATION", "300")))
    cache_dir: str = field(default_factory=lambda: os.getenv("CACHE_DIR", ".cache"))
    
    # Redis configuration
    redis_host: str = field(default_factory=lambda: os.getenv("REDIS_HOST", "localhost"))
    redis_port: int = field(default_factory=lambda: int(os.getenv("REDIS_PORT", "6379")))
    redis_db: int = field(default_factory=lambda: int(os.getenv("REDIS_DB", "0")))
    redis_password: str = field(default_factory=lambda: os.getenv("REDIS_PASSWORD", ""))


@dataclass
class RetryConfig:
    """Configuration for retry logic."""
    
    max_retries: int = field(default_factory=lambda: int(os.getenv("MAX_RETRIES", "3")))
    retry_delay: float = field(default_factory=lambda: float(os.getenv("RETRY_DELAY", "1")))
    max_retry_delay: float = field(default_factory=lambda: float(os.getenv("MAX_RETRY_DELAY", "60")))
    request_timeout: int = field(default_factory=lambda: int(os.getenv("REQUEST_TIMEOUT", "30")))


@dataclass
class LoggingConfig:
    """Configuration for logging."""
    
    log_level: str = field(default_factory=lambda: os.getenv("LOG_LEVEL", "INFO"))
    log_file: str = field(default_factory=lambda: os.getenv("LOG_FILE", "logs/app.log"))
    log_api_requests: bool = field(default_factory=lambda: os.getenv("LOG_API_REQUESTS", "false").lower() == "true")


@dataclass
class AIModelConfig:
    """Configuration for AI models."""
    
    sentiment_model: str = field(default_factory=lambda: os.getenv("SENTIMENT_MODEL", "distilbert-base-uncased-finetuned-sst-2-english"))
    text_generation_model: str = field(default_factory=lambda: os.getenv("TEXT_GENERATION_MODEL", "gpt2"))
    conversational_model: str = field(default_factory=lambda: os.getenv("CONVERSATIONAL_MODEL", "microsoft/DialoGPT-medium"))
    max_tokens: int = field(default_factory=lambda: int(os.getenv("MAX_TOKENS", "200")))
    generation_temperature: float = field(default_factory=lambda: float(os.getenv("GENERATION_TEMPERATURE", "0.7")))


@dataclass
class AppConfig:
    """Main application configuration."""
    
    # Application settings
    app_env: str = field(default_factory=lambda: os.getenv("APP_ENV", "development"))
    debug: bool = field(default_factory=lambda: os.getenv("DEBUG", "false").lower() == "true")
    verbose_errors: bool = field(default_factory=lambda: os.getenv("VERBOSE_ERRORS", "true").lower() == "true")
    
    # Data sources
    active_data_sources: List[str] = field(default_factory=lambda: 
        os.getenv("ACTIVE_DATA_SOURCES", "coingecko,alphavantage").split(","))
    
    # Default values
    default_crypto: str = field(default_factory=lambda: os.getenv("DEFAULT_CRYPTO", "bitcoin"))
    default_stock: str = field(default_factory=lambda: os.getenv("DEFAULT_STOCK", "AAPL"))
    default_currency: str = field(default_factory=lambda: os.getenv("DEFAULT_CURRENCY", "USD"))
    
    # Sub-configurations
    api: APIConfig = field(default_factory=APIConfig)
    cache: CacheConfig = field(default_factory=CacheConfig)
    retry: RetryConfig = field(default_factory=RetryConfig)
    logging: LoggingConfig = field(default_factory=LoggingConfig)
    ai_models: AIModelConfig = field(default_factory=AIModelConfig)
    
    def validate(self) -> List[str]:
        """
        Validate the configuration and return list of warnings/errors.
        
        Returns:
            List of validation messages (warnings and errors)
        """
        messages = []
        
        # Check for required API keys
        if not self.api.alpha_vantage_api_key:
            messages.append("WARNING: ALPHA_VANTAGE_API_KEY is not set. Alpha Vantage features will be limited.")
        
        if not self.api.huggingface_api_key:
            messages.append("WARNING: HUGGINGFACE_API_KEY is not set. Premium AI features will be limited.")
        
        # Validate cache configuration
        if self.cache.cache_type not in ["file", "redis"]:
            messages.append(f"ERROR: Invalid CACHE_TYPE '{self.cache.cache_type}'. Must be 'file' or 'redis'.")
        
        # Validate log level
        valid_log_levels = ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
        if self.logging.log_level.upper() not in valid_log_levels:
            messages.append(f"WARNING: Invalid LOG_LEVEL '{self.logging.log_level}'. Using 'INFO'.")
            self.logging.log_level = "INFO"
        
        # Validate data sources
        valid_sources = ["coingecko", "alphavantage"]
        for source in self.active_data_sources:
            if source not in valid_sources:
                messages.append(f"WARNING: Unknown data source '{source}'. Valid sources: {valid_sources}")
        
        return messages
    
    def get_cache_duration_for_source(self, source: str) -> int:
        """
        Get cache duration for a specific data source.
        
        Args:
            source: Data source name (e.g., 'coingecko', 'alphavantage')
        
        Returns:
            Cache duration in seconds
        """
        source_durations = {
            "coingecko": 60,  # 1 minute for crypto prices
            "alphavantage": 300,  # 5 minutes for stock data
            "huggingface": 3600,  # 1 hour for AI results
        }
        return source_durations.get(source, self.cache.cache_duration)


# Global configuration instance
_config: Optional[AppConfig] = None


def get_config() -> AppConfig:
    """
    Get the global application configuration instance.
    
    This function implements singleton pattern for the configuration.
    
    Returns:
        AppConfig: The application configuration instance
    
    Example:
        >>> config = get_config()
        >>> print(config.default_crypto)
        'bitcoin'
    """
    global _config
    if _config is None:
        _config = AppConfig()
        warnings = _config.validate()
        for warning in warnings:
            if warning.startswith("ERROR"):
                logging.error(warning)
            else:
                logging.warning(warning)
    return _config


def setup_logging(config: Optional[AppConfig] = None) -> logging.Logger:
    """
    Set up logging based on configuration.
    
    Args:
        config: Application configuration (optional, will use global config if not provided)
    
    Returns:
        Configured logger instance
    """
    if config is None:
        config = get_config()
    
    # Create logs directory if needed
    log_file = config.logging.log_file
    if log_file:
        log_path = Path(log_file)
        log_path.parent.mkdir(parents=True, exist_ok=True)
    
    # Configure logging
    log_level = getattr(logging, config.logging.log_level.upper())
    
    # Create formatter
    formatter = logging.Formatter(
        fmt='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
        datefmt='%Y-%m-%d %H:%M:%S'
    )
    
    # Console handler
    console_handler = logging.StreamHandler()
    console_handler.setLevel(log_level)
    console_handler.setFormatter(formatter)
    
    # File handler (if configured)
    handlers = [console_handler]
    if log_file:
        file_handler = logging.FileHandler(log_file)
        file_handler.setLevel(log_level)
        file_handler.setFormatter(formatter)
        handlers.append(file_handler)
    
    # Configure root logger
    logging.basicConfig(
        level=log_level,
        handlers=handlers
    )
    
    logger = logging.getLogger("market_trend_ai")
    logger.setLevel(log_level)
    
    return logger


def reload_config() -> AppConfig:
    """
    Reload the configuration from environment variables.
    
    This is useful for testing or when environment variables change.
    
    Returns:
        AppConfig: The reloaded application configuration
    """
    global _config
    _config = None
    return get_config()
