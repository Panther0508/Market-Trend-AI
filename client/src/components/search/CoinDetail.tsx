import { motion } from "framer-motion";
import { 
  TrendingUp, 
  TrendingDown, 
  ExternalLink, 
  Github, 
  Globe, 
  BookOpen,
  Calendar,
  Award,
  Users,
  Code,
  LineChart
} from "lucide-react";
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { formatPrice, formatMarketCap, formatPercentage } from "../../hooks/use-crypto";

interface CoinDetailProps {
  coin: any;
  historicalData: any;
  isLoading?: boolean;
  onBack?: () => void;
}

export function CoinDetail({ coin, historicalData, isLoading = false, onBack }: CoinDetailProps) {
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex justify-center items-center py-20"
      >
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </motion.div>
    );
  }

  if (!coin) {
    return null;
  }

  // Prepare chart data
  const chartData = historicalData?.prices?.map((p: any) => ({
    timestamp: p.timestamp,
    price: p.price,
    date: new Date(p.timestamp).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
  })) || [];

  const priceChange = coin.priceChangePercentage24h || 0;
  const isPositive = priceChange >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      {/* Back Button */}
      {onBack && (
        <button
          onClick={onBack}
          className="text-muted-foreground hover:text-white transition-colors"
        >
          ← Back to results
        </button>
      )}

      {/* Header */}
      <div className="glass-panel p-6">
        <div className="flex items-start gap-4 mb-4">
          <img 
            src={coin.image} 
            alt={coin.name}
            className="w-16 h-16 rounded-full"
          />
          <div>
            <h1 className="text-3xl font-display font-bold text-white">{coin.name}</h1>
            <p className="text-lg text-muted-foreground uppercase">{coin.symbol}</p>
          </div>
          <div className="ml-auto text-right">
            <p className="text-2xl font-bold text-white">{formatPrice(coin.currentPrice)}</p>
            <div className={`flex items-center gap-1 ${isPositive ? "text-green-500" : "text-red-500"}`}>
              {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
              <span className="font-bold">{formatPercentage(priceChange)}</span>
              <span className="text-sm text-muted-foreground">24h</span>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 pt-4 border-t border-border">
          <div>
            <p className="text-sm text-muted-foreground">Market Cap</p>
            <p className="text-lg font-bold text-white">{formatMarketCap(coin.marketCap)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Volume (24h)</p>
            <p className="text-lg font-bold text-white">{formatMarketCap(coin.volume24h)}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">Rank</p>
            <p className="text-lg font-bold text-primary">#{coin.marketCapRank}</p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground">All Time High</p>
            <p className="text-lg font-bold text-white">{formatPrice(coin.ath)}</p>
          </div>
        </div>
      </div>

      {/* Price Chart */}
      {chartData.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel p-6"
        >
          <h2 className="flex items-center gap-2 text-xl font-display uppercase text-white mb-4">
            <LineChart className="w-5 h-5 text-primary" />
            7-Day Price History
          </h2>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <RechartsLineChart data={chartData}>
                <XAxis 
                  dataKey="date" 
                  stroke="#666" 
                  fontSize={12}
                  tickLine={false}
                />
                <YAxis 
                  stroke="#666" 
                  fontSize={12}
                  tickLine={false}
                  tickFormatter={(value) => `$${value.toLocaleString()}`}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: "#1a1a1a", 
                    border: "1px solid #333",
                    borderRadius: "8px"
                  }}
                  labelStyle={{ color: "#fff" }}
                  formatter={(value: number) => [formatPrice(value), "Price"]}
                />
                <Line 
                  type="monotone" 
                  dataKey="price" 
                  stroke={isPositive ? "#22c55e" : "#ef4444"} 
                  strokeWidth={2}
                  dot={false}
                />
              </RechartsLineChart>
            </ResponsiveContainer>
          </div>
        </motion.div>
      )}

      {/* Price Changes */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="glass-panel p-6"
      >
        <h2 className="text-xl font-display uppercase text-white mb-4">Price Changes</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className={`p-4 rounded-lg ${isPositive ? "bg-green-500/10" : "bg-red-500/10"}`}>
            <p className="text-sm text-muted-foreground mb-1">24h</p>
            <p className={`text-xl font-bold ${isPositive ? "text-green-500" : "text-red-500"}`}>
              {formatPercentage(coin.priceChangePercentage24h || 0)}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${(coin.priceChangePercentage7d || 0) >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
            <p className="text-sm text-muted-foreground mb-1">7d</p>
            <p className={`text-xl font-bold ${(coin.priceChangePercentage7d || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatPercentage(coin.priceChangePercentage7d || 0)}
            </p>
          </div>
          <div className={`p-4 rounded-lg ${(coin.priceChangePercentage30d || 0) >= 0 ? "bg-green-500/10" : "bg-red-500/10"}`}>
            <p className="text-sm text-muted-foreground mb-1">30d</p>
            <p className={`text-xl font-bold ${(coin.priceChangePercentage30d || 0) >= 0 ? "text-green-500" : "text-red-500"}`}>
              {formatPercentage(coin.priceChangePercentage30d || 0)}
            </p>
          </div>
        </div>
      </motion.div>

      {/* Scores */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-panel p-6"
      >
        <h2 className="text-xl font-display uppercase text-white mb-4">CoinGecko Scores</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
            <Award className="w-8 h-8 text-primary" />
            <div>
              <p className="text-sm text-muted-foreground">CoinGecko</p>
              <p className="text-xl font-bold text-white">{coin.coingeckoScore?.toFixed(1) || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
            <Code className="w-8 h-8 text-blue-500" />
            <div>
              <p className="text-sm text-muted-foreground">Developer</p>
              <p className="text-xl font-bold text-white">{coin.developerScore?.toFixed(1) || "N/A"}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
            <Users className="w-8 h-8 text-purple-500" />
            <div>
              <p className="text-sm text-muted-foreground">Community</p>
              <p className="text-xl font-bold text-white">{coin.communityScore?.toFixed(1) || "N/A"}</p>
            </div>
          </div>
          {coin.genesisDate && (
            <div className="flex items-center gap-3 p-3 bg-background rounded-lg">
              <Calendar className="w-8 h-8 text-orange-500" />
              <div>
                <p className="text-sm text-muted-foreground">Genesis</p>
                <p className="text-lg font-bold text-white">{coin.genesisDate}</p>
              </div>
            </div>
          )}
        </div>
      </motion.div>

      {/* Open Source Links */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
        className="glass-panel p-6"
      >
        <h2 className="flex items-center gap-2 text-xl font-display uppercase text-white mb-4">
          <BookOpen className="w-5 h-5 text-primary" />
          Open Source & Resources
        </h2>
        <div className="flex flex-wrap gap-3">
          {coin.links?.website && (
            <a 
              href={coin.links.website} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg hover:bg-primary/20 transition-colors group"
            >
              <Globe className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              <span className="text-white group-hover:text-primary">Website</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          )}
          {coin.links?.github && (
            <a 
              href={coin.links.github} 
              target="_blank" 
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg hover:bg-primary/20 transition-colors group"
            >
              <Github className="w-5 h-5 text-muted-foreground group-hover:text-primary" />
              <span className="text-white group-hover:text-primary">GitHub</span>
              <ExternalLink className="w-4 h-4 text-muted-foreground" />
            </a>
          )}
          <a 
            href={`https://www.coingecko.com/en/coins/${coin.id}`}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-lg hover:bg-primary/20 transition-colors group"
          >
            <span className="text-primary group-hover:text-white">CoinGecko</span>
            <ExternalLink className="w-4 h-4 text-primary" />
          </a>
          <a 
            href={`https://coinmarketcap.com/currencies/${coin.id}/`}
            target="_blank" 
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-4 py-2 bg-background rounded-lg hover:bg-primary/20 transition-colors group"
          >
            <span className="text-white group-hover:text-primary">CoinMarketCap</span>
            <ExternalLink className="w-4 h-4 text-muted-foreground" />
          </a>
        </div>
      </motion.div>

      {/* Description */}
      {coin.description && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="glass-panel p-6"
        >
          <h2 className="text-xl font-display uppercase text-white mb-4">About</h2>
          <div 
            className="prose prose-invert max-w-none text-muted-foreground"
            dangerouslySetInnerHTML={{ 
              __html: coin.description.slice(0, 500) + (coin.description.length > 500 ? "..." : "") 
            }}
          />
        </motion.div>
      )}
    </motion.div>
  );
}

export default CoinDetail;