import { pgTable, text, serial, integer, timestamp, numeric } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const products = pgTable("products", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  category: text("category").notNull(),
  demandScore: integer("demand_score").notNull(), // 0-100
  trendPercentage: numeric("trend_percentage").notNull(), // e.g. +15.5
  searchVolume: integer("search_volume").notNull(),
  lastUpdated: timestamp("last_updated").defaultNow().notNull(),
});

export const insights = pgTable("insights", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  type: text("type").notNull(), // 'trend', 'opportunity', 'alert'
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const insertProductSchema = createInsertSchema(products).omit({ id: true, lastUpdated: true });
export const insertInsightSchema = createInsertSchema(insights).omit({ id: true, createdAt: true });

export type Product = typeof products.$inferSelect;
export type InsertProduct = z.infer<typeof insertProductSchema>;

export type Insight = typeof insights.$inferSelect;
export type InsertInsight = z.infer<typeof insertInsightSchema>;

export type DashboardStats = {
  totalProductsTracked: number;
  averageDemand: number;
  topCategory: string;
};
