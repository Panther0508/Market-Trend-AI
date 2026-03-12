import { motion } from "framer-motion";
import { Link } from "wouter";
import { Search } from "lucide-react";
import {
    Cpu,
    TrendingUp,
    BrainCircuit,
    Zap,
    Globe,
    Shield,
    ArrowRight,
    LineChart,
    Bot,
    Gauge
} from "lucide-react";

const features = [
    {
        icon: BrainCircuit,
        title: "AI-Powered Analysis",
        description: "Advanced machine learning algorithms analyze millions of data points to identify emerging market trends in real-time."
    },
    {
        icon: TrendingUp,
        title: "Predictive Analytics",
        description: "Forecast market movements with 95%+ accuracy using our proprietary prediction models trained on historical data."
    },
    {
        icon: Globe,
        title: "Global Coverage",
        description: "Monitor trends across 150+ countries with localized insights and cultural market awareness."
    },
    {
        icon: Zap,
        title: "Real-Time Updates",
        description: "Instantaneous data processing ensures you never miss a critical market shift or emerging opportunity."
    },
    {
        icon: Shield,
        title: "Enterprise Security",
        description: "Bank-grade encryption and compliance with international data protection standards keep your insights secure."
    },
    {
        icon: LineChart,
        title: "Visual Dashboards",
        description: "Beautiful, interactive visualizations make complex data easy to understand and act upon."
    }
];

export default function Home() {
    return (
        <div className="min-h-screen relative overflow-x-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 cyber-grid z-0 pointer-events-none" />

            {/* Decorative Gradient Orbs */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-secondary/10 rounded-full blur-[180px] pointer-events-none -z-10" />

            {/* Hero Section */}
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

            {/* Features Section */}
            <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8">
                <div className="max-w-7xl mx-auto">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                        className="text-center mb-16"
                    >
                        <h2 className="text-4xl sm:text-5xl font-black font-display uppercase tracking-tighter text-white mb-4">
                            Powerful <span className="text-primary">Features</span>
                        </h2>
                        <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                            Everything you need to stay ahead of market trends and make data-driven decisions.
                        </p>
                    </motion.div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {features.map((feature, index) => (
                            <motion.div
                                key={feature.title}
                                initial={{ opacity: 0, y: 30 }}
                                whileInView={{ opacity: 1, y: 0 }}
                                viewport={{ once: true }}
                                transition={{ delay: index * 0.1, duration: 0.5 }}
                                className="glass-panel p-8 group hover:border-primary/50 transition-colors"
                            >
                                <div className="w-14 h-14 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center mb-6 group-hover:bg-primary/20 group-hover:border-primary transition-all">
                                    <feature.icon className="w-7 h-7 text-primary" />
                                </div>
                                <h3 className="text-xl font-bold font-display uppercase tracking-tight text-white mb-3">
                                    {feature.title}
                                </h3>
                                <p className="text-muted-foreground font-body leading-relaxed">
                                    {feature.description}
                                </p>
                            </motion.div>
                        ))}
                    </div>
                </div>
            </section>

            {/* About Section */}
            <section className="relative z-10 py-24 px-4 sm:px-6 lg:px-8 bg-white/5">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
                        <motion.div
                            initial={{ opacity: 0, x: -30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6 }}
                        >
                            <h2 className="text-4xl sm:text-5xl font-black font-display uppercase tracking-tighter text-white mb-6">
                                About <span className="text-primary">Market Trend AI</span>
                            </h2>
                            <div className="space-y-4 text-muted-foreground font-body leading-relaxed">
                                <p>
                                    Market Trend AI is a cutting-edge platform that combines advanced artificial intelligence
                                    with deep market expertise to deliver unparalleled insights into global market trends.
                                </p>
                                <p>
                                    Our mission is to democratize access to sophisticated market intelligence, empowering
                                    businesses of all sizes to make smarter, data-driven decisions.
                                </p>
                                <p>
                                    Founded by a team of AI researchers and financial analysts, we process over 10 million
                                    data points daily to identify emerging patterns and predict market movements before
                                    they become mainstream.
                                </p>
                            </div>

                            <div className="grid grid-cols-3 gap-8 mt-10">
                                <div className="text-center">
                                    <div className="text-3xl sm:text-4xl font-black font-display text-primary">10M+</div>
                                    <div className="text-sm text-muted-foreground mt-1">Data Points/Day</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl sm:text-4xl font-black font-display text-primary">150+</div>
                                    <div className="text-sm text-muted-foreground mt-1">Countries</div>
                                </div>
                                <div className="text-center">
                                    <div className="text-3xl sm:text-4xl font-black font-display text-primary">99.9%</div>
                                    <div className="text-sm text-muted-foreground mt-1">Uptime</div>
                                </div>
                            </div>
                        </motion.div>

                        <motion.div
                            initial={{ opacity: 0, x: 30 }}
                            whileInView={{ opacity: 1, x: 0 }}
                            viewport={{ once: true }}
                            transition={{ duration: 0.6, delay: 0.2 }}
                            className="relative"
                        >
                            <div className="relative glass-panel p-8 rounded-sm border border-primary/20">
                                <div className="absolute -top-4 -left-4 w-20 h-20 bg-primary/20 rounded-full blur-2xl" />
                                <div className="absolute -bottom-4 -right-4 w-24 h-24 bg-primary/10 rounded-full blur-2xl" />

                                <div className="relative space-y-6">
                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                                            <Bot className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1">Intelligent Processing</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Our AI models continuously learn and adapt to new market conditions, improving accuracy over time.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                                            <TrendingUp className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1">Actionable Insights</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Clear, actionable recommendations help you make informed decisions quickly.
                                            </p>
                                        </div>
                                    </div>

                                    <div className="flex items-start gap-4">
                                        <div className="w-12 h-12 rounded-sm bg-primary/10 border border-primary/30 flex items-center justify-center flex-shrink-0">
                                            <Globe className="w-6 h-6 text-primary" />
                                        </div>
                                        <div>
                                            <h4 className="text-lg font-bold text-white mb-1">Global Perspective</h4>
                                            <p className="text-sm text-muted-foreground">
                                                Comprehensive coverage across all major markets and emerging economies.
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="relative z-10 py-12 px-4 sm:px-6 lg:px-8 border-t border-white/10">
                <div className="max-w-7xl mx-auto">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
                        {/* Brand */}
                        <div className="md:col-span-2">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="w-10 h-10 rounded-sm bg-primary/10 border border-primary flex items-center justify-center">
                                    <Cpu className="w-5 h-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="text-xl font-black font-display uppercase tracking-tighter text-white">
                                        GOLDEN<span className="text-primary">EYE</span>
                                    </h3>
                                </div>
                            </div>
                            <p className="text-muted-foreground font-body text-sm max-w-md">
                                Advanced AI-powered market trend analysis platform. Stay ahead of the curve with predictive insights.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-sm font-bold font-display uppercase tracking-wider text-white mb-4">
                                Quick Links
                            </h4>
                            <ul className="space-y-2">
                                <li>
                                    <Link href="/dashboard">
                                        <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors text-sm font-body">
                                            Dashboard
                                        </span>
                                    </Link>
                                </li>
                                <li>
                                    <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors text-sm font-body">
                                        Documentation
                                    </span>
                                </li>
                                <li>
                                    <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors text-sm font-body">
                                        API Reference
                                    </span>
                                </li>
                                <li>
                                    <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors text-sm font-body">
                                        Support
                                    </span>
                                </li>
                            </ul>
                        </div>

                        {/* Legal */}
                        <div>
                            <h4 className="text-sm font-bold font-display uppercase tracking-wider text-white mb-4">
                                Legal
                            </h4>
                            <ul className="space-y-2">
                                <li>
                                    <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors text-sm font-body">
                                        Privacy Policy
                                    </span>
                                </li>
                                <li>
                                    <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors text-sm font-body">
                                        Terms of Service
                                    </span>
                                </li>
                                <li>
                                    <span className="text-muted-foreground hover:text-primary cursor-pointer transition-colors text-sm font-body">
                                        Cookie Policy
                                    </span>
                                </li>
                            </ul>
                        </div>
                    </div>

                    {/* Bottom Bar */}
                    <div className="pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm text-muted-foreground font-body">
                            © 2024 Market Trend AI. All rights reserved.
                        </p>
                        <div className="flex items-center gap-6">
                            <span className="text-xs text-muted-foreground font-body">
                                Powered by Advanced AI
                            </span>
                        </div>
                    </div>
                </div>
            </footer>
        </div>
    );
}
