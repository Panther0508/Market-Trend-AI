/**
 * Portfolio Management Service
 * Manages portfolios, positions, and trade execution
 */

import { Portfolio, Position, Order, Trade, OrderType, OrderSide, OrderStatus, TimeFrame } from '../models';
import { priceSimulationService } from './priceSimulation';

interface PortfolioCreateParams {
    userId: string;
    name: string;
    initialBalance?: number;
}

interface OrderCreateParams {
    assetId: string;
    userId: string;
    portfolioId: string;
    type: OrderType;
    side: OrderSide;
    quantity: number;
    price?: number;
    stopPrice?: number;
    timeInForce?: 'GTC' | 'IOC' | 'FOK' | 'GTD';
}

class PortfolioManagementService {
    private portfolios: Map<string, Portfolio> = new Map();
    private orders: Map<string, Order> = new Map();
    private trades: Map<string, Trade> = new Map();
    private portfoliosByUser: Map<string, Set<string>> = new Map();

    constructor() {
        // Initialize with demo data
        this.initializeDemoData();
    }

    /**
     * Initialize demo portfolios
     */
    private initializeDemoData(): void {
        const demoUserId = 'demo_user';

        // Create demo portfolio
        const portfolio = this.createPortfolio({
            userId: demoUserId,
            name: 'Demo Portfolio',
            initialBalance: 100000,
        });

        // Add some initial positions
        this.addPosition(portfolio.id, 'BTC', 0.5);
        this.addPosition(portfolio.id, 'ETH', 5);
        this.addPosition(portfolio.id, 'AAPL', 100);
    }

    /**
     * Create a new portfolio
     */
    createPortfolio(params: PortfolioCreateParams): Portfolio {
        const id = `portfolio_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const initialBalance = params.initialBalance || 10000;

        const portfolio: Portfolio = {
            id,
            userId: params.userId,
            name: params.name,
            cashBalance: initialBalance,
            initialBalance,
            totalValue: initialBalance,
            totalPnL: 0,
            totalPnLPercent: 0,
            positions: [],
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        this.portfolios.set(id, portfolio);

        // Track user portfolios
        if (!this.portfoliosByUser.has(params.userId)) {
            this.portfoliosByUser.set(params.userId, new Set());
        }
        this.portfoliosByUser.get(params.userId)!.add(id);

        return portfolio;
    }

    /**
     * Get portfolio by ID
     */
    getPortfolio(id: string): Portfolio | null {
        const portfolio = this.portfolios.get(id);
        if (!portfolio) return null;

        // Update portfolio values
        return this.updatePortfolioValues(portfolio);
    }

    /**
     * Get all portfolios for a user
     */
    getUserPortfolios(userId: string): Portfolio[] {
        const portfolioIds = this.portfoliosByUser.get(userId);
        if (!portfolioIds) return [];

        return Array.from(portfolioIds)
            .map(id => this.portfolios.get(id))
            .filter((p): p is Portfolio => p !== undefined)
            .map(p => this.updatePortfolioValues(p));
    }

    /**
     * Update portfolio values
     */
    private updatePortfolioValues(portfolio: Portfolio): Portfolio {
        let totalValue = portfolio.cashBalance;
        let totalCostBasis = 0;

        portfolio.positions = portfolio.positions.map(position => {
            const asset = priceSimulationService.getAssetById(position.assetId);
            if (!asset) return position;

            position.currentPrice = asset.currentPrice;
            position.marketValue = position.quantity * asset.currentPrice;
            position.costBasis = position.quantity * position.averageEntryPrice;
            position.unrealizedPnL = position.marketValue - position.costBasis;
            position.weight = 0; // Will be calculated after total

            totalValue += position.marketValue;
            totalCostBasis += position.costBasis;

            return position;
        });

        // Calculate weights
        portfolio.positions = portfolio.positions.map(position => ({
            ...position,
            weight: totalValue > 0 ? (position.marketValue / totalValue) * 100 : 0,
        }));

        portfolio.totalValue = totalValue;
        portfolio.totalPnL = totalValue - portfolio.initialBalance;
        portfolio.totalPnLPercent = portfolio.initialBalance > 0
            ? ((totalValue - portfolio.initialBalance) / portfolio.initialBalance) * 100
            : 0;
        portfolio.updatedAt = new Date();

        return portfolio;
    }

    /**
     * Add position to portfolio
     */
    addPosition(portfolioId: string, symbol: string, quantity: number): Position | null {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return null;

        const asset = priceSimulationService.getAsset(symbol);
        if (!asset) return null;

        const existingPosition = portfolio.positions.find(p => p.assetId === asset.id);
        const currentPrice = asset.currentPrice;

        if (existingPosition) {
            // Update existing position
            const totalQuantity = existingPosition.quantity + quantity;
            const totalCost = (existingPosition.quantity * existingPosition.averageEntryPrice) +
                (quantity * currentPrice);
            existingPosition.quantity = totalQuantity;
            existingPosition.averageEntryPrice = totalCost / totalQuantity;
            existingPosition.updatedAt = new Date();

            return existingPosition;
        } else {
            // Create new position
            const position: Position = {
                id: `position_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                portfolioId,
                assetId: asset.id,
                symbol: asset.symbol,
                quantity,
                averageEntryPrice: currentPrice,
                currentPrice,
                unrealizedPnL: 0,
                realizedPnL: 0,
                costBasis: quantity * currentPrice,
                marketValue: quantity * currentPrice,
                weight: 0,
                createdAt: new Date(),
                updatedAt: new Date(),
            };

            portfolio.positions.push(position);
            return position;
        }
    }

    /**
     * Create an order
     */
    createOrder(params: OrderCreateParams): Order {
        const order: Order = {
            id: `order_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            assetId: params.assetId,
            userId: params.userId,
            portfolioId: params.portfolioId,
            type: params.type,
            side: params.side,
            quantity: params.quantity,
            price: params.price,
            filledQuantity: 0,
            status: 'pending',
            timeInForce: params.timeInForce || 'GTC',
            stopPrice: params.stopPrice,
            createdAt: new Date(),
            updatedAt: new Date(),
            metadata: {},
        };

        this.orders.set(order.id, order);

        // Try to execute immediately for market orders
        if (params.type === 'market') {
            this.executeOrder(order.id);
        }

        return order;
    }

    /**
     * Execute an order
     */
    executeOrder(orderId: string): Order | null {
        const order = this.orders.get(orderId);
        if (!order || order.status !== 'pending') return order || null;

        const asset = priceSimulationService.getAssetById(order.assetId);
        if (!asset) {
            order.status = 'rejected';
            order.updatedAt = new Date();
            return order;
        }

        const portfolio = this.portfolios.get(order.portfolioId);
        if (!portfolio) {
            order.status = 'rejected';
            order.updatedAt = new Date();
            return order;
        }

        const executionPrice = order.type === 'market'
            ? asset.currentPrice
            : order.price || asset.currentPrice;

        const totalCost = order.quantity * executionPrice;
        const commission = totalCost * 0.001; // 0.1% commission

        // Check if buy or sell
        if (order.side === 'buy') {
            if (portfolio.cashBalance < totalCost + commission) {
                order.status = 'rejected';
                order.updatedAt = new Date();
                return order;
            }

            // Deduct from cash
            portfolio.cashBalance -= (totalCost + commission);

            // Add or update position
            this.addPosition(portfolio.id, asset.symbol, order.quantity);
        } else {
            // Sell - check if sufficient holdings
            const position = portfolio.positions.find(p => p.assetId === order.assetId);
            if (!position || position.quantity < order.quantity) {
                order.status = 'rejected';
                order.updatedAt = new Date();
                return order;
            }

            // Add to cash
            portfolio.cashBalance += (totalCost - commission);

            // Reduce position
            position.quantity -= order.quantity;
            if (position.quantity <= 0) {
                portfolio.positions = portfolio.positions.filter(p => p.assetId !== order.assetId);
            }
        }

        // Update order status
        order.status = 'filled';
        order.filledQuantity = order.quantity;
        order.averageFillPrice = executionPrice;
        order.filledAt = new Date();
        order.updatedAt = new Date();

        // Create trade record
        const trade: Trade = {
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            orderId: order.id,
            assetId: order.assetId,
            portfolioId: order.portfolioId,
            side: order.side,
            quantity: order.quantity,
            price: executionPrice,
            commission,
            timestamp: new Date(),
            metadata: {},
        };

        this.trades.set(trade.id, trade);

        return order;
    }

    /**
     * Cancel an order
     */
    cancelOrder(orderId: string): Order | null {
        const order = this.orders.get(orderId);
        if (!order || order.status !== 'pending') return null;

        order.status = 'cancelled';
        order.updatedAt = new Date();

        return order;
    }

    /**
     * Get order by ID
     */
    getOrder(orderId: string): Order | null {
        return this.orders.get(orderId) || null;
    }

    /**
     * Get portfolio orders
     */
    getPortfolioOrders(portfolioId: string): Order[] {
        return Array.from(this.orders.values())
            .filter(o => o.portfolioId === portfolioId)
            .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
    }

    /**
     * Get portfolio trades
     */
    getPortfolioTrades(portfolioId: string): Trade[] {
        return Array.from(this.trades.values())
            .filter(t => t.portfolioId === portfolioId)
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }

    /**
     * Delete a portfolio
     */
    deletePortfolio(portfolioId: string): boolean {
        const portfolio = this.portfolios.get(portfolioId);
        if (!portfolio) return false;

        this.portfolios.delete(portfolioId);

        // Remove from user portfolios
        const userPortfolios = this.portfoliosByUser.get(portfolio.userId);
        if (userPortfolios) {
            userPortfolios.delete(portfolioId);
        }

        return true;
    }

    /**
     * Get all trades
     */
    getAllTrades(): Trade[] {
        return Array.from(this.trades.values())
            .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
    }
}

// Export singleton instance
export const portfolioManagementService = new PortfolioManagementService();
export default portfolioManagementService;
