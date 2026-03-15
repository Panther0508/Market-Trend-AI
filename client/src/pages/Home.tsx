import { Hero } from "@/components/home/Hero";
import { Features } from "@/components/home/Features";
import { About } from "@/components/home/About";

export default function Home() {
    return (
        <div className="relative overflow-x-hidden">
            {/* Background Effects */}
            <div className="absolute inset-0 cyber-grid z-0 pointer-events-none" />

            {/* Decorative Gradient Orbs */}
            <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none -z-10" />
            <div className="absolute bottom-0 right-1/4 w-[700px] h-[700px] bg-secondary/10 rounded-full blur-[180px] pointer-events-none -z-10" />

            <Hero />
            <Features />
            <About />
        </div>
    );
}
