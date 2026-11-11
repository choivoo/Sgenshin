// 헤드리스 구동 도우미: node tools/play.js <script.js> — 스크립트는 (page, shot) 를 받는다
const { chromium, devices } = require('playwright'); const path = require('path');
(async () => {
  const scr = require(path.resolve(process.argv[2])); const vw = +process.env.VW || 1920, vh = +process.env.VH || 1080;
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: vw, height: vh }, deviceScaleFactor: +process.env.DPR || 1, hasTouch: !!process.env.TOUCH });
  const p = await ctx.newPage(); const errs = [];
  p.on('console', m => { if (m.type() == 'error' || process.env.LOG) console.log('LOG', m.text()); }); const seen = {}; p.on('pageerror', e => { errs.push(e.message); if (seen[e.message]) return; seen[e.message] = 1; console.log('ERR', e.message, (e.stack || '').split('\n').slice(1, 3).join(' | ')); });
  await p.goto((process.env.URL || 'http://localhost:8765/index.html') + (process.env.Q || ''));
  await p.waitForFunction('window.__ready', null, { timeout: 60000 });
  const out = process.env.OUT || '/tmp'; const shot = async (n) => { await p.screenshot({ path: path.join(out, n + '.png') }); };
  try { await scr(p, shot); } catch (e) { console.log('SCRIPT ERR', e.message); }
  console.log('errors:', errs.length); await b.close();
})();
