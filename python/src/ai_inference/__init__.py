"""
AI inference module for Market Trend AI application.

Provides NLP capabilities using Hugging Face transformers including:
- Sentiment analysis on financial news
- Text generation for market summaries
- Conversational AI for market data interaction
"""

import logging
from typing import List, Dict, Any, Optional, Union
from dataclasses import dataclass, field
from enum import Enum
from abc import ABC, abstractmethod

from ..config import get_config
from ..utils import APIError, safe_api_call

logger = logging.getLogger("market_trend_ai.ai_inference")


# ============================================================================
# Data Models
# ============================================================================

class SentimentLabel(Enum):
    """Sentiment classification labels."""
    POSITIVE = "positive"
    NEGATIVE = "negative"
    NEUTRAL = "neutral"


@dataclass
class SentimentResult:
    """Result of sentiment analysis."""
    
    label: SentimentLabel
    score: float
    raw_scores: Dict[str, float] = field(default_factory=dict)
    text: str = ""
    source: str = "huggingface"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "label": self.label.value,
            "score": self.score,
            "raw_scores": self.raw_scores,
            "text": self.text[:100] + "..." if len(self.text) > 100 else self.text,
            "source": self.source,
        }


@dataclass
class TextGenerationResult:
    """Result of text generation."""
    
    text: str
    tokens_used: int = 0
    source: str = "huggingface"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "text": self.text,
            "tokens_used": self.tokens_used,
            "source": self.source,
        }


@dataclass
class ConversationMessage:
    """A single message in a conversation."""
    
    role: str  # 'user' or 'assistant'
    content: str
    timestamp: Any = None


@dataclass
class ConversationResult:
    """Result of conversational AI interaction."""
    
    response: str
    messages: List[ConversationMessage] = field(default_factory=list)
    context: Dict[str, Any] = field(default_factory=dict)
    source: str = "huggingface"
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "response": self.response,
            "messages": [{"role": m.role, "content": m.content} for m in self.messages],
            "context": self.context,
            "source": self.source,
        }


@dataclass
class MarketSummary:
    """AI-generated market summary."""
    
    title: str
    summary: str
    key_points: List[str] = field(default_factory=list)
    sentiment: Optional[SentimentResult] = None
    symbols_mentioned: List[str] = field(default_factory=list)
    timestamp: Any = None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary."""
        return {
            "title": self.title,
            "summary": self.summary,
            "key_points": self.key_points,
            "sentiment": self.sentiment.to_dict() if self.sentiment else None,
            "symbols_mentioned": self.symbols_mentioned,
            "timestamp": self.timestamp,
        }


# ============================================================================
# Base AI Client
# ============================================================================

class BaseAIClient(ABC):
    """Abstract base class for AI inference clients."""
    
    def __init__(self, source_name: str):
        """
        Initialize AI client.
        
        Args:
            source_name: Name of the AI provider
        """
        self.source_name = source_name
        self.config = get_config()
        self._initialized = False
    
    @abstractmethod
    def initialize(self) -> None:
        """Initialize the AI model."""
        pass
    
    def ensure_initialized(self) -> None:
        """Ensure the model is initialized before use."""
        if not self._initialized:
            self.initialize()
            self._initialized = True


# ============================================================================
# Sentiment Analysis
# ============================================================================

class SentimentAnalyzer(BaseAIClient):
    """
    Sentiment analysis using Hugging Face transformers.
    
    Uses pre-trained models for financial sentiment analysis.
    """
    
    def __init__(self, model_name: Optional[str] = None):
        """
        Initialize sentiment analyzer.
        
        Args:
            model_name: Model to use (default from config)
        """
        super().__init__("huggingface")
        self.model_name = model_name or self.config.ai_models.sentiment_model
        self._pipeline = None
        self._model_loaded = False
    
    def initialize(self) -> None:
        """Initialize the sentiment analysis model."""
        try:
            from transformers import pipeline
            
            logger.info(f"Loading sentiment model: {self.model_name}")
            self._pipeline = pipeline(
                "sentiment-analysis",
                model=self.model_name,
            )
            self._model_loaded = True
            logger.info("Sentiment model loaded successfully")
        except ImportError:
            logger.error("transformers library not installed. Install with: pip install transformers")
            raise
        except Exception as e:
            logger.error(f"Failed to load sentiment model: {e}")
            raise
    
    def analyze(self, text: str) -> SentimentResult:
        """
        Analyze sentiment of text.
        
        Args:
            text: Text to analyze
        
        Returns:
            SentimentResult object
        
        Example:
            >>> analyzer = SentimentAnalyzer()
            >>> result = analyzer.analyze("Bitcoin surges to new all-time high")
            >>> print(result.label, result.score)
        """
        self.ensure_initialized()
        
        if not text or not text.strip():
            return SentimentResult(
                label=SentimentLabel.NEUTRAL,
                score=1.0,
                text=text,
            )
        
        try:
            # Truncate text if too long (model has max input length)
            truncated_text = text[:512]
            
            result = self._pipeline(truncated_text)[0]
            
            # Map label to enum
            label = SentimentLabel.POSITIVE
            if result["label"].upper() in ["NEGATIVE", "NEG"]:
                label = SentimentLabel.NEGATIVE
            elif result["label"].upper() in ["NEUTRAL"]:
                label = SentimentLabel.NEUTRAL
            
            return SentimentResult(
                label=label,
                score=result["score"],
                raw_scores=result,
                text=text,
            )
        except Exception as e:
            logger.error(f"Sentiment analysis failed: {e}")
            return SentimentResult(
                label=SentimentLabel.NEUTRAL,
                score=0.0,
                text=text,
            )
    
    def batch_analyze(self, texts: List[str]) -> List[SentimentResult]:
        """
        Analyze sentiment for multiple texts.
        
        Args:
            texts: List of texts to analyze
        
        Returns:
            List of SentimentResult objects
        
        Example:
            >>> analyzer = SentimentAnalyzer()
            >>> results = analyzer.batch_analyze([
            ...     "Market up today",
            ...     "Stocks fall on news"
            ... ])
        """
        self.ensure_initialized()
        
        results = []
        for text in texts:
            result = self.analyze(text)
            results.append(result)
        
        return results
    
    def analyze_headlines(self, headlines: List[str]) -> Dict[str, Any]:
        """
        Analyze a list of news headlines.
        
        Args:
            headlines: List of news headlines
        
        Returns:
            Dictionary with aggregated sentiment and per-headline results
        
        Example:
            >>> analyzer = SentimentAnalyzer()
            >>> analysis = analyzer.analyze_headlines([
            ...     "Tech stocks rally",
            ...     "Oil prices drop"
            ... ])
        """
        results = self.batch_analyze(headlines)
        
        # Aggregate sentiment
        positive = sum(1 for r in results if r.label == SentimentLabel.POSITIVE)
        negative = sum(1 for r in results if r.label == SentimentLabel.NEGATIVE)
        neutral = sum(1 for r in results if r.label == SentimentLabel.NEUTRAL)
        
        avg_score = sum(r.score for r in results) / len(results) if results else 0
        
        # Determine overall sentiment
        if positive > negative and positive > neutral:
            overall = SentimentLabel.POSITIVE
        elif negative > positive and negative > neutral:
            overall = SentimentLabel.NEGATIVE
        else:
            overall = SentimentLabel.NEUTRAL
        
        return {
            "overall_sentiment": overall.value,
            "average_score": avg_score,
            "counts": {
                "positive": positive,
                "negative": negative,
                "neutral": neutral,
            },
            "results": [r.to_dict() for r in results],
        }


# ============================================================================
# Text Generation
# ============================================================================

class TextGenerator(BaseAIClient):
    """
    Text generation using Hugging Face transformers.
    
    Generates financial summaries and market reports.
    """
    
    def __init__(self, model_name: Optional[str] = None):
        """
        Initialize text generator.
        
        Args:
            model_name: Model to use (default from config)
        """
        super().__init__("huggingface")
        self.model_name = model_name or self.config.ai_models.text_generation_model
        self._pipeline = None
        self._model_loaded = False
    
    def initialize(self) -> None:
        """Initialize the text generation model."""
        try:
            from transformers import pipeline
            
            logger.info(f"Loading text generation model: {self.model_name}")
            self._pipeline = pipeline(
                "text-generation",
                model=self.model_name,
                max_new_tokens=self.config.ai_models.max_tokens,
            )
            self._model_loaded = True
            logger.info("Text generation model loaded successfully")
        except ImportError:
            logger.error("transformers library not installed. Install with: pip install transformers")
            raise
        except Exception as e:
            logger.error(f"Failed to load text generation model: {e}")
            raise
    
    def generate(
        self,
        prompt: str,
        max_tokens: Optional[int] = None,
        temperature: Optional[float] = None,
        top_p: float = 0.9,
    ) -> TextGenerationResult:
        """
        Generate text based on a prompt.
        """
        # Try Hugging Face Inference API if key is available
        if self.config.api.huggingface_api_key:
            try:
                import requests
                api_url = f"https://api-inference.huggingface.co/models/{self.model_name}"
                headers = {"Authorization": f"Bearer {self.config.api.huggingface_api_key}"}
                
                payload = {
                    "inputs": prompt,
                    "parameters": {
                        "max_new_tokens": max_tokens or self.config.ai_models.max_tokens,
                        "temperature": temperature or self.config.ai_models.generation_temperature,
                        "top_p": top_p,
                        "return_full_text": False
                    }
                }
                
                response = requests.post(api_url, headers=headers, json=payload, timeout=30)
                if response.status_code == 200:
                    result = response.json()
                    generated_text = result[0].get("generated_text", "") if isinstance(result, list) else result.get("generated_text", "")
                    logger.info(f"Generated text using Hugging Face Inference API ({self.model_name})")
                    return TextGenerationResult(
                        text=generated_text.strip(),
                        tokens_used=max_tokens or self.config.ai_models.max_tokens,
                        source="huggingface_api"
                    )
                else:
                    logger.warning(f"HF Inference API failed (Status {response.status_code}): {response.text}. Falling back to local model.")
            except Exception as e:
                logger.warning(f"Error calling HF Inference API: {e}. Falling back to local model.")

        # Fallback to local model
        self.ensure_initialized()
        
        if max_tokens is None:
            max_tokens = self.config.ai_models.max_tokens
        if temperature is None:
            temperature = self.config.ai_models.generation_temperature
        
        try:
            outputs = self._pipeline(
                prompt,
                max_new_tokens=max_tokens,
                temperature=temperature,
                top_p=top_p,
                do_sample=True,
                pad_token_id=self._pipeline.tokenizer.eos_token_id,
            )
            
            generated_text = outputs[0]["generated_text"]
            
            # Extract only the newly generated part
            if generated_text.startswith(prompt):
                generated_text = generated_text[len(prompt):].strip()
            
            return TextGenerationResult(
                text=generated_text,
                tokens_used=max_tokens,
                source="huggingface_local"
            )
        except Exception as e:
            logger.error(f"Text generation failed: {e}")
            return TextGenerationResult(
                text="Failed to generate text.",
                tokens_used=0,
            )
    
    def generate_market_summary(
        self,
        market_data: Dict[str, Any],
        news: Optional[List[str]] = None,
    ) -> MarketSummary:
        """
        Generate a market summary from data and news.
        
        Args:
            market_data: Market data dictionary
            news: Optional list of news headlines
        
        Returns:
            MarketSummary object
        
        Example:
            >>> generator = TextGenerator()
            >>> summary = generator.generate_market_summary(
            ...     {"bitcoin": {"price": 50000, "change": 5.2}},
            ...     ["Bitcoin ETF approved"]
            ... )
        """
        # Build prompt from market data
        prompt = self._build_summary_prompt(market_data, news)
        
        # Generate summary
        result = self.generate(prompt, max_tokens=300)
        
        # Extract key points (simple extraction)
        lines = result.text.split("\n")
        key_points = [line.strip() for line in lines if line.strip() and len(line.strip()) > 10]
        
        # Analyze sentiment if news provided
        sentiment = None
        if news:
            analyzer = SentimentAnalyzer()
            sentiment = analyzer.analyze(" ".join(news[:3]))
        
        # Extract symbols mentioned
        symbols = self._extract_symbols(result.text, market_data)
        
        return MarketSummary(
            title=f"Market Summary - {market_data.get('timestamp', 'Today')}",
            summary=result.text,
            key_points=key_points[:5],
            sentiment=sentiment,
            symbols_mentioned=symbols,
        )
    
    def _build_summary_prompt(
        self,
        market_data: Dict[str, Any],
        news: Optional[List[str]] = None,
    ) -> str:
        """Build prompt for market summary generation."""
        prompt = "Generate a concise financial market summary:\n\n"
        
        # Add market data
        prompt += "Market Data:\n"
        for symbol, data in market_data.items():
            if isinstance(data, dict):
                price = data.get("price", "N/A")
                change = data.get("change", "N/A")
                prompt += f"- {symbol}: ${price} ({change}%)\n"
        
        # Add news if provided
        if news:
            prompt += "\nRecent News:\n"
            for headline in news[:5]:
                prompt += f"- {headline}\n"
        
        prompt += "\nSummary:"
        
        return prompt
    
    def _extract_symbols(
        self,
        text: str,
        market_data: Dict[str, Any],
    ) -> List[str]:
        """Extract stock/crypto symbols from text."""
        symbols = []
        text_upper = text.upper()
        
        for symbol in market_data.keys():
            if symbol.upper() in text_upper:
                symbols.append(symbol.upper())
        
        return symbols


# ============================================================================
# Conversational AI
# ============================================================================

class ConversationalAI(BaseAIClient):
    """
    Conversational AI using Hugging Face transformers.
    
    Provides interactive chat for market data queries.
    """
    
    def __init__(self, model_name: Optional[str] = None):
        """
        Initialize conversational AI.
        
        Args:
            model_name: Model to use (default from config)
        """
        super().__init__("huggingface")
        self.model_name = model_name or self.config.ai_models.conversational_model
        self._pipeline = None
        self._model_loaded = False
        self.conversation_history: List[ConversationMessage] = []
    
    def initialize(self) -> None:
        """Initialize the conversational model."""
        try:
            from transformers import pipeline
            
            logger.info(f"Loading conversational model: {self.model_name}")
            self._pipeline = pipeline(
                "text-generation",
                model=self.model_name,
                max_new_tokens=150,
            )
            self._model_loaded = True
            logger.info("Conversational model loaded successfully")
        except ImportError:
            logger.error("transformers library not installed. Install with: pip install transformers")
            raise
        except Exception as e:
            logger.error(f"Failed to load conversational model: {e}")
            raise
    
    def reset_conversation(self) -> None:
        """Reset conversation history."""
        self.conversation_history = []
    
    def chat(
        self,
        user_message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> ConversationResult:
        """
        Process a chat message and generate a response.
        
        Args:
            user_message: User's message
            context: Optional context (market data, etc.)
        
        Returns:
            ConversationResult object
        
        Example:
            >>> chat = ConversationalAI()
            >>> result = chat.chat("What's the price of Bitcoin?")
            >>> print(result.response)
        """
        self.ensure_initialized()
        
        # Add user message to history
        self.conversation_history.append(ConversationMessage(
            role="user",
            content=user_message,
        ))
        
        try:
            # Build prompt from history
            prompt = self._build_chat_prompt(user_message, context)
            
            # Generate response
            outputs = self._pipeline(
                prompt,
                max_new_tokens=150,
                temperature=0.7,
                top_p=0.9,
                do_sample=True,
                pad_token_id=self._pipeline.tokenizer.eos_token_id,
            )
            
            generated_text = outputs[0]["generated_text"]
            
            # Extract assistant response
            response = self._extract_response(generated_text, prompt)
            
            # Add assistant response to history
            self.conversation_history.append(ConversationMessage(
                role="assistant",
                content=response,
            ))
            
            return ConversationResult(
                response=response,
                messages=self.conversation_history.copy(),
                context=context or {},
            )
        except Exception as e:
            logger.error(f"Chat failed: {e}")
            error_response = "I apologize, but I encountered an error processing your request."
            
            self.conversation_history.append(ConversationMessage(
                role="assistant",
                content=error_response,
            ))
            
            return ConversationResult(
                response=error_response,
                messages=self.conversation_history.copy(),
                context=context or {},
            )
    
    def _build_chat_prompt(
        self,
        user_message: str,
        context: Optional[Dict[str, Any]] = None,
    ) -> str:
        """Build prompt for chat."""
        # For DialoGPT-style models
        prompt = ""
        
        # Add recent history (last 4 messages)
        for msg in self.conversation_history[-4:]:
            if msg.role == "user":
                prompt += f"User: {msg.content}\n"
            else:
                prompt += f"Assistant: {msg.content}\n"
        
        # Add current message
        prompt += f"User: {user_message}\n"
        
        # Add context if available
        if context:
            prompt += f"\nContext: {context}\n"
        
        prompt += "Assistant:"
        
        return prompt
    
    def _extract_response(self, generated_text: str, prompt: str) -> str:
        """Extract assistant response from generated text."""
        # Remove the prompt from generated text
        if generated_text.startswith(prompt):
            response = generated_text[len(prompt):].strip()
        else:
            response = generated_text.strip()
        
        # Truncate at user message boundary
        if "\nUser:" in response:
            response = response.split("\nUser:")[0]
        
        # Clean up response
        response = response.replace("Assistant:", "").strip()
        
        return response if response else "I'm not sure how to respond to that."


# ============================================================================
# Client Factory Functions
# ============================================================================

_sentiment_analyzer: Optional[SentimentAnalyzer] = None
_text_generator: Optional[TextGenerator] = None
_conversational_ai: Optional[ConversationalAI] = None


def get_sentiment_analyzer(model_name: Optional[str] = None) -> SentimentAnalyzer:
    """
    Get a sentiment analyzer instance.
    
    Args:
        model_name: Optional model name override
    
    Returns:
        SentimentAnalyzer instance
    
    Example:
        >>> analyzer = get_sentiment_analyzer()
        >>> result = analyzer.analyze("Market is up!")
    """
    global _sentiment_analyzer
    if _sentiment_analyzer is None:
        _sentiment_analyzer = SentimentAnalyzer(model_name)
    return _sentiment_analyzer


def get_text_generator(model_name: Optional[str] = None) -> TextGenerator:
    """
    Get a text generator instance.
    
    Args:
        model_name: Optional model name override
    
    Returns:
        TextGenerator instance
    
    Example:
        >>> generator = get_text_generator()
        >>> result = generator.generate("Market summary:")
    """
    global _text_generator
    if _text_generator is None:
        _text_generator = TextGenerator(model_name)
    return _text_generator


def get_conversational_ai(model_name: Optional[str] = None) -> ConversationalAI:
    """
    Get a conversational AI instance.
    
    Args:
        model_name: Optional model name override
    
    Returns:
        ConversationalAI instance
    
    Example:
        >>> chat = get_conversational_ai()
        >>> result = chat.chat("Hello!")
    """
    global _conversational_ai
    if _conversational_ai is None:
        _conversational_ai = ConversationalAI(model_name)
    return _conversational_ai


def analyze_market_sentiment(
    news_headlines: List[str],
) -> Dict[str, Any]:
    """
    Convenience function to analyze market sentiment from news.
    
    Args:
        news_headlines: List of news headlines
    
    Returns:
        Sentiment analysis results
    
    Example:
        >>> results = analyze_market_sentiment([
        ...     "Bitcoin hits new high",
        ...     "Tech stocks tumble"
        ... ])
    """
    analyzer = get_sentiment_analyzer()
    return analyzer.analyze_headlines(news_headlines)


def generate_market_report(
    market_data: Dict[str, Any],
    news: Optional[List[str]] = None,
) -> MarketSummary:
    """
    Convenience function to generate a market report.
    
    Args:
        market_data: Market data dictionary
        news: Optional news headlines
    
    Returns:
        MarketSummary object
    
    Example:
        >>> report = generate_market_report(
        ...     {"bitcoin": {"price": 50000, "change": 5}}
        ... )
    """
    generator = get_text_generator()
    return generator.generate_market_summary(market_data, news)


__all__ = [
    "SentimentLabel",
    "SentimentResult",
    "TextGenerationResult",
    "ConversationMessage",
    "ConversationResult",
    "MarketSummary",
    "SentimentAnalyzer",
    "TextGenerator",
    "ConversationalAI",
    "get_sentiment_analyzer",
    "get_text_generator",
    "get_conversational_ai",
    "analyze_market_sentiment",
    "generate_market_report",
]
