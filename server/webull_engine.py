"""
StockHomeTH - Webull OpenAPI Engine & Parallel Stock Data Fetcher
Supports:
  - Batch history bars (get_batch_history_bar)
  - Single history bar (get_history_bar)
  - Parallel multi-symbol concurrent queries (ThreadPoolExecutor)
  - Normalized mapping to StockHomeTH schema variables
  - Graceful fallback with latency measurement
"""

import os
import sys
import json
import time
import argparse
from concurrent.futures import ThreadPoolExecutor, as_completed
from typing import Dict, List, Any, Optional

# Attempt import of Webull OpenAPI SDK
HAS_WEBULL = False
try:
    from webull.core.client import ApiClient
    from webull.data.data_client import DataClient
    from webull.data.common.category import Category
    from webull.data.common.timespan import Timespan
    HAS_WEBULL = True
except Exception as e:
    HAS_WEBULL = False

# Default configurations from environment or fallback
WEBULL_APP_KEY = os.environ.get("WEBULL_APP_KEY", "")
WEBULL_APP_SECRET = os.environ.get("WEBULL_APP_SECRET", "")
WEBULL_REGION = os.environ.get("WEBULL_REGION", "us")
WEBULL_ENDPOINT = os.environ.get("WEBULL_ENDPOINT", "api.webull.com")

def get_webull_client(app_key: str = None, app_secret: str = None, region: str = "us", endpoint: str = None) -> Optional[Any]:
    """Initialize Webull DataClient with credentials"""
    if not HAS_WEBULL:
        return None
    key = app_key or WEBULL_APP_KEY
    secret = app_secret or WEBULL_APP_SECRET
    ep = endpoint or WEBULL_ENDPOINT
    reg = region or WEBULL_REGION

    if not key or not secret:
        return None

    try:
        api_client = ApiClient(key, secret, reg)
        if ep:
            api_client.add_endpoint(reg, ep)
        return DataClient(api_client)
    except Exception as err:
        sys.stderr.write(f"[Webull Engine] Client initialization error: {err}\n")
        return None

def timespan_from_string(interval: str) -> str:
    """Convert standard interval string to Webull Timespan enum name"""
    mapping = {
        "1m": "M1",
        "5m": "M5",
        "15m": "M15",
        "30m": "M30",
        "1h": "H1",
        "2h": "H2",
        "4h": "H4",
        "1d": "D1",
        "1wk": "W1",
        "1mo": "M_1"
    }
    return mapping.get(interval.lower(), "D1")

def map_webull_bar_to_candle(bar: Dict[str, Any], interval: str = "1d") -> Dict[str, Any]:
    """Convert Webull bar item to standardized StockHomeTH candle object"""
    # Webull bars typically contain: time/timestamp, open, high, low, close, volume
    ts = bar.get("time") or bar.get("timestamp") or int(time.time() * 1000)
    if isinstance(ts, str):
        try:
            ts = int(ts)
        except Exception:
            ts = int(time.time() * 1000)
    
    # Check if seconds vs milliseconds
    if ts < 10_000_000_000:
        ts = ts * 1000

    o = float(bar.get("open", 0.0))
    h = float(bar.get("high", 0.0))
    l = float(bar.get("low", 0.0))
    c = float(bar.get("close", 0.0))
    v = int(bar.get("volume", 0))

    import datetime
    d = datetime.datetime.fromtimestamp(ts / 1000.0)
    date_str = d.strftime("%H:%M") if interval in ["1m", "5m", "15m", "1h"] else d.strftime("%Y-%m-%d")

    return {
        "time": ts,
        "date": date_str,
        "open": round(o, 2),
        "high": round(h, 2),
        "low": round(l, 2),
        "close": round(c, 2),
        "volume": v,
        "isUp": c >= o
    }

def fetch_webull_single_bars(client: Any, symbol: str, interval: str = "1d", limit: int = 50) -> Dict[str, Any]:
    """Fetch single symbol history bars via Webull SDK"""
    t_start = time.time()
    try:
        t_span = timespan_from_string(interval)
        res = client.market_data.get_history_bar(symbol, "US_STOCK", t_span, limit)
        latency_ms = round((time.time() - t_start) * 1000, 2)

        if res.status_code == 200:
            data = res.json()
            raw_bars = data if isinstance(data, list) else data.get("bars", data.get("data", []))
            candles = [map_webull_bar_to_candle(b, interval) for b in raw_bars]

            # Calculate MA20 and MA50
            closes = [c["close"] for c in candles]
            for i, c in enumerate(candles):
                sub20 = closes[max(0, i - 19):i + 1]
                sub50 = closes[max(0, i - 49):i + 1]
                c["ma20"] = round(sum(sub20) / len(sub20), 2) if sub20 else c["close"]
                c["ma50"] = round(sum(sub50) / len(sub50), 2) if sub50 else c["close"]

            latest_price = candles[-1]["close"] if candles else 0.0
            prev_price = candles[-2]["close"] if len(candles) > 1 else latest_price
            change = round(latest_price - prev_price, 2)
            change_pct = round(((latest_price - prev_price) / prev_price) * 100, 2) if prev_price else 0.0

            return {
                "success": True,
                "provider": "webull",
                "symbol": symbol,
                "ticker": symbol.replace(".BK", "").upper(),
                "market": "US",
                "currency": "USD",
                "current_price": latest_price,
                "previous_close": prev_price,
                "change": change,
                "change_percent": change_pct,
                "high52w": round(max([c["high"] for c in candles], default=latest_price * 1.15), 2),
                "low52w": round(min([c["low"] for c in candles], default=latest_price * 0.85), 2),
                "candles_count": len(candles),
                "candles": candles,
                "latency_ms": latency_ms
            }
        else:
            return {
                "success": False,
                "provider": "webull",
                "symbol": symbol,
                "error": f"Webull API status {res.status_code}: {res.text}",
                "latency_ms": latency_ms
            }
    except Exception as err:
        return {
            "success": False,
            "provider": "webull",
            "symbol": symbol,
            "error": str(err),
            "latency_ms": round((time.time() - t_start) * 1000, 2)
        }

def fetch_batch_history_webull(client: Any, symbols: List[str], interval: str = "1d", count: int = 30) -> Dict[str, Any]:
    """Fetch batch history bars using Webull OpenAPI batch method"""
    t_start = time.time()
    t_span = timespan_from_string(interval)
    try:
        res = client.market_data.get_batch_history_bar(symbols, "US_STOCK", t_span, count)
        latency_ms = round((time.time() - t_start) * 1000, 2)
        if res.status_code == 200:
            data = res.json()
            return {
                "success": True,
                "provider": "webull",
                "total_symbols": len(symbols),
                "data": data,
                "latency_ms": latency_ms
            }
        else:
            return {
                "success": False,
                "provider": "webull",
                "error": f"Status {res.status_code}: {res.text}",
                "latency_ms": latency_ms
            }
    except Exception as err:
        return {
            "success": False,
            "provider": "webull",
            "error": str(err),
            "latency_ms": round((time.time() - t_start) * 1000, 2)
        }

def fetch_parallel_symbols_webull(symbols: List[str], interval: str = "1d", max_workers: int = 8) -> Dict[str, Any]:
    """
    Fetch multiple symbols concurrently via ThreadPoolExecutor using Webull SDK
    or resilient fallback engine.
    """
    client = get_webull_client()
    t_start = time.time()
    results = {}

    if client:
        # Check if we can use native batch API or parallel workers
        with ThreadPoolExecutor(max_workers=min(max_workers, len(symbols) or 1)) as executor:
            future_to_sym = {
                executor.submit(fetch_webull_single_bars, client, sym, interval): sym
                for sym in symbols
            }
            for future in as_completed(future_to_sym):
                sym = future_to_sym[future]
                try:
                    res = future.result()
                    results[sym] = res
                except Exception as exc:
                    results[sym] = {"success": False, "symbol": sym, "error": str(exc)}
    else:
        # Fallback to yfinance or synthetic deterministic generator
        results = fetch_parallel_fallback(symbols, interval, max_workers)

    total_latency = round((time.time() - t_start) * 1000, 2)
    return {
        "success": True,
        "provider": "webull" if client else "yfinance_parallel",
        "has_webull_sdk": HAS_WEBULL,
        "client_authenticated": client is not None,
        "total_requested": len(symbols),
        "total_latency_ms": total_latency,
        "symbols": symbols,
        "data": results
    }

def fetch_parallel_fallback(symbols: List[str], interval: str = "1d", max_workers: int = 6) -> Dict[str, Any]:
    """Parallel fallback using yfinance or local engine"""
    import yfinance as yf
    results = {}

    def fetch_one(sym: str) -> Dict[str, Any]:
        t0 = time.time()
        try:
            lookup = sym if "." in sym else f"{sym}.BK" if sym.upper() in ["PTT", "CPALL", "DELTA", "AOT", "KBANK", "GULF", "BDMS", "SCB", "ADVANC", "TRUE"] else sym
            ticker = yf.Ticker(lookup)
            hist = ticker.history(period="1mo", interval=interval, auto_adjust=True)
            lat = round((time.time() - t0) * 1000, 2)
            if not hist.empty:
                candles = []
                for idx, row in hist.iterrows():
                    ts = int(idx.timestamp() * 1000) if hasattr(idx, "timestamp") else int(time.time() * 1000)
                    dt_str = idx.strftime("%Y-%m-%d") if hasattr(idx, "strftime") else str(idx)
                    o = round(float(row.get("Open", 0)), 2)
                    h = round(float(row.get("High", 0)), 2)
                    l = round(float(row.get("Low", 0)), 2)
                    c = round(float(row.get("Close", 0)), 2)
                    v = int(row.get("Volume", 0))
                    candles.append({
                        "time": ts, "date": dt_str, "open": o, "high": h, "low": l, "close": c, "volume": v, "isUp": c >= o
                    })

                latest = candles[-1]["close"]
                prev = candles[-2]["close"] if len(candles) > 1 else latest
                return {
                    "success": True,
                    "provider": "yfinance_parallel",
                    "symbol": sym,
                    "ticker": sym.replace(".BK", "").upper(),
                    "market": "SET" if lookup.endswith(".BK") else "US",
                    "currency": "THB" if lookup.endswith(".BK") else "USD",
                    "current_price": latest,
                    "previous_close": prev,
                    "change": round(latest - prev, 2),
                    "change_percent": round(((latest - prev) / prev) * 100, 2) if prev else 0.0,
                    "high52w": round(max([c["high"] for c in candles]), 2),
                    "low52w": round(min([c["low"] for c in candles]), 2),
                    "candles_count": len(candles),
                    "candles": candles,
                    "latency_ms": lat
                }
            else:
                return {"success": False, "symbol": sym, "error": "No data", "latency_ms": lat}
        except Exception as e:
            return {"success": False, "symbol": sym, "error": str(e), "latency_ms": round((time.time() - t0) * 1000, 2)}

    with ThreadPoolExecutor(max_workers=min(max_workers, len(symbols) or 1)) as executor:
        futures = {executor.submit(fetch_one, s): s for s in symbols}
        for f in as_completed(futures):
            s = futures[f]
            results[s] = f.result()

    return results

def main():
    parser = argparse.ArgumentParser(description="StockHomeTH Webull OpenAPI & Parallel Engine")
    parser.add_argument("--action", choices=["quote", "bars", "batch_bars", "parallel", "status"], default="status")
    parser.add_argument("--symbols", type=str, default="AAPL,TSLA,NVDA", help="Comma-separated stock symbols")
    parser.add_argument("--symbol", type=str, default="AAPL", help="Single stock symbol")
    parser.add_argument("--interval", type=str, default="1d", help="Interval: 1m, 5m, 15m, 1h, 1d")
    parser.add_argument("--app_key", type=str, default="", help="Webull App Key")
    parser.add_argument("--app_secret", type=str, default="", help="Webull App Secret")
    parser.add_argument("--workers", type=int, default=8, help="Number of parallel workers")

    args = parser.parse_args()

    if args.app_key:
        os.environ["WEBULL_APP_KEY"] = args.app_key
    if args.app_secret:
        os.environ["WEBULL_APP_SECRET"] = args.app_secret

    if args.action == "status":
        client = get_webull_client()
        out = {
            "success": True,
            "has_webull_sdk": HAS_WEBULL,
            "authenticated": client is not None,
            "app_key_configured": bool(os.environ.get("WEBULL_APP_KEY")),
            "region": WEBULL_REGION,
            "endpoint": WEBULL_ENDPOINT,
            "timestamp": time.time()
        }
        print(json.dumps(out, ensure_ascii=False, indent=2))
        return

    symbols_list = [s.strip().upper() for s in args.symbols.split(",") if s.strip()]

    if args.action == "parallel" or args.action == "batch_bars":
        res = fetch_parallel_symbols_webull(symbols_list, interval=args.interval, max_workers=args.workers)
        print(json.dumps(res, ensure_ascii=False, indent=2))
        return

    if args.action == "bars" or args.action == "quote":
        client = get_webull_client()
        if client:
            res = fetch_webull_single_bars(client, args.symbol, interval=args.interval)
        else:
            fallback = fetch_parallel_fallback([args.symbol], interval=args.interval, max_workers=1)
            res = fallback.get(args.symbol, {"success": False, "error": "Unable to fetch"})
        print(json.dumps(res, ensure_ascii=False, indent=2))
        return

if __name__ == "__main__":
    main()
