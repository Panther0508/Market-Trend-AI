/**
 * Predictive Analytics Service
 * Statistical and machine learning based price prediction
 * Uses linear regression, moving averages, and momentum models
 */

import { Asset, Prediction, Candle, TimeFrame } from '../models';
import { priceSimulationService } from './priceSimulation';
import { technicalIndicatorsService } from './technicalIndicators';

interface PredictionModel {
    name: string;
    predict: (candles: Candle[], horizon: number) => Prediction | null;
}

class PredictiveAnalyticsService {
    private models: PredictionModel[] = [];

    constructor() {
        // Register available models
        this.models = [
            { name: 'linear_regression', predict: this.linearRegressionPredict.bind(this) },
            { name: 'moving_average_forecast', predict: this.movingAverageForecast.bind(this) },
            { name: 'momentum', predict: this.momentumPredict.bind(this) },
            { name: 'mean_reversion', predict: this.meanReversionPredict.bind(this) },
        ];
    }

    /**
     * Get available prediction models
     */
    getModels(): string[] {
        return this.models.map(m => m.name);
    }

    /**
     * Generate prediction for an asset
     */
    predict(symbol: string, horizon: number = 1, modelName?: string): Prediction {
        const asset = priceSimulationService.getAsset(symbol);
        if (!asset) {
            throw new Error(`Asset not found: ${symbol}`);
        }

        // Generate historical data for prediction
        const timeframe: TimeFrame = horizon <= 1 ? '1h' : horizon <= 24 ? '4h' : '1d';
        const candles = priceSimulationService.generateHistoricalCandles(symbol, timeframe, 100);

        if (candles.length < 30) {
            throw new Error('Insufficient historical data for prediction');
        }

        // Use specified model or first available
        const model = modelName
            ? this.models.find(m => m.name === modelName)
            : this.models[0];

        if (!model) {
            throw new Error(`Model not found: ${modelName}`);
        }

        const prediction = model.predict(candles, horizon);

        if (!prediction) {
            throw new Error('Failed to generate prediction');
        }

        return prediction;
    }

    /**
     * Linear Regression Prediction
     * Uses least squares regression to predict future prices
     */
    private linearRegressionPredict(candles: Candle[], horizon: number): Prediction | null {
        if (candles.length < 30) return null;

        const prices = candles.map(c => c.close);
        const n = prices.length;

        // Calculate means
        let sumX = 0, sumY = 0;
        for (let i = 0; i < n; i++) {
            sumX += i;
            sumY += prices[i];
        }
        const meanX = sumX / n;
        const meanY = sumY / n;

        // Calculate slope and intercept
        let numerator = 0, denominator = 0;
        for (let i = 0; i < n; i++) {
            numerator += (i - meanX) * (prices[i] - meanY);
            denominator += (i - meanX) ** 2;
        }

        const slope = denominator !== 0 ? numerator / denominator : 0;
        const intercept = meanY - slope * meanX;

        // Predict future price
        const currentPrice = prices[n - 1];
        const predictedPrice = intercept + slope * (n - 1 + horizon);

        // Calculate confidence based on R-squared
        let ssRes = 0, ssTot = 0;
        for (let i = 0; i < n; i++) {
            const predicted = intercept + slope * i;
            ssRes += (prices[i] - predicted) ** 2;
            ssTot += (prices[i] - meanY) ** 2;
        }
        const rSquared = ssTot !== 0 ? 1 - (ssRes / ssTot) : 0;
        const confidence = Math.max(0, Math.min(100, rSquared * 100));

        // Determine direction
        let direction: 'up' | 'down' | 'neutral';
        if (predictedPrice > currentPrice * 1.01) direction = 'up';
        else if (predictedPrice < currentPrice * 0.99) direction = 'down';
        else direction = 'neutral';

        const asset = priceSimulationService.getAsset(candles[0].symbol);

        return {
            assetId: candles[0].assetId,
            symbol: candles[0].symbol,
            currentPrice,
            predictedPrice,
            confidence,
            horizon,
            direction,
            probability: direction === 'up' ? confidence : direction === 'down' ? confidence : 50,
            model: 'linear_regression',
            features: ['slope', 'intercept', 'r_squared'],
            timestamp: new Date(),
        };
    }

    /**
     * Moving Average Forecast
     * Uses EMA extrapolation for prediction
     */
    private movingAverageForecast(candles: Candle[], horizon: number): Prediction | null {
        if (candles.length < 50) return null;

        const prices = candles.map(c => c.close);
        const currentPrice = prices[prices.length - 1];

        // Calculate EMA with multiple periods
        const ema20 = this.calculateEMA(prices, 20);
        const ema50 = this.calculateEMA(prices, 50);

        // Calculate trend strength
        const trendStrength = (ema20 - ema50) / ema50;

        // Extrapolate
        const predictedPrice = currentPrice * (1 + trendStrength * horizon * 0.1);

        // Confidence based on trend consistency
        const consistency = Math.min(100, Math.abs(trendStrength) * 1000);
        const confidence = 50 + consistency / 2;

        let direction: 'up' | 'down' | 'neutral';
        if (predictedPrice > currentPrice * 1.01) direction = 'up';
        else if (predictedPrice < currentPrice * 0.99) direction = 'down';
        else direction = 'neutral';

        const asset = priceSimulationService.getAsset(candles[0].symbol);

        return {
            assetId: candles[0].assetId,
            symbol: candles[0].symbol,
            currentPrice,
            predictedPrice,
            confidence: Math.min(95, confidence),
            horizon,
            direction,
            probability: direction === 'up' ? confidence : direction === 'down' ? confidence : 50,
            model: 'moving_average_forecast',
            features: ['ema_20', 'ema_50', 'trend_strength'],
            timestamp: new Date(),
        };
    }

    /**
     * Momentum-based Prediction
     */
    private momentumPredict(candles: Candle[], horizon: number): Prediction | null {
        if (candles.length < 20) return null;

        const prices = candles.map(c => c.close);
        const currentPrice = prices[prices.length - 1];

        // Calculate momentum over different periods
        const momentum1 = prices[prices.length - 1] - prices[prices.length - 5];
        const momentum2 = prices[prices.length - 5] - prices[prices.length - 10];
        const momentum3 = prices[prices.length - 10] - prices[prices.length - 20];

        // Weighted average momentum
        const weightedMomentum = (momentum1 * 0.5 + momentum2 * 0.3 + momentum3 * 0.2);
        const momentumStrength = Math.abs(weightedMomentum) / currentPrice;

        // Apply momentum with decay
        const predictedPrice = currentPrice + weightedMomentum * Math.pow(0.9, horizon);

        // Confidence based on momentum strength and consistency
        const consistency = momentum1 * momentum2 > 0 ? 1 : 0.5;
        const confidence = Math.min(90, momentumStrength * 500 * consistency);

        let direction: 'up' | 'down' | 'neutral';
        if (predictedPrice > currentPrice * 1.01) direction = 'up';
        else if (predictedPrice < currentPrice * 0.99) direction = 'down';
        else direction = 'neutral';

        return {
            assetId: candles[0].assetId,
            symbol: candles[0].symbol,
            currentPrice,
            predictedPrice,
            confidence: Math.max(30, confidence),
            horizon,
            direction,
            probability: direction === 'up' ? confidence : direction === 'down' ? confidence : 50,
            model: 'momentum',
            features: ['momentum_5', 'momentum_10', 'momentum_20'],
            timestamp: new Date(),
        };
    }

    /**
     * Mean Reversion Prediction
     */
    private meanReversionPredict(candles: Candle[], horizon: number): Prediction | null {
        if (candles.length < 30) return null;

        const prices = candles.map(c => c.close);
        const currentPrice = prices[prices.length - 1];

        // Calculate mean and standard deviation
        const mean = prices.reduce((a, b) => a + b, 0) / prices.length;
        const stdDev = Math.sqrt(prices.reduce((sum, p) => sum + (p - mean) ** 2, 0) / prices.length);

        // Calculate z-score
        const zScore = (currentPrice - mean) / stdDev;

        // Mean reversion with half-life estimation
        const halfLife = Math.abs(zScore) * 5;
        const reversionRate = Math.log(2) / Math.max(1, halfLife);

        // Predict reversion
        const predictedPrice = mean + (currentPrice - mean) * Math.exp(-reversionRate * horizon);

        // Confidence based on how extreme the current price is
        const confidence = Math.min(95, Math.abs(zScore) * 30);

        let direction: 'up' | 'down' | 'neutral';
        if (predictedPrice > currentPrice * 1.005) direction = 'up';
        else if (predictedPrice < currentPrice * 0.995) direction = 'down';
        else direction = 'neutral';

        return {
            assetId: candles[0].assetId,
            symbol: candles[0].symbol,
            currentPrice,
            predictedPrice,
            confidence: Math.max(25, confidence),
            horizon,
            direction,
            probability: direction === 'neutral' ? 50 : 50 + confidence / 2,
            model: 'mean_reversion',
            features: ['mean', 'std_dev', 'z_score', 'half_life'],
            timestamp: new Date(),
        };
    }

    /**
     * Helper: Calculate EMA
     */
    private calculateEMA(prices: number[], period: number): number {
        if (prices.length < period) return prices[prices.length - 1];

        const multiplier = 2 / (period + 1);
        let ema = prices.slice(0, period).reduce((a, b) => a + b, 0) / period;

        for (let i = period; i < prices.length; i++) {
            ema = (prices[i] - ema) * multiplier + ema;
        }

        return ema;
    }

    /**
     * Ensemble Prediction
     * Combines multiple models for more robust prediction
     */
    ensemblePredict(symbol: string, horizon: number = 1): Prediction {
        const predictions: Prediction[] = [];

        for (const model of this.models) {
            try {
                const candles = priceSimulationService.generateHistoricalCandles(symbol, '1h', 100);
                const prediction = model.predict(candles, horizon);
                if (prediction) {
                    predictions.push(prediction);
                }
            } catch (error) {
                // Skip failed models
            }
        }

        if (predictions.length === 0) {
            throw new Error('No models could generate predictions');
        }

        // Weighted average of predictions
        const totalWeight = predictions.reduce((sum, p) => sum + p.confidence, 0);
        const avgPredictedPrice = predictions.reduce((sum, p) =>
            sum + (p.predictedPrice * p.confidence / totalWeight), 0);
        const avgConfidence = predictions.reduce((sum, p) =>
            sum + (p.confidence * p.confidence / totalWeight), 0);

        const currentPrice = predictions[0].currentPrice;
        const upVotes = predictions.filter(p => p.direction === 'up').length;
        const downVotes = predictions.filter(p => p.direction === 'down').length;

        let direction: 'up' | 'down' | 'neutral';
        if (upVotes > downVotes) direction = 'up';
        else if (downVotes > upVotes) direction = 'down';
        else direction = 'neutral';

        const asset = priceSimulationService.getAsset(symbol);

        return {
            assetId: asset?.id || '',
            symbol,
            currentPrice,
            predictedPrice: avgPredictedPrice,
            confidence: avgConfidence,
            horizon,
            direction,
            probability: direction === 'up' ? avgConfidence : direction === 'down' ? avgConfidence : 50,
            model: 'ensemble',
            features: Array.from(new Set(predictions.flatMap(p => p.features))),
            timestamp: new Date(),
        };
    }

    /**
     * Get prediction accuracy (simulated)
     */
    getModelAccuracy(modelName: string): {
        model: string;
        accuracy: number;
        samples: number;
        lastUpdated: Date;
    } {
        // Simulated accuracy metrics
        const accuracies: Record<string, { accuracy: number; samples: number }> = {
            linear_regression: { accuracy: 62.5, samples: 1250 },
            moving_average_forecast: { accuracy: 58.3, samples: 980 },
            momentum: { accuracy: 55.7, samples: 750 },
            mean_reversion: { accuracy: 60.1, samples: 1100 },
            ensemble: { accuracy: 67.2, samples: 1500 },
        };

        const data = accuracies[modelName] || { accuracy: 50, samples: 0 };

        return {
            model: modelName,
            accuracy: data.accuracy,
            samples: data.samples,
            lastUpdated: new Date(),
        };
    }
}

// Export singleton instance
export const predictiveAnalyticsService = new PredictiveAnalyticsService();
export default predictiveAnalyticsService;
