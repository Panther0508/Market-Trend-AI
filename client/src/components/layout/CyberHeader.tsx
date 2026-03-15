import { Cpu, Activity, RefreshCw } from "lucide-react";
import { useGenerateInsights } from "@/hooks/use-dashboard";
import { SearchBar } from "./SearchBar";
import { motion } from "framer-motion";
import { clsx } from "clsx";

export function CyberHeader() {
  const { mutate, isPending } = useGenerateInsights();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
      <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-20 gap-4">

          {/* Logo & Title */}
          <div className="flex items-center gap-3 flex-shrink-0">
            <div className="relative flex items-center justify-center w-12 h-12 rounded-sm bg-primary/10 border border-primary">
              <div className="absolute inset-0 bg-primary/10 animate-pulse rounded-sm blur-sm" />
              <Cpu className="w-6 h-6 text-primary relative z-10" />
            </div>
            <div className="hidden sm:block">
              <h1 className="text-2xl font-black font-display uppercase tracking-tighter text-white">
                GOLDEN<span className="text-primary glow-text">EYE</span>
              </h1>
              <div className="flex items-center gap-2 text-[10px] text-primary font-black tracking-widest uppercase">
                <Activity className="w-3 h-3" />
                <span>Premium Market Intelligence</span>
              </div>
            </div>
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md hidden md:block">
            <SearchBar />
          </div>

          {/* Action Button */}
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => mutate()}
            disabled={isPending}
            className={clsx(
              "btn-cyber flex items-center gap-2 px-8 py-3 rounded-sm border-none shadow-xl flex-shrink-0",
              isPending
                ? "bg-muted text-white/50 cursor-not-allowed"
                : "bg-primary text-black hover:shadow-[0_0_30px_rgba(212,175,55,0.4)]"
            )}
          >
            <RefreshCw className={clsx("w-4 h-4", isPending && "animate-spin")} />
            {isPending ? "Syncing..." : "Update"}
          </motion.button>

        </div>
      </div>
    </header>
  );
}
