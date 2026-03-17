# Market Trend AI - Cryptocurrency News & Analytics Platform

<p align="center">
  <img src="https://img.shields.io/badge/TypeScript-5.6.3-blue" alt="TypeScript">
  <img src="https://img.shields.io/badge/Node.js-Express-green" alt="Node.js">
  <img src="https://img.shields.io/badge/React-18.3-red" alt="React">
  <img src="https://img.shields.io/badge/License-MIT-yellow" alt="License">
  <img src="https://img.shields.io/badge/Version-1.1.0-orange" alt="Version">
</p>

Market Trend AI is a comprehensive cryptocurrency news aggregation and market analytics platform featuring real-time data from multiple sources, AI-powered sentiment analysis, and intelligent recommendations.

## ✨ Key Features

### Cryptocurrency Data

- **Multi-source News Aggregation** - CoinGecko, CoinCap, and Alpha Vantage integration
- **Real-time Price Data** - Live cryptocurrency prices and market data
- **Trending Coins** - Identify and track trending cryptocurrencies
- **Search & Filter** - Search by cryptocurrency name, symbol, or topic

### AI Capabilities

- **Sentiment Analysis** - Analyze market sentiment from news and social media
- **Content Summarization** - AI-powered news article summaries
- **Recommendations** - Intelligent cryptocurrency recommendations based on trends

### UI/UX Features

- **Loading Skeletons** - Smooth loading states with placeholder components
- **Responsive Design** - Mobile-first design with touch optimization
- **Dark Theme** - Luxury gold and obsidian dark theme

### Error Handling & Caching

- **Robust Error Handling** - Graceful API failure handling
- **Fallback Data** - Preloaded fallback data when APIs unavailable
- **Persistent Caching** - File-based cache with automatic persistence

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
│   │   └── crypto.ts         # Cryptocurrency API routes
│   │   └── news.ts           # News API routes
│   ├── integrations/          # Market AI integrations
│   │   ├── cryptoApi.ts      # CoinGecko/CoinCap integration
│   │   └── newsApi.ts        # News aggregation service
│   ├── db.ts                 # Database configuration
│   ├── index.ts              # Server entry point
│   └── routes.ts             # Route definitions
├── client/                    # React frontend
│   ├── src/
│   │   ├── components/       # UI components
│   │   │   ├── news/         # News components
│   │   │   │   ├── NewsList.tsx
│   │   │   │   └── NewsSkeleton.tsx
│   │   │   └── search/       # Search components
│   │   ├── pages/            # Page components
│   │   │   ├── News.tsx      # News page
│   │   │   └── Search.tsx    # Search page
│   │   └── hooks/            # Custom React hooks
│   │       ├── use-crypto.ts # Crypto data hooks
│   │       └── use-news.ts   # News data hooks
│   └── index.html
├── python/                    # Python AI backend
├── render.yaml               # Render deployment config
└── package.json
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

### Data Sources

- **CoinGecko** - Cryptocurrency prices and market data
- **CoinCap** - Real-time crypto asset data
- **Alpha Vantage** - Market news and sentiment

## 📖 API Overview

### Cryptocurrency Endpoints

| Endpoint                              | Description              |
| ------------------------------------- | ------------------------ |
| `GET /api/v1/crypto/search?q=bitcoin` | Search cryptocurrencies  |
| `GET /api/v1/crypto/top`              | Get top cryptocurrencies |
| `GET /api/v1/crypto/:coinId`          | Get coin details         |
| `GET /api/v1/crypto/:coinId/history`  | Historical price data    |
| `GET /api/v1/crypto/global`           | Global market data       |
| `GET /api/v1/crypto/trending`         | Trending coins           |

### News Endpoints

| Endpoint                            | Description             |
| ----------------------------------- | ----------------------- |
| `GET /api/v1/news`                  | Get cryptocurrency news |
| `GET /api/v1/news/trending`         | Get trending news       |
| `GET /api/v1/news/search?q=bitcoin` | Search news             |
| `GET /api/v1/news/coin/:coinId`     | News for specific coin  |

### Query Parameters

| Parameter | Description                          | Default |
| --------- | ------------------------------------ | ------- |
| `q`       | Search query                         | -       |
| `limit`   | Number of results                    | 20      |
| `sortBy`  | Sort by relevance/popularity/recency | recency |
| `sources` | Filter by sources                    | all     |

## 🔧 Configuration

Environment variables can be configured in `.env`:

```env
PORT=5000
NODE_ENV=development
JWT_SECRET=your-secret-key
CORS_ORIGIN=http://localhost:5173

# API Keys (optional)
COINGECKO_API_KEY=your-key
ALPHA_VANTAGE_API_KEY=your-key
HUGGINGFACE_API_KEY=your-key
PYTHON_BACKEND_URL=http://localhost:5001
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

## 📱 Routes

| Route        | Description                |
| ------------ | -------------------------- |
| `/`          | Home page                  |
| `/dashboard` | Market dashboard           |
| `/search`    | Search (products & crypto) |
| `/news`      | Cryptocurrency news        |

## 🔐 Security Features

- API Key Authentication
- Rate Limiting per plan tier
- Input Validation
- CORS Configuration
- Request Logging
- Error Handling

## ☁️ Deployment

### Render Deployment

The application is configured for deployment on Render:

```bash
# Using render.yaml
render blueprint apply
```

See [RENDER_DEPLOYMENT.md](RENDER_DEPLOYMENT.md) for detailed deployment instructions.

## 📄 License

MIT License - See LICENSE file for details.

---

<p align="center">
  Built with ❤️ for cryptocurrency enthusiasts
</p>
