import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";

// Types for news data
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
  isFallback?: boolean;
}

/**
 * Get cryptocurrency news
 */
export function useCryptoNews(options?: {
  query?: string;
  sources?: string[];
  limit?: number;
  sortBy?: "relevance" | "popularity" | "recency";
}) {
  const { query, sources, limit = 20, sortBy = "recency" } = options || {};
  
  return useQuery({
    queryKey: ["news", query, sources?.join(","), limit, sortBy],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (query) params.set("q", query);
      if (sources) params.set("sources", sources.join(","));
      if (limit) params.set("limit", String(limit));
      if (sortBy) params.set("sortBy", sortBy);
      
      const url = `${api.news.list.path}?${params.toString()}`;
      const response = await fetch(url, { credentials: "include" });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch news: ${response.statusText}`);
      }
      
      return response.json() as Promise<NewsResponse>;
    },
    staleTime: 180000, // 3 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Get trending news
 */
export function useTrendingNews() {
  return useQuery({
    queryKey: ["news-trending"],
    queryFn: async () => {
      const response = await fetch(api.news.trending.path, { credentials: "include" });
      if (!response.ok) {
        throw new Error(`Failed to fetch trending news: ${response.statusText}`);
      }
      return response.json() as Promise<NewsResponse>;
    },
    staleTime: 300000, // 5 minutes
    refetchOnWindowFocus: false,
  });
}

/**
 * Search news by topic
 */
export function useNewsSearch(query: string, sortBy: "relevance" | "popularity" | "recency" = "relevance") {
  return useQuery({
    queryKey: ["news-search", query, sortBy],
    queryFn: async () => {
      if (!query.trim()) {
        return { articles: [], totalResults: 0, source: "", query: "", sortBy: "" };
      }
      
      const params = new URLSearchParams({
        q: query,
        sortBy
      });
      
      const response = await fetch(`${api.news.search.path}?${params.toString()}`, { 
        credentials: "include" 
      });
      
      if (!response.ok) {
        throw new Error(`Failed to search news: ${response.statusText}`);
      }
      
      return response.json() as Promise<NewsResponse & { query: string; sortBy: string }>;
    },
    enabled: query.trim().length > 0,
    staleTime: 180000,
  });
}

/**
 * Format relative time
 */
export function formatRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

/**
 * Get sentiment color
 */
export function getSentimentColor(sentiment?: "positive" | "negative" | "neutral"): string {
  switch (sentiment) {
    case "positive": return "text-green-400";
    case "negative": return "text-red-400";
    default: return "text-muted-foreground";
  }
}

/**
 * Get sentiment badge color
 */
export function getSentimentBadgeColor(sentiment?: "positive" | "negative" | "neutral"): string {
  switch (sentiment) {
    case "positive": return "bg-green-500/20 text-green-400 border-green-500/30";
    case "negative": return "bg-red-500/20 text-red-400 border-red-500/30";
    default: return "bg-muted text-muted-foreground border-border";
  }
}
