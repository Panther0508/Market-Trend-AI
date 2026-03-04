import { Cpu, Activity, RefreshCw } from "lucide-react";
import { useGenerateInsights } from "@/hooks/use-dashboard";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export function CyberHeader() {
  const { mutate, isPending } = useGenerateInsights();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          
          {/* Logo & Title */}
          <div className="flex items-center gap-3">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/30">
              <div className="absolute inset-0 bg-primary/20 animate-pulse rounded-xl blur-md" />
              <Cpu className="w-6 h-6 text-primary relative z-10" />
            </div>
            <div>
              <h1 className="text-2xl font-bold font-display uppercase tracking-wider text-white">
                Nexus<span className="text-primary glow-text">Pulse</span>
              </h1>
              <div className="flex items-center gap-2 text-xs text-primary/70 font-body">
                <Activity className="w-3 h-3 animate-pulse" />
                <span>LIVE MARKET ANALYTICS</span>
              </div>
            </div>
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => mutate()}
            disabled={isPending}
            className={clsx(
              "btn-cyber flex items-center gap-2 px-6 py-3 rounded-lg border",
              isPending 
                ? "bg-muted border-white/10 text-white/50 cursor-not-allowed"
                : "bg-primary/10 border-primary/50 text-primary hover:bg-primary hover:text-primary-foreground hover:shadow-[0_0_20px_rgba(0,240,255,0.4)]"
            )}
          >
            <RefreshCw className={clsx("w-4 h-4", isPending && "animate-spin")} />
            {isPending ? "Analyzing Global Streams..." : "Refresh AI Market Data"}
          </motion.button>
          
        </div>
      </div>
    </header>
  );
}
