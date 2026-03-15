"""
Market Trend AI - Example Usage

This file demonstrates how to use the Market Trend AI platform
for cryptocurrency and financial market data analysis.

Before running:
1. Copy .env.example to .env and add your API keys
2. Install dependencies: pip install -r requirements.txt
"""

import json
from datetime import datetime, timedelta

# Import the main package
from src import (
    get_config,
    setup_logging,
    get_crypto_price,
    get_stock_quote,
    analyze_sentiment,
    get_coingecko_client,
    get_alphavantage_client,
)
from src.data_processing import (
    calculate_sma,
    calculate_ema,
    calculate_rsi,
    calculate_macd,
    calculate_all_indicators,
    detect_trend,
    calculate_market_strength,
    AggregatedMarketData,
)
from src.ai_inference import (
    get_sentiment_analyzer,
    get_text_generator,
    get_conversational_ai,
    analyze_market_sentiment,
    generate_market_report,
)


def main():
    """Main function demonstrating the Market Trend AI platform."""
    
    # Initialize configuration and logging
    config = get_config()
    logger = setup_logging(config)
    
    print("=" * 60)
    print("Market Trend AI - Cryptocurrency & Financial Analysis")
    print("=" * 60)
    
    # =========================================================================
    # Example 1: Get cryptocurrency price
    # =========================================================================
    print("\n[1] Getting cryptocurrency prices...")
    
    price = get_crypto_price("bitcoin")
    if price:
        print(f"  Bitcoin (BTC): ${price:,.2f}")
    else:
        print("  Failed to get Bitcoin price")
    
    # Get multiple coins
    try:
        client = get_coingecko_client()
        prices = client.get_price(
            ["bitcoin", "ethereum", "solana"],
            currencies="usd"
        )
        for coin, data in prices.items():
            print(f"  {coin.capitalize()}: ${data.get('usd', 'N/A'):,.2f}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # =========================================================================
    # Example 2: Get stock quote
    # =========================================================================
    print("\n[2] Getting stock quote...")
    
    quote = get_stock_quote("AAPL")
    if quote:
        print(f"  Apple (AAPL): ${quote.get('price', 'N/A')}")
        print(f"  Volume: {quote.get('volume', 'N/A')}")
    else:
        print("  Failed to get stock quote (requires Alpha Vantage API key)")
    
    # =========================================================================
    # Example 3: Technical Indicators
    # =========================================================================
    print("\n[3] Calculating technical indicators...")
    
    try:
        client = get_coingecko_client()
        
        # Get OHLC data for Bitcoin
        ohlc_data = client.get_coin_ohlc("bitcoin", days=30)
        
        if ohlc_data:
            print(f"  Retrieved {len(ohlc_data)} OHLC data points")
            
            # Calculate SMA
            sma_20 = calculate_sma(ohlc_data, period=20)
            if sma_20:
                print(f"  SMA (20): ${sma_20[-1].value:,.2f}")
            
            # Calculate RSI
            rsi = calculate_rsi(ohlc_data, period=14)
            if rsi:
                print(f"  RSI (14): {rsi[-1].value:.2f}")
            
            # Calculate MACD
            macd = calculate_macd(ohlc_data)
            if macd.get("macd"):
                print(f"  MACD: {macd['macd'][-1].value:.4f}")
            
            # Detect trend
            trend = detect_trend(ohlc_data)
            print(f"  Trend: {trend}")
            
            # Market strength
            strength = calculate_market_strength(ohlc_data)
            print(f"  Signal: {strength.get('signal', 'N/A')}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # =========================================================================
    # Example 4: Sentiment Analysis
    # =========================================================================
    print("\n[4] Analyzing market sentiment...")
    
    headlines = [
        "Bitcoin surges to new all-time high above $70,000",
        "Tech stocks rally on positive earnings reports",
        "Federal Reserve signals potential rate cuts",
        "Oil prices drop amid global demand concerns",
        "Cryptocurrency market sees massive inflows",
    ]
    
    try:
        result = analyze_market_sentiment(headlines)
        print(f"  Overall sentiment: {result.get('overall_sentiment', 'N/A')}")
        print(f"  Average score: {result.get('average_score', 0):.2f}")
        print(f"  Counts: {result.get('counts', {})}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # =========================================================================
    # Example 5: Text Generation
    # =========================================================================
    print("\n[5] Generating market report...")
    
    market_data = {
        "bitcoin": {"price": 67500, "change": 2.5},
        "ethereum": {"price": 3450, "change": 1.8},
        "solana": {"price": 145, "change": -0.5},
        "timestamp": datetime.now().strftime("%Y-%m-%d"),
    }
    
    news = [
        "Bitcoin ETF sees record inflows",
        "Ethereum upgrade improves scalability",
        "Institutional adoption continues",
    ]
    
    try:
        report = generate_market_report(market_data, news)
        print(f"  Title: {report.title}")
        print(f"  Summary: {report.summary[:200]}...")
        if report.sentiment:
            print(f"  Sentiment: {report.sentiment.label.value}")
    except Exception as e:
        print(f"  Error: {e}")
    
    # =========================================================================
    # Example 6: Conversational AI
    # =========================================================================
    print("\n[6] Conversational AI...")
    
    try:
        chat = get_conversational_ai()
        
        # Set market context
        context = {
            "bitcoin_price": 67500,
            "market_trend": "bullish",
        }
        
        response = chat.chat("What's the current market sentiment?", context)
        print(f"  Response: {response.response[:150]}...")
        
        # Another question
        response = chat.chat("Should I buy Bitcoin now?")
        print(f"  Response: {response.response[:150]}...")
        
        # Reset conversation
        chat.reset_conversation()
        print("  Conversation reset")
    except Exception as e:
        print(f"  Error: {e}")
    
    # =========================================================================
    # Example 7: Caching
    # =========================================================================
    print("\n[7] Cache demonstration...")
    
    from src.cache import get_cache, clear_cache
    
    cache = get_cache()
    
    # Cache some data
    cache.set("test_key", {"value": 42}, "demo", ttl=60)
    print("  Cached test data with 60s TTL")
    
    # Retrieve cached data
    cached = cache.get("test_key", "demo")
    print(f"  Retrieved cached data: {cached}")
    
    # Clear cache
    cleared = clear_cache("demo")
    print(f"  Cleared {cleared} cache entries")
    
    print("\n" + "=" * 60)
    print("Examples completed!")
    print("=" * 60)


if __name__ == "__main__":
    main()
