import { motion } from "framer-motion";
import {
    BrainCircuit,
    TrendingUp,
    Globe,
    Zap,
    Shield,
    LineChart
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

export function Features() {
    return (
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
    );
}
