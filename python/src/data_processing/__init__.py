"""
Data processing module for Market Trend AI application.

Provides functions for cleaning, transforming, and analyzing market data.
Includes technical indicator calculations, price analysis, and data aggregation.
"""

import logging
from typing import List, Dict, Any, Optional, Union, Tuple
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from collections import defaultdict

from ..data_fetching import CryptoData, StockData, OHLCData, TimeSeriesData

logger = logging.getLogger("market_trend_ai.data_processing")


# ============================================================================
# Data Models
# ============================================================================

@dataclass
class PriceChange:
    """Represents price change information."""
    
    absolute: float
    percentage: float
    period: str  # e.g., '1h', '24h', '7d'
    direction: str  # 'up', 'down', 'neutral'
    
    @classmethod
    def from_prices(cls, old_price: float, new_price: float, period: str) -> "PriceChange":
        """Create PriceChange from old and new prices."""
        absolute = new_price - old_price
        percentage = (absolute / old_price * 100) if old_price > 0 else 0
        
        if absolute > 0:
            direction = "up"
        elif absolute < 0:
            direction = "down"
        else:
            direction = "neutral"
        
        return cls(
            absolute=absolute,
            percentage=percentage,
            period=period,
            direction=direction,
        )


@dataclass
class TechnicalIndicator:
    """Represents a technical indicator value."""
    
    name: str
    value: float
    timestamp: datetime
    parameters: Dict[str, Any] = field(default_factory=dict)


@dataclass 
class AggregatedMarketData:
    """Combined market data from multiple sources."""
    
    symbol: str
    price: float
    sources: List[str] = field(default_factory=list)
    price_changes: Dict[str, PriceChange] = field(default_factory=dict)
    technical_indicators: Dict[str, TechnicalIndicator] = field(default_factory=dict)
    metadata: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "symbol": self.symbol,
            "price": self.price,
            "sources": self.sources,
            "price_changes": {
                k: {"absolute": v.absolute, "percentage": v.percentage, "period": v.period, "direction": v.direction}
                for k, v in self.price_changes.items()
            },
            "technical_indicators": {
                k: {"name": v.name, "value": v.value, "timestamp": v.timestamp.isoformat(), "parameters": v.parameters}
                for k, v in self.technical_indicators.items()
            },
            "metadata": self.metadata,
        }


# ============================================================================
# Data Cleaning Functions
# ============================================================================

def clean_numeric_value(value: Any, default: float = 0.0) -> float:
    """
    Clean and convert a numeric value.
    
    Args:
        value: Value to clean
        default: Default value if conversion fails
    
    Returns:
        Cleaned float value
    
    Example:
        >>> clean_numeric_value("$1,234.56")
        1234.56
        >>> clean_numeric_value(None, default=0.0)
        0.0
    """
    if value is None:
        return default
    
    if isinstance(value, (int, float)):
        return float(value)
    
    if isinstance(value, str):
        # Remove currency symbols, commas, spaces
        cleaned = value.replace("$", "").replace(",", "").replace(" ", "").strip()
        try:
            return float(cleaned)
        except ValueError:
            return default
    
    return default


def clean_ohlc_data(data: List[OHLCData]) -> List[OHLCData]:
    """
    Clean OHLC data by removing invalid entries.
    
    Args:
        data: List of OHLC data points
    
    Returns:
        Cleaned list of OHLC data
    
    Example:
        >>> cleaned = clean_ohlc_data(ohlc_data)
    """
    cleaned = []
    for item in data:
        # Skip entries with zero or negative values
        if item.open <= 0 or item.high <= 0 or item.low <= 0 or item.close <= 0:
            logger.warning(f"Skipping invalid OHLC data: {item.timestamp}")
            continue
        cleaned.append(item)
    
    return cleaned


def normalize_market_data(data: Dict[str, Any], source: str) -> Dict[str, Any]:
    """
    Normalize market data from different sources to a common format.
    
    Args:
        data: Raw market data
        source: Data source identifier
    
    Returns:
        Normalized market data dictionary
    
    Example:
        >>> normalized = normalize_market_data(raw_data, "coingecko")
    """
    normalized = {
        "symbol": data.get("symbol", "").upper(),
        "price": clean_numeric_value(data.get("price", data.get("current_price"))),
        "volume": clean_numeric_value(data.get("volume", data.get("volume_24h"))),
        "market_cap": clean_numeric_value(data.get("market_cap")),
        "timestamp": datetime.now().isoformat(),
        "source": source,
    }
    
    return normalized


# ============================================================================
# Price Analysis Functions
# ============================================================================

def calculate_price_change(
    data: List[OHLCData],
    period: str = "24h",
) -> PriceChange:
    """
    Calculate price change over a period.
    
    Args:
        data: OHLC data points (should be sorted by timestamp)
        period: Period string (e.g., '24h', '7d')
    
    Returns:
        PriceChange object
    
    Example:
        >>> change = calculate_price_change(ohlc_data, "24h")
        >>> print(change.percentage)
    """
    if len(data) < 2:
        return PriceChange(absolute=0, percentage=0, period=period, direction="neutral")
    
    # Determine number of periods based on interval
    latest = data[-1]
    oldest = data[0]
    
    return PriceChange.from_prices(
        old_price=oldest.close,
        new_price=latest.close,
        period=period,
    )


def calculate_return(data: List[OHLCData], period: Optional[int] = None) -> float:
    """
    Calculate return over a period.
    
    Args:
        data: OHLC data points
        period: Number of data points to calculate return over (None = entire series)
    
    Returns:
        Return as decimal (e.g., 0.05 = 5%)
    
    Example:
        >>> return_val = calculate_return(ohlc_data, period=30)
    """
    if not data:
        return 0.0
    
    if period is None:
        start_idx = 0
    else:
        start_idx = max(0, len(data) - period)
    
    start_price = data[start_idx].close
    end_price = data[-1].close
    
    if start_price == 0:
        return 0.0
    
    return (end_price - start_price) / start_price


def calculate_volatility(data: List[OHLCData], period: Optional[int] = None) -> float:
    """
    Calculate price volatility (standard deviation of returns).
    
    Args:
        data: OHLC data points
        period: Number of data points to calculate over
    
    Returns:
        Volatility as decimal
    
    Example:
        >>> vol = calculate_volatility(ohlc_data)
    """
    if len(data) < 2:
        return 0.0
    
    if period is None:
        period = len(data)
    
    start_idx = max(0, len(data) - period)
    prices = [d.close for d in data[start_idx:]]
    
    # Calculate daily returns
    returns = []
    for i in range(1, len(prices)):
        if prices[i-1] != 0:
            ret = (prices[i] - prices[i-1]) / prices[i-1]
            returns.append(ret)
    
    if not returns:
        return 0.0
    
    # Calculate standard deviation
    mean = sum(returns) / len(returns)
    variance = sum((r - mean) ** 2 for r in returns) / len(returns)
    
    return variance ** 0.5


# ============================================================================
# Technical Indicator Functions
# ============================================================================

def calculate_sma(data: List[OHLCData], period: int = 20) -> List[TechnicalIndicator]:
    """
    Calculate Simple Moving Average (SMA).
    
    Args:
        data: OHLC data points
        period: Number of periods for SMA
    
    Returns:
        List of SMA indicator values
    
    Example:
        >>> sma_20 = calculate_sma(ohlc_data, period=20)
    """
    if len(data) < period:
        return []
    
    indicators = []
    prices = [d.close for d in data]
    
    for i in range(period - 1, len(prices)):
        sma_value = sum(prices[i - period + 1:i + 1]) / period
        indicator = TechnicalIndicator(
            name="SMA",
            value=sma_value,
            timestamp=data[i].timestamp,
            parameters={"period": period},
        )
        indicators.append(indicator)
    
    return indicators


def calculate_ema(data: List[OHLCData], period: int = 20) -> List[TechnicalIndicator]:
    """
    Calculate Exponential Moving Average (EMA).
    
    Args:
        data: OHLC data points
        period: Number of periods for EMA
    
    Returns:
        List of EMA indicator values
    
    Example:
        >>> ema_20 = calculate_ema(ohlc_data, period=20)
    """
    if len(data) < period:
        return []
    
    prices = [d.close for d in data]
    multiplier = 2 / (period + 1)
    
    # Start with SMA for first EMA value
    ema_values = [sum(prices[:period]) / period]
    
    # Calculate EMA for remaining values
    for i in range(period, len(prices)):
        ema = (prices[i] - ema_values[-1]) * multiplier + ema_values[-1]
        ema_values.append(ema)
    
    indicators = []
    for i in range(period - 1, len(prices)):
        indicator = TechnicalIndicator(
            name="EMA",
            value=ema_values[i - period + 1],
            timestamp=data[i].timestamp,
            parameters={"period": period},
        )
        indicators.append(indicator)
    
    return indicators


def calculate_rsi(data: List[OHLCData], period: int = 14) -> List[TechnicalIndicator]:
    """
    Calculate Relative Strength Index (RSI).
    
    Args:
        data: OHLC data points
        period: Number of periods for RSI
    
    Returns:
        List of RSI indicator values
    
    Example:
        >>> rsi = calculate_rsi(ohlc_data, period=14)
    """
    if len(data) < period + 1:
        return []
    
    prices = [d.close for d in data]
    changes = [prices[i] - prices[i - 1] for i in range(1, len(prices))]
    
    # Separate gains and losses
    gains = [c if c > 0 else 0 for c in changes]
    losses = [-c if c < 0 else 0 for c in changes]
    
    # Calculate initial average gain and loss
    avg_gain = sum(gains[:period]) / period
    avg_loss = sum(losses[:period]) / period
    
    indicators = []
    
    for i in range(period, len(changes)):
        # Calculate smoothed averages
        avg_gain = (avg_gain * (period - 1) + gains[i]) / period
        avg_loss = (avg_loss * (period - 1) + losses[i]) / period
        
        if avg_loss == 0:
            rsi = 100
        else:
            rs = avg_gain / avg_loss
            rsi = 100 - (100 / (1 + rs))
        
        indicator = TechnicalIndicator(
            name="RSI",
            value=rsi,
            timestamp=data[i + 1].timestamp,
            parameters={"period": period},
        )
        indicators.append(indicator)
    
    return indicators


def calculate_macd(
    data: List[OHLCData],
    fast_period: int = 12,
    slow_period: int = 26,
    signal_period: int = 9,
) -> Dict[str, List[TechnicalIndicator]]:
    """
    Calculate MACD (Moving Average Convergence Divergence).
    
    Args:
        data: OHLC data points
        fast_period: Fast EMA period
        slow_period: Slow EMA period
        signal_period: Signal line period
    
    Returns:
        Dictionary with 'macd', 'signal', and 'histogram' lists
    
    Example:
        >>> macd_data = calculate_macd(ohlc_data)
        >>> print(macd_data['histogram'][-1].value)
    """
    # Calculate fast and slow EMAs
    fast_ema = calculate_ema(data, fast_period)
    slow_ema = calculate_ema(data, slow_period)
    
    if not fast_ema or not slow_ema:
        return {"macd": [], "signal": [], "histogram": []}
    
    # Align EMAs
    min_len = min(len(fast_ema), len(slow_ema))
    fast_ema = fast_ema[-min_len:]
    slow_ema = slow_ema[-min_len:]
    
    # Calculate MACD line
    macd_line = [f.value - s.value for f, s in zip(fast_ema, slow_ema)]
    macd_timestamps = [f.timestamp for f in fast_ema]
    
    # Calculate signal line (EMA of MACD)
    if len(macd_line) < signal_period:
        return {"macd": [], "signal": [], "histogram": []}
    
    signal_values = []
    multiplier = 2 / (signal_period + 1)
    
    # First signal value is SMA
    signal_values.append(sum(macd_line[:signal_period]) / signal_period)
    
    for i in range(signal_period, len(macd_line)):
        sig = (macd_line[i] - signal_values[-1]) * multiplier + signal_values[-1]
        signal_values.append(sig)
    
    # Build indicator lists
    macd_indicators = []
    signal_indicators = []
    histogram_indicators = []
    
    offset = signal_period - 1
    for i in range(len(signal_values)):
        idx = offset + i
        timestamp = macd_timestamps[idx]
        
        macd_val = macd_line[idx]
        sig_val = signal_values[i]
        hist_val = macd_val - sig_val
        
        macd_indicators.append(TechnicalIndicator(
            name="MACD",
            value=macd_val,
            timestamp=timestamp,
            parameters={"fast_period": fast_period, "slow_period": slow_period},
        ))
        
        signal_indicators.append(TechnicalIndicator(
            name="MACD_SIGNAL",
            value=sig_val,
            timestamp=timestamp,
            parameters={"signal_period": signal_period},
        ))
        
        histogram_indicators.append(TechnicalIndicator(
            name="MACD_HISTOGRAM",
            value=hist_val,
            timestamp=timestamp,
            parameters={},
        ))
    
    return {
        "macd": macd_indicators,
        "signal": signal_indicators,
        "histogram": histogram_indicators,
    }


def calculate_bollinger_bands(
    data: List[OHLCData],
    period: int = 20,
    num_std: float = 2.0,
) -> Dict[str, List[TechnicalIndicator]]:
    """
    Calculate Bollinger Bands.
    
    Args:
        data: OHLC data points
        period: Number of periods for SMA
        num_std: Number of standard deviations
    
    Returns:
        Dictionary with 'upper', 'middle', and 'lower' bands
    
    Example:
        >>> bb = calculate_bollinger_bands(ohlc_data)
    """
    if len(data) < period:
        return {"upper": [], "middle": [], "lower": []}
    
    prices = [d.close for d in data]
    sma_values = calculate_sma(data, period)
    
    upper_band = []
    middle_band = []
    lower_band = []
    
    for i in range(period - 1, len(prices)):
        sma = sma_values[i - period + 1].value
        
        # Calculate standard deviation
        slice_prices = prices[i - period + 1:i + 1]
        variance = sum((p - sma) ** 2 for p in slice_prices) / period
        std = variance ** 0.5
        
        upper = sma + (num_std * std)
        lower = sma - (num_std * std)
        
        timestamp = data[i].timestamp
        
        middle_band.append(TechnicalIndicator(
            name="BB_MIDDLE",
            value=sma,
            timestamp=timestamp,
            parameters={"period": period},
        ))
        
        upper_band.append(TechnicalIndicator(
            name="BB_UPPER",
            value=upper,
            timestamp=timestamp,
            parameters={"period": period, "num_std": num_std},
        ))
        
        lower_band.append(TechnicalIndicator(
            name="BB_LOWER",
            value=lower,
            timestamp=timestamp,
            parameters={"period": period, "num_std": num_std},
        ))
    
    return {
        "upper": upper_band,
        "middle": middle_band,
        "lower": lower_band,
    }


def calculate_all_indicators(
    data: List[OHLCData],
) -> Dict[str, List[TechnicalIndicator]]:
    """
    Calculate all available technical indicators.
    
    Args:
        data: OHLC data points
    
    Returns:
        Dictionary mapping indicator names to their values
    
    Example:
        >>> indicators = calculate_all_indicators(ohlc_data)
        >>> print(indicators['RSI'][-1].value)
    """
    indicators = {}
    
    # SMA
    indicators["SMA_20"] = calculate_sma(data, 20)
    indicators["SMA_50"] = calculate_sma(data, 50)
    indicators["SMA_200"] = calculate_sma(data, 200)
    
    # EMA
    indicators["EMA_12"] = calculate_ema(data, 12)
    indicators["EMA_26"] = calculate_ema(data, 26)
    
    # RSI
    indicators["RSI_14"] = calculate_rsi(data, 14)
    
    # MACD
    macd = calculate_macd(data)
    indicators["MACD"] = macd["macd"]
    indicators["MACD_SIGNAL"] = macd["signal"]
    indicators["MACD_HISTOGRAM"] = macd["histogram"]
    
    # Bollinger Bands
    bb = calculate_bollinger_bands(data)
    indicators["BB_UPPER"] = bb["upper"]
    indicators["BB_MIDDLE"] = bb["middle"]
    indicators["BB_LOWER"] = bb["lower"]
    
    return indicators


# ============================================================================
# Data Aggregation Functions
# ============================================================================

def aggregate_crypto_data(
    crypto_data_list: List[CryptoData],
) -> AggregatedMarketData:
    """
    Aggregate cryptocurrency data from multiple sources.
    
    Args:
        crypto_data_list: List of CryptoData from different sources
    
    Returns:
        AggregatedMarketData object
    
    Example:
        >>> from src.data_fetching import CoinGeckoClient
        >>> client = CoinGeckoClient()
        >>> data = client.get_coin_market_data('bitcoin')
        >>> aggregated = aggregate_crypto_data([data])
    """
    if not crypto_data_list:
        return AggregatedMarketData(symbol="", price=0.0)
    
    # Use the first symbol (all should be the same)
    symbol = crypto_data_list[0].symbol
    
    # Average prices from all sources
    prices = [d.price for d in crypto_data_list]
    avg_price = sum(prices) / len(prices)
    
    # Collect all sources
    sources = [d.source for d in crypto_data_list]
    
    # Aggregate metadata
    metadata = {
        "volume_24h": sum(d.volume_24h or 0 for d in crypto_data_list),
        "market_cap": sum(d.market_cap or 0 for d in crypto_data_list),
    }
    
    return AggregatedMarketData(
        symbol=symbol,
        price=avg_price,
        sources=sources,
        metadata=metadata,
    )


def aggregate_time_series(
    time_series_list: List[TimeSeriesData],
) -> TimeSeriesData:
    """
    Aggregate time series data from multiple sources.
    
    Args:
        time_series_list: List of TimeSeriesData
    
    Returns:
        Combined TimeSeriesData
    
    Example:
        >>> combined = aggregate_time_series([ts1, ts2])
    """
    if not time_series_list:
        return TimeSeriesData(symbol="", data=[], interval="")
    
    # Use first data as base
    symbol = time_series_list[0].symbol
    interval = time_series_list[0].interval
    
    # Merge OHLC data by timestamp
    data_map: Dict[str, OHLCData] = {}
    
    for ts in time_series_list:
        for ohlc in ts.data:
            key = ohlc.timestamp.strftime("%Y-%m-%d")
            if key not in data_map:
                data_map[key] = ohlc
    
    # Sort by timestamp
    sorted_data = sorted(data_map.values(), key=lambda x: x.timestamp)
    
    sources = [ts.source for ts in time_series_list]
    
    return TimeSeriesData(
        symbol=symbol,
        data=sorted_data,
        interval=interval,
        source=",".join(sources),
    )


# ============================================================================
# Market Analysis Functions
# ============================================================================

def detect_trend(data: List[OHLCData], period: int = 20) -> str:
    """
    Detect market trend based on price data.
    
    Args:
        data: OHLC data points
        period: Period to analyze
    
    Returns:
        Trend direction: 'uptrend', 'downtrend', or 'sideways'
    
    Example:
        >>> trend = detect_trend(ohlc_data)
    """
    if len(data) < period:
        return "insufficient_data"
    
    recent = data[-period:]
    first_price = recent[0].close
    last_price = recent[-1].close
    
    change_percent = ((last_price - first_price) / first_price) * 100
    
    if change_percent > 2:
        return "uptrend"
    elif change_percent < -2:
        return "downtrend"
    else:
        return "sideways"


def get_support_resistance(
    data: List[OHLCData],
    window: int = 20,
) -> Dict[str, List[float]]:
    """
    Calculate support and resistance levels.
    
    Args:
        data: OHLC data points
        window: Window size for calculation
    
    Returns:
        Dictionary with 'support' and 'resistance' levels
    
    Example:
        >>> sr = get_support_resistance(ohlc_data)
        >>> print(sr['resistance'])
    """
    if len(data) < window:
        return {"support": [], "resistance": []}
    
    highs = [d.high for d in data[-window:]]
    lows = [d.low for d in data[-window:]]
    
    # Simple support/resistance as recent highs/lows
    resistance = [max(highs)]
    support = [min(lows)]
    
    return {
        "support": support,
        "resistance": resistance,
    }


def calculate_market_strength(
    data: List[OHLCData],
) -> Dict[str, Union[float, str]]:
    """
    Calculate overall market strength indicators.
    
    Args:
        data: OHLC data points
    
    Returns:
        Dictionary with strength indicators
    
    Example:
        >>> strength = calculate_market_strength(ohlc_data)
    """
    if len(data) < 20:
        return {"strength": 0, "signal": "neutral"}
    
    # Calculate various indicators
    returns = calculate_return(data)
    volatility = calculate_volatility(data)
    trend = detect_trend(data)
    
    # Simple strength calculation
    # Positive returns + low volatility = strong
    strength = returns / (volatility + 0.01)  # Avoid division by zero
    
    if strength > 1:
        signal = "strong_buy"
    elif strength > 0.3:
        signal = "buy"
    elif strength > -0.3:
        signal = "neutral"
    elif strength > -1:
        signal = "sell"
    else:
        signal = "strong_sell"
    
    return {
        "strength": strength,
        "signal": signal,
        "trend": trend,
        "volatility": volatility,
        "return": returns,
    }


__all__ = [
    "PriceChange",
    "TechnicalIndicator",
    "AggregatedMarketData",
    "clean_numeric_value",
    "clean_ohlc_data",
    "normalize_market_data",
    "calculate_price_change",
    "calculate_return",
    "calculate_volatility",
    "calculate_sma",
    "calculate_ema",
    "calculate_rsi",
    "calculate_macd",
    "calculate_bollinger_bands",
    "calculate_all_indicators",
    "aggregate_crypto_data",
    "aggregate_time_series",
    "detect_trend",
    "get_support_resistance",
    "calculate_market_strength",
]
