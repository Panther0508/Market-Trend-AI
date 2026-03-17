import { motion } from "framer-motion";
import { ExternalLink, TrendingUp, Clock, AlertCircle } from "lucide-react";
import { formatRelativeTime, getSentimentBadgeColor, type NewsArticle } from "@/hooks/use-news";
import { NewsSkeleton } from "./NewsSkeleton";

interface NewsListProps {
  articles: NewsArticle[];
  isLoading?: boolean;
  isFallback?: boolean;
  title?: string;
}

export function NewsList({ 
  articles, 
  isLoading = false, 
  isFallback = false,
  title = "Latest News" 
}: NewsListProps) {
  // Loading state
  if (isLoading) {
    return (
      <section>
        <h2 className="flex items-center gap-2 text-xl font-display uppercase text-white mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          {title}
        </h2>
        <NewsSkeleton count={5} />
      </section>
    );
  }

  // Empty state
  if (!articles || articles.length === 0) {
    return (
      <section>
        <h2 className="flex items-center gap-2 text-xl font-display uppercase text-white mb-4">
          <TrendingUp className="w-5 h-5 text-primary" />
          {title}
        </h2>
        <div className="text-center py-12 glass-panel">
          <AlertCircle className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-display text-white mb-2">No News Available</h3>
          <p className="text-muted-foreground">Try again later for the latest updates.</p>
        </div>
      </section>
    );
  }

  return (
    <section>
      {/* Header with fallback indicator */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="flex items-center gap-2 text-xl font-display uppercase text-white">
          <TrendingUp className="w-5 h-5 text-primary" />
          {title}
        </h2>
        {isFallback && (
          <div className="flex items-center gap-1 text-xs text-amber-400">
            <AlertCircle className="w-3 h-3" />
            <span>Showing cached data</span>
          </div>
        )}
      </div>

      {/* News list */}
      <div className="space-y-4">
        {articles.map((article, index) => (
          <motion.article
            key={article.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.05 }}
            className="glass-panel p-4 hover:border-primary/30 transition-colors group"
          >
            <div className="flex gap-4">
              {/* Image */}
              {article.imageUrl && (
                <div className="flex-shrink-0">
                  <img
                    src={article.imageUrl}
                    alt={article.title}
                    className="w-24 h-24 rounded-lg object-cover"
                    onError={(e) => {
                      // Hide image on error
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                </div>
              )}
              
              {/* Content */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-white group-hover:text-primary transition-colors line-clamp-2 mb-2">
                  {article.title}
                </h3>
                
                <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                  {article.description}
                </p>
                
                {/* Meta */}
                <div className="flex flex-wrap items-center gap-3 text-xs">
                  <span className="text-muted-foreground flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {formatRelativeTime(article.publishedAt)}
                  </span>
                  
                  <span className="text-muted-foreground">
                    {article.source}
                  </span>
                  
                  {article.sentiment && (
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${getSentimentBadgeColor(article.sentiment)}`}>
                      {article.sentiment}
                    </span>
                  )}
                  
                  <a
                    href={article.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="ml-auto flex items-center gap-1 text-primary hover:underline"
                  >
                    Read more
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
                
                {/* Categories */}
                {article.categories && article.categories.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {article.categories.slice(0, 3).map((category, i) => (
                      <span 
                        key={i}
                        className="text-xs px-2 py-0.5 bg-muted rounded text-muted-foreground"
                      >
                        {category}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </motion.article>
        ))}
      </div>
    </section>
  );
}

export default NewsList;
