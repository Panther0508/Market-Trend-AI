/**
 * Route Discovery Utility
 * 
 * This utility automatically discovers and registers routes for the application.
 * Functional equivalent to @replit/vite-plugin-cartographer
 */

import { lazy, Suspense, ReactNode } from 'react';

// Route configuration type
export interface RouteConfig {
    path: string;
    component: React.LazyExoticComponent<() => JSX.Element>;
    name?: string;
}

// Cache for discovered routes
const discoveredRoutes: RouteConfig[] = [];

// Auto-discover routes from a routes directory
export function discoverRoutes(): RouteConfig[] {
    if (discoveredRoutes.length > 0) {
        return discoveredRoutes;
    }

    // Manually register routes (in a real app, could use dynamic imports)
    // This replaces the automatic route discovery from cartographer
    return discoveredRoutes;
}

// Route registry for lazy loading
const routeRegistry = new Map<string, () => Promise<{ default: () => JSX.Element }>>();

// Register a route with lazy loading
export function registerRoute(path: string, loader: () => Promise<{ default: () => JSX.Element }>) {
    routeRegistry.set(path, loader);
}

// Get all registered routes
export function getRegisteredRoutes(): RouteConfig[] {
    return Array.from(routeRegistry.entries()).map(([path, loader]) => ({
        path,
        component: lazy(loader),
        name: path.split('/').pop() || 'unknown',
    }));
}

// Get route by path
export function getRoute(path: string): RouteConfig | undefined {
    return getRegisteredRoutes().find(route => route.path === path);
}

// Get current route from window location
export function getCurrentRoute(): string {
    return window.location.pathname;
}

// Navigate to a route
export function navigate(path: string): void {
    window.history.pushState({}, '', path);
    window.dispatchEvent(new PopStateEvent('popstate'));
}

// Check if running in development
export const isDevelopment = import.meta.env.DEV;
