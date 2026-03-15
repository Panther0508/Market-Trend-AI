import { motion } from "framer-motion";
import { Search, Filter } from "lucide-react";

type FilterType = "all" | "products" | "insights";

interface SearchFiltersProps {
    query: string;
    filter: FilterType;
    onSearch: (query: string) => void;
    onFilterChange: (filter: FilterType) => void;
}

export function SearchFilters({ query, filter, onSearch, onFilterChange }: SearchFiltersProps) {
    return (
        <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
        >
            <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                onSearch(formData.get("query") as string);
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
                            onClick={() => onFilterChange(f)}
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
    );
}
