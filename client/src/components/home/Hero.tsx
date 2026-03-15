import { motion } from "framer-motion";
import { Link } from "wouter";
import { Bot, Search, Gauge, ArrowRight, Cpu } from "lucide-react";

export function Hero() {
    return (
        <section className="relative z-10 min-h-[90vh] flex flex-col items-center justify-center px-4 sm:px-6 lg:px-8">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
                className="text-center max-w-5xl mx-auto"
            >
                {/* Badge */}
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, duration: 0.5 }}
                    className="inline-flex items-center gap-2 px-4 py-2 mb-8 border border-primary/30 rounded-full bg-primary/5"
                >
                    <Bot className="w-4 h-4 text-primary" />
                    <span className="text-sm font-medium text-primary">AI-Powered Market Intelligence</span>
                </motion.div>

                {/* Main Title */}
                <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black font-display uppercase tracking-tighter mb-6">
                    <span className="text-white">Market</span>{' '}
                    <span className="text-primary glow-text">Trend AI</span>
                </h1>

                {/* Tagline */}
                <p className="text-xl sm:text-2xl text-muted-foreground font-body mb-8 max-w-3xl mx-auto leading-relaxed">
                    Harness the power of artificial intelligence to discover, analyze, and predict market trends before they happen.
                </p>

                {/* Search Bar */}
                <motion.form
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    onSubmit={(e) => {
                        e.preventDefault();
                        const formData = new FormData(e.currentTarget);
                        const query = formData.get("query") as string;
                        if (query.trim()) {
                            window.location.href = `/search?q=${encodeURIComponent(query)}`;
                        }
                    }}
                    className="max-w-xl mx-auto mb-10 w-full"
                >
                    <div className="relative">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                        <input
                            type="text"
                            name="query"
                            placeholder="Search products, trends, insights..."
                            className="w-full pl-12 pr-32 py-4 bg-card/80 backdrop-blur border border-white/10 rounded-sm text-white placeholder:text-muted-foreground focus:outline-none focus:border-primary"
                        />
                        <button
                            type="submit"
                            className="absolute right-2 top-1/2 -translate-y-1/2 px-6 py-2 bg-primary text-black font-display font-bold uppercase text-sm rounded-sm hover:bg-primary/90 transition-colors"
                        >
                            Search
                        </button>
                    </div>
                </motion.form>

                {/* CTA Buttons */}
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="flex flex-col sm:flex-row items-center justify-center gap-4"
                >
                    <Link href="/dashboard">
                        <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            className="btn-cyber flex items-center gap-3 px-10 py-4 bg-primary text-black rounded-sm shadow-[0_0_30px_rgba(212,175,55,0.3)] hover:shadow-[0_0_50px_rgba(212,175,55,0.5)]"
                        >
                            <Gauge className="w-5 h-5" />
                            Launch Dashboard
                            <ArrowRight className="w-5 h-5" />
                        </motion.button>
                    </Link>

                    <motion.button
                        whileHover={{ scale: 1.05 }}
                        whileTap={{ scale: 0.95 }}
                        className="btn-cyber flex items-center gap-3 px-10 py-4 border border-white/20 text-white hover:bg-white/5 rounded-sm"
                    >
                        <Cpu className="w-5 h-5" />
                        Learn More
                    </motion.button>
                </motion.div>
            </motion.div>

            {/* Scroll Indicator */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 1, duration: 0.5 }}
                className="absolute bottom-10 left-1/2 -translate-x-1/2"
            >
                <motion.div
                    animate={{ y: [0, 10, 0] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                    className="w-6 h-10 border-2 border-white/20 rounded-full flex justify-center pt-2"
                >
                    <div className="w-1 h-2 bg-primary rounded-full" />
                </motion.div>
            </motion.div>
        </section>
    );
}
