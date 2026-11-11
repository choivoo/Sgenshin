// 월드 오브젝트·상호작용·퍼즐·임무·비경 진행
(function () {
  var D = DATA, FX = G.FX, EC = G.EC, P, objs = [], dyn = [], RESPAWN = 600e3;
  function S() { return ST.S; }
  function taken(id) { var t = S().taken[id]; return t && Date.now() - t < RESPAWN; }
  G.loot = function (id, n) { ST.add(id, n); UI.loot(id, n); };
  G.giveRewards = function (o, title) { var out = ST.reward(o); out.forEach(function (r) { if (r[0] == 'art') { var a = S().arts[r[1]]; UI.loot('art', 1, D.SETS[a.set].n + ' ' + D.SLOTS.filter(function (s) { return s.id == a.slot; })[0].n + ' ★' + a.r, a); } else if (r[0] == 'arxp') UI.loot('arxp', r[1]); else UI.loot(r[0], r[1]); }); return out; };
  var CH_RW = [{ gem: 5, coin: 600, xp1: 2, arxp: 20, ore1: 2 }, { gem: 10, coin: 1200, xp2: 1, arxp: 30, ore2: 1, art: 1, artR: 3 }, { gem: 20, coin: 2500, xp2: 3, arxp: 40, ore2: 3, art: 1, artR: 4, polish: 2 }, { gem: 40, coin: 6000, xp3: 2, arxp: 60, ore3: 2, art: 2, artR: 5, tk_s: 1, polish: 4 }];
  G.buildObjs = function () {
    P = G.P; objs = []; var O = W.o;
    W.statues.forEach(function (s) { objs.push({ k: 'statue', x: s.x, y: s.y, z: s.z, ref: s, r: 3.2 }); });
    O.wps.forEach(function (s) { objs.push({ k: 'wp', x: s.x, y: s.y, z: s.z, ref: s, r: 2.8 }); });
    O.gates.forEach(function (s) { objs.push({ k: 'gate', x: s.x, y: s.y, z: s.z, ref: s, r: 3 }); });
    O.chests.forEach(function (s) { objs.push({ k: 'chest', x: s.x, y: s.y, z: s.z, ref: s, r: 2.2 }); });
    O.camps.forEach(function (s) { objs.push({ k: 'chest', x: s.x + 1.5, y: W.ground(s.x + 1.5, s.z + 1, 99), z: s.z + 1, ref: { id: 'cc_' + s.id, tier: s.tier, camp: s.id }, r: 2.2 }); objs.push({ k: 'deco', x: s.x - 2.5, y: W.ground(s.x - 2.5, s.z - 2, 99), z: s.z - 2, spr: 'tent0', sc: 1.5 }); objs.push({ k: 'deco', x: s.x, y: s.y, z: s.z, spr: 'fire0', sc: 1.2 }); });
    O.orbs.forEach(function (s) { objs.push({ k: 'orb', x: s.x, y: s.y, z: s.z, ref: s }); });
    O.torches.forEach(function (s) { s.lit = [0, 0, 0]; s.pts = [0, 1, 2].map(function (i) { var a = i * 2.09, x = s.x + Math.cos(a) * 3, z = s.z + Math.sin(a) * 3; return { x: x, z: z, y: W.ground(x, z, 99) }; }); objs.push({ k: 'torch', x: s.x, y: s.y, z: s.z, ref: s }); pc(s); });
    O.monus.forEach(function (s) { s.on = s.els.map(function () { return 0; }); s.pts = s.els.map(function (e, i) { var x = s.x + (i - (s.els.length - 1) / 2) * 3.5, z = s.z; return { x: x, z: z, y: W.ground(x, z, 99) }; }); objs.push({ k: 'monu', x: s.x, y: s.y, z: s.z, ref: s }); pc(s); });
    O.chals.forEach(function (s) { objs.push({ k: 'chal', x: s.x, y: s.y, z: s.z, ref: s, r: 2.5 }); pc(s); });
    O.seelies.forEach(function (s) { s.i = 0; s.cx = s.path[0][0]; s.cz = s.path[0][1]; var e = s.path[s.path.length - 1]; s.ex = e[0]; s.ez = e[1]; s.ey = W.ground(e[0], e[1], 99); objs.push({ k: 'seelie', x: s.x, y: s.y, z: s.z, ref: s }); objs.push({ k: 'chest', x: s.ex + 1.5, y: W.ground(s.ex + 1.5, s.ez, 99), z: s.ez, ref: { id: 'pc_' + s.id, tier: 1, puz: s.id }, r: 2.2 }); });
    O.gathers.forEach(function (s) { objs.push({ k: 'gather', x: s.x, y: s.y, z: s.z, ref: s, r: 2, hp: 3 }); });
    O.fishes.forEach(function (s) { objs.push({ k: 'fish', x: s.x, y: s.y, z: s.z, ref: s, r: 5 }); });
    O.stations.forEach(function (s) { objs.push({ k: 'station', x: s.x, y: s.y, z: s.z, ref: s, r: 2.6 }); });
    O.npcs.forEach(function (s) { objs.push({ k: 'npc', x: s.x, y: s.y, z: s.z, ref: s, r: 2.6, yaw: Math.atan2(W.town.x - s.x, W.town.z - s.z) }); });
    objs.push({ k: 'chest', x: W.altar.x, y: W.altar.y, z: W.altar.z + 12, ref: { id: 'ch_nox', tier: 3, flag: 'noxDead' }, r: 2.2 });
    G.objs = objs;
    function pc(s) { var x = s.x, z = s.z + 2.5; objs.push({ k: 'chest', x: x, y: W.ground(x, z, 99), z: z, ref: { id: 'pc_' + s.id, tier: s.reg == 2 ? 2 : 1, puz: s.id }, r: 2.2 }); }
  };
  function chestVisible(c) { var s = S(); if (c.camp) return true; if (c.puz) return !!s.puz[c.puz]; if (c.flag) return !!s.flags[c.flag]; return true; }
  function chestLocked(c) { return c.camp && !S().camps[c.camp]; }
  // ───── 그리기 ─────
  G.drawObjects = function (t) {
    var s = S(), sight = G.sight, qt = G.questTarget();
    if (qt && Math.hypot(qt.x - P.x, qt.z - P.z) > 6) { var qy = W.ground(qt.x, qt.z, 99); R.line(qt.x, qy, qt.z, qt.x, qy + 40, qt.z, .25, 255, 220, 80, .7); R.px(qt.x, qy + 3 + Math.sin(t * 3) * .3, qt.z, .8, 255, 230, 100, 1, 'diamond'); }
    s.pins.forEach(function (p) { if (Math.hypot(p[0] - P.x, p[1] - P.z) < 150) { var py = W.ground(p[0], p[1], 99); R.line(p[0], py, p[1], p[0], py + 30, p[1], .18, 120, 220, 255, .6); } });
    for (var i = 0; i < objs.length; i++) {
      var o = objs[i], dx = o.x - P.x, dz = o.z - P.z, d = dx * dx + dz * dz; if (d > 95 * 95) continue; var r = o.ref, k = o.k;
      if (k == 'statue') { var on = s.statues[r.id]; R.spr(SPR.prop['statue' + (on ? 1 : 0)], o.x, o.y, o.z, { sc: 1.8, unlit: false }); if (on && Math.random() < .2) FX.part(o.x, o.y + 4.4, o.z, [130, 240, 255], 1, .6, { up: 1, g: 0, life: .8 }); }
      else if (k == 'wp') { var un = s.wps[r.id], locked = r.id == 'wp_altar' && !s.flags.altar; R.spr(SPR.prop['gate' + (un ? 1 : 0)], o.x, o.y, o.z, { sc: 1.5 }); if (un) R.flat('rune', o.x, o.y + .1, o.z, 1.6, 120, 220, 255, .7, t * .5); if (locked) R.px(o.x, o.y + 3, o.z, .5, 255, 80, 80, 1, 'diamond'); }
      else if (k == 'gate') { R.spr(SPR.prop.gate1, o.x, o.y, o.z, { sc: 2.2, r: 160, g: 120, b: 160 }); R.flat('rune', o.x, o.y + .1, o.z, 2.6, 255, 200, 90, .8, -t * .4); }
      else if (k == 'chest') { if (!chestVisible(r)) continue; var op = s.opened[r.id]; if (op && d > 900) continue; R.spr(SPR.prop[(op ? 'chestopen' : 'chest') + r.tier], o.x, o.y, o.z, { sc: 1.5 + r.tier * .12 }); if (!op && !chestLocked(r) && (sight || r.tier >= 2) && Math.random() < .3) FX.part(o.x, o.y + .6, o.z, [255, 230, 120], 1, .8, { up: 1.5, g: 0, life: .7, sh: 'star', size: .2 }); if (!op && chestLocked(r)) R.px(o.x, o.y + 1.5, o.z, .35, 255, 80, 80, 1, 'diamond'); if (sight && !op && d < 3600) R.line(o.x, o.y, o.z, o.x, o.y + 12, o.z, .12, 255, 230, 120, .5); }
      else if (k == 'orb') { if (s.orbs[r.id]) continue; var oy = o.y + Math.sin(t * 2 + i) * .15; R.spr(SPR.prop['orb' + r.reg], o.x, oy, o.z, { sc: 1.4, unlit: true }); if (Math.random() < .15) FX.part(o.x, oy + .5, o.z, [255, 255, 255], 1, .5, { g: 0, life: .6, sh: 'star' }); if (sight) R.line(o.x, oy, o.z, o.x, oy + 14, o.z, .1, 150, 255, 220, .5); if (d < 3.2 && Math.abs(o.y - P.y) < 2.2) collectOrb(r); }
      else if (k == 'torch') { var solved = s.puz[r.id]; r.pts.forEach(function (p, j) { var lit = solved || r.lit[j]; R.spr(SPR.prop['torch' + (lit ? 1 : 0)], p.x, p.y, p.z, { sc: 1.4 }); if (lit && Math.random() < .3) FX.part(p.x, p.y + 1.9, p.z, [255, 180, 60], 1, .4, { up: 1.5, g: -1, life: .5 }); if (sight && !lit) R.px(p.x, p.y + 2.4, p.z, .4, 255, 110, 60, 1, 'diamond'); }); }
      else if (k == 'monu') { var sol = s.puz[r.id]; r.pts.forEach(function (p, j) { var ei = D.ELS.indexOf(r.els[j]); R.spr(SPR.prop['monu' + (ei + (sol || r.on[j] ? 7 : 0))], p.x, p.y, p.z, { sc: 1.4 }); if (sight && !sol) { var c = EC[r.els[j]]; R.px(p.x, p.y + 2.6, p.z, .45, c[0], c[1], c[2], 1, 'diamond'); } }); }
      else if (k == 'chal') { if (s.puz[r.id]) continue; R.spr(SPR.prop['flag' + (r.run ? 1 : 0)], o.x, o.y, o.z, { sc: 1.4 }); if (r.run && r.coins) r.coins.forEach(function (c) { if (!c.got) { R.px(c.x, c.y + 1 + Math.sin(t * 4 + c.x) * .15, c.z, .55, 255, 220, 60, 1, 'circle'); if (Math.hypot(c.x - P.x, c.z - P.z) < 1.3 && Math.abs(c.y - P.y) < 2.5) { c.got = 1; AUD.sfx('coin'); FX.part(c.x, c.y + 1, c.z, [255, 230, 90], 6, 3, {}); } } }); }
      else if (k == 'seelie') { if (s.puz[r.id]) { R.spr(SPR.prop.pedestal1, r.ex, r.ey, r.ez, { sc: 1.3 }); continue; } R.spr(SPR.prop.pedestal0, r.ex, r.ey, r.ez, { sc: 1.3 }); var sy = W.ground(r.cx, r.cz, 99) + 1 + Math.sin(t * 3) * .2; R.spr(SPR.prop.seelie0, r.cx, sy, r.cz, { sc: 1.3, unlit: true }); if (Math.random() < .3) FX.part(r.cx, sy + .3, r.cz, [160, 240, 255], 1, .3, { g: 1, life: .6 }); seelieStep(r); }
      else if (k == 'gather') { if (taken(r.id)) continue; R.spr(SPR.prop[r.spr], o.x, o.y, o.z, { sc: r.ore ? 1.4 : 1.6, ar: o.flash > 0 ? 150 : 0, ag: o.flash > 0 ? 150 : 0, ab: o.flash > 0 ? 150 : 0 }); if (o.flash > 0) o.flash -= G.rdt; if ((sight || G.hasMiru) && d < 1600 && !r.ore && Math.random() < .08) FX.part(o.x, o.y + .5, o.z, [200, 255, 160], 1, .4, { up: 1, g: 0, sh: 'star' }); }
      else if (k == 'fish') { R.spr(SPR.prop.buoy0, o.x, o.y + Math.sin(t * 2) * .05, o.z, { sc: 1.5 }); if (Math.random() < .03) FX.decal('ring', o.x + (Math.random() - .5) * 3, o.y, o.z + (Math.random() - .5) * 3, .1, .6, .8, [220, 240, 255], .6); }
      else if (k == 'station') { R.spr(SPR.prop[r.spr], o.x, o.y, o.z, { sc: r.kind == 'gacha' ? 2 : 1.5 }); if (r.kind == 'gacha') { R.flat('rune', o.x, o.y + .1, o.z, 2.4, 255, 160, 220, .8, t * .6); if (Math.random() < .3) FX.part(o.x + (Math.random() - .5) * 2, o.y + .2, o.z + (Math.random() - .5) * 2, [255, 200, 240], 1, .3, { up: 2, g: 0, life: 1, sh: 'star' }); } }
      else if (k == 'npc') { var yaw = d < 49 ? Math.atan2(-dx, -dz) : o.yaw; G.sprDir(SPR.npc[r.id], yaw, o.x, o.y, o.z); var mk = npcMark(r.id); if (mk) R.px(o.x, o.y + 2 + Math.sin(t * 4) * .08, o.z, .42, mk[0], mk[1], mk[2], 1, 'diamond'); }
      else if (k == 'deco') R.spr(SPR.prop[o.spr], o.x, o.y, o.z, { sc: o.sc });
    }
    dyn.forEach(function (o) { if (o.k == 'bloom') { R.px(o.x, o.y + 1 + Math.sin(t * 3) * .1, o.z, 1.2, 255, 220, 120, 1, 'star'); R.flat('rune', o.x, o.y + .1, o.z, 1.5, 255, 220, 120, .8, t); } });
    if (sight) { var best = null, bd = 70 * 70; objs.forEach(function (o) { if ((o.k == 'orb' && !s.orbs[o.ref.id]) || ((o.k == 'torch' || o.k == 'monu' || o.k == 'chal') && !s.puz[o.ref.id]) || (o.k == 'chest' && !s.opened[o.ref.id] && chestVisible(o.ref))) { var d = (o.x - P.x) * (o.x - P.x) + (o.z - P.z) * (o.z - P.z); if (d < bd && d > 9) { bd = d; best = o; } } }); if (best) for (var q = 1; q <= 6; q++) { var kx = P.x + (best.x - P.x) * q / 7, kz = P.z + (best.z - P.z) * q / 7; R.px(kx, W.ground(kx, kz, P.y + 3) + .5 + Math.sin(t * 4 + q) * .15, kz, .22, 150, 255, 230, 1, 'diamond'); } }
  };
  function npcMark(id) { var s = S(); for (var i = 0; i < D.QUESTS.length; i++) { var q = D.QUESTS[i], qs = s.q[q.id]; if (qs && !qs.done) { var st = q.steps[qs.s]; if ((st.t == 'talk' || st.t == 'gacha') && st.npc == id) return [255, 220, 60]; } else if (!qs && q.npc == id) return [120, 200, 255]; } return null; }
  function collectOrb(r) { var s = S(); s.orbs[r.id] = 1; ST.bump('orbs', 1); AUD.sfx('orb'); FX.part(r.x, r.y + .5, r.z, [200, 255, 240], 20, 4, { sh: 'star', size: .25 }); G.loot('gem', 2); ST.addAR(15); G.toast(D.REGION[['meadow', 'canyon', 'snow'][r.reg]].orb + ' 획득! 길잡이 석상에 바칠 수 있습니다'); }
  function seelieStep(r) {
    var tgt = r.path[Math.min(r.i + 1, r.path.length - 1)], dP = Math.hypot(r.cx - P.x, r.cz - P.z);
    if (r.i < r.path.length - 1 && (dP < 5 || r.moving)) { r.moving = true; var dx = tgt[0] - r.cx, dz = tgt[1] - r.cz, l = Math.hypot(dx, dz), sp = 7 * G.dt; if (l < sp + .1) { r.cx = tgt[0]; r.cz = tgt[1]; r.i++; r.moving = false; if (r.i >= r.path.length - 1) solve(r, '꼬마 등불 요정이 집에 도착했습니다'), ST.bump('seelie', 1); } else { r.cx += dx / l * sp; r.cz += dz / l * sp; } }
  }
  function solve(r, msg) { var s = S(); if (s.puz[r.id]) return; s.puz[r.id] = 1; ST.bump('puzzles', 1); AUD.sfx('solve'); G.toast(msg + ' — 보물 상자가 나타났습니다!'); ST.addAR(30); FX.boom(r.x, r.y, r.z + 2.5, 'rock', 2); }
  G.onElemHit = function (el, x, z, r) {
    var s = S(); for (var i = 0; i < objs.length; i++) { var o = objs[i]; if (Math.abs(o.x - x) > 14 || Math.abs(o.z - z) > 14) continue; var rf = o.ref;
      if (o.k == 'torch' && el == 'fire' && !s.puz[rf.id]) { rf.pts.forEach(function (p, j) { if (!rf.lit[j] && Math.hypot(p.x - x, p.z - z) < r + 1.2) { rf.lit[j] = 1; AUD.sfx('fire'); FX.boom(p.x, p.y + 1.5, p.z, 'fire', 1); } }); if (rf.lit.every(function (v) { return v; })) solve(rf, '횃불을 모두 밝혔습니다'); }
      if (o.k == 'monu' && !s.puz[rf.id]) { rf.pts.forEach(function (p, j) { if (!rf.on[j] && rf.els[j] == el && Math.hypot(p.x - x, p.z - z) < r + 1.4) { rf.on[j] = 1; AUD.sfx('solve'); FX.boom(p.x, p.y + 1.5, p.z, el, 1.5); } }); if (rf.on.every(function (v) { return v; })) solve(rf, '원소 비석이 공명합니다'); }
    }
  };
  G.mineAt = function (x, z, pow, r) { r = r || 1.8; for (var i = 0; i < objs.length; i++) { var o = objs[i]; if (o.k != 'gather' || !o.ref.ore || taken(o.ref.id)) continue; if (Math.hypot(o.x - x, o.z - z) < r && Math.abs(o.y - P.y) < 3) { o.hp -= pow; o.flash = .12; AUD.sfx('mine'); FX.part(o.x, o.y + .5, o.z, [200, 200, 210], 5, 3, {}); if (o.hp <= 0) { o.hp = 3; S().taken[o.ref.id] = Date.now(); G.loot(o.ref.item, 1 + (Math.random() < .5 ? 1 : 0) + (S().party.indexOf('toram') >= 0 ? 1 : 0)); ST.bump('ores', 1); G.qCheck(); } } } };
  // ───── 상호작용 ─────
  var cur = null;
  G.updateInteract = function (dt) {
    P = G.P; var s = S(), best = null, bd = 1e9;
    G.hasMiru = s.party.indexOf('miru') >= 0; G.safe = W.region(P.x, P.z) == 'town';
    for (var i = 0; i < objs.length; i++) { var o = objs[i]; if (!o.r) continue; var d = Math.hypot(o.x - P.x, o.z - P.z); if (d > o.r || d > bd || Math.abs(o.y - P.y) > 3) continue; var lb = label(o); if (lb) { best = o; bd = d; best.lb = lb; } }
    for (var j = dyn.length - 1; j >= 0; j--) { var dd = dyn[j]; if (dd.until < G.t) { dyn.splice(j, 1); continue; } var d2 = Math.hypot(dd.x - P.x, dd.z - P.z); if (d2 < 2.5 && d2 < bd) { best = dd; bd = d2; best.lb = '보상 수령 (이슬 40)'; } }
    if (G.inst && G.inst.exitReady) best = { k: 'exit', lb: '나가기' };
    cur = best; UI.prompt(best ? best.lb : null);
    if (best && G.inp.p.interact && P.state != 'climb' && G.P.castT <= 0) act(best);
    // 시간 제한 도전 진행
    W.o.chals.forEach(function (c) { if (!c.run) return; c.time -= dt; var done = c.kind == 'kill' ? c.mobs.every(function (e) { return e.dead; }) : c.coins.every(function (x) { return x.got; }); UI.timer(c.time, c.kind == 'kill' ? '적을 모두 처치하라' : '동전을 모두 모아라'); if (done) { c.run = false; UI.timer(null); solve(c, '도전 성공!'); } else if (c.time <= 0) { c.run = false; UI.timer(null); if (c.mobs) c.mobs.forEach(function (e) { if (!e.dead) { e.dead = true; e.deadT = 0; } }); G.toast('도전 실패… 다시 시도할 수 있습니다'); AUD.sfx('deny'); } });
    // 임무 자동 진행
    if ((G.qT = (G.qT || 0) - dt) <= 0) { G.qT = .4; G.qCheck(); if (!s.q.miru && s.q.main.s >= 4 && G.safe && G.mode == 'play') { s.q.miru = { s: 0 }; G.toast('새 캐릭터 임무: ' + D.Q.miru.n); stepEnter('miru'); } }
  };
  function label(o) {
    var s = S(), r = o.ref, k = o.k;
    if (k == 'statue') return s.statues[r.id] ? '길잡이 석상 (회복·구슬 봉헌)' : '길잡이 석상 활성화';
    if (k == 'wp') return r.id == 'wp_altar' && !s.flags.altar ? null : s.wps[r.id] ? '별문 (지도 열기)' : '별문 활성화';
    if (k == 'gate') return r.name + ' 입장';
    if (k == 'chest') return !chestVisible(r) || s.opened[r.id] ? null : chestLocked(r) ? '잠긴 상자 (야영지를 소탕하세요)' : ['일반', '정교한', '진귀한', '호화로운'][r.tier] + ' 보물 상자 열기';
    if (k == 'chal') return s.puz[r.id] || r.run ? null : '시간 제한 도전 시작';
    if (k == 'gather') return taken(r.id) ? null : r.ore ? null : D.ITEMS[r.item].n + ' 채집';
    if (k == 'fish') return P.state == 'swim' ? null : '낚시하기';
    if (k == 'station') return { cook: '요리하기', forge: '대장간', alch: '합성대', board: '의뢰 게시판 (일일 과제)', gacha: '별등 기원' }[r.kind];
    if (k == 'npc') return D.NPC[r.id].n + '와(과) 대화';
    return null;
  }
  function act(o) {
    var s = S(), r = o.ref, k = o.k; AUD.sfx('ui');
    if (k == 'exit') { G.inst.exitReady = false; G.exitInst(); return; }
    if (k == 'bloom') { if (!ST.useDew(40)) { G.toast('여명의 이슬이 부족합니다 (40 필요)'); return; } dyn.splice(dyn.indexOf(o), 1); var wl = ST.WL(); G.giveRewards({ coin: 4000 + wl * 800, arxp: 100, xp2: 3, art: 2, artR: Math.random() < .25 + wl * .1 ? 5 : 4, polish: 2 }); G.loot(o.mat, 2 + (Math.random() < .5 ? 1 : 0)); AUD.sfx('chest'); return; }
    if (k == 'statue') { if (!s.statues[r.id]) { s.statues[r.id] = 1; ST.addAR(120); G.giveRewards({ gem: 20 }); AUD.sfx('solve'); UI.banner(D.REGION[r.reg].n, '길잡이 석상 활성화 · 지도가 밝혀졌습니다'); G.orbitCine(o.x, o.y + 2, o.z, 2.4, 6, 12, G.cam.yaw + 3.14, G.cam.yaw + 4.6, 2, 7, null, 6); G.qEvent('statue', r.id); } s.party.forEach(function (id) { s.chars[id].hp = 1; }); FX.part(P.x, P.y + 1, P.z, [140, 255, 180], 20, 3, { up: 2, g: 0 }); AUD.sfx('heal'); if (s.statues[r.id] && !G.cine) UI.open('statue', r); return; }
    if (k == 'wp') { if (!s.wps[r.id]) { s.wps[r.id] = 1; ST.addAR(60); G.loot('gem', 5); AUD.sfx('solve'); G.toast(r.name + ' 활성화'); } else UI.open('map'); return; }
    if (k == 'gate') { UI.open('gate', r); return; }
    if (k == 'chest') { if (chestLocked(r)) { AUD.sfx('deny'); return; } s.opened[r.id] = 1; ST.bump('chests', 1); AUD.sfx('chest'); FX.part(o.x, o.y + .6, o.z, [255, 230, 120], 24, 5, { sh: 'star', size: .25, up: 2 }); var rw = Object.assign({}, CH_RW[r.tier]); if (r.tier == 0 && Math.random() < .4) { rw.art = 1; rw.artR = 3; } if (r.tier == 2 && Math.random() < .2) rw.artR = 5; G.giveRewards(rw); G.qCheck(); return; }
    if (k == 'chal') { r.run = true; r.time = r.kind == 'kill' ? 45 : 32; AUD.sfx('warn'); if (r.kind == 'kill') { var lst = [['sl_grass', 'sl_water', 'gob'], ['sl_fire', 'gob', 'gob'], ['sl_ice', 'wolf', 'sl_ice']][r.reg]; r.mobs = lst.map(function (m, i) { var a = i * 2.1, e = G.spawnEnemy(m, o.x + Math.cos(a) * 4, o.z + Math.sin(a) * 4, { noDrop: true }); e.state = 'chase'; e.aggro = true; return e; }); r.coins = null; } else { r.mobs = null; r.coins = []; var a0 = Math.random() * 6.28, x = o.x, z = o.z; for (var i = 0; i < 7; i++) { a0 += (Math.random() - .5) * 1.2; var nx = x + Math.cos(a0) * 5, nz = z + Math.sin(a0) * 5; if (W.liquid(nx, nz) || Math.abs(W.ground(nx, nz, 99) - W.ground(x, z, 99)) > 2.6) { a0 += 2; nx = x + Math.cos(a0) * 5; nz = z + Math.sin(a0) * 5; } x = nx; z = nz; r.coins.push({ x: x, z: z, y: W.ground(x, z, 99) }); } } return; }
    if (k == 'gather') { s.taken[r.id] = Date.now(); G.loot(r.item, r.item.indexOf('sp_') == 0 ? 1 : 1 + (Math.random() < .4 ? 1 : 0)); ST.bump('gathers', 1); AUD.sfx('pick'); G.qCheck(); return; }
    if (k == 'fish') { UI.open('fishing', r); return; }
    if (k == 'station') { if (r.kind == 'board') UI.open('book', 'daily'); else UI.open(r.kind == 'alch' ? 'alchemy' : r.kind); return; }
    if (k == 'npc') talk(r.id);
  }
  // ───── 임무 ─────
  function qs(id) { return S().q[id]; }
  G.questTarget = function () {
    var s = S(), id = s.track && s.q[s.track] && !s.q[s.track].done ? s.track : 'main', q = D.Q[id], st = s.q[id]; if (!st || st.done) return null; var sp = q.steps[st.s], O = W.o;
    function npcPos(n) { var p = O.npcs.filter(function (x) { return x.id == n; })[0]; return p; }
    if (sp.t == 'reach') return W.town; if (sp.t == 'talk' || sp.t == 'gacha') return npcPos(sp.npc);
    if (sp.t == 'statue') return W.statues.filter(function (x) { return x.id == sp.id; })[0]; if (sp.t == 'camp') return O.camps.filter(function (x) { return x.id == sp.id; })[0];
    if (sp.t == 'boss') return sp.id == 'b_nox' ? W.altar : W.bossPos[sp.id];
    if (sp.t == 'collect' && sp.item == 'crystal') return { x: 172 * 2 + 1, z: 109 * 2 + 1 }; if (sp.t == 'collect' && sp.item == 'carrot') return { x: 143 * 2, z: 188 * 2 }; if (sp.t == 'collect' && sp.item == 'f_skewer') return O.stations[0]; if (sp.t == 'collect' && sp.item == 'fish') return O.fishes[1];
    return null;
  };
  function stepEnter(id) { var q = D.Q[id], st = qs(id), sp = q.steps[st.s]; if (sp.auto && sp.dlg) UI.dialog(D.DLG[sp.dlg], function () { advance(id); }); if (sp.pre) { st.pre = 1; UI.dialog(D.DLG[sp.pre]); } }
  function advance(id) {
    var s = S(), q = D.Q[id], st = s.q[id], sp = q.steps[st.s];
    if (sp.take) ST.take(sp.take); if (sp.give) for (var k in sp.give) G.loot(k, sp.give[k]); if (sp.join && !s.chars[sp.join]) { ST.addChar(sp.join); G.toast(D.CH[sp.join].name + '이(가) 파티에 합류했습니다!'); UI.dirty = true; } if (sp.flag) s.flags[sp.flag] = 1; if (sp.flag == 'altar') s.wps.wp_altar = 1;
    if (sp.rw) G.giveRewards(sp.rw); ST.addAR(150); AUD.sfx('quest');
    st.s++; var fin = st.s >= q.steps.length;
    var after = function () { if (fin) { st.done = true; st.s = q.steps.length - 1; ST.bump('quests', 1); var rw = G.giveRewards(q.rw); UI.questDone(q, rw); } else { UI.banner('임무 갱신', q.steps[st.s].txt); stepEnter(id); } UI.dirty = true; ST.save(); };
    if (sp.post) UI.dialog(D.DLG[sp.post], after); else after();
  }
  G.qEvent = function (type, id) { var s = S(); D.QUESTS.forEach(function (q) { var st = s.q[q.id]; if (!st || st.done) return; var sp = q.steps[st.s]; if (sp.t == type && (sp.id == null || sp.id == id)) advance(q.id); }); };
  G.qCheck = function () {
    var s = S(); if (G.mode != 'play') return;
    D.QUESTS.forEach(function (q) { var st = s.q[q.id]; if (!st || st.done) return; var sp = q.steps[st.s];
      if (sp.pre && !st.pre) { st.pre = 1; UI.dialog(D.DLG[sp.pre]); return; }
      if (sp.t == 'reach' && Math.hypot(W.town.x - P.x, W.town.z - P.z) < sp.r) advance(q.id);
      else if (sp.t == 'collect' && ST.cnt(sp.item) >= sp.n) advance(q.id);
      else if (sp.t == 'stat' && (s.stat[sp.k] || 0) >= sp.n) advance(q.id);
      else if (sp.t == 'statue' && s.statues[sp.id]) advance(q.id); else if (sp.t == 'camp' && s.camps[sp.id]) advance(q.id);
    });
  };
  function talk(id) {
    var s = S(), done = false;
    D.QUESTS.forEach(function (q) { if (done) return; var st = s.q[q.id]; if (!st && q.npc == id) { s.q[q.id] = st = { s: 0 }; G.toast('새 임무: ' + q.n); if (!s.track || s.q[s.track].done) s.track = q.id; } if (!st || st.done) return; var sp = q.steps[st.s];
      if ((sp.t == 'talk' || sp.t == 'gacha') && sp.npc == id && !sp.auto) { done = true; if (sp.take && !ST.can(sp.take)) { UI.dialog([[D.NPC[id].n, '아직 부탁한 걸 다 못 구한 모양이네.']]); return; } UI.dialog(D.DLG[sp.dlg], function () { if (sp.t == 'gacha') { UI.open('gacha'); } else advance(q.id); }); } });
    if (done) return;
    UI.dialog(D.DLG[id] || [[D.NPC[id].n, '…']], function () { var m = { neri: 'gacha', dora: ['book', 'daily'], smith: 'forge', alch: 'alchemy', shop: ['shop', 'general'], chef: 'cook' }[id]; if (m) { if (Array.isArray(m)) UI.open(m[0], m[1]); else UI.open(m); } });
  }
  G.onCampClear = function (c) { var s = S(); if (!s.camps[c.id]) { s.camps[c.id] = 1; G.toast('야영지 소탕! 잠긴 상자가 열렸습니다'); AUD.sfx('solve'); ST.addAR(60); } G.qEvent('camp', c.id); };
  G.onBossEngage = function (e) { AUD.music('boss'); UI.banner(e.def.n, '약점 원소: ' + e.armor.els.map(function (x) { return D.EL[x].n; }).join(' · ')); if (!e.inst) G.orbitCine(e.x, e.y + 2, e.z, 2.6, 16, 9, G.cam.yaw + 3.14 - .8, G.cam.yaw + 3.14 + .5, 2, 5, null, 8); AUD.sfx('roar'); };
  G.onBossDead = function (e) {
    var s = S(), id = e.def.id; ST.bump('bosses', 1); AUD.sfx('clear'); G.timeScale = .25; setTimeout(function () { G.timeScale = 1; }, 1400); G.orbitCine(e.x, e.y + 2, e.z, 2.6, 7, 13, G.cam.yaw + 3.14, G.cam.yaw + 3.14 + 2, 3, 7, function () { G.qEvent('boss', id); if (id == 'b_nox') { s.flags.noxDead = 1; ST.bump('nox', 1); } }, 10);
    for (var i = 0; i < 5; i++) setTimeout(function () { FX.boom(e.x + (Math.random() - .5) * 4, e.y + Math.random() * 3, e.z + (Math.random() - .5) * 4, e.def.el, 3); G.shakeAdd(.5); AUD.sfx('boom'); }, i * 300);
    if (!e.inst) dyn.push({ k: 'bloom', x: e.x, y: e.gy, z: e.z, until: G.t + 240, mat: e.def.mat });
  };
  // ───── 비경·첨탑 ─────
  G.startDomain = function (g) {
    var wl = ST.WL(), lvl = g.lvl + wl * 6, weekly = g.kind == 'weekly';
    G.enterInst({ kind: g.kind, id: g.id, name: g.name, sub: '권장 레벨 ' + lvl, lvl: lvl, boss: weekly, waves: weekly ? [['b_storm']] : D.DOMAIN_WAVES[g.id],
      onClear: function () { ST.bump('domains', 1); UI.open('domainResult', g); }, onFail: function () { G.toast('도전 실패'); G.exitInst(); } });
  };
  G.domainRewards = function (g) {
    var wl = ST.WL(), s = S(), cost = g.kind == 'weekly' ? 60 : 20; if (g.kind == 'weekly' && s.weekly == U.weekKey()) return '이번 주 보상은 이미 받았습니다'; if (!ST.useDew(cost)) return '여명의 이슬이 부족합니다 (' + cost + ' 필요)';
    var rw = { coin: 2000 + wl * 500, arxp: 100, xp2: 2 }, out;
    if (g.kind == 'art') { out = G.giveRewards(rw); for (var i = 0; i < 3; i++) { var r = Math.random(), rr = r < Math.min(.55, .1 + wl * .09 + (g.lvl > 20 ? .1 : 0)) ? 5 : r < .65 ? 4 : 3; var u = ST.genArt(U.pick(g.sets), rr), a = s.arts[u]; UI.loot('art', 1, D.SETS[a.set].n + ' ★' + a.r, a); } G.loot('polish', 3); }
    else if (g.kind == 'tal' || g.kind == 'wpn') { out = G.giveRewards(rw); var pre = g.kind == 'tal' ? 'tb_' : 'wm_', sets = D.DAYSET(); for (var j = 0; j < 2; j++) { var f = U.pick(sets); G.loot(pre + f + '1', 3); if (Math.random() < .6 + wl * .1) G.loot(pre + f + '2', 1 + (wl > 1 ? 1 : 0)); if (Math.random() < wl * .12) G.loot(pre + f + '3', 1); } }
    else { s.weekly = U.weekKey(); rw.xp3 = 2; rw.art = 2; rw.artR = 5; rw.gem = 60; G.giveRewards(rw); G.loot('w_storm', 2 + (Math.random() < .5 ? 1 : 0)); }
    AUD.sfx('chest'); return null;
  };
  G.startTower = function (fi) {
    var s = S(), f = D.TOWER[fi], A = s.party.slice(), B = s.partyB.filter(function (c) { return s.chars[c] && A.indexOf(c) < 0; }); if (!B.length) B = A.slice();
    var tw = { fi: fi, A: A, B: B, half: 0 };
    function heal(p) { p.forEach(function (id) { s.chars[id].hp = 1; s.chars[id].en = 0; }); }
    function end(ok) { var left = G.inst ? G.inst.t : 0; s.party = A; s.active = 0; ST.T = null; G.tower = null; var stars = !ok ? 0 : left >= D.TOWER_STAR[2] ? 3 : left >= D.TOWER_STAR[1] ? 2 : 1, prev = s.tower[fi] || 0, gain = 0; if (stars > prev) { gain = (stars - prev) * 50; s.tower[fi] = stars; ST.add('gem', gain); ST.add('coin', (stars - prev) * 5000); var tot = 0; for (var k in s.tower) tot += s.tower[k]; ST.setStat('towerStars', tot); } UI.open('towerResult', { fi: fi, stars: stars, left: left, gain: gain, ok: ok }); }
    heal(A); heal(B); G.tower = tw;
    G.enterInst({ kind: 'tower', id: 'tower' + fi, name: f.n, sub: f.cond, lvl: f.lvl, hpMul: f.hpMul || 1, mods: f.mods, timer: D.TOWER_TIME, waves: f.halves[0], noFood: true,
      onClear: function () { var c = G.inst; if (tw.half == 0) { tw.half = 1; s.party = B; s.active = 0; UI.dirty = true; c.waves = f.halves[1]; c.wi = -1; c.done = false; c.wait = 2; UI.banner('후반전', '두 번째 파티 출전'); G.teleport(W.arena.x, null, W.arena.z + 8); FX.boom(G.P.x, G.P.y, G.P.z, 'wind', 3); } else end(true); },
      onFail: function () { end(false); } });
  };
  // 저장 위치
  G.savePos = function () { var s = S(); if (!G.inst && G.P) s.pos = { x: G.P.safe.x, y: G.P.safe.y, z: G.P.safe.z }; };
})();
