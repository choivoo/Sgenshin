// 저장 상태와 성장 규칙
var ST = (function () {
  var D = DATA, KEY = 'dotria_save_v1', S = null, T = { onToast: function () { }, temp: {}, noSave: false, ver: 0 };
  function fresh() {
    var s = { v: 1, created: Date.now(), ar: 1, arxp: 0, inv: { coin: 5000, gem: 800, f_apple: 3, xp1: 6 }, chars: {}, weapons: {}, arts: {}, uid: 1, party: ['lio'], partyB: [], active: 0,
      gacha: { char: GACHA.newState(), weapon: GACHA.newState(), std: GACHA.newState(), hist: [] }, dew: { n: 160, t: Date.now() }, pos: null, clock: 9, q: { main: { s: 0 } }, opened: {}, orbs: {}, offered: [0, 0, 0], statues: {}, wps: { wp_town: 1 }, pins: [], camps: {},
      daily: null, stat: {}, achDone: {}, tower: {}, exped: [], shop: {}, taken: {}, weekly: 0, bossT: {}, food: null, codex: {}, flags: {}, puz: {}, set: { bgm: .6, sfx: .8 }, stam: 100 };
    S = s; addChar('lio'); return s;
  }
  function save() { if (T.noSave || !S) return; try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } }
  function load() { try { var t = localStorage.getItem(KEY); if (t) { S = JSON.parse(t); migrate(); T.S = S; return true; } } catch (e) { } return false; }
  function migrate() { var f = (function () { var keep = S; fresh(); var d = S; S = keep; return d; })(); for (var k in f) if (S[k] == null) S[k] = f[k]; }
  function exportS() { return btoa(unescape(encodeURIComponent(JSON.stringify(S)))); }
  function importS(txt) { var o = JSON.parse(decodeURIComponent(escape(atob(txt.trim())))); if (!o || !o.chars || !o.gacha) throw new Error('bad'); S = o; migrate(); T.S = S; save(); }
  // ── 가방 ──
  function cnt(id) { return S.inv[id] || 0; }
  function add(id, n) { if (D.WP[id]) { for (var i = 0; i < n; i++) addWeapon(id); return; } S.inv[id] = (S.inv[id] || 0) + n; if (S.inv[id] <= 0) delete S.inv[id]; T.ver++; }
  function can(o) { for (var k in o) if (cnt(k) < o[k]) return false; return true; }
  function take(o) { if (!can(o)) return false; for (var k in o) add(k, -o[k]); return true; }
  function reward(o, mult) { var out = []; for (var k in o) { var n = Math.round(o[k] * (mult || 1)); if (k == 'arxp') { addAR(n); out.push(['arxp', n]); } else if (k == 'art') { for (var i = 0; i < n; i++) out.push(['art', genArt(o.artSet ? U.pick(o.artSet) : U.pick(Object.keys(D.SETS)), o.artR || 3)]); } else if (k == 'artSet' || k == 'artR') { } else { add(k, n); out.push([k, n]); } } return out; }
  function addAR(n) { S.arxp += n; var up = false; while (S.ar < 60 && S.arxp >= D.arXp(S.ar)) { S.arxp -= D.arXp(S.ar); S.ar++; up = true; add('tk_l', 1); add('gem', 50); } if (up) { T.onToast('모험 등급 ' + S.ar + ' 달성! (인연의 별등 +1, 별조각 +50)', 'ar'); setStat('ar', S.ar); } }
  function WL() { var w = 0; D.WL_AR.forEach(function (a) { if (S.ar >= a) w++; }); return w; }
  // ── 캐릭터/무기 ──
  function addWeapon(id) { var u = 'w' + (S.uid++); S.weapons[u] = { id: id, lv: 1, xp: 0, asc: 0, ref: 1 }; S.codex[id] = 1; T.ver++; return u; }
  function addChar(id) {
    var c = S.chars[id];
    if (c) { if (c.aw < 6) { c.aw++; T.ver++; return { dup: true, aw: c.aw }; } return { dup: true, aw: 6, over: true }; }
    var d = D.CH[id], wid = D.WEAPONS.filter(function (w) { return w.type == d.wt && w.r == 3; })[0].id;
    S.chars[id] = { lv: 1, xp: 0, asc: 0, aw: 0, tal: [1, 1, 1], w: addWeapon(wid), art: {}, hp: 1, en: 0 }; S.codex[id] = 1; T.ver++;
    if (S.party.length < 4 && S.party.indexOf(id) < 0) S.party.push(id);
    return { dup: false };
  }
  function equipped(uid) { for (var k in S.chars) if (S.chars[k].w == uid) return k; return null; }
  function artOwner(uid) { for (var k in S.chars) for (var s in S.chars[k].art) if (S.chars[k].art[s] == uid) return k; return null; }
  function equipW(cid, uid) { var o = equipped(uid), c = S.chars[cid]; if (D.WP[S.weapons[uid].id].type != D.CH[cid].wt) return '무기 종류가 맞지 않습니다'; if (o && o != cid) S.chars[o].w = c.w; c.w = uid; T.ver++; }
  function equipA(cid, uid) { var a = S.arts[uid], o = artOwner(uid), c = S.chars[cid]; if (o && o != cid) { if (c.art[a.slot]) S.chars[o].art[a.slot] = c.art[a.slot]; else delete S.chars[o].art[a.slot]; } c.art[a.slot] = uid; T.ver++; }
  function unequipA(cid, slot) { delete S.chars[cid].art[slot]; T.ver++; }
  // ── 장신구 ──
  var RF = { 3: .6, 4: .8, 5: 1 };
  function mainVal(a) { var mx = a.main.indexOf('d_') == 0 ? D.MAINMAX.d_ : D.MAINMAX[a.main]; return mx * (.15 + .85 * a.lv / 20) * RF[a.r] * (20 / (a.r * 4)) * (a.r * 4 / 20) + 0; }
  function rollSub(a) { var keys = Object.keys(D.SUBS).filter(function (k) { return k != a.main; }); if (a.subs.length < 4) { var have = a.subs.map(function (s) { return s[0]; }), k = U.pick(keys.filter(function (x) { return have.indexOf(x) < 0; })), r = D.SUBS[k]; a.subs.push([k, +(U.lerp(r[0], r[1], Math.random()) * RF[a.r]).toFixed(1)]); return a.subs.length - 1; } var i = Math.floor(Math.random() * 4), r2 = D.SUBS[a.subs[i][0]]; a.subs[i][1] = +(a.subs[i][1] + U.lerp(r2[0], r2[1], Math.random()) * RF[a.r]).toFixed(1); return i; }
  function genArt(set, r, slot) { var sl = slot ? D.SLOTS.filter(function (s) { return s.id == slot; })[0] : U.pick(D.SLOTS), a = { set: set, slot: sl.id, r: r, lv: 0, main: U.pick(sl.main), subs: [] }, n = r - 2 + (Math.random() < .3 ? 1 : 0); for (var i = 0; i < Math.min(4, n); i++) rollSub(a); var u = 'a' + (S.uid++); S.arts[u] = a; T.ver++; return u; }
  function artEnhance(uid) { var a = S.arts[uid]; if (a.lv >= a.r * 4) return '최대 레벨입니다'; var cost = { coin: 300 * (a.lv + 1), polish: 1 }; if (!take(cost)) return '루멘 또는 연마 가루가 부족합니다'; a.lv++; var r = null; if (a.lv % 4 == 0) r = rollSub(a); if (a.lv == 20) bump('enh20', 1); T.ver++; return { ok: 1, sub: r }; }
  function artSell(uid) { if (artOwner(uid)) return '장착 중입니다'; var a = S.arts[uid]; delete S.arts[uid]; add('polish', a.r - 2 + Math.floor(a.lv / 4)); add('coin', a.r * 200); T.ver++; }
  // ── 능력치 ──
  function lvMul(lv, asc) { return 1 + (lv - 1) * .09 + asc * .35; }
  function wAtk(w) { var d = D.WP[w.id]; return d.atk * (1 + (w.lv - 1) * .11 + w.asc * .4); }
  function reso(party) { var c = {}, out = []; party.forEach(function (id) { var e = D.CH[id].el; c[e] = (c[e] || 0) + 1; }); for (var e in c) if (c[e] >= 2 && party.length >= 2) out.push(e); return out; }
  function stats(cid, extra) {
    var c = D.CH[cid], s = S.chars[cid], m = {}, lm = lvMul(s.lv, s.asc);
    function am(o, f) { for (var k in o) m[k] = (m[k] || 0) + o[k] * (f || 1); }
    var o1 = {}; o1[c.asc[0]] = c.asc[1] * s.asc / 6; am(o1); am(c.pas.m);
    for (var i = 0; i < s.aw; i++) am(c.aw[i].m);
    var w = S.weapons[s.w], wd = D.WP[w.id], o2 = {}; o2[wd.sub[0]] = wd.sub[1] * (1 + (w.lv - 1) * .035); am(o2);
    wd.eff.k.forEach(function (k, i) { var o = {}; o[k] = wd.eff.v[i][w.ref - 1]; am(o); });
    var sets = {};
    for (var sl in s.art) { var a = S.arts[s.art[sl]]; if (!a) continue; var o3 = {}; o3[a.main] = mainVal(a); am(o3); a.subs.forEach(function (x) { var o = {}; o[x[0]] = x[1]; am(o); }); sets[a.set] = (sets[a.set] || 0) + 1; }
    for (var st in sets) { if (sets[st] >= 2) am(D.SETS[st].b2); if (sets[st] >= 4) am(D.SETS[st].b4); }
    var party = T.party || S.party; if (party.indexOf(cid) >= 0) { reso(party).forEach(function (e) { am(D.RESO[e][2]); }); party.forEach(function (o) { if (o != cid && S.chars[o]) for (var i = 0; i < S.chars[o].aw; i++) if (D.CH[o].aw[i].m.dmg) m.dmg = (m.dmg || 0) + D.CH[o].aw[i].m.dmg; }); }
    if (S.food && S.food.until > Date.now()) am(S.food.m);
    if (T.temp.mods) am(T.temp.mods);
    if (extra) extra.forEach(function (e) { am(e); });
    var r = { m: m, lv: s.lv, el: c.el };
    r.baseAtk = c.base[1] * lm + wAtk(w);
    r.hp = c.base[0] * lm * (1 + (m.hpP || 0) / 100) + (m.hp || 0); r.atk = r.baseAtk * (1 + (m.atkP || 0) / 100) + (m.atk || 0); r.def = c.base[2] * lm * (1 + (m.defP || 0) / 100) + (m.def || 0);
    r.cr = Math.min(100, 5 + (m.cr || 0)); r.cd = 50 + (m.cd || 0); r.em = m.em || 0; r.er = 100 + (m.er || 0); r.heal = m.heal || 0;
    r.tal = [s.tal[0] + (m.naLv || 0), s.tal[1] + (m.skillLv || 0), s.tal[2] + (m.burstLv || 0)];
    r.sets = sets; return r;
  }
  function talMul(l) { return 1 + .09 * (l - 1); }
  // ── 성장 ──
  function capOf(asc) { return D.ASC_CAP[asc]; }
  function charXp(cid, item, n) { var s = S.chars[cid], cap = capOf(s.asc); if (s.lv >= cap) return '레벨 상한입니다. 돌파가 필요합니다'; n = Math.min(n, cnt(item)); if (n <= 0) return '재료가 부족합니다'; var used = 0; for (var i = 0; i < n && s.lv < cap; i++) { var xp = D.ITEMS[item].xp; if (cnt('coin') < xp / 10) return used ? null : '루멘이 부족합니다'; add('coin', -Math.floor(xp / 10)); add(item, -1); used++; s.xp += xp; while (s.lv < cap && s.xp >= D.charXp(s.lv)) { s.xp -= D.charXp(s.lv); s.lv++; } if (s.lv >= cap) s.xp = 0; } T.ver++; }
  function ascCost(cid) { var c = D.CH[cid], a = S.chars[cid].asc, o = { coin: [2000, 4000, 6000, 8000, 10000, 12000][a] }; o[c.spec] = [3, 6, 10, 15, 20, 25][a]; var b = [0, 1, 2, 3, 4, 6][a]; if (b) o[c.boss] = b; o[c.fam + (a < 2 ? 1 : a < 4 ? 2 : 3)] = [3, 8, 6, 10, 6, 10][a]; return o; }
  function charAsc(cid) { var s = S.chars[cid]; if (s.asc >= 6) return '최대 돌파입니다'; if (s.lv < capOf(s.asc)) return '레벨 ' + capOf(s.asc) + ' 필요'; if (!take(ascCost(cid))) return '재료가 부족합니다'; s.asc++; if (s.asc % 2 == 1) add('gem', 60); T.ver++; }
  function talCap(asc) { return [1, 2, 3, 4, 6, 8, 10][asc]; }
  function talCost(cid, i) { var c = D.CH[cid], l = S.chars[cid].tal[i], o = { coin: 1500 * l }; o[c.tb + (l < 3 ? 1 : l < 6 ? 2 : 3)] = l < 3 ? 3 : l < 6 ? l : l - 3; o[c.fam + (l < 3 ? 1 : l < 6 ? 2 : 3)] = 2 + (l >> 1); if (l >= 6) o.w_storm = 1; return o; }
  function talUp(cid, i) { var s = S.chars[cid]; if (s.tal[i] >= 10) return '최대 레벨입니다'; if (s.tal[i] >= talCap(s.asc)) return '캐릭터 돌파가 더 필요합니다'; if (!take(talCost(cid, i))) return '재료가 부족합니다'; s.tal[i]++; T.ver++; }
  function wCap(w) { return Math.min(D.WP[w.id].r == 3 ? 70 : 90, capOf(w.asc)); }
  function wpnXp(uid, item, n) { var w = S.weapons[uid], cap = wCap(w), r = D.WP[w.id].r; if (w.lv >= cap) return '레벨 상한입니다'; n = Math.min(n, cnt(item)); if (n <= 0) return '광석이 부족합니다'; for (var i = 0; i < n && w.lv < cap; i++) { add(item, -1); w.xp += D.ITEMS[item].wxp; while (w.lv < cap && w.xp >= D.wpnXp(w.lv, r)) { w.xp -= D.wpnXp(w.lv, r); w.lv++; } if (w.lv >= cap) w.xp = 0; } T.ver++; }
  function wFam(id) { return 'wm_' + 'abc'[(id.charCodeAt(2) + id.charCodeAt(4)) % 3]; }
  function wAscCost(uid) { var w = S.weapons[uid], a = w.asc, o = { coin: [1000, 3000, 5000, 7000, 9000, 11000][a] }; o[wFam(w.id) + (a < 2 ? 1 : a < 4 ? 2 : 3)] = [2, 4, 3, 5, 3, 5][a]; o[['jelly', 'horn', 'fang'][w.id.charCodeAt(3) % 3] + (a < 2 ? 1 : a < 4 ? 2 : 3)] = [3, 6, 4, 8, 4, 8][a]; return o; }
  function wpnAsc(uid) { var w = S.weapons[uid]; if (w.asc >= 6 || capOf(w.asc) >= (D.WP[w.id].r == 3 ? 70 : 90)) return '최대 돌파입니다'; if (w.lv < capOf(w.asc)) return '레벨 ' + capOf(w.asc) + ' 필요'; if (!take(wAscCost(uid))) return '재료가 부족합니다'; w.asc++; T.ver++; }
  function wpnRefine(uid) { var w = S.weapons[uid]; if (w.ref >= 5) return '재련 최대입니다'; var f = null; for (var k in S.weapons) if (k != uid && S.weapons[k].id == w.id && !equipped(k)) { if (!f || S.weapons[k].lv < S.weapons[f].lv) f = k; } if (!f) return '같은 무기가 필요합니다'; if (!take({ coin: 500 * w.ref })) return '루멘이 부족합니다'; w.ref = Math.min(5, w.ref + S.weapons[f].ref); delete S.weapons[f]; T.ver++; }
  function wpnSell(uid) { if (equipped(uid)) return '장착 중입니다'; var w = S.weapons[uid], r = D.WP[w.id].r; delete S.weapons[uid]; add(r >= 4 ? 'ore3' : 'ore2', r >= 4 ? 2 : 1); T.ver++; }
  // ── 행동력 ──
  function dew() { var d = S.dew, now = Date.now(); if (d.n >= D.DEW_MAX) { d.t = now; return d.n; } var g = Math.floor((now - d.t) / D.DEW_MS); if (g > 0) { d.n = Math.min(D.DEW_MAX, d.n + g); d.t += g * D.DEW_MS; if (d.n >= D.DEW_MAX) d.t = now; } return d.n; }
  function useDew(n) { if (dew() < n) return false; if (S.dew.n >= D.DEW_MAX) S.dew.t = Date.now(); S.dew.n -= n; return true; }
  // ── 통계/일일/업적 ──
  function daily() { var k = U.dayKey(); if (!S.daily || S.daily.day != k) { var r = U.rng(k), pool = D.DAILY.slice(), t = []; for (var i = 0; i < 4; i++) { var p = pool.splice(Math.floor(r() * pool.length), 1)[0]; t.push({ k: p[0], n: p[2], txt: p[1], p: 0, got: false }); } S.daily = { day: k, tasks: t, bonus: false }; } return S.daily; }
  function setStat(k, v) { if ((S.stat[k] || 0) < v) { S.stat[k] = v; checkAch(); } }
  function bump(k, n) { n = n == null ? 1 : n; S.stat[k] = (S.stat[k] || 0) + n; var d = daily(); d.tasks.forEach(function (t) { if (t.k == k && t.p < t.n) { t.p = Math.min(t.n, t.p + n); if (t.p >= t.n) T.onToast('일일 과제 완료: ' + t.txt, 'daily'); } }); checkAch(); }
  function checkAch() { D.ACH.forEach(function (a) { if (!S.achDone[a[0]] && (S.stat[a[2]] || 0) >= a[3]) { S.achDone[a[0]] = 1; T.onToast('업적 달성: ' + a[1], 'ach'); } }); }
  function claimAch(id) { if (S.achDone[id] != 1) return; S.achDone[id] = 2; var a = D.ACH.filter(function (x) { return x[0] == id; })[0]; add('gem', a[4]); return a[4]; }
  function claimDaily(i) { var d = daily(); if (i == 'bonus') { if (d.bonus || d.tasks.some(function (t) { return !t.got; })) return null; d.bonus = true; return reward({ gem: 40, arxp: 200, coin: 5000, xp2: 2 }); } var t = d.tasks[i]; if (t.got || t.p < t.n) return null; t.got = true; return reward({ gem: 15, arxp: 120, coin: 2000 }); }
  // ── 뽑기 ──
  function banners() { var per = D.BANNER_DAYS * 864e5, idx = Math.floor(Date.now() / per), lb = D.LIMITED[idx % D.LIMITED.length], end = (idx + 1) * per; return [{ key: 'char', type: 'char', def: lb, f5: lb.f5, f4: lb.f4, end: end, tk: 'tk_l' }, { key: 'weapon', type: 'weapon', def: D.WBANNER, f5: D.WBANNER.f5, f4: D.WBANNER.f4, end: end, tk: 'tk_l' }, { key: 'std', type: 'std', def: D.SBANNER, f5: [], f4: [], tk: 'tk_s' }]; }
  function pullCost(b, n) { var have = cnt(b.tk), need = Math.max(0, n - have); return { tk: Math.min(n, have), gem: need * 160, ok: cnt('gem') >= need * 160 }; }
  function pull(key, n, rnd) {
    var b = banners().filter(function (x) { return x.key == key; })[0], c = pullCost(b, n); if (!c.ok) return null;
    add(b.tk, -c.tk); add('gem', -c.gem); var st = S.gacha[key], out = [];
    for (var i = 0; i < n; i++) {
      var r = GACHA.pull(st, b, rnd); r.b = key;
      if (r.k == 'c') { var a = addChar(r.id); r.isNew = !a.dup; r.aw = a.aw; if (a.dup) { r.gl = r.r == 5 ? (a.over ? 25 : 10) : (a.over ? 5 : 2); add('glitter', r.gl); } }
      else { r.uid = addWeapon(r.id); if (r.r == 3) { r.du = 15; add('dust', 15); } else { r.gl = r.r == 5 ? 10 : 2; add('glitter', r.gl); } }
      S.gacha.hist.unshift({ t: Date.now(), b: key, id: r.id, r: r.r, p: r.pity }); if (r.r == 5) bump('star5', 1); out.push(r);
    }
    if (S.gacha.hist.length > 600) S.gacha.hist.length = 600; bump('pulls', n); save(); return out;
  }
  // ── 파견 ──
  function expedStart(ex, cid, hours) { if (S.exped.length >= 3) return '파견 슬롯이 가득 찼습니다'; if (S.exped.some(function (e) { return e.c == cid; })) return '이미 파견 중입니다'; if (S.party.indexOf(cid) >= 0) return '파티 편성 중인 캐릭터입니다'; S.exped.push({ ex: ex, c: cid, h: hours, t: Date.now() }); }
  function expedClaim(i) { var e = S.exped[i]; if (!e || Date.now() < e.t + e.h * 36e5) return null; S.exped.splice(i, 1); var d = D.EXPED.filter(function (x) { return x.id == e.ex; })[0]; return reward(d.rw, e.h / 4 + .75); }
  function shopBuy(shop, i) { var sh = D.SHOP[shop], it = sh.items[i], mk = shop + i + '_' + Math.floor(Date.now() / (30 * 864e5)), b = S.shop[mk] || 0; if (b >= it[2]) return '품절입니다'; var c = {}; c[sh.cur] = it[1]; if (!take(c)) return D.ITEMS[sh.cur].n + '이(가) 부족합니다'; S.shop[mk] = b + 1; add(it[0], 1); }
  function shopLeft(shop, i) { var mk = shop + i + '_' + Math.floor(Date.now() / (30 * 864e5)); return D.SHOP[shop].items[i][2] - (S.shop[mk] || 0); }
  T.fresh = function () { fresh(); T.S = S; return S; };
  Object.assign(T, { save: save, load: load, exportS: exportS, importS: importS, cnt: cnt, add: add, can: can, take: take, reward: reward, addAR: addAR, WL: WL, addWeapon: addWeapon, addChar: addChar, equipped: equipped, artOwner: artOwner, equipW: equipW, equipA: equipA, unequipA: unequipA, mainVal: mainVal, genArt: genArt, artEnhance: artEnhance, artSell: artSell, stats: stats, talMul: talMul, reso: reso, wAtk: wAtk, capOf: capOf, charXp: charXp, ascCost: ascCost, charAsc: charAsc, talCap: talCap, talCost: talCost, talUp: talUp, wCap: wCap, wpnXp: wpnXp, wAscCost: wAscCost, wpnAsc: wpnAsc, wpnRefine: wpnRefine, wpnSell: wpnSell, dew: dew, useDew: useDew, daily: daily, bump: bump, setStat: setStat, claimAch: claimAch, claimDaily: claimDaily, banners: banners, pullCost: pullCost, pull: pull, expedStart: expedStart, expedClaim: expedClaim, shopBuy: shopBuy, shopLeft: shopLeft, clear: function () { localStorage.removeItem(KEY); } });
  Object.defineProperty(T, 'S', { get: function () { return S; }, set: function (v) { S = v; } });
  return T;
})();
