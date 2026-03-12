/**
 * Runtime Error Modal Component
 * 
 * A modal that displays runtime errors in development mode.
 * Functional equivalent to @replit/vite-plugin-runtime-error-modal
 */

import React, { useState, useEffect, useCallback } from 'react';

// Global error state
interface ErrorState {
    hasError: boolean;
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
}

interface RuntimeErrorModalProps {
    maxHeight?: string;
    position?: 'top-right' | 'center';
}

// Error boundary component
export class ErrorBoundary extends React.Component<
    { children: React.ReactNode; fallback?: React.ReactNode },
    ErrorState
> {
    constructor(props: { children: React.ReactNode; fallback?: React.ReactNode }) {
        super(props);
        this.state = { hasError: false, error: null, errorInfo: null };
    }

    static getDerivedStateFromError(error: Error): ErrorState {
        return { hasError: true, error, errorInfo: null };
    }

    componentDidCatch(error: Error, errorInfo: React.ErrorInfo): void {
        this.setState({ error, errorInfo });
        // Log to console for debugging
        console.error('Runtime error caught by boundary:', error, errorInfo);
    }

    render(): React.ReactNode {
        if (this.state.hasError) {
            return this.props.fallback || (
                <RuntimeErrorModal
                    error={this.state.error}
                    errorInfo={this.state.errorInfo}
                />
            );
        }

        return this.props.children;
    }
}

// Modal component
export function RuntimeErrorModal({
    error,
    errorInfo,
    maxHeight = '60vh',
    position = 'center'
}: {
    error: Error | null;
    errorInfo: React.ErrorInfo | null;
} & RuntimeErrorModalProps) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [isVisible, setIsVisible] = useState(true);

    // Only show in development mode
    if (!import.meta.env.DEV) {
        return null;
    }

    if (!error || !isVisible) {
        return null;
    }

    const stackTrace = error.stack || '';
    const componentStack = errorInfo?.componentStack || '';

    const positionClasses = {
        'top-right': 'top-4 right-4 max-w-md',
        'center': 'top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-2xl',
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9998] p-4">
            <div
                className={`
          bg-red-950 border-2 border-red-500 rounded-lg shadow-2xl 
          w-full ${positionClasses[position]}
        `}
            >
                {/* Header */}
                <div className="bg-red-900/50 px-4 py-3 flex items-center justify-between border-b border-red-500/30">
                    <div className="flex items-center gap-2">
                        <span className="text-red-400 text-xl">⚠️</span>
                        <h2 className="text-red-200 font-bold">Runtime Error</h2>
                    </div>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="text-red-400 hover:text-red-200 text-2xl leading-none"
                    >
                        ×
                    </button>
                </div>

                {/* Error Message */}
                <div className="p-4">
                    <div className="bg-red-900/30 rounded p-3 mb-4">
                        <p className="text-red-200 font-mono text-sm break-words">
                            {error.message}
                        </p>
                    </div>

                    {/* Stack Trace Toggle */}
                    <button
                        onClick={() => setIsExpanded(!isExpanded)}
                        className="text-red-400 hover:text-red-200 text-sm underline mb-2"
                    >
                        {isExpanded ? '▼ Hide' : '▶ Show'} Stack Trace
                    </button>

                    {/* Stack Trace */}
                    {isExpanded && (
                        <div
                            className="bg-slate-900 rounded p-3 overflow-auto font-mono text-xs text-red-300"
                            style={{ maxHeight }}
                        >
                            <pre className="whitespace-pre-wrap break-words">
                                {stackTrace || 'No stack trace available'}
                            </pre>
                            {componentStack && (
                                <>
                                    <div className="mt-2 pt-2 border-t border-red-500/20">
                                        <strong>Component Stack:</strong>
                                        <pre className="whitespace-pre-wrap break-words mt-1">
                                            {componentStack}
                                        </pre>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {/* Actions */}
                <div className="px-4 py-3 bg-red-900/20 border-t border-red-500/30 flex gap-2">
                    <button
                        onClick={() => window.location.reload()}
                        className="bg-red-600 hover:bg-red-500 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                        Reload Page
                    </button>
                    <button
                        onClick={() => setIsVisible(false)}
                        className="bg-slate-700 hover:bg-slate-600 text-white px-4 py-2 rounded text-sm font-medium"
                    >
                        Dismiss
                    </button>
                </div>
            </div>
        </div>
    );
}

// Hook for global error handling
export function useErrorHandler() {
    const [error, setError] = useState<Error | null>(null);

    const handleError = useCallback((err: Error) => {
        setError(err);
        console.error('Error caught by handler:', err);
    }, []);

    const clearError = useCallback(() => {
        setError(null);
    }, []);

    return { error, handleError, clearError };
}

export default RuntimeErrorModal;
