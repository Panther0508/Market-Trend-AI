# Market AI API - Realtime Market Simulation System

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.6.3-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-Express-green" alt="Node.js">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
  <img src="https://img.shields.io/badge/Version-1.0.0-orange" alt="Version">
</p>

A comprehensive realtime market AI API simulation system that operates independently without external AI connections but demonstrates self-intelligent capabilities through sophisticated algorithms and data processing.

## 🌟 Features

### Core API Features
- **Market Data Retrieval** - Get real-time and historical market data for multiple asset types
- **Real-time Price Simulation** - Advanced algorithmic price simulation using Geometric Brownian Motion, Mean Reversion, and Volatility Clustering
- **Historical Data Generation** - Generate historical OHLCV candlestick data for backtesting
- **Technical Indicator Calculations** - Comprehensive technical analysis including SMA, EMA, RSI, MACD, Bollinger Bands, ATR, Stochastic, OBV, VWAP
- **Market Sentiment Analysis** - Simulated sentiment analysis based on price action, volume, and technical indicators
- **Predictive Analytics** - Statistical and ML-based price predictions using Linear Regression, Moving Average Forecast, Momentum, and Mean Reversion models
- **Portfolio Management** - Full portfolio management with positions, orders, and trade execution
- **Order Book Simulation** - Real-time order book generation with bid/ask levels
- **Trade Execution Simulation** - Simulated trade execution with market, limit, stop orders
- **Webhook Notifications** - Real-time webhook notifications for market events

### Advanced Features
- **Multiple Market Simulation Modes** - realistic, volatile, stable, bull, bear, random
- **Configurable Volatility Parameters** - Customize volatility per asset
- **Multi-Asset Support** - Stocks, Forex, and Cryptocurrencies
- **Backtesting Capabilities** - Historical strategy backtesting
- **Data Export** - Export market data in multiple formats
- **WebSocket Support** - Streaming real-time price data
- **Rate Plan Management** - free, basic, pro, enterprise tiers
- **Usage Analytics** - Track API usage and performance
- **Dashboard** - Web-based monitoring dashboard

## 📁 Project Structure

```
server/api/
├── config/
│   └── index.ts           # Central configuration management
├── models/
│   └── index.ts           # Data models and TypeScript interfaces
├── services/
│   ├── index.ts           # Services export
│   ├── priceSimulation.ts # Advanced price simulation engine
│   ├── technicalIndicators.ts # Technical analysis calculations
│   ├── sentimentAnalysis.ts  # Market sentiment analysis
│   ├── predictiveAnalytics.ts # Price prediction models
│   ├── portfolioManagement.ts # Portfolio & trading
│   └── authService.ts     # Authentication & API keys
├── middleware/
│   └── auth.ts            # Authentication middleware
└── README.md              # This file
```

## 🚀 Getting Started

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

### Environment Configuration

Create a `.env` file in the root directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# API Configuration
API_PREFIX=/api/v1
RATE_LIMIT_WINDOW=60000
RATE_LIMIT_MAX=100
CORS_ORIGIN=http://localhost:3000,http://localhost:5173

# Authentication
JWT_SECRET=your-secret-key-change-in-production

# Market Simulation
PRICE_UPDATE_INTERVAL=1000
CACHE_ENABLED=true
CACHE_TTL=300

# WebSocket
WS_ENABLED=true

# Webhooks
WEBHOOKS_ENABLED=true

# Database
DB_TYPE=memory

# Analytics
ANALYTICS_ENABLED=true
```

## 📖 API Documentation

### Authentication

All API requests require authentication using an API key:

```bash
# Include API key in header
curl -H "X-API-Key: your-api-key" https://api.example.com/api/v1/markets
```

### Base URL

```
https://api.example.com/api/v1
```

---

### Market Data Endpoints

#### Get All Assets

```http
GET /markets/assets
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "asset_1",
      "symbol": "BTC",
      "name": "Bitcoin",
      "type": "crypto",
      "exchange": "CRYPTO",
      "currentPrice": 68500.00,
      "previousPrice": 68200.00,
      "volume24h": 52000000,
      "change": 300.00,
      "changePercent": 0.44
    }
  ]
}
```

#### Get Asset by Symbol

```http
GET /markets/assets/:symbol
```

**Example:**
```bash
curl https://api.example.com/api/v1/markets/assets/BTC
```

#### Get Price Ticker

```http
GET /markets/ticker/:symbol
```

#### Get Order Book

```http
GET /markets/orderbook/:symbol?depth=10
```

#### Get Historical Candles

```http
GET /markets/candles/:symbol?timeframe=1h&limit=100
```

**Parameters:**
- `symbol` - Asset symbol (e.g., BTC, AAPL, EUR/USD)
- `timeframe` - Candle timeframe: 1m, 5m, 15m, 1h, 4h, 1d, 1w
- `limit` - Number of candles to retrieve (max 1000)

---

### Technical Indicators

#### Get All Indicators

```http
GET /indicators/:symbol?timeframe=1h
```

**Response:**
```json
{
  "success": true,
  "data": {
    "sma": { "name": "SMA", "value": 68250.00, "signal": "buy" },
    "ema": { "name": "EMA", "value": 68300.00, "signal": "buy" },
    "rsi": { "name": "RSI", "value": 58.5, "signal": "neutral" },
    "macd": { "name": "MACD", "value": 125.50, "signal": "buy" }
  }
}
```

#### Get Specific Indicator

```http
GET /indicators/:symbol/rsi?period=14
GET /indicators/:symbol/macd?fast=12&slow=26&signal=9
GET /indicators/:symbol/bollinger?period=20&stdDev=2
```

**Available Indicators:**
- `sma` - Simple Moving Average
- `ema` - Exponential Moving Average
- `rsi` - Relative Strength Index
- `macd` - Moving Average Convergence Divergence
- `bollinger` - Bollinger Bands
- `atr` - Average True Range
- `stochastic` - Stochastic Oscillator
- `obv` - On-Balance Volume
- `vwap` - Volume Weighted Average Price

---

### Sentiment Analysis

#### Get Asset Sentiment

```http
GET /sentiment/:symbol
```

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "BTC",
    "sentiment": "bullish",
    "score": 35,
    "confidence": 75,
    "factors": [
      { "type": "price_action", "impact": 25, "description": "Moderate bullish price action" },
      { "type": "rsi", "impact": 15, "description": "RSI in neutral zone" }
    ]
  }
}
```

#### Get Market Sentiment

```http
GET /sentiment/market
```

---

### Predictive Analytics

#### Get Price Prediction

```http
GET /prediction/:symbol?horizon=1&model=ensemble
```

**Parameters:**
- `symbol` - Asset symbol
- `horizon` - Prediction horizon (in periods)
- `model` - Prediction model: linear_regression, moving_average_forecast, momentum, mean_reversion, ensemble

**Response:**
```json
{
  "success": true,
  "data": {
    "symbol": "BTC",
    "currentPrice": 68500.00,
    "predictedPrice": 69200.00,
    "confidence": 65.5,
    "direction": "up",
    "probability": 65.5,
    "model": "ensemble",
    "horizon": 1,
    "timestamp": "2024-01-15T10:30:00Z"
  }
}
```

#### List Available Models

```http
GET /prediction/models
```

---

### Portfolio Management

#### Create Portfolio

```http
POST /portfolio
Content-Type: application/json

{
  "name": "My Portfolio",
  "initialBalance": 10000
}
```

#### Get Portfolio

```http
GET /portfolio/:id
```

#### Get All Portfolios

```http
GET /portfolio
```

#### Add Position

```http
POST /portfolio/:id/positions
Content-Type: application/json

{
  "symbol": "BTC",
  "quantity": 0.5
}
```

---

### Orders & Trading

#### Create Order

```http
POST /orders
Content-Type: application/json

{
  "portfolioId": "portfolio_123",
  "symbol": "BTC",
  "type": "market",
  "side": "buy",
  "quantity": 0.1
}
```

**Order Types:**
- `market` - Market order
- `limit` - Limit order
- `stop` - Stop order
- `stop_limit` - Stop limit order

**Order Sides:**
- `buy` - Buy order
- `sell` - Sell order

**Time in Force:**
- `GTC` - Good Till Cancelled
- `IOC` - Immediate or Cancel
- `FOK` - Fill or Kill
- `GTD` - Good Till Date

#### Get Orders

```http
GET /orders?portfolioId=portfolio_123
```

#### Cancel Order

```http
DELETE /orders/:id
```

---

### Market Simulation

#### Set Simulation Mode

```http
POST /simulation/mode
Content-Type: application/json

{
  "mode": "volatile"
}
```

**Available Modes:**
- `realistic` - Realistic market simulation
- `volatile` - High volatility
- `stable` - Low volatility
- `bull` - Bull market
- `bear` - Bear market
- `random` - Random behavior

#### Set Asset Volatility

```http
POST /simulation/volatility
Content-Type: application/json

{
  "symbol": "BTC",
  "volatility": 0.08
}
```

---

### Webhooks

#### Create Webhook Subscription

```http
POST /webhooks
Content-Type: application/json

{
  "url": "https://your-server.com/webhook",
  "events": ["price_update", "order_filled", "sentiment_change"]
}
```

**Available Events:**
- `price_update` - Price updates
- `order_filled` - Order execution
- `sentiment_change` - Sentiment changes
- `prediction_update` - New predictions

#### List Webhooks

```http
GET /webhooks
```

#### Delete Webhook

```http
DELETE /webhooks/:id
```

---

### API Keys

#### Create API Key

```http
POST /auth/keys
Content-Type: application/json

{
  "name": "My API Key",
  "ratePlan": "basic",
  "permissions": ["read", "write"]
}
```

#### List API Keys

```http
GET /auth/keys
```

#### Revoke API Key

```http
DELETE /auth/keys/:id
```

---

### Analytics

#### Get API Usage

```http
GET /analytics/usage
```

#### Get Rate Limits

```http
GET /analytics/rate-limits
```

---

## 🤖 AI Integration Placeholders

This system is designed with future AI integration in mind. The following endpoints are placeholders for when external AI models are connected:

### Future AI Endpoints

#### AI-Powered Analysis
```http
POST /ai/analyze
Content-Type: application/json

{
  "symbol": "BTC",
  "analysisType": "comprehensive"
}
```

#### AI Signal Generation
```http
GET /ai/signals?symbols=BTC,ETH&timeframe=1h
```

#### AI Portfolio Optimization
```http
POST /ai/optimize-portfolio
Content-Type: application/json

{
  "portfolioId": "portfolio_123",
  "riskTolerance": "moderate",
  "targetReturn": 0.15
}
```

#### Natural Language Queries
```http
POST /ai/query
Content-Type: application/json

{
  "query": "What is the best performing asset today?"
}
```

### Integration Guide

To integrate external AI models:

1. **Implement AI Adapter** - Create a new service implementing the `AIAdapter` interface
2. **Configure Endpoint** - Update the `/ai/*` routes to use your adapter
3. **Add API Keys** - Add your AI provider API keys to environment variables

```typescript
// Example AI Adapter Interface
interface AIAdapter {
  analyze(data: MarketData): Promise<AnalysisResult>;
  generateSignals(assets: Asset[]): Promise<Signal[]>;
  optimizePortfolio(portfolio: Portfolio, constraints: Constraints): Promise<PortfolioAllocation>;
  processQuery(query: string): Promise<string>;
}
```

---

## 📊 Rate Plans

| Feature | Free | Basic | Pro | Enterprise |
|---------|------|-------|-----|------------|
| Requests/min | 10 | 60 | 300 | 1000 |
| Requests/day | 1,000 | 10,000 | 100,000 | Unlimited |
| Historical Data | 30 days | 90 days | 180 days | 365 days |
| WebSocket Connections | 1 | 5 | 20 | 100 |
| Webhooks | 1 | 5 | 20 | 100 |
| Backtests | 1 | 10 | 100 | Unlimited |
| Export Limit | 1,000 | 10,000 | 100,000 | Unlimited |

---

## 🔧 Development

### Running Tests

```bash
# Run all tests
npm test

# Run specific test suite
npm test -- --grep="price simulation"
```

### Building for Production

```bash
# Build the application
npm run build

# Start production server
npm start
```

### Code Structure

The codebase follows clean architecture principles:

- **Services** - Business logic and data processing
- **Models** - Data structures and TypeScript interfaces
- **Middleware** - Cross-cutting concerns (auth, logging)
- **Routes** - API endpoint definitions

---

## 📝 API Examples

### JavaScript/Node.js

```javascript
const API_KEY = 'your-api-key';
const BASE_URL = 'https://api.example.com/api/v1';

async function getBitcoinPrice() {
  const response = await fetch(`${BASE_URL}/markets/ticker/BTC`, {
    headers: { 'X-API-Key': API_KEY }
  });
  return response.json();
}

// Get technical indicators
async function getIndicators(symbol) {
  const response = await fetch(`${BASE_URL}/indicators/${symbol}`, {
    headers: { 'X-API-Key': API_KEY }
  });
  return response.json();
}

// Create a buy order
async function createOrder(orderData) {
  const response = await fetch(`${BASE_URL}/orders`, {
    method: 'POST',
    headers: {
      'X-API-Key': API_KEY,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(orderData)
  });
  return response.json();
}
```

### Python

```python
import requests

API_KEY = 'your-api-key'
BASE_URL = 'https://api.example.com/api/v1'
headers = {'X-API-Key': API_KEY}

def get_bitcoin_price():
    response = requests.get(f'{BASE_URL}/markets/ticker/BTC', headers=headers)
    return response.json()

def get_indicators(symbol):
    response = requests.get(f'{BASE_URL}/indicators/{symbol}', headers=headers)
    return response.json()
```

### cURL

```bash
# Get Bitcoin price
curl -H "X-API-Key: your-api-key" \
  https://api.example.com/api/v1/markets/ticker/BTC

# Get technical indicators
curl -H "X-API-Key: your-api-key" \
  https://api.example.com/api/v1/indicators/BTC

# Create order
curl -X POST -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{"portfolioId":"portfolio_123","symbol":"BTC","type":"market","side":"buy","quantity":0.1}' \
  https://api.example.com/api/v1/orders
```

---

## 🔐 Security

- All API requests must include a valid API key
- Rate limiting is enforced per API key
- Input validation on all endpoints
- CORS configuration for authorized origins
- Request logging for audit trails

---

## 📄 License

MIT License - see LICENSE file for details

---

## 🆘 Support

- Documentation: [docs.example.com](https://docs.example.com)
- Issues: [github.com/example/market-ai/issues](https://github.com/example/market-ai/issues)
- Email: support@example.com

---

<p align="center">Built with ❤️ for the trading community</p>
