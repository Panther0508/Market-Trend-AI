import { useState } from "react";
import { useCryptoNews, useTrendingNews } from "@/hooks/use-news";
import { SearchFilters } from "@/components/search/SearchFilters";
import { NewsList } from "@/components/news/NewsList";
import { TrendingNewsSkeleton } from "@/components/news/NewsSkeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Newspaper, Filter } from "lucide-react";

type SortOption = "relevance" | "popularity" | "recency";

export default function NewsPage() {
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState<SortOption>("recency");

  // Fetch news
  const { data: newsData, isLoading: isLoadingNews, isError: isErrorNews } = useCryptoNews({
    query: query || undefined,
    sortBy
  });

  // Fetch trending news
  const { data: trendingData, isLoading: isLoadingTrending } = useTrendingNews();

  const handleSearch = (newQuery: string) => {
    setQuery(newQuery);
  };

  return (
    <div className="relative overflow-x-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 cyber-grid z-0 pointer-events-none" />
      <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

      {/* Main Content */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-display uppercase text-white mb-2">
            Crypto News
          </h1>
          <p className="text-muted-foreground">
            Stay updated with the latest cryptocurrency news and market insights
          </p>
        </div>

        {/* Search and Filters */}
        <div className="mb-8 space-y-4">
          <SearchFilters 
            query={query} 
            filter="all" 
            onSearch={handleSearch}
            onFilterChange={() => {}}
          />

          {/* Sort Options */}
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Sort by:</span>
            <div className="flex gap-2">
              {(["relevance", "popularity", "recency"] as SortOption[]).map((option) => (
                <button
                  key={option}
                  onClick={() => setSortBy(option)}
                  className={`px-3 py-1 text-sm rounded-sm transition-colors ${
                    sortBy === option
                      ? "bg-primary text-black"
                      : "bg-muted text-muted-foreground hover:text-white"
                  }`}
                >
                  {option.charAt(0).toUpperCase() + option.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* News Tabs */}
        <Tabs defaultValue="latest" className="space-y-6">
          <TabsList className="bg-background border border-border">
            <TabsTrigger 
              value="latest"
              className="data-[state=active]:bg-primary data-[state=active]:text-black"
            >
              <Newspaper className="w-4 h-4 mr-2" />
              Latest
            </TabsTrigger>
            <TabsTrigger 
              value="trending"
              className="data-[state=active]:bg-primary data-[state=active]:text-black"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Trending
            </TabsTrigger>
          </TabsList>

          {/* Latest News Tab */}
          <TabsContent value="latest">
            {isErrorNews ? (
              <div className="text-center py-12 glass-panel">
                <p className="text-red-400 mb-2">Failed to load news</p>
                <p className="text-sm text-muted-foreground">
                  Please check your connection and try again
                </p>
              </div>
            ) : (
              <NewsList
                articles={newsData?.articles || []}
                isLoading={isLoadingNews}
                isFallback={newsData?.isFallback}
                title="Latest Cryptocurrency News"
              />
            )}
          </TabsContent>

          {/* Trending News Tab */}
          <TabsContent value="trending">
            {isLoadingTrending ? (
              <section>
                <h2 className="flex items-center gap-2 text-xl font-display uppercase text-white mb-4">
                  <TrendingUp className="w-5 h-5 text-primary" />
                  Trending Now
                </h2>
                <TrendingNewsSkeleton />
              </section>
            ) : (
              <NewsList
                articles={trendingData?.articles || []}
                isLoading={false}
                isFallback={trendingData?.isFallback}
                title="Trending in Crypto"
              />
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
