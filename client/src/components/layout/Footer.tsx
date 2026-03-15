import { Link } from "wouter";
import { Cpu } from "lucide-react";

export function Footer() {
    return (
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
    );
}
