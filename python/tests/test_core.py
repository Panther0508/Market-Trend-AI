"""
Tests for Market Trend AI - Core Module

These tests verify the core functionality of the application.
"""

import pytest
from unittest.mock import Mock, patch
from datetime import datetime, timedelta


class TestConfig:
    """Tests for configuration module."""
    
    def test_config_loads_defaults(self):
        """Test that configuration loads with default values."""
        from src.config import get_config
        
        config = get_config()
        
        assert config is not None
        assert config.cache.cache_type in ["file", "redis"]
        assert config.retry.max_retries >= 0
        assert config.logging.log_level in ["DEBUG", "INFO", "WARNING", "ERROR", "CRITICAL"]
    
    def test_cache_duration_per_source(self):
        """Test cache duration varies by source."""
        from src.config import get_config
        
        config = get_config()
        
        coingecko_ttl = config.get_cache_duration_for_source("coingecko")
        alphavantage_ttl = config.get_cache_duration_for_source("alphavantage")
        
        assert coingecko_ttl > 0
        assert alphavantage_ttl > 0


class TestUtils:
    """Tests for utility functions."""
    
    def test_exponential_backoff(self):
        """Test exponential backoff calculation."""
        from src.utils import exponential_backoff
        
        # First attempt should have minimal delay
        delay0 = exponential_backoff(0, base_delay=1.0)
        assert 0.5 <= delay0 <= 1.5
        
        # Subsequent attempts should increase
        delay3 = exponential_backoff(3, base_delay=1.0)
        assert delay3 > delay0
    
    def test_format_api_error(self):
        """Test API error formatting."""
        from src.utils import APIError, format_api_error
        
        error = APIError("Test error", status_code=500, source="test")
        formatted = format_api_error(error, verbose=False)
        
        assert "Test error" in formatted
    
    def test_validate_response(self):
        """Test response validation."""
        from src.utils import validate_response, InvalidResponseError
        
        # Valid response
        result = validate_response({"key": "value"}, dict)
        assert result == {"key": "value"}
        
        # Invalid type
        with pytest.raises(InvalidResponseError):
            validate_response([1, 2, 3], dict)
        
        # None response
        with pytest.raises(InvalidResponseError):
            validate_response(None, dict)


class TestDataProcessing:
    """Tests for data processing functions."""
    
    def test_clean_numeric_value(self):
        """Test numeric value cleaning."""
        from src.data_processing import clean_numeric_value
        
        assert clean_numeric_value("$1,234.56") == 1234.56
        assert clean_numeric_value(None, default=0.0) == 0.0
        assert clean_numeric_value(42) == 42.0
        assert clean_numeric_value("invalid", default=1.0) == 1.0
    
    def test_price_change(self):
        """Test price change calculation."""
        from src.data_processing import PriceChange, calculate_price_change
        from src.data_fetching import OHLCData
        
        # Create sample data
        data = [
            OHLCData(
                timestamp=datetime.now() - timedelta(days=1),
                open=100, high=105, low=95, close=100,
                symbol="TEST"
            ),
            OHLCData(
                timestamp=datetime.now(),
                open=105, high=110, low=104, close=110,
                symbol="TEST"
            ),
        ]
        
        change = calculate_price_change(data, "24h")
        
        assert change.absolute == 10.0
        assert change.percentage == 10.0
        assert change.direction == "up"
    
    def test_sma_calculation(self):
        """Test SMA calculation."""
        from src.data_processing import calculate_sma
        from src.data_fetching import OHLCData
        
        # Create sample data with increasing prices
        base_time = datetime.now()
        data = [
            OHLCData(
                timestamp=base_time - timedelta(days=i),
                open=i+1, high=i+2, low=i, close=i+1,
                symbol="TEST"
            )
            for i in range(30, 0, -1)
        ]
        
        sma = calculate_sma(data, period=20)
        
        assert len(sma) > 0
        assert sma[-1].name == "SMA"
    
    def test_rsi_calculation(self):
        """Test RSI calculation."""
        from src.data_processing import calculate_rsi
        from src.data_fetching import OHLCData
        
        # Create sample oscillating data
        base_time = datetime.now()
        prices = [100, 102, 101, 103, 102, 104, 103, 105, 104, 106, 
                  105, 107, 106, 108, 107, 109, 108, 110]
        
        data = [
            OHLCData(
                timestamp=base_time - timedelta(days=len(prices)-i),
                open=prices[i], high=prices[i]+1, low=prices[i]-1, close=prices[i],
                symbol="TEST"
            )
            for i in range(len(prices))
        ]
        
        rsi = calculate_rsi(data, period=14)
        
        assert len(rsi) > 0
        assert 0 <= rsi[-1].value <= 100
    
    def test_volatility(self):
        """Test volatility calculation."""
        from src.data_processing import calculate_volatility
        from src.data_fetching import OHLCData
        
        base_time = datetime.now()
        data = [
            OHLCData(
                timestamp=base_time - timedelta(days=30-i),
                open=100, high=105, low=95, close=100 + (i % 5 - 2),
                symbol="TEST"
            )
            for i in range(30)
        ]
        
        vol = calculate_volatility(data)
        
        assert vol >= 0


class TestAIInference:
    """Tests for AI inference module."""
    
    @patch('src.ai_inference.get_config')
    def test_sentiment_label_enum(self, mock_config):
        """Test sentiment label enum."""
        from src.ai_inference import SentimentLabel
        
        assert SentimentLabel.POSITIVE.value == "positive"
        assert SentimentLabel.NEGATIVE.value == "negative"
        assert SentimentLabel.NEUTRAL.value == "neutral"
    
    def test_sentiment_result_to_dict(self):
        """Test sentiment result serialization."""
        from src.ai_inference import SentimentResult, SentimentLabel
        
        result = SentimentResult(
            label=SentimentLabel.POSITIVE,
            score=0.95,
            text="Great news!",
        )
        
        d = result.to_dict()
        
        assert d["label"] == "positive"
        assert d["score"] == 0.95
    
    def test_market_summary(self):
        """Test market summary creation."""
        from src.ai_inference import MarketSummary
        
        summary = MarketSummary(
            title="Test Summary",
            summary="Test summary text",
            key_points=["Point 1", "Point 2"],
        )
        
        d = summary.to_dict()
        
        assert d["title"] == "Test Summary"
        assert len(d["key_points"]) == 2


class TestCaching:
    """Tests for caching module."""
    
    def test_file_cache_backend(self):
        """Test file cache backend."""
        from src.cache import FileCacheBackend
        
        backend = FileCacheBackend(cache_dir=".cache/test")
        
        # Test set and get
        backend.set("test_key", {"value": 42}, ttl=60, source="test")
        
        result = backend.get("test_key")
        assert result == {"value": 42}
        
        # Test delete
        deleted = backend.delete("test_key")
        assert deleted is True
        
        result = backend.get("test_key")
        assert result is None
        
        # Cleanup
        backend.clear()
    
    def test_cache_entry(self):
        """Test cache entry model."""
        from src.cache import CacheEntry
        import time
        
        entry = CacheEntry(
            key="test",
            value={"data": 123},
            created_at=time.time(),
            expires_at=time.time() + 60,
            source="test",
        )
        
        assert entry.is_expired is False
        
        # Create expired entry
        expired = CacheEntry(
            key="test",
            value={"data": 123},
            created_at=time.time() - 120,
            expires_at=time.time() - 60,
            source="test",
        )
        
        assert expired.is_expired is True


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
