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
    
    const avgDemand = allProducts.reduce((sum: number, p: Product) => sum + p.demandScore, 0) / allProducts.length;
    
    const categoryCounts = allProducts.reduce((acc: Record<string, number>, p: Product) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = (Object.entries(categoryCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0];

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

export class MemStorage implements IStorage {
  private productsArr: Product[] = [];
  private insightsArr: Insight[] = [];
  private nextInsightId = 1;

  async getProducts(): Promise<Product[]> {
    return [...this.productsArr].sort((a, b) => b.demandScore - a.demandScore).slice(0, 20);
  }

  async getInsights(): Promise<Insight[]> {
    return [...this.insightsArr].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 10);
  }

  async getStats(): Promise<DashboardStats> {
    const allProducts = this.productsArr;
    if (allProducts.length === 0) {
      return { totalProductsTracked: 0, averageDemand: 0, topCategory: "N/A" };
    }
    
    const avgDemand = allProducts.reduce((sum: number, p: Product) => sum + p.demandScore, 0) / allProducts.length;
    
    const categoryCounts = allProducts.reduce((acc: Record<string, number>, p: Product) => {
      acc[p.category] = (acc[p.category] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    const topCategory = (Object.entries(categoryCounts) as [string, number][]).sort((a, b) => b[1] - a[1])[0][0];

    return {
      totalProductsTracked: allProducts.length,
      averageDemand: Math.round(avgDemand),
      topCategory,
    };
  }
  
  async addInsight(insight: Omit<Insight, "id" | "createdAt">): Promise<Insight> {
    const newInsight: Insight = {
      ...insight,
      id: this.nextInsightId++,
      createdAt: new Date()
    };
    this.insightsArr.push(newInsight);
    return newInsight;
  }
  
  async updateProducts(newProducts: Omit<Product, "id" | "lastUpdated">[]): Promise<void> {
    this.productsArr = newProducts.map((p, i) => ({
      ...p,
      id: i + 1,
      lastUpdated: new Date()
    }));
  }
  
  async clearInsights(): Promise<void> {
    this.insightsArr = [];
  }
}

export const storage = new MemStorage();
