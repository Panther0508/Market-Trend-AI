import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import { z } from "zod";

// Types for crypto data
export interface CryptoCoin {
  id: string;
  name: string;
  symbol: string;
  market_cap_rank: number | null;
  thumb: string;
  large: string;
}

export interface CryptoSearchResult {
  coins: CryptoCoin[];
  trending: any[];
  globalData: any;
  totalResults: number;
}

export interface CoinDetail {
  id: string;
  symbol: string;
  name: string;
  description: string;
  image: string;
  currentPrice: number;
  marketCap: number;
  marketCapRank: number;
  priceChange24h: number;
  priceChangePercentage24h: number;
  priceChangePercentage7d: number;
  priceChangePercentage30d: number;
  ath: number;
  atl: number;
  volume24h: number;
  circulatingSupply: number;
  sparkline: number[];
  links: {
    github: string | null;
    website: string | null;
  };
  genesisDate: string | null;
  coingeckoRank: number;
  coingeckoScore: number;
  developerScore: number;
  communityScore: number;
}

export interface HistoricalData {
  coinId: string;
  prices: Array<{ timestamp: number; price: number }>;
  marketCaps: Array<{ timestamp: number; value: number }>;
  volumes: Array<{ timestamp: number; value: number }>;
}

// Safe parsing with Zod
function safeParse<T>(schema: z.ZodSchema<T>, data: any, endpointName: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod Error] ${endpointName}:`, result.error.format());
    return data as T;
  }
  return result.data;
}

/**
 * Search cryptocurrencies
 */
export function useCryptoSearch(query: string) {
  return useQuery({
    queryKey: ["crypto-search", query],
    queryFn: async () => {
      // If empty query, get top coins
      const url = query.trim() 
        ? `${api.crypto.search.path}?q=${encodeURIComponent(query)}`
        : api.crypto.search.path;
      
      const response = await fetch(url, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to search crypto: ${response.statusText}`);
      }
      
      const data = await response.json();
      return safeParse(api.crypto.search.responses[200], data, "api.crypto.search") as CryptoSearchResult;
    },
    enabled: true, // Always enabled, works with or without query
    staleTime: 60000, // 1 minute stale time
  });
}

/**
 * Get top cryptocurrencies
 */
export function useTopCrypto(limit = 50) {
  return useQuery({
    queryKey: ["crypto-top", limit],
    queryFn: async () => {
      const response = await fetch(`${api.crypto.top.path}?limit=${limit}`, { 
        credentials: "include" 
      });
      if (!response.ok) {
        throw new Error(`Failed to get top crypto: ${response.statusText}`);
      }
      
      const data = await response.json();
      return data as { coins: any[]; total: number; timestamp: string };
    },
    staleTime: 60000,
  });
}

/**
 * Get coin details
 */
export function useCoinDetail(coinId: string | null) {
  return useQuery({
    queryKey: ["coin-detail", coinId],
    queryFn: async () => {
      if (!coinId) return null;
      
      const response = await fetch(api.crypto.detail.path.replace(":coinId", coinId), {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to get coin detail: ${response.statusText}`);
      }
      
      const data = await response.json();
      return safeParse(api.crypto.detail.responses[200], data, "api.crypto.detail") as CoinDetail;
    },
    enabled: !!coinId,
    staleTime: 300000, // 5 minutes stale time
  });
}

/**
 * Get historical price data
 */
export function useHistoricalData(coinId: string | null, days = 7) {
  return useQuery({
    queryKey: ["crypto-history", coinId, days],
    queryFn: async () => {
      if (!coinId) return null;
      
      const response = await fetch(
        `${api.crypto.history.path.replace(":coinId", coinId)}?days=${days}`,
        { credentials: "include" }
      );
      if (!response.ok) {
        throw new Error(`Failed to get history: ${response.statusText}`);
      }
      
      const data = await response.json();
      return safeParse(api.crypto.history.responses[200], data, "api.crypto.history") as HistoricalData;
    },
    enabled: !!coinId,
    staleTime: 60000,
  });
}

/**
 * Get global market data
 */
export function useGlobalData() {
  return useQuery({
    queryKey: ["crypto-global"],
    queryFn: async () => {
      const response = await fetch(api.crypto.global.path, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to get global data: ${response.statusText}`);
      }
      
      return await response.json();
    },
    staleTime: 60000,
  });
}

/**
 * Get trending coins
 */
export function useTrendingCoins() {
  return useQuery({
    queryKey: ["crypto-trending"],
    queryFn: async () => {
      const response = await fetch(api.crypto.trending.path, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to get trending: ${response.statusText}`);
      }
      
      return await response.json();
    },
    staleTime: 300000, // 5 minutes
  });
}

/**
 * Get open-source links for a coin
 */
export function useCoinLinks(coinId: string | null) {
  return useQuery({
    queryKey: ["coin-links", coinId],
    queryFn: async () => {
      if (!coinId) return null;
      
      const response = await fetch(api.crypto.links.path.replace(":coinId", coinId), {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`Failed to get links: ${response.statusText}`);
      }
      
      return await response.json();
    },
    enabled: !!coinId,
    staleTime: 300000,
  });
}

/**
 * Format price with proper currency symbol
 */
export function formatPrice(price: number, currency = "USD"): string {
  if (price >= 1) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(price);
  } else {
    // Show more decimals for small prices
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 8,
    }).format(price);
  }
}

/**
 * Format market cap
 */
export function formatMarketCap(value: number): string {
  if (value >= 1e12) {
    return `$${(value / 1e12).toFixed(2)}T`;
  } else if (value >= 1e9) {
    return `$${(value / 1e9).toFixed(2)}B`;
  } else if (value >= 1e6) {
    return `$${(value / 1e6).toFixed(2)}M`;
  } else {
    return `$${value.toLocaleString()}`;
  }
}

/**
 * Format percentage change
 */
export function formatPercentage(value: number): string {
  const sign = value >= 0 ? "+" : "";
  return `${sign}${value.toFixed(2)}%`;
}