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
