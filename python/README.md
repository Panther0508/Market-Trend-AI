# Market Trend AI - Python Backend

A comprehensive Python application for cryptocurrency and financial market data analysis with integrated AI capabilities.

## Features

### Data Fetching

- **CoinGecko API**: Real-time cryptocurrency prices, market data, OHLC data
- **Alpha Vantage API**: Stock quotes, forex rates, commodities, technical indicators
- Comprehensive caching with configurable TTL

### Data Processing

- **Technical Indicators**: SMA, EMA, RSI, MACD, Bollinger Bands
- **Price Analysis**: Volatility, returns, trend detection
- **Data Aggregation**: Combine data from multiple sources

### AI Inference (Hugging Face)

- **Sentiment Analysis**: Analyze financial news and social media
- **Text Generation**: Create market summaries and reports
- **Conversational AI**: Interactive market data queries

### Core Features

- **Configuration Management**: Secure API key handling with python-dotenv
- **Error Handling**: Exponential backoff retry logic
- **Caching**: File-based or Redis caching
- **Logging**: Structured logging with configurable levels
- **Type Hints**: Comprehensive type annotations
- **Documentation**: Google-style docstrings throughout

## Project Structure

```
python/
├── src/
│   ├── __init__.py          # Main package
│   ├── config/              # Configuration management
│   ├── utils/               # Utilities and error handling
│   ├── cache/               # Caching system
│   ├── data_fetching/       # API clients
│   ├── data_processing/     # Data analysis
│   └── ai_inference/       # AI/NLP capabilities
├── tests/                  # Unit tests
├── docs/                   # Documentation
├── example_usage.py        # Example usage
├── requirements.txt        # Python dependencies
└── .env.example           # Environment template
```

## Installation

1. **Clone the repository**

   ```bash
   cd Market-Trend-AI
   ```

2. **Create virtual environment** (optional but recommended)

   ```bash
   python -m venv venv
   source venv/bin/activate  # Linux/Mac
   # or
   venv\Scripts\activate     # Windows
   ```

3. **Install dependencies**

   ```bash
   cd python
   pip install -r requirements.txt
   ```

4. **Configure API Keys**

   ```bash
   cp .env.example .env
   ```

   Edit `.env` and add your API keys:
   - **Alpha Vantage**: Get a free key at https://www.alphavantage.co/support/#api-key
   - **Hugging Face** (optional): Get a token at https://huggingface.co/settings/tokens
   - **CoinGecko** (optional): Get a key at https://www.coingecko.com/en/api

## Usage

### Basic Example

```python
from src import get_crypto_price, analyze_sentiment

# Get cryptocurrency price
price = get_crypto_price('bitcoin')
print(f"Bitcoin: ${price}")

# Analyze sentiment
result = analyze_sentiment("Bitcoin surges to new all-time high!")
print(f"Sentiment: {result['label']}")
```

### Advanced Usage

```python
from src import (
    get_coingecko_client,
    get_sentiment_analyzer,
    calculate_all_indicators,
)

# Get market data
client = get_coingecko_client()
ohlc_data = client.get_coin_ohlc("bitcoin", days=30)

# Calculate technical indicators
indicators = calculate_all_indicators(ohlc_data)

# Analyze news sentiment
analyzer = get_sentiment_analyzer()
headlines = [
    "Bitcoin ETF approved",
    "Tech stocks rally"
]
result = analyzer.analyze_headlines(headlines)
```

### Running Examples

```bash
cd python
python example_usage.py
```

## Configuration

### Environment Variables

| Variable                | Description                  | Required |
| ----------------------- | ---------------------------- | -------- |
| `ALPHA_VANTAGE_API_KEY` | Alpha Vantage API key        | Yes\*    |
| `HUGGINGFACE_API_KEY`   | Hugging Face API token       | No       |
| `COINGECKO_API_KEY`     | CoinGecko API key            | No       |
| `CACHE_TYPE`            | Cache backend (file/redis)   | No       |
| `CACHE_DURATION`        | Default cache TTL in seconds | No       |
| `LOG_LEVEL`             | Logging level                | No       |

\*Required for stock/forex data features

### Caching

The application supports two caching backends:

1. **File-based** (default): Stores cache in `.cache/` directory
2. **Redis**: For production use with distributed systems

```python
# Configure Redis in .env
CACHE_TYPE=redis
REDIS_HOST=localhost
REDIS_PORT=6379
```

## Running the API Server

```bash
cd python
pip install -r requirements.txt

# Start the server
python server.py
```

**Local Deployment:** The API server runs at `http://localhost:5001`

### API Endpoints

| Endpoint                             | Method | Description              |
| ------------------------------------ | ------ | ------------------------ |
| `/health`                            | GET    | Health check             |
| `/status`                            | GET    | Service status           |
| `/api/v1/crypto/price/<coin>`        | GET    | Get crypto price         |
| `/api/v1/crypto/prices`              | GET    | Get multiple prices      |
| `/api/v1/crypto/market/<coin>`       | GET    | Get market data          |
| `/api/v1/crypto/ohlc/<coin>`         | GET    | Get OHLC data            |
| `/api/v1/crypto/trending`            | GET    | Get trending coins       |
| `/api/v1/crypto/global`              | GET    | Get global market data   |
| `/api/v1/stock/quote/<symbol>`       | GET    | Get stock quote          |
| `/api/v1/stock/history/<symbol>`     | GET    | Get stock history        |
| `/api/v1/analysis/indicators/<coin>` | GET    | Get technical indicators |
| `/api/v1/analysis/trend/<coin>`      | GET    | Get market trend         |
| `/api/v1/ai/sentiment`               | POST   | Analyze sentiment        |
| `/api/v1/ai/summary`                 | POST   | Generate market summary  |
| `/api/v1/cache/clear`                | POST   | Clear cache              |

### API Request/Response Examples

#### Health Check

```bash
GET /health
```

Response:

```json
{
  "status": "healthy",
  "service": "market-trend-ai-python",
  "version": "1.0.0"
}
```

#### Get Cryptocurrency Price

```bash
GET /api/v1/crypto/price/bitcoin?currency=usd
```

Response:

```json
{
  "success": true,
  "data": {
    "symbol": "bitcoin",
    "currency": "usd",
    "price": 67500.0,
    "price_24h_change": 2.5,
    "price_24h_vol": 35000000000,
    "market_cap": 1300000000000
  }
}
```

#### Get OHLC Data

```bash
GET /api/v1/crypto/ohlc/bitcoin?days=7&currency=usd
```

Response:

```json
{
  "success": true,
  "data": {
    "symbol": "bitcoin",
    "interval": "7d",
    "candles": [
      {
        "timestamp": "2024-01-01T00:00:00",
        "open": 42000,
        "high": 43500,
        "low": 41800,
        "close": 43200,
        "symbol": "bitcoin",
        "source": "coingecko"
      }
    ]
  }
}
```

#### Get Stock Quote

```bash
GET /api/v1/stock/quote/AAPL
```

Response:

```json
{
  "success": true,
  "data": {
    "symbol": "AAPL",
    "price": 185.5,
    "open": 184.2,
    "high": 186.0,
    "low": 183.5,
    "volume": 52000000,
    "previous_close": 184.25,
    "currency": "USD",
    "source": "alphavantage"
  }
}
```

#### Get Technical Indicators

```bash
GET /api/v1/analysis/indicators/bitcoin?days=30
```

Response:

```json
{
  "success": true,
  "data": {
    "symbol": "bitcoin",
    "trend": "uptrend",
    "strength": {
      "strength": 0.85,
      "signal": "buy",
      "trend": "uptrend",
      "volatility": 0.025,
      "return": 0.055
    },
    "indicators": {
      "SMA_20": { "value": 42500, "timestamp": "2024-01-01T00:00:00" },
      "RSI_14": { "value": 65.5, "timestamp": "2024-01-01T00:00:00" },
      "MACD": { "value": 450.25, "timestamp": "2024-01-01T00:00:00" }
    },
    "data_points": 30
  }
}
```

#### Analyze Sentiment (POST)

```bash
POST /api/v1/ai/sentiment
Content-Type: application/json

{
  "texts": [
    "Bitcoin surges to new all-time high",
    "Tech stocks rally on positive earnings",
    "Federal Reserve signals rate cuts"
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "overall_sentiment": "positive",
    "average_score": 0.75,
    "counts": { "positive": 2, "negative": 0, "neutral": 1 },
    "results": [
      { "label": "positive", "score": 0.98, ... },
      { "label": "positive", "score": 0.95, ... },
      { "label": "neutral", "score": 0.55, ... }
    ]
  }
}
```

#### Generate Market Summary (POST)

```bash
POST /api/v1/ai/summary
Content-Type: application/json

{
  "market_data": {
    "bitcoin": { "price": 67500, "change": 2.5 },
    "ethereum": { "price": 3450, "change": 1.8 }
  },
  "news": [
    "Bitcoin ETF sees record inflows",
    "Ethereum upgrade improves scalability"
  ]
}
```

Response:

```json
{
  "success": true,
  "data": {
    "title": "Market Summary - 2024-01-01",
    "summary": "The cryptocurrency market shows positive momentum...",
    "key_points": [
      "Bitcoin leads with 2.5% gain",
      "Ethereum follows with 1.8% increase"
    ],
    "sentiment": { "label": "positive", "score": 0.85 },
    "symbols_mentioned": ["BITCOIN", "ETHEREUM"],
    "timestamp": null
  }
}
```

#### Clear Cache

```bash
POST /api/v1/cache/clear?source=coingecko
```

Response:

```json
{
  "success": true,
  "data": {
    "cleared_entries": 15,
    "source": "coingecko"
  }
}
```

## API Reference

### Data Fetching

#### CoinGecko Client

```python
from src.data_fetching import get_coingecko_client

client = get_coingecko_client()

# Get price
prices = client.get_price(['bitcoin', 'ethereum'], 'usd')

# Get OHLC data
ohlc = client.get_coin_ohlc('bitcoin', days=30)

# Get market data
market = client.get_coin_market_data('bitcoin')
```

#### Alpha Vantage Client

```python
from src.data_fetching import get_alphavantage_client

client = get_alphavantage_client()

# Get stock quote
quote = client.get_quote('AAPL')

# Get daily time series
ts = client.get_daily_time_series('AAPL')

# Get technical indicator
rsi = client.get_technical_indicator('AAPL', 'RSI')
```

### Data Processing

```python
from src.data_processing import (
    calculate_sma,
    calculate_rsi,
    calculate_macd,
    detect_trend,
)

# Calculate indicators
sma = calculate_sma(ohlc_data, period=20)
rsi = calculate_rsi(ohlc_data, period=14)
macd = calculate_macd(ohlc_data)

# Detect trend
trend = detect_trend(ohlc_data)  # Returns: 'uptrend', 'downtrend', 'sideways'
```

### AI Inference

```python
from src.ai_inference import (
    get_sentiment_analyzer,
    get_text_generator,
    get_conversational_ai,
)

# Sentiment analysis
analyzer = get_sentiment_analyzer()
result = analyzer.analyze("Market is bullish!")

# Text generation
generator = get_text_generator()
report = generator.generate_market_summary(market_data, news)

# Conversational AI
chat = get_conversational_ai()
response = chat.chat("What's the price of Bitcoin?", context)
```

## Testing

```bash
cd python
pytest tests/ -v
```

Run with coverage:

```bash
pytest tests/ --cov=src --cov-report=html
```

## Error Handling

The application includes comprehensive error handling:

```python
from src.utils import (
    APIError,
    RateLimitError,
    NetworkError,
    RetryExhaustedError,
)

try:
    price = get_crypto_price('bitcoin')
except RateLimitError as e:
    print(f"Rate limited. Retry after {e.retry_after} seconds")
except NetworkError as e:
    print(f"Network error: {e}")
except RetryExhaustedError as e:
    print(f"Failed after {e.attempts} attempts")
```

## License

MIT License

## Contributing

Contributions are welcome! Please open an issue or submit a pull request.
