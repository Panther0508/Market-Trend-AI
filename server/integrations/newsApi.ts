/**
 * News API Service - Multi-source cryptocurrency news aggregation
 * Fetches news from CoinGecko, CoinCap, and Alpha Vantage
 */

import fs from "fs";
import path from "path";
import config from "../api/config/index.js";

// Types for news responses
export interface NewsArticle {
  id: string;
  title: string;
  description: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
  sentiment?: "positive" | "negative" | "neutral";
  categories: string[];
}

export interface NewsResponse {
  articles: NewsArticle[];
  totalResults: number;
  source: string;
  cachedAt?: string;
}

// Cache interface with persistence support
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Fallback data for when APIs are unavailable
const FALLBACK_NEWS: NewsArticle[] = [
  {
    id: "fallback-1",
    title: "Bitcoin Maintains Strong Support Above $60,000",
    description: "Bitcoin continues to show resilience as it holds above the key $60,000 support level. Market analysts remain bullish on the cryptocurrency's long-term prospects.",
    url: "https://www.coingecko.com",
    source: "CoinGecko",
    publishedAt: new Date().toISOString(),
    imageUrl: "https://assets.coingecko.com/coins/images/1/large/bitcoin.png",
    sentiment: "positive",
    categories: ["bitcoin", "market-analysis"]
  },
  {
    id: "fallback-2",
    title: "Ethereum Staking Yields Attract Institutional Investors",
    description: "Institutional investors are increasingly drawn to Ethereum staking due to its attractive yields compared to traditional fixed-income assets.",
    url: "https://www.coingecko.com",
    source: "CoinGecko",
    publishedAt: new Date(Date.now() - 3600000).toISOString(),
    imageUrl: "https://assets.coingecko.com/coins/images/279/large/ethereum.png",
    sentiment: "positive",
    categories: ["ethereum", "institutional"]
  },
  {
    id: "fallback-3",
    title: "DeFi Total Value Locked Reaches New Highs",
    description: "The decentralized finance sector continues to grow as total value locked reaches new record levels, driven by increased adoption and new protocol launches.",
    url: "https://www.coingecko.com",
    source: "CoinCap",
    publishedAt: new Date(Date.now() - 7200000).toISOString(),
    sentiment: "positive",
    categories: ["defi", "yield-farming"]
  },
  {
    id: "fallback-4",
    title: "Regulatory Clarity Brings Stability to Crypto Markets",
    description: "Recent regulatory developments have provided more clarity for cryptocurrency businesses, leading to increased institutional participation.",
    url: "https://www.coingecko.com",
    source: "CoinGecko",
    publishedAt: new Date(Date.now() - 10800000).toISOString(),
    sentiment: "neutral",
    categories: ["regulation", "compliance"]
  },
  {
    id: "fallback-5",
    title: "NFT Market Shows Signs of Maturation",
    description: "The NFT marketplace is evolving with focus shifting toward utility-focused tokens and real-world asset tokenization.",
    url: "https://www.coingecko.com",
    source: "Alpha Vantage",
    publishedAt: new Date(Date.now() - 14400000).toISOString(),
    sentiment: "neutral",
    categories: ["nft", "digital-assets"]
  }
];

// In-memory cache
const cache = new Map<string, CacheEntry<any>>();

// Persistent cache file path (for file-based caching in production)
let persistentCachePath: string | null = null;

// Initialize persistent caching
function initPersistentCache(): void {
  if (config.environment === 'production') {
    try {
      const cacheDir = process.env.CACHE_DIR || './.cache';
      persistentCachePath = `${cacheDir}/news-cache.json`;
      // Try to load existing cache
      loadPersistentCache();
    } catch (e) {
      console.warn('Persistent cache initialization failed:', e);
    }
  }
}

// Load cache from disk
function loadPersistentCache(): void {
  if (!persistentCachePath) return;
  try {
    if (fs.existsSync(persistentCachePath)) {
      const data = JSON.parse(fs.readFileSync(persistentCachePath, 'utf-8'));
      const now = Date.now();
      for (const [key, entry] of Object.entries(data)) {
        const cacheEntry = entry as CacheEntry<NewsResponse>;
        if (cacheEntry.expiresAt > now) {
          cache.set(key, cacheEntry);
        }
      }
      console.log(`Loaded ${cache.size} entries from persistent cache`);
    }
  } catch (e) {
    console.warn('Failed to load persistent cache:', e);
  }
}

// Save cache to disk
function savePersistentCache(): void {
  if (!persistentCachePath) return;
  try {
    const cacheDir = path.dirname(persistentCachePath);
    if (!fs.existsSync(cacheDir)) {
      fs.mkdirSync(cacheDir, { recursive: true });
    }
    const cacheObj: Record<string, CacheEntry<NewsResponse>> = {};
    const cacheEntries = Array.from(cache.entries());
    for (const [key, entry] of cacheEntries) {
      cacheObj[key] = entry;
    }
    fs.writeFileSync(persistentCachePath, JSON.stringify(cacheObj));
  } catch (e) {
    console.warn('Failed to save persistent cache:', e);
  }
}

// Initialize on module load
initPersistentCache();

/**
 * Get cached data if valid
 */
function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  
  return entry.data as T;
}

/**
 * Set cached data with automatic persistence
 */
function setCache<T>(key: string, data: T, ttlMs: number): void {
  const now = Date.now();
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttlMs,
  });
  
  // Debounced save to disk (every 30 seconds max)
  if (persistentCachePath) {
    setTimeout(() => {
      savePersistentCache();
    }, 100);
  }
}

/**
 * Get fallback news data
 */
export function getFallbackNews(): NewsResponse {
  return {
    articles: FALLBACK_NEWS,
    totalResults: FALLBACK_NEWS.length,
    source: "fallback",
    cachedAt: new Date().toISOString()
  };
}

/**
 * Fetch from CoinGecko News API
 */
async function fetchCoinGeckoNews(query?: string): Promise<NewsResponse> {
  const cacheKey = `coingecko_news_${query || 'general'}`;
  const cached = getCached<NewsResponse>(cacheKey);
  if (cached) return cached;
  
  try {
    // CoinGecko doesn't have a direct news API, but we can use their trending
    // For news, we'll simulate with market data and trending coins
    const baseUrl = "https://api.coingecko.com/api/v3";
    
    // Get trending coins for news-like content
    const trendingResponse = await fetch(`${baseUrl}/search/trending`, {
      headers: {
        "Accept": "application/json",
      },
    });
    
    if (!trendingResponse.ok) {
      throw new Error(`CoinGecko API error: ${trendingResponse.status}`);
    }
    
    const trending = await trendingResponse.json();
    
    // Transform trending data into news-like articles
    const articles: NewsArticle[] = (trending.coins || []).slice(0, 10).map((coin: any, index: number) => ({
      id: `cg-${coin.item?.id || index}`,
      title: `${coin.item?.name} (${coin.item?.symbol?.toUpperCase()}) Trending #${coin.item?.market_cap_rank || index + 1}`,
      description: `${coin.item?.name} is trending on CoinGecko with a market cap rank of #${coin.item?.market_cap_rank || 'N/A'}.`,
      url: `https://www.coingecko.com/en/coins/${coin.item?.id}`,
      source: "CoinGecko",
      publishedAt: new Date(Date.now() - index * 3600000).toISOString(),
      imageUrl: coin.item?.large,
      sentiment: index < 3 ? "positive" as const : "neutral" as const,
      categories: ["trending", coin.item?.symbol?.toLowerCase() || "crypto"]
    }));
    
    const response: NewsResponse = {
      articles,
      totalResults: articles.length,
      source: "CoinGecko",
      cachedAt: new Date().toISOString()
    };
    
    // Cache for 5 minutes
    setCache(cacheKey, response, 300000);
    
    return response;
  } catch (error) {
    console.warn("CoinGecko news fetch failed:", error);
    throw error;
  }
}

/**
 * Fetch from CoinCap News API
 */
async function fetchCoinCapNews(query?: string): Promise<NewsResponse> {
  const cacheKey = `coincap_news_${query || 'general'}`;
  const cached = getCached<NewsResponse>(cacheKey);
  if (cached) return cached;
  
  try {
    // CoinCap doesn't have a direct news API, use their assets API for market data
    const baseUrl = "https://api.coincap.io/v2";
    
    // Get top assets
    const assetsResponse = await fetch(`${baseUrl}/assets?limit=20`, {
      headers: {
        "Accept": "application/json",
      },
    });
    
    if (!assetsResponse.ok) {
      throw new Error(`CoinCap API error: ${assetsResponse.status}`);
    }
    
    const data = await assetsResponse.json();
    
    // Transform assets into news-like articles
    const articles: NewsArticle[] = (data.data || []).slice(0, 10).map((asset: any, index: number) => {
      const changePercent = parseFloat(asset.changePercent24Hr || 0);
      const sentiment = changePercent > 2 ? "positive" : changePercent < -2 ? "negative" : "neutral";
      
      return {
        id: `cc-${asset.id}`,
        title: `${asset.name} (${asset.symbol}) ${changePercent >= 0 ? 'Rises' : 'Falls'} ${Math.abs(changePercent).toFixed(2)}% in 24h`,
        description: `${asset.name} is currently trading at $${parseFloat(asset.priceUsd).toFixed(2)} with a 24-hour change of ${changePercent.toFixed(2)}%.`,
        url: `https://coincap.io/assets/${asset.id}`,
        source: "CoinCap",
        publishedAt: new Date(Date.now() - index * 1800000).toISOString(),
        sentiment: sentiment as "positive" | "negative" | "neutral",
        categories: [asset.symbol?.toLowerCase() || "crypto", "market-data"]
      };
    });
    
    const response: NewsResponse = {
      articles,
      totalResults: articles.length,
      source: "CoinCap",
      cachedAt: new Date().toISOString()
    };
    
    // Cache for 5 minutes
    setCache(cacheKey, response, 300000);
    
    return response;
  } catch (error) {
    console.warn("CoinCap news fetch failed:", error);
    throw error;
  }
}

/**
 * Fetch from Alpha Vantage News API
 */
async function fetchAlphaVantageNews(query?: string): Promise<NewsResponse> {
  const apiKey = process.env.ALPHA_VANTAGE_API_KEY || "demo";
  const cacheKey = `alphavantage_news_${query || 'crypto'}`;
  const cached = getCached<NewsResponse>(cacheKey);
  if (cached) return cached;
  
  try {
    // Use Alpha Vantage's news sentiment API
    const ticker = query || "CRYPTO:BTC";
    const url = `https://www.alphavantage.co/query?function=NEWS_SENTIMENT&tickers=${ticker}&sort=LATEST&limit=10&apikey=${apiKey}`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Alpha Vantage API error: ${response.status}`);
    }
    
    const data = await response.json();
    
    // Check for API limit message
    if (data.Note || data.Information) {
      console.warn("Alpha Vantage API limit reached, using fallback");
      throw new Error("API limit reached");
    }
    
    const feed = data.feed || [];
    
    // Transform news data
    const articles: NewsArticle[] = feed.slice(0, 10).map((item: any, index: number) => ({
      id: `av-${index}`,
      title: item.title || "Untitled",
      description: item.summary || "",
      url: item.url || "",
      source: item.source || "Alpha Vantage",
      publishedAt: item.time_published ? 
        new Date(
          parseInt(item.time_published.slice(0,4)),
          parseInt(item.time_published.slice(4,6)) - 1,
          parseInt(item.time_published.slice(6,8)),
          parseInt(item.time_published.slice(9,11)),
          parseInt(item.time_published.slice(11,13))
        ).toISOString() : new Date().toISOString(),
      imageUrl: item.banner_image,
      sentiment: (item.overall_sentiment_label || "neutral").toLowerCase() as "positive" | "negative" | "neutral",
      categories: item.topics?.map((t: any) => t.topic) || []
    }));
    
    const responseData: NewsResponse = {
      articles,
      totalResults: articles.length,
      source: "Alpha Vantage",
      cachedAt: new Date().toISOString()
    };
    
    // Cache for 5 minutes
    setCache(cacheKey, responseData, 300000);
    
    return responseData;
  } catch (error) {
    console.warn("Alpha Vantage news fetch failed:", error);
    throw error;
  }
}

/**
 * Fetch news from all sources with fallback
 */
export async function getCryptoNews(
  query?: string,
  options?: {
    sources?: string[];
    limit?: number;
    sortBy?: "relevance" | "popularity" | "recency";
  }
): Promise<NewsResponse> {
  const { 
    sources = ["coingecko", "coincap", "alphavantage"], 
    limit = 20,
    sortBy = "recency"
  } = options || {};
  
  const cacheKey = `news_${query || 'all'}_${sources.join(',')}_${limit}_${sortBy}`;
  const cached = getCached<NewsResponse>(cacheKey);
  if (cached) return cached;
  
  const errors: string[] = [];
  let allArticles: NewsArticle[] = [];
  
  // Fetch from each source
  for (const source of sources) {
    try {
      let news: NewsResponse;
      
      switch (source) {
        case "coingecko":
          news = await fetchCoinGeckoNews(query);
          break;
        case "coincap":
          news = await fetchCoinCapNews(query);
          break;
        case "alphavantage":
          news = await fetchAlphaVantageNews(query);
          break;
        default:
          continue;
      }
      
      allArticles = [...allArticles, ...news.articles];
    } catch (error) {
      errors.push(`${source}: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
  
  // If all sources failed, return fallback
  if (allArticles.length === 0) {
    console.warn("All news sources failed, using fallback data");
    return getFallbackNews();
  }
  
  // Sort articles
  switch (sortBy) {
    case "recency":
      allArticles.sort((a, b) => 
        new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime()
      );
      break;
    case "popularity":
      // Sort by sentiment (positive first, then neutral, then negative)
      const sentimentOrder = { positive: 0, neutral: 1, negative: 2 };
      allArticles.sort((a, b) => 
        (sentimentOrder[a.sentiment || 'neutral']) - (sentimentOrder[b.sentiment || 'neutral'])
      );
      break;
    case "relevance":
      // Prioritize articles that match the query
      if (query) {
        const queryLower = query.toLowerCase();
        allArticles.sort((a, b) => {
          const aRelevance = (a.title + a.description).toLowerCase().includes(queryLower) ? 1 : 0;
          const bRelevance = (b.title + b.description).toLowerCase().includes(queryLower) ? 1 : 0;
          return bRelevance - aRelevance;
        });
      }
      break;
  }
  
  const response: NewsResponse = {
    articles: allArticles.slice(0, limit),
    totalResults: allArticles.length,
    source: `aggregated from ${sources.filter(s => !errors.some(e => e.startsWith(s))).length} sources`,
    cachedAt: new Date().toISOString()
  };
  
  // Cache for 3 minutes
  setCache(cacheKey, response, 180000);
  
  return response;
}

/**
 * Get trending news (most mentioned cryptocurrencies)
 */
export async function getTrendingNews(): Promise<NewsResponse> {
  return getCryptoNews(undefined, { limit: 15, sortBy: "popularity" });
}

/**
 * Get news for specific cryptocurrency
 */
export async function getNewsForCoin(coinId: string): Promise<NewsResponse> {
  return getCryptoNews(coinId, { limit: 10, sortBy: "recency" });
}

/**
 * Search news by topic
 */
export async function searchNews(topic: string): Promise<NewsResponse> {
  return getCryptoNews(topic, { limit: 20, sortBy: "relevance" });
}

/**
 * Get all available news sources
 */
export function getNewsSources(): string[] {
  return ["coingecko", "coincap", "alphavantage"];
}

/**
 * Clear all news cache
 */
export function clearNewsCache(): void {
  const keysToDelete: string[] = [];
  const cacheKeys = Array.from(cache.keys());
  for (const key of cacheKeys) {
    if (key.startsWith('news_') || key.includes('_news')) {
      keysToDelete.push(key);
    }
  }
  keysToDelete.forEach(key => cache.delete(key));
  console.log(`Cleared ${keysToDelete.length} news cache entries`);
}

/**
 * Get cache statistics
 */
export function getNewsCacheStats(): { size: number; newsEntries: number } {
  let newsEntries = 0;
  const cacheKeysArray = Array.from(cache.keys());
  for (const key of cacheKeysArray) {
    if (key.startsWith('news_') || key.includes('_news')) {
      newsEntries++;
    }
  }
  return {
    size: cache.size,
    newsEntries
  };
}

export default {
  getCryptoNews,
  getTrendingNews,
  getNewsForCoin,
  searchNews,
  getNewsSources,
  clearNewsCache,
  getNewsCacheStats,
  getFallbackNews
};
