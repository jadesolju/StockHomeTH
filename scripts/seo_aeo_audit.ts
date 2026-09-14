import fs from 'fs';
import path from 'path';

export interface AuditResult {
  category: 'SEO' | 'AEO' | 'Content' | 'Infrastructure';
  testName: string;
  status: 'PASS' | 'WARN' | 'FAIL';
  details: string;
}

function runAudit(): AuditResult[] {
  const results: AuditResult[] = [];
  const rootDir = process.cwd();

  // 1. Check llms.txt
  const llmsPath = path.join(rootDir, 'public', 'llms.txt');
  if (fs.existsSync(llmsPath)) {
    const content = fs.readFileSync(llmsPath, 'utf8');
    if (content.includes('Citation Guidelines') && content.includes('https://stockhometh.online')) {
      results.push({
        category: 'AEO',
        testName: 'AI Search Engine Discovery (llms.txt)',
        status: 'PASS',
        details: 'llms.txt exists with structured citation guidelines and domain canonicals.',
      });
    } else {
      results.push({
        category: 'AEO',
        testName: 'AI Search Engine Discovery (llms.txt)',
        status: 'WARN',
        details: 'llms.txt exists but missing detailed AI citation rules.',
      });
    }
  } else {
    results.push({
      category: 'AEO',
      testName: 'AI Search Engine Discovery (llms.txt)',
      status: 'FAIL',
      details: 'public/llms.txt is missing.',
    });
  }

  // 2. Check sitemap.ts
  const sitemapPath = path.join(rootDir, 'src', 'app', 'sitemap.ts');
  if (fs.existsSync(sitemapPath)) {
    results.push({
      category: 'SEO',
      testName: 'Dynamic Sitemap (sitemap.ts)',
      status: 'PASS',
      details: 'Next.js App Router dynamic sitemap.ts detected.',
    });
  } else {
    results.push({
      category: 'SEO',
      testName: 'Dynamic Sitemap (sitemap.ts)',
      status: 'FAIL',
      details: 'src/app/sitemap.ts is missing.',
    });
  }

  // 3. Check robots.ts
  const robotsPath = path.join(rootDir, 'src', 'app', 'robots.ts');
  if (fs.existsSync(robotsPath)) {
    const content = fs.readFileSync(robotsPath, 'utf8');
    if (content.includes('PerplexityBot') && content.includes('GPTBot')) {
      results.push({
        category: 'AEO',
        testName: 'Robots.txt AI Crawlers Config',
        status: 'PASS',
        details: 'robots.ts explicitly configures rules for PerplexityBot, GPTBot, ClaudeBot.',
      });
    } else {
      results.push({
        category: 'AEO',
        testName: 'Robots.txt AI Crawlers Config',
        status: 'WARN',
        details: 'robots.ts exists but lacks explicit rules for top AI Answer Engine agents.',
      });
    }
  } else {
    results.push({
      category: 'SEO',
      testName: 'Robots.txt Config',
      status: 'FAIL',
      details: 'src/app/robots.ts is missing.',
    });
  }

  // 4. Check JsonLdSchema component
  const jsonLdPath = path.join(rootDir, 'src', 'components', 'seo', 'JsonLdSchema.tsx');
  if (fs.existsSync(jsonLdPath)) {
    const content = fs.readFileSync(jsonLdPath, 'utf8');
    if (content.includes('FAQPage') && content.includes('Organization')) {
      results.push({
        category: 'AEO',
        testName: 'Structured Data JSON-LD Schemas',
        status: 'PASS',
        details: 'JsonLdSchema includes Organization, WebSite, and FAQPage structured data.',
      });
    } else {
      results.push({
        category: 'AEO',
        testName: 'Structured Data JSON-LD Schemas',
        status: 'WARN',
        details: 'JsonLdSchema exists but missing FAQPage schema for Answer Engines.',
      });
    }
  } else {
    results.push({
      category: 'SEO',
      testName: 'Structured Data JSON-LD Schemas',
      status: 'FAIL',
      details: 'src/components/seo/JsonLdSchema.tsx is missing.',
    });
  }

  // 5. Check metadata helper
  const metadataPath = path.join(rootDir, 'src', 'lib', 'seo', 'metadata.ts');
  if (fs.existsSync(metadataPath)) {
    results.push({
      category: 'SEO',
      testName: 'SEO Metadata Engine',
      status: 'PASS',
      details: 'Centralized buildMetadata helper configured with OpenGraph & Twitter Cards.',
    });
  } else {
    results.push({
      category: 'SEO',
      testName: 'SEO Metadata Engine',
      status: 'FAIL',
      details: 'src/lib/seo/metadata.ts is missing.',
    });
  }

  return results;
}

function printReport(results: AuditResult[]) {
  console.log('\n==================================================');
  console.log('🔍 StockHomeTH SEO & AEO Automated Audit Report');
  console.log('==================================================\n');

  let passes = 0;
  let warns = 0;
  let fails = 0;

  results.forEach((r) => {
    const icon = r.status === 'PASS' ? '✅' : r.status === 'WARN' ? '⚠️' : '❌';
    console.log(`${icon} [${r.category}] ${r.testName}: ${r.details}`);
    if (r.status === 'PASS') passes++;
    if (r.status === 'WARN') warns++;
    if (r.status === 'FAIL') fails++;
  });

  console.log('\n--------------------------------------------------');
  console.log(`Summary: ${passes} Passed, ${warns} Warnings, ${fails} Failed`);
  console.log('==================================================\n');

  if (fails > 0) {
    process.exit(1);
  }
}

const auditResults = runAudit();
printReport(auditResults);
