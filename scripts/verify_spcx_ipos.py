import urllib.request
import urllib.parse
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def test_api(name, url):
    print(f"\n==========================================")
    print(f"Testing: {name}")
    print(f"URL: {url}")
    print(f"==========================================")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            stocks = data.get('data')
            if isinstance(stocks, list):
                print(f"Returned {len(stocks)} stocks:")
                for idx, s in enumerate(stocks[:15], 1):
                    print(f"  {idx}. [{s.get('market')}] {s.get('ticker'):<8} {s.get('name')[:35]:<35} | Price: {s.get('currency')} {s.get('price'):<8} | MCap: {s.get('marketCap')}")
            elif isinstance(stocks, dict):
                print(f"Single stock: [{stocks.get('market')}] {stocks.get('ticker')} ({stocks.get('name')}) | Price: {stocks.get('currency')} {stocks.get('price')} | MCap: {stocks.get('marketCap')}")
    except Exception as e:
        print(f"Error testing {name}: {e}")

if __name__ == "__main__":
    q_thai = urllib.parse.quote('IPO ล่าสุด')
    test_api("Tag: IPO ล่าสุด", f"http://localhost:3000/api/stocks/live?tag={q_thai}&limit=20")
    test_api("Search: SPCX", "http://localhost:3000/api/stocks/live?search=SPCX")
    test_api("Search: OKJ", "http://localhost:3000/api/stocks/live?search=OKJ")
    test_api("Single Stock: SPCX", "http://localhost:3000/api/stocks/live?ticker=SPCX")
