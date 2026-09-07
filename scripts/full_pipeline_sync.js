import { execSync } from 'child_process';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

console.log('🚀 [1/5] Starting Full Pipeline Sync...');

try {
  // Step 1: progressive_live_sync.py
  console.log('📡 [2/5] Fetching live data from Yahoo Finance...');
  execSync('py scripts/progressive_live_sync.py --limit 100', { cwd: rootDir, stdio: 'inherit' });
} catch (e) {
  console.log('⚠️ Python script failed or not found, continuing with existing cache...');
}

try {
  // Step 2: Merge cache into JSON files
  console.log('💾 [3/5] Merging live prices into JSON universes...');
  const cachePath = path.resolve(rootDir, 'market_cache.json');
  if (fs.existsSync(cachePath)) {
    const cacheData = JSON.parse(fs.readFileSync(cachePath, 'utf-8'));
    const cacheMap = {};
    const list = Array.isArray(cacheData) ? cacheData : cacheData.data || [];
    list.forEach(c => {
      if (c.ticker && c.market) cacheMap[`${c.market}-${c.ticker}`] = c;
    });

    const updateJson = (fileName) => {
      const p = path.resolve(rootDir, 'server', 'data', fileName);
      if (fs.existsSync(p)) {
        const json = JSON.parse(fs.readFileSync(p, 'utf-8'));
        const stocks = Array.isArray(json) ? json : json.stocks || [];
        let updated = 0;
        stocks.forEach(s => {
          const m = fileName.includes('thai') ? 'SET' : 'US';
          const t = s.ticker || (s.symbol ? s.symbol.replace('.BK', '') : '');
          const c = cacheMap[`${m}-${t}`];
          if (c) {
            s.price = c.price;
            s.change = c.change;
            s.marketCap = c.marketCap;
            s.peRatio = c.peRatio;
            s.dividendYield = c.dividendYield;
            updated++;
          }
        });
        fs.writeFileSync(p, JSON.stringify(json, null, 2));
        console.log(`   - Updated ${updated} stocks in ${fileName}`);
      }
    };
    
    updateJson('thai_stocks.json');
    updateJson('us_stocks.json');
  }
} catch (e) {
  console.error('❌ Failed to update JSON files:', e.message);
}

try {
  // Step 3: Seed Supabase
  console.log('☁️ [4/5] Pushing latest data to Supabase...');
  execSync('node scripts/seed_supabase_stocks.js', { cwd: rootDir, stdio: 'inherit' });
} catch (e) {
  console.error('❌ Failed to seed Supabase:', e.message);
}

try {
  // Step 4: Git Commit & Push
  console.log('🐙 [5/5] Committing to Github for Vercel deployment...');
  execSync('git add server/data/thai_stocks.json server/data/us_stocks.json', { cwd: rootDir, stdio: 'inherit' });
  
  const status = execSync('git status --porcelain', { cwd: rootDir }).toString();
  if (status.includes('server/data/')) {
    execSync('git commit -m "Auto-sync: Update universe json files from local pipeline"', { cwd: rootDir, stdio: 'inherit' });
    execSync('git push origin main', { cwd: rootDir, stdio: 'inherit' });
    console.log('✅ Changes pushed to Github successfully! Vercel will rebuild.');
  } else {
    console.log('✅ No price changes detected, skipping git push.');
  }
} catch (e) {
  console.error('❌ Failed to push to Github:', e.message);
}

console.log('🎉 Full Pipeline Sync Complete!');
