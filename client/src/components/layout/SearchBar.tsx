import { useState } from "react";
import { useLocation } from "wouter";
import { Search, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface SearchBarProps {
    onSearch?: (query: string) => void;
}

export function SearchBar({ onSearch }: SearchBarProps) {
    const [query, setQuery] = useState("");
    const [isOpen, setIsOpen] = useState(false);
    const [, setLocation] = useLocation();

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (query.trim()) {
            if (onSearch) {
                onSearch(query);
            } else {
                setLocation(`/search?q=${encodeURIComponent(query)}`);
            }
            setIsOpen(false);
        }
    };

    const handleClear = () => {
        setQuery("");
    };

    return (
        <div className="relative">
            <AnimatePresence>
                {isOpen ? (
                    <motion.div
                        initial={{ width: 40, opacity: 0 }}
                        animate={{ width: "100%", opacity: 1 }}
                        exit={{ width: 40, opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="flex items-center"
                    >
                        <form onSubmit={handleSubmit} className="flex-1 flex items-center">
                            <input
                                type="text"
                                value={query}
                                onChange={(e) => setQuery(e.target.value)}
                                placeholder="Search products, insights..."
                                className="w-full bg-background border border-primary/30 rounded-sm px-4 py-2 text-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                                autoFocus
                            />
                            {query && (
                                <button
                                    type="button"
                                    onClick={handleClear}
                                    className="absolute right-12 text-muted-foreground hover:text-white"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                            <button
                                type="submit"
                                className="ml-2 px-4 py-2 bg-primary text-black rounded-sm font-display text-sm font-bold uppercase"
                            >
                                Search
                            </button>
                        </form>
                        <button
                            onClick={() => {
                                setIsOpen(false);
                                setQuery("");
                            }}
                            className="ml-2 text-muted-foreground hover:text-white"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </motion.div>
                ) : (
                    <motion.button
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        onClick={() => setIsOpen(true)}
                        className="flex items-center justify-center w-10 h-10 rounded-sm bg-primary/10 border border-primary/30 hover:bg-primary/20 transition-colors"
                    >
                        <Search className="w-5 h-5 text-primary" />
                    </motion.button>
                )}
            </AnimatePresence>
        </div>
    );
}
