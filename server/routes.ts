import type { Express } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { api } from "@shared/routes";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {
  
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
      const prompt = `You are a live market analytics AI. Generate a realistic JSON list of 10 currently trending products globally. 
Return ONLY a valid JSON object with a "products" array containing:
{ "name": string, "category": string, "demandScore": number (0-100), "trendPercentage": string (e.g. "15.5", "-2.4"), "searchVolume": number }
and an "insights" array containing 3 objects analyzing this data with:
{ "title": string, "content": string, "type": string (must be 'trend', 'opportunity', or 'alert') }`;

      const response = await openai.chat.completions.create({
        model: "gpt-5.2",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" }
      });
      
      const content = response.choices[0].message?.content;
      if (!content) throw new Error("No content from AI");
      
      const parsed = JSON.parse(content);
      
      if (parsed.products && Array.isArray(parsed.products)) {
        await storage.updateProducts(parsed.products.map((p: any) => ({
          name: p.name,
          category: p.category,
          demandScore: Number(p.demandScore),
          trendPercentage: String(p.trendPercentage),
          searchVolume: Number(p.searchVolume)
        })));
      }
      
      if (parsed.insights && Array.isArray(parsed.insights)) {
        await storage.clearInsights();
        for (const ins of parsed.insights) {
          await storage.addInsight({
            title: ins.title,
            content: ins.content,
            type: ins.type
          });
        }
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
