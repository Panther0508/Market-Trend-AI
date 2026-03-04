import { CyberHeader } from "@/components/layout/CyberHeader";
import { StatCard } from "@/components/dashboard/StatCard";
import { ProductGrid } from "@/components/dashboard/ProductGrid";
import { InsightFeed } from "@/components/dashboard/InsightFeed";
import { useStats, useProducts, useInsights } from "@/hooks/use-dashboard";
import { Database, TrendingUp, Target } from "lucide-react";
import { motion } from "framer-motion";

export function Dashboard() {
  const { data: stats, isLoading: statsLoading } = useStats();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: insights = [], isLoading: insightsLoading } = useInsights();

  return (
    <div className="min-h-screen relative overflow-x-hidden">
      {/* Background Cyber Grid */}
      <div className="absolute inset-0 cyber-grid z-0 pointer-events-none" />
      
      {/* Decorative Gradient Orbs */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/20 rounded-full blur-[120px] pointer-events-none -z-10" />
      <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-[150px] pointer-events-none -z-10" />

      <CyberHeader />

      <main className="relative z-10 max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
        
        {/* Top Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <StatCard 
            title="Total Products Tracked"
            value={statsLoading ? "..." : stats?.totalProductsTracked || 0}
            icon={Database}
            color="cyan"
            delay={0.1}
          />
          <StatCard 
            title="Avg Market Demand"
            value={statsLoading ? "..." : `${stats?.averageDemand || 0}/100`}
            icon={TrendingUp}
            trend="12.5%"
            trendDirection="up"
            color="green"
            delay={0.2}
          />
          <StatCard 
            title="Top Surging Category"
            value={statsLoading ? "..." : stats?.topCategory || "Unknown"}
            icon={Target}
            color="purple"
            delay={0.3}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
            className="lg:col-span-2 h-[700px]"
          >
            <ProductGrid products={products} isLoading={productsLoading} />
          </motion.div>
          
          <motion.div 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.6 }}
            className="lg:col-span-1 h-[700px]"
          >
            <InsightFeed insights={insights} isLoading={insightsLoading} />
          </motion.div>
          
        </div>
      </main>
    </div>
  );
}
