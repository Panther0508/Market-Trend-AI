import { useState, useEffect } from "react";
import { useSearch } from "@/hooks/use-search";
import { useCryptoSearch, useCoinDetail, useHistoricalData } from "@/hooks/use-crypto";
import { SearchFilters } from "@/components/search/SearchFilters";
import { SearchResults } from "@/components/search/SearchResults";
import { CryptoSearchResults } from "@/components/search/CryptoSearchResults";
import { CoinDetail } from "@/components/search/CoinDetail";
import { Loader2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

type FilterType = "all" | "products" | "insights";
type SearchTabType = "products" | "crypto";

export default function SearchPage() {
    const [query, setQuery] = useState("");
    const [filter, setFilter] = useState<FilterType>("all");
    const [searchTab, setSearchTab] = useState<SearchTabType>("products");
    const [selectedCoin, setSelectedCoin] = useState<string | null>(null);

    useEffect(() => {
        // Get query from URL
        const params = new URLSearchParams(window.location.search);
        const q = params.get("q") || "";
        setQuery(q);
    }, []);

    // Product/Insight search
    const { data: searchData, isLoading: isLoadingSearch, error: searchError } = useSearch(query, filter);
    
    // Crypto search
    const { data: cryptoData, isLoading: isLoadingCrypto } = useCryptoSearch(query);
    
    // Coin details (when a coin is selected)
    const { data: coinDetail, isLoading: isLoadingDetail } = useCoinDetail(selectedCoin);
    const { data: historicalData } = useHistoricalData(selectedCoin, 7);

    const handleSearch = (newQuery: string) => {
        setQuery(newQuery);
        setSelectedCoin(null); // Clear selected coin on new search
        window.history.pushState({}, "", `/search?q=${encodeURIComponent(newQuery)}`);
    };

    const handleCoinSelect = (coinId: string) => {
        setSelectedCoin(coinId);
    };

    const handleBackToResults = () => {
        setSelectedCoin(null);
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

                {/* Search Tabs */}
                <Tabs 
                    defaultValue="products" 
                    onValueChange={(value) => {
                        setSearchTab(value as SearchTabType);
                        setSelectedCoin(null);
                    }}
                    className="mt-6"
                >
                    <TabsList className="bg-background border border-border">
                        <TabsTrigger 
                            value="products"
                            className="data-[state=active]:bg-primary data-[state=active]:text-black"
                        >
                            Products & Insights
                        </TabsTrigger>
                        <TabsTrigger 
                            value="crypto"
                            className="data-[state=active]:bg-primary data-[state=active]:text-black"
                        >
                            cryptocurrency
                        </TabsTrigger>
                    </TabsList>

                    {/* Products/Insights Tab */}
                    <TabsContent value="products">
                        {isLoadingSearch ? (
                            <div className="flex items-center justify-center py-20">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                                <span className="ml-3 text-muted-foreground">Searching...</span>
                            </div>
                        ) : searchError ? (
                            <div className="text-center py-20">
                                <p className="text-red-500">Error loading search results. Please try again.</p>
                            </div>
                        ) : (
                            <SearchResults query={query} filter={filter} data={searchData} />
                        )}
                    </TabsContent>

                    {/* Crypto Tab */}
                    <TabsContent value="crypto">
                        {selectedCoin && coinDetail ? (
                            <CoinDetail 
                                coin={coinDetail}
                                historicalData={historicalData}
                                isLoading={isLoadingDetail}
                                onBack={handleBackToResults}
                            />
                        ) : (
                            <CryptoSearchResults 
                                query={query}
                                data={cryptoData}
                                isLoading={isLoadingCrypto}
                                onCoinSelect={handleCoinSelect}
                            />
                        )}
                    </TabsContent>
                </Tabs>
            </main>
        </div>
    );
}
