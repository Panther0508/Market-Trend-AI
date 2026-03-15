import { motion } from "framer-motion";
import { Link } from "wouter";
import { Package, Lightbulb, Search } from "lucide-react";

type FilterType = "all" | "products" | "insights";

interface SearchResultsProps {
    query: string;
    filter: FilterType;
    data: any;
}

export function SearchResults({ query, filter, data }: SearchResultsProps) {
    if (!query || !data) {
        return (
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
        );
    }

    if (data.totalResults === 0) {
        return (
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
                    {`Found ${data.totalResults} result${data.totalResults !== 1 ? "s" : ""} for "${query}"`}
                </p>
            </motion.div>

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
                            {data.products.map((product: any, index: number) => (
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
                            {data.insights.map((insight: any, index: number) => (
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
        </>
    );
}
