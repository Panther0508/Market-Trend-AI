/**
 * Crypto API Service - CoinGecko Integration
 * Fetches cryptocurrency data with caching and rate limiting compliance
 */

import config from "../api/config/index.js";

// Types for CoinGecko API responses
export interface CoinGeckoMarketCoin {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  fully_diluted_valuation: number | null;
  total_volume: number;
  high_24h: number;
  low_24h: number;
  price_change_24h: number;
  price_change_percentage_24h: number;
  market_cap_change_24h: number;
  market_cap_change_percentage_24h: number;
  circulating_supply: number;
  total_supply: number | null;
  max_supply: number | null;
  ath: number;
  ath_change_percentage: number;
  ath_date: string;
  atl: number;
  atl_change_percentage: number;
  atl_date: string;
  last_updated: string;
  sparkline_in_7d?: {
    price: number[];
  };
}

export interface CoinGeckoCoinDetail {
  id: string;
  symbol: string;
  name: string;
  description: {
    en: string;
  };
  image: {
    large: string;
    small: string;
    thumb: string;
  };
  market_data: {
    current_price: { [currency: string]: number };
    market_cap: { [currency: string]: number };
    total_volume: { [currency: string]: number };
    price_change_percentage_24h: number;
    price_change_percentage_7d: number;
    price_change_percentage_30d: number;
    ath: { [currency: string]: number };
    atl: { [currency: string]: number };
  };
  links: {
    homepage: string[];
    blockchain_site: string[];
    repos_url: {
      github: string[];
      bitbucket: string[];
    };
  };
  genesis_date: string | null;
  sentiment_votes_up: number;
  sentiment_votes_down: number;
  coingecko_rank: number;
  coingecko_score: number;
  developer_score: number;
  community_score: number;
  liquidity_score: number;
  public_interest_score: number;
}

export interface CoinGeckoHistoryPrice {
  prices: Array<[number, number]>;
  market_caps: Array<[number, number]>;
  total_volumes: Array<[number, number]>;
}

export interface CoinGeckoSearchResult {
  coins: Array<{
    id: string;
    name: string;
    symbol: string;
    market_cap_rank: number | null;
    thumb: string;
    large: string;
  }>;
  exchanges: Array<{
    id: string;
    name: string;
    market_type: string;
  }>;
  categories: Array<{
    id: string;
    name: string;
  }>;
}

// Cache interface
interface CacheEntry<T> {
  data: T;
  timestamp: number;
  expiresAt: number;
}

// Rate limiter interface
interface RateLimitConfig {
  maxRequests: number;
  windowMs: number;
  currentRequests: number;
  resetTime: number;
}

// Cache storage
const cache = new Map<string, CacheEntry<any>>();

// Rate limiting state
const rateLimiter: RateLimitConfig = {
  maxRequests: 10, // CoinGecko free tier: 10-30 calls/minute
  windowMs: 60000, // 1 minute window
  currentRequests: 0,
  resetTime: Date.now() + 60000,
};

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
 * Set cached data
 */
function setCache<T>(key: string, data: T, ttlMs: number): void {
  const now = Date.now();
  cache.set(key, {
    data,
    timestamp: now,
    expiresAt: now + ttlMs,
  });
}

/**
 * Check and update rate limit
 */
function checkRateLimit(): boolean {
  const now = Date.now();
  
  // Reset if window has passed
  if (now > rateLimiter.resetTime) {
    rateLimiter.currentRequests = 0;
    rateLimiter.resetTime = now + rateLimiter.windowMs;
  }
  
  // Check if we can make a request
  if (rateLimiter.currentRequests >= rateLimiter.maxRequests) {
    const waitTime = rateLimiter.resetTime - now;
    console.warn(`Rate limit reached. Wait ${waitTime}ms before next request.`);
    return false;
  }
  
  rateLimiter.currentRequests++;
  return true;
}

/**
 * Make API request with retry logic
 */
async function fetchWithRetry<T>(
  url: string,
  options: RequestInit = {},
  retries = 3,
  backoffMs = 1000
): Promise<T> {
  // Check rate limit first
  if (!checkRateLimit()) {
    const waitTime = rateLimiter.resetTime - Date.now();
    await new Promise(resolve => setTimeout(resolve, Math.min(waitTime, 5000)));
    if (!checkRateLimit()) {
      throw new Error("Rate limit exceeded. Please try again later.");
    }
  }
  
  let lastError: Error | null = null;
  
  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      const response = await fetch(url, {
        ...options,
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
          ...options.headers,
        },
      });
      
      if (!response.ok) {
        if (response.status === 429) {
          // Rate limited - wait and retry
          const retryAfter = parseInt(response.headers.get("Retry-After") || "60", 10);
          console.warn(`Rate limited by API. Waiting ${retryAfter}s...`);
          await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
          continue;
        }
        
        if (response.status >= 500) {
          throw new Error(`API error: ${response.status}`);
        }
        
        const errorText = await response.text();
        throw new Error(`API error: ${response.status} - ${errorText}`);
      }
      
      return await response.json() as T;
    } catch (error) {
      lastError = error as Error;
      console.warn(`Attempt ${attempt + 1} failed:`, error);
      
      if (attempt < retries - 1) {
        const delay = backoffMs * Math.pow(2, attempt);
        await new Promise(resolve => setTimeout(resolve, delay));
      }
    }
  }
  
  throw lastError || new Error("Failed to fetch data after retries");
}

// CoinGecko API Base URL
const COINGECKO_BASE_URL = "https://api.coingecko.com/api/v3";

/**
 * Get top cryptocurrencies by market cap
 */
export async function getTopCoins(
  currency = "usd",
  perPage = 100,
  page = 1,
  sparkline = true
): Promise<CoinGeckoMarketCoin[]> {
  const cacheKey = `top_coins_${currency}_${perPage}_${page}_${sparkline}`;
  const cached = getCached<CoinGeckoMarketCoin[]>(cacheKey);
  if (cached) return cached;
  
  const url = `${COINGECKO_BASE_URL}/coins/markets?vs_currency=${currency}&order=market_cap_desc&per_page=${perPage}&page=${page}&sparkline=${sparkline}&price_change_percentage=24h,7d,30d`;
  
  const data = await fetchWithRetry<CoinGeckoMarketCoin[]>(url);
  
  // Cache for 60 seconds (CoinGecko updates every 30-60 seconds)
  setCache(cacheKey, data, 60000);
  
  return data;
}

/**
 * Search for cryptocurrencies
 */
export async function searchCoins(query: string): Promise<CoinGeckoSearchResult> {
  const cacheKey = `search_${query.toLowerCase()}`;
  const cached = getCached<CoinGeckoSearchResult>(cacheKey);
  if (cached) return cached;
  
  const url = `${COINGECKO_BASE_URL}/search?query=${encodeURIComponent(query)}`;
  
  const data = await fetchWithRetry<CoinGeckoSearchResult>(url);
  
  // Cache for 5 minutes
  setCache(cacheKey, data, 300000);
  
  return data;
}

/**
 * Get detailed information about a specific coin
 */
export async function getCoinDetail(
  coinId: string,
  localization = false,
  tickers = false,
  marketData = true,
  communityData = false,
  developerData = false
): Promise<CoinGeckoCoinDetail> {
  const cacheKey = `coin_detail_${coinId}`;
  const cached = getCached<CoinGeckoCoinDetail>(cacheKey);
  if (cached) return cached;
  
  const url = `${COINGECKO_BASE_URL}/coins/${coinId}?localization=${localization}&tickers=${tickers}&market_data=${marketData}&community_data=${communityData}&developer_data=${developerData}`;
  
  const data = await fetchWithRetry<CoinGeckoCoinDetail>(url);
  
  // Cache for 5 minutes
  setCache(cacheKey, data, 300000);
  
  return data;
}

/**
 * Get historical price data
 */
export async function getHistoricalData(
  coinId: string,
  currency = "usd",
  days = 7
): Promise<CoinGeckoHistoryPrice> {
  const cacheKey = `history_${coinId}_${currency}_${days}`;
  const cached = getCached<CoinGeckoHistoryPrice>(cacheKey);
  if (cached) return cached;
  
  const url = `${COINGECKO_BASE_URL}/coins/${coinId}/market_chart?vs_currency=${currency}&days=${days}`;
  
  const data = await fetchWithRetry<CoinGeckoHistoryPrice>(url);
  
  // Cache based on time range (longer for longer periods)
  const ttl = days > 30 ? 3600000 : days > 7 ? 300000 : 60000;
  setCache(cacheKey, data, ttl);
  
  return data;
}

/**
 * Get global market data
 */
export async function getGlobalData(): Promise<{
  data: {
    active_cryptocurrencies: number;
    upcoming_icos: number;
    ongoing_icos: number;
    ended_icos: number;
    market_cap_percentage: { [key: string]: number };
    market_cap_change_percentage_24h_usd: number;
    total_market_cap: { [currency: string]: number };
    total_volume: { [currency: string]: number };
    btc_dominant: boolean;
  };
}> {
  const cacheKey = "global_data";
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;
  
  const url = `${COINGECKO_BASE_URL}/global`;
  
  const data = await fetchWithRetry<any>(url);
  
  // Cache for 60 seconds
  setCache(cacheKey, data, 60000);
  
  return data;
}

/**
 * Get trending coins (featured by CoinGecko)
 */
export async function getTrendingCoins(): Promise<any> {
  const cacheKey = "trending";
  const cached = getCached<any>(cacheKey);
  if (cached) return cached;
  
  const url = `${COINGECKO_BASE_URL}/search/trending`;
  
  const data = await fetchWithRetry<any>(url);
  
  // Cache for 5 minutes
  setCache(cacheKey, data, 300000);
  
  return data;
}

/**
 * Get open-source projects related to a cryptocurrency
 */
export async function getOpenSourceLinks(coinId: string): Promise<{
  github?: string;
  website?: string;
  documentation?: string;
  whitepaper?: string;
}> {
  const detail = await getCoinDetail(coinId, false, false, true, false, true);
  
  const links: {
    github?: string;
    website?: string;
    documentation?: string;
    whitepaper?: string;
  } = {
    website: detail.links?.homepage?.[0] || undefined,
    github: detail.links?.repos_url?.github?.[0] || undefined,
    documentation: undefined,
    whitepaper: undefined,
  };
  
  // Try to find whitepaper from homepage
  if (links.website) {
    const websiteLower = links.website.toLowerCase();
    if (websiteLower.includes("whitepaper") || websiteLower.includes("docs")) {
      links.documentation = links.website;
    }
  }
  
  return links;
}

/**
 * Clear all cache (for maintenance)
 */
export function clearCache(): void {
  cache.clear();
  console.log("Crypto API cache cleared");
}

/**
 * Get cache statistics
 */
export function getCacheStats(): { size: number; keys: string[] } {
  return {
    size: cache.size,
    keys: Array.from(cache.keys()),
  };
}

export default {
  getTopCoins,
  searchCoins,
  getCoinDetail,
  getHistoricalData,
  getGlobalData,
  getTrendingCoins,
  getOpenSourceLinks,
  clearCache,
  getCacheStats,
};