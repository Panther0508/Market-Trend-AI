/**
 * News API Routes
 * Aggregates cryptocurrency news from multiple sources
 */

import type { Express } from "express";
import {
  getCryptoNews,
  getTrendingNews,
  getNewsForCoin,
  searchNews,
  getNewsSources,
  clearNewsCache,
  getNewsCacheStats,
  getFallbackNews,
  type NewsResponse,
  type NewsArticle,
} from "../integrations/newsApi.js";

// Response types
export interface NewsListResponse {
  articles: NewsArticle[];
  totalResults: number;
  source: string;
  cachedAt?: string;
  isFallback?: boolean;
}

export interface NewsSearchResponse extends NewsListResponse {
  query: string;
  sortBy: string;
}

/**
 * Register news API routes
 */
export function registerNewsRoutes(app: Express): void {
  
  // Get cryptocurrency news
  app.get("/api/v1/news", async (req, res) => {
    try {
      const query = req.query.q as string | undefined;
      const sources = req.query.sources as string | undefined;
      const limit = Math.min(parseInt(req.query.limit as string) || 20, 50);
      const sortBy = (req.query.sortBy as "relevance" | "popularity" | "recency") || "recency";
      
      const sourceList = sources ? sources.split(",") : undefined;
      
      const data = await getCryptoNews(query, {
        sources: sourceList,
        limit,
        sortBy
      });
      
      res.json({
        ...data,
        isFallback: data.source === "fallback"
      } as NewsListResponse);
    } catch (error) {
      console.error("News fetch error:", error);
      // Return fallback data on error
      const fallback = getFallbackNews();
      res.json({
        ...fallback,
        isFallback: true,
        error: error instanceof Error ? error.message : "Unknown error"
      } as NewsListResponse);
    }
  });

  // Get trending news
  app.get("/api/v1/news/trending", async (_req, res) => {
    try {
      const data = await getTrendingNews();
      res.json({
        ...data,
        isFallback: data.source === "fallback"
      } as NewsListResponse);
    } catch (error) {
      console.error("Trending news error:", error);
      const fallback = getFallbackNews();
      res.json({
        ...fallback,
        isFallback: true
      } as NewsListResponse);
    }
  });

  // Get news for specific cryptocurrency
  app.get("/api/v1/news/coin/:coinId", async (req, res) => {
    try {
      const { coinId } = req.params;
      const limit = Math.min(parseInt(req.query.limit as string) || 10, 30);
      
      if (!coinId) {
        return res.status(400).json({ message: "Coin ID is required" });
      }
      
      const data = await getNewsForCoin(coinId);
      res.json({
        ...data,
        isFallback: data.source === "fallback"
      } as NewsListResponse);
    } catch (error) {
      console.error("Coin news error:", error);
      const fallback = getFallbackNews();
      res.json({
        ...fallback,
        isFallback: true
      } as NewsListResponse);
    }
  });

  // Search news by topic
  app.get("/api/v1/news/search", async (req, res) => {
    const query = req.query.q as string;
    const sortBy = (req.query.sortBy as "relevance" | "popularity" | "recency") || "relevance";
    
    try {
      if (!query || query.trim().length === 0) {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const data = await searchNews(query);
      res.json({
        ...data,
        query,
        sortBy,
        isFallback: data.source === "fallback"
      } as NewsSearchResponse);
    } catch (error) {
      console.error("News search error:", error);
      const fallback = getFallbackNews();
      res.json({
        ...fallback,
        isFallback: true,
        query: query || "",
        sortBy: sortBy,
        error: error instanceof Error ? error.message : "Unknown error"
      } as NewsSearchResponse);
    }
  });

  // Get available news sources
  app.get("/api/v1/news/sources", (_req, res) => {
    const sources = getNewsSources();
    res.json({
      sources,
      available: sources
    });
  });

  // Clear news cache (admin endpoint)
  app.post("/api/v1/news/cache/clear", (_req, res) => {
    clearNewsCache();
    res.json({ message: "News cache cleared successfully" });
  });

  // Get news cache stats
  app.get("/api/v1/news/cache/stats", (_req, res) => {
    const stats = getNewsCacheStats();
    res.json(stats);
  });
}

export default registerNewsRoutes;
