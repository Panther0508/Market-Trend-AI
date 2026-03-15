"""
Data fetching module for Market Trend AI application.

Provides API clients for CoinGecko and Alpha Vantage with caching,
retry logic, and error handling.
"""

import logging
import requests
from typing import Optional, Dict, Any, List, Union
from dataclasses import dataclass, field
from datetime import datetime
from abc import ABC, abstractmethod

from ..config import get_config
from ..utils import (
    APIError, RateLimitError, NetworkError, InvalidResponseError,
    retry_with_backoff, validate_response, JSON
)
from ..cache import get_cache

logger = logging.getLogger("market_trend_ai.data_fetching")


# ============================================================================
# Data Models
# ============================================================================

@dataclass
class MarketData:
    """Base class for market data."""
    
    symbol: str
    price: float
    currency: str = "USD"
    timestamp: datetime = field(default_factory=datetime.now)
    source: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "symbol": self.symbol,
            "price": self.price,
            "currency": self.currency,
            "timestamp": self.timestamp.isoformat(),
            "source": self.source,
        }


@dataclass
class CryptoData(MarketData):
    """Cryptocurrency market data."""
    
    market_cap: Optional[float] = None
    volume_24h: Optional[float] = None
    price_change_24h: Optional[float] = None
    price_change_percent_24h: Optional[float] = None
    high_24h: Optional[float] = None
    low_24h: Optional[float] = None
    circulating_supply: Optional[float] = None
    total_supply: Optional[float] = None
    ath: Optional[float] = None
    ath_change_percent: Optional[float] = None
    atl: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with additional crypto fields."""
        data = super().to_dict()
        data.update({
            "market_cap": self.market_cap,
            "volume_24h": self.volume_24h,
            "price_change_24h": self.price_change_24h,
            "price_change_percent_24h": self.price_change_percent_24h,
            "high_24h": self.high_24h,
            "low_24h": self.low_24h,
            "circulating_supply": self.circulating_supply,
            "total_supply": self.total_supply,
            "ath": self.ath,
            "ath_change_percent": self.ath_change_percent,
            "atl": self.atl,
        })
        return data


@dataclass
class StockData(MarketData):
    """Stock market data."""
    
    open: Optional[float] = None
    high: Optional[float] = None
    low: Optional[float] = None
    close: Optional[float] = None
    volume: Optional[int] = None
    previous_close: Optional[float] = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary with additional stock fields."""
        data = super().to_dict()
        data.update({
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "close": self.close,
            "volume": self.volume,
            "previous_close": self.previous_close,
        })
        return data


@dataclass
class OHLCData:
    """OHLC (Open, High, Low, Close) candlestick data."""
    
    timestamp: datetime
    open: float
    high: float
    low: float
    close: float
    symbol: str
    source: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "timestamp": self.timestamp.isoformat(),
            "open": self.open,
            "high": self.high,
            "low": self.low,
            "close": self.close,
            "symbol": self.symbol,
            "source": self.source,
        }


@dataclass
class TimeSeriesData:
    """Time series data for charts."""
    
    symbol: str
    data: List[OHLCData]
    interval: str
    source: str = ""
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "symbol": self.symbol,
            "data": [d.to_dict() for d in self.data],
            "interval": self.interval,
            "source": self.source,
        }


# ============================================================================
# Base API Client
# ============================================================================

class BaseAPIClient(ABC):
    """Abstract base class for API clients."""
    
    def __init__(self, source_name: str, base_url: str, api_key: Optional[str] = None):
        """
        Initialize API client.
        
        Args:
            source_name: Name of the data source
            base_url: Base URL for API
            api_key: Optional API key
        """
        self.source_name = source_name
        self.base_url = base_url
        self.api_key = api_key
        self.cache = get_cache()
        self.config = get_config()
        
        # Session for connection pooling
        self.session = requests.Session()
        self.session.headers.update({
            "Accept": "application/json",
            "User-Agent": "Market-Trend-AI/1.0",
        })
        
        if api_key:
            self.session.headers.update(self._get_auth_headers())
    
    @abstractmethod
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get authentication headers."""
        pass
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        use_cache: bool = True,
        cache_ttl: Optional[int] = None,
    ) -> JSON:
        """
        Make an API request with caching and retry logic.
        
        Args:
            method: HTTP method
            endpoint: API endpoint
            params: Query parameters
            data: Request body data
            use_cache: Whether to use caching
            cache_ttl: Cache TTL in seconds
        
        Returns:
            JSON response
        
        Raises:
            APIError: On API errors
            NetworkError: On network errors
        """
        url = f"{self.base_url}{endpoint}"
        
        # Check cache
        if use_cache:
            cache_key = f"{endpoint}:{str(params)}"
            cached = self.cache.get(cache_key, self.source_name)
            if cached is not None:
                logger.debug(f"Cache hit for {self.source_name}:{endpoint}")
                return cached
        
        # Make request with retry logic
        response = self._request_with_retry(method, url, params, data)
        
        # Process response
        try:
            json_data = response.json()
        except ValueError as e:
            raise InvalidResponseError(
                f"Invalid JSON response: {e}",
                source=self.source_name,
                response_data=response.text[:500]
            )
        
        # Cache response
        if use_cache:
            self.cache.set(cache_key, json_data, self.source_name, cache_ttl)
        
        return json_data
    
    @retry_with_backoff(source="base")
    def _request_with_retry(
        self,
        method: str,
        url: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
    ) -> requests.Response:
        """
        Make request with retry logic.
        
        Args:
            method: HTTP method
            url: Full URL
            params: Query parameters
            data: Request body
        
        Returns:
            HTTP response
        
        Raises:
            RateLimitError: On rate limit
            NetworkError: On network error
            APIError: On other API errors
        """
        try:
            response = self.session.request(
                method=method,
                url=url,
                params=params,
                json=data,
                timeout=self.config.retry.request_timeout,
            )
            
            # Handle different status codes
            if response.status_code == 429:
                retry_after = response.headers.get("Retry-After")
                raise RateLimitError(
                    f"Rate limit exceeded for {self.source_name}",
                    retry_after=int(retry_after) if retry_after else None,
                    source=self.source_name
                )
            elif response.status_code >= 500:
                raise APIError(
                    f"Server error: {response.status_code}",
                    status_code=response.status_code,
                    source=self.source_name
                )
            elif response.status_code >= 400:
                raise APIError(
                    f"Client error: {response.status_code}",
                    status_code=response.status_code,
                    source=self.source_name
                )
            
            return response
            
        except requests.exceptions.Timeout as e:
            raise NetworkError(f"Request timeout: {e}", source=self.source_name)
        except requests.exceptions.ConnectionError as e:
            raise NetworkError(f"Connection error: {e}", source=self.source_name)
        except requests.exceptions.RequestException as e:
            raise NetworkError(f"Request failed: {e}", source=self.source_name)
    
    def close(self) -> None:
        """Close the HTTP session."""
        self.session.close()


# ============================================================================
# CoinGecko API Client
# ============================================================================

class CoinGeckoClient(BaseAPIClient):
    """
    Client for CoinGecko API.
    
    Provides access to cryptocurrency data including prices, market caps,
    historical data, and more.
    
    API Documentation: https://www.coingecko.com/en/api
    """
    
    def __init__(self, api_key: Optional[str] = None):
        """
        Initialize CoinGecko client.
        
        Args:
            api_key: Optional CoinGecko API key (for premium features)
        """
        super().__init__(
            source_name="coingecko",
            base_url="https://api.coingecko.com/api/v3",
            api_key=api_key,
        )
        logger.info("CoinGecko client initialized")
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """Get CoinGecko authentication headers."""
        if self.api_key:
            return {"x-cg-demo-api-key": self.api_key}
        return {}
    
    def get_price(
        self,
        coin_ids: Union[str, List[str]],
        currencies: Union[str, List[str]] = "usd",
        include_24hr_change: bool = True,
        include_24hr_vol: bool = True,
        include_market_cap: bool = True,
    ) -> Dict[str, Dict[str, float]]:
        """
        Get current price for one or more coins.
        
        Args:
            coin_ids: Coin ID(s) (e.g., 'bitcoin', ['bitcoin', 'ethereum'])
            currencies: Currency(s) for pricing (default: 'usd')
            include_24hr_change: Include 24h price change
            include_24hr_vol: Include 24h volume
            include_market_cap: Include market cap
        
        Returns:
            Dictionary of coin prices
        
        Example:
            >>> client = CoinGeckoClient()
            >>> prices = client.get_price('bitcoin', 'usd')
            >>> print(prices['bitcoin']['usd'])
            50000.0
        """
        # Convert single values to lists
        if isinstance(coin_ids, str):
            coin_ids = [coin_ids]
        if isinstance(currencies, str):
            currencies = [currencies]
        
        params = {
            "ids": ",".join(coin_ids),
            "vs_currencies": ",".join(currencies),
            "include_24hr_change": include_24hr_change,
            "include_24hr_vol": include_24hr_vol,
            "include_market_cap": include_market_cap,
        }
        
        response = self._make_request("GET", "/simple/price", params=params)
        
        # Validate response
        if not isinstance(response, dict):
            raise InvalidResponseError(
                "Invalid price response format",
                source=self.source_name,
                response_data=response
            )
        
        return response
    
    def get_coin_market_data(
        self,
        coin_id: str,
        currency: str = "usd",
        days: int = 1,
    ) -> CryptoData:
        """
        Get detailed market data for a coin.
        
        Args:
            coin_id: Coin ID (e.g., 'bitcoin')
            currency: Target currency (default: 'usd')
            days: Number of days of data (default: 1)
        
        Returns:
            CryptoData object
        
        Example:
            >>> client = CoinGeckoClient()
            >>> data = client.get_coin_market_data('bitcoin')
            >>> print(data.price, data.market_cap)
        """
        params = {
            "vs_currency": currency,
            "days": days,
        }
        
        response = self._make_request(
            "GET", 
            f"/coins/{coin_id}",
            params=params,
        )
        
        # Parse response
        market_data = response.get("market_data", {})
        return CryptoData(
            symbol=coin_id,
            price=market_data.get("current_price", {}).get(currency, 0),
            currency=currency,
            market_cap=market_data.get("market_cap", {}).get(currency),
            volume_24h=market_data.get("total_volume", {}).get(currency),
            price_change_24h=market_data.get("price_change_24h"),
            price_change_percent_24h=market_data.get("price_change_percentage_24h"),
            high_24h=market_data.get("high_24h", {}).get(currency),
            low_24h=market_data.get("low_24h", {}).get(currency),
            circulating_supply=market_data.get("circulating_supply"),
            total_supply=market_data.get("total_supply"),
            ath=market_data.get("ath", {}).get(currency),
            ath_change_percent=market_data.get("ath_change_percentage", {}).get(currency),
            atl=market_data.get("atl", {}).get(currency),
            source=self.source_name,
        )
    
    def get_coin_ohlc(
        self,
        coin_id: str,
        currency: str = "usd",
        days: int = 1,
    ) -> List[OHLCData]:
        """
        Get OHLC (candlestick) data for a coin.
        
        Args:
            coin_id: Coin ID (e.g., 'bitcoin')
            currency: Target currency
            days: Number of days of data (1, 7, 14, 30, 90, 365, max)
        
        Returns:
            List of OHLC data points
        
        Example:
            >>> client = CoinGeckoClient()
            >>> ohlc_data = client.get_coin_ohlc('bitcoin', days=7)
            >>> for ohlc in ohlc_data[:5]:
            ...     print(ohlc.timestamp, ohlc.close)
        """
        params = {
            "vs_currency": currency,
            "days": days,
        }
        
        response = self._make_request(
            "GET",
            f"/coins/{coin_id}/ohlc",
            params=params,
        )
        
        if not isinstance(response, list):
            raise InvalidResponseError(
                "Invalid OHLC response format",
                source=self.source_name,
                response_data=response
            )
        
        # Parse OHLC data
        # Response format: [timestamp, open, high, low, close]
        ohlc_list = []
        for item in response:
            ohlc = OHLCData(
                timestamp=datetime.fromtimestamp(item[0] / 1000),
                open=item[1],
                high=item[2],
                low=item[3],
                close=item[4],
                symbol=coin_id,
                source=self.source_name,
            )
            ohlc_list.append(ohlc)
        
        return ohlc_list
    
    def get_coin_history(
        self,
        coin_id: str,
        date: Optional[str] = None,
        currency: str = "usd",
    ) -> Dict[str, Any]:
        """
        Get historical market data for a coin.
        
        Args:
            coin_id: Coin ID (e.g., 'bitcoin')
            date: Date in 'dd-mm-yyyy' format (optional)
            currency: Target currency
        
        Returns:
            Historical data dictionary
        
        Example:
            >>> client = CoinGeckoClient()
            >>> history = client.get_coin_history('bitcoin', '01-01-2024')
        """
        if date:
            endpoint = f"/coins/{coin_id}/history"
            params = {"date": date, "localization": "false"}
        else:
            endpoint = f"/coins/{coin_id}"
            params = {"localization": "false", "tickers": "false", "community_data": "false", "developer_data": "false"}
        
        response = self._make_request("GET", endpoint, params=params)
        
        return response
    
    def get_coin_market_chart(
        self,
        coin_id: str,
        currency: str = "usd",
        days: int = 1,
    ) -> Dict[str, List[List[float]]]:
        """
        Get market chart (prices, market caps, volumes) for a coin.
        
        Args:
            coin_id: Coin ID (e.g., 'bitcoin')
            currency: Target currency
            days: Number of days of data
        
        Returns:
            Dictionary with 'prices', 'market_caps', 'volumes'
        
        Example:
            >>> client = CoinGeckoClient()
            >>> chart = client.get_coin_market_chart('bitcoin', days=7)
            >>> prices = chart['prices']
        """
        params = {
            "vs_currency": currency,
            "days": days,
        }
        
        response = self._make_request(
            "GET",
            f"/coins/{coin_id}/market_chart",
            params=params,
        )
        
        return response
    
    def get_coins_list(self) -> List[Dict[str, str]]:
        """
        Get list of all available coins.
        
        Returns:
            List of coin metadata
        
        Example:
            >>> client = CoinGeckoClient()
            >>> coins = client.get_coins_list()
            >>> print(len(coins))
            10000+
        """
        response = self._make_request("GET", "/coins/list")
        
        if not isinstance(response, list):
            raise InvalidResponseError(
                "Invalid coins list response",
                source=self.source_name,
                response_data=response
            )
        
        return response
    
    def get_trending_coins(self) -> List[Dict[str, Any]]:
        """
        Get trending coins from CoinGecko's trending section.
        
        Returns:
            List of trending coin data
        
        Example:
            >>> client = CoinGeckoClient()
            >>> trending = client.get_trending_coins()
            >>> for coin in trending[:5]:
            ...     print(coin['item']['name'])
        """
        response = self._make_request("GET", "/search/trending")
        
        return response.get("coins", [])
    
    def get_global_data(self) -> Dict[str, Any]:
        """
        Get global cryptocurrency market data.
        
        Returns:
            Global market data
        
        Example:
            >>> client = CoinGeckoClient()
            >>> global_data = client.get_global_data()
            >>> print(global_data['data']['total_market_cap']['usd'])
        """
        response = self._make_request("GET", "/global")
        
        return response.get("data", {})


# ============================================================================
# Alpha Vantage API Client
# ============================================================================

class AlphaVantageClient(BaseAPIClient):
    """
    Client for Alpha Vantage API.
    
    Provides access to stock market data, forex rates,
    commodities, and technical indicators.
    
    API Documentation: https://www.alphavantage.co/documentation/
    """
    
    # Function name constants
    class Functions:
        """Alpha Vantage function names."""
        TIME_SERIES_INTRADAY = "TIME_SERIES_INTRADAY"
        TIME_SERIES_DAILY = "TIME_SERIES_DAILY"
        TIME_SERIES_DAILY_ADJUSTED = "TIME_SERIES_DAILY_ADJUSTED"
        TIME_SERIES_WEEKLY = "TIME_SERIES_WEEKLY"
        TIME_SERIES_MONTHLY = "TIME_SERIES_MONTHLY"
        GLOBAL_QUOTE = "GLOBAL_QUOTE"
        FOREX_DAILY = "FX_DAILY"
        FOREX_INTRADAY = "FX_INTRADAY"
        CRYPTO_INTRADAY = "CRYPTO_INTRADY"
        SMA = "SMA"
        EMA = "EMA"
        RSI = "RSI"
        MACD = "MACD"
        BOLLINGER = "BBANDS"
        ADX = "ADX"
        NEWS_SENTIMENT = "NEWS_SENTIMENT"
        SENTIMENT_NEWS = "NEWS_SENTIMENT"
    
    def __init__(self, api_key: str):
        """
        Initialize Alpha Vantage client.
        
        Args:
            api_key: Alpha Vantage API key (required)
        
        Raises:
            ValueError: If API key is not provided
        """
        if not api_key:
            raise ValueError("Alpha Vantage API key is required")
        
        super().__init__(
            source_name="alphavantage",
            base_url="https://www.alphavantage.co/query",
            api_key=api_key,
        )
        logger.info("Alpha Vantage client initialized")
    
    def _get_auth_headers(self) -> Dict[str, str]:
        """No additional auth headers needed - API key in params."""
        return {}
    
    def _make_request(
        self,
        method: str,
        endpoint: str,
        params: Optional[Dict[str, Any]] = None,
        data: Optional[Dict[str, Any]] = None,
        use_cache: bool = True,
        cache_ttl: Optional[int] = None,
    ) -> JSON:
        """Override to add API key to params."""
        if params is None:
            params = {}
        
        # Add API key to params
        params["apikey"] = self.api_key
        
        return super()._make_request(method, endpoint, params, data, use_cache, cache_ttl)
    
    def get_quote(self, symbol: str) -> StockData:
        """
        Get real-time quote for a stock symbol.
        
        Args:
            symbol: Stock symbol (e.g., 'AAPL', 'MSFT')
        
        Returns:
            StockData object
        
        Example:
            >>> client = AlphaVantageClient("YOUR_API_KEY")
            >>> quote = client.get_quote("AAPL")
            >>> print(quote.price, quote.open, quote.high, quote.low)
        """
        params = {"function": self.Functions.GLOBAL_QUOTE, "symbol": symbol}
        
        response = self._make_request("GET", "", params=params)
        
        # Check for API note or error
        if "Note" in response or "Information" in response:
            raise RateLimitError(
                "API rate limit reached",
                source=self.source_name
            )
        
        quote = response.get("Global Quote", {})
        
        if not quote:
            raise InvalidResponseError(
                f"No data for symbol {symbol}",
                source=self.source_name,
                response_data=response
            )
        
        return StockData(
            symbol=symbol,
            price=float(quote.get("05. price", 0)),
            open=float(quote.get("02. open", 0)),
            high=float(quote.get("03. high", 0)),
            low=float(quote.get("04. low", 0)),
            volume=int(quote.get("06. volume", 0)),
            previous_close=float(quote.get("08. previous close", 0)),
            currency="USD",
            source=self.source_name,
        )
    
    def get_daily_time_series(
        self,
        symbol: str,
        output_size: str = "compact",
    ) -> TimeSeriesData:
        """
        Get daily time series for a stock.
        
        Args:
            symbol: Stock symbol
            output_size: 'compact' (100 days) or 'full' (20+ years)
        
        Returns:
            TimeSeriesData object
        
        Example:
            >>> client = AlphaVantageClient("YOUR_API_KEY")
            >>> ts = client.get_daily_time_series("AAPL")
            >>> for day in ts.data[:5]:
            ...     print(day.date, day.close)
        """
        params = {
            "function": self.Functions.TIME_SERIES_DAILY,
            "symbol": symbol,
            "outputsize": output_size,
        }
        
        response = self._make_request("GET", "", params=params)
        
        # Check for rate limit
        if "Note" in response or "Information" in response:
            raise RateLimitError(
                "API rate limit reached",
                source=self.source_name
            )
        
        time_series = response.get("Time Series (Daily)", {})
        
        if not time_series:
            raise InvalidResponseError(
                f"No time series data for {symbol}",
                source=self.source_name,
                response_data=response
            )
        
        # Parse time series
        ohlc_list = []
        for date_str, values in time_series.items():
            ohlc = OHLCData(
                timestamp=datetime.strptime(date_str, "%Y-%m-%d"),
                open=float(values.get("1. open", 0)),
                high=float(values.get("2. high", 0)),
                low=float(values.get("3. low", 0)),
                close=float(values.get("4. close", 0)),
                volume=int(values.get("5. volume", 0)),
                symbol=symbol,
                source=self.source_name,
            )
            ohlc_list.append(ohlc)
        
        # Sort by date (oldest first)
        ohlc_list.sort(key=lambda x: x.timestamp)
        
        return TimeSeriesData(
            symbol=symbol,
            data=ohlc_list,
            interval="daily",
            source=self.source_name,
        )
    
    def get_technical_indicator(
        self,
        symbol: str,
        indicator: str,
        interval: str = "daily",
        time_period: int = 14,
        series_type: str = "close",
    ) -> Dict[str, Any]:
        """
        Get technical indicator data.
        
        Args:
            symbol: Stock symbol
            indicator: Indicator name (SMA, EMA, RSI, MACD, BBANDS, ADX)
            interval: Time interval (1min, 5min, 15min, 30min, 60min, daily)
            time_period: Number of data points for indicator
            series_type: Price type (open, high, low, close)
        
        Returns:
            Technical indicator data
        
        Example:
            >>> client = AlphaVantageClient("YOUR_API_KEY")
            >>> rsi = client.get_technical_indicator("AAPL", "RSI")
            >>> print(rsi['Technical Analysis: RSI'])
        """
        indicator_functions = {
            "SMA": self.Functions.SMA,
            "EMA": self.Functions.EMA,
            "RSI": self.Functions.RSI,
            "MACD": self.Functions.MACD,
            "BBANDS": self.Functions.BOLLINGER,
            "ADX": self.Functions.ADX,
        }
        
        params = {
            "function": indicator_functions.get(indicator, indicator),
            "symbol": symbol,
            "interval": interval,
            "time_period": time_period,
            "series_type": series_type,
        }
        
        response = self._make_request("GET", "", params=params)
        
        # Check for rate limit
        if "Note" in response or "Information" in response:
            raise RateLimitError(
                "API rate limit reached",
                source=self.source_name
            )
        
        return response
    
    def get_forex_daily(
        self,
        from_symbol: str,
        to_symbol: str,
        output_size: str = "compact",
    ) -> Dict[str, Any]:
        """
        Get daily forex exchange rate data.
        
        Args:
            from_symbol: Source currency (e.g., 'EUR')
            to_symbol: Target currency (e.g., 'USD')
            output_size: 'compact' or 'full'
        
        Returns:
            Daily forex data
        
        Example:
            >>> client = AlphaVantageClient("YOUR_API_KEY")
            >>> forex = client.get_forex_daily("EUR", "USD")
        """
        params = {
            "function": self.Functions.FOREX_DAILY,
            "from_symbol": from_symbol,
            "to_symbol": to_symbol,
            "outputsize": output_size,
        }
        
        response = self._make_request("GET", "", params=params)
        
        return response
    
    def get_crypto_intraday(
        self,
        symbol: str,
        market: str = "USD",
        interval: str = "5min",
    ) -> Dict[str, Any]:
        """
        Get intraday crypto exchange rate data.
        
        Args:
            symbol: Crypto symbol (e.g., 'BTC')
            market: Market currency (e.g., 'USD')
            interval: Time interval (1min, 5min, 15min, 30min, 60min)
        
        Returns:
            Intraday crypto data
        
        Example:
            >>> client = AlphaVantageClient("YOUR_API_KEY")
            >>> crypto = client.get_crypto_intraday("BTC", "USD")
        """
        params = {
            "function": self.Functions.CRYPTO_INTRADAY,
            "symbol": symbol,
            "market": market,
            "interval": interval,
        }
        
        response = self._make_request("GET", "", params=params)
        
        return response
    
    def get_news_sentiment(
        self,
        symbols: Optional[str] = None,
        topics: Optional[str] = None,
        limit: int = 50,
    ) -> List[Dict[str, Any]]:
        """
        Get financial news with sentiment analysis.
        
        Args:
            symbols: Comma-separated stock symbols (optional)
            topics: Topic filter (optional, e.g., 'technology')
            limit: Maximum number of articles
        
        Returns:
            List of news articles with sentiment
        
        Example:
            >>> client = AlphaVantageClient("YOUR_API_KEY")
            >>> news = client.get_news_sentiment(symbols="AAPL,MSFT")
            >>> for article in news[:3]:
            ...     print(article['title'])
        """
        params = {
            "function": self.Functions.NEWS_SENTIMENT,
            "limit": limit,
        }
        
        if symbols:
            params["tickers"] = symbols
        if topics:
            params["topics"] = topics
        
        response = self._make_request("GET", "", params=params)
        
        feed = response.get("feed", [])
        
        return feed


# ============================================================================
# Client Factory
# ============================================================================

def get_coingecko_client(api_key: Optional[str] = None) -> CoinGeckoClient:
    """
    Get a CoinGecko client instance.
    
    Args:
        api_key: Optional API key
    
    Returns:
        CoinGeckoClient instance
    
    Example:
        >>> client = get_coingecko_client()
    """
    config = get_config()
    api_key = api_key or config.api.coingecko_api_key
    return CoinGeckoClient(api_key=api_key)


def get_alphavantage_client(api_key: Optional[str] = None) -> AlphaVantageClient:
    """
    Get an Alpha Vantage client instance.
    
    Args:
        api_key: Optional API key (required if not in config)
    
    Returns:
        AlphaVantageClient instance
    
    Example:
        >>> client = get_alphavantage_client()
    """
    config = get_config()
    api_key = api_key or config.api.alpha_vantage_api_key
    return AlphaVantageClient(api_key=api_key)


__all__ = [
    "BaseAPIClient",
    "CoinGeckoClient",
    "AlphaVantageClient",
    "MarketData",
    "CryptoData",
    "StockData",
    "OHLCData",
    "TimeSeriesData",
    "get_coingecko_client",
    "get_alphavantage_client",
]
