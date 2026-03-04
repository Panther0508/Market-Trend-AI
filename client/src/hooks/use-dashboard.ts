import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { DashboardStats, Product, Insight } from "@shared/schema";
import { z } from "zod";

// Helper to safely parse API responses, logging errors but passing data through if schema coercion fails
// due to complex Drizzle model transformations (like string to Date)
function safeParse<T>(schema: z.ZodSchema<T>, data: any, endpointName: string): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    console.error(`[Zod Error] ${endpointName}:`, result.error.format());
    // Fallback to casting to prevent catastrophic UI failure on minor mismatches
    return data as T;
  }
  return result.data;
}

export function useStats() {
  return useQuery({
    queryKey: [api.stats.get.path],
    queryFn: async () => {
      const res = await fetch(api.stats.get.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch dashboard stats");
      const data = await res.json();
      return safeParse(api.stats.get.responses[200], data, "api.stats.get") as DashboardStats;
    },
  });
}

export function useProducts() {
  return useQuery({
    queryKey: [api.products.list.path],
    queryFn: async () => {
      const res = await fetch(api.products.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch products");
      const data = await res.json();
      return safeParse(api.products.list.responses[200], data, "api.products.list") as Product[];
    },
  });
}

export function useInsights() {
  return useQuery({
    queryKey: [api.insights.list.path],
    queryFn: async () => {
      const res = await fetch(api.insights.list.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch insights");
      const data = await res.json();
      return safeParse(api.insights.list.responses[200], data, "api.insights.list") as Insight[];
    },
  });
}

export function useGenerateInsights() {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async () => {
      const res = await fetch(api.insights.generate.path, {
        method: api.insights.generate.method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
      });
      
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to generate insights");
      }
      
      const data = await res.json();
      return safeParse(api.insights.generate.responses[200], data, "api.insights.generate");
    },
    onSuccess: () => {
      // Invalidate all dashboard queries to reflect the newly AI-generated data
      queryClient.invalidateQueries({ queryKey: [api.stats.get.path] });
      queryClient.invalidateQueries({ queryKey: [api.products.list.path] });
      queryClient.invalidateQueries({ queryKey: [api.insights.list.path] });
    },
  });
}
