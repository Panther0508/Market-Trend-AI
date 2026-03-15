import { useState, useEffect } from "react";
import { useSearch } from "@/hooks/use-search";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResults } from "@/components/search/SearchResults";
import { Loader2 } from "lucide-react";

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
        <div className="relative overflow-x-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 cyber-grid z-0 pointer-events-none" />
            <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none -z-10" />

            {/* Main Content */}
            <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <SearchFilters 
                    query={query} 
                    filter={filter} 
                    onSearch={handleSearch} 
                    onFilterChange={setFilter} 
                />

                {/* Results Section */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-20">
                        <Loader2 className="w-8 h-8 text-primary animate-spin" />
                        <span className="ml-3 text-muted-foreground">Searching...</span>
                    </div>
                ) : error ? (
                    <div className="text-center py-20">
                        <p className="text-red-500">Error loading search results. Please try again.</p>
                    </div>
                ) : (
                    <SearchResults query={query} filter={filter} data={data} />
                )}
            </main>
        </div>
    );
}
