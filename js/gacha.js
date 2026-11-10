// 뽑기 로직 (브라우저/노드 공용, 순수 함수)
var GACHA = (function () {
  var D = (typeof DATA !== 'undefined') ? DATA : require('./data.js');
  function newState() { return { p5: 0, p4: 0, g5: false, g4: false, fate: null, fp: 0, n: 0 }; }
  function p5at(rule, n) { return n <= rule.soft ? rule.base5 : Math.min(1, rule.base5 + rule.inc * (n - rule.soft)); }
  function p4at(rule, n) { var k = 10 - rule.p4.length; return n <= k ? rule.base4 : rule.p4[Math.min(rule.p4.length - 1, n - k - 1)]; }
  function pick(a, rnd) { return a[Math.floor(rnd() * a.length)]; }
  // banner: {type:'char'|'weapon'|'std', f5:[], f4:[]}
  function pull(st, banner, rnd) {
    rnd = rnd || Math.random;
    var rule = D.GACHA_RULE[banner.type], P = D.POOL;
    st.p5++; st.p4++; st.n++;
    var r = rnd(), a = p5at(rule, st.p5), b = p4at(rule, st.p4), res = { pity: st.p5 };
    if (r < a) {
      res.r = 5; st.p5 = 0; // 4성 카운터는 유지
      if (banner.type == 'std') { if (rnd() < .5) { res.id = pick(P.std5c, rnd); res.k = 'c'; } else { res.id = pick(P.std5w, rnd); res.k = 'w'; } }
      else if (banner.type == 'char') {
        res.k = 'c';
        if (st.g5 || rnd() < rule.feat5) { res.id = pick(banner.f5, rnd); res.feat = true; res.guar = st.g5; st.g5 = false; }
        else { res.id = pick(P.std5c, rnd); st.g5 = true; res.lost = true; }
      } else {
        res.k = 'w';
        if (st.fate && st.fp >= rule.fateMax) { res.id = st.fate; res.feat = true; res.fateHit = true; }
        else if (st.g5 || rnd() < rule.feat5) { res.id = pick(banner.f5, rnd); res.feat = true; st.g5 = false; }
        else { res.id = pick(P.std5w, rnd); st.g5 = true; res.lost = true; }
        if (st.fate) { if (res.id == st.fate) st.fp = 0; else st.fp++; }
      }
    } else if (r < a + b) {
      res.r = 4; res.pity = st.p4; st.p4 = 0;
      if (banner.type == 'std') { if (rnd() < .5) { res.id = pick(P.all4c, rnd); res.k = 'c'; } else { res.id = pick(P.all4w, rnd); res.k = 'w'; } }
      else if (st.g4 || rnd() < rule.feat4) { res.id = pick(banner.f4, rnd); res.k = banner.type == 'char' ? 'c' : 'w'; res.feat = true; st.g4 = false; }
      else {
        st.g4 = true;
        var cs = P.all4c.filter(function (x) { return banner.f4.indexOf(x) < 0; }), ws = P.all4w.filter(function (x) { return banner.f4.indexOf(x) < 0; });
        if (rnd() < .5) { res.id = pick(cs, rnd); res.k = 'c'; } else { res.id = pick(ws, rnd); res.k = 'w'; }
      }
    } else { res.r = 3; res.k = 'w'; res.id = pick(P.all3w, rnd); }
    return res;
  }
  return { newState: newState, pull: pull, p5at: p5at, p4at: p4at };
})();
if (typeof module !== 'undefined') module.exports = GACHA;
