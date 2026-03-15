# Market Trend AI - Render Deployment Guide

This document provides comprehensive instructions for deploying the Market Trend AI application with cryptocurrency search integration on Render.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Deployment Steps](#deployment-steps)
4. [Crypto API Features](#crypto-api-features)
5. [Troubleshooting](#troubleshooting)
6. [Monitoring](#monitoring)

---

## Prerequisites

- GitHub account with access to the repository
- Render account (free tier works)
- CoinGecko API key (optional, for higher rate limits)

---

## Environment Variables

### Required Variables

| Variable             | Description              | Default                     | Required               |
| -------------------- | ------------------------ | --------------------------- | ---------------------- |
| `PORT`               | Port for the web service | 10000 (Node), 5000 (Python) | Yes                    |
| `NODE_ENV`           | Environment mode         | production                  | Yes                    |
| `PYTHON_BACKEND_URL` | URL of Python service    | -                           | Yes (after deployment) |

### Security Variables (Generate Strong Values)

```bash
# Generate secure secrets
openssl rand -base64 32
```

| Variable         | Description               | Example                    |
| ---------------- | ------------------------- | -------------------------- |
| `SESSION_SECRET` | Session encryption secret | `your-session-secret-here` |
| `JWT_SECRET`     | JWT token secret          | `your-jwt-secret-here`     |

### Optional: API Keys

| Variable                | Description                              | Where to Get                                                    |
| ----------------------- | ---------------------------------------- | --------------------------------------------------------------- |
| `COINGECKO_API_KEY`     | CoinGecko Pro API for higher rate limits | [coingecko.com](https://www.coingecko.com/en/api)               |
| `ALPHA_VANTAGE_API_KEY` | Stock market data                        | [alphavantage.co](https://www.alphavantage.co/support/#api-key) |
| `HUGGINGFACE_API_KEY`   | AI/ML model access                       | [huggingface.co](https://huggingface.co/settings/tokens)        |
| `OPENAI_API_KEY`        | OpenAI GPT models                        | [platform.openai.com](https://platform.openai.com/api-keys)     |

### Crypto Search Specific Variables

| Variable            | Description                   | Default |
| ------------------- | ----------------------------- | ------- |
| `CACHE_TTL`         | Cache time-to-live in seconds | 300     |
| `RATE_LIMIT_MAX`    | Max requests per window       | 100     |
| `RATE_LIMIT_WINDOW` | Rate limit window in ms       | 60000   |

---

## Deployment Steps

### Option 1: Deploy via GitHub (Recommended)

1. **Connect Repository**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New" → "Web Service"
   - Connect your GitHub repository
   - Select the branch (usually `main`)

2. **Deploy Node.js Service**
   - Name: `market-trend-ai`
   - Environment: `Node`
   - Build Command: `npm install && npm run build`
   - Start Command: `npm run start`
   - Add all environment variables from the table above

3. **Deploy Python Service**
   - Name: `market-trend-ai-python`
   - Environment: `Python`
   - Build Command: `pip install -r python/requirements.txt`
   - Start Command: `cd python && python server.py`
   - Add Python-specific environment variables

4. **Configure Database** (Optional)
   - Render automatically creates PostgreSQL if configured
   - Update `DB_TYPE` to `postgres` if using managed database

5. **Update Python Backend URL**
   - After deploying Node.js service, copy the Python service URL
   - Add it to Node.js service's `PYTHON_BACKEND_URL` environment variable

### Option 2: Deploy via render.yaml

The repository includes `render.yaml` for automated deployment:

```bash
# Install Render CLI
npm install -g render-cli

# Deploy using blueprint
render blueprint apply
```

---

## Crypto API Features

### Implemented Endpoints

| Endpoint                         | Description                            |
| -------------------------------- | -------------------------------------- |
| `/api/v1/crypto/search`          | Search cryptocurrencies by name/symbol |
| `/api/v1/crypto/top`             | Get top cryptocurrencies by market cap |
| `/api/v1/crypto/:coinId`         | Get detailed coin information          |
| `/api/v1/crypto/:coinId/history` | Get historical price data              |
| `/api/v1/crypto/global`          | Get global market data                 |
| `/api/v1/crypto/trending`        | Get trending coins                     |
| `/api/v1/crypto/:coinId/links`   | Get open-source project links          |

### Rate Limiting

- **Free Tier**: 10-30 requests/minute (CoinGecko)
- **Pro API**: Higher limits with API key
- Built-in rate limiter in the crypto API service

### Caching

- **Short-term cache**: 60 seconds (price data)
- **Long-term cache**: 5 minutes (coin details, trending)
- Automatic cache invalidation based on data freshness

### Open-Source Links

The crypto search includes links to:

- Project websites
- GitHub repositories
- Documentation
- CoinGecko & CoinMarketCap pages

---

## API Response Examples

### Search Cryptocurrencies

```bash
curl "https://your-app.onrender.com/api/v1/crypto/search?q=bitcoin"
```

Response:

```json
{
  "coins": [
    {
      "id": "bitcoin",
      "name": "Bitcoin",
      "symbol": "btc",
      "market_cap_rank": 1,
      "thumb": "https://assets.coingecko.com/...",
      "large": "https://assets.coingecko.com/..."
    }
  ],
  "trending": [...],
  "globalData": {...},
  "totalResults": 1
}
```

### Get Coin Details

```bash
curl "https://your-app.onrender.com/api/v1/crypto/bitcoin"
```

Response:

```json
{
  "id": "bitcoin",
  "symbol": "btc",
  "name": "Bitcoin",
  "currentPrice": 50000.0,
  "marketCap": 1000000000000,
  "marketCapRank": 1,
  "priceChangePercentage24h": 2.5,
  "links": {
    "github": "https://github.com/bitcoin/bitcoin",
    "website": "https://bitcoin.org"
  }
}
```

### Get Historical Data

```bash
curl "https://your-app.onrender.com/api/v1/crypto/bitcoin/history?days=7"
```

Response:

```json
{
  "coinId": "bitcoin",
  "prices": [
    { "timestamp": 1704067200000, "price": 45000 },
    ...
  ],
  "marketCaps": [...],
  "volumes": [...]
}
```

---

## Troubleshooting

### Common Issues

1. **Rate Limit Errors**
   - Solution: Add CoinGecko API key or wait for rate limit reset

2. **CORS Errors**
   - Ensure `CORS_ORIGIN` matches your Render domain exactly

3. **Python Backend Connection**
   - Verify `PYTHON_BACKEND_URL` is correctly set
   - Check that Python service is healthy at `/health`

4. **Build Failures**
   - Ensure Node.js version is 20.x in render.yaml
   - Check that all dependencies are in package.json

### Health Checks

Both services expose `/health` endpoints:

- Node.js: `https://market-trend-ai.onrender.com/health`
- Python: `https://market-trend-ai-python.onrender.com/health`

---

## Monitoring

### Logs

View logs in Render Dashboard:

1. Select your service
2. Click "Logs" tab
3. Use filtering to find specific issues

### Cache Statistics

Access cache stats at: `/api/v1/crypto/cache/stats`

### API Testing

Use the Search page in the UI:

1. Navigate to `/search`
2. Switch to "Cryptocurrency" tab
3. Search for any coin to see results

---

## Performance Tips

1. **Use Caching**: The crypto API has built-in caching - don't disable it
2. **Rate Limiting**: Respect CoinGecko limits to avoid IP blocking
3. **Database**: For production, use PostgreSQL instead of in-memory storage
4. **Static Assets**: Configure CDN for static files in production

---

## Cost Estimation

| Service            | Type     | Free Tier      | Paid Tier  |
| ------------------ | -------- | -------------- | ---------- |
| Render Web Service | Node.js  | $0/month       | $7+/month  |
| Render Web Service | Python   | $0/month       | $7+/month  |
| Render PostgreSQL  | Database | $0/month       | $7+/month  |
| CoinGecko API      | Data     | Free (limited) | $50+/month |

**Total for hobby**: ~$0/month
**Total for production**: ~$25+/month

---

## Security Best Practices

1. **Never commit secrets** - Use environment variables
2. **Rotate secrets** - Change JWT_SECRET periodically
3. **HTTPS only** - Render provides this by default
4. **Rate limiting** - Already implemented in crypto API
5. **Input validation** - Zod schemas validate all API inputs
