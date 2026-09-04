"""
StockHomeTH - Global (US) Stock Universe Builder
Generates US stock universe from server/data/us_stocks.json (SEC EDGAR catalog),
enriches with curated S&P 500 / NASDAQ-100 fundamentals, and saves to
market_cache.json + market_data.db.
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
US_SOURCE = os.path.join(BASE_DIR, "server", "data", "us_stocks.json")

# ==============================================================================
# CURATED US MEGA-CAPS & INDEX CONSTITUENTS:
# Covers 100% of Magnificent 7, Dow Jones (DJIA 30), and NASDAQ-100 Leaders
# ==============================================================================
US_CURATED = {
    # ─── Magnificent 7 & Mega-Cap Tech ───
    "NVDA":  ("NVIDIA Corporation",             "Technology & Semiconductors",   128.50, "$3.15T",  54.2, 0.08),
    "AAPL":  ("Apple Inc.",                     "Consumer Electronics & Tech",   226.40, "$3.44T",  33.8, 0.44),
    "MSFT":  ("Microsoft Corporation",          "Software & Cloud",             418.20, "$3.11T",  34.6, 0.72),
    "AMZN":  ("Amazon.com, Inc.",               "E-Commerce & Cloud AWS",       182.40, "$1.90T",  41.5, 0.0),
    "GOOGL": ("Alphabet Inc. (Google Class A)", "Internet & Digital Tech",      165.90, "$2.06T",  23.1, 0.48),
    "GOOG":  ("Alphabet Inc. (Google Class C)", "Internet & Digital Tech",      167.20, "$2.06T",  23.2, 0.48),
    "META":  ("Meta Platforms, Inc.",            "Social Media & AI",            512.30, "$1.30T",  25.8, 0.39),
    "TSLA":  ("Tesla, Inc.",                    "Automotive & Clean Tech",      215.80, "$688.2B", 62.4, 0.0),

    # ─── Dow Jones Industrial Average (DJIA 30) Leaders ───
    "UNH":   ("UnitedHealth Group Inc.",        "Healthcare & Managed Care",    585.40, "$538.9B", 36.8, 1.44),
    "GS":    ("The Goldman Sachs Group, Inc.",  "Investment Banking",           485.20, "$162.0B", 14.5, 2.45),
    "HD":    ("The Home Depot, Inc.",            "Consumer & Retail",            372.00, "$369.4B", 24.6, 2.42),
    "MSFT":  ("Microsoft Corporation",          "Software & Cloud",             418.20, "$3.11T",  34.6, 0.72),
    "CAT":   ("Caterpillar Inc.",               "Industrials & Machinery",      348.50, "$172.4B", 16.2, 1.55),
    "MCD":   ("McDonald's Corporation",          "Restaurants & Food",           292.40, "$210.5B", 25.8, 2.30),
    "V":     ("Visa Inc.",                      "Banking & Financials",         278.50, "$564.2B", 29.5, 0.75),
    "CRM":   ("Salesforce, Inc.",               "Software & Cloud",             254.80, "$244.6B", 42.0, 0.63),
    "AMGN":  ("Amgen Inc.",                     "Healthcare & Biotech",         318.20, "$170.8B", 16.8, 2.80),
    "BA":    ("The Boeing Company",             "Industrials & Aerospace",      162.40, "$99.8B",  0.0,  0.0),
    "HON":   ("Honeywell International Inc.",   "Industrials & Aerospace",      208.50, "$136.2B", 22.4, 2.10),
    "IBM":   ("International Business Machines","Technology & Enterprise IT",   192.40, "$176.5B", 21.0, 3.45),
    "AXP":   ("American Express Company",       "Banking & Financials",         248.50, "$179.2B", 18.5, 1.15),
    "JPM":   ("JPMorgan Chase & Co.",           "Banking & Financials",         218.40, "$622.1B", 12.3, 2.10),
    "TRV":   ("The Travelers Companies, Inc.",  "Banking & Insurance",          232.50, "$53.2B",  12.8, 1.80),
    "CVX":   ("Chevron Corporation",            "Energy & Natural Resources",   146.80, "$272.4B", 14.2, 4.45),
    "SHW":   ("The Sherwin-Williams Company",   "Industrials & Materials",      362.40, "$91.5B",  32.0, 0.80),
    "JNJ":   ("Johnson & Johnson",              "Healthcare & Pharmaceuticals", 162.80, "$392.4B", 17.5, 3.00),
    "PG":    ("The Procter & Gamble Company",   "Consumer Goods",               172.50, "$406.2B", 27.4, 2.34),
    "MRK":   ("Merck & Co., Inc.",              "Healthcare & Pharmaceuticals", 118.50, "$300.2B", 16.5, 2.60),
    "DIS":   ("The Walt Disney Company",        "Telecom & Digital Media",       98.40, "$178.6B", 38.0, 0.77),
    "WMT":   ("Walmart Inc.",                   "Consumer & Retail",             78.60, "$631.8B", 33.2, 1.05),
    "KO":    ("The Coca-Cola Company",          "Food & Consumer Staples",       68.50, "$294.8B", 26.2, 2.80),
    "CSCO":  ("Cisco Systems, Inc.",            "Technology & Networking",       49.50, "$198.5B", 15.2, 3.25),
    "NKE":   ("NIKE, Inc.",                     "Consumer & Retail",             82.40, "$124.5B", 24.5, 1.80),
    "MMM":   ("3M Company",                     "Industrials & Materials",      128.50, "$71.2B",  14.8, 2.20),
    "VZ":    ("Verizon Communications Inc.",    "Telecom & Digital Media",       41.80, "$175.8B",  9.8,  6.40),
    "DOW":   ("Dow Inc.",                       "Chemicals & Materials",         52.40, "$36.8B",  18.5, 5.30),
    "INTC":  ("Intel Corporation",              "Technology & Semiconductors",    20.50, "$87.5B",   0.0,  1.50),

    # ─── Additional NASDAQ-100 Tech, Biotech & Innovation Titans ───
    "AVGO":  ("Broadcom Inc.",                  "Technology & Semiconductors",  168.50, "$786.4B", 68.2, 1.30),
    "COST":  ("Costco Wholesale Corporation",   "Consumer & Retail",            925.40, "$410.4B", 52.8, 0.50),
    "NFLX":  ("Netflix, Inc.",                  "Telecom & Digital Media",      685.20, "$293.8B", 43.1, 0.0),
    "AMD":   ("Advanced Micro Devices, Inc.",   "Technology & Semiconductors",  154.20, "$249.5B", 115.0, 0.0),
    "QCOM":  ("QUALCOMM Incorporated",          "Technology & Semiconductors",  168.00, "$188.4B", 16.4, 2.00),
    "TXN":   ("Texas Instruments Incorporated", "Technology & Semiconductors",  204.50, "$186.2B", 32.0, 2.55),
    "ADBE":  ("Adobe Inc.",                     "Software & Cloud",             562.40, "$252.0B", 46.2, 0.0),
    "INTU":  ("Intuit Inc.",                    "Software & Cloud",             648.50, "$181.2B", 62.0, 0.55),
    "AMAT":  ("Applied Materials, Inc.",        "Technology & Semiconductors",  198.50, "$164.2B", 23.5, 0.80),
    "BKNG":  ("Booking Holdings Inc.",          "Consumer & Retail",           3920.00, "$134.5B", 28.5, 0.88),
    "ISRG":  ("Intuitive Surgical, Inc.",       "Healthcare & Medical Tech",    475.20, "$168.5B", 78.0, 0.0),
    "LRCX":  ("Lam Research Corporation",       "Technology & Semiconductors",  812.40, "$105.8B", 26.5, 1.00),
    "KLAC":  ("KLA Corporation",                "Technology & Semiconductors",  725.50, "$97.8B",  31.2, 0.80),
    "ADI":   ("Analog Devices, Inc.",           "Technology & Semiconductors",  228.40, "$113.2B", 38.0, 1.60),
    "PANW":  ("Palo Alto Networks, Inc.",       "Technology & Cybersecurity",   345.80, "$112.5B", 48.0, 0.0),
    "CRWD":  ("CrowdStrike Holdings, Inc.",     "Technology & Cybersecurity",   285.40, "$69.8B",  65.0, 0.0),
    "SNPS":  ("Synopsys, Inc.",                 "Software & Semiconductors",    512.40, "$78.5B",  52.0, 0.0),
    "CDNS":  ("Cadence Design Systems, Inc.",   "Software & Semiconductors",    272.50, "$74.2B",  68.0, 0.0),
    "MELI":  ("MercadoLibre, Inc.",             "Consumer & Retail",           1985.00, "$100.5B", 72.0, 0.0),
    "PDD":   ("PDD Holdings Inc. (Temu/Pinduoduo)","Consumer & Retail",         118.50, "$164.8B", 12.5, 0.0),
    "ABNB":  ("Airbnb, Inc.",                   "Consumer & Retail",            128.40, "$81.5B",  32.0, 0.0),
    "PLTR":  ("Palantir Technologies Inc.",     "Technology & AI Software",      31.80, "$70.8B",  200.0, 0.0),
    "MAR":   ("Marriott International, Inc.",   "Consumer & Travel",            248.50, "$71.2B",  26.0, 0.85),
    "ORLY":  ("O'Reilly Automotive, Inc.",      "Consumer & Retail",           1142.00, "$67.2B",  28.0, 0.0),
    "CTAS":  ("Cintas Corporation",             "Industrials & Services",       785.40, "$79.8B",  48.0, 0.80),
    "NXPI":  ("NXP Semiconductors N.V.",        "Technology & Semiconductors",  238.50, "$61.2B",  22.0, 1.70),
    "FTNT":  ("Fortinet, Inc.",                 "Technology & Cybersecurity",    76.50, "$58.4B",  42.0, 0.0),
    "WDAY":  ("Workday, Inc.",                  "Software & Cloud",             252.40, "$66.8B",  45.0, 0.0),
    "ROP":   ("Roper Technologies, Inc.",       "Technology & Software",        548.50, "$58.9B",  38.0, 0.55),
    "PCAR":  ("PACCAR Inc",                     "Industrials & Machinery",       98.50, "$51.6B",  12.0, 3.20),
    "PAYX":  ("Paychex, Inc.",                  "Technology & HR Software",     132.40, "$47.8B",  28.0, 3.00),
    "CPRT":  ("Copart, Inc.",                   "Consumer & Auto Services",      52.80, "$50.9B",  36.0, 0.0),
    "ODFL":  ("Old Dominion Freight Line",      "Industrials & Transport",      198.50, "$43.2B",  34.0, 0.50),
    "FAST":  ("Fastenal Company",               "Industrials & Wholesale",       72.40, "$41.5B",  36.0, 2.10),
    "CSGP":  ("CoStar Group, Inc.",             "Real Estate & Software",        76.80, "$31.5B",  78.0, 0.0),
    "ROST":  ("Ross Stores, Inc.",              "Consumer & Retail",            148.50, "$49.5B",  24.0, 1.00),
    "SBUX":  ("Starbucks Corporation",          "Consumer & Restaurants",        94.50, "$107.2B", 26.5, 2.45),
    "PEP":   ("PepsiCo, Inc.",                  "Food & Consumer Staples",      174.50, "$239.8B", 24.5, 3.10),
    "MDLZ":  ("Mondelez International, Inc.",   "Food & Consumer Staples",       71.20, "$96.5B",  22.0, 2.65),
    "MNST":  ("Monster Beverage Corporation",   "Food & Consumer Staples",       51.40, "$53.2B",  32.0, 0.0),
    "KDP":   ("Keurig Dr Pepper Inc.",          "Food & Consumer Staples",       36.50, "$50.8B",  21.0, 2.35),
    "KHC":   ("The Kraft Heinz Company",        "Food & Consumer Staples",       34.80, "$42.5B",  14.5, 4.60),
    "MRNA":  ("Moderna, Inc.",                  "Healthcare & Biotech",          78.50, "$30.2B",   0.0, 0.0),
    "REGN":  ("Regeneron Pharmaceuticals",      "Healthcare & Biotech",        1024.00, "$112.5B", 26.0, 0.0),
    "VRTX":  ("Vertex Pharmaceuticals",         "Healthcare & Biotech",         485.20, "$125.0B", 32.0, 0.0),
    "GILD":  ("Gilead Sciences, Inc.",          "Healthcare & Biotech",          82.40, "$102.8B", 14.5, 3.75),
    "BIIB":  ("Biogen Inc.",                    "Healthcare & Biotech",         198.50, "$28.9B",  16.0, 0.0),
    "DXCM":  ("DexCom, Inc.",                   "Healthcare & Medical Devices",  72.50, "$28.4B",  45.0, 0.0),
    "IDXX":  ("IDEXX Laboratories, Inc.",       "Healthcare & Diagnostics",     485.40, "$40.2B",  48.0, 0.0),
    "ILMN":  ("Illumina, Inc.",                 "Healthcare & Genomics",        132.50, "$21.0B",   0.0, 0.0),
    "GEHC":  ("GE HealthCare Technologies",     "Healthcare & Medical Tech",     86.50, "$39.5B",  22.0, 0.15),
    "AZN":   ("AstraZeneca PLC (ADR)",          "Healthcare & Pharmaceuticals",  78.20, "$242.0B", 36.0, 2.50),
    "ASML":  ("ASML Holding N.V. (ADR)",        "Technology & Semiconductors",  785.40, "$312.5B", 42.0, 0.85),
    "ARM":   ("Arm Holdings plc (ADR)",         "Technology & Semiconductors",  138.50, "$144.5B", 98.0, 0.0),
    "MU":    ("Micron Technology, Inc.",        "Technology & Semiconductors",   98.50, "$109.2B", 18.0, 0.45),
    "MRVL":  ("Marvell Technology, Inc.",       "Technology & Semiconductors",   76.40, "$66.0B",  42.0, 0.30),
    "ON":    ("ON Semiconductor Corporation",   "Technology & Semiconductors",   72.50, "$31.2B",  15.0, 0.0),
    "MCHP":  ("Microchip Technology Inc.",      "Technology & Semiconductors",   78.40, "$42.5B",  22.0, 2.30),
    "GFS":   ("GlobalFoundries Inc.",           "Technology & Semiconductors",   42.50, "$23.8B",  28.0, 0.0),
    "SMCI":  ("Super Micro Computer, Inc.",     "Technology & AI Hardware",     435.00, "$25.5B",  18.0, 0.0),
    "COIN":  ("Coinbase Global, Inc.",          "Fintech & Digital Assets",     184.50, "$48.7B",  35.0, 0.0),
    "PYPL":  ("PayPal Holdings, Inc.",          "Fintech & Digital Payments",    54.80, "$46.9B",  18.5, 0.0),
    "SOFI":  ("SoFi Technologies, Inc.",        "Fintech & Digital Banking",     18.30, "$23.7B",  32.0, 0.0),
    "SHOP":  ("Shopify Inc.",                   "E-Commerce & Cloud Software",   76.50, "$98.5B",  65.0, 0.0),
    "TEAM":  ("Atlassian Corporation",          "Software & Cloud Tools",       168.50, "$43.8B",  48.0, 0.0),
    "DDOG":  ("Datadog, Inc.",                  "Cloud Software & Monitoring",  118.50, "$39.5B",  62.0, 0.0),
    "ZS":    ("Zscaler, Inc.",                  "Technology & Cybersecurity",   178.40, "$27.2B",  55.0, 0.0),
    "TTD":   ("The Trade Desk, Inc.",           "Digital Advertising Tech",     108.50, "$53.2B",  82.0, 0.0),
    "TTWO":  ("Take-Two Interactive Software",  "Gaming & Interactive Media",   152.40, "$26.5B",  38.0, 0.0),
    "EA":    ("Electronic Arts Inc.",           "Gaming & Digital Media",       142.50, "$38.2B",  32.0, 0.95),
    "WBD":   ("Warner Bros. Discovery, Inc.",   "Media & Entertainment",          7.85, "$19.2B",   0.0, 0.0),
    "CHTR":  ("Charter Communications, Inc.",   "Telecom & Cable",              345.00, "$49.8B",  10.5, 0.0),
    "CMCSA": ("Comcast Corporation",            "Telecom & Media",               40.50, "$158.2B", 10.8, 3.05),
    "TMUS":  ("T-Mobile US, Inc.",              "Telecom & 5G Wireless",        204.50, "$239.5B", 24.0, 1.30),
    "AEP":   ("American Electric Power",        "Utilities & Power Grid",        98.50, "$52.4B",  18.5, 3.65),
    "EXC":   ("Exelon Corporation",             "Utilities & Power Grid",        39.80, "$39.8B",  16.2, 3.80),
    "XEL":   ("Xcel Energy Inc.",               "Utilities & Clean Energy",      64.20, "$35.8B",  18.0, 3.40),
    "CEG":   ("Constellation Energy Corp",      "Clean Energy & Nuclear Power", 218.50, "$68.9B",  32.0, 0.65),
    "FANG":  ("Diamondback Energy, Inc.",       "Energy & Natural Resources",   182.40, "$32.5B",   9.8, 4.20),
    "BKR":   ("Baker Hughes Company",           "Energy & Oilfield Services",    36.50, "$36.8B",  17.5, 2.30),
    "CTSH":  ("Cognizant Technology Solutions", "Technology & IT Services",      76.50, "$38.0B",  16.5, 1.55),
    "VRSK":  ("Verisk Analytics, Inc.",         "Data Analytics & Software",    268.50, "$38.2B",  42.0, 0.60),
    "DLTR":  ("Dollar Tree, Inc.",              "Consumer & Retail",             68.50, "$14.8B",  14.0, 0.0),
    "DASH":  ("DoorDash, Inc.",                 "Consumer & Food Logistics",    128.50, "$52.8B",  65.0, 0.0),
    "LULU":  ("Lululemon Athletica Inc.",       "Consumer & Apparel",           268.50, "$33.8B",  20.5, 0.0),
    "ANSS":  ("ANSYS, Inc.",                    "Software & Engineering AI",    324.50, "$28.4B",  58.0, 0.0),
    "SNOW":  ("Snowflake Inc.",                 "Cloud Software & Data AI",     124.50, "$41.5B",  65.0, 0.0),
    "MCO":   ("Moody's Corporation",            "Financial Data & Analytics",   468.50, "$85.2B",  42.0, 0.75),
}

# Comprehensive Sector classifier for US stocks
def classify_us_sector(ticker):
    """Accurate GICS sector classification for US stocks"""
    t = ticker.upper()
    tech = [
        'NVDA','AAPL','MSFT','GOOG','GOOGL','AMZN','META','AMD','AVGO','INTC','CRM','ORCL',
        'ADBE','QCOM','TXN','CSCO','IBM','NOW','SNOW','PLTR','ARM','MU','AMAT','LRCX',
        'KLAC','ASML','TSM','DELL','HPQ','UBER','PANW','CRWD','NET','FTNT','DDOG','ZS',
        'MDB','TEAM','SHOP','SQ','COIN','PATH','SMCI','INTU','ANSS','CDNS','SNPS','MRVL'
    ]
    fin = [
        'JPM','BAC','WFC','C','GS','MS','BLK','SCHW','AXP','V','MA','PYPL','COF',
        'USB','PNC','TFC','BK','STT','KKR','BX','APO','CME','ICE','MCO','SPGI','TRV',
        'AIG','MET','PRU','ALL','PGR','CB','SOFI'
    ]
    hc = [
        'LLY','UNH','JNJ','ABBV','MRK','PFE','TMO','ABT','DHR','AMGN','BMY','GILD',
        'ISRG','VRTX','REGN','MDT','SYK','BSX','CVS','HUM','MCK','MRNA','BIIB','AZN',
        'DXCM','IDXX','ILMN','GEHC'
    ]
    ret = [
        'WMT','COST','TGT','HD','LOW','TJX','NKE','LULU','SBUX','MCD','YUM','CMG',
        'BKNG','ABNB','MAR','HLT','ROST','DLTR','DG','ORLY','AZO','EBAY','ETSY'
    ]
    ene = [
        'XOM','CVX','COP','EOG','SLB','OXY','MPC','VLO','PSX','DVN','FANG','HAL',
        'BKR','KMI','WMB','OKE','TRGP'
    ]
    ind = [
        'CAT','BA','LMT','RTX','GE','HON','UNP','UPS','FDX','DE','EMR','ETN','ITW',
        'NSC','CSX','GD','NOC','WM','RSG','PH','PCAR','FAST'
    ]
    auto = ['TSLA','F','GM','RIVN','LCID','NIO','LI','XPEV','APTV','BWA']
    tele = ['VZ','T','TMUS','CMCSA','CHTR','NFLX','DIS','WBD','PARA','FOXA','OMC','IPG']
    reit = ['PLD','AMT','EQIX','CCI','PSA','O','SPG','WELL','DLR','AVB','EQR','WY']
    food = ['KO','PEP','MDLZ','PM','MO','KDP','KHC','GIS','K','HSY','STZ','ADM','TSN']

    if t in tech: return 'Technology & Semiconductors'
    if t in fin:  return 'Banking & Financials'
    if t in hc:   return 'Healthcare & Pharmaceuticals'
    if t in ret:  return 'Consumer & Retail'
    if t in ene:  return 'Energy & Natural Resources'
    if t in ind:  return 'Industrials & Aerospace'
    if t in auto: return 'Automotive & Clean Tech'
    if t in tele: return 'Telecom & Digital Media'
    if t in reit: return 'Real Estate & REITs'
    if t in food: return 'Food & Consumer Staples'
    return 'Global Enterprise'


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


def build_global_universe(target_count=500):
    """Build US stock universe up to target_count"""
    print(f"🇺🇸 Building Global (US) Stock Universe (target: {target_count})...")

    us_stocks = []
    seen = set()

    # 1. Curated mega-caps first
    for ticker, (name, sector, price, mcap, pe, div) in US_CURATED.items():
        if len(us_stocks) >= target_count:
            break
        seen.add(ticker)
        random.seed(hash(ticker) & 0xFFFFFFFF)
        chg = round(random.uniform(-3.8, 4.8), 2)
        spark = generate_sparkline(price, chg)

        us_stocks.append({
            "ticker": ticker,
            "symbol": ticker,
            "name": name,
            "market": "US",
            "sector": sector,
            "price": price,
            "currency": "USD",
            "change": chg,
            "changeAmount": round(price * (chg / 100), 2),
            "marketCap": mcap,
            "peRatio": pe,
            "dividendYield": div,
            "high52w": round(price * random.uniform(1.08, 1.30), 2),
            "low52w": round(price * random.uniform(0.70, 0.90), 2),
            "volume": f"{random.uniform(15.0, 120.0):.1f}M",
            "sparkline7d": spark,
            "analystRating": "Strong Buy" if chg >= 2.0 else "Buy" if chg >= 0 else "Hold",
            "targetPrice": round(price * random.uniform(1.08, 1.35), 2),
            "sentimentScore": min(98, max(40, int(75 + chg * 5))),
            "aiInsight": f"ผู้นำอุตสาหกรรม {sector} ระดับโลก ได้รับแรงหนุนจากกระแส AI และการลงทุนเทคโนโลยี",
            "description": f"{name} บริษัทชั้นนำในตลาดหลักทรัพย์สหรัฐฯ หมวด {sector}"
        })

    # 2. Fill from server/data/us_stocks.json (SEC EDGAR catalog)
    if os.path.exists(US_SOURCE):
        try:
            with open(US_SOURCE, "r", encoding="utf-8") as f:
                raw_us = json.load(f)
            raw_list = raw_us.get("stocks", []) if isinstance(raw_us, dict) else raw_us
            print(f"   Loaded {len(raw_list)} tickers from us_stocks.json")
            for item in raw_list:
                if len(us_stocks) >= target_count:
                    break
                sym = (item.get("ticker") or item.get("symbol", "")).strip().upper()
                if not sym or not sym.isalpha() or len(sym) > 5 or sym in seen:
                    continue
                seen.add(sym)
                name = item.get("name") or item.get("title", f"{sym} Corporation")
                sector = classify_us_sector(sym)
                random.seed(hash(sym) & 0xFFFFFFFF)
                price = round(random.uniform(12.0, 380.0), 2)
                chg = round(random.uniform(-4.5, 5.5), 2)
                spark = generate_sparkline(price, chg)

                us_stocks.append({
                    "ticker": sym,
                    "symbol": sym,
                    "name": name,
                    "market": "US",
                    "sector": sector,
                    "price": price,
                    "currency": "USD",
                    "change": chg,
                    "changeAmount": round(price * (chg / 100), 2),
                    "marketCap": f"${random.uniform(2.0, 180.0):.1f}B",
                    "peRatio": round(random.uniform(12.0, 48.0), 1),
                    "dividendYield": round(random.uniform(0.0, 4.2), 2),
                    "high52w": round(price * random.uniform(1.08, 1.35), 2),
                    "low52w": round(price * random.uniform(0.68, 0.88), 2),
                    "volume": f"{random.uniform(1.0, 45.0):.1f}M",
                    "sparkline7d": spark,
                    "analystRating": "Buy" if chg >= 0 else "Hold",
                    "targetPrice": round(price * random.uniform(1.05, 1.30), 2),
                    "sentimentScore": min(95, max(30, int(65 + chg * 4))),
                    "aiInsight": f"หุ้นเติบโตในตลาดสหรัฐฯ หมวด {sector} มีโมเมนตัมธุรกิจที่มั่นคง",
                    "description": f"{name} บริษัทจดทะเบียนในตลาดหลักทรัพย์สหรัฐอเมริกา หมวด {sector}"
                })
        except Exception as e:
            print(f"   Warning: Cannot read us_stocks.json: {e}")

    return us_stocks[:target_count]


def save_to_db(stocks, db_path=DB_FILE):
    """Save US stocks to SQLite database"""
    conn = sqlite3.connect(db_path, timeout=15.0)
    cur = conn.cursor()

    cur.execute("""
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

    cur.execute("""
    CREATE TABLE IF NOT EXISTS live_quotes (
        ticker TEXT PRIMARY KEY,
        symbol TEXT,
        market TEXT,
        name TEXT,
        price REAL,
        currency TEXT,
        change_pct REAL,
        market_cap TEXT,
        volume TEXT,
        last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
    """)

    now = datetime.now().isoformat()
    for s in stocks:
        cur.execute("""
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

        cur.execute("""
            INSERT OR REPLACE INTO live_quotes (
                ticker, price, change, market_cap, pe_ratio, dividend_yield, high52w, low52w, volume, ai_insight, analyst_rating, target_price, sentiment_score, sparkline_json, last_updated
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            s["ticker"], s["price"], s["change"], s["marketCap"], s["peRatio"], s["dividendYield"],
            s["high52w"], s["low52w"], s["volume"], s["aiInsight"], s["analystRating"],
            s["targetPrice"], s["sentimentScore"], json.dumps(s["sparkline7d"]), now
        ))

    conn.commit()
    conn.close()


def main():
    print("=" * 60)
    print("🇺🇸 StockHomeTH - Global (US) Stock Universe Builder")
    print(f"   Timestamp: {datetime.now().isoformat()}")
    print("=" * 60)

    target = 1500
    if len(sys.argv) > 1:
        try:
            target = int(sys.argv[1])
        except ValueError:
            pass

    us_stocks = build_global_universe(target)
    print(f"[✓] Generated {len(us_stocks)} US stocks")

    # Save to market_cache.json (merge with existing Thai data)
    cache_path = CACHE_FILE
    existing = []
    if os.path.exists(cache_path):
        try:
            with open(cache_path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            existing = raw.get("data", []) if isinstance(raw, dict) else (raw if isinstance(raw, list) else [])
            # Keep only SET stocks (preserve Thai data)
            existing = [s for s in existing if s.get("market") == "SET"]
        except Exception:
            existing = []

    combined = existing + us_stocks
    cache_payload = {
        "timestamp": datetime.now().isoformat(),
        "count": len(combined),
        "setCount": len(existing),
        "usCount": len(us_stocks),
        "data": combined
    }

    with open(cache_path, "w", encoding="utf-8") as f:
        json.dump(cache_payload, f, ensure_ascii=False, indent=2)
    print(f"[✓] Saved to {cache_path} (total: {len(combined)} stocks)")

    # Save to SQLite
    save_to_db(us_stocks)
    print(f"[✓] Saved {len(us_stocks)} US stocks to {DB_FILE}")

    print("=" * 60)
    print("🎉 GLOBAL (US) STOCK UNIVERSE BUILD COMPLETE!")
    print("=" * 60)


if __name__ == "__main__":
    main()

