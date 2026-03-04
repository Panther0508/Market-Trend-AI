import { db } from "./db";
import { products, insights, type Product, type Insight, type DashboardStats } from "@shared/schema";
import { desc } from "drizzle-orm";

export interface IStorage {
  getProducts(): Promise<Product[]>;
  getInsights(): Promise<Insight[]>;
  getStats(): Promise<DashboardStats>;
  addInsight(insight: Omit<Insight, "id" | "createdAt">): Promise<Insight>;
  updateProducts(newProducts: Omit<Product, "id" | "lastUpdated">[]): Promise<void>;
  clearInsights(): Promise<void>;
}

export class DatabaseStorage implements IStorage {
  async getProducts(): Promise<Product[]> {
    return await db.select().from(products).orderBy(desc(products.demandScore)).limit(20);
  }

  async getInsights(): Promise<Insight[]> {
    return await db.select().from(insights).orderBy(desc(insights.createdAt)).limit(10);
  }

  async getStats(): Promise<DashboardStats> {
    const allProducts = await db.select().from(products);
    if (allProducts.length === 0) {
      return { totalProductsTracked: 0, averageDemand: 0, topCategory: "N/A" };
    }
    
    const avgDemand = allProducts.reduce((sum, p) => sum + p.demandScore, 0) / allProducts.length;
    
    const categoryCounts = allProducts.reduce((acc, p) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = Object.entries(categoryCounts).sort((a, b) => b[1] - a[1])[0][0];

    return {
      totalProductsTracked: allProducts.length,
      averageDemand: Math.round(avgDemand),
      topCategory,
    };
  }
  
  async addInsight(insight: Omit<Insight, "id" | "createdAt">): Promise<Insight> {
    const [inserted] = await db.insert(insights).values(insight).returning();
    return inserted;
  }
  
  async updateProducts(newProducts: Omit<Product, "id" | "lastUpdated">[]): Promise<void> {
    await db.delete(products); // Refresh all for demo
    if (newProducts.length > 0) {
      await db.insert(products).values(newProducts);
    }
  }
  
  async clearInsights(): Promise<void> {
    await db.delete(insights);
  }
}

export const storage = new DatabaseStorage();
