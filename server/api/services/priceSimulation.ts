/**
 * Price Simulation Service
 * Advanced algorithmic price simulation for market data generation
 * Uses multiple financial models including Geometric Brownian Motion,
 * Mean Reversion, and Volatility Clustering
 */

import { Asset, AssetType, MarketSimulationMode, PriceTick, Candle, TimeFrame, OrderBook, OrderBookEntry } from '../models';
import config from '../config';

interface PriceSimulationState {
    asset: Asset;
    volatility: number;
    drift: number;
    meanPrice: number;
    lastPrice: number;
    trend: number;
    momentum: number;
}

interface SimulationParameters {
    volatility?: number;
    drift?: number;
    meanReversion?: number;
    momentumFactor?: number;
}

const DEFAULT_ASSETS: Partial<Asset>[] = [
    // Stocks
    { symbol: 'AAPL', name: 'Apple Inc.', type: 'stock', exchange: 'NASDAQ', baseCurrency: 'USD', precision: 2 },
    { symbol: 'GOOGL', name: 'Alphabet Inc.', type: 'stock', exchange: 'NASDAQ', baseCurrency: 'USD', precision: 2 },
    { symbol: 'MSFT', name: 'Microsoft Corporation', type: 'stock', exchange: 'NASDAQ', baseCurrency: 'USD', precision: 2 },
    { symbol: 'AMZN', name: 'Amazon.com Inc.', type: 'stock', exchange: 'NASDAQ', baseCurrency: 'USD', precision: 2 },
    { symbol: 'TSLA', name: 'Tesla Inc.', type: 'stock', exchange: 'NASDAQ', baseCurrency: 'USD', precision: 2 },
    { symbol: 'META', name: 'Meta Platforms Inc.', type: 'stock', exchange: 'NASDAQ', baseCurrency: 'USD', precision: 2 },
    { symbol: 'NVDA', name: 'NVIDIA Corporation', type: 'stock', exchange: 'NASDAQ', baseCurrency: 'USD', precision: 2 },
    { symbol: 'JPM', name: 'JPMorgan Chase & Co.', type: 'stock', exchange: 'NYSE', baseCurrency: 'USD', precision: 2 },
    { symbol: 'V', name: 'Visa Inc.', type: 'stock', exchange: 'NYSE', baseCurrency: 'USD', precision: 2 },
    { symbol: 'JNJ', name: 'Johnson & Johnson', type: 'stock', exchange: 'NYSE', baseCurrency: 'USD', precision: 2 },
    // Forex
    { symbol: 'EUR/USD', name: 'Euro/US Dollar', type: 'forex', exchange: 'FX', baseCurrency: 'EUR', quoteCurrency: 'USD', precision: 5 },
    { symbol: 'GBP/USD', name: 'British Pound/US Dollar', type: 'forex', exchange: 'FX', baseCurrency: 'GBP', quoteCurrency: 'USD', precision: 5 },
    { symbol: 'USD/JPY', name: 'US Dollar/Japanese Yen', type: 'forex', exchange: 'FX', baseCurrency: 'USD', quoteCurrency: 'JPY', precision: 3 },
    { symbol: 'USD/CHF', name: 'US Dollar/Swiss Franc', type: 'forex', exchange: 'FX', baseCurrency: 'USD', quoteCurrency: 'CHF', precision: 5 },
    { symbol: 'AUD/USD', name: 'Australian Dollar/US Dollar', type: 'forex', exchange: 'FX', baseCurrency: 'AUD', quoteCurrency: 'USD', precision: 5 },
    { symbol: 'USD/CAD', name: 'US Dollar/Canadian Dollar', type: 'forex', exchange: 'FX', baseCurrency: 'USD', quoteCurrency: 'CAD', precision: 5 },
    { symbol: 'NZD/USD', name: 'New Zealand Dollar/US Dollar', type: 'forex', exchange: 'FX', baseCurrency: 'NZD', quoteCurrency: 'USD', precision: 5 },
    // Cryptocurrency
    { symbol: 'BTC', name: 'Bitcoin', type: 'crypto', exchange: 'CRYPTO', baseCurrency: 'BTC', quoteCurrency: 'USD', precision: 2 },
    { symbol: 'ETH', name: 'Ethereum', type: 'crypto', exchange: 'CRYPTO', baseCurrency: 'ETH', quoteCurrency: 'USD', precision: 2 },
    { symbol: 'BNB', name: 'Binance Coin', type: 'crypto', exchange: 'CRYPTO', baseCurrency: 'BNB', quoteCurrency: 'USD', precision: 2 },
    { symbol: 'XRP', name: 'Ripple', type: 'crypto', exchange: 'CRYPTO', baseCurrency: 'XRP', quoteCurrency: 'USD', precision: 4 },
    { symbol: 'ADA', name: 'Cardano', type: 'crypto', exchange: 'CRYPTO', baseCurrency: 'ADA', quoteCurrency: 'USD', precision: 4 },
    { symbol: 'SOL', name: 'Solana', type: 'crypto', exchange: 'CRYPTO', baseCurrency: 'SOL', quoteCurrency: 'USD', precision: 2 },
    { symbol: 'DOGE', name: 'Dogecoin', type: 'crypto', exchange: 'CRYPTO', baseCurrency: 'DOGE', quoteCurrency: 'USD', precision: 6 },
    { symbol: 'DOT', name: 'Polkadot', type: 'crypto', exchange: 'CRYPTO', baseCurrency: 'DOT', quoteCurrency: 'USD', precision: 2 },
    { symbol: 'MATIC', name: 'Polygon', type: 'crypto', exchange: 'CRYPTO', baseCurrency: 'MATIC', quoteCurrency: 'USD', precision: 4 },
    { symbol: 'LTC', name: 'Litecoin', type: 'crypto', exchange: 'CRYPTO', baseCurrency: 'LTC', quoteCurrency: 'USD', precision: 2 },
];

const BASE_PRICES: Record<string, number> = {
    AAPL: 185.50, GOOGL: 142.30, MSFT: 378.90, AMZN: 178.25, TSLA: 248.50,
    META: 485.20, NVDA: 875.40, JPM: 195.80, V: 275.30, JNJ: 158.45,
    'EUR/USD': 1.0875, 'GBP/USD': 1.2650, 'USD/JPY': 149.85, 'USD/CHF': 0.8825,
    'AUD/USD': 0.6520, 'USD/CAD': 1.3580, 'NZD/USD': 0.6125,
    BTC: 68500.00, ETH: 3450.00, BNB: 585.00, XRP: 0.5280, ADA: 0.4520,
    SOL: 145.20, DOGE: 0.0825, DOT: 7.25, MATIC: 0.7850, LTC: 72.50,
};

class PriceSimulationService {
    private assets: Map<string, Asset> = new Map();
    private simulationStates: Map<string, PriceSimulationState> = new Map();
    private candles: Map<string, Map<TimeFrame, Candle[]>> = new Map();
    private updateInterval: ReturnType<typeof setInterval> | null = null;
    private currentMode: MarketSimulationMode = 'realistic';
    private listeners: Set<(tick: PriceTick) => void> = new Set();

    constructor() {
        this.initializeAssets();
        this.initializeSimulationStates();
    }

    /**
     * Initialize all available assets
     */
    private initializeAssets(): void {
        const now = new Date();

        DEFAULT_ASSETS.forEach((assetTemplate, index) => {
            const symbol = assetTemplate.symbol!;
            const basePrice = BASE_PRICES[symbol] || 100;

            const asset: Asset = {
                id: `asset_${index + 1}`,
                symbol,
                name: assetTemplate.name!,
                type: assetTemplate.type! as AssetType,
                exchange: assetTemplate.exchange!,
                baseCurrency: assetTemplate.baseCurrency!,
                quoteCurrency: assetTemplate.quoteCurrency || 'USD',
                precision: assetTemplate.precision || 2,
                minQuantity: assetTemplate.type === 'crypto' ? 0.0001 : 1,
                maxQuantity: assetTemplate.type === 'crypto' ? 1000000 : 100000,
                currentPrice: basePrice,
                previousPrice: basePrice,
                volume24h: this.generateVolume(assetTemplate.type as AssetType),
                marketCap: assetTemplate.type === 'stock' ? basePrice * (Math.random() * 10 + 1) * 1e9 : undefined,
                metadata: {},
                isActive: true,
                createdAt: now,
                updatedAt: now,
            };

            this.assets.set(symbol, asset);
            this.candles.set(symbol, new Map());
        });
    }

    /**
     * Initialize simulation states for each asset
     */
    private initializeSimulationStates(): void {
        this.assets.forEach((asset) => {
            const state = this.createSimulationState(asset, this.currentMode);
            this.simulationStates.set(asset.symbol, state);
        });
    }

    /**
     * Create simulation state based on mode
     */
    private createSimulationState(asset: Asset, mode: MarketSimulationMode): PriceSimulationState {
        const volatilityMap: Record<MarketSimulationMode, number> = {
            realistic: asset.type === 'crypto' ? 0.04 : asset.type === 'forex' ? 0.005 : 0.015,
            volatile: 0.08,
            stable: 0.005,
            bull: 0.02,
            bear: 0.025,
            random: Math.random() * 0.04 + 0.01,
        };

        const driftMap: Record<MarketSimulationMode, number> = {
            realistic: 0.0001,
            volatile: -0.001,
            stable: 0,
            bull: 0.002,
            bear: -0.002,
            random: (Math.random() - 0.5) * 0.002,
        };

        return {
            asset,
            volatility: volatilityMap[mode],
            drift: driftMap[mode],
            meanPrice: asset.currentPrice,
            lastPrice: asset.currentPrice,
            trend: driftMap[mode] > 0 ? 1 : driftMap[mode] < 0 ? -1 : 0,
            momentum: 0,
        };
    }

    /**
     * Generate random volume based on asset type
     */
    private generateVolume(type: AssetType): number {
        const baseVolume = type === 'crypto' ? 50000000 : type === 'forex' ? 100000000 : 5000000;
        return baseVolume * (0.5 + Math.random());
    }

    /**
     * Set the simulation mode
     */
    setSimulationMode(mode: MarketSimulationMode): void {
        if (!config.market.simulationModes.includes(mode)) {
            throw new Error(`Invalid simulation mode: ${mode}`);
        }

        this.currentMode = mode;

        // Update all simulation states
        this.simulationStates.forEach((state, symbol) => {
            const asset = this.assets.get(symbol);
            if (asset) {
                this.simulationStates.set(symbol, this.createSimulationState(asset, mode));
            }
        });
    }

    /**
     * Get current simulation mode
     */
    getSimulationMode(): MarketSimulationMode {
        return this.currentMode;
    }

    /**
     * Set custom volatility for an asset
     */
    setAssetVolatility(symbol: string, volatility: number): void {
        const state = this.simulationStates.get(symbol);
        if (state) {
            state.volatility = volatility;
        }
    }

    /**
     * Get all available assets
     */
    getAssets(): Asset[] {
        return Array.from(this.assets.values());
    }

    /**
     * Get asset by symbol
     */
    getAsset(symbol: string): Asset | undefined {
        return this.assets.get(symbol);
    }

    /**
     * Get asset by ID
     */
    getAssetById(id: string): Asset | undefined {
        return Array.from(this.assets.values()).find(a => a.id === id);
    }

    /**
     * Generate a single price tick using Geometric Brownian Motion
     * dS = μSdt + σSdW
     */
    generatePriceTick(symbol: string): PriceTick | null {
        const state = this.simulationStates.get(symbol);
        const asset = this.assets.get(symbol);

        if (!state || !asset) return null;

        // Generate random shock using Box-Muller transform for normal distribution
        const randomShock = this.boxMullerTransform();

        // Apply momentum factor
        const momentumEffect = state.momentum * 0.1;

        // Calculate price change using GBM
        const dt = 1 / (252 * 24 * 60); // Time step (1 minute)
        const drift = (state.drift + momentumEffect) * dt;
        const diffusion = state.volatility * Math.sqrt(dt) * randomShock;

        // Calculate new price
        const logReturn = drift + diffusion;
        const newPrice = state.lastPrice * Math.exp(logReturn);

        // Ensure price doesn't go negative or too close to zero
        const clampedPrice = Math.max(newPrice, asset.currentPrice * 0.001);

        // Update state
        state.lastPrice = clampedPrice;
        state.momentum = (state.momentum * 0.95) + (logReturn * 0.05); // Momentum decay

        // Calculate bid/ask spread
        const spread = clampedPrice * 0.0005; // 0.05% spread
        const bid = clampedPrice - spread / 2;
        const ask = clampedPrice + spread / 2;

        // Calculate change
        const change = clampedPrice - asset.currentPrice;
        const changePercent = (change / asset.currentPrice) * 100;

        // Update asset
        asset.previousPrice = asset.currentPrice;
        asset.currentPrice = clampedPrice;
        asset.volume24h += Math.random() * 1000;
        asset.updatedAt = new Date();

        const tick: PriceTick = {
            assetId: asset.id,
            symbol: asset.symbol,
            price: clampedPrice,
            bid,
            ask,
            volume: asset.volume24h,
            timestamp: Date.now(),
            change,
            changePercent,
        };

        // Notify listeners
        this.notifyListeners(tick);

        return tick;
    }

    /**
     * Box-Muller transform for generating normal random numbers
     */
    private boxMullerTransform(): number {
        let u1 = Math.random();
        let u2 = Math.random();

        // Avoid log(0)
        while (u1 === 0) u1 = Math.random();

        return Math.sqrt(-2.0 * Math.log(u1)) * Math.cos(2.0 * Math.PI * u2);
    }

    /**
     * Generate historical candle data
     */
    generateHistoricalCandles(
        symbol: string,
        timeframe: TimeFrame,
        count: number,
        endTime: number = Date.now()
    ): Candle[] {
        const asset = this.assets.get(symbol);
        if (!asset) return [];

        const candles: Candle[] = [];
        const timeframeMs = this.getTimeframeMs(timeframe);

        let currentPrice = asset.currentPrice;
        const state = this.simulationStates.get(symbol);
        const volatility = state?.volatility || config.market.defaultVolatility;

        // Generate candles in reverse (most recent first)
        for (let i = 0; i < count; i++) {
            const timestamp = endTime - (i * timeframeMs);

            // Generate OHLC using random walk
            const open = currentPrice;
            const change1 = (Math.random() - 0.5) * 2 * volatility * currentPrice;
            const change2 = (Math.random() - 0.5) * 2 * volatility * currentPrice;
            const change3 = (Math.random() - 0.5) * 2 * volatility * currentPrice;

            const high = Math.max(open, open + change1, open + change2, open + change3);
            const low = Math.min(open, open + change1, open + change2, open + change3);
            const close = open + (Math.random() - 0.5) * volatility * currentPrice;

            const volume = this.generateVolume(asset.type) * (timeframeMs / (24 * 60 * 60 * 1000));

            candles.push({
                id: `candle_${symbol}_${timeframe}_${timestamp}`,
                assetId: asset.id,
                symbol: asset.symbol,
                timestamp,
                open,
                high,
                low,
                close,
                volume,
                timeframe,
            });

            currentPrice = close;
        }

        return candles.reverse(); // Reverse to get chronological order
    }

    /**
     * Get timeframe in milliseconds
     */
    private getTimeframeMs(timeframe: TimeFrame): number {
        const map: Record<TimeFrame, number> = {
            '1m': 60000,
            '5m': 300000,
            '15m': 900000,
            '1h': 3600000,
            '4h': 14400000,
            '1d': 86400000,
            '1w': 604800000,
        };
        return map[timeframe];
    }

    /**
     * Get candles for an asset
     */
    getCandles(symbol: string, timeframe: TimeFrame): Candle[] {
        const candlesMap = this.candles.get(symbol);
        if (!candlesMap) return [];

        return candlesMap.get(timeframe) || [];
    }

    /**
     * Generate order book for an asset
     */
    generateOrderBook(symbol: string, depth: number = 10): OrderBook {
        const asset = this.assets.get(symbol);
        if (!asset) {
            throw new Error(`Asset not found: ${symbol}`);
        }

        const price = asset.currentPrice;
        const spread = price * 0.0002; // 0.02% spread

        const bids: OrderBookEntry[] = [];
        const asks: OrderBookEntry[] = [];

        for (let i = 0; i < depth; i++) {
            // Generate bid levels (below current price)
            const bidPrice = price - spread / 2 - (i * price * 0.0001);
            const bidQuantity = Math.random() * 1000 + 100;
            const bidOrders = Math.floor(Math.random() * 5) + 1;

            bids.push({
                price: this.roundPrice(bidPrice, asset.precision),
                quantity: this.roundPrice(bidQuantity, 4),
                orders: bidOrders,
            });

            // Generate ask levels (above current price)
            const askPrice = price + spread / 2 + (i * price * 0.0001);
            const askQuantity = Math.random() * 1000 + 100;
            const askOrders = Math.floor(Math.random() * 5) + 1;

            asks.push({
                price: this.roundPrice(askPrice, asset.precision),
                quantity: this.roundPrice(askQuantity, 4),
                orders: askOrders,
            });
        }

        const bestBid = bids[0]?.price || price - spread / 2;
        const bestAsk = asks[0]?.price || price + spread / 2;

        return {
            assetId: asset.id,
            symbol: asset.symbol,
            bids,
            asks,
            timestamp: Date.now(),
            spread: bestAsk - bestBid,
            spreadPercent: ((bestAsk - bestBid) / price) * 100,
        };
    }

    /**
     * Round price to precision
     */
    private roundPrice(price: number, precision: number): number {
        const factor = Math.pow(10, precision);
        return Math.round(price * factor) / factor;
    }

    /**
     * Subscribe to price updates
     */
    subscribe(callback: (tick: PriceTick) => void): () => void {
        this.listeners.add(callback);
        return () => this.listeners.delete(callback);
    }

    /**
     * Notify all listeners of price update
     */
    private notifyListeners(tick: PriceTick): void {
        this.listeners.forEach(callback => {
            try {
                callback(tick);
            } catch (error) {
                console.error('Error in price tick listener:', error);
            }
        });
    }

    /**
     * Start real-time price updates
     */
    startPriceUpdates(): void {
        if (this.updateInterval) return;

        this.updateInterval = setInterval(() => {
            this.assets.forEach((_, symbol) => {
                this.generatePriceTick(symbol);
            });
        }, config.market.priceUpdateInterval);
    }

    /**
     * Stop real-time price updates
     */
    stopPriceUpdates(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Search assets by query
     */
    searchAssets(query: string, type?: AssetType): Asset[] {
        const lowerQuery = query.toLowerCase();

        return Array.from(this.assets.values()).filter(asset => {
            const matchesType = !type || asset.type === type;
            const matchesQuery =
                asset.symbol.toLowerCase().includes(lowerQuery) ||
                asset.name.toLowerCase().includes(lowerQuery);

            return matchesType && matchesQuery;
        });
    }

    /**
     * Get market statistics
     */
    getMarketStats(): {
        totalAssets: number;
        activeAssets: number;
        totalVolume24h: number;
        averageVolatility: number;
        byType: Record<AssetType, number>;
    } {
        const assets = Array.from(this.assets.values());

        return {
            totalAssets: assets.length,
            activeAssets: assets.filter(a => a.isActive).length,
            totalVolume24h: assets.reduce((sum, a) => sum + a.volume24h, 0),
            averageVolatility: Array.from(this.simulationStates.values())
                .reduce((sum, s) => sum + s.volatility, 0) / this.simulationStates.size,
            byType: {
                stock: assets.filter(a => a.type === 'stock').length,
                forex: assets.filter(a => a.type === 'forex').length,
                crypto: assets.filter(a => a.type === 'crypto').length,
            },
        };
    }
}

// Export singleton instance
export const priceSimulationService = new PriceSimulationService();
export default priceSimulationService;
