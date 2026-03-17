# Market Trend AI - Render Deployment Guide

## Manual Deployment Without render.yaml

### Step 1: Deploy Python Service First

1. Go to Render Dashboard
2. Click New + then Web Service
3. Connect your GitHub repository
4. Configure:
   - Name: market-trend-ai-python
   - Environment: Python
   - Region: Oregon (or closest to you)
   - Build Command: pip install -r python/requirements.txt
   - Start Command: python python/server.py

5. Add Environment Variables:

| Key                   | Value                                    |
| --------------------- | ---------------------------------------- |
| PORT                  | 5000                                     |
| FLASK_ENV             | production                               |
| COINGECKO_API_KEY     | (your key from CoinGecko - optional)     |
| ALPHA_VANTAGE_API_KEY | (your key from Alpha Vantage - optional) |
| HUGGINGFACE_API_KEY   | (your key from HuggingFace - optional)   |

6. Click Create Web Service

### Step 2: Deploy Node.js Service

1. After Python service is running, go to Render Dashboard
2. Click New + then Web Service
3. Connect your GitHub repository
4. Configure:
   - Name: market-trend-ai
   - Environment: Node
   - Region: Oregon
   - Build Command: npm install && npx tsx script/build.ts
   - Start Command: npm run start

5. Add Environment Variables:

| Key                | Value                                       |
| ------------------ | ------------------------------------------- |
| NODE_ENV           | production                                  |
| PORT               | 10000                                       |
| NODE_VERSION       | 20                                          |
| PYTHON_BACKEND_URL | https://market-trend-ai-python.onrender.com |

6. Click Create Web Service

### Step 3: Connect Services

After both services are deployed:

1. Go to your Node.js service (market-trend-ai) settings
2. Find PYTHON_BACKEND_URL
3. Set it to: https://market-trend-ai-python.onrender.com
4. Redeploy the service

### Environment Variables Reference

#### Required for Node.js Service:

- NODE_ENV = production
- PORT = 10000
- NODE_VERSION = 20

#### Required After Python Deployment:

- PYTHON_BACKEND_URL = https://market-trend-ai-python.onrender.com

#### Optional API Keys (get free keys from respective websites):

| Variable              | Where to Get          |
| --------------------- | --------------------- |
| COINGECKO_API_KEY     | CoinGecko website     |
| ALPHA_VANTAGE_API_KEY | Alpha Vantage website |
| HUGGINGFACE_API_KEY   | HuggingFace website   |

#### Optional Cache Settings:

| Variable  | Default  | Description           |
| --------- | -------- | --------------------- |
| CACHE_TTL | 300      | Cache time in seconds |
| CACHE_DIR | ./.cache | Cache directory       |

---

### Getting Your Free API Keys

1. **CoinGecko**: Sign up at CoinGecko, go to Dashboard, API
2. **Alpha Vantage**: Sign up at Alpha Vantage, request free API key
3. **HuggingFace**: Sign up at HuggingFace, go to Settings, Access Tokens

---

### After Deployment

Your services will be live at:

- Node.js: https://market-trend-ai.onrender.com
- Python: https://market-trend-ai-python.onrender.com

### Keeping Services From Sleeping

Free tier services sleep after 15 minutes of inactivity. To prevent this:

1. Use a free uptime monitor like UptimeRobot
2. Set it to ping your service every 5-10 minutes
3. Endpoint to ping: https://market-trend-ai.onrender.com/health
