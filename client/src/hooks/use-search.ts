import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { Product, Insight } from "@shared/schema";
import { z } from "zod";

export interface SearchResult {
    products: Product[];
    insights: Insight[];
    totalResults: number;
}

function safeParse<T>(schema: z.ZodSchema<T>, data: any, endpointName: string): T {
    const result = schema.safeParse(data);
    if (!result.success) {
        console.error(`[Zod Error] ${endpointName}:`, result.error.format());
        return data as T;
    }
    return result.data;
}

export function useSearch(query: string, filter: "all" | "products" | "insights" = "all") {
    return useQuery({
        queryKey: ["search", query, filter],
        queryFn: async () => {
            if (!query.trim()) {
                return { products: [], insights: [], totalResults: 0 };
            }

            const results: SearchResult = {
                products: [],
                insights: [],
                totalResults: 0,
            };

            // Fetch products if needed
            if (filter === "all" || filter === "products") {
                try {
                    const productsRes = await fetch(api.products.list.path, { credentials: "include" });
                    if (productsRes.ok) {
                        const productsData = await productsRes.json();
                        const products = safeParse(api.products.list.responses[200], productsData, "api.products.list") as Product[];

                        // Filter products by search query
                        const searchLower = query.toLowerCase();
                        results.products = products.filter(
                            (p) =>
                                p.name.toLowerCase().includes(searchLower) ||
                                p.category.toLowerCase().includes(searchLower)
                        );
                    }
                } catch (error) {
                    console.error("Error fetching products:", error);
                }
            }

            // Fetch insights if needed
            if (filter === "all" || filter === "insights") {
                try {
                    const insightsRes = await fetch(api.insights.list.path, { credentials: "include" });
                    if (insightsRes.ok) {
                        const insightsData = await insightsRes.json();
                        const insights = safeParse(api.insights.list.responses[200], insightsData, "api.insights.list") as Insight[];

                        // Filter insights by search query
                        const searchLower = query.toLowerCase();
                        results.insights = insights.filter(
                            (i) =>
                                i.title.toLowerCase().includes(searchLower) ||
                                i.content.toLowerCase().includes(searchLower) ||
                                i.type.toLowerCase().includes(searchLower)
                        );
                    }
                } catch (error) {
                    console.error("Error fetching insights:", error);
                }
            }

            results.totalResults = results.products.length + results.insights.length;
            return results;
        },
        enabled: query.trim().length > 0,
    });
}
