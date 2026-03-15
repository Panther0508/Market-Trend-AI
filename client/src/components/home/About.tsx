import { motion } from "framer-motion";
import { Bot, TrendingUp, Globe } from "lucide-react";

export function About() {
    return (
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
    );
}
