/**
 * Market AI API Configuration
 * Central configuration management for the entire API system
 */

export interface ApiConfig {
    port: number;
    environment: 'development' | 'production' | 'test';
    api: {
        prefix: string;
        version: string;
        rateLimit: {
            windowMs: number;
            maxRequests: number;
        };
        cors: {
            origin: string | string[];
            credentials: boolean;
        };
    };
    auth: {
        apiKeyHeader: string;
        jwtSecret: string;
        jwtExpiry: string;
        apiKeyPrefix: string;
    };
    market: {
        defaultVolatility: number;
        defaultLiquidity: number;
        priceUpdateInterval: number;
        maxHistoricalDays: number;
        simulationModes: string[];
        assetTypes: string[];
    };
    cache: {
        enabled: boolean;
        ttl: number;
        maxSize: number;
    };
    logging: {
        level: 'debug' | 'info' | 'warn' | 'error';
        format: 'json' | 'text';
        filePath?: string;
    };
    websocket: {
        enabled: boolean;
        pingInterval: number;
        pingTimeout: number;
    };
    webhooks: {
        enabled: boolean;
        retryAttempts: number;
        retryDelay: number;
    };
    database: {
        type: 'memory' | 'sqlite' | 'postgres';
        filename?: string;
    };
    analytics: {
        enabled: boolean;
        retentionDays: number;
    };
}

export const config: ApiConfig = {
    port: parseInt(process.env.PORT || '3000', 10),
    environment: (process.env.NODE_ENV as ApiConfig['environment']) || 'development',
    api: {
        prefix: '/api/v1',
        version: '1.0.0',
        rateLimit: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000', 10),
            maxRequests: parseInt(process.env.RATE_LIMIT_MAX || '100', 10),
        },
        cors: {
            origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000', 'http://localhost:5173'],
            credentials: true,
        },
    },
    auth: {
        apiKeyHeader: 'X-API-Key',
        jwtSecret: process.env.JWT_SECRET || 'market-ai-secret-key-change-in-production',
        jwtExpiry: '24h',
        apiKeyPrefix: 'mai_',
    },
    market: {
        defaultVolatility: 0.02,
        defaultLiquidity: 1000000,
        priceUpdateInterval: parseInt(process.env.PRICE_UPDATE_INTERVAL || '1000', 10),
        maxHistoricalDays: 365,
        simulationModes: ['realistic', 'volatile', 'stable', 'bull', 'bear', 'random'],
        assetTypes: ['stock', 'forex', 'crypto'],
    },
    cache: {
        enabled: process.env.CACHE_ENABLED !== 'false',
        ttl: parseInt(process.env.CACHE_TTL || '300', 10),
        maxSize: 1000,
    },
    logging: {
        level: (process.env.LOG_LEVEL as ApiConfig['logging']['level']) || 'info',
        format: (process.env.LOG_FORMAT as ApiConfig['logging']['format']) || 'json',
        filePath: process.env.LOG_FILE_PATH,
    },
    websocket: {
        enabled: process.env.WS_ENABLED !== 'false',
        pingInterval: 30000,
        pingTimeout: 5000,
    },
    webhooks: {
        enabled: process.env.WEBHOOKS_ENABLED !== 'false',
        retryAttempts: 3,
        retryDelay: 1000,
    },
    database: {
        type: (process.env.DB_TYPE as ApiConfig['database']['type']) || 'memory',
        filename: process.env.DB_FILENAME,
    },
    analytics: {
        enabled: process.env.ANALYTICS_ENABLED !== 'false',
        retentionDays: 30,
    },
};

export default config;
