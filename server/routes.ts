import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
  // Health check endpoint for Render
  app.get("/health", (_req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get(api.products.list.path, async (req, res) => {
    try {
      const products = await storage.getProducts();
      res.json(products);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.insights.list.path, async (req, res) => {
    try {
      const data = await storage.getInsights();
      res.json(data);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.get(api.stats.get.path, async (req, res) => {
    try {
      const stats = await storage.getStats();
      res.json(stats);
    } catch (err) {
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post(api.insights.generate.path, async (req, res) => {
    try {
      const allProducts = await storage.getProducts();
      const marketData: Record<string, any> = {};
      allProducts.forEach(p => {
        marketData[p.name] = {
          price: "N/A", // We could fetch actual prices here if needed
          change: p.trendPercentage
        };
      });

      // Call Python backend for AI summary
      const pythonUrl = process.env.PYTHON_BACKEND_URL || "http://localhost:5001";
      const pythonResponse = await fetch(`${pythonUrl}/api/v1/ai/summary`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ market_data: marketData })
      });

      if (!pythonResponse.ok) {
        throw new Error(`Python backend error: ${pythonResponse.statusText}`);
      }

      const aiData = await pythonResponse.json();
      if (!aiData.success) {
        throw new Error(`AI generation failed: ${aiData.error || "Unknown error"}`);
      }

      const summary = aiData.data;
      
      // Map AI key points to insights
      await storage.clearInsights();
      if (summary.key_points && Array.isArray(summary.key_points)) {
        for (const point of summary.key_points) {
          await storage.addInsight({
            title: summary.title || "Market Update",
            content: point,
            type: summary.sentiment?.label === "negative" ? "alert" : "trend"
          });
        }
      } else {
        await storage.addInsight({
          title: summary.title || "Market Summary",
          content: summary.summary,
          type: "trend"
        });
      }

      res.json({ message: "Data refreshed successfully" });
    } catch (error) {
      console.error("AI Generation Error:", error);
      res.status(500).json({ message: "Failed to generate insights" });
    }
  });

  // Seed data on startup
  seedDatabase().catch(console.error);

  return httpServer;
}

async function seedDatabase() {
  try {
    const existingProducts = await storage.getProducts();
    if (existingProducts.length === 0) {
      await storage.updateProducts([
        { name: "AI Smart Glasses", category: "Wearables", demandScore: 95, trendPercentage: "45.2", searchVolume: 1250000 },
        { name: "Sustainable Running Shoes", category: "Apparel", demandScore: 88, trendPercentage: "12.4", searchVolume: 850000 },
        { name: "Ergonomic Desk Chair", category: "Furniture", demandScore: 82, trendPercentage: "5.1", searchVolume: 620000 },
        { name: "Smart Ring Tracker", category: "Wearables", demandScore: 79, trendPercentage: "22.8", searchVolume: 410000 },
        { name: "Portable Solar Panels", category: "Electronics", demandScore: 75, trendPercentage: "18.5", searchVolume: 380000 },
        { name: "Noise Cancelling Earbuds", category: "Electronics", demandScore: 92, trendPercentage: "8.3", searchVolume: 1100000 },
        { name: "Foldable Keyboard", category: "Accessories", demandScore: 65, trendPercentage: "-2.1", searchVolume: 150000 },
      ]);
      
      await storage.addInsight({
        title: "Wearables Surging",
        content: "AI Smart Glasses and Ring Trackers are showing massive spikes in search volume this week. Consumers are looking for hands-free AI interaction.",
        type: "trend"
      });
      
      await storage.addInsight({
        title: "Eco-Friendly Apparel",
        content: "Consistent upward trend in sustainable fashion items, particularly footwear. Consider expanding lines in this category.",
        type: "opportunity"
      });

      await storage.addInsight({
        title: "Traditional Accessories Declining",
        content: "We are seeing a slight dip in demand for standard accessories like foldable keyboards as consumers shift back to primary setups.",
        type: "alert"
      });
    }
  } catch (err) {
    console.error("Seed error:", err);
  }
}
