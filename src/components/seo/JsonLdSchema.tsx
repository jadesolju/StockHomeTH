import React from 'react';

export function JsonLdSchema() {
  const organizationSchema = {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'StockHomeTH',
    url: 'https://stockhometh.online',
    logo: 'https://stockhometh.online/favicon.svg',
    description:
      'Enterprise Financial Intelligence & AI Stock Analytics Platform for Thai & US Markets',
    sameAs: ['https://stockhometh.online'],
  };

  const websiteSchema = {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'StockHomeTH',
    url: 'https://stockhometh.online',
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://stockhometh.online/stocks?symbol={search_term_string}',
      },
      'query-input': 'required name=search_term_string',
    },
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'StockHomeTH คืออะไร?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'StockHomeTH คือแพลตฟอร์มศูนย์รวมข้อมูลและผู้ช่วย AI วิเคราะห์การลงทุนอัจฉริยะแบบ Real-Time สำหรับหุ้นไทย (SET/mai) และหุ้นสหรัฐฯ (NASDAQ/NYSE)',
        },
      },
      {
        '@type': 'Question',
        name: 'StockHomeTH รองรับการวิเคราะห์หุ้นอะไรบ้าง?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'รองรับหุ้นกว่า 10,637 ตัว ครอบคลุมตลาดหุ้นไทย SET, mai, หุ้นสหรัฐฯ, สินค้าโภคภัณฑ์ (ทองคำ, น้ำมัน) และอัตราแลกเปลี่ยน พร้อมระบบ Universal Asset Router v2.0 ขจัดความกำกวม',
        },
      },
      {
        '@type': 'Question',
        name: 'AI ของ StockHomeTH ใช้โมเดลอะไรบ้าง?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'รองรับการประมวลผลหลายโมเดล (Multi-Model) ได้แก่ Google Gemini 3.8 Flash, Anthropic Claude 3.5 Sonnet, DeepSeek R1 และ OpenAI GPT-4o',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}
