import { motion, AnimatePresence } from "framer-motion";
import { type Insight } from "@shared/schema";
import { TrendingUp, Lightbulb, AlertTriangle, Sparkles, Clock } from "lucide-react";
import { clsx } from "clsx";
import { formatDistanceToNow } from "date-fns";

interface InsightFeedProps {
  insights: Insight[];
  isLoading: boolean;
}

const typeConfig = {
  trend: {
    icon: TrendingUp,
    color: "text-primary",
    bg: "bg-primary/10",
    border: "border-primary/20",
    glow: "shadow-[0_0_15px_rgba(0,240,255,0.15)]"
  },
  opportunity: {
    icon: Lightbulb,
    color: "text-secondary",
    bg: "bg-secondary/10",
    border: "border-secondary/20",
    glow: "shadow-[0_0_15px_rgba(189,0,255,0.15)]"
  },
  alert: {
    icon: AlertTriangle,
    color: "text-warning",
    bg: "bg-warning/10",
    border: "border-warning/20",
    glow: "shadow-[0_0_15px_rgba(255,230,0,0.15)]"
  }
};

export function InsightFeed({ insights, isLoading }: InsightFeedProps) {

  if (isLoading) {
    return (
      <div className="glass-panel rounded-2xl p-6 border border-white/10 h-full flex flex-col">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-white/10 rounded w-1/2 mb-6"></div>
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 bg-white/5 rounded-xl border border-white/5 p-4">
              <div className="flex gap-4">
                <div className="w-10 h-10 bg-white/10 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-white/10 rounded w-3/4"></div>
                  <div className="h-3 bg-white/5 rounded w-full"></div>
                  <div className="h-3 bg-white/5 rounded w-5/6"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel rounded-2xl border border-white/10 h-full flex flex-col overflow-hidden">
      <div className="p-6 border-b border-white/5 bg-white/[0.02]">
        <h2 className="text-xl font-display font-semibold flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-secondary" />
          AI Neural Insights
        </h2>
        <p className="text-xs text-muted-foreground mt-1 font-body">Synthesizing global market anomalies</p>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        <AnimatePresence>
          {insights?.length === 0 ? (
             <div className="text-center py-12 text-muted-foreground">
               <Lightbulb className="w-12 h-12 mx-auto mb-3 opacity-20" />
               <p>No insights generated yet.</p>
             </div>
          ) : (
            insights?.map((insight, idx) => {
              const config = typeConfig[insight.type as keyof typeof typeConfig] || typeConfig.trend;
              const Icon = config.icon;
              
              // Handle potentially stringified dates from API
              const dateObj = typeof insight.createdAt === 'string' ? new Date(insight.createdAt) : insight.createdAt;
              
              return (
                <motion.div
                  key={insight.id}
                  initial={{ opacity: 0, scale: 0.95, y: 10 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={clsx(
                    "relative p-5 rounded-xl border bg-black/40 backdrop-blur-sm group hover:bg-black/60 transition-colors",
                    config.border,
                    config.glow
                  )}
                >
                  <div className="flex items-start gap-4">
                    <div className={clsx("p-2.5 rounded-lg shrink-0", config.bg, config.color)}>
                      <Icon className="w-5 h-5" />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between mb-1">
                        <h4 className="font-semibold text-white/90 text-sm tracking-wide">
                          {insight.title}
                        </h4>
                        <span className="text-[10px] uppercase font-bold tracking-widest flex items-center gap-1 text-muted-foreground">
                          <Clock className="w-3 h-3" />
                          {dateObj ? formatDistanceToNow(dateObj, { addSuffix: true }) : 'recent'}
                        </span>
                      </div>
                      <p className="text-sm text-white/60 font-body leading-relaxed mt-2">
                        {insight.content}
                      </p>
                      <div className="mt-3">
                        <span className={clsx("text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded", config.bg, config.color)}>
                          {insight.type}
                        </span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
