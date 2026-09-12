import { AssetRegistryItem } from '@/types/asset';

export const assetRegistry: AssetRegistryItem[] = [
  {
    keywords: ['ทองคำ', 'ราคาทอง', 'ทอง', 'gold', 'xau'],
    defaultIdentity: 'Gold (ทองคำ)',
    bypassKeywords: ['สมาคม', 'แท่ง', 'รูปพรรณ', 'spot', 'xau', 'xauusd', 'spdr', 'gld', 'aura', 'ออโรร่า'],
    options: [
      {
        label: '🇹🇭 ทองคำแท่ง / ทองรูปพรรณ',
        value: { exchange: 'Thai Gold Association', currency: 'THB' },
        description: 'ราคาอ้างอิงสมาคมค้าทองคำแห่งประเทศไทย (หน่วย: บาทละ)',
        promptSuffix: 'วิเคราะห์ทองคำแท่งและทองรูปพรรณในไทย อ้างอิงสมาคมค้าทองคำ (THB)'
      },
      {
        label: '🌍 Spot Gold (XAU/USD)',
        value: { exchange: 'Global Spot Market', currency: 'USD' },
        description: 'ราคาทองคำตลาดโลกแบบเรียลไทม์ (หน่วย: ดอลลาร์ต่อทรอยออนซ์)',
        promptSuffix: 'วิเคราะห์ราคาทองคำโลก Spot Gold (XAU/USD) ตลาดสากล'
      },
      {
        label: '📈 SPDR Gold Shares (GLD)',
        value: { exchange: 'NYSE Arca (GLD)', currency: 'USD', ticker: 'GLD' },
        description: 'กองทุน ETF ทองคำระดับโลก จดทะเบียนตลาดหุ้นสหรัฐฯ',
        promptSuffix: 'วิเคราะห์กองทุน SPDR Gold Shares (GLD) ตลาดสหรัฐฯ'
      },
      {
        label: '🏬 หุ้นร้านทอง AURA (SET)',
        value: { exchange: 'SET', currency: 'THB', ticker: 'AURA' },
        description: 'บมจ. ออโรร่า ดีไซน์ ธุรกิจค้าปลีกทองคำในตลาดหลักทรัพย์ไทย',
        promptSuffix: 'วิเคราะห์หุ้น AURA (บมจ. ออโรร่า ดีไซน์) ในตลาด SET'
      }
    ]
  },
  {
    keywords: ['น้ำมัน', 'ราคาน้ำมัน', 'oil', 'crude'],
    defaultIdentity: 'Crude Oil (น้ำมันดิบและค้าปลีก)',
    bypassKeywords: ['หน้าปั๊ม', 'ขายปลีก', 'ลิตร', 'wti', 'brent', 'pttep', 'top', 'sprc', 'bcp', 'or'],
    options: [
      {
        label: '⛽ ราคาน้ำมันขายปลีกในไทย',
        value: { exchange: 'Domestic Retail (PTT/BCP)', currency: 'THB' },
        description: 'ราคาหน้าปั๊มน้ำมันในประเทศไทย เช่น เบนซิน, ดีเซล (บาท/ลิตร)',
        promptSuffix: 'วิเคราะห์แนวโน้มราคาน้ำมันขายปลีกหน้าปั๊มในประเทศไทย (บาท/ลิตร)'
      },
      {
        label: '🛢️ WTI Crude Oil',
        value: { exchange: 'NYMEX', currency: 'USD' },
        description: 'สัญญาน้ำมันดิบอ้างอิงตลาดสหรัฐฯ (USD/Barrel)',
        promptSuffix: 'วิเคราะห์แนวโน้มราคาน้ำมันดิบ WTI ตลาดสหรัฐฯ (NYMEX)'
      },
      {
        label: '🇪🇺 Brent Crude Oil',
        value: { exchange: 'ICE', currency: 'USD' },
        description: 'สัญญาน้ำมันดิบเบรนท์อ้างอิงตลาดลอนดอน (USD/Barrel)',
        promptSuffix: 'วิเคราะห์ราคาน้ำมันดิบ Brent ตลาดสากล (ICE)'
      },
      {
        label: '🏭 หุ้นกลุ่มพลังงานและโรงกลั่นไทย',
        value: { exchange: 'SET', currency: 'THB', ticker: 'PTTEP' },
        description: 'หุ้นไทยที่เกี่ยวข้องกับน้ำมัน เช่น PTTEP, TOP, SPRC, OR, BCP',
        promptSuffix: 'วิเคราะห์ภาพรวมหุ้นกลุ่มพลังงานและโรงกลั่นไทย (PTTEP, TOP, BCP)'
      }
    ]
  },
  {
    keywords: ['apple', 'แอปเปิ้ล', 'แอปเปิล'],
    defaultIdentity: 'Apple (AAPL vs AAPL80X)',
    bypassKeywords: ['aapl80x', 'drx', 'สหรัฐ', 'nasdaq', 'หุ้นแม่', 'ตรง'],
    options: [
      {
        label: '🇺🇸 หุ้น Apple Inc. โดยตรง (AAPL)',
        value: { exchange: 'NASDAQ', currency: 'USD', ticker: 'AAPL' },
        description: 'หุ้นแม่จดทะเบียนในตลาดหุ้นสหรัฐฯ ซื้อขายเป็นสกุลเงิน USD',
        promptSuffix: 'วิเคราะห์หุ้น Apple Inc. (AAPL) ในตลาด NASDAQ สหรัฐฯ'
      },
      {
        label: '🇹🇭 Apple DRx (AAPL80X)',
        value: { exchange: 'SET', currency: 'THB', ticker: 'AAPL80X' },
        description: 'ตราสารแสดงสิทธิฝากเงินในหุ้น Apple ซื้อขายในตลาดหุ้นไทยเป็นเงินบาท',
        promptSuffix: 'วิเคราะห์ตราสาร Apple DRx (AAPL80X) ในตลาดหุ้นไทย (SET)'
      }
    ]
  },
  {
    keywords: ['tesla', 'เทสลา', 'เทสล่า'],
    defaultIdentity: 'Tesla (TSLA vs TSLA80X)',
    bypassKeywords: ['tsla80x', 'drx', 'สหรัฐ', 'nasdaq', 'หุ้นแม่', 'ตรง'],
    options: [
      {
        label: '🇺🇸 หุ้น Tesla Inc. โดยตรง (TSLA)',
        value: { exchange: 'NASDAQ', currency: 'USD', ticker: 'TSLA' },
        description: 'หุ้นแม่จดทะเบียนในตลาดหุ้นสหรัฐฯ ซื้อขายเป็นสกุลเงิน USD',
        promptSuffix: 'วิเคราะห์หุ้น Tesla Inc. (TSLA) ในตลาด NASDAQ สหรัฐฯ'
      },
      {
        label: '🇹🇭 Tesla DRx (TSLA80X)',
        value: { exchange: 'SET', currency: 'THB', ticker: 'TSLA80X' },
        description: 'ตราสารแสดงสิทธิฝากเงินในหุ้น Tesla ซื้อขายในตลาดหุ้นไทยเป็นเงินบาท',
        promptSuffix: 'วิเคราะห์ตราสาร Tesla DRx (TSLA80X) ในตลาดหุ้นไทย (SET)'
      }
    ]
  },
  {
    keywords: ['บิทคอยน์', 'บิตคอยน์', 'bitcoin', 'btc'],
    defaultIdentity: 'Bitcoin (Spot vs Equities)',
    bypassKeywords: ['เหรียญ', 'spot', 'bitkub', 'binance', 'mstr', 'coin', 'jts'],
    options: [
      {
        label: '🪙 เหรียญ Bitcoin Spot (BTC)',
        value: { exchange: 'Crypto Spot Market', currency: 'USD' },
        description: 'เหรียญคริปโตเคอร์เรนซีโดยตรง (BTC/USD หรือ BTC/THB)',
        promptSuffix: 'วิเคราะห์ราคาเหรียญ Bitcoin Spot (BTC/USD)'
      },
      {
        label: '🏢 หุ้นเกี่ยวข้องกับบิทคอยน์ (MSTR / COIN)',
        value: { exchange: 'NASDAQ', currency: 'USD', ticker: 'MSTR' },
        description: 'หุ้นที่ถือครองหรือทำธุรกิจเกี่ยวข้อง เช่น MicroStrategy, Coinbase',
        promptSuffix: 'วิเคราะห์หุ้นที่ถือครอง Bitcoin ในตลาดหุ้น (MSTR / COIN)'
      }
    ]
  },
  {
    keywords: ['ซื้อหุ้นอะไรดี', 'แนะนำหุ้นหน่อย', 'ลงทุนอะไรดี', 'ตัวไหนน่าซื้อ', 'หุ้นตัวไหนดี', 'ซื้อตัวไหนดี'],
    defaultIdentity: 'Investment Strategy & Horizon',
    bypassKeywords: ['ระยะสั้น', 'dca', 'ปันผล', 'เก็งกำไร', 'set50', 'เทค'],
    options: [
      {
        label: '🇹🇭 หุ้นไทย SET50 ปันผลสูง พื้นฐานแกร่ง',
        value: { exchange: 'SET', currency: 'THB' },
        description: 'สำหรับลงทุนระยะยาว รับเงินปันผลสม่ำเสมอ ความผันผวนปานกลาง',
        promptSuffix: 'แนะนำหุ้นไทย SET50 พื้นฐานแกร่ง เน้นเงินปันผลสม่ำเสมอ'
      },
      {
        label: '🇺🇸 หุ้นเทคโนโลยีระดับโลก สหรัฐฯ (Magnificent 7)',
        value: { exchange: 'US Markets', currency: 'USD' },
        description: 'เน้นการเติบโตของราคา (Growth Stocks) เช่น NVDA, AAPL, MSFT, GOOGL',
        promptSuffix: 'แนะนำหุ้นเทคโนโลยีสหรัฐฯ เติบโตสูง (Growth Stocks)'
      },
      {
        label: '⚡ หุ้นสัญญาณเทคนิคเด่น เก็งกำไรระยะสั้น',
        value: { exchange: 'SET / US', currency: 'THB/USD' },
        description: 'กลยุทธ์ตามแนวโน้ม โมเมนตัม Volume เข้า และมีจุดตัดขาดทุน (Cut Loss)',
        promptSuffix: 'แนะนำแนวทางคัดกรองหุ้นตามสัญญาณเทคนิค สำหรับเก็งกำไรระยะสั้น'
      }
    ]
  }
];
