"""
StockHomeTH - Thai Stock Universe Builder (SET / mai)
Generates Thai SET stock universe from server/data/thai_stocks.json,
enriches with sector data, and saves to market_cache.json + market_data.db.
"""

import os
import sys
import json
import random
import sqlite3
from datetime import datetime

if sys.platform == "win32":
    try:
        sys.stdout.reconfigure(encoding="utf-8")
        sys.stderr.reconfigure(encoding="utf-8")
    except Exception:
        pass

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DB_FILE = os.path.join(BASE_DIR, "market_data.db")
CACHE_FILE = os.path.join(BASE_DIR, "market_cache.json")
THAI_SOURCE = os.path.join(BASE_DIR, "server", "data", "thai_stocks.json")

# ==============================================================================
# SECTOR MAP: ticker -> (name, sector, base_price, market_cap, pe, div_yield)
# Complete SET50 + SET100 Constituents with High-Fidelity Curated Fundamentals
# ==============================================================================
THAI_CURATED = {
    # ─── Energy & Utilities ───
    "PTT":    ("PTT Public Company Limited",             "Energy & Utilities",         34.50, "985.4B THB", 9.8,  6.2),
    "PTTEP":  ("PTT Exploration and Production PCL",     "Energy & Utilities",        138.50, "549.8B THB", 7.2,  6.8),
    "TOP":    ("Thai Oil Public Company Limited",        "Energy & Utilities",         48.75, "108.9B THB", 6.8,  7.5),
    "GULF":   ("Gulf Energy Development PCL",            "Energy & Utilities",         66.50, "780.3B THB", 44.2, 1.3),
    "GPSC":   ("Global Power Synergy PCL",               "Energy & Utilities",         43.75, "123.3B THB", 28.0, 2.3),
    "BGRIM":  ("B.Grimm Power PCL",                     "Energy & Utilities",         22.40, "58.4B THB",  26.5, 2.2),
    "OR":     ("PTT Oil and Retail Business PCL",        "Energy & Utilities",         16.40, "196.8B THB", 17.5, 3.5),
    "EA":     ("Energy Absolute Public Company Limited", "Energy & Utilities",          7.25, "27.0B THB",  14.2, 4.2),
    "BANPU":  ("Banpu Public Company Limited",           "Energy & Utilities",          5.65, "56.6B THB",  9.8,  6.5),
    "RATCH":  ("RATCH Group Public Company Limited",     "Energy & Utilities",         31.25, "67.9B THB",  12.4, 5.8),
    "EGCO":   ("Electricity Generating PCL",             "Energy & Utilities",        112.50, "59.2B THB",  9.5,  5.8),
    "IRPC":   ("IRPC Public Company Limited",            "Energy & Utilities",          1.52, "31.0B THB",  11.2, 4.5),
    "BCP":    ("Bangchak Corporation PCL",               "Energy & Utilities",         36.50, "50.2B THB",  6.1,  6.0),
    "BCPG":   ("BCPG Public Company Limited",            "Energy & Utilities",          6.85, "20.5B THB",  14.2, 3.8),
    "SPRC":   ("Star Petroleum Refining PCL",            "Energy & Utilities",          7.85, "34.0B THB",  8.4,  5.2),
    "ACE":    ("Absolute Clean Energy PCL",              "Energy & Utilities",          1.38, "14.0B THB",  16.2, 2.8),
    "CKP":    ("CK Power Public Company Limited",        "Energy & Utilities",          3.64, "29.6B THB",  18.5, 2.5),
    "TTW":    ("TTW Public Company Limited",             "Energy & Utilities",          9.15, "36.5B THB",  12.8, 6.2),
    "WHAUP":  ("WHA Utilities and Power PCL",            "Energy & Utilities",          4.12, "15.7B THB",  11.5, 5.5),

    # ─── Banking & Financials ───
    "KBANK":  ("Kasikornbank Public Company Limited",    "Banking & Financials",      154.50, "366.0B THB", 8.5,  5.8),
    "SCB":    ("SCB X Public Company Limited",           "Banking & Financials",      114.00, "383.9B THB", 9.1,  8.9),
    "BBL":    ("Bangkok Bank Public Company Limited",    "Banking & Financials",      152.00, "290.1B THB", 7.2,  5.9),
    "KTB":    ("Krungthai Bank Public Company Limited",  "Banking & Financials",       21.30, "297.7B THB", 7.1,  5.4),
    "TTB":    ("TMBThanachart Bank PCL",                 "Banking & Financials",        1.96, "190.5B THB", 9.4,  6.8),
    "TISCO":  ("TISCO Financial Group PCL",              "Banking & Financials",       98.25, "78.6B THB",  10.8, 7.8),
    "TCAP":   ("Thanachart Capital PCL",                 "Banking & Financials",       51.25, "53.7B THB",  8.4,  6.5),
    "KKP":    ("Kiatnakin Phatra Bank PCL",              "Banking & Financials",       50.50, "42.7B THB",  8.9,  6.2),
    "KTC":    ("Krungthai Card PCL",                     "Banking & Financials",       46.75, "120.5B THB", 16.5, 2.8),
    "SAWAD":  ("Srisawad Corporation PCL",               "Banking & Financials",       41.25, "56.6B THB",  11.2, 4.5),
    "MTC":    ("Muangthai Capital PCL",                  "Banking & Financials",       48.50, "102.8B THB", 18.2, 2.3),
    "TIDLOR": ("Ngern Tid Lor Public Co., Ltd.",         "Banking & Financials",       18.60, "52.4B THB",  13.5, 3.2),
    "BAM":    ("Bangkok Commercial Asset Management PCL","Banking & Financials",        8.45, "27.3B THB",  13.2, 5.0),
    "THANI":  ("Ratchthani Leasing PCL",                 "Banking & Financials",        2.10, "12.0B THB",  10.2, 6.8),
    "JMT":    ("JMT Network Services PCL",               "Banking & Financials",       18.40, "26.8B THB",  14.5, 3.8),
    "JMART":  ("Jay Mart Public Company Limited",        "Banking & Financials",       14.60, "21.3B THB",  18.0, 2.5),
    "TLI":    ("Thai Life Insurance PCL",                "Banking & Financials",        8.85, "101.3B THB", 10.5, 4.2),

    # ─── Commerce & Retail ───
    "CPALL":  ("CP ALL Public Company Limited",          "Commerce & Retail",          64.75, "581.6B THB", 28.4, 2.1),
    "CPAXT":  ("CP Axtra Public Company Limited (Makro)","Commerce & Retail",          33.25, "351.8B THB", 31.2, 1.8),
    "CRC":    ("Central Retail Corporation PCL",         "Commerce & Retail",          32.00, "193.0B THB", 24.2, 2.2),
    "HMPRO":  ("Home Product Center PCL",                "Commerce & Retail",          10.40, "136.7B THB", 21.2, 4.1),
    "COM7":   ("COM7 Public Company Limited",            "Commerce & Retail",          25.50, "61.2B THB",  18.5, 3.2),
    "BJC":    ("Berli Jucker Public Company Limited",    "Commerce & Retail",          23.60, "94.6B THB",  19.8, 3.8),
    "GLOBAL": ("Siam Global House PCL",                  "Commerce & Retail",          15.80, "79.0B THB",  26.0, 1.8),
    "DOHOME": ("Dohome Public Company Limited",          "Commerce & Retail",          10.20, "31.5B THB",  28.5, 1.5),
    "MOSHI":  ("Moshi Moshi Retail Corporation PCL",     "Commerce & Retail",          48.50, "15.8B THB",  32.0, 1.2),
    "KAMART": ("Karmarts Public Company Limited",        "Commerce & Retail",          14.20, "12.5B THB",  22.5, 3.0),
    "MEGA":   ("Mega Lifesciences PCL",                  "Commerce & Retail",          38.75, "33.8B THB",  16.2, 3.5),

    # ─── Technology & Electronics ───
    "DELTA":  ("Delta Electronics (Thailand) PCL",       "Electronics & Tech",        142.00, "1.77T THB",  72.1, 0.6),
    "HANA":   ("Hana Microelectronics PCL",              "Electronics & Tech",         38.25, "30.8B THB",  18.5, 2.8),
    "KCE":    ("KCE Electronics Public Company Limited", "Electronics & Tech",         36.00, "42.5B THB",  21.0, 2.4),
    "FORTH":  ("Forth Corporation PCL",                  "Electronics & Tech",         14.80, "14.2B THB",  19.5, 2.2),
    "CCET":   ("Cal-Comp Electronics (Thailand) PCL",    "Electronics & Tech",          4.32, "45.0B THB",  15.2, 3.0),

    # ─── Telecom & Digital ───
    "ADVANC": ("Advanced Info Service PCL (AIS)",        "Telecom & Digital",         285.00, "847.7B THB", 24.5, 3.8),
    "TRUE":   ("True Corporation PCL",                   "Telecom & Digital",          11.80, "407.8B THB", 38.0, 1.2),
    "INTUCH": ("Intouch Holdings PCL",                   "Telecom & Digital",          98.50, "315.8B THB", 22.0, 3.6),
    "JAS":    ("Jasmine International PCL",              "Telecom & Digital",           2.42, "20.8B THB",  12.0, 4.5),

    # ─── Healthcare & Hospitals ───
    "BDMS":   ("Bangkok Dusit Medical Services PCL",     "Healthcare & Hospitals",     27.50, "437.0B THB", 29.8, 2.9),
    "BH":     ("Bumrungrad Hospital PCL",                "Healthcare & Hospitals",    268.00, "213.0B THB", 27.5, 2.0),
    "CHG":    ("Chularat Hospital PCL",                  "Healthcare & Hospitals",      2.74, "30.1B THB",  24.5, 3.2),
    "BCH":    ("Bangkok Chain Hospital PCL",             "Healthcare & Hospitals",     17.50, "43.6B THB",  23.0, 2.8),
    "PR9":    ("Praram 9 Hospital PCL",                  "Healthcare & Hospitals",     22.40, "17.6B THB",  26.0, 2.0),

    # ─── Transportation & Logistics ───
    "AOT":    ("Airports of Thailand PCL",               "Transportation & Logistics", 61.25, "875.0B THB", 36.2, 1.8),
    "BTS":    ("BTS Group Holdings PCL",                 "Transportation & Logistics",  4.86, "64.0B THB",  25.0, 3.5),
    "BEM":    ("Bangkok Expressway and Metro PCL",       "Transportation & Logistics",  7.80, "119.2B THB", 32.5, 2.0),
    "AAV":    ("Asia Aviation Public Company Limited",   "Transportation & Logistics",  2.64, "32.8B THB",  18.0, 2.0),
    "BA":     ("Bangkok Airways PCL",                    "Transportation & Logistics", 20.80, "43.7B THB",  15.5, 3.0),
    "PRM":    ("Prima Marine Public Company Limited",    "Transportation & Logistics",  8.15, "20.4B THB",  9.8,  5.5),
    "PSL":    ("Precious Shipping PCL",                  "Transportation & Logistics",  8.40, "13.1B THB",  8.5,  4.8),
    "RCL":    ("Regional Container Lines PCL",           "Transportation & Logistics", 26.50, "21.9B THB",  6.5,  6.0),
    "SJWD":   ("SCGJWD Logistics PCL",                   "Transportation & Logistics", 13.80, "24.9B THB",  22.0, 2.5),

    # ─── Property & Real Estate ───
    "CPN":    ("Central Pattana PCL",                    "Property & Real Estate",     63.50, "284.9B THB", 18.9, 2.8),
    "LH":     ("Land and Houses PCL",                    "Property & Real Estate",      5.85, "69.8B THB",  10.5, 8.2),
    "AP":     ("AP (Thailand) Public Company Limited",   "Property & Real Estate",      9.40, "29.5B THB",   5.5,  7.2),
    "SIRI":   ("Sansiri Public Company Limited",         "Property & Real Estate",      1.78, "30.8B THB",   6.2,  9.5),
    "SPALI":  ("Supalai Public Company Limited",         "Property & Real Estate",     18.60, "36.3B THB",   6.1,  7.8),
    "WHA":    ("WHA Corporation PCL",                    "Property & Real Estate",      5.60, "83.7B THB",  18.5, 3.2),
    "AMATA":  ("Amata Corporation PCL",                  "Property & Real Estate",     28.50, "32.8B THB",  14.2, 3.0),
    "AWC":    ("Asset World Corp PCL",                   "Property & Real Estate",      3.68, "117.8B THB", 26.0, 1.5),
    "QH":     ("Quality Houses PCL",                     "Property & Real Estate",      1.82, "19.5B THB",   8.2,  7.5),
    "ORI":    ("Origin Property PCL",                    "Property & Real Estate",      4.42, "10.8B THB",   6.5,  8.0),

    # ─── Construction & Materials ───
    "SCC":    ("The Siam Cement PCL",                    "Construction & Materials",  218.00, "261.6B THB", 32.0, 3.2),
    "SCGP":   ("SCG Packaging PCL",                      "Construction & Materials",   27.25, "117.0B THB", 22.5, 2.8),
    "SCCC":   ("Siam City Cement PCL",                   "Construction & Materials",  154.00, "45.9B THB",  14.0, 5.8),
    "CK":     ("CH. Karnchang PCL",                      "Construction & Materials",   21.20, "35.9B THB",  24.0, 1.8),
    "STEC":   ("Sino-Thai Engineering & Construction",   "Construction & Materials",    8.85, "13.5B THB",  26.0, 2.0),
    "TASCO":  ("Tipco Asphalt PCL",                      "Construction & Materials",   17.40, "27.5B THB",   9.8,  6.2),

    # ─── Food & Beverage & Tourism ───
    "MINT":   ("Minor International PCL",                "Tourism & Hospitality",      28.50, "127.4B THB", 38.5, 1.5),
    "CENTEL": ("Central Plaza Hotel PCL",                "Tourism & Hospitality",      38.00, "51.3B THB",  35.0, 1.2),
    "ERW":    ("The Erawan Group PCL",                   "Tourism & Hospitality",       4.42, "21.6B THB",  26.0, 1.8),
    "CPF":    ("Charoen Pokphand Foods PCL",             "Food & Beverage",            24.20, "208.4B THB", 18.0, 3.2),
    "TU":     ("Thai Union Group PCL",                   "Food & Beverage",            15.80, "75.3B THB",  12.5, 5.2),
    "CBG":    ("Carabao Group PCL",                      "Food & Beverage",            56.00, "56.0B THB",  20.0, 3.5),
    "OSP":    ("Osotspa Public Company Limited",         "Food & Beverage",            21.80, "65.5B THB",  25.0, 3.8),
    "ICHI":   ("Ichitan Group PCL",                      "Food & Beverage",            16.40, "21.3B THB",  16.5, 5.0),
    "SAPPE":  ("Sappe Public Company Limited",           "Food & Beverage",            84.50, "26.0B THB",  22.0, 2.5),
    "TKN":    ("Taokaenoi Food & Marketing PCL",         "Food & Beverage",            10.20, "14.1B THB",  19.5, 3.8),
    "BTG":    ("Betagro Public Company Limited",         "Food & Beverage",            21.50, "41.6B THB",  14.0, 2.8),
    "GFPT":   ("GFPT Public Company Limited",            "Food & Beverage",            11.60, "14.5B THB",   9.5,  3.5),
    "ITC":    ("i-Tail Corporation PCL",                 "Food & Beverage",            21.80, "65.4B THB",  19.0, 2.8),
    "XO":     ("Exotic Food PCL",                        "Food & Beverage",            24.50, "10.5B THB",  12.0, 4.2),
    "COCOCO": ("Thai Coconut Public Company Limited",    "Food & Beverage",             9.85, "14.5B THB",  15.5, 3.8),

    # ─── Additional SET100 Liquid Additions ───
    "AURA":   ("Aura Gold Public Company Limited",       "Commerce & Retail",          14.80, "20.1B THB",  19.5, 3.2),
    "BYD":    ("Beyond Securities PCL",                  "Banking & Financials",        1.42,  "5.8B THB",  18.0, 1.5),
    "NEX":    ("Nex Point Public Company Limited",       "EV & Mobility",               1.18,  "2.4B THB",  12.5, 0.0),
    "PTG":    ("PTG Energy Public Company Limited",      "Energy & Utilities",          8.45, "14.1B THB",  14.0, 4.2),
    "SKY":    ("SKY ICT Public Company Limited",         "Technology & Electronics",   22.40, "15.7B THB",  24.5, 1.8),
    "MASTER": ("Master Style Public Company Limited",    "Healthcare & Hospitals",     48.50, "13.2B THB",  28.0, 2.2),
    "SAV":    ("Samart Aviation Solutions PCL",         "Transportation & Logistics", 18.20, "11.6B THB",  21.0, 3.5),
    "BBGI":   ("BBGI Public Company Limited",            "Energy & Utilities",          4.80,  "7.0B THB",  16.0, 4.0),
    "TIPH":   ("Dhipaya Group Holdings PCL",             "Banking & Financials",       26.75, "15.9B THB",  10.2, 5.8),

    # ─── Industrial & Petrochemicals & Packaging ───
    "IVL":    ("Indorama Ventures PCL",                  "Petrochemicals & Chemicals", 22.80, "134.2B THB", 18.5, 4.2),
    "PTTGC":  ("PTT Global Chemical PCL",                "Petrochemicals & Chemicals", 30.25, "136.1B THB", 12.8, 5.0),
    "STA":    ("Sri Trang Agro-Industry PCL",            "Agribusiness & Rubber",      19.20, "29.5B THB",  11.0, 5.0),
    "STGT":   ("Sri Trang Gloves (Thailand) PCL",        "Healthcare & Rubber",         9.65, "27.6B THB",  14.5, 4.0),
    "TPIPL":  ("TPI Polene Public Company Limited",      "Industrial Materials",        1.24, "23.5B THB",   8.5,  5.5),
    "TPIPP":  ("TPI Polene Power PCL",                   "Energy & Utilities",          3.06, "25.7B THB",   7.5,  7.8),
    "VGI":    ("VGI Public Company Limited",             "Media & Advertising",         2.52, "28.2B THB",  35.0, 1.5),
    "PLANB":  ("Plan B Media PCL",                       "Media & Advertising",         7.45, "32.0B THB",  31.0, 1.8),
}


def generate_sparkline(base_price, change_pct):
    """Generate 7-point sparkline data"""
    points = []
    curr = base_price * (1.0 - (change_pct / 100.0))
    vol = max(0.008, abs(change_pct) / 100.0 * 0.4)
    for _ in range(6):
        curr += (random.random() - 0.48) * vol * curr
        points.append(round(curr, 2))
    points.append(round(base_price, 2))
    return points


def build_thai_universe(target_count=500):
    """Build Thai SET stock universe up to target_count"""
    print(f"🇹🇭 Building Thai Stock Universe (target: {target_count})...")

    thai_stocks = []
    seen = set()

    # 1. Curated SET50 + SET100 constituents first
    for ticker, (name, sector, price, mcap, pe, div) in THAI_CURATED.items():
        if len(thai_stocks) >= target_count:
            break
        seen.add(ticker)
        random.seed(hash(ticker) & 0xFFFFFFFF)
        chg = round(random.uniform(-3.5, 4.5), 2)
        spark = generate_sparkline(price, chg)

        thai_stocks.append({
            "ticker": ticker,
            "symbol": f"{ticker}.BK",
            "name": name,
            "market": "SET",
            "sector": sector,
            "price": price,
            "currency": "THB",
            "change": chg,
            "changeAmount": round(price * (chg / 100), 2),
            "marketCap": mcap,
            "peRatio": pe,
            "dividendYield": div,
            "high52w": round(price * random.uniform(1.10, 1.35), 2),
            "low52w": round(price * random.uniform(0.70, 0.90), 2),
            "volume": f"{random.uniform(5.0, 85.0):.1f}M",
            "sparkline7d": spark,
            "analystRating": "Strong Buy" if chg >= 2.0 else "Buy" if chg >= 0 else "Hold",
            "targetPrice": round(price * random.uniform(1.08, 1.25), 2),
            "sentimentScore": min(98, max(20, int(70 + chg * 5))),
            "aiInsight": f"หุ้น {name} ({ticker}) ผู้นำในกลุ่ม {sector} ปัจจัยพื้นฐานแข็งแกร่ง",
            "description": f"{name} จดทะเบียนในตลาดหลักทรัพย์แห่งประเทศไทย (SET) หมวด {sector}"
        })

    # 2. Fill remaining from server/data/thai_stocks.json (yfinance catalog)
    if os.path.exists(THAI_SOURCE):
        try:
            with open(THAI_SOURCE, "r", encoding="utf-8") as f:
                src_data = json.load(f)
            raw_stocks = src_data.get("stocks", []) if isinstance(src_data, dict) else src_data
            for item in raw_stocks:
                if len(thai_stocks) >= target_count:
                    break
                tk = (item.get("ticker") or item.get("symbol", "")).replace(".BK", "").strip().upper()
                if not tk or tk in seen:
                    continue
                seen.add(tk)

                nm = item.get("name") or f"{tk} Public Company Limited"
                sec = item.get("sector") or "Industrial & Services"
                pr = round(float(item.get("price") or item.get("current_price") or random.uniform(2.5, 45.0)), 2)
                chg = round(float(item.get("change") or random.uniform(-4.0, 4.0)), 2)
                mcap = item.get("marketCap") or f"{random.uniform(2.0, 45.0):.1f}B THB"
                pe = round(float(item.get("peRatio") or random.uniform(8.0, 32.0)), 1)
                div = round(float(item.get("dividendYield") or random.uniform(1.5, 7.5)), 1)
                spark = generate_sparkline(pr, chg)

                thai_stocks.append({
                    "ticker": tk,
                    "symbol": f"{tk}.BK",
                    "name": nm,
                    "market": "SET",
                    "sector": sec,
                    "price": pr,
                    "currency": "THB",
                    "change": chg,
                    "changeAmount": round(pr * (chg / 100), 2),
                    "marketCap": mcap,
                    "peRatio": pe,
                    "dividendYield": div,
                    "high52w": round(pr * random.uniform(1.10, 1.35), 2),
                    "low52w": round(pr * random.uniform(0.70, 0.90), 2),
                    "volume": f"{random.uniform(1.0, 35.0):.1f}M",
                    "sparkline7d": spark,
                    "analystRating": "Buy" if chg > 0 else "Hold",
                    "targetPrice": round(pr * 1.15, 2),
                    "sentimentScore": min(95, max(30, int(65 + chg * 5))),
                    "aiInsight": f"หุ้น {nm} ({tk}) ดำเนินธุรกิจในกลุ่ม {sec}",
                    "description": f"{nm} ({tk}) บริษัทจดทะเบียนในตลาดหลักทรัพย์แห่งประเทศไทย (SET/mai)"
                })
        except Exception as e:
            print(f"Warning reading {THAI_SOURCE}: {e}")

    print(f"✓ Generated {len(thai_stocks)} Thai SET stocks.")
    return thai_stocks


def save_to_cache(stocks):
    """Save Thai stocks to market_cache.json preserving any existing US stocks"""
    existing_us = []
    if os.path.exists(CACHE_FILE):
        try:
            with open(CACHE_FILE, "r", encoding="utf-8") as f:
                old_cache = json.load(f)
            old_data = old_cache.get("data", []) if isinstance(old_cache, dict) else old_cache
            existing_us = [s for s in old_data if s.get("market") == "US"]
        except Exception:
            existing_us = []

    combined = stocks + existing_us
    payload = {
        "last_updated": datetime.now().isoformat(),
        "total_count": len(combined),
        "set_count": len(stocks),
        "us_count": len(existing_us),
        "data": combined
    }

    with open(CACHE_FILE, "w", encoding="utf-8") as f:
        json.dump(payload, f, ensure_ascii=False, indent=2)
    print(f"✓ Saved {len(stocks)} Thai stocks to {CACHE_FILE} (Combined total: {len(combined)})")


def save_to_sqlite(stocks):
    """Save Thai stocks into SQLite market_data.db"""
    conn = sqlite3.connect(DB_FILE)
    c = conn.cursor()

    c.execute("""
        CREATE TABLE IF NOT EXISTS stocks (
            ticker TEXT PRIMARY KEY,
            symbol TEXT,
            name TEXT,
            market TEXT,
            sector TEXT,
            price REAL,
            currency TEXT,
            change REAL,
            change_amount REAL,
            market_cap TEXT,
            pe_ratio REAL,
            dividend_yield REAL,
            high_52w REAL,
            low_52w REAL,
            volume TEXT,
            sparkline TEXT,
            rating TEXT,
            target_price REAL,
            sentiment_score INTEGER,
            ai_insight TEXT,
            description TEXT,
            updated_at TEXT
        )
    """)

    now = datetime.now().isoformat()
    for s in stocks:
        c.execute("""
            INSERT OR REPLACE INTO stocks VALUES (
                ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
            )
        """, (
            s["ticker"],
            s["symbol"],
            s["name"],
            s["market"],
            s["sector"],
            s["price"],
            s["currency"],
            s["change"],
            s.get("changeAmount", 0.0),
            s["marketCap"],
            s["peRatio"],
            s["dividendYield"],
            s["high52w"],
            s["low52w"],
            s["volume"],
            json.dumps(s["sparkline7d"]),
            s["analystRating"],
            s["targetPrice"],
            s["sentimentScore"],
            s["aiInsight"],
            s["description"],
            now
        ))

    conn.commit()
    conn.close()
    print(f"✓ Saved {len(stocks)} Thai stocks to SQLite database ({DB_FILE})")


if __name__ == "__main__":
    count = 500
    if len(sys.argv) > 1:
        try:
            count = int(sys.argv[1])
        except ValueError:
            pass

    thai_stocks = build_thai_universe(count)
    save_to_cache(thai_stocks)
    save_to_sqlite(thai_stocks)
    print("🎉 Thai Universe Build Complete!")
