import { z } from "zod";
import { products, insights } from "./schema";

export const errorSchemas = {
  internal: z.object({ message: z.string() }),
};

export const api = {
  products: {
    list: {
      method: "GET" as const,
      path: "/api/products" as const,
      responses: {
        200: z.array(z.custom<typeof products.$inferSelect>()),
      }
    }
  },
  insights: {
    list: {
      method: "GET" as const,
      path: "/api/insights" as const,
      responses: {
        200: z.array(z.custom<typeof insights.$inferSelect>()),
      }
    },
    generate: {
      method: "POST" as const,
      path: "/api/insights/generate" as const,
      responses: {
        200: z.object({ message: z.string() }),
        500: errorSchemas.internal,
      }
    }
  },
  stats: {
    get: {
      method: "GET" as const,
      path: "/api/stats" as const,
      responses: {
        200: z.object({
          totalProductsTracked: z.number(),
          averageDemand: z.number(),
          topCategory: z.string(),
        })
      }
    }
  },
  crypto: {
    search: {
      method: "GET" as const,
      path: "/api/v1/crypto/search" as const,
      responses: {
        200: z.object({
          coins: z.array(z.object({
            id: z.string(),
            name: z.string(),
            symbol: z.string(),
            market_cap_rank: z.number().nullable(),
            thumb: z.string(),
            large: z.string(),
          })),
          trending: z.array(z.any()),
          globalData: z.any(),
          totalResults: z.number(),
        })
      }
    },
    top: {
      method: "GET" as const,
      path: "/api/v1/crypto/top" as const,
      responses: {
        200: z.object({
          coins: z.array(z.any()),
          total: z.number(),
          timestamp: z.string(),
        })
      }
    },
    detail: {
      method: "GET" as const,
      path: "/api/v1/crypto/:coinId" as const,
      responses: {
        200: z.object({
          id: z.string(),
          symbol: z.string(),
          name: z.string(),
          description: z.string(),
          image: z.string(),
          currentPrice: z.number(),
          marketCap: z.number(),
          marketCapRank: z.number(),
          priceChange24h: z.number(),
          priceChangePercentage24h: z.number(),
          priceChangePercentage7d: z.number(),
          priceChangePercentage30d: z.number(),
          ath: z.number(),
          atl: z.number(),
          volume24h: z.number(),
          circulatingSupply: z.number(),
          sparkline: z.array(z.number()),
          links: z.object({
            github: z.string().nullable(),
            website: z.string().nullable(),
          }),
          genesisDate: z.string().nullable(),
          coingeckoRank: z.number(),
          coingeckoScore: z.number(),
          developerScore: z.number(),
          communityScore: z.number(),
        })
      }
    },
    history: {
      method: "GET" as const,
      path: "/api/v1/crypto/:coinId/history" as const,
      responses: {
        200: z.object({
          coinId: z.string(),
          prices: z.array(z.object({ timestamp: z.number(), price: z.number() })),
          marketCaps: z.array(z.object({ timestamp: z.number(), value: z.number() })),
          volumes: z.array(z.object({ timestamp: z.number(), value: z.number() })),
        })
      }
    },
    global: {
      method: "GET" as const,
      path: "/api/v1/crypto/global" as const,
      responses: {
        200: z.any()
      }
    },
    trending: {
      method: "GET" as const,
      path: "/api/v1/crypto/trending" as const,
      responses: {
        200: z.any()
      }
    },
    links: {
      method: "GET" as const,
      path: "/api/v1/crypto/:coinId/links" as const,
      responses: {
        200: z.object({
          github: z.string().nullable(),
          website: z.string().nullable(),
          documentation: z.string().nullable(),
          whitepaper: z.string().nullable(),
        })
      }
    }
  },
  news: {
    list: {
      method: "GET" as const,
      path: "/api/v1/news" as const,
      responses: {
        200: z.object({
          articles: z.array(z.object({
            id: z.string(),
            title: z.string(),
            description: z.string(),
            url: z.string(),
            source: z.string(),
            publishedAt: z.string(),
            imageUrl: z.string().optional(),
            sentiment: z.enum(["positive", "negative", "neutral"]).optional(),
            categories: z.array(z.string()),
          })),
          totalResults: z.number(),
          source: z.string(),
          cachedAt: z.string().optional(),
          isFallback: z.boolean().optional(),
        })
      }
    },
    trending: {
      method: "GET" as const,
      path: "/api/v1/news/trending" as const,
      responses: {
        200: z.object({
          articles: z.array(z.any()),
          totalResults: z.number(),
          source: z.string(),
        })
      }
    },
    search: {
      method: "GET" as const,
      path: "/api/v1/news/search" as const,
      responses: {
        200: z.object({
          articles: z.array(z.any()),
          totalResults: z.number(),
          query: z.string(),
          sortBy: z.string(),
        })
      }
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
