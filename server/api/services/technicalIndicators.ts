/**
 * Technical Indicators Service
 * Comprehensive technical analysis calculations including
 * Moving Averages, RSI, MACD, Bollinger Bands, ATR, and more
 */

import { Candle, TechnicalIndicator, TimeFrame } from '../models';
import { priceSimulationService } from './priceSimulation';

interface IndicatorParams {
    period?: number;
    fastPeriod?: number;
    slowPeriod?: number;
    signalPeriod?: number;
    stdDev?: number;
}

class TechnicalIndicatorsService {
    /**
     * Calculate Simple Moving Average (SMA)
     */
    calculateSMA(candles: Candle[], period: number = 20): TechnicalIndicator[] {
        const results: TechnicalIndicator[] = [];

        for (let i = period - 1; i < candles.length; i++) {
            const slice = candles.slice(i - period + 1, i + 1);
            const sum = slice.reduce((acc, c) => acc + c.close, 0);
            const sma = sum / period;

            const currentPrice = candles[i].close;
            let signal: 'buy' | 'sell' | 'neutral' = 'neutral';

            if (currentPrice > sma * 1.02) signal = 'buy';
            else if (currentPrice < sma * 0.98) signal = 'sell';

            results.push({
                name: 'SMA',
                value: sma,
                signal,
                metadata: { period, currentPrice },
            });
        }

        return results;
    }

    /**
     * Calculate Exponential Moving Average (EMA)
     */
    calculateEMA(candles: Candle[], period: number = 20): TechnicalIndicator[] {
        const results: TechnicalIndicator[] = [];

        if (candles.length < period) return results;

        // First EMA is SMA
        let sum = 0;
        for (let i = 0; i < period; i++) {
            sum += candles[i].close;
        }
        let ema = sum / period;

        const multiplier = 2 / (period + 1);

        for (let i = period - 1; i < candles.length; i++) {
            ema = (candles[i].close - ema) * multiplier + ema;

            const currentPrice = candles[i].close;
            let signal: 'buy' | 'sell' | 'neutral' = 'neutral';

            if (currentPrice > ema * 1.02) signal = 'buy';
            else if (currentPrice < ema * 0.98) signal = 'sell';

            results.push({
                name: 'EMA',
                value: ema,
                signal,
                metadata: { period, currentPrice },
            });
        }

        return results;
    }

    /**
     * Calculate Relative Strength Index (RSI)
     */
    calculateRSI(candles: Candle[], period: number = 14): TechnicalIndicator[] {
        const results: TechnicalIndicator[] = [];

        if (candles.length < period + 1) return results;

        let gains = 0;
        let losses = 0;

        // Calculate initial average gain/loss
        for (let i = 1; i <= period; i++) {
            const change = candles[i].close - candles[i - 1].close;
            if (change > 0) gains += change;
            else losses -= change;
        }

        let avgGain = gains / period;
        let avgLoss = losses / period;

        // Calculate RSI for subsequent periods
        for (let i = period + 1; i < candles.length; i++) {
            const change = candles[i].close - candles[i - 1].close;
            const gain = change > 0 ? change : 0;
            const loss = change < 0 ? -change : 0;

            avgGain = (avgGain * (period - 1) + gain) / period;
            avgLoss = (avgLoss * (period - 1) + loss) / period;

            const rs = avgLoss === 0 ? 100 : avgGain / avgLoss;
            const rsi = 100 - (100 / (1 + rs));

            let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
            if (rsi < 30) signal = 'buy';
            else if (rsi > 70) signal = 'sell';

            results.push({
                name: 'RSI',
                value: rsi,
                signal,
                metadata: { period, overbought: 70, oversold: 30 },
            });
        }

        return results;
    }

    /**
     * Calculate Moving Average Convergence Divergence (MACD)
     */
    calculateMACD(
        candles: Candle[],
        fastPeriod: number = 12,
        slowPeriod: number = 26,
        signalPeriod: number = 9
    ): TechnicalIndicator[] {
        const results: TechnicalIndicator[] = [];

        if (candles.length < slowPeriod + signalPeriod) return results;

        // Calculate EMAs
        const fastEMA = this.calculateEMA(candles, fastPeriod);
        const slowEMA = this.calculateEMA(candles, slowPeriod);

        // Align EMAs
        const macdLine: number[] = [];
        const startIndex = slowPeriod - 1;

        for (let i = startIndex; i < candles.length; i++) {
            const fastIdx = i - startIndex + (fastEMA.length - (candles.length - startIndex));
            if (fastEMA[fastIdx]) {
                macdLine.push(fastEMA[fastIdx].value - slowEMA[i - startIndex].value);
            }
        }

        // Calculate signal line (EMA of MACD)
        if (macdLine.length < signalPeriod) return results;

        let signalLine: number[] = [];
        let sum = 0;
        for (let i = 0; i < signalPeriod; i++) {
            sum += macdLine[i];
        }
        let ema = sum / signalPeriod;
        const multiplier = 2 / (signalPeriod + 1);

        for (let i = signalPeriod - 1; i < macdLine.length; i++) {
            ema = (macdLine[i] - ema) * multiplier + ema;
            signalLine.push(ema);
        }

        // Build results
        for (let i = 0; i < signalLine.length; i++) {
            const macd = macdLine[i + signalPeriod - 1];
            const signal = signalLine[i];
            const histogram = macd - signal;

            let signalValue: 'buy' | 'sell' | 'neutral' = 'neutral';
            if (histogram > 0 && macd > signal) signalValue = 'buy';
            else if (histogram < 0 && macd < signal) signalValue = 'sell';

            results.push({
                name: 'MACD',
                value: macd,
                signal: signalValue,
                metadata: {
                    signalLine: signal,
                    histogram,
                    fastPeriod,
                    slowPeriod,
                    signalPeriod,
                },
            });
        }

        return results;
    }

    /**
     * Calculate Bollinger Bands
     */
    calculateBollingerBands(
        candles: Candle[],
        period: number = 20,
        stdDev: number = 2
    ): { upper: TechnicalIndicator[]; middle: TechnicalIndicator[]; lower: TechnicalIndicator[] } {
        const upper: TechnicalIndicator[] = [];
        const middle: TechnicalIndicator[] = [];
        const lower: TechnicalIndicator[] = [];

        const smaResults = this.calculateSMA(candles, period);

        for (let i = period - 1; i < candles.length; i++) {
            const slice = candles.slice(i - period + 1, i + 1);
            const mean = smaResults[i - period + 1]?.value || 0;

            // Calculate standard deviation
            const squaredDiffs = slice.map(c => Math.pow(c.close - mean, 2));
            const avgSquaredDiff = squaredDiffs.reduce((a, b) => a + b, 0) / period;
            const standardDeviation = Math.sqrt(avgSquaredDiff);

            const upperBand = mean + (stdDev * standardDeviation);
            const lowerBand = mean - (stdDev * standardDeviation);

            const currentPrice = candles[i].close;
            let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
            if (currentPrice < lowerBand) signal = 'buy';
            else if (currentPrice > upperBand) signal = 'sell';

            upper.push({
                name: 'BB_UPPER',
                value: upperBand,
                signal,
                metadata: { period, stdDev },
            });

            middle.push({
                name: 'BB_MIDDLE',
                value: mean,
                signal,
                metadata: { period, stdDev },
            });

            lower.push({
                name: 'BB_LOWER',
                value: lowerBand,
                signal,
                metadata: { period, stdDev },
            });
        }

        return { upper, middle, lower };
    }

    /**
     * Calculate Average True Range (ATR)
     */
    calculateATR(candles: Candle[], period: number = 14): TechnicalIndicator[] {
        const results: TechnicalIndicator[] = [];

        if (candles.length < period + 1) return results;

        // Calculate True Range for each candle
        const trueRanges: number[] = [];

        for (let i = 1; i < candles.length; i++) {
            const high = candles[i].high;
            const low = candles[i].low;
            const prevClose = candles[i - 1].close;

            const tr = Math.max(
                high - low,
                Math.abs(high - prevClose),
                Math.abs(low - prevClose)
            );
            trueRanges.push(tr);
        }

        // Calculate ATR
        let atr = trueRanges.slice(0, period).reduce((a, b) => a + b, 0) / period;

        for (let i = period; i < trueRanges.length; i++) {
            atr = ((atr * (period - 1)) + trueRanges[i]) / period;

            const currentPrice = candles[i + 1].close;
            const atrPercent = (atr / currentPrice) * 100;

            let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
            if (atrPercent > 5) signal = 'sell'; // High volatility
            else if (atrPercent < 1) signal = 'buy'; // Low volatility

            results.push({
                name: 'ATR',
                value: atr,
                signal,
                metadata: { period, percent: atrPercent },
            });
        }

        return results;
    }

    /**
     * Calculate Stochastic Oscillator
     */
    calculateStochastic(
        candles: Candle[],
        kPeriod: number = 14,
        dPeriod: number = 3
    ): { k: TechnicalIndicator[]; d: TechnicalIndicator[] } {
        const k: TechnicalIndicator[] = [];
        const d: TechnicalIndicator[] = [];

        if (candles.length < kPeriod + dPeriod) return { k, d };

        for (let i = kPeriod - 1; i < candles.length; i++) {
            const slice = candles.slice(i - kPeriod + 1, i + 1);
            const high = Math.max(...slice.map(c => c.high));
            const low = Math.min(...slice.map(c => c.low));
            const close = candles[i].close;

            const kValue = ((close - low) / (high - low)) * 100;

            let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
            if (kValue < 20) signal = 'buy';
            else if (kValue > 80) signal = 'sell';

            k.push({
                name: 'STOCH_K',
                value: kValue,
                signal,
                metadata: { period: kPeriod },
            });
        }

        // Calculate %D (SMA of %K)
        for (let i = dPeriod - 1; i < k.length; i++) {
            const slice = k.slice(i - dPeriod + 1, i + 1);
            const dValue = slice.reduce((sum, indicator) => sum + indicator.value, 0) / dPeriod;

            let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
            if (dValue < 20) signal = 'buy';
            else if (dValue > 80) signal = 'sell';

            d.push({
                name: 'STOCH_D',
                value: dValue,
                signal,
                metadata: { period: dPeriod },
            });
        }

        return { k, d };
    }

    /**
     * Calculate On-Balance Volume (OBV)
     */
    calculateOBV(candles: Candle[]): TechnicalIndicator[] {
        const results: TechnicalIndicator[] = [];

        if (candles.length < 2) return results;

        let obv = 0;

        for (let i = 1; i < candles.length; i++) {
            if (candles[i].close > candles[i - 1].close) {
                obv += candles[i].volume;
            } else if (candles[i].close < candles[i - 1].close) {
                obv -= candles[i].volume;
            }

            const prevObv = results[results.length - 1]?.value || 0;
            let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
            if (obv > prevObv * 1.05) signal = 'buy';
            else if (obv < prevObv * 0.95) signal = 'sell';

            results.push({
                name: 'OBV',
                value: obv,
                signal,
                metadata: { volume: candles[i].volume },
            });
        }

        return results;
    }

    /**
     * Calculate Volume Weighted Average Price (VWAP)
     */
    calculateVWAP(candles: Candle[]): TechnicalIndicator[] {
        const results: TechnicalIndicator[] = [];

        if (candles.length === 0) return results;

        let cumulativeTPV = 0;
        let cumulativeVolume = 0;

        for (const candle of candles) {
            const typicalPrice = (candle.high + candle.low + candle.close) / 3;
            cumulativeTPV += typicalPrice * candle.volume;
            cumulativeVolume += candle.volume;

            const vwap = cumulativeVolume > 0 ? cumulativeTPV / cumulativeVolume : 0;

            const currentPrice = candle.close;
            let signal: 'buy' | 'sell' | 'neutral' = 'neutral';
            if (currentPrice > vwap * 1.01) signal = 'buy';
            else if (currentPrice < vwap * 0.99) signal = 'sell';

            results.push({
                name: 'VWAP',
                value: vwap,
                signal,
                metadata: { typicalPrice, volume: candle.volume },
            });
        }

        return results;
    }

    /**
     * Calculate All Indicators at once
     */
    calculateAll(candles: Candle[], params: IndicatorParams = {}): Record<string, unknown> {
        const { period = 20, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9, stdDev = 2 } = params;

        return {
            sma: this.calculateSMA(candles, period),
            ema: this.calculateEMA(candles, period),
            rsi: this.calculateRSI(candles, 14),
            macd: this.calculateMACD(candles, fastPeriod, slowPeriod, signalPeriod),
            bollinger: this.calculateBollingerBands(candles, period, stdDev),
            atr: this.calculateATR(candles, 14),
            stochastic: this.calculateStochastic(candles).k,
            obv: this.calculateOBV(candles),
            vwap: this.calculateVWAP(candles),
        };
    }

    /**
     * Get latest indicator values for an asset
     */
    getLatestIndicators(symbol: string, timeframe: TimeFrame = '1h'): Record<string, TechnicalIndicator> {
        const candles = priceSimulationService.generateHistoricalCandles(symbol, timeframe, 100);

        if (candles.length === 0) return {};

        const indicators = this.calculateAll(candles) as Record<string, TechnicalIndicator[]>;
        const latest: Record<string, TechnicalIndicator> = {};

        Object.entries(indicators).forEach(([key, values]) => {
            if (Array.isArray(values) && values.length > 0) {
                const latestValue = values[values.length - 1];
                if (latestValue) {
                    latest[key] = latestValue;
                }
            }
        });

        return latest;
    }
}

// Export singleton instance
export const technicalIndicatorsService = new TechnicalIndicatorsService();
export default technicalIndicatorsService;
