import json
import os
import sys

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CACHE_PATH = os.path.join(BASE_DIR, "market_cache.json")

def inspect():
    if not os.path.exists(CACHE_PATH):
        print("Cache file does not exist")
        return
    with open(CACHE_PATH, "r", encoding="utf-8") as f:
        data = json.load(f)
    items = data if isinstance(data, list) else data.get("data", [])
    print(f"Total stocks in market_cache.json: {len(items)}")
    
    ticker_map = {f"{s.get('market')}-{str(s.get('ticker')).upper()}": s for s in items}
    
    mag7 = ["NVDA", "AAPL", "MSFT", "GOOGL", "AMZN", "META", "TSLA"]
    print("\n--- Magnificent 7 in cache ---")
    for t in mag7:
        st = ticker_map.get(f"US-{t}")
        if st:
            print(f"{t}: Price=${st.get('price')} | Change={st.get('change')}% | MCap={st.get('marketCap')}")
        else:
            print(f"{t}: NOT FOUND in cache")

    thai7 = ["DELTA", "PTT", "AOT", "ADVANC", "GULF", "KBANK", "SCB", "CPALL"]
    print("\n--- Thai 7 Giants in cache ---")
    for t in thai7:
        st = ticker_map.get(f"SET-{t}")
        if st:
            print(f"{t}: Price=฿{st.get('price')} | Change={st.get('change')}% | MCap={st.get('marketCap')}")
        else:
            print(f"{t}: NOT FOUND in cache")

if __name__ == "__main__":
    inspect()
