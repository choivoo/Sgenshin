const { chromium } = require('playwright');
(async () => { const [url, out, w, h] = process.argv.slice(2); const b = await chromium.launch({args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']}); const p = await b.newPage({ viewport: { width: +w || 1920, height: +h || 1080 } });
p.on('console', m => console.log('LOG', m.text())); p.on('pageerror', e => console.log('ERR', e.message));
await p.goto(url); await p.waitForTimeout(1500); console.log(await p.title()); await p.screenshot({ path: out }); await b.close(); })();
