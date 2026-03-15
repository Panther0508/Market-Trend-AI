/**
 * Crypto Search API Routes
 * Aggregates cryptocurrency data and open-source resources
 */

import type { Express } from "express";
import type { Server } from "http";
import {
  getTopCoins,
  searchCoins,
  getCoinDetail,
  getHistoricalData,
  getGlobalData,
  getTrendingCoins,
  getOpenSourceLinks,
  clearCache,
  getCacheStats,
  type CoinGeckoMarketCoin,
  type CoinGeckoSearchResult,
} from "../integrations/cryptoApi.js";

// Response types for API
export interface CryptoSearchResult {
  coins: CoinGeckoSearchResult["coins"];
  trending: any[];
  globalData: any;
  totalResults: number;
}

export interface CoinDetailResponse {
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
  totalSupply: number | null;
  maxSupply: number | null;
  sparkline: number[];
  links: {
    github?: string;
    website?: string;
    documentation?: string;
  };
  genesisDate: string | null;
  coingeckoRank: number;
  coingeckoScore: number;
  developerScore: number;
  communityScore: number;
}

export interface HistoricalDataResponse {
  coinId: string;
  prices: Array<{ timestamp: number; price: number }>;
  marketCaps: Array<{ timestamp: number; value: number }>;
  volumes: Array<{ timestamp: number; value: number }>;
}

/**
 * Register crypto API routes
 */
export function registerCryptoRoutes(app: Express): void {
  // Search cryptocurrencies
  app.get("/api/v1/crypto/search", async (req, res) => {
    try {
      const query = req.query.q as string;
      
      if (!query || query.trim().length === 0) {
        // Return top coins if no query
        const topCoins = await getTopCoins("usd", 50);
        const globalData = await getGlobalData();
        const trending = await getTrendingCoins();
        
        return res.json({
          coins: topCoins.map(c => ({
            id: c.id,
            name: c.name,
            symbol: c.symbol,
            market_cap_rank: c.market_cap_rank,
            thumb: c.image,
            large: c.image,
          })),
          trending: trending.coins || [],
          globalData: globalData.data,
          totalResults: topCoins.length,
        } as CryptoSearchResult);
      }
      
      // Search for coins
      const searchResults = await searchCoins(query);
      const globalData = await getGlobalData().catch(() => null);
      const trending = await getTrendingCoins().catch(() => ({ coins: [] }));
      
      res.json({
        coins: searchResults.coins,
        trending: trending.coins || [],
        globalData: globalData?.data || null,
        totalResults: searchResults.coins.length,
      } as CryptoSearchResult);
    } catch (error) {
      console.error("Crypto search error:", error);
      res.status(500).json({
        message: "Failed to search cryptocurrencies",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get top cryptocurrencies
  app.get("/api/v1/crypto/top", async (req, res) => {
    try {
      const currency = (req.query.currency as string) || "usd";
      const limit = parseInt(req.query.limit as string) || 100;
      const sparkline = req.query.sparkline !== "false";
      
      const coins = await getTopCoins(currency, Math.min(limit, 100), 1, sparkline);
      
      res.json({
        coins,
        total: coins.length,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("Top coins error:", error);
      res.status(500).json({
        message: "Failed to fetch top cryptocurrencies",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get coin details
  app.get("/api/v1/crypto/:coinId", async (req, res) => {
    try {
      const { coinId } = req.params;
      
      if (!coinId) {
        return res.status(400).json({ message: "Coin ID is required" });
      }
      
      const [detail, historical] = await Promise.all([
        getCoinDetail(coinId, false, false, true, false, true),
        getHistoricalData(coinId, "usd", 7).catch(() => null),
      ]);
      
      const response: CoinDetailResponse = {
        id: detail.id,
        symbol: detail.symbol,
        name: detail.name,
        description: detail.description?.en || "",
        image: detail.image?.large || "",
        currentPrice: detail.market_data?.current_price?.usd || 0,
        marketCap: detail.market_data?.market_cap?.usd || 0,
        marketCapRank: detail.coingecko_rank || 0,
        priceChange24h: detail.market_data?.price_change_percentage_24h || 0,
        priceChangePercentage24h: detail.market_data?.price_change_percentage_24h || 0,
        priceChangePercentage7d: detail.market_data?.price_change_percentage_7d || 0,
        priceChangePercentage30d: detail.market_data?.price_change_percentage_30d || 0,
        ath: detail.market_data?.ath?.usd || 0,
        atl: detail.market_data?.atl?.usd || 0,
        volume24h: detail.market_data?.total_volume?.usd || 0,
        circulatingSupply: detail.market_data?.current_price ? 
          (detail.market_data?.market_cap?.usd || 0) / detail.market_data?.current_price?.usd : 0,
        totalSupply: detail.market_data?.total_volume?.usd || null,
        maxSupply: detail.market_data?.ath?.usd || null,
        sparkline: historical?.prices?.slice(-168).map(p => p[1]) || [],
        links: {
          github: detail.links?.repos_url?.github?.[0],
          website: detail.links?.homepage?.[0],
        },
        genesisDate: detail.genesis_date,
        coingeckoRank: detail.coingecko_rank,
        coingeckoScore: detail.coingecko_score,
        developerScore: detail.developer_score,
        communityScore: detail.community_score,
      };
      
      res.json(response);
    } catch (error) {
      console.error("Coin detail error:", error);
      res.status(500).json({
        message: "Failed to fetch coin details",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get historical data
  app.get("/api/v1/crypto/:coinId/history", async (req, res) => {
    try {
      const { coinId } = req.params;
      const currency = (req.query.currency as string) || "usd";
      const days = parseInt(req.query.days as string) || 7;
      
      if (!coinId) {
        return res.status(400).json({ message: "Coin ID is required" });
      }
      
      const data = await getHistoricalData(coinId, currency, Math.min(days, 365));
      
      const response: HistoricalDataResponse = {
        coinId,
        prices: data.prices.map(([timestamp, price]) => ({ timestamp, price })),
        marketCaps: data.market_caps.map(([timestamp, value]) => ({ timestamp, value })),
        volumes: data.total_volumes.map(([timestamp, value]) => ({ timestamp, value })),
      };
      
      res.json(response);
    } catch (error) {
      console.error("Historical data error:", error);
      res.status(500).json({
        message: "Failed to fetch historical data",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get global market data
  app.get("/api/v1/crypto/global", async (req, res) => {
    try {
      const data = await getGlobalData();
      res.json(data.data);
    } catch (error) {
      console.error("Global data error:", error);
      res.status(500).json({
        message: "Failed to fetch global market data",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get trending coins
  app.get("/api/v1/crypto/trending", async (req, res) => {
    try {
      const data = await getTrendingCoins();
      res.json(data);
    } catch (error) {
      console.error("Trending coins error:", error);
      res.status(500).json({
        message: "Failed to fetch trending coins",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Get open-source links for a coin
  app.get("/api/v1/crypto/:coinId/links", async (req, res) => {
    try {
      const { coinId } = req.params;
      
      if (!coinId) {
        return res.status(400).json({ message: "Coin ID is required" });
      }
      
      const links = await getOpenSourceLinks(coinId);
      res.json(links);
    } catch (error) {
      console.error("Open source links error:", error);
      res.status(500).json({
        message: "Failed to fetch open-source links",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Clear cache (admin endpoint)
  app.post("/api/v1/crypto/cache/clear", (_req, res) => {
    clearCache();
    res.json({ message: "Cache cleared successfully" });
  });

  // Get cache stats
  app.get("/api/v1/crypto/cache/stats", (_req, res) => {
    const stats = getCacheStats();
    res.json(stats);
  });
}

export default registerCryptoRoutes;