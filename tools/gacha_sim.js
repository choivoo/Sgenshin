// 뽑기 모의 실행: node tools/gacha_sim.js [횟수]
global.DATA = require('../js/data.js'); const G = require('../js/gacha.js'); const U = require('../js/util.js');
const N = +process.argv[2] || 2000000, D = DATA;
function sim(b, fate) {
  const rnd = U.rng(12345 + b.type.length), st = G.newState(); if (fate) st.fate = fate;
  let c = { 3: 0, 4: 0, 5: 0 }, max5 = 0, max4 = 0, feat = 0, lost = 0, lostThenLost = 0, prevLost = false, fateGot = 0, maxGapFate = 0, gapFate = 0, f4 = 0, since4 = 0, hist = {};
  for (let i = 0; i < N; i++) {
    const r = G.pull(st, b, rnd); c[r.r]++; since4++;
    if (r.r >= 4) { max4 = Math.max(max4, since4); since4 = 0; }
    if (r.r == 5) { max5 = Math.max(max5, r.pity); hist[r.pity] = (hist[r.pity] || 0) + 1; if (r.feat) feat++; if (r.lost) { lost++; if (prevLost) lostThenLost++; } prevLost = !!r.lost;
      if (fate) { gapFate++; if (r.id == fate) { fateGot++; maxGapFate = Math.max(maxGapFate, gapFate); gapFate = 0; } } }
    if (r.r == 4 && r.feat) f4++;
  }
  console.log(`[${b.type}] ${N}회: 5성 ${(c[5] / N * 100).toFixed(3)}% (표기 ${D.GACHA_RULE[b.type].cons5}%), 4성 ${(c[4] / N * 100).toFixed(3)}% (표기 ${D.GACHA_RULE[b.type].cons4}%), 3성 ${(c[3] / N * 100).toFixed(3)}%`);
  console.log(`  5성 최대 천장 ${max5} (한도 ${D.GACHA_RULE[b.type].hard}), 4성 이상 최대 간격 ${max4} (한도 10), 평균 5성 간격 ${(N / c[5]).toFixed(2)}`);
  if (b.type != 'std') console.log(`  5성 중 픽업 ${(feat / c[5] * 100).toFixed(2)}%, 픽뚫 뒤 연속 픽뚫 ${lostThenLost}회(0이어야 함), 4성 중 픽업 ${(f4 / c[4] * 100).toFixed(2)}%`);
  if (fate) console.log(`  지정 무기 획득까지 최대 5성 수 ${maxGapFate} (한도 3), 5성 중 지정 무기 ${(fateGot / c[5] * 100).toFixed(2)}%`);
}
sim({ type: 'char', f5: D.LIMITED[0].f5, f4: D.LIMITED[0].f4 });
sim({ type: 'weapon', f5: D.WBANNER.f5, f4: D.WBANNER.f4 }, 'w_s5x');
sim({ type: 'std' });
