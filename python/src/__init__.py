"""
Market Trend AI - Cryptocurrency and Financial Market Data Analysis Platform

A comprehensive Python application that fetches real-time and historical 
cryptocurrency data from public APIs (CoinGecko, Alpha Vantage) and provides 
AI-powered analysis using Hugging Face transformers.

Features:
- Cryptocurrency and stock market data fetching
- Technical indicators calculation
- Sentiment analysis on financial news
- Text generation for market summaries
- Conversational AI for market data interaction
- Intelligent caching system
- Comprehensive error handling with retry logic

Example usage:
    >>> from src import get_crypto_price, analyze_sentiment
    >>> price = get_crypto_price('bitcoin')
    >>> print(f"Bitcoin price: ${price}")
"""

import logging
from typing import Optional

from .config import get_config, setup_logging

# Configure logging when module is imported
config = get_config()
logger = setup_logging(config)

# Import submodules for easy access
from . import config
from . import utils
from . import cache
from . import data_fetching
from . import data_processing
from . import ai_inference

# Convenience functions
from .data_fetching import (
    get_coingecko_client,
    get_alphavantage_client,
    CoinGeckoClient,
    AlphaVantageClient,
)

from .data_processing import (
    calculate_sma,
    calculate_ema,
    calculate_rsi,
    calculate_macd,
    calculate_bollinger_bands,
    calculate_all_indicators,
    aggregate_crypto_data,
    detect_trend,
    calculate_market_strength,
)

from .ai_inference import (
    get_sentiment_analyzer,
    get_text_generator,
    get_conversational_ai,
    analyze_market_sentiment,
    generate_market_report,
)

from .cache import get_cache, clear_cache


def get_crypto_price(coin_id: str, currency: str = "usd") -> Optional[float]:
    """
    Get current price of a cryptocurrency.
    
    Args:
        coin_id: CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')
        currency: Target currency (default: 'usd')
    
    Returns:
        Current price or None if error
    
    Example:
        >>> price = get_crypto_price('bitcoin')
        >>> print(f"BTC: ${price}")
    """
    try:
        client = get_coingecko_client()
        data = client.get_price(coin_id, currencies=currency)
        return data.get(coin_id, {}).get(currency)
    except Exception as e:
        logger.error(f"Failed to get crypto price: {e}")
        return None


def get_stock_quote(symbol: str) -> Optional[dict]:
    """
    Get current quote for a stock symbol.
    
    Args:
        symbol: Stock symbol (e.g., 'AAPL', 'MSFT')
    
    Returns:
        Quote dictionary or None if error
    
    Example:
        >>> quote = get_stock_quote('AAPL')
        >>> print(quote['price'])
    """
    try:
        client = get_alphavantage_client()
        data = client.get_quote(symbol)
        return data.to_dict()
    except Exception as e:
        logger.error(f"Failed to get stock quote: {e}")
        return None


def analyze_sentiment(text: str) -> dict:
    """
    Analyze sentiment of financial text.
    
    Args:
        text: Text to analyze
    
    Returns:
        Sentiment result dictionary
    
    Example:
        >>> result = analyze_sentiment("Market shows positive momentum")
        >>> print(result['label'])
    """
    try:
        analyzer = get_sentiment_analyzer()
        result = analyzer.analyze(text)
        return result.to_dict()
    except Exception as e:
        logger.error(f"Failed to analyze sentiment: {e}")
        return {"label": "neutral", "score": 0.0}


__version__ = "1.0.0"
__author__ = "Market Trend AI"

__all__ = [
    # Config
    "config",
    "get_config",
    "setup_logging",
    # Utils
    "utils",
    # Cache
    "cache",
    "get_cache",
    "clear_cache",
    # Data fetching
    "data_fetching",
    "get_coingecko_client",
    "get_alphavantage_client",
    "CoinGeckoClient",
    "AlphaVantageClient",
    # Data processing
    "data_processing",
    "calculate_sma",
    "calculate_ema",
    "calculate_rsi",
    "calculate_macd",
    "calculate_bollinger_bands",
    "calculate_all_indicators",
    "aggregate_crypto_data",
    "detect_trend",
    "calculate_market_strength",
    # AI inference
    "ai_inference",
    "get_sentiment_analyzer",
    "get_text_generator",
    "get_conversational_ai",
    "analyze_market_sentiment",
    "generate_market_report",
    # Convenience functions
    "get_crypto_price",
    "get_stock_quote",
    "analyze_sentiment",
]
