import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";
import { clsx } from "clsx";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  trendDirection?: "up" | "down" | "neutral";
  delay?: number;
  color?: "cyan" | "purple" | "green";
}

export function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend, 
  trendDirection, 
  delay = 0,
  color = "cyan" 
}: StatCardProps) {
  
  const colorMap = {
    cyan: "text-primary border-primary/30 bg-primary/5 shadow-primary/10",
    purple: "text-secondary border-secondary/30 bg-secondary/5 shadow-secondary/10",
    green: "text-success border-success/30 bg-success/5 shadow-success/10",
  };

  const selectedColor = colorMap[color];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className="relative group p-[1px] rounded-2xl overflow-hidden"
    >
      {/* Animated gradient border effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent group-hover:opacity-100 transition-opacity" />
      
      <div className="relative h-full glass-panel rounded-2xl p-6 flex flex-col justify-between overflow-hidden">
        
        {/* Background glow */}
        <div className={clsx("absolute -right-6 -top-6 w-32 h-32 blur-[50px] opacity-20 rounded-full", selectedColor.split(' ')[0])} />

        <div className="flex items-start justify-between mb-4">
          <div className="p-3 rounded-xl bg-white/5 border border-white/10">
            <Icon className={clsx("w-6 h-6", selectedColor.split(' ')[0])} />
          </div>
          {trend && (
            <div className={clsx(
              "px-2.5 py-1 rounded-full text-xs font-bold font-body",
              trendDirection === "up" ? "bg-success/20 text-success" : 
              trendDirection === "down" ? "bg-danger/20 text-danger" : 
              "bg-white/10 text-white/70"
            )}>
              {trendDirection === "up" ? "+" : ""}{trend}
            </div>
          )}
        </div>

        <div>
          <h3 className="text-muted-foreground text-sm font-medium uppercase tracking-wider mb-1">{title}</h3>
          <div className="text-4xl font-display font-bold text-white tracking-tight">{value}</div>
        </div>
      </div>
    </motion.div>
  );
}
