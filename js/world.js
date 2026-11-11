// 세계 생성: 높이맵 + 슬래브(동굴 천장/다리) + 액체 + 오브젝트 배치 (결정적)
var WORLD = (function () {
  var N = 256, CS = 2, W = { N: N, CS: CS };
  var h, top, side, under, sb, st, stile, wl, wt, reg;
  var TOWN = { i: 128, j: 178 }, ALTAR = { i: 128, j: 30 }, ARENA = { i: 20, j: 20 };
  function sstep(a, b, x) { var t = U.clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); }
  var RIVER = [[86, 96], [94, 118], [100, 140], [106, 160], [107, 180], [112, 200], [118, 222], [122, 250]];
  function riverDist(i, j) { var best = 1e9; for (var k = 0; k < RIVER.length - 1; k++) { var a = RIVER[k], b = RIVER[k + 1], dx = b[0] - a[0], dy = b[1] - a[1], t = U.clamp(((i - a[0]) * dx + (j - a[1]) * dy) / (dx * dx + dy * dy), 0, 1), d = Math.hypot(i - a[0] - dx * t, j - a[1] - dy * t); if (d < best) best = d; } return best; }
  function gen() {
    var n2 = U.noise2, fbm = U.fbm, A = N * N;
    h = W.h = new Int16Array(A); top = W.top = new Uint8Array(A); side = W.side = new Uint8Array(A); under = W.under = new Uint8Array(A);
    sb = W.sb = new Int16Array(A); st = W.st = new Int16Array(A); stile = W.stile = new Uint8Array(A); W.sside = new Uint8Array(A); wl = W.wl = new Int16Array(A).fill(-999); wt = W.wt = new Uint8Array(A); reg = W.reg = new Uint8Array(A);
    var i, j, id;
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      id = j * N + i;
      var dx = (i - 128) / 128, dz = (j - 128) / 128, rr = Math.hypot(dx, dz) + (fbm(i / 40, j / 40, 0) - .5) * .3, land = U.clamp((.8 - rr) * 6, -1, 1);
      var bx = i + (n2(i / 20, j / 20, 11) - .5) * 18, bj = j + (n2(i / 20, j / 20, 12) - .5) * 18;
      var north = sstep(118, 104, bj), west = sstep(134, 122, bx), wS = north * west, wC = north * (1 - west), wM = 1 - north;
      reg[id] = wM >= wS && wM >= wC ? 0 : wC >= wS ? 1 : 2;
      if (land <= 0) { h[id] = Math.round(-5 + land * 5); continue; }
      var m = 6 + fbm(i / 30, j / 30, 1) * 13 + (n2(i / 16, j / 16, 7) > .66 ? 8 : 0);
      var c = Math.floor(fbm(i / 26, j / 26, 2) * 5.5) * 7 + 5 + n2(i / 5, j / 5, 4) * 2; if (n2(i / 13, j / 13, 9) < .3) c = 3;
      var pk = Math.hypot(i - 58, j - 50), s = 9 + fbm(i / 34, j / 34, 3) * 26 + 52 * Math.exp(-pk * pk / 800);
      var v = m * wM + c * wC + s * wS;
      // 초원-협곡 경계 능선
      var rid = (1 - Math.abs(north - .5) * 2) * (1 - west); if (rid > 0) v += rid * 26;
      v = Math.min(v, 1 + land * 34);
      h[id] = Math.max(1, Math.round(v));
    }
    function flat(ci, cj, r, hh, bl) { for (var j = ci * 0 + cj - r - bl; j <= cj + r + bl; j++) for (var i = ci - r - bl; i <= ci + r + bl; i++) { if (i < 0 || j < 0 || i >= N || j >= N) continue; var d = Math.hypot(i - ci, j - cj), id = j * N + i; if (d <= r) h[id] = hh; else if (d < r + bl) { var t = (d - r) / bl; h[id] = Math.round(hh * (1 - t) + h[id] * t); } } }
    // 강
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) { var d = riverDist(i, j); if (d < 9 && h[j * N + i] > -3) { id = j * N + i; var t = sstep(2.2, 9, d); h[id] = Math.round(-4 * (1 - t) + Math.min(h[id], 12) * t); } }
    // 설원 호수(얼음)
    flat(86, 92, 9, 2, 6);
    // 마을
    flat(TOWN.i, TOWN.j, 15, 8, 8);
    // 보스 무대
    W.bossPos = { b_root: [182, 196], b_magma: [206, 78], b_frost: [46, 84] };
    flat(182, 196, 9, 8, 6); flat(206, 78, 9, 10, 5); flat(46, 84, 9, 16, 6);
    // 석상/비경 평탄
    W.statues = [{ id: 'st_meadow', i: 128, j: 142, reg: 'meadow' }, { id: 'st_canyon', i: 186, j: 62, reg: 'canyon' }, { id: 'st_snow', i: 74, j: 72, reg: 'snow' }];
    W.statues.forEach(function (s) { flat(s.i, s.j, 3, h[s.j * N + s.i], 3); });
    // 제단 봉우리
    for (j = ALTAR.j - 16; j <= ALTAR.j + 16; j++) for (i = ALTAR.i - 16; i <= ALTAR.i + 16; i++) { var d2 = Math.hypot(i - ALTAR.i, j - ALTAR.j); id = j * N + i; if (d2 <= 11) h[id] = 56; else if (d2 < 16) h[id] = Math.max(h[id], Math.round(56 - (d2 - 11) * 9)); }
    // 비경 내부용 투기장(북서쪽 바다 위)
    for (j = ARENA.j - 14; j <= ARENA.j + 14; j++) for (i = ARENA.i - 14; i <= ARENA.i + 14; i++) { var d3 = Math.hypot(i - ARENA.i, j - ARENA.j); id = j * N + i; if (d3 <= 11) h[id] = 8; else if (d3 < 14) h[id] = 30; }
    // 동굴(초원↔협곡 터널) + 설원 동굴
    function tunnel(i0, j0, i1, j1, fl, wd, tile) { var len = Math.max(Math.abs(i1 - i0), Math.abs(j1 - j0)); for (var k = 0; k <= len; k++) { var ci = Math.round(i0 + (i1 - i0) * k / len), cj = Math.round(j0 + (j1 - j0) * k / len), mid = Math.abs(k - len / 2) < 3 ? 2 : 0; for (var a = -wd - mid; a <= wd + mid; a++) for (var b = -wd - mid; b <= wd + mid; b++) { var id = (cj + b) * N + ci + a; if (h[id] > fl + 9) { st[id] = Math.max(h[id], st[id]); sb[id] = fl + 8 + (mid ? 3 : 0); stile[id] = 255; h[id] = fl; reg[id] |= 8; } else if (h[id] > fl) { h[id] = fl; reg[id] |= 8; } } } }
    W.cave1 = { a: [172, 124], b: [172, 94] }; tunnel(172, 126, 172, 92, 13, 1);
    W.cave2 = [58, 70]; tunnel(66, 74, 56, 64, 30, 1);
    // 다리
    for (j = 169; j <= 170; j++) for (i = 96; i <= 117; i++) { id = j * N + i; if (h[id] < 7) { st[id] = 8; sb[id] = 7; stile[id] = 12; } else h[id] = 8; }
    for (j = 168; j <= 171; j++) for (i = 117; i <= 124; i++) h[j * N + i] = 8;
    // 타일
    for (j = 0; j < N; j++) for (i = 0; i < N; i++) {
      id = j * N + i; var r = reg[id] & 7, hh = h[id], cave = reg[id] & 8;
      var mx = 0; if (i > 0 && j > 0 && i < N - 1 && j < N - 1) mx = Math.max(hh - h[id - 1], hh - h[id + 1], hh - h[id - N], hh - h[id + N]);
      if (hh < 0) { top[id] = r == 1 ? 10 : 4; side[id] = under[id] = 25; wl[id] = 0; }
      else if (r == 0) { if (hh <= 2) { top[id] = 4; side[id] = under[id] = 25; } else { top[id] = 0; side[id] = mx > 5 ? 27 : 1; under[id] = mx > 5 ? 27 : 2; } }
      else if (r == 1) { if (hh <= 4) { top[id] = 10; side[id] = under[id] = 28; wl[id] = 4; wt[id] = 1; h[id] = 2; } else { top[id] = n2(i / 6, j / 6, 21) > .7 ? 10 : 8; side[id] = under[id] = 9; } }
      else { top[id] = 5; side[id] = 6; under[id] = 27; if (hh > 60 && mx > 3) top[id] = 3; }
      if (cave) { top[id] = 18; under[id] = 26; side[id] = 26; }
      if (st[id] && stile[id] == 255) { stile[id] = r == 2 ? 5 : r == 1 ? 8 : 0; W.sside[id] = r == 2 ? 6 : r == 1 ? 9 : 27; under[id] = 26; } else if (st[id]) { W.sside[id] = 29; under[id] = 29; }
    }
    for (j = 84; j <= 100; j++) for (i = 78; i <= 94; i++) { id = j * N + i; if (h[id] == 2) { top[id] = 7; side[id] = 7; } }
    for (j = ALTAR.j - 16; j <= ALTAR.j + 16; j++) for (i = ALTAR.i - 16; i <= ALTAR.i + 16; i++) { id = j * N + i; var d4 = Math.hypot(i - ALTAR.i, j - ALTAR.j); if (d4 <= 11) { top[id] = d4 < 9 ? 20 : 21; side[id] = 22; under[id] = 22; if (d4 > 9.7 && d4 <= 11) { h[id] = (Math.round(Math.atan2(j - ALTAR.j, i - ALTAR.i) * 5) % 2 == 0) ? 66 : 61; top[id] = 21; } } else if (d4 < 16) { side[id] = 27; under[id] = 27; top[id] = 3; } }
    for (j = ARENA.j - 14; j <= ARENA.j + 14; j++) for (i = ARENA.i - 14; i <= ARENA.i + 14; i++) { id = j * N + i; var d5 = Math.hypot(i - ARENA.i, j - ARENA.j); if (d5 < 14) { top[id] = d5 <= 11 ? (d5 < 3 ? 20 : 21) : 22; side[id] = 22; under[id] = 22; wl[id] = -999; reg[id] = 16; } }
    // 마을: 광장·길·집
    for (j = TOWN.j - 15; j <= TOWN.j + 15; j++) for (i = TOWN.i - 15; i <= TOWN.i + 15; i++) { id = j * N + i; var d6 = Math.hypot(i - TOWN.i, j - TOWN.j); if (d6 < 15) reg[id] = 3; if (d6 < 5.5) top[id] = 19; else if (d6 < 15 && (Math.abs(i - TOWN.i) < 2 || Math.abs(j - TOWN.j) < 2)) top[id] = 11; }
    function road(a, b) { var len = Math.max(Math.abs(b[0] - a[0]), Math.abs(b[1] - a[1])); for (var k = 0; k <= len; k++) { var ci = Math.round(a[0] + (b[0] - a[0]) * k / len + (n2(k / 9, a[0], 31) - .5) * 4), cj = Math.round(a[1] + (b[1] - a[1]) * k / len); for (var q = 0; q < 2; q++) { var id = cj * N + ci + q; if (h[id] > 0 && (reg[id] & 7) == 0 && !st[id] && top[id] == 0) top[id] = 11; } } }
    road([128, 163], [128, 144]); road([128, 142], [171, 127]); road([124, 169], [118, 169]); road([96, 169], [78, 150]); road([78, 150], [80, 112]); road([142, 178], [176, 192]);
    W.houses = [];
    function house(i0, j0, w, d, roofT, door, name) { var base = 8; for (var b = 0; b < d; b++) for (var a = 0; a < w; a++) { var id = (j0 + b) * N + i0 + a, edge = a == 0 || b == 0 || a == w - 1 || b == d - 1, rise = w >= d ? Math.min(b, d - 1 - b) : Math.min(a, w - 1 - a); h[id] = base + 8 + Math.min(rise, 2) * 2; top[id] = roofT; side[id] = rise > 0 ? roofT : ((a + b) % 2 ? 14 : 13); under[id] = 13; reg[id] = 3 | 32; } var dc = door == 's' ? [i0 + (w >> 1), j0 + d - 1] : door == 'n' ? [i0 + (w >> 1), j0] : door == 'e' ? [i0 + w - 1, j0 + (d >> 1)] : [i0, j0 + (d >> 1)]; under[dc[1] * N + dc[0]] = 23; side[dc[1] * N + dc[0]] = 13; var fx = door == 'e' ? 1.2 : door == 'w' ? -1.2 : 0, fz = door == 's' ? 1.2 : door == 'n' ? -1.2 : 0; W.houses.push({ name: name, x: (dc[0] + .5 + fx) * CS, z: (dc[1] + .5 + fz) * CS }); }
    house(117, 166, 5, 4, 15, 'e', 'inn'); house(135, 167, 4, 4, 16, 'w', 'guild'); house(116, 181, 4, 5, 30, 'e', 'smith'); house(135, 180, 5, 4, 15, 'w', 'shop'); house(123, 187, 4, 3, 16, 'n', 'alch'); house(131, 188, 4, 3, 30, 'n', 'elder');
    // 밭
    for (j = 186; j <= 189; j++) for (i = 141; i <= 146; i++) { id = j * N + i; h[id] = 8; top[id] = 2; reg[id] = 3; }
    W.RIVER = RIVER;
  }
  // ── 질의 ──
  function ci(x) { return U.clamp(Math.floor(x / CS), 0, N - 1); }
  W.cid = function (x, z) { return ci(z) * N + ci(x); };
  W.ice = {};
  W.ground = function (x, z, y) { // 발 높이 y 기준으로 설 수 있는 바닥
    var id = W.cid(x, z), g = h[id] * .5;
    if (st[id] && (y == null || y >= sb[id] * .5 - .2)) g = st[id] * .5;
    var ic = W.ice[id]; if (ic && (y == null || y >= ic.y - .7) && ic.y > g) g = ic.y;
    return g;
  };
  W.ceil = function (x, z, y) { var id = W.cid(x, z); return st[id] && y < sb[id] * .5 ? sb[id] * .5 : 1e9; };
  W.liquid = function (x, z) { var id = W.cid(x, z); if (wl[id] > h[id]) return { y: wl[id] * .5 - .12, lava: wt[id] == 1, depth: (wl[id] - h[id]) * .5 }; return null; };
  W.region = function (x, z) { var r = reg[W.cid(x, z)]; return r & 16 ? 'arena' : ['meadow', 'canyon', 'snow', 'town'][r & 3]; };
  W.inCave = function (x, z, y) { var id = W.cid(x, z); return st[id] && stile[id] != 12 && y < sb[id] * .5; };
  W.topY = function (x, z) { var id = W.cid(x, z); return Math.max(h[id], st[id]) * .5; };
  W.isHouse = function (x, z) { return reg[W.cid(x, z)] & 32; };

  // ── 오브젝트 배치 ──
  function place() {
    var rnd = U.rng(777), O = W.o = { decor: [], solid: [], wps: [], gates: [], camps: [], spawns: [], chests: [], orbs: [], torches: [], monus: [], chals: [], seelies: [], gathers: [], fishes: [], animals: [], npcs: [], stations: [] };
    function P(i, j) { return { x: (i + .5) * CS, z: (j + .5) * CS, y: W.topY((i + .5) * CS, (j + .5) * CS) }; }
    function ok(i, j, slopeMax) { if (i < 3 || j < 3 || i > N - 4 || j > N - 4) return false; var id = j * N + i; if (h[id] <= 0 || wl[id] > h[id] || st[id] || (reg[id] & 56) || (reg[id] & 7) == 3 || top[id] == 11 || top[id] == 19) return false; if (Math.hypot(i - ALTAR.i, j - ALTAR.j) < 17) return false; for (var bk in W.bossPos) { var bp0 = W.bossPos[bk], bi = bp0.x != null ? bp0.x / 2 : bp0[0], bj = bp0.z != null ? bp0.z / 2 : bp0[1]; if (Math.hypot(i - bi, j - bj) < 11) return false; } if (slopeMax != null) { if (Math.abs(h[id] - h[id + 1]) > slopeMax || Math.abs(h[id] - h[id - 1]) > slopeMax || Math.abs(h[id] - h[id + N]) > slopeMax || Math.abs(h[id] - h[id - N]) > slopeMax) return false; } return true; }
    var used = [];
    function far(x, z, d) { for (var k = 0; k < used.length; k++) if (Math.abs(used[k][0] - x) < d && Math.abs(used[k][1] - z) < d) return false; return true; }
    function scatter(n, pred, fn, dmin, slope) { var c = 0, tries = 0; while (c < n && tries++ < n * 400) { var i = 6 + Math.floor(rnd() * (N - 12)), j = 6 + Math.floor(rnd() * (N - 12)); if (!ok(i, j, slope == null ? 1 : slope)) continue; var r = reg[j * N + i] & 7; if (!pred(i, j, r, h[j * N + i])) continue; var p = P(i, j); if (!far(p.x, p.z, dmin || 8)) continue; used.push([p.x, p.z]); fn(p, r, c, i, j); c++; } }
    // 고정 시설 주변 예약
    W.statues.forEach(function (s) { var p = P(s.i, s.j); s.x = p.x; s.z = p.z; s.y = p.y; used.push([p.x, p.z]); });
    [['wp_town', '새벽나루 별문', 128, 172], ['wp_me', '초원 동쪽 별문', 196, 150], ['wp_mw', '초원 서쪽 별문', 62, 158], ['wp_ms', '남쪽 곶 별문', 150, 214], ['wp_c1', '협곡 입구 별문', 168, 88], ['wp_c2', '협곡 깊은 곳 별문', 218, 52], ['wp_s1', '얼음 호수 별문', 98, 100], ['wp_s2', '서리봉 중턱 별문', 44, 52], ['wp_altar', '별의 제단 별문', 128, 37]].forEach(function (w) { var p = P(w[2], w[3]); p.id = w[0]; p.name = w[1]; O.wps.push(p); used.push([p.x, p.z]); });
    [['dm_art1', '검무의 수련장', 'art', ['glad', 'star'], 150, 150, 8], ['dm_art2', '불과 서리의 회랑', 'art', ['ember', 'frost'], 186, 100, 22], ['dm_art3', '뇌우의 전당', 'art', ['volt', 'tide'], 96, 68, 30], ['dm_tal', '세 가르침의 서고', 'tal', null, 96, 150, 14], ['dm_wpn', '쇳조각 제련소', 'wpn', null, 226, 96, 20], ['weekly', '폭풍의 둥지', 'weekly', null, 44, 124, 36], ['tower', '별빛 첨탑', 'tower', null, 128, 205, 1]].forEach(function (g) { var p = P(g[4], g[5]); p.id = g[0]; p.name = g[1]; p.kind = g[2]; p.sets = g[3]; p.lvl = g[6]; O.gates.push(p); used.push([p.x, p.z]); });
    for (var k in W.bossPos) { var bp = P(W.bossPos[k][0], W.bossPos[k][1]); W.bossPos[k] = bp; used.push([bp.x, bp.z]); }
    W.altar = P(ALTAR.i, ALTAR.j); W.arena = P(ARENA.i, ARENA.j); W.town = P(TOWN.i, TOWN.j);
    // 마을 사람·시설
    var T = function (di, dj) { return P(TOWN.i + di, TOWN.j + dj); };
    function npc(id, di, dj) { var p = T(di, dj); p.id = id; O.npcs.push(p); }
    npc('elder', 4, 9); npc('neri', 0, -3); npc('dora', 6, -8); npc('chef', -5, -9); npc('smith', -6, 5); npc('alch', -3, 7); npc('shop', 6, 4); npc('fisher', -14, -6); npc('miner', 9, -1); npc('kid', 2, 3); npc('bard', -2, 2); npc('farmer', 12, 9);
    function stn(kind, di, dj, spr) { var p = T(di, dj); p.kind = kind; p.spr = spr; O.stations.push(p); }
    stn('cook', -5, -7, 'pot0'); stn('forge', -7, 6, 'anvil0'); stn('alch', -3, 8.5, 'bench0'); stn('board', 5, -7, 'board0'); stn('gacha', 0, -5, 'gate1');
    // 야영지
    var campDefs = [[150, 164, ['gob', 'gob', 'gob_arch'], 1, 0], [100, 190, ['gob', 'gob', 'gob', 'gob_arch'], 1, 0], [72, 132, ['gob', 'gob_arch', 'gob_shield'], 2, 0], [206, 172, ['gob', 'gob', 'gob_shield', 'gob_arch'], 2, 0], [156, 204, ['gob', 'gob_mage', 'gob_arch'], 2, 0], [196, 96, ['gob', 'gob', 'gob_mage', 'gob_shield'], 2, 1], [228, 70, ['knight', 'gob_mage', 'gob_arch'], 3, 1], [160, 50, ['knight', 'knight', 'gob_mage'], 3, 1], [70, 104, ['gob', 'wolf', 'wolf', 'frost_sp'], 2, 2], [36, 64, ['frost_sp', 'frost_sp', 'gob_shield', 'wolf'], 3, 2], [98, 44, ['golem', 'frost_sp'], 3, 2], [216, 130, ['golem', 'gob', 'gob'], 2, 0]];
    campDefs.forEach(function (c, n) { var i = c[0], j = c[1]; for (var t = 0; t < 60 && !ok(i, j, 2); t++) { i = c[0] + Math.floor(rnd() * 9 - 4); j = c[1] + Math.floor(rnd() * 9 - 4); } var p = P(i, j); p.id = 'camp' + n; p.mobs = c[2]; p.tier = c[3]; O.camps.push(p); used.push([p.x, p.z]); });
    // 필드 적 무리
    var packs = [[['sl_grass', 'sl_grass'], ['sl_water', 'sl_water'], ['sl_elec', 'sl_grass'], ['gob', 'gob'], ['sl_water', 'sl_elec', 'sl_elec'], ['wisp', 'wisp']], [['sl_fire', 'sl_fire'], ['sl_fire', 'gob'], ['gob', 'gob_arch', 'gob'], ['wisp', 'wisp', 'sl_fire'], ['golem']], [['sl_ice', 'sl_ice'], ['wolf', 'wolf'], ['wolf', 'sl_ice', 'sl_ice'], ['frost_sp'], ['wolf', 'wolf', 'wolf']]];
    scatter(46, function (i, j, r) { return Math.hypot(i - TOWN.i, j - TOWN.j) > 24; }, function (p, r, c) { p.mobs = packs[r][Math.floor(rnd() * packs[r].length)]; p.id = 'sp' + c; O.spawns.push(p); }, 26, 2);
    // 구슬(지역당 8) — 높은 곳 선호
    [0, 1, 2].forEach(function (rg) { var c0 = O.orbs.length; scatter(8, function (i, j, r, hh) { return r == rg && hh > [9, 12, 20][rg] - (O.orbs.length - c0 > 5 ? 99 : 0); }, function (p, r, c) { p.id = 'orb' + rg + '_' + c; p.reg = rg; p.y += 1.2 + (c % 3) * 1.5; O.orbs.push(p); }, 30, 99); });
    // 상자
    scatter(54, function (i, j, r, hh) { return true; }, function (p, r, c) { p.id = 'ch' + c; p.tier = c % 9 == 0 ? 2 : c % 3 == 0 ? 1 : 0; p.reg = r; O.chests.push(p); }, 22, 1);
    var cc = P(172, 109); cc.y = h[109 * N + 172] * .5; cc.id = 'ch_cave1'; cc.tier = 2; cc.reg = 1; O.chests.push(cc);
    var c2 = P(56, 64); c2.y = h[64 * N + 56] * .5; c2.id = 'ch_cave2'; c2.tier = 3; c2.reg = 2; O.chests.push(c2);
    var c3 = P(ALTAR.i + 6, ALTAR.j - 5); c3.id = 'ch_altar'; c3.tier = 3; c3.reg = 2; O.chests.push(c3);
    // 퍼즐: 횃불(불), 원소 비석
    scatter(5, function (i, j, r) { return true; }, function (p, r, c) { p.id = 'tq' + c; p.reg = r; p.n = 3; O.torches.push(p); }, 50, 0);
    var mel = [['wind', 'grass', 'water'], ['fire', 'rock', 'elec'], ['ice', 'water', 'elec']];
    scatter(6, function (i, j, r) { return true; }, function (p, r, c) { p.id = 'mq' + c; p.reg = r; p.els = c % 2 ? mel[r].slice(0, 2) : [mel[r][c % 3]]; O.monus.push(p); }, 50, 0);
    // 시간 제한 도전
    scatter(6, function (i, j, r) { return Math.hypot(i - TOWN.i, j - TOWN.j) > 22; }, function (p, r, c) { p.id = 'tc' + c; p.reg = r; p.kind = c % 2 ? 'coin' : 'kill'; O.chals.push(p); }, 50, 0);
    // 요정
    scatter(6, function (i, j, r) { return true; }, function (p, r, c, i, j) { p.id = 'se' + c; p.reg = r; var pts = [[p.x, p.z]], a = rnd() * 6.28, x = p.x, z = p.z; for (var s = 0; s < 5; s++) { a += (rnd() - .5) * 1.4; for (var t = 0; t < 8; t++) { var nx = x + Math.sin(a) * 9, nz = z + Math.cos(a) * 9; if (ok(Math.floor(nx / CS), Math.floor(nz / CS), 99)) { x = nx; z = nz; break; } a += .8; } pts.push([x, z]); } p.path = pts; O.seelies.push(p); used.push([x, z]); }, 46, 2);
    // 채집
    var gk = [[['sp_m1', 'flower0', 10], ['sp_m2', 'mush0', 10], ['berry', 'fruit0', 10], ['mush', 'mush1', 8], ['herb', 'herb0', 8], ['apple', 'fruit1', 7]], [['sp_c1', 'flower1', 10], ['sp_c2', 'crystal1', 10], ['herb', 'herb0', 4], ['mush', 'mush1', 4]], [['sp_s1', 'herb1', 10], ['sp_s2', 'flower2', 10], ['berry', 'fruit0', 4], ['mush', 'mush1', 4]]];
    gk.forEach(function (list, rg) { list.forEach(function (g) { scatter(g[2], function (i, j, r) { return r == rg; }, function (p, r, c) { p.id = 'g' + O.gathers.length; p.item = g[0]; p.spr = g[1]; O.gathers.push(p); }, 7, 2); }); });
    [[142, 187], [144, 187], [146, 187], [142, 189], [144, 189]].forEach(function (f, n) { var p = P(f[0], f[1]); p.id = 'gf' + n; p.item = n < 3 ? 'carrot' : 'wheat'; p.spr = n < 3 ? 'carrot0' : 'wheat0'; O.gathers.push(p); });
    // 광석
    scatter(34, function (i, j, r, hh) { return r != 0 || hh > 12 || rnd() < .15; }, function (p, r, c) { p.id = 'ore' + c; p.item = c % 4 == 0 ? 'crystal' : 'iron'; p.spr = c % 4 == 0 ? 'ore1' : 'ore0'; p.ore = 1; O.gathers.push(p); }, 12, 3);
    [[171, 108], [173, 110], [171, 111], [57, 66]].forEach(function (f, n) { var p = P(f[0], f[1]); p.y = h[f[1] * N + f[0]] * .5; p.id = 'orec' + n; p.item = 'crystal'; p.spr = 'ore1'; p.ore = 1; O.gathers.push(p); });
    // 낚시터(강/해안)
    [[101, 148], [107, 186], [118, 226], [150, 222], [206, 204], [60, 178], [86, 104]].forEach(function (f, n) { var p = { x: (f[0] + .5) * CS, z: (f[1] + .5) * CS, y: -.1, id: 'fs' + n }; O.fishes.push(p); });
    // 동물
    scatter(14, function (i, j, r) { return r == 0; }, function (p, r, c) { p.id = 'an' + c; p.mob = c % 3 == 0 ? 'bird' : 'boar'; O.animals.push(p); }, 24, 1);
    // 장식(나무·덤불·바위·풀) — 청크별 저장
    W.decor = []; W.gset = {}; for (var q = 0; q < 256; q++) W.decor.push([]);
    for (var j = 4; j < N - 4; j++) for (var i = 4; i < N - 4; i++) {
      var id = j * N + i, r = reg[id] & 7, hv = U.hash2(i, j, 91), hh = h[id]; if (!ok(i, j, 99) || top[id] == 2) continue;
      var x = (i + .2 + U.hash2(i, j, 92) * .6) * CS, z = (j + .2 + U.hash2(i, j, 93) * .6) * CS, y = hh * .5, sp = null, sc = 1, solid = 0;
      var dens = U.noise2(i / 9, j / 9, 95);
      if (!far(x, z, 5)) { if (hv < .2 && r != 1 && hh > 2) sp = 'grass' + (r == 2 ? 2 : 0); }
      else if (r == 0) { if (hh <= 2) { if (hv < .012) { sp = 'palm0'; solid = 1; sc = 1.3; } } else if (hv < .045 * (dens > .55 ? 2.4 : .5)) { sp = 'tree' + (Math.floor(hv * 1000) % 3); solid = 1; sc = 1.25 + U.hash2(i, j, 94) * .5; } else if (hv < .07) sp = 'bush' + (hv < .055 ? 3 : 0); else if (hv < .085) sp = 'rock0'; else if (hv < .4) sp = 'grass' + (hv < .12 ? 1 : 0); else if (hv > .985) sp = 'flower3'; }
      else if (r == 1) { if (hv < .02) { sp = 'dead' + (Math.floor(hv * 1000) % 2); solid = 1; sc = 1.3; } else if (hv < .05) sp = 'rock1'; else if (hv < .07) sp = 'bush2'; else if (hv < .16) sp = 'grass1'; }
      else if (r == 2) { if (hv < .05 * (dens > .5 ? 2 : .4) && hh < 70) { sp = 'pine0'; solid = 1; sc = 1.3 + U.hash2(i, j, 94) * .5; } else if (hv < .075) sp = 'rock2'; else if (hv < .1) sp = 'bush1'; else if (hv < .2) sp = 'grass2'; }
      if (sp) { if (sp.indexOf('grass') == 0) W.gset[id] = 1; W.decor[(j >> 4) * 16 + (i >> 4)].push({ x: x, y: y, z: z, s: sp, sc: sc, solid: solid, g: sp.indexOf('grass') == 0 ? id : 0 }); }
    }
    // 마을 장식
    [[-3, -3, 'crate0'], [3, 3, 'crate0'], [-8, 0, 'tree1'], [8, -3, 'tree0'], [-9, -11, 'tree2'], [10, 11, 'tree0'], [3, -9, 'dummy0']].forEach(function (d) { var p = T(d[0], d[1]); W.decor[(Math.floor(p.z / CS) >> 4) * 16 + (Math.floor(p.x / CS) >> 4)].push({ x: p.x, y: p.y, z: p.z, s: d[2], sc: d[2][0] == 't' ? 1.4 : 1, solid: d[2][0] == 't' }); });
  }
  W.burnt = {}; // 불탄 풀 셀
  W.init = function () { gen(); place(); return W; };
  W.TOWN = TOWN; W.ALTAR = ALTAR; W.ARENA = ARENA;
  return W;
})();
