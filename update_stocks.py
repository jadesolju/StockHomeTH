"""
StockHomeTH - Unified Global & Thai Stock Master Updater
Runs SEC.gov US stock updater and SET Thai stock updater.
"""

import os
import sys
from datetime import datetime

if sys.platform == "win32":
    sys.stdout.reconfigure(encoding="utf-8")

import update_us_stocks
import update_thai_stocks

def main():
    print("=" * 60)
    print("StockHomeTH - Master Stock Data Synchronization")
    print(f"Timestamp: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 60)

    # 1. Update US Stocks from SEC.gov
    print("\n[Step 1/2] Updating US Stocks from SEC.gov...")
    us_result = update_us_stocks.run()

    # 2. Update Thai Stocks from SET
    print("\n[Step 2/2] Updating Thai SET Stocks...")
    thai_result = update_thai_stocks.run()

    print("\n" + "=" * 60)
    if us_result and thai_result:
        print(f"[COMPLETE] MASTER SYNC COMPLETE! (US: {us_result['total']}, THAI: {thai_result['total']})")
    else:
        print("[WARNING] MASTER SYNC FINISHED WITH SOME WARNINGS (Check update_log.txt)")
    print("=" * 60)

if __name__ == "__main__":
    main()
