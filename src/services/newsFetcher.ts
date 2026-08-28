export interface RawNewsArticle {
  title: string;
  snippet: string;
  source: string;
  pubDate: string;
  link?: string;
  category: 'thai' | 'global';
}

export const sampleRawArticles: RawNewsArticle[] = [
  {
    title: 'NVDA พุ่งสถิติใหม่ หลังบริษัทเทคโนโลยีประกาศซื้อชิปประมวลผลสำหรับ AI Data Center มูลค่ามหาศาล',
    snippet: 'ความต้องการชิป GPU ประมวลผลปัญญาประดิษฐ์จาก NVIDIA ยังคงสูงกว่าอุปทานที่มีในตลาด ผู้ให้บริการคลาวด์รายใหญ่ทั้ง Microsoft และ Google สั่งจองชิปรุ่นใหม่ล่วงหน้า',
    source: 'TechCrunch / Reuters Financial',
    pubDate: new Date().toISOString(),
    category: 'global'
  },
  {
    title: 'กลุ่มพลังงานไทยรับอานิสงส์ราคาน้ำมันดิบ Brent ทะยาน โบรกเกอร์ชี้ PTT และ PTTEP มีลุ้นผลงานไตรมาสเด่น',
    snippet: 'ราคาน้ำมันดิบตลาดโลกปรับตัวขึ้นขานรับการปรับลดกำลังการผลิตของกลุ่ม OPEC+ และความตึงเครียดด้านภูมิรัฐศาสตร์ ส่งผลให้มีแรงซื้อหุ้นกลุ่มพลังงานใน SET Index อย่างหนาแน่น',
    source: 'สำนักข่าวการเงินไทย',
    pubDate: new Date().toISOString(),
    category: 'thai'
  },
  {
    title: 'การบริโภคในประเทศฟื้นตัว CPALL และค้าปลีกรับอานิสงส์ยอดซื้อช่วงเทศกาลและนักท่องเที่ยวต่างชาติ',
    snippet: 'ดัชนีความเชื่อมั่นผู้บริโภคปรับตัวดีขึ้นต่อเนื่อง ยอดขายสาขาเดิม (SSSG) ของกลุ่มร้านสะดวกซื้อและห้างสรรพสินค้าเติบโตในทิศทางบวก',
    source: 'กรุงเทพธุรกิจ',
    pubDate: new Date().toISOString(),
    category: 'thai'
  },
  {
    title: 'ตลาดหุ้นสหรัฐฯ ปิดพุ่ง ดัชนี S&P 500 ขานรับเงินเฟ้อ CPI ที่ชะลอตัว ตลาดคาด FED พร้อมลดดอกเบี้ยเดือน ก.ย.',
    snippet: 'อัตราเงินเฟ้อสหรัฐฯ ปรับตัวลดลงสอดคล้องกับที่นักวิเคราะห์คาดการณ์ เพิ่มความเชื่อมั่นว่าธนาคารกลางสหรัฐฯ จะเริ่มผ่อนคลายนโยบายการเงินในการประชุมที่จะถึงนี้',
    source: 'Bloomberg News',
    pubDate: new Date().toISOString(),
    category: 'global'
  }
];

export const newsFetcher = {
  /**
   * ดึงรายการข่าวสดดิบที่พร้อมสำหรับส่งให้ Gemini AI สรุป
   */
  fetchLatestRawArticles: async (): Promise<RawNewsArticle[]> => {
    // สามารถขยายการดึงจาก RSS Feed หรือ API จริงได้ที่นี่
    return sampleRawArticles;
  }
};
