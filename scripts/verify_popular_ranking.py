import urllib.request
import json
import sys

if hasattr(sys.stdout, 'reconfigure'):
    sys.stdout.reconfigure(encoding='utf-8')

def test_popular(market):
    url = f"http://localhost:3000/api/stocks/live?market={market}&sortBy=popular&limit=15"
    print(f"\n==========================================")
    print(f"Testing Popular API for market: {market}")
    print(f"URL: {url}")
    print(f"==========================================")
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        with urllib.request.urlopen(req, timeout=10) as resp:
            data = json.loads(resp.read().decode('utf-8'))
            stocks = data.get('data', [])
            print(f"Returned {len(stocks)} stocks for {market}:")
            for idx, s in enumerate(stocks[:12], 1):
                print(f"  {idx}. [{s.get('market')}] {s.get('ticker'):<7} {s.get('name')[:25]:<25} | Price: {s.get('currency')} {s.get('price'):<8} | Change: {s.get('change'):>6}% | MCap: {s.get('marketCap')}")
    except Exception as e:
        print(f"Error testing {market}: {e}")

if __name__ == "__main__":
    test_popular("US")
    test_popular("SET")
    test_popular("ALL")
