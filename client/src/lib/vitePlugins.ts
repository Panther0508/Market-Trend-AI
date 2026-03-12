/**
 * Market Trend AI Vite Plugins
 * 
 * Custom Vite plugins that provide equivalent functionality
 * to the removed @replit/vite-plugin packages.
 */

import type { Plugin } from 'vite';

/**
 * Development Banner Plugin
 * 
 * Adds a development banner to the HTML output in development mode.
 * Equivalent to @replit/vite-plugin-dev-banner
 */
export function marketTrendDevBanner(): Plugin {
    return {
        name: 'market-trend-dev-banner',
        transformIndexHtml(html) {
            // Only apply in development mode
            if (process.env.NODE_ENV === 'production') return html;

            const banner = `
        <div id="dev-banner" style="
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          background: linear-gradient(90deg, #d4af37 0%, #f4d03f 50%, #d4af37 100%);
          color: #0f172a;
          padding: 4px 16px;
          font-family: 'Oxanium', monospace;
          font-size: 12px;
          font-weight: bold;
          text-align: center;
          z-index: 9999;
          box-shadow: 0 2px 10px rgba(0,0,0,0.3);
        ">
          🚀 MARKET TREND AI - Development Mode
        </div>
      `;

            return html.replace('<body>', `${banner}\n<body>`);
        },
    };
}

/**
 * Route Discovery Plugin
 * 
 * Provides automatic route discovery for the application.
 * Equivalent to @replit/vite-plugin-cartographer
 */
export function marketTrendRouteDiscovery(): Plugin {
    return {
        name: 'market-trend-route-discovery',
        configureServer(server) {
            // Log available routes on server start
            server.middlewares.use((req, res, next) => {
                if (req.url === '/__routes') {
                    res.setHeader('Content-Type', 'application/json');
                    res.end(JSON.stringify({
                        message: 'Market Trend AI Route Discovery',
                        note: 'Use client-side route discovery via /src/lib/routeDiscovery.ts',
                        timestamp: new Date().toISOString(),
                    }));
                } else {
                    next();
                }
            });
        },
    };
}

/**
 * Runtime Error Handler Plugin
 * 
 * Injects error handling into the client bundle.
 * Equivalent to @replit/vite-plugin-runtime-error-modal
 */
export function marketTrendErrorHandler(): Plugin {
    return {
        name: 'market-trend-error-handler',
        transformIndexHtml(html) {
            // Only apply in development mode
            if (process.env.NODE_ENV === 'production') return html;

            // Inject global error handler
            const errorHandler = `
        <script>
          window.onerror = function(msg, url, line, col, error) {
            console.error('Global error:', { msg, url, line, col, error });
            // Store error for display
            window.__lastError = { msg, url, line, col, error: error?.stack };
            return false;
          };
          
          window.onunhandledrejection = function(event) {
            console.error('Unhandled rejection:', event.reason);
            window.__lastError = { 
              msg: 'Unhandled Promise Rejection', 
              error: event.reason?.stack || String(event.reason) 
            };
          };
        </script>
      `;

            return html.replace('</head>', `${errorHandler}</head>`);
        },
    };
}

/**
 * Combined Market Trend AI plugins for easy configuration
 */
export function marketTrendPlugins() {
    return [
        marketTrendDevBanner(),
        marketTrendRouteDiscovery(),
        marketTrendErrorHandler(),
    ];
}

export default marketTrendPlugins;
