"""
Utility module for Market Trend AI application.

Provides error handling, retry logic, and common utility functions.
"""

import time
import random
import logging
from typing import Optional, Callable, TypeVar, Any, Dict, List
from functools import wraps
from dataclasses import dataclass
from enum import Enum

from ..config import get_config

logger = logging.getLogger("market_trend_ai.utils")


class APIError(Exception):
    """Base exception for API-related errors."""
    
    def __init__(self, message: str, status_code: Optional[int] = None, 
                 source: Optional[str] = None, details: Optional[Dict[str, Any]] = None):
        """
        Initialize API error.
        
        Args:
            message: Error message
            status_code: HTTP status code (if applicable)
            source: API source (e.g., 'coingecko', 'alphavantage')
            details: Additional error details
        """
        super().__init__(message)
        self.message = message
        self.status_code = status_code
        self.source = source
        self.details = details or {}


class RateLimitError(APIError):
    """Exception raised when API rate limit is exceeded."""
    
    def __init__(self, message: str, retry_after: Optional[int] = None,
                 source: Optional[str] = None):
        """
        Initialize rate limit error.
        
        Args:
            message: Error message
            retry_after: Seconds to wait before retrying
            source: API source
        """
        super().__init__(message, status_code=429, source=source)
        self.retry_after = retry_after


class NetworkError(APIError):
    """Exception raised for network-related errors."""
    
    def __init__(self, message: str, source: Optional[str] = None):
        """
        Initialize network error.
        
        Args:
            message: Error message
            source: API source
        """
        super().__init__(message, status_code=None, source=source)


class InvalidResponseError(APIError):
    """Exception raised for invalid API responses."""
    
    def __init__(self, message: str, source: Optional[str] = None,
                 response_data: Optional[Any] = None):
        """
        Initialize invalid response error.
        
        Args:
            message: Error message
            source: API source
            response_data: The invalid response data
        """
        super().__init__(message, status_code=None, source=source)
        self.response_data = response_data


class ServiceUnavailableError(APIError):
    """Exception raised when a service is unavailable."""
    
    def __init__(self, message: str, source: Optional[str] = None):
        """
        Initialize service unavailable error.
        
        Args:
            message: Error message
            source: API source
        """
        super().__init__(message, status_code=503, source=source)


class RetryExhaustedError(APIError):
    """Exception raised when all retry attempts are exhausted."""
    
    def __init__(self, message: str, attempts: int = 0,
                 source: Optional[str] = None, last_error: Optional[Exception] = None):
        """
        Initialize retry exhausted error.
        
        Args:
            message: Error message
            attempts: Number of retry attempts made
            source: API source
            last_error: The last exception that was raised
        """
        super().__init__(message, status_code=None, source=source)
        self.attempts = attempts
        self.last_error = last_error


def exponential_backoff(attempt: int, base_delay: float = 1.0, 
                        max_delay: float = 60.0, jitter: bool = True) -> float:
    """
    Calculate exponential backoff delay.
    
    Args:
        attempt: The current attempt number (0-indexed)
        base_delay: Initial delay in seconds
        max_delay: Maximum delay in seconds
        jitter: Whether to add random jitter
    
    Returns:
        Delay in seconds before next retry
    
    Example:
        >>> exponential_backoff(0, base_delay=1.0)
        1.0
        >>> exponential_backoff(3, base_delay=1.0)
        8.0
    """
    delay = min(base_delay * (2 ** attempt), max_delay)
    if jitter:
        delay = delay * (0.5 + random.random())
    return delay


T = TypeVar('T')


def retry_with_backoff(
    func: Optional[Callable[..., T]] = None,
    *,
    max_retries: Optional[int] = None,
    base_delay: Optional[float] = None,
    max_delay: Optional[float] = None,
    exceptions: tuple = (APIError, ConnectionError, TimeoutError),
    source: Optional[str] = None,
    log_retry: bool = True
) -> Callable[..., T]:
    """
    Decorator for retrying functions with exponential backoff.
    
    Args:
        func: Function to wrap (used when decorator is called without parentheses)
        max_retries: Maximum number of retry attempts (default from config)
        base_delay: Initial delay between retries in seconds (default from config)
        max_delay: Maximum delay between retries in seconds (default from config)
        exceptions: Tuple of exceptions to catch and retry
        source: API source name for logging
        log_retry: Whether to log retry attempts
    
    Returns:
        Decorated function with retry logic
    
    Example:
        @retry_with_backoff(source="coingecko")
        def fetch_data(url: str) -> dict:
            return requests.get(url).json()
    """
    # Handle both @retry_with_backoff and @retry_with_backoff() usage
    if func is None:
        def decorator(f: Callable[..., T]) -> Callable[..., T]:
            return _create_retry_wrapper(
                f, max_retries, base_delay, max_delay, exceptions, source, log_retry
            )
        return decorator
    else:
        return _create_retry_wrapper(
            func, max_retries, base_delay, max_delay, exceptions, source, log_retry
        )


def _create_retry_wrapper(
    func: Callable[..., T],
    max_retries: Optional[int],
    base_delay: Optional[float],
    max_delay: Optional[float],
    exceptions: tuple,
    source: Optional[str],
    log_retry: bool
) -> Callable[..., T]:
    """Create the retry wrapper function."""
    
    # Get config values if not provided
    config = get_config()
    _max_retries = max_retries if max_retries is not None else config.retry.max_retries
    _base_delay = base_delay if base_delay is not None else config.retry.retry_delay
    _max_delay = max_delay if max_delay is not None else config.retry.max_retry_delay
    
    @wraps(func)
    def wrapper(*args: Any, **kwargs: Any) -> T:
        last_exception: Optional[Exception] = None
        
        for attempt in range(_max_retries + 1):
            try:
                return func(*args, **kwargs)
            except exceptions as e:
                last_exception = e
                
                # Don't retry on final attempt
                if attempt >= _max_retries:
                    break
                
                # Calculate delay
                delay = exponential_backoff(attempt, _base_delay, _max_delay)
                
                # Log retry attempt
                if log_retry:
                    logger.warning(
                        f"{source or func.__name__}: Attempt {attempt + 1}/{_max_retries + 1} failed. "
                        f"Retrying in {delay:.2f}s. Error: {str(e)}"
                    )
                
                time.sleep(delay)
        
        # All retries exhausted
        error_msg = f"Retry exhausted after {_max_retries + 1} attempts for {func.__name__}"
        if source:
            error_msg = f"[{source}] {error_msg}"
        
        raise RetryExhaustedError(
            error_msg,
            attempts=_max_retries + 1,
            source=source,
            last_error=last_exception
        )
    
    return wrapper


def validate_response(response: Any, expected_type: type = dict,
                     source: Optional[str] = None) -> Any:
    """
    Validate API response structure.
    
    Args:
        response: The response to validate
        expected_type: Expected type (dict, list, etc.)
        source: API source for error messages
    
    Returns:
        The validated response
    
    Raises:
        InvalidResponseError: If response is invalid
    """
    if response is None:
        raise InvalidResponseError(
            "Empty response received",
            source=source,
            response_data=None
        )
    
    if not isinstance(response, expected_type):
        raise InvalidResponseError(
            f"Invalid response type: expected {expected_type.__name__}, "
            f"got {type(response).__name__}",
            source=source,
            response_data=response
        )
    
    # For dict responses, check for error messages
    if isinstance(response, dict):
        if "error" in response:
            raise InvalidResponseError(
                f"API returned error: {response['error']}",
                source=source,
                response_data=response
            )
    
    return response


def format_api_error(error: Exception, verbose: bool = True) -> str:
    """
    Format an exception for user-friendly display.
    
    Args:
        error: The exception to format
        verbose: Whether to include detailed error information
    
    Returns:
        Formatted error message
    """
    config = get_config()
    verbose = verbose and config.verbose_errors
    
    if isinstance(error, APIError):
        msg = error.message
        if verbose and error.details:
            msg += f" Details: {error.details}"
        return msg
    elif isinstance(error, RetryExhaustedError):
        msg = f"Request failed after {error.attempts} attempts"
        if verbose and error.last_error:
            msg += f": {str(error.last_error)}"
        return msg
    else:
        return str(error) if verbose else "An unexpected error occurred"


def safe_api_call(func: Callable[..., T], default: T, 
                  *args: Any, **kwargs: Any) -> T:
    """
    Safely call an API function with a default fallback.
    
    Args:
        func: Function to call
        default: Default value to return on failure
        *args: Positional arguments for func
        **kwargs: Keyword arguments for func
    
    Returns:
        Result from func or default value
    """
    try:
        return func(*args, **kwargs)
    except Exception as e:
        logger.error(f"Error in {func.__name__}: {format_api_error(e)}")
        return default


# Type alias for API response data
JSON = Dict[str, Any] | List[Any] | str | int | float | bool | None


__all__ = [
    "APIError",
    "RateLimitError",
    "NetworkError",
    "InvalidResponseError",
    "ServiceUnavailableError",
    "RetryExhaustedError",
    "exponential_backoff",
    "retry_with_backoff",
    "validate_response",
    "format_api_error",
    "safe_api_call",
    "JSON",
]
