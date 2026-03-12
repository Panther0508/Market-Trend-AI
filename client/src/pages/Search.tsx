import { useState, useEffect } from "react";
import { useSearch } from "@/hooks/use-search";
import { SearchBar } from "@/components/SearchBar";
import { Search, Package, Lightbulb, TrendingUp, Filter, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { Link } from "wouter";

type FilterType = "all" | "products" | "insights";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");

    useEffect(() => {
        // Get query from URL
        const params = new URLSearchParams(window.location.search);
        const q = params.get("q") || "";
        setQuery(q);
    }, []);

    const { data, isLoading, error } = useSearch(query, filter);

    const handleSearch = (newQuery: string) => {
        setQuery(newQuery);
        window.history.pushState({}, "", `/search?q=${encodeURIComponent(newQuery)}`);
    };

    return (
        <div className="min-h-screen relative overflow-x-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 cyber-grid z-0 pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

            {/* Header */}
            <header className="sticky top-0 z-50 w-full border-b border-white/5 bg-background/80 backdrop-blur-xl">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-20">
                        <Link href="/">
                            <div className="flex items-center gap-3 cursor-pointer">
                                <div className="relative flex items-center justify-center w-10 h-10 rounded-sm bg-primary/10 border border-primary">
                                    <TrendingUp className="w-5 h-5 text-primary" />
                                </div>
                                <span className="text-xl font-black font-display uppercase tracking-tighter text-white">
                                    GOLDEN<span className="text-primary">EYE</span>
                                </span>
                            </div>
                        </Link>
                        <SearchBar onSearch={handleSearch} />
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                {/* Search Input Section */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="mb-8"
                >
                    <form onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        handleSearch(formData.get("query") as string);
                    }}>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1 relative">
                                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                                <input
                                    name="query"
                                    type="text"
                                    defaultValue={query}
                                    placeholder="Search for products, insights, trends..."
                                    className="w-full pl-12 pr-4 py-4 bg-card border border-white/10 rounded-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                                />
                            </div>
                            <button
                                type="submit"
                                className="px-8 py-4 bg-primary text-black font-display font-bold uppercase rounded-sm hover:bg-primary/90 transition-colors"
                            >
                                Search
                            </button>
                        </div>
                    </form>

                    {/* Filter Tabs */}
                    <div className="flex items-center gap-4 mt-6">
                        <div className="flex items-center gap-2 text-muted-foreground">
                            <Filter className="w-4 h-4" />
                            <span className="text-sm">Filter:</span>
                        </div>
                        <div className="flex gap-2">
                            {(["all", "products", "insights"] as FilterType[]).map((f) => (
                                <button
                                    key={f}
                                    onClick={() => setFilter(f)}
                                    className={`px-4 py-2 rounded-sm text-sm font-display uppercase tracking-wider transition-colors ${filter === f
                                            ? "bg-primary text-black"
                                            : "bg-white/5 text-muted-foreground hover:bg-white/10"
                                        }`}
                                >
                                    {f === "all" ? "All Results" : f}
                                </button>
                            ))}
                        </div>
                    </div>
                </motion.div>

                {/* Results */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <span className="ml-3 text-muted-foreground">Searching...</span>
                    </div>
                ) : error ? (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <p className="text-red-500">Error loading search results. Please try again.</p>
                    </motion.div>
                ) : query && data ? (
                    <>
                        {/* Results Count */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="mb-6"
                        >
                            <p className="text-muted-foreground">
                                {data.totalResults === 0
                                    ? `No results found for "${query}"`
                                    : `Found ${data.totalResults} result${data.totalResults !== 1 ? "s" : ""} for "${query}"`}
                            </p>
                        </motion.div>

                        {data.totalResults === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-20 glass-panel"
                            >
                                <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                                <h3 className="text-xl font-display uppercase text-white mb-2">No Results Found</h3>
                                <p className="text-muted-foreground max-w-md mx-auto">
                                    We couldn't find anything matching your search. Try using different keywords or browse our categories.
                                </p>
                                <Link href="/dashboard">
                                    <button className="mt-6 px-6 py-3 bg-primary text-black font-display font-bold uppercase rounded-sm">
                                        Browse Products
                                    </button>
                                </Link>
                            </motion.div>
                        ) : (
                            <div className="space-y-8">
                                {/* Products Section */}
                                {(filter === "all" || filter === "products") && data.products.length > 0 && (
                                    <motion.section
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                    >
                                        <h2 className="flex items-center gap-2 text-xl font-display uppercase text-white mb-4">
                                            <Package className="w-5 h-5 text-primary" />
                                            Products
                                            <span className="text-sm text-muted-foreground">({data.products.length})</span>
                                        </h2>
                                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                            {data.products.map((product, index) => (
                                                <motion.div
                                                    key={product.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="glass-panel p-4 hover:border-primary/50 transition-colors"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="font-bold text-white">{product.name}</h3>
                                                        <span className="px-2 py-1 bg-primary/20 text-primary text-xs rounded-sm">
                                                            {product.demandScore}/100
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mb-2">{product.category}</p>
                                                    <div className="flex justify-between items-center text-sm">
                                                        <span className={product.trendPercentage.startsWith("+") ? "text-green-500" : "text-red-500"}>
                                                            {product.trendPercentage}
                                                        </span>
                                                        <span className="text-muted-foreground">
                                                            {product.searchVolume.toLocaleString()} searches
                                                        </span>
                                                    </div>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.section>
                                )}

                                {/* Insights Section */}
                                {(filter === "all" || filter === "insights") && data.insights.length > 0 && (
                                    <motion.section
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={filter === "all" && data.products.length > 0 ? "mt-8" : ""}
                                    >
                                        <h2 className="flex items-center gap-2 text-xl font-display uppercase text-white mb-4">
                                            <Lightbulb className="w-5 h-5 text-primary" />
                                            Insights
                                            <span className="text-sm text-muted-foreground">({data.insights.length})</span>
                                        </h2>
                                        <div className="space-y-4">
                                            {data.insights.map((insight, index) => (
                                                <motion.div
                                                    key={insight.id}
                                                    initial={{ opacity: 0, y: 20 }}
                                                    animate={{ opacity: 1, y: 0 }}
                                                    transition={{ delay: index * 0.05 }}
                                                    className="glass-panel p-4 hover:border-primary/50 transition-colors"
                                                >
                                                    <div className="flex justify-between items-start mb-2">
                                                        <h3 className="font-bold text-white">{insight.title}</h3>
                                                        <span className={`px-2 py-1 text-xs rounded-sm ${insight.type === "trend" ? "bg-blue-500/20 text-blue-400" :
                                                                insight.type === "opportunity" ? "bg-green-500/20 text-green-400" :
                                                                    "bg-red-500/20 text-red-400"
                                                            }`}>
                                                            {insight.type}
                                                        </span>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground">{insight.content}</p>
                                                    <p className="text-xs text-muted-foreground mt-2">
                                                        {new Date(insight.createdAt).toLocaleDateString()}
                                                    </p>
                                                </motion.div>
                                            ))}
                                        </div>
                                    </motion.section>
                                )}
                            </div>
                        )}
                    </>
                ) : (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        className="text-center py-20"
                    >
                        <Search className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                        <h3 className="text-xl font-display uppercase text-white mb-2">Search for Anything</h3>
                        <p className="text-muted-foreground max-w-md mx-auto">
                            Enter a search term to find products, insights, and market trends.
                        </p>
                    </motion.div>
                )}
            </main>
        </div>
    );
}
