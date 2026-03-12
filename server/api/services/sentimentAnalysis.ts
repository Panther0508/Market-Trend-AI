/**
 * Sentiment Analysis Service
 * Simulated market sentiment analysis using various factors
 * including price action, volume, and technical indicators
 */

import { Asset, MarketSentiment, SentimentFactor, Candle, TechnicalIndicator } from '../models';
import { priceSimulationService } from './priceSimulation';
import { technicalIndicatorsService } from './technicalIndicators';

interface SentimentConfig {
    priceWeight: number;
    volumeWeight: number;
    indicatorWeight: number;
    momentumWeight: number;
}

const DEFAULT_CONFIG: SentimentConfig = {
    priceWeight: 0.3,
    volumeWeight: 0.2,
    indicatorWeight: 0.3,
    momentumWeight: 0.2,
};

class SentimentAnalysisService {
    private config: SentimentConfig = DEFAULT_CONFIG;

    /**
     * Configure sentiment analysis weights
     */
    configure(config: Partial<SentimentConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Analyze market sentiment for an asset
     */
    analyzeSentiment(symbol: string): MarketSentiment {
        const asset = priceSimulationService.getAsset(symbol);
        if (!asset) {
            throw new Error(`Asset not found: ${symbol}`);
        }

        const factors: SentimentFactor[] = [];
        let totalScore = 0;

        // Analyze price action
        const priceFactor = this.analyzePriceAction(asset);
        factors.push(priceFactor);
        totalScore += priceFactor.impact * this.config.priceWeight;

        // Analyze volume
        const volumeFactor = this.analyzeVolume(asset);
        factors.push(volumeFactor);
        totalScore += volumeFactor.impact * this.config.volumeWeight;

        // Analyze technical indicators
        const indicatorFactors = this.analyzeIndicators(symbol);
        factors.push(...indicatorFactors);
        const indicatorScore = indicatorFactors.reduce((sum, f) => sum + f.impact, 0) / indicatorFactors.length;
        totalScore += indicatorScore * this.config.indicatorWeight;

        // Analyze momentum
        const momentumFactor = this.analyzeMomentum(asset);
        factors.push(momentumFactor);
        totalScore += momentumFactor.impact * this.config.momentumWeight;

        // Calculate final sentiment
        const normalizedScore = Math.max(-100, Math.min(100, totalScore));

        let sentiment: 'bullish' | 'bearish' | 'neutral';
        if (normalizedScore > 20) sentiment = 'bullish';
        else if (normalizedScore < -20) sentiment = 'bearish';
        else sentiment = 'neutral';

        // Calculate confidence based on factor agreement
        const confidence = this.calculateConfidence(factors);

        return {
            assetId: asset.id,
            symbol: asset.symbol,
            sentiment,
            score: normalizedScore,
            confidence,
            factors,
            timestamp: new Date(),
        };
    }

    /**
     * Analyze price action
     */
    private analyzePriceAction(asset: Asset): SentimentFactor {
        const changePercent = asset.previousPrice !== 0
            ? ((asset.currentPrice - asset.previousPrice) / asset.previousPrice) * 100
            : 0;

        let impact: number;
        let description: string;

        if (changePercent > 2) {
            impact = 50;
            description = `Strong bullish price action: +${changePercent.toFixed(2)}%`;
        } else if (changePercent > 0.5) {
            impact = 25;
            description = `Moderate bullish price action: +${changePercent.toFixed(2)}%`;
        } else if (changePercent < -2) {
            impact = -50;
            description = `Strong bearish price action: ${changePercent.toFixed(2)}%`;
        } else if (changePercent < -0.5) {
            impact = -25;
            description = `Moderate bearish price action: ${changePercent.toFixed(2)}%`;
        } else {
            impact = 0;
            description = `Neutral price action: ${changePercent.toFixed(2)}%`;
        }

        return {
            type: 'price_action',
            impact,
            description,
        };
    }

    /**
     * Analyze volume
     */
    private analyzeVolume(asset: Asset): SentimentFactor {
        const avgVolume = asset.volume24h * 0.8; // Simulated average
        const volumeRatio = asset.volume24h / avgVolume;

        let impact: number;
        let description: string;

        if (volumeRatio > 1.5) {
            impact = 30;
            description = `High volume: ${volumeRatio.toFixed(2)}x average - strong interest`;
        } else if (volumeRatio > 1.2) {
            impact = 15;
            description = `Above average volume: ${volumeRatio.toFixed(2)}x average`;
        } else if (volumeRatio < 0.5) {
            impact = -20;
            description = `Low volume: ${volumeRatio.toFixed(2)}x average - weak interest`;
        } else {
            impact = 0;
            description = `Normal volume: ${volumeRatio.toFixed(2)}x average`;
        }

        return {
            type: 'volume',
            impact,
            description,
        };
    }

    /**
     * Analyze technical indicators
     */
    private analyzeIndicators(symbol: string): SentimentFactor[] {
        const factors: SentimentFactor[] = [];

        try {
            const indicators = technicalIndicatorsService.getLatestIndicators(symbol);

            // RSI analysis
            if (indicators.rsi) {
                const rsi = indicators.rsi.value;
                if (rsi < 30) {
                    factors.push({
                        type: 'rsi',
                        impact: 25,
                        description: `RSI oversold (${rsi.toFixed(1)}) - potential buying opportunity`,
                    });
                } else if (rsi > 70) {
                    factors.push({
                        type: 'rsi',
                        impact: -25,
                        description: `RSI overbought (${rsi.toFixed(1)}) - potential selling opportunity`,
                    });
                }
            }

            // MACD analysis
            if (indicators.macd) {
                const macd = indicators.macd as unknown as { metadata?: { histogram?: number } };
                const histogram = macd.metadata?.histogram || 0;
                if (histogram > 0) {
                    factors.push({
                        type: 'macd',
                        impact: 20,
                        description: 'MACD bullish momentum',
                    });
                } else if (histogram < 0) {
                    factors.push({
                        type: 'macd',
                        impact: -20,
                        description: 'MACD bearish momentum',
                    });
                }
            }

            // SMA/EMA analysis
            if (indicators.sma && indicators.ema) {
                const price = indicators.sma.metadata?.currentPrice as number || 0;
                const sma = indicators.sma.value;
                if (price > sma) {
                    factors.push({
                        type: 'moving_averages',
                        impact: 15,
                        description: 'Price above moving averages - bullish signal',
                    });
                } else {
                    factors.push({
                        type: 'moving_averages',
                        impact: -15,
                        description: 'Price below moving averages - bearish signal',
                    });
                }
            }
        } catch (error) {
            factors.push({
                type: 'indicators',
                impact: 0,
                description: 'Unable to calculate technical indicators',
            });
        }

        return factors;
    }

    /**
     * Analyze momentum
     */
    private analyzeMomentum(asset: Asset): SentimentFactor {
        // Simulated momentum based on recent price changes
        const momentum = (asset.currentPrice - asset.previousPrice) / asset.previousPrice;

        let impact: number;
        let description: string;

        if (momentum > 0.03) {
            impact = 40;
            description = 'Strong positive momentum';
        } else if (momentum > 0.01) {
            impact = 20;
            description = 'Moderate positive momentum';
        } else if (momentum < -0.03) {
            impact = -40;
            description = 'Strong negative momentum';
        } else if (momentum < -0.01) {
            impact = -20;
            description = 'Moderate negative momentum';
        } else {
            impact = 0;
            description = 'Neutral momentum';
        }

        return {
            type: 'momentum',
            impact,
            description,
        };
    }

    /**
     * Calculate confidence based on factor agreement
     */
    private calculateConfidence(factors: SentimentFactor[]): number {
        const positiveFactors = factors.filter(f => f.impact > 0).length;
        const negativeFactors = factors.filter(f => f.impact < 0).length;
        const totalFactors = factors.length;

        const agreement = Math.max(positiveFactors, negativeFactors) / totalFactors;
        return Math.round(agreement * 100);
    }

    /**
     * Get sentiment for multiple assets
     */
    getBulkSentiment(symbols: string[]): MarketSentiment[] {
        return symbols.map(symbol => {
            try {
                return this.analyzeSentiment(symbol);
            } catch (error) {
                return null;
            }
        }).filter((s): s is MarketSentiment => s !== null);
    }

    /**
     * Get overall market sentiment
     */
    getMarketSentiment(): {
        sentiment: 'bullish' | 'bearish' | 'neutral';
        score: number;
        confidence: number;
        assetSentiments: MarketSentiment[];
    } {
        const assets = priceSimulationService.getAssets();
        const sentiments = this.getBulkSentiment(assets.map(a => a.symbol));

        const avgScore = sentiments.reduce((sum, s) => sum + s.score, 0) / sentiments.length;
        const avgConfidence = sentiments.reduce((sum, s) => sum + s.confidence, 0) / sentiments.length;

        let sentiment: 'bullish' | 'bearish' | 'neutral';
        if (avgScore > 20) sentiment = 'bullish';
        else if (avgScore < -20) sentiment = 'bearish';
        else sentiment = 'neutral';

        return {
            sentiment,
            score: Math.round(avgScore),
            confidence: Math.round(avgConfidence),
            assetSentiments: sentiments,
        };
    }

    /**
     * Generate simulated news sentiment
     */
    generateNewsSentiment(symbol: string): {
        headline: string;
        sentiment: 'bullish' | 'bearish' | 'neutral';
        impact: number;
    } {
        const asset = priceSimulationService.getAsset(symbol);
        if (!asset) {
            throw new Error(`Asset not found: ${symbol}`);
        }

        const changePercent = asset.previousPrice !== 0
            ? ((asset.currentPrice - asset.previousPrice) / asset.previousPrice) * 100
            : 0;

        const newsTemplates = {
            bullish: [
                `${symbol} reports strong quarterly earnings, beating expectations`,
                `${symbol} announces new product launch, investors excited`,
                `${symbol} expands into new markets, growth prospects improve`,
                `Analysts upgrade ${symbol} to buy rating`,
                `${symbol} secures major partnership deal`,
            ],
            bearish: [
                `${symbol} misses revenue expectations in latest quarter`,
                `${symbol} faces regulatory scrutiny`,
                `Analysts downgrade ${symbol} amid concerns`,
                `${symbol} announces layoffs amid restructuring`,
                `${symbol} competitor gains market share`,
            ],
            neutral: [
                `${symbol} maintains steady performance`,
                `${symbol} announces routine updates`,
                `${symbol} holds annual shareholder meeting`,
                `No significant news for ${symbol} today`,
                `${symbol} trades within expected range`,
            ],
        };

        let sentiment: 'bullish' | 'bearish' | 'neutral';
        if (changePercent > 1) sentiment = 'bullish';
        else if (changePercent < -1) sentiment = 'bearish';
        else sentiment = 'neutral';

        const templates = newsTemplates[sentiment];
        const headline = templates[Math.floor(Math.random() * templates.length)];

        return {
            headline,
            sentiment,
            impact: Math.abs(changePercent) * 10,
        };
    }
}

// Export singleton instance
export const sentimentAnalysisService = new SentimentAnalysisService();
export default sentimentAnalysisService;
