"""
Market Trend AI - Setup Configuration

This file configures the package for distribution and installation.
"""

from setuptools import setup, find_packages

# Read requirements
def read_requirements():
    with open("requirements.txt", "r") as f:
        return [
            line.strip() 
            for line in f 
            if line.strip() and not line.startswith("#")
        ]

# Read README
def read_readme():
    try:
        with open("README.md", "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return ""

setup(
    name="market-trend-ai",
    version="1.0.0",
    description="Cryptocurrency and Financial Market Data Analysis Platform with AI",
    long_description=read_readme(),
    long_description_content_type="text/markdown",
    author="Market Trend AI",
    author_email="info@markettrendai.com",
    url="https://github.com/markettrendai/market-trend-ai",
    packages=find_packages(where="src"),
    package_dir={"": "src"},
    python_requires=">=3.9",
    install_requires=read_requirements(),
    extras_require={
        "dev": [
            "pytest>=7.4.0",
            "pytest-cov>=4.1.0",
            "black>=23.0.0",
            "flake8>=6.0.0",
            "mypy>=1.5.0",
        ],
        "redis": [
            "redis>=5.0.0",
        ],
    },
    classifiers=[
        "Development Status :: 4 - Beta",
        "Intended Audience :: Financial and Insurance Industry",
        "Intended Audience :: Developers",
        "Topic :: Office/Business :: Financial",
        "Topic :: Scientific/Engineering :: Artificial Intelligence",
        "License :: OSI Approved :: MIT License",
        "Programming Language :: Python :: 3",
        "Programming Language :: Python :: 3.9",
        "Programming Language :: Python :: 3.10",
        "Programming Language :: Python :: 3.11",
        "Programming Language :: Python :: 3.12",
    ],
    keywords=[
        "cryptocurrency",
        "bitcoin",
        "ethereum",
        "trading",
        "finance",
        "market-data",
        "technical-analysis",
        "sentiment-analysis",
        "ai",
        "nlp",
        "huggingface",
    ],
    entry_points={
        "console_scripts": [
            "market-trend-ai=example_usage:main",
        ],
    },
)
