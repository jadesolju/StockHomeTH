"""
Synchronizes src/data/fullMarketStocks.ts and src/data/mockMarketData.ts with authentic live quotes from market_cache.json
"""

import json
import os
import re

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_PATH = os.path.join(BASE_DIR, "market_cache.json")
FULL_TS_PATH = os.path.join(BASE_DIR, "src", "data", "fullMarketStocks.ts")
MOCK_TS_PATH = os.path.join(BASE_DIR, "src", "data", "mockMarketData.ts")

def sync_ts_files():
    if not os.path.exists(CACHE_PATH):
        print("Cache file not found!")
        return

    with open(CACHE_PATH, "r", encoding="utf-8") as f:
        cache_data = json.load(f)

    items = cache_data if isinstance(cache_data, list) else cache_data.get("data", [])
    quotes = {f"{s.get('market')}-{s.get('ticker', '').upper()}": s for s in items}

    # 1. Update fullMarketStocks.ts
    if os.path.exists(FULL_TS_PATH):
        with open(FULL_TS_PATH, "r", encoding="utf-8") as f:
            content = f.read()

        # Update each stock entry in TS
        for key, st in quotes.items():
            market, ticker = key.split("-")
            price = st.get("price")
            change = st.get("change")
            mcap = st.get("marketCap")
            h52 = st.get("high52w")
            l52 = st.get("low52w")
            vol = st.get("volume")
            pe = st.get("peRatio")
            div = st.get("dividendYield")
            target_p = st.get("targetPrice")
            rating = st.get("analystRating", "Buy")
            score = st.get("sentimentScore", 75)

            # Match block with ticker: 'XYZ'
            pattern = re.compile(
                rf"(ticker:\s*'{ticker}',[\s\S]*?price:\s*)[0-9.]+(,[\s\S]*?change:\s*)[-0-9.]+(,[\s\S]*?marketCap:\s*')[^']+(',[\s\S]*?peRatio:\s*)[0-9.]+(,[\s\S]*?dividendYield:\s*)[0-9.]+(,[\s\S]*?high52w:\s*)[0-9.]+(,[\s\S]*?low52w:\s*)[0-9.]+(,[\s\S]*?volume:\s*')[^']+(',[\s\S]*?analystRating:\s*')[^']+(',[\s\S]*?targetPrice:\s*)[0-9.]+(,[\s\S]*?sentimentScore:\s*)[0-9]+"
            )

            if pattern.search(content):
                content = pattern.sub(
                    rf"\g<1>{price}\g<2>{change}\g<3>{mcap}\g<4>{pe}\g<5>{div}\g<6>{h52}\g<7>{l52}\g<8>{vol}\g<9>{rating}\g<10>{target_p}\g<11>{score}",
                    content
                )

        with open(FULL_TS_PATH, "w", encoding="utf-8") as f:
            f.write(content)
        print(f"Updated {FULL_TS_PATH} with authentic live quotes!")

    # 2. Update mockMarketData.ts
    if os.path.exists(MOCK_TS_PATH):
        with open(MOCK_TS_PATH, "r", encoding="utf-8") as f:
            m_content = f.read()

        for key, st in quotes.items():
            market, ticker = key.split("-")
            price = st.get("price")
            change = st.get("changeAmount", 0.0)
            change_pct = st.get("change")
            pe = st.get("peRatio", 18.0)
            
            patt = re.compile(
                rf"(symbol:\s*'{ticker}',[\s\S]*?price:\s*)[0-9.]+(,[\s\S]*?change:\s*)[-0-9.]+(,[\s\S]*?changePercent:\s*)[-0-9.]+(,[\s\S]*?peRatio:\s*)[0-9.]+"
            )
            if patt.search(m_content):
                m_content = patt.sub(
                    rf"\g<1>{price}\g<2>{change}\g<3>{change_pct}\g<4>{pe}",
                    m_content
                )

        with open(MOCK_TS_PATH, "w", encoding="utf-8") as f:
            f.write(m_content)
        print(f"Updated {MOCK_TS_PATH} with authentic live quotes!")

if __name__ == "__main__":
    sync_ts_files()
