/**
 * Market Data Models
 * Core data structures for the market simulation system
 */

export type AssetType = 'stock' | 'forex' | 'crypto';
export type MarketSimulationMode = 'realistic' | 'volatile' | 'stable' | 'bull' | 'bear' | 'random';
export type OrderType = 'market' | 'limit' | 'stop' | 'stop_limit';
export type OrderSide = 'buy' | 'sell';
export type OrderStatus = 'pending' | 'filled' | 'partially_filled' | 'cancelled' | 'rejected';
export type TimeFrame = '1m' | '5m' | '15m' | '1h' | '4h' | '1d' | '1w';
export type RatePlan = 'free' | 'basic' | 'pro' | 'enterprise';

/**
 * Asset model representing a tradeable instrument
 */
export interface Asset {
    id: string;
    symbol: string;
    name: string;
    type: AssetType;
    exchange: string;
    baseCurrency: string;
    quoteCurrency: string;
    precision: number;
    minQuantity: number;
    maxQuantity: number;
    currentPrice: number;
    previousPrice: number;
    volume24h: number;
    marketCap?: number;
    metadata: Record<string, unknown>;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * OHLCV candlestick data
 */
export interface Candle {
    id: string;
    assetId: string;
    symbol: string;
    timestamp: number;
    open: number;
    high: number;
    low: number;
    close: number;
    volume: number;
    timeframe: TimeFrame;
}

/**
 * Price tick for real-time updates
 */
export interface PriceTick {
    assetId: string;
    symbol: string;
    price: number;
    bid: number;
    ask: number;
    volume: number;
    timestamp: number;
    change: number;
    changePercent: number;
}

/**
 * Order model
 */
export interface Order {
    id: string;
    assetId: string;
    userId: string;
    portfolioId: string;
    type: OrderType;
    side: OrderSide;
    quantity: number;
    price?: number;
    filledQuantity: number;
    averageFillPrice?: number;
    status: OrderStatus;
    timeInForce: 'GTC' | 'IOC' | 'FOK' | 'GTD';
    stopPrice?: number;
    createdAt: Date;
    updatedAt: Date;
    filledAt?: Date;
    metadata: Record<string, unknown>;
}

/**
 * Order book entry
 */
export interface OrderBookEntry {
    price: number;
    quantity: number;
    orders: number;
}

/**
 * Order book snapshot
 */
export interface OrderBook {
    assetId: string;
    symbol: string;
    bids: OrderBookEntry[];
    asks: OrderBookEntry[];
    timestamp: number;
    spread: number;
    spreadPercent: number;
}

/**
 * Position in a portfolio
 */
export interface Position {
    id: string;
    portfolioId: string;
    assetId: string;
    symbol: string;
    quantity: number;
    averageEntryPrice: number;
    currentPrice: number;
    unrealizedPnL: number;
    realizedPnL: number;
    costBasis: number;
    marketValue: number;
    weight: number;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Portfolio model
 */
export interface Portfolio {
    id: string;
    userId: string;
    name: string;
    cashBalance: number;
    initialBalance: number;
    totalValue: number;
    totalPnL: number;
    totalPnLPercent: number;
    positions: Position[];
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Trade execution record
 */
export interface Trade {
    id: string;
    orderId: string;
    assetId: string;
    portfolioId: string;
    side: OrderSide;
    quantity: number;
    price: number;
    commission: number;
    realizedPnL?: number;
    timestamp: Date;
    metadata: Record<string, unknown>;
}

/**
 * Technical indicator result
 */
export interface TechnicalIndicator {
    name: string;
    value: number;
    signal?: 'buy' | 'sell' | 'neutral';
    metadata?: Record<string, unknown>;
}

/**
 * Market sentiment data
 */
export interface MarketSentiment {
    assetId: string;
    symbol: string;
    sentiment: 'bullish' | 'bearish' | 'neutral';
    score: number; // -100 to 100
    confidence: number; // 0 to 100
    factors: SentimentFactor[];
    timestamp: Date;
}

export interface SentimentFactor {
    type: string;
    impact: number;
    description: string;
}

/**
 * Predictive analytics result
 */
export interface Prediction {
    assetId: string;
    symbol: string;
    currentPrice: number;
    predictedPrice: number;
    confidence: number;
    horizon: number; // in periods
    direction: 'up' | 'down' | 'neutral';
    probability: number;
    model: string;
    features: string[];
    timestamp: Date;
}

/**
 * Backtest result
 */
export interface BacktestResult {
    id: string;
    portfolioId: string;
    startDate: Date;
    endDate: Date;
    initialBalance: number;
    finalBalance: number;
    totalReturn: number;
    totalReturnPercent: number;
    sharpeRatio: number;
    maxDrawdown: number;
    winRate: number;
    totalTrades: number;
    winningTrades: number;
    losingTrades: number;
    trades: Trade[];
    equityCurve: { timestamp: number; value: number }[];
}

/**
 * API Key model
 */
export interface ApiKey {
    id: string;
    key: string;
    userId: string;
    name: string;
    ratePlan: RatePlan;
    rateLimit: number;
    monthlyUsage: number;
    permissions: string[];
    isActive: boolean;
    lastUsedAt?: Date;
    expiresAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Usage analytics record
 */
export interface UsageRecord {
    id: string;
    apiKeyId: string;
    endpoint: string;
    method: string;
    statusCode: number;
    responseTime: number;
    timestamp: Date;
}

/**
 * Webhook subscription
 */
export interface WebhookSubscription {
    id: string;
    userId: string;
    url: string;
    events: string[];
    secret: string;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}

/**
 * Webhook payload
 */
export interface WebhookPayload {
    id: string;
    event: string;
    timestamp: Date;
    data: Record<string, unknown>;
}

/**
 * Market statistics
 */
export interface MarketStats {
    totalAssets: number;
    activeAssets: number;
    totalVolume24h: number;
    averageVolatility: number;
    marketSentiment: 'bullish' | 'bearish' | 'neutral';
    topGainers: { symbol: string; changePercent: number }[];
    topLosers: { symbol: string; changePercent: number }[];
    mostActive: { symbol: string; volume: number }[];
}

/**
 * Rate plan limits
 */
export interface RatePlanLimits {
    requestsPerMinute: number;
    requestsPerDay: number;
    historicalDataDays: number;
    websocketConnections: number;
    webhooks: number;
    backtests: number;
    exportLimit: number;
}

export const RATE_PLAN_LIMITS: Record<RatePlan, RatePlanLimits> = {
    free: {
        requestsPerMinute: 10,
        requestsPerDay: 1000,
        historicalDataDays: 30,
        websocketConnections: 1,
        webhooks: 1,
        backtests: 1,
        exportLimit: 1000,
    },
    basic: {
        requestsPerMinute: 60,
        requestsPerDay: 10000,
        historicalDataDays: 90,
        websocketConnections: 5,
        webhooks: 5,
        backtests: 10,
        exportLimit: 10000,
    },
    pro: {
        requestsPerMinute: 300,
        requestsPerDay: 100000,
        historicalDataDays: 180,
        websocketConnections: 20,
        webhooks: 20,
        backtests: 100,
        exportLimit: 100000,
    },
    enterprise: {
        requestsPerMinute: 1000,
        requestsPerDay: 1000000,
        historicalDataDays: 365,
        websocketConnections: 100,
        webhooks: 100,
        backtests: -1, // unlimited
        exportLimit: -1, // unlimited
    },
};
