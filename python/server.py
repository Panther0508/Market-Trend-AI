"""
Market Trend AI - Flask API Server

A REST API server that provides cryptocurrency and financial market data
with AI-powered analysis capabilities.

This server integrates with the existing Market Trend AI frontend.
"""

import os
import logging
from flask import Flask, jsonify, request
from flask_cors import CORS
from typing import Dict, Any, List, Optional

from src.config import get_config, setup_logging
from src.data_fetching import get_coingecko_client, get_alphavantage_client
from src.data_processing import (
    calculate_sma, calculate_ema, calculate_rsi, calculate_macd,
    calculate_bollinger_bands, calculate_all_indicators,
    detect_trend, calculate_market_strength, aggregate_crypto_data
)
from src.ai_inference import (
    get_sentiment_analyzer, get_text_generator, get_conversational_ai,
    analyze_market_sentiment, generate_market_report
)
from src.cache import get_cache, clear_cache
from src.utils import APIError, format_api_error

# Initialize Flask app
app = Flask(__name__)

# Configure CORS
config = get_config()
CORS(app, origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:5000"])

# Setup logging
logger = setup_logging(config)


# ============================================================================
# Health & Status Endpoints
# ============================================================================

@app.route("/health", methods=["GET"])
def health_check():
    """Health check endpoint."""
    return jsonify({
        "status": "healthy",
        "service": "market-trend-ai-python",
        "version": "1.0.0"
    })


@app.route("/status", methods=["GET"])
def status():
    """Detailed status endpoint."""
    return jsonify({
        "status": "running",
        "cache": {
            "type": config.cache.cache_type,
            "directory": config.cache.cache_dir if config.cache.cache_type == "file" else None
        },
        "api_keys": {
            "coingecko": bool(config.api.coingecko_api_key),
            "alphavantage": bool(config.api.alpha_vantage_api_key),
            "huggingface": bool(config.api.huggingface_api_key),
        },
        "data_sources": config.active_data_sources,
    })


# ============================================================================
# Cryptocurrency Endpoints
# ============================================================================

@app.route("/api/v1/crypto/price/<coin_id>", methods=["GET"])
def get_crypto_price(coin_id: str):
    """
    Get current price for a cryptocurrency.
    
    Parameters:
        coin_id: CoinGecko coin ID (e.g., 'bitcoin', 'ethereum')
        currency: Query parameter for currency (default: 'usd')
    """
    try:
        currency = request.args.get("currency", "usd")
        client = get_coingecko_client()
        prices = client.get_price(coin_id, currencies=currency)
        
        coin_data = prices.get(coin_id, {})
        return jsonify({
            "success": True,
            "data": {
                "symbol": coin_id,
                "currency": currency,
                "price": coin_data.get(currency),
                "price_24h_change": coin_data.get(f"{currency}_24h_change"),
                "price_24h_vol": coin_data.get(f"{currency}_24h_vol"),
                "market_cap": coin_data.get(f"{currency}_market_cap"),
            }
        })
    except Exception as e:
        logger.error(f"Error fetching price: {e}")
        return jsonify({
            "success": False,
            "error": format_api_error(e)
        }), 500


@app.route("/api/v1/crypto/prices", methods=["GET"])
def get_multiple_prices():
    """
    Get prices for multiple cryptocurrencies.
    
    Query parameters:
        coins: Comma-separated list of coin IDs
        currency: Target currency (default: 'usd')
    """
    try:
        coins = request.args.get("coins", "bitcoin,ethereum,solana")
        currency = request.args.get("currency", "usd")
        
        coin_list = [c.strip() for c in coins.split(",")]
        client = get_coingecko_client()
        
        prices = client.get_price(coin_list, currencies=currency)
        
        return jsonify({
            "success": True,
            "data": {
                coin: data.get(currency) for coin, data in prices.items()
            }
        })
    except Exception as e:
        logger.error(f"Error fetching prices: {e}")
        return jsonify({
            "success": False,
            "error": format_api_error(e)
        }), 500


@app.route("/api/v1/crypto/market/<coin_id>", methods=["GET"])
def get_crypto_market_data(coin_id: str):
    """
    Get detailed market data for a cryptocurrency.
    """
    try:
        currency = request.args.get("currency", "usd")
        client = get_coingecko_client()
        data = client.get_coin_market_data(coin_id, currency=currency)
        
        return jsonify({
            "success": True,
            "data": data.to_dict()
        })
    except Exception as e:
        logger.error(f"Error fetching market data: {e}")
        return jsonify({
            "success": False,
            "error": format_api_error(e)
        }), 500


@app.route("/api/v1/crypto/ohlc/<coin_id>", methods=["GET"])
def get_crypto_ohlc(coin_id: str):
    """
    Get OHLC (candlestick) data for a cryptocurrency.
    
    Query parameters:
        days: Number of days (1, 7, 14, 30, 90, 365, max)
        currency: Target currency
    """
    try:
        days = int(request.args.get("days", 7))
        currency = request.args.get("currency", "usd")
        
        client = get_coingecko_client()
        ohlc_data = client.get_coin_ohlc(coin_id, currency=currency, days=days)
        
        return jsonify({
            "success": True,
            "data": {
                "symbol": coin_id,
                "interval": f"{days}d",
                "candles": [ohlc.to_dict() for ohlc in ohlc_data]
            }
        })
    except Exception as e:
        logger.error(f"Error fetching OHLC: {e}")
        return jsonify({
            "success": False,
            "error": format_api_error(e)
        }), 500


@app.route("/api/v1/crypto/trending", methods=["GET"])
def get_trending_cryptos():
    """Get trending cryptocurrencies."""
    try:
        client = get_coingecko_client()
        trending = client.get_trending_coins()
        
        return jsonify({
            "success": True,
            "data": trending
        })
    except Exception as e:
        logger.error(f"Error fetching trending: {e}")
        return jsonify({
            "success": False,
            "error": format_api_error(e)
        }), 500


@app.route("/api/v1/crypto/global", methods=["GET"])
def get_global_market_data():
    """Get global cryptocurrency market data."""
    try:
        client = get_coingecko_client()
        data = client.get_global_data()
        
        return jsonify({
            "success": True,
            "data": data
        })
    except Exception as e:
        logger.error(f"Error fetching global data: {e}")
        return jsonify({
            "success": False,
            "error": format_api_error(e)
        }), 500


# ============================================================================
# Stock Market Endpoints
# ============================================================================

@app.route("/api/v1/stock/quote/<symbol>", methods=["GET"])
def get_stock_quote(symbol: str):
    """
    Get real-time quote for a stock.
    
    Note: Requires Alpha Vantage API key.
    """
    try:
        client = get_alphavantage_client()
        data = client.get_quote(symbol.upper())
        
        return jsonify({
            "success": True,
            "data": data.to_dict()
        })
    except Exception as e:
        logger.error(f"Error fetching stock quote: {e}")
        return jsonify({
            "success": False,
            "error": format_api_error(e)
        }), 500


@app.route("/api/v1/stock/history/<symbol>", methods=["GET"])
def get_stock_history(symbol: str):
    """
    Get historical daily data for a stock.
    
    Query parameters:
        outputsize: 'compact' (100 days) or 'full' (20+ years)
    """
    try:
        outputsize = request.args.get("outputsize", "compact")
        client = get_alphavantage_client()
        
        ts = client.get_daily_time_series(symbol.upper(), outputsize=outputsize)
        
        return jsonify({
            "success": True,
            "data": ts.to_dict()
        })
    except Exception as e:
        logger.error(f"Error fetching stock history: {e}")
        return jsonify({
            "success": False,
            "error": format_api_error(e)
        }), 500


# ============================================================================
# Technical Analysis Endpoints
# ============================================================================

@app.route("/api/v1/analysis/indicators/<coin_id>", methods=["GET"])
def get_technical_indicators(coin_id: str):
    """
    Calculate technical indicators for a cryptocurrency.
    
    Query parameters:
        days: Number of days of data to fetch
    """
    try:
        days = int(request.args.get("days", 30))
        currency = request.args.get("currency", "usd")
        
        # Fetch OHLC data
        client = get_coingecko_client()
        ohlc_data = client.get_coin_ohlc(coin_id, currency=currency, days=days)
        
        # Calculate indicators
        indicators = calculate_all_indicators(ohlc_data)
        
        # Get latest values
        latest = {}
        for name, values in indicators.items():
            if values:
                latest[name] = {
                    "value": values[-1].value,
                    "timestamp": values[-1].timestamp.isoformat()
                }
        
        # Get trend and strength
        trend = detect_trend(ohlc_data)
        strength = calculate_market_strength(ohlc_data)
        
        return jsonify({
            "success": True,
            "data": {
                "symbol": coin_id,
                "trend": trend,
                "strength": strength,
                "indicators": latest,
                "data_points": len(ohlc_data)
            }
        })
    except Exception as e:
        logger.error(f"Error calculating indicators: {e}")
        return jsonify({
            "success": False,
            "error": format_api_error(e)
        }), 500


@app.route("/api/v1/analysis/trend/<coin_id>", methods=["GET"])
def get_trend(coin_id: str):
    """Get market trend for a cryptocurrency."""
    try:
        days = int(request.args.get("days", 20))
        client = get_coingecko_client()
        
        ohlc_data = client.get_coin_ohlc(coin_id, days=days)
        trend = detect_trend(ohlc_data)
        
        return jsonify({
            "success": True,
            "data": {
                "symbol": coin_id,
                "trend": trend,
                "data_points": len(ohlc_data)
            }
        })
    except Exception as e:
        logger.error(f"Error getting trend: {e}")
        return jsonify({
            "success": False,
            "error": format_api_error(e)
        }), 500


# ============================================================================
# AI Analysis Endpoints
# ============================================================================

@app.route("/api/v1/ai/sentiment", methods=["POST"])
def analyze_sentiment():
    """
    Analyze sentiment of text or headlines.
    
    Request body:
        {
            "texts": ["Headline 1", "Headline 2", ...]
        }
    """
    try:
        data = request.get_json()
        texts = data.get("texts", [])
        
        if not texts:
            return jsonify({
                "success": False,
                "error": "No texts provided"
            }), 400
        
        result = analyze_market_sentiment(texts)
        
        return jsonify({
            "success": True,
            "data": result
        })
    except Exception as e:
        logger.error(f"Error analyzing sentiment: {e}")
        return jsonify({
            "success": False,
            "error": format_api_error(e)
        }), 500


@app.route("/api/v1/ai/summary", methods=["POST"])
def generate_summary():
    """
    Generate AI-powered market summary.
    
    Request body:
        {
            "market_data": {...},
            "news": ["Headline 1", ...]
        }
    """
    try:
        data = request.get_json()
        market_data = data.get("market_data", {})
        news = data.get("news", [])
        
        # If news is not provided, try to fetch it from Alpha Vantage
        if not news:
            try:
                # Use symbols from market data if available, otherwise just general news
                symbols = ",".join(market_data.keys()) if market_data else None
                av_client = get_alphavantage_client()
                news_feed = av_client.get_news_sentiment(symbols=symbols, limit=5)
                news = [article.get("title") for article in news_feed if article.get("title")]
                logger.info(f"Fetched {len(news)} news articles for summary from Alpha Vantage")
            except Exception as e:
                logger.warning(f"Failed to fetch news for summary: {e}")
                # Continue without news
        
        report = generate_market_report(market_data, news)
        
        return jsonify({
            "success": True,
            "data": report.to_dict()
        })
    except Exception as e:
        logger.error(f"Error generating summary: {e}")
        return jsonify({
            "success": False,
            "error": format_api_error(e)
        }), 500


# ============================================================================
# Cache Management Endpoints
# ============================================================================

@app.route("/api/v1/cache/clear", methods=["POST"])
def clear_cache_endpoint():
    """Clear the cache."""
    try:
        source = request.args.get("source")
        count = clear_cache(source)
        
        return jsonify({
            "success": True,
            "data": {
                "cleared_entries": count,
                "source": source or "all"
            }
        })
    except Exception as e:
        logger.error(f"Error clearing cache: {e}")
        return jsonify({
            "success": False,
            "error": format_api_error(e)
        }), 500


# ============================================================================
# Error Handlers
# ============================================================================

@app.errorhandler(404)
def not_found(error):
    return jsonify({
        "success": False,
        "error": "Endpoint not found"
    }), 404


@app.errorhandler(500)
def internal_error(error):
    return jsonify({
        "success": False,
        "error": "Internal server error"
    }), 500


# ============================================================================
# Main Entry Point
# ============================================================================

def main():
    """Run the Flask development server."""
    port = int(os.getenv("PORT", 5001))
    debug = os.getenv("DEBUG", "false").lower() == "true"
    
    logger.info(f"Starting Market Trend AI API server on port {port}")
    
    app.run(
        host="0.0.0.0",
        port=port,
        debug=debug
    )


if __name__ == "__main__":
    main()
