# Market Trend AI - Render Deployment Guide

This document provides comprehensive instructions for deploying the Market Trend AI application with cryptocurrency news integration on Render.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Variables](#environment-variables)
3. [Deployment Steps](#deployment-steps)
4. [Crypto API Features](#crypto-api-features)
5. [News API Features](#news-api-features)
6. [Troubleshooting](#troubleshooting)
7. [Monitoring](#monitoring)

---

## Prerequisites

- GitHub account with access to the repository
- Render account (free tier works)
- CoinGecko API key (optional, for higher rate limits)
- Alpha Vantage API key (optional, for news)

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
| `ALPHA_VANTAGE_API_KEY` | Stock market data & news                 | [alphavantage.co](https://www.alphavantage.co/support/#api-key) |
| `HUGGINGFACE_API_KEY`   | AI/ML model access                       | [huggingface.co](https://huggingface.co/settings/tokens)        |
| `OPENAI_API_KEY`        | OpenAI GPT models                        | [platform.openai.com](https://platform.openai.com/api-keys)     |

### Cache Settings

| Variable    | Description                   | Default  |
| ----------- | ----------------------------- | -------- |
| `CACHE_TTL` | Cache time-to-live in seconds | 300      |
| `CACHE_DIR` | Directory for cache files     | ./.cache |

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

---

## News API Features

### Implemented Endpoints

| Endpoint                    | Description                      |
| --------------------------- | -------------------------------- |
| `/api/v1/news`              | Get cryptocurrency news          |
| `/api/v1/news/trending`     | Get trending news                |
| `/api/v1/news/search`       | Search news by topic             |
| `/api/v1/news/coin/:coinId` | News for specific cryptocurrency |
| `/api/v1/news/sources`      | Get available news sources       |
| `/api/v1/news/cache/stats`  | Get cache statistics             |
| `/api/v1/news/cache/clear`  | Clear news cache (admin)         |

### Query Parameters

| Parameter | Description                                        | Default |
| --------- | -------------------------------------------------- | ------- |
| `q`       | Search query                                       | -       |
| `limit`   | Number of results (max 50)                         | 20      |
| `sortBy`  | Sort by relevance/popularity/recency               | recency |
| `sources` | Filter by sources (coingecko,coincap,alphavantage) | all     |

### Features

- **Multi-source Aggregation**: News from CoinGecko, CoinCap, and Alpha Vantage
- **Sentiment Analysis**: Each article includes sentiment (positive/negative/neutral)
- **Sorting & Filtering**: Sort by relevance, popularity, or recency
- **Fallback Data**: Preloaded fallback news when APIs are unavailable
- **Persistent Caching**: File-based cache persists across restarts

---

## API Response Examples

### Search Cryptocurrencies

```bash
curl "https://your-app.onrender.com/api/v1/crypto/search?q=bitcoin"
```

### Get News

```bash
curl "https://your-app.onrender.com/api/v1/news?sortBy=popularity"
```

### Search News

```bash
curl "https://your-app.onrender.com/api/v1/news/search?q=bitcoin&sortBy=relevance"
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

Access cache stats at:

- Crypto: `/api/v1/crypto/cache/stats`
- News: `/api/v1/news/cache/stats`

---

## Performance Tips

1. **Use Caching**: The API has built-in caching - don't disable it
2. **Rate Limiting**: Respect API limits to avoid blocking
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
