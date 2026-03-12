# Market Trend AI - Realtime Market Simulation System

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.6.3-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-Express-green" alt="Node.js">
  <img src="https://img.shields.io/badge/React-18.3-red" alt="React">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
  <img src="https://img.shields.io/badge/Version-1.0.0-orange" alt="Version">
</p>

Market Trend AI is a comprehensive realtime market AI API simulation system that operates independently without external AI connections but demonstrates self-intelligent capabilities through sophisticated algorithms and data processing. Features a complete modular architecture with market data simulation, technical analysis, sentiment analysis, predictive analytics, portfolio management, and more.

## ✨ Key Features

### Core API Capabilities
- **Advanced Price Simulation** - Uses Geometric Brownian Motion, Mean Reversion, and Volatility Clustering
- **Technical Analysis** - 10+ indicators including SMA, EMA, RSI, MACD, Bollinger Bands, ATR, Stochastic
- **Sentiment Analysis** - Multi-factor sentiment scoring based on price action, volume, and indicators
- **Predictive Analytics** - Linear regression, momentum, mean reversion, and ensemble prediction models
- **Portfolio Management** - Full trading simulation with orders, positions, and P&L tracking
- **Real-time Order Book** - Simulated order book with bid/ask levels

### System Features
- **Multiple Asset Types** - Stocks, Forex, and Cryptocurrencies
- **Market Simulation Modes** - Realistic, volatile, stable, bull, bear, random
- **WebSocket Streaming** - Real-time price updates
- **Webhook Notifications** - Event-driven updates
- **Rate Limiting** - Tiered access control
- **API Key Authentication** - Secure access management

## 🚀 Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at `http://localhost:5000`

## 📁 Project Structure

```
├── server/                    # Express API server
│   ├── api/                   # Market AI API modules
│   │   ├── config/           # Configuration management
│   │   ├── models/           # TypeScript interfaces
│   │   ├── services/         # Business logic
│   │   │   ├── priceSimulation.ts
│   │   │   ├── technicalIndicators.ts
│   │   │   ├── sentimentAnalysis.ts
│   │   │   ├── predictiveAnalytics.ts
│   │   │   ├── portfolioManagement.ts
│   │   │   └── authService.ts
│   │   └── README.md         # API documentation
│   ├── integrations/         # Market AI integrations
│   ├── db.ts                # Database configuration
│   ├── index.ts             # Server entry point
│   └── routes.ts            # Route definitions
├── client/                   # React frontend
│   ├── src/
│   │   ├── components/      # UI components
│   │   ├── pages/            # Page components
│   │   └── hooks/            # Custom React hooks
│   └── index.html
├── package.json
└── README.md
```

## 🛠️ Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js 5.x
- **Language**: TypeScript 5.6
- **Data**: In-memory storage (extensible to PostgreSQL)

### Frontend
- **Framework**: React 18
- **Styling**: Tailwind CSS
- **Charts**: Recharts
- **UI Components**: Radix UI

## 📖 API Overview

### Available Endpoints

| Category | Endpoint | Description |
|----------|----------|-------------|
| **Markets** | `GET /api/v1/markets/assets` | List all available assets |
| | `GET /api/v1/markets/ticker/:symbol` | Get real-time price |
| | `GET /api/v1/markets/candles/:symbol` | Historical OHLCV data |
| | `GET /api/v1/markets/orderbook/:symbol` | Order book data |
| **Indicators** | `GET /api/v1/indicators/:symbol` | Technical indicators |
| **Sentiment** | `GET /api/v1/sentiment/:symbol` | Market sentiment |
| | `GET /api/v1/sentiment/market` | Overall market sentiment |
| **Prediction** | `GET /api/v1/prediction/:symbol` | Price predictions |
| **Portfolio** | `GET /api/v1/portfolio` | User portfolios |
| | `POST /api/v1/portfolio` | Create portfolio |
| **Trading** | `POST /api/v1/orders` | Place order |
| | `GET /api/v1/orders` | List orders |
| **Simulation** | `POST /api/v1/simulation/mode` | Set market mode |
| **Auth** | `POST /api/v1/auth/keys` | Create API key |

### Authentication

All API requests require an API key:

```bash
curl -H "X-API-Key: your-api-key" \
  https://api.example.com/api/v1/markets/assets
```

### Demo API Key

A demo API key is automatically generated:
```
X-API-Key: mai_demo_key
```

## 🤖 AI Integration Architecture

This system is designed with **future AI integration** in mind. All AI-related endpoints include:

1. **Placeholder Endpoints** - Ready for external AI model connection
2. **Adapter Interface** - Clean interface for AI provider integration
3. **Extensible Models** - Prediction models can be swapped with ML models
4. **Modular Services** - Easy to inject external AI services

### Future AI Features (Placeholder)

```typescript
// These endpoints are ready for AI integration:
POST /api/v1/ai/analyze      # AI-powered market analysis
GET  /api/v1/ai/signals       # AI trading signals
POST /api/v1/ai/optimize     # AI portfolio optimization
POST /api/v1/ai/query        # Natural language queries
```

## 📊 Supported Assets

### Stocks (10)
AAPL, GOOGL, MSFT, AMZN, TSLA, META, NVDA, JPM, V, JNJ

### Forex (7)
EUR/USD, GBP/USD, USD/JPY, USD/CHF, AUD/USD, USD/CAD, NZD/USD

### Crypto (10)
BTC, ETH, BNB, XRP, ADA, SOL, DOGE, DOT, MATIC, LTC

## 🔧 Configuration

Environment variables can be configured in `.env`:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173
RATE_LIMIT_MAX=100
PRICE_UPDATE_INTERVAL=1000
```

## 🧪 Testing

```bash
# Run development server
npm run dev

# Run type checking
npm run check

# Build for production
npm run build
```

## 📈 Dashboard

The application includes a web-based dashboard for:
- Real-time market monitoring
- Portfolio performance tracking
- Technical indicator visualization
- Sentiment analysis display
- Trade history

Access the dashboard at `http://localhost:5000` when the server is running.

## 📱 Mobile Responsive

The client application is fully optimized for mobile devices:
- Touch-friendly interfaces with proper tap targets (44px minimum)
- Responsive layouts that work seamlessly on smartphones and tablets
- Horizontal scroll containers with snap scrolling
- Optimized viewport settings for mobile browsers

## 🔐 Security Features

- API Key Authentication
- Rate Limiting per plan tier
- Input Validation
- CORS Configuration
- Request Logging
- Error Handling

## 📄 License

MIT License - See LICENSE file for details.

## 🆘 Support

For issues and questions:
- Open an issue on GitHub
- Check the API documentation in `server/api/README.md`

---

<p align="center">
  Built with ❤️ for algorithmic trading enthusiasts
</p>
