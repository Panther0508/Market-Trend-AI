import { motion } from "framer-motion";
import { type Product } from "@shared/schema";
import { ArrowUpRight, ArrowDownRight, Search, Activity, Package } from "lucide-react";
import { clsx } from "clsx";
import { useState, useMemo } from "react";

interface ProductGridProps {
  products: Product[];
  isLoading: boolean;
}

export function ProductGrid({ products, isLoading }: ProductGridProps) {
  const [search, setSearch] = useState("");

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase())
    );
  }, [products, search]);
  
  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-white/10 h-full min-h-[400px] flex flex-col">
        <div className="animate-pulse flex space-x-4">
          <div className="flex-1 space-y-6 py-1">
            <div className="h-4 bg-white/10 rounded w-1/4"></div>
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-12 bg-white/5 rounded grid grid-cols-4 gap-4 p-2">
                  <div className="h-full bg-white/5 rounded col-span-1"></div>
                  <div className="h-full bg-white/5 rounded col-span-2"></div>
                  <div className="h-full bg-white/5 rounded col-span-1"></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!products || products.length === 0) {
    return (
      <div className="glass-panel rounded-2xl p-12 border border-white/10 h-full flex flex-col items-center justify-center text-center">
        <Package className="w-16 h-16 text-white/20 mb-4" />
        <h3 className="text-xl font-display font-semibold text-white/70">No Products Tracked</h3>
        <p className="text-muted-foreground mt-2 max-w-sm">Run the AI analysis to discover trending products globally.</p>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-white/10 h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-white/[0.02]">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-display font-semibold flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Global Product Matrix
          </h2>
          <div className="relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search market intelligence..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="bg-black border border-white/10 rounded-sm pl-9 pr-4 py-2 text-sm focus:outline-none focus:border-primary text-white font-body placeholder:text-muted-foreground w-80 transition-all shadow-[0_0_20px_rgba(0,0,0,0.5)]"
            />
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-white/5 bg-black text-xs uppercase tracking-tighter text-muted-foreground font-body">
              <th className="px-6 py-4 font-black">Product / Entity</th>
              <th className="px-6 py-4 font-black">Category</th>
              <th className="px-6 py-4 font-black">Demand Score</th>
              <th className="px-6 py-4 font-black">Trend (7d)</th>
              <th className="px-6 py-4 font-black">Search Vol</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {filteredProducts.map((product, idx) => {
              const trendNum = Number(product.trendPercentage);
              const isPositive = trendNum >= 0;
              
              return (
                <motion.tr 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={product.id} 
                  className="hover:bg-white/[0.02] transition-colors group cursor-default"
                >
                  <td className="px-6 py-4">
                    <div className="font-medium text-white group-hover:text-primary transition-colors">
                      {product.name}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="px-2.5 py-1 rounded-md bg-white/5 border border-white/10 text-xs text-white/70">
                      {product.category}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="w-8 text-sm font-bold font-body">{product.demandScore}</span>
                      <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden w-24">
                        <motion.div 
                          initial={{ width: 0 }}
                          animate={{ width: `${product.demandScore}%` }}
                          transition={{ duration: 1, delay: 0.2 + (idx * 0.1) }}
                          className={clsx(
                            "h-full rounded-full shadow-[0_0_10px_currentColor]",
                            product.demandScore >= 80 ? "bg-primary text-primary" : 
                            product.demandScore >= 50 ? "bg-secondary text-secondary" : 
                            "bg-white/40 text-white/40"
                          )}
                        />
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className={clsx(
                      "flex items-center gap-1.5 text-sm font-bold font-body",
                      isPositive ? "text-success" : "text-danger"
                    )}>
                      {isPositive ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
                      {Math.abs(trendNum)}%
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-white/60 font-body">
                    {product.searchVolume.toLocaleString()}
                  </td>
                </motion.tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
