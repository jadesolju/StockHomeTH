"""
StockHomeTH - US Stocks SEC.gov Data Updater
Fetches full US listed companies from SEC.gov public endpoint without API key.
"""

import json
import os
import sys
from datetime import datetime
import requests

# Ensure UTF-8 output on Windows
if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SERVER_DATA_DIR = os.path.join(BASE_DIR, "server", "data")
OUTPUT_FILE_1 = os.path.join(BASE_DIR, "us_stocks.json")
OUTPUT_FILE_2 = os.path.join(SERVER_DATA_DIR, "us_stocks.json")
LOG_FILE = os.path.join(BASE_DIR, "update_log.txt")

os.makedirs(SERVER_DATA_DIR, exist_ok=True)

SEC_URL = "https://www.sec.gov/files/company_tickers.json"
HEADERS = {
    "User-Agent": "StockHomeTH admin@stockhome.local",
    "Accept": "application/json"
}

def fetch_sec_us_stocks():
    print("[US Stocks] Fetching company tickers from SEC.gov...")
    res = requests.get(SEC_URL, headers=HEADERS, timeout=20)
    res.raise_for_status()
    raw = res.json()

    stocks = []
    for item in raw.values():
        sym = str(item.get("ticker", "")).strip().upper()
        name = str(item.get("title", "")).strip()
        cik = str(item.get("cik_str", "")).zfill(10)
        if sym and not any(ch in sym for ch in [" ", "/"]):
            stocks.append({
                "symbol": sym,
                "ticker": sym,
                "name": name,
                "cik": cik,
                "market": "US",
                "currency": "USD"
            })

    stocks.sort(key=lambda x: x["ticker"])
    return stocks

def run():
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    try:
        stocks = fetch_sec_us_stocks()

        payload = {
            "last_updated": datetime.now().isoformat(),
            "source": "SEC.gov (US Securities and Exchange Commission)",
            "total": len(stocks),
            "stocks": stocks
        }

        with open(OUTPUT_FILE_1, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        with open(OUTPUT_FILE_2, "w", encoding="utf-8") as f:
            json.dump(payload, f, ensure_ascii=False, indent=2)

        msg = f"[{timestamp}] SUCCESS: US Stocks updated ({len(stocks)} companies from SEC.gov)\n"
        print(f"[SUCCESS] {msg.strip()}")
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(msg)

        return payload
    except Exception as e:
        err_msg = f"[{timestamp}] ERROR in US stocks update: {str(e)}\n"
        print(f"[ERROR] {err_msg.strip()}")
        with open(LOG_FILE, "a", encoding="utf-8") as f:
            f.write(err_msg)
        return None

if __name__ == "__main__":
    run()
