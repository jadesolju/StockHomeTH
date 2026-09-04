"""
StockHomeTH - Global Stock Pricing & Chart API (Anti-Block & Multi-Country Bulk Engine)
Framework: FastAPI + yfinance + pandas
Markets Supported:
  - th: Thailand (.BK)
  - us: United States (No suffix)
  - jp: Japan (.T)
  - hk: Hong Kong (.HK)
  - uk: United Kingdom (.L)
  - sg: Singapore (.SI)
"""

import asyncio
import os
import time
from typing import Dict, List, Optional, Any
from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
import yfinance as yf
import pandas as pd
import numpy as np

app = FastAPI(
    title="StockHomeTH - Global Stock Pricing & Chart API (Anti-Block)",
    description="High-performance bulk stock quote & historical chart API with anti-blocking chunking, rate limiting, and caching.",
    version="1.0.0"
)

# Enable CORS for local Next.js / Vite development and production
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── In-Memory Cache Store with TTL ───────────────────────────────────────────
# Key: "{ticker}_{period}_{interval}" -> {"timestamp": float, "data": Any}
PRICE_CACHE: Dict[str, Dict[str, Any]] = {}
CACHE_TTL_SECONDS = 60 * 5  # 5 minutes cache for price series

# Country Suffix Map for Yahoo Finance
COUNTRY_SUFFIX = {
    "th": ".BK",    # Thailand (SET / mai)
    "us": "",       # United States (NASDAQ / NYSE)
    "jp": ".T",     # Japan (Tokyo Stock Exchange)
    "hk": ".HK",    # Hong Kong (Hong Kong Stock Exchange)
    "uk": ".L",     # United Kingdom (London Stock Exchange)
    "sg": ".SI"     # Singapore (Singapore Exchange SGX)
}

# Default Market Currencies
COUNTRY_CURRENCY = {
    "th": "THB",
    "us": "USD",
    "jp": "JPY",
    "hk": "HKD",
    "uk": "GBp",
    "sg": "SGD"
}

def format_ticker_with_country(ticker: str, country: str = "us") -> str:
    """Normalize ticker symbol with proper country suffix"""
    t = ticker.strip().upper()
    if "." in t or "^" in t:
        return t
    suffix = COUNTRY_SUFFIX.get(country.lower(), "")
    return f"{t}{suffix}"

def chunk_list(lst: List[Any], n: int):
    """Chunk a list into batches of size n to avoid exceeding URL lengths or query limits"""
    for i in range(0, len(lst), n):
        yield lst[i:i + n]

def clean_value(val: Any, default: float = 0.0) -> float:
    """Convert numpy / pandas scalar to clean float"""
    try:
        if pd.isna(val) or val is None:
            return default
        return round(float(val), 2)
    except Exception:
        return default

# ─── API Routes ───────────────────────────────────────────────────────────────

@app.get("/api/v1/health")
async def health_check():
    """Health check endpoint with cache statistics"""
    return {
        "status": "healthy",
        "service": "StockHomeTH Anti-Block Stock & Chart Engine",
        "cached_entries": len(PRICE_CACHE),
        "supported_countries": list(COUNTRY_SUFFIX.keys()),
        "timestamp": time.time()
    }

@app.get("/api/v1/stocks")
async def get_multiple_stocks(
    tickers: str = Query(..., description="Comma-separated stock tickers e.g. PTT,CPALL,NVDA,AAPL,7203,0700"),
    country: str = Query("th", description="Country code: th, us, jp, hk, uk, sg"),
    period: str = Query("1mo", description="Historical period: 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max"),
    interval: str = Query("1d", description="Data interval: 1m, 5m, 15m, 1h, 1d, 1wk")
):
    """
    Bulk stock quote and price series endpoint.
    - Uses Space-Separated Bulk Fetching (yf.download)
    - Anti-Blocking Chunking (batches of 20)
    - In-Memory Caching to minimize external queries
    - Async Sleep Throttling between chunks
    """
    raw_tickers = [t.strip().upper() for t in tickers.split(",") if t.strip()]
    if not raw_tickers:
        raise HTTPException(status_code=400, detail="No tickers provided")

    country_key = country.lower()
    suffix = COUNTRY_SUFFIX.get(country_key, "")
    
    # Standardize ticker symbols
    normalized_map = {}
    for raw in raw_tickers:
        sym = raw if ("." in raw or "^" in raw) else f"{raw}{suffix}"
        normalized_map[raw] = sym

    results: Dict[str, Any] = {}
    missing_symbols: List[str] = []
    now = time.time()

    # Check cache first
    for raw, sym in normalized_map.items():
        cache_key = f"{sym}_{period}_{interval}"
        if cache_key in PRICE_CACHE and (now - PRICE_CACHE[cache_key]["time"] < CACHE_TTL_SECONDS):
            results[raw] = PRICE_CACHE[cache_key]["data"]
        else:
            if sym not in missing_symbols:
                missing_symbols.append(sym)

    # Fetch missing tickers via space-separated chunking
    if missing_symbols:
        chunks = list(chunk_list(missing_symbols, 20))
        for chunk in chunks:
            try:
                symbols_string = " ".join(chunk)
                data = yf.download(
                    symbols_string,
                    period=period,
                    interval=interval,
                    group_by="ticker",
                    progress=False,
                    auto_adjust=True,
                    threads=True
                )

                for sym in chunk:
                    cache_key = f"{sym}_{period}_{interval}"
                    
                    if len(chunk) == 1:
                        ticker_df = data
                    else:
                        ticker_df = data.get(sym) if isinstance(data, pd.DataFrame) else None
                        if ticker_df is None and sym in data.columns.levels[0] if hasattr(data.columns, 'levels') else False:
                            ticker_df = data[sym]

                    if ticker_df is not None and not ticker_df.empty:
                        df_clean = ticker_df.dropna(subset=['Close'])
                        if not df_clean.empty:
                            close_series = df_clean['Close'].tail(30).to_dict()
                            # Format date strings as keys
                            formatted_series = {
                                (k.strftime('%Y-%m-%d') if hasattr(k, 'strftime') else str(k)): clean_value(v)
                                for k, v in close_series.items()
                            }
                            latest_price = clean_value(df_clean['Close'].iloc[-1])
                            prev_price = clean_value(df_clean['Close'].iloc[-2]) if len(df_clean) >= 2 else latest_price
                            change = clean_value(latest_price - prev_price)
                            change_pct = clean_value(((latest_price - prev_price) / prev_price) * 100) if prev_price else 0.0

                            stock_payload = {
                                "symbol": sym,
                                "latest_price": latest_price,
                                "change": change,
                                "change_percent": change_pct,
                                "currency": COUNTRY_CURRENCY.get(country_key, "USD"),
                                "history": formatted_series
                            }
                            PRICE_CACHE[cache_key] = {"time": now, "data": stock_payload}
                            
                            # Assign back to matching raw tickers
                            for raw_k, raw_v in normalized_map.items():
                                if raw_v == sym:
                                    results[raw_k] = stock_payload
                        else:
                            fallback_payload = {"symbol": sym, "error": "No price data returned"}
                            for raw_k, raw_v in normalized_map.items():
                                if raw_v == sym:
                                    results[raw_k] = fallback_payload
                    else:
                        fallback_payload = {"symbol": sym, "error": "Ticker not found or de-listed"}
                        for raw_k, raw_v in normalized_map.items():
                            if raw_v == sym:
                                results[raw_k] = fallback_payload

                # Anti-blocking sleep between chunks
                if len(chunks) > 1:
                    await asyncio.sleep(1.0)

            except Exception as e:
                for sym in chunk:
                    for raw_k, raw_v in normalized_map.items():
                        if raw_v == sym and raw_k not in results:
                            results[raw_k] = {"symbol": sym, "error": str(e)}

    return {
        "status": "success",
        "country": country_key.upper(),
        "period": period,
        "interval": interval,
        "total_requested": len(raw_tickers),
        "data": results
    }

@app.get("/api/v1/chart/{symbol}")
async def get_stock_chart_data(
    symbol: str,
    country: Optional[str] = Query(None, description="Country code (th, us, jp, hk, uk, sg)"),
    period: str = Query("1mo", description="Timeframe: 1d, 5d, 1mo, 3mo, 6mo, 1y, 5y, max"),
    interval: str = Query("1d", description="Interval: 1m, 5m, 15m, 1h, 1d, 1wk")
):
    """
    High-resolution Candlestick & OHLCV Historical Data Endpoint for Custom Chart Component.
    Returns:
      - OHLCV candlestick candles: timestamp, date, open, high, low, close, volume
      - Calculated Technical Indicators: MA20, MA50
      - Real-time quote snapshot: latest price, previous close, high52w, low52w, marketCap, volume
    """
    sym = symbol.strip().upper()
    
    # If no country provided, guess from symbol or default to th/us
    if country:
        country_key = country.lower()
        if not ("." in sym or "^" in sym):
            sym = f"{sym}{COUNTRY_SUFFIX.get(country_key, '')}"
    else:
        if sym.endswith(".BK"):
            country_key = "th"
        elif sym.endswith(".T"):
            country_key = "jp"
        elif sym.endswith(".HK"):
            country_key = "hk"
        elif sym.endswith(".L"):
            country_key = "uk"
        elif sym.endswith(".SI"):
            country_key = "sg"
        elif not ("." in sym or "^" in sym):
            # Default: try SET if common Thai, else US
            country_key = "th" if sym in ["PTT", "CPALL", "DELTA", "AOT", "KBANK", "GULF", "BDMS", "SCB", "ADVANC", "TRUE"] else "us"
            if country_key == "th":
                sym = f"{sym}.BK"
        else:
            country_key = "us"

    cache_key = f"chart_{sym}_{period}_{interval}"
    now = time.time()
    if cache_key in PRICE_CACHE and (now - PRICE_CACHE[cache_key]["time"] < CACHE_TTL_SECONDS):
        return PRICE_CACHE[cache_key]["data"]

    try:
        t = yf.Ticker(sym)
        # Fetch OHLCV history
        df = t.history(period=period, interval=interval, auto_adjust=True)
        
        if df.empty:
            raise HTTPException(status_code=404, detail=f"No historical chart data available for symbol '{sym}'")

        # Fast info / metadata
        fast = getattr(t, "fast_info", None)
        current_price = clean_value(getattr(fast, "last_price", df['Close'].iloc[-1]))
        prev_close = clean_value(getattr(fast, "previous_close", df['Close'].iloc[-2] if len(df) >= 2 else current_price))
        currency = getattr(fast, "currency", COUNTRY_CURRENCY.get(country_key, "USD"))
        high52w = clean_value(getattr(fast, "year_high", df['High'].max()))
        low52w = clean_value(getattr(fast, "year_low", df['Low'].min()))
        mcap = getattr(fast, "market_cap", None)

        # Calculate Moving Averages MA20 and MA50
        df['MA20'] = df['Close'].rolling(window=20, min_periods=1).mean()
        df['MA50'] = df['Close'].rolling(window=50, min_periods=1).mean()

        candles = []
        for idx, row in df.iterrows():
            # Format timestamp
            if hasattr(idx, "timestamp"):
                ts = int(idx.timestamp() * 1000)
                dt_str = idx.strftime('%Y-%m-%d %H:%M') if interval in ['1m', '5m', '15m', '1h'] else idx.strftime('%Y-%m-%d')
            else:
                ts = int(time.time() * 1000)
                dt_str = str(idx)

            o = clean_value(row.get('Open', 0))
            h = clean_value(row.get('High', 0))
            l = clean_value(row.get('Low', 0))
            c = clean_value(row.get('Close', 0))
            v = int(row.get('Volume', 0)) if not pd.isna(row.get('Volume', 0)) else 0
            ma20 = clean_value(row.get('MA20', c))
            ma50 = clean_value(row.get('MA50', c))

            candles.append({
                "time": ts,
                "date": dt_str,
                "open": o,
                "high": h,
                "low": l,
                "close": c,
                "volume": v,
                "ma20": ma20,
                "ma50": ma50,
                "isUp": c >= o
            })

        change = clean_value(current_price - prev_close)
        change_pct = clean_value(((current_price - prev_close) / prev_close) * 100) if prev_close else 0.0

        chart_response = {
            "status": "success",
            "symbol": sym,
            "ticker": sym.split(".")[0],
            "country": country_key.upper(),
            "currency": currency,
            "period": period,
            "interval": interval,
            "current_price": current_price,
            "previous_close": prev_close,
            "change": change,
            "change_percent": change_pct,
            "high52w": high52w,
            "low52w": low52w,
            "market_cap": mcap,
            "candles_count": len(candles),
            "candles": candles
        }

        PRICE_CACHE[cache_key] = {"time": now, "data": chart_response}
        return chart_response

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch chart data for {sym}: {str(e)}")

@app.get("/api/v1/stocks/us/directory")
async def get_us_stocks_directory(
    q: Optional[str] = Query(None, description="Search ticker or company name"),
    limit: int = Query(50, ge=1, le=200),
    page: int = Query(1, ge=1)
):
    """Serve US listed stocks from SEC.gov cache with search and pagination"""
    import json
    us_file = os.path.join(os.path.dirname(__file__), "us_stocks.json")
    if not os.path.exists(us_file):
        us_file = os.path.join(os.path.dirname(__file__), "server", "data", "us_stocks.json")

    if not os.path.exists(us_file):
        raise HTTPException(status_code=404, detail="US Stocks database not found. Run update_stocks.py first.")

    with open(us_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    all_stocks = data.get("stocks", [])
    if q:
        query = q.strip().upper()
        all_stocks = [s for s in all_stocks if query in s.get("ticker", "").upper() or query in s.get("name", "").upper()]

    start = (page - 1) * limit
    end = start + limit
    paginated = all_stocks[start:end]

    return {
        "status": "success",
        "last_updated": data.get("last_updated"),
        "total": len(all_stocks),
        "page": page,
        "limit": limit,
        "stocks": paginated
    }

@app.get("/api/v1/stocks/thai/directory")
async def get_thai_stocks_directory(
    q: Optional[str] = Query(None, description="Search ticker or company name")
):
    """Serve Thai SET stocks from local resilient database"""
    import json
    th_file = os.path.join(os.path.dirname(__file__), "thai_stocks.json")
    if not os.path.exists(th_file):
        th_file = os.path.join(os.path.dirname(__file__), "server", "data", "thai_stocks.json")

    if not os.path.exists(th_file):
        raise HTTPException(status_code=404, detail="Thai Stocks database not found. Run update_stocks.py first.")

    with open(th_file, "r", encoding="utf-8") as f:
        data = json.load(f)

    all_stocks = data.get("stocks", [])
    if q:
        query = q.strip().upper()
        all_stocks = [s for s in all_stocks if query in s.get("ticker", "").upper() or query in s.get("name", "").upper()]

    return {
        "status": "success",
        "last_updated": data.get("last_updated"),
        "total": len(all_stocks),
        "stocks": all_stocks
    }

if __name__ == "__main__":
    # Run FastAPI server on port 8000
    print("Starting StockHomeTH Anti-Block Stock & Chart API Server on http://127.0.0.1:8000")
    uvicorn.run(app, host="127.0.0.1", port=8000)
