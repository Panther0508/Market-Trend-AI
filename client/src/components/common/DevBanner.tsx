/**
 * Development Banner Component
 * 
 * A banner that displays in development mode.
 * Functional equivalent to @replit/vite-plugin-dev-banner
 */

import { useState, useEffect } from 'react';

interface DevBannerProps {
    title?: string;
    variant?: 'info' | 'warning' | 'success';
    position?: 'top' | 'bottom';
}

export function DevBanner({
    title = 'Development Mode',
    variant = 'warning',
    position = 'top'
}: DevBannerProps) {
    const [isVisible, setIsVisible] = useState(true);
    const [isDismissed, setIsDismissed] = useState(false);

    // Only show in development mode
    if (!import.meta.env.DEV || isDismissed) {
        return null;
    }

    const variantStyles = {
        info: 'bg-blue-600 text-white',
        warning: 'bg-yellow-600 text-black',
        success: 'bg-green-600 text-white',
    };

    return (
        <div
            className={`
        ${variantStyles[variant]}
        ${position === 'top' ? 'top-0' : 'bottom-0'}
        left-0 right-0 z-[9999] py-2 px-4 flex items-center justify-between
        transition-transform duration-300
        ${isVisible ? 'translate-y-0' : '-translate-y-full'}
      `}
        >
            <div className="flex items-center gap-2">
                <span className="font-mono text-sm font-bold">
                    {title}
                </span>
                <span className="text-xs opacity-80">
                    Running in development mode
                </span>
            </div>
            <button
                onClick={() => {
                    setIsVisible(false);
                    setIsDismissed(true);
                }}
                className="text-lg leading-none hover:opacity-70 transition-opacity"
                aria-label="Dismiss banner"
            >
                ×
            </button>
        </div>
    );
}

// Environment info component
export function EnvironmentInfo() {
    const [env, setEnv] = useState({
        mode: '',
        version: '',
        timestamp: '',
    });

    useEffect(() => {
        setEnv({
            mode: import.meta.env.MODE,
            version: '1.0.0',
            timestamp: new Date().toISOString(),
        });
    }, []);

    if (!import.meta.env.DEV) {
        return null;
    }

    return (
        <div className="fixed bottom-4 right-4 bg-slate-900/90 border border-yellow-500/30 rounded-lg p-3 text-xs text-yellow-500 z-50 font-mono">
            <div className="font-bold mb-1">DEV</div>
            <div>Mode: {env.mode}</div>
            <div>v: {env.version}</div>
        </div>
    );
}

export default DevBanner;
