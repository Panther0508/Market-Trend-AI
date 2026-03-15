import { motion } from "framer-motion";
import { TrendingUp, TrendingDown, ExternalLink, Github, Globe, Search } from "lucide-react";
import { formatPrice, formatMarketCap, formatPercentage } from "../../hooks/use-crypto";

interface CryptoSearchResultsProps {
  query: string;
  data: any;
  isLoading?: boolean;
  onCoinSelect?: (coinId: string) => void;
}

export function CryptoSearchResults({ 
  query, 
  data, 
  isLoading = false,
  onCoinSelect 
}: CryptoSearchResultsProps) {
  // Loading state
  if (isLoading) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <div className="flex justify-center items-center gap-2">
          <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          <span className="text-muted-foreground">Loading cryptocurrency data...</span>
        </div>
      </motion.div>
    );
  }

  // Empty state
  if (!data || (data.totalResults === 0 && !query)) {
    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="text-center py-20"
      >
        <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-display uppercase text-white mb-2">
          Search Cryptocurrencies
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          Search for any cryptocurrency to see prices, market data, and open-source links.
        </p>
      </motion.div>
    );
  }

  // No results
  if (data.totalResults === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center py-20 glass-panel"
      >
        <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
        <h3 className="text-xl font-display uppercase text-white mb-2">
          No Results Found
        </h3>
        <p className="text-muted-foreground max-w-md mx-auto">
          No cryptocurrencies found matching "{query}". Try a different search term.
        </p>
      </motion.div>
    );
  }

  return (
    <>
      {/* Results Count */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="mb-6"
      >
        <p className="text-muted-foreground">
          {query 
            ? `Found ${data.totalResults} result${data.totalResults !== 1 ? "s" : ""} for "${query}"`
            : `Showing ${data.totalResults} popular cryptocurrencies`
          }
        </p>
      </motion.div>

      {/* Global Market Data */}
      {data.globalData && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <div className="glass-panel p-4">
            <h2 className="text-lg font-display uppercase text-white mb-4">
              Global Market Overview
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Total Market Cap</p>
                <p className="text-lg font-bold text-white">
                  {formatMarketCap(data.globalData.total_market_cap?.usd || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">24h Volume</p>
                <p className="text-lg font-bold text-white">
                  {formatMarketCap(data.globalData.total_volume?.usd || 0)}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Active Cryptos</p>
                <p className="text-lg font-bold text-white">
                  {data.globalData.active_cryptocurrencies?.toLocaleString() || "N/A"}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">BTC Dominance</p>
                <p className="text-lg font-bold text-primary">
                  {data.globalData.market_cap_percentage?.btc?.toFixed(1) || "N/A"}%
                </p>
              </div>
            </div>
          </div>
        </motion.section>
      )}

      {/* Trending Coins */}
      {data.trending && data.trending.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h2 className="flex items-center gap-2 text-xl font-display uppercase text-white mb-4">
            <TrendingUp className="w-5 h-5 text-primary" />
            Trending
            <span className="text-sm text-muted-foreground">({data.trending.length})</span>
          </h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {data.trending.slice(0, 10).map((coin: any, index: number) => (
              <motion.div
                key={coin.item?.id || index}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                onClick={() => onCoinSelect?.(coin.item?.id)}
                className="flex-shrink-0 glass-panel p-4 min-w-[180px] cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <img 
                    src={coin.item?.thumb} 
                    alt={coin.item?.name}
                    className="w-6 h-6 rounded-full"
                  />
                  <span className="font-bold text-white">{coin.item?.symbol?.toUpperCase()}</span>
                </div>
                <p className="text-sm text-muted-foreground truncate">{coin.item?.name}</p>
                <p className="text-sm text-primary mt-1">
                  #{coin.item?.market_cap_rank || "N/A"}
                </p>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Search Results */}
      {data.coins && data.coins.length > 0 && (
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h2 className="flex items-center gap-2 text-xl font-display uppercase text-white mb-4">
            <Search className="w-5 h-5 text-primary" />
            {query ? "Search Results" : "Top Cryptocurrencies"}
            <span className="text-sm text-muted-foreground">({data.coins.length})</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {data.coins.map((coin: any, index: number) => (
              <motion.div
                key={coin.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.03 }}
                onClick={() => onCoinSelect?.(coin.id)}
                className="glass-panel p-4 cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="flex items-start gap-3 mb-3">
                  <img 
                    src={coin.large || coin.thumb} 
                    alt={coin.name}
                    className="w-10 h-10 rounded-full"
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-white truncate">{coin.name}</h3>
                    <p className="text-sm text-muted-foreground uppercase">{coin.symbol}</p>
                  </div>
                  {coin.market_cap_rank && (
                    <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-sm">
                      #{coin.market_cap_rank}
                    </span>
                  )}
                </div>
                
                {/* Quick Links */}
                <div className="flex gap-2 mt-3 pt-3 border-t border-border">
                  {coin.links?.github && (
                    <a 
                      href={coin.links.github} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
                    >
                      <Github className="w-3 h-3" />
                      GitHub
                    </a>
                  )}
                  {coin.links?.website && (
                    <a 
                      href={coin.links.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-white transition-colors"
                    >
                      <Globe className="w-3 h-3" />
                      Website
                    </a>
                  )}
                  {coin.links?.website && (
                    <a 
                      href={`https://www.coingecko.com/en/coins/${coin.id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      onClick={(e) => e.stopPropagation()}
                      className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors ml-auto"
                    >
                      <ExternalLink className="w-3 h-3" />
                      CoinGecko
                    </a>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </motion.section>
      )}
    </>
  );
}

export default CryptoSearchResults;