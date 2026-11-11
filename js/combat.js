// 전투: 공격·스킬·필살기, 원소 반응, 적 AI, 보스, 투사체/장판, 환경 반응, 비경 인스턴스
(function () {
  var D = DATA, FX = G.FX, EC = G.EC, P;
  G.binds.push(function (p) { P = p; });
  function d2(a, b) { return Math.hypot(a.x - b.x, a.z - b.z); }
  function lvlBase(l) { return 14 + l * 4 + l * l * .16; }
  function hr(e) { return e.def.boss ? e.def.size * .42 : .5 * e.def.size; }
  G.seeds = [];
  // ───── 대상 찾기 ─────
  G.findTarget = function (maxR, from) {
    P = G.P; var best = null, bs = 1e9, o = from || P;
    for (var i = 0; i < G.ens.length; i++) { var e = G.ens[i]; if (e.dead) continue; var d = d2(e, o) - hr(e); if (d > maxR) continue; var ang = Math.abs(U.angDiff(Math.atan2(e.x - o.x, e.z - o.z), P.yaw)), s = d + ang * 2.5 + (e.def.animal ? 6 : 0); if (s < bs) { bs = s; best = e; } }
    return best;
  };
  function face(e) { if (e) P.yaw = Math.atan2(e.x - P.x, e.z - P.z); }
  function inArc(e, range, arc) { var d = d2(e, P) - hr(e); if (d > range) return false; if (arc >= 6) return true; if (d < .9) return true; return Math.abs(U.angDiff(Math.atan2(e.x - P.x, e.z - P.z), P.yaw)) < arc / 2 && Math.abs(e.y - P.y) < 3.5; }
  function atkEl(cid, kind) { var c = D.CH[cid]; if (c.wt == 'book') return c.el; if (P.infuse) return P.infuse.el; return 'phys'; }

  // ───── 입력 ─────
  G.combatInput = function (dt) {
    P = G.P; var inp = G.inp, S = ST.S, cid = G.cur(), c = D.CH[cid], wt = D.WT[c.wt];
    for (var i = 0; i < 4; i++) if (inp.p['sw' + i]) G.swap(i);
    if (P.castT > 0 || G.cine) return;
    if (inp.p.burst) G.useBurst(); if (inp.p.skill) G.useSkill();
    if (inp.p.atk) P.wantAtk = .28; else P.wantAtk = (P.wantAtk || 0) - dt;
    if (inp.h.atk) { P.holdT += dt; if (P.holdT > .42 && !P.caDone && P.state == 'ground' && P.st >= wt.caSt) { P.caDone = true; startAttack('ca'); } } else { P.holdT = 0; P.caDone = false; }
    if ((P.state == 'air' || P.state == 'glide') && inp.p.atk && !P.plunge && P.y - W.ground(P.x, P.z, P.y) > 1.3) { P.plunge = true; P.state = 'air'; P.anim = 'atk'; P.atkPhase = 1; AUD.sfx('swing'); }
    if (P.wantAtk > 0 && P.atkT <= 0 && P.state == 'ground' && P.dashT <= 0) { P.wantAtk = 0; startAttack('na'); }
  };
  function startAttack(kind) {
    var cid = G.cur(), c = D.CH[cid], wt = D.WT[c.wt], tg = G.findTarget(wt.range + 3);
    face(tg); P.atkKind = kind; P.atkHit = false; P.anim = 'atk'; P.at = 0; P.atkPhase = 0; P.atkTg = tg;
    if (kind == 'na') { var idx = P.comboT > 0 ? P.combo : 0; if (idx >= wt.na.length) idx = 0; P.atkIdx = idx; P.atkDur = .38 / wt.spd; P.atkAt = .13 / wt.spd; P.combo = idx + 1; P.comboT = P.atkDur + .6; P.atkLunge = (wt.arc && tg && d2(tg, P) > 1.6) ? .12 : 0; }
    else { P.atkDur = .6; P.atkAt = .28; P.atkLunge = 0; P.st = Math.max(0, P.st - wt.caSt); P.stWait = 1.2; P.combo = 0; }
    P.atkT = P.atkDur;
  }
  G.updateAttack = function (dt) {
    P.atkT -= dt; var el = P.atkDur - P.atkT; P.atkPhase = el < P.atkAt ? 0 : el < P.atkAt + .1 ? 1 : 2;
    if (!P.atkHit && el >= P.atkAt) { P.atkHit = true; doHit(); }
    if (P.atkT <= 0) { P.anim = 'idle'; }
  };
  function doHit() {
    var cid = G.cur(), c = D.CH[cid], wt = D.WT[c.wt], st = G.cst(cid), tm = ST.talMul(st.tal[0]), kind = P.atkKind, el = atkEl(cid), col = EC[el], fx = Math.sin(P.yaw), fz = Math.cos(P.yaw), any = 0;
    if (wt.arc) {
      var ca = kind == 'ca', range = wt.range * (ca ? 1.2 : 1), arc = ca ? 7 : wt.arc, mult = (ca ? wt.ca : wt.na[P.atkIdx]) * tm, last = ca || P.atkIdx == wt.na.length - 1;
      G.ens.forEach(function (e) { if (!e.dead && inArc(e, range, arc)) { G.hitEnemy(e, { cid: cid, mult: mult, el: el, kind: kind, w: ca ? 2 : 1, heavy: c.wt == 'claymore' || ca }); any++; } });
      FX.slash(P.x + fx * 1.2, P.y + .9, P.z + fz * 1.2, P.yaw + (P.atkIdx % 2 ? .5 : -.5), range * .55, col, (P.atkIdx % 2 ? .4 : -.4));
      if (ca) { FX.decal('ring', P.x, P.y, P.z, .5, range, .25, col); FX.slash(P.x - fx * 1.2, P.y + .9, P.z - fz * 1.2, P.yaw + 3.14, range * .55, col, .3); }
      AUD.sfx(c.wt == 'claymore' ? 'swingH' : 'swing'); if (any) { G.hitstop(last ? .075 : .04); G.shakeAdd(last ? .3 : .12); G.gainEnergy(last ? 2 : 1); }
      G.mineAt(P.x + fx * 1.4, P.z + fz * 1.4, c.wt == 'claymore' ? 3 : 1); if (el != 'phys') G.elemWorld(el, P.x + fx * 1.5, P.z + fz * 1.5, 1.6);
    } else {
      var tg = P.atkTg && !P.atkTg.dead ? P.atkTg : G.findTarget(wt.range), bow = c.wt == 'bow', ca2 = kind == 'ca', pel = bow ? (ca2 ? c.el : el) : c.el;
      var mult2 = (ca2 ? wt.ca : wt.na[P.atkIdx]) * tm;
      if (!bow && ca2) { var tx = tg ? tg.x : P.x + fx * 6, tz = tg ? tg.z : P.z + fz * 6, ty = tg ? tg.y : P.y; G.aoe(tx, ty, tz, 3, { cid: cid, mult: mult2, el: pel, kind: 'ca', w: 2 }); AUD.sfx('magic'); }
      else { G.shoot(cid, tg, { mult: mult2, el: pel, kind: kind, w: ca2 ? 2 : 1 }, bow, 0); AUD.sfx(bow ? 'bow' : 'magic'); }
    }
  }
  G.shoot = function (cid, tg, o, arrow, spread) {
    var sx = P.x + Math.sin(P.yaw) * .5, sy = P.y + 1, sz = P.z + Math.cos(P.yaw) * .5, dx, dy, dz, sp = arrow ? 36 : 17;
    if (tg) { dx = tg.x - sx; dy = tg.y + .7 * tg.sc + (tg.def.fly || 0) - sy; dz = tg.z - sz; } else { dx = Math.sin(P.yaw); dy = 0; dz = Math.cos(P.yaw); }
    var l = Math.hypot(dx, dy, dz) || 1; dx /= l; dy /= l; dz /= l; if (spread) { var a = Math.atan2(dx, dz) + spread; dx = Math.sin(a); dz = Math.cos(a); dy += .25; }
    o.cid = cid; G.projs.push({ x: sx, y: sy, z: sz, vx: dx * sp, vy: dy * sp, vz: dz * sp, el: o.el, o: o, own: 'p', tg: tg, home: !arrow || !!spread, arrow: arrow, life: 1.6, sp: sp });
  };
  G.aoe = function (x, y, z, r, o, quiet) { var n = 0; G.ens.forEach(function (e) { if (!e.dead && Math.hypot(e.x - x, e.z - z) - hr(e) < r && Math.abs(e.y - y) < 5) { G.hitEnemy(e, o); n++; } }); if (!quiet) FX.boom(x, y, z, o.el, r); if (o.el) G.elemWorld(o.el, x, z, r); G.mineAt(x, z, 2, r); return n; };
  G.plungeHit = function () { var cid = G.cur(), st = G.cst(cid), el = atkEl(cid), n = G.aoe(P.x, P.y, P.z, 3.6, { cid: cid, mult: 1.75 * ST.talMul(st.tal[0]), el: el, kind: 'plunge', w: 2, heavy: true }); G.shakeAdd(.6); G.hitstop(.08); AUD.sfx('boom'); P.anim = 'idle'; P.atkT = 0; if (n) G.gainEnergy(2); };
  G.giveShield = function (hp, el, t) { var s = G.cst(G.cur()); hp *= 1 + (s.m.shieldStr || 0) / 100; if (!P.shield || P.shield.hp < hp) P.shield = { hp: hp, max: hp, el: el, t: t }; };
  // ───── 스킬 ─────
  G.useSkill = function () {
    var cid = G.cur(), c = D.CH[cid], sk = c.skill, r = G.rtOf(cid), st = G.cst(cid), m = sk.m * ST.talMul(st.tal[1]), el = c.el, hits = 0;
    if (r.ch <= 0 || P.state == 'climb' || P.state == 'swim') { AUD.sfx('deny'); return; }
    if (r.ch >= G.maxCharges(cid)) r.chT = G.skillCd(cid); r.ch--;
    var tg = G.findTarget(14); face(tg); P.castT = .32; P.anim = 'cast'; P.at = 0; P.atkT = 0; AUD.sfx('skill'); AUD.el(el);
    var o = { cid: cid, mult: m, el: el, kind: 'skill', w: 3 }, fx = Math.sin(P.yaw), fz = Math.cos(P.yaw);
    if (sk.t == 'dash') {
      var dist = tg ? Math.min(8, d2(tg, P) + 2.5) : 7, sx = P.x, sz = P.z, hit = [];
      for (var i = 0; i < 12; i++) { var bx = P.x, bz = P.z; var b = W.ground(P.x + fx * dist / 12, P.z + fz * dist / 12, P.y + .6); if (b - P.y > .62 || P.y - b > 2.5 || (W.liquid(P.x + fx * dist / 12, P.z + fz * dist / 12) && W.liquid(P.x + fx * dist / 12, P.z + fz * dist / 12).depth > 1)) break; P.x += fx * dist / 12; P.z += fz * dist / 12; P.y = Math.max(b, P.y - .6) < b ? b : b; G.ens.forEach(function (e) { if (!e.dead && hit.indexOf(e) < 0 && d2(e, P) - hr(e) < sk.r) hit.push(e); }); FX.part(P.x, P.y + .7, P.z, EC[el], 2, 1.5, { life: .35 }); }
      hit.forEach(function (e) { G.hitEnemy(e, o); }); hits = hit.length; P.ifr = .45; FX.slash((sx + P.x) / 2, P.y + .9, (sz + P.z) / 2, P.yaw, dist * .5, EC[el], 0); FX.slash(P.x, P.y + .9, P.z, P.yaw + .6, sk.r * .8, EC[el], .5); G.elemWorld(el, P.x, P.z, sk.r);
      if (sk.infuse) P.infuse = { el: el, t: sk.infuse };
    } else if (sk.t == 'blast') { var tx = tg ? tg.x : P.x + fx * 6, tz = tg ? tg.z : P.z + fz * 6, ty = tg ? tg.y : W.ground(tx, tz, P.y + 2); FX.bolt(tx, ty + 9, tz, tx, ty, tz, EC[el], .16); hits = G.aoe(tx, ty, tz, sk.r, o); G.shakeAdd(.3); }
    else if (sk.t == 'volley') { var n = sk.n2 + (st.m.volley || 0); for (var k = 0; k < n; k++) G.shoot(cid, tg, { mult: m, el: el, kind: 'skill', w: 1.2, en: k == 0 }, true, (k - (n - 1) / 2) * .16); hits = 0; }
    else if (sk.t == 'shield') { hits = G.aoe(P.x, P.y, P.z, sk.r, o); G.giveShield(st.hp * sk.sh / 100 + st.def * 1.5, el, 16); G.shakeAdd(.3); }
    else if (sk.t == 'heal') { hits = G.aoe(P.x, P.y, P.z, sk.r, o); G.healParty(sk.heal * ST.talMul(st.tal[1]), st.hp * .02, true, cid); AUD.sfx('heal'); }
    if (hits) { G.gainEnergy(14, cid); G.hitstop(.06); }
  };
  // ───── 필살기 ─────
  G.useBurst = function () {
    var cid = G.cur(), c = D.CH[cid], bu = c.burst, r = G.rtOf(cid), cs = ST.S.chars[cid], cost = G.burstCost(cid);
    if ((cs.en || 0) < cost || r.cdB > 0 || P.state == 'climb' || P.state == 'swim') { AUD.sfx('deny'); return; }
    cs.en = 0; r.cdB = bu.cd; P.ifr = 2; P.castT = 1.1; P.anim = 'cast'; P.at = 0; P.atkT = 0; P.plunge = false;
    var tg = G.findTarget(16); face(tg); UI.cutin(cid, bu.n); AUD.sfx('burst'); G.timeScale = 0;
    G.orbitCine(P.x, P.y, P.z, .95, 2.6, 4.2, P.yaw + .5, P.yaw - .9, 1.2, 1.9, function () { G.timeScale = 1; G.cam.fov = 58; G.cam.d = 3; burstFx(cid, tg); }, -14);
  };
  function burstFx(cid, tg) {
    var c = D.CH[cid], bu = c.burst, st = G.cst(cid), m = bu.m * ST.talMul(st.tal[2]), el = c.el, fx = Math.sin(P.yaw), fz = Math.cos(P.yaw);
    if (tg && tg.dead) tg = G.findTarget(16);
    var tx = tg ? tg.x : P.x + fx * 4, tz = tg ? tg.z : P.z + fz * 4, ty = tg ? tg.y : W.ground(tx, tz, P.y + 2);
    AUD.sfx('boom'); AUD.el(el); G.shakeAdd(.9); G.hitstop(.1);
    if (bu.t == 'nuke') { for (var i = 0; i < 6; i++) { var a = i * 1.05; FX.bolt(tx + Math.cos(a) * 3, ty + 12, tz + Math.sin(a) * 3, tx + Math.cos(a) * bu.r * .5, ty, tz + Math.sin(a) * bu.r * .5, EC[el], .2); } G.aoe(tx, ty, tz, bu.r, { cid: cid, mult: m, el: el, kind: 'burst', w: 6, heavy: true }); FX.part(tx, ty + 1, tz, EC[el], 40, 9, { life: .9, size: .3 }); FX.decal('rune', tx, ty, tz, 1, bu.r, .6, EC[el]); if (bu.buff) { var b = Object.assign({}, bu.buff); delete b.dur; G.addBuff(b, bu.buff.dur, bu.n); } }
    else { var fl = bu.follow; G.aoe(fl ? P.x : tx, fl ? P.y : ty, fl ? P.z : tz, bu.r, { cid: cid, mult: m, el: el, kind: 'burst', w: 5 }); G.fields.push({ x: fl ? P.x : tx, y: fl ? P.y : ty, z: fl ? P.z : tz, r: bu.r, el: el, t: bu.dur, tick: bu.tick, tk: bu.tick, tm: bu.tm * ST.talMul(st.tal[2]), heal: bu.heal, follow: fl, pull: bu.pull, shred: bu.shred, cid: cid }); }
  }
  G.swap = function (i) {
    var S = ST.S, id = S.party[i]; if (!id || i == S.active || P.castT > 0 || G.cine) return; if (S.chars[id].hp <= 0) { G.toast(D.CH[id].name + '은(는) 쓰러져 있습니다'); return; } if (P.swapCd > 0) return;
    S.active = i; P.swapCd = .8; P.infuse = null; P.atkT = 0; P.combo = 0; P.anim = 'idle'; FX.part(P.x, P.y + .8, P.z, EC[D.CH[id].el], 16, 4, { life: .4 }); FX.decal('ring', P.x, P.y, P.z, .3, 1.8, .3, EC[D.CH[id].el]); AUD.sfx('swap'); UI.dirty = true;
  };

  // ───── 피해와 원소 반응 ─────
  function pop(e, name, el) { FX.num(e.x, e.y + 2.1 * e.sc + (e.def.boss ? 1.5 : 0), e.z, D.REACT[name], EC[el] || [255, 255, 255], 'r'); ST.bump('reacts', 1); AUD.sfx('react'); }
  function transHit(e, amt, el, name) { if (e.dead || e.invT > 0) return; var res = .1 - (e.shredT > 0 ? e.shred / 100 : 0), d = amt * (1 - res); if (e.shield && e.shield.g > 0) d *= .3; if (e.armor && e.armor.g > 0 && e.stun <= 0) d *= .5; dealt(e, d, el, false); } G.transHit = transHit;
  function aoeTrans(x, z, r, amt, el, skip) { G.ens.forEach(function (e) { if (!e.dead && e != skip && Math.hypot(e.x - x, e.z - z) - hr(e) < r) transHit(e, amt, el); }); }
  function clearAura(e) { e.aura = null; if (e.def.aura) e.auraCd = 2.5; }
  function applyEl(e, el, o) {
    if (el == 'phys') return 1; var a = e.aura && e.aura.t > 0 ? e.aura.el : null, st = G.cst(o.cid), em = st.em, rb = (st.m.reactBonus || 0) / 100, amp = 1 + 2.78 * em / (em + 1400) + rb, tr = (1 + 16 * em / (em + 2000) + rb) * lvlBase(st.lv);
    if (!a) { if (el != 'wind' && el != 'rock') e.aura = { el: el, t: 9 }; return 1; } if (a == el) { e.aura.t = Math.max(e.aura.t, 9); return 1; }
    function is(x, y) { return (a == x && el == y) || (a == y && el == x); }
    if (is('fire', 'water')) { pop(e, 'vapor', 'water'); clearAura(e); FX.part(e.x, e.y + 1, e.z, [230, 230, 240], 10, 3, { up: 3, life: .6, g: -1 }); return (el == 'water' ? 2 : 1.5) * amp; }
    if (is('fire', 'ice')) { pop(e, 'melt', 'fire'); clearAura(e); e.frozen = 0; return (el == 'fire' ? 2 : 1.5) * amp; }
    if (is('fire', 'elec')) { pop(e, 'overload', 'fire'); clearAura(e); FX.boom(e.x, e.y, e.z, 'fire', 3.2); aoeTrans(e.x, e.z, 3.2, tr * 2, 'fire'); G.shakeAdd(.35); if (!e.def.boss) { e.kx = (e.x - P.x) * .8; e.kz = (e.z - P.z) * .8; } return 1; }
    if (is('water', 'elec')) { pop(e, 'shock', 'elec'); e.shockT = 4.2; e.shockD = tr * 1.1; e.aura = { el: 'water', t: 4 }; return 1; }
    if (is('water', 'ice')) { pop(e, 'freeze', 'ice'); if (e.def.boss) e.slowT = 4; else e.frozen = 3.2; e.aura = { el: 'ice', t: 4 }; AUD.sfx('ice'); return 1; }
    if (is('ice', 'elec')) { pop(e, 'frag', 'ice'); clearAura(e); FX.boom(e.x, e.y, e.z, 'ice', 3); aoeTrans(e.x, e.z, 3, tr * .9, 'ice'); e.physShred = 9; return 1; }
    if (is('fire', 'grass')) { pop(e, 'burn', 'fire'); e.burnT = 5; e.burnD = tr * .45; e.aura = { el: 'fire', t: 5 }; return 1.15; }
    if (is('water', 'grass')) { pop(e, 'bloom', 'grass'); clearAura(e); G.seeds.push({ x: e.x + (Math.random() - .5) * 1.5, y: e.y, z: e.z + (Math.random() - .5) * 1.5, t: 1.1, d: tr * 2.4 }); return 1; }
    if (is('elec', 'grass')) { pop(e, 'spark', 'elec'); e.aura = { el: 'elec', t: 5 }; return 1.4 * amp; }
    if (el == 'wind' && a != 'grass' && a != 'wind' && a != 'rock') { pop(e, 'swirl', a); FX.decal('ring', e.x, e.y, e.z, .5, 4.2, .35, EC[a]); G.ens.forEach(function (o2) { if (!o2.dead && o2 != e && d2(o2, e) < 4.2) { transHit(o2, tr * .9, a); if (!o2.aura) o2.aura = { el: a, t: 7 }; } }); transHit(e, tr * .6, a); G.elemWorld(a, e.x, e.z, 3); return 1; }
    if (el == 'rock' && a != 'grass' && a != 'wind' && a != 'rock') { pop(e, 'cryst', 'rock'); G.giveShield(tr * .7 + st.def * .9, a, 12); FX.part(e.x, e.y + 1, e.z, EC[a], 8, 3, { sh: 'diamond', size: .25 }); return 1; }
    if (el != 'wind' && el != 'rock' && a != 'ice' || !e.frozen) { /* 반응 없음 */ }
    return 1;
  }
  function dealt(e, dmg, el, crit) {
    dmg = Math.max(1, Math.round(dmg)); e.hp -= dmg; e.flash = .1; e.aggro = true; if (e.state == 'idle') { e.state = 'chase'; }
    var c = EC[el] || EC.phys; FX.num(e.x, e.y + 1.3 * e.sc + (e.def.boss ? 2 : 0), e.z, dmg + (crit ? '!' : ''), c, crit ? 'c' : null);
    if (e.hp <= 0) kill(e);
  }
  G.hitEnemy = function (e, o) {
    if (e.dead || e.invT > 0) return 0; var st = G.cst(o.cid), m = st.m, el = o.el || 'phys';
    var rm = o.noReact ? 1 : applyEl(e, el, o); if (e.dead) return 0;
    var km = { na: 'naMult', ca: 'caMult', skill: 'skillMult', burst: 'burstMult', plunge: 'plungeMult' }[o.kind], bonus = (m.dmg || 0) + (m['d_' + el] || 0) + (m[km] || 0);
    var crit = Math.random() * 100 < st.cr, dmg = 2.2 * st.atk * o.mult * (1 + bonus / 100) * (crit ? 1 + st.cd / 100 : 1) * rm;
    dmg *= (st.lv + 100) / (st.lv + 100 + e.lvl + 100);
    var res = .1 - (e.shredT > 0 ? e.shred / 100 : 0); if (el == 'phys') res += (e.def.phyRes || 0) / 100 - (e.physShred > 0 ? .4 : 0); dmg *= res < 0 ? 1 - res / 2 : 1 - res;
    if (m.resShred && (o.kind == 'skill' || o.kind == 'burst')) { e.shredT = 8; e.shred = Math.max(e.shred || 0, m.resShred); }
    if (e.frozen > 0 && o.heavy && el == 'phys') { e.frozen = 0; FX.num(e.x, e.y + 2, e.z, D.REACT.shatter, EC.ice, 'r'); dmg *= 1.5; clearAura(e); FX.part(e.x, e.y + 1, e.z, EC.ice, 12, 5, { sh: 'diamond', size: .2 }); }
    if (e.shield && e.shield.g > 0) { var sh = e.shield, dec = el == sh.weak ? 14 : (el != 'phys' && el != sh.el ? 5 : o.heavy ? 3 : 1); sh.g -= dec * (o.w || 1); dmg *= .12; if (sh.g <= 0) { e.stun = 3; e.state = 'rec'; e.stT = 0; e.recT = 3; FX.num(e.x, e.y + 2.3, e.z, '방패 파괴!', [255, 240, 120], 'r'); FX.boom(e.x, e.y, e.z, sh.el, 2.5); AUD.sfx('break'); if (e.def.shield.el == 'grass') G.elemWorld('fire', e.x, e.z, 1); } }
    if (e.armor) { if (e.stun > 0) dmg *= 1.5; else if (e.armor.g > 0) { if (e.armor.els.indexOf(el) >= 0) { e.armor.g -= (o.w || 1) * 7; FX.part(e.x, e.y + 2, e.z, EC[el], 5, 4, { sh: 'star', size: .25 }); if (e.armor.g <= 0) { e.stun = 7; e.state = 'idle'; e.stT = 0; G.tele = G.tele.filter(function (t) { return t.src != e; }); FX.num(e.x, e.y + 4, e.z, '약점 노출!', [255, 240, 120], 'r'); FX.boom(e.x, e.y, e.z, el, 5); G.shakeAdd(.8); G.hitstop(.12); AUD.sfx('break'); } } dmg *= .45; } }
    if (!e.def.boss && !e.frozen && o.kind != 'burst') { var kl = d2(e, P) || 1, kb = o.heavy ? 2.2 : .9; e.kx = (e.x - P.x) / kl * kb / (e.def.size); e.kz = (e.z - P.z) / kl * kb / (e.def.size); }
    FX.part(e.x, e.y + .8 * e.sc, e.z, EC[el] || EC.phys, crit ? 7 : 4, 4, { life: .3, size: .16 }); AUD.sfx(crit ? 'crit' : 'hit');
    dealt(e, dmg, el, crit); return dmg;
  };
  function kill(e) {
    e.dead = true; e.deadT = 0; var def = e.def, S = ST.S; G.tele = G.tele.filter(function (t) { return t.src != e; });
    FX.part(e.x, e.y + .7, e.z, [255, 255, 255], 14, 4, { life: .6 }); AUD.sfx('kill'); G.gainEnergy(4); S.codex[def.id] = 1;
    if (def.animal) { G.loot(def.drop, 1 + (Math.random() < .4 ? 1 : 0)); if (def.id == 'bird') G.loot('feather', 1); return; }
    ST.bump('kills', 1); if (def.elite) ST.bump('elites', 1);
    if (e.noDrop) return;
    var t = e.lvl < 18 ? 1 : e.lvl < 38 ? (Math.random() < .6 ? 1 : 2) : (Math.random() < .5 ? 2 : 3), n = def.boss ? 4 : def.elite ? 2 : (Math.random() < .75 ? 1 : 0);
    if (n) G.loot(def.fam + t, n); G.loot('coin', Math.round((20 + e.lvl * 5) * (def.elite ? 3 : def.boss ? 20 : 1)));
    if (Math.random() < (def.elite ? .8 : .2)) G.loot(def.elite && e.lvl > 20 ? 'xp2' : 'xp1', 1); if (def.elite && Math.random() < .35) G.loot('polish', 1);
    ST.addAR(Math.ceil(def.xp / 6));
    if (def.boss) G.onBossDead(e);
  }

  // ───── 적 생성/AI ─────
  var AIS = { melee: { rng: 1.9, wind: .5, rec: .9, cd: 1.6 }, hop: { rng: 4.5, wind: .5, rec: 1.1, cd: 2 }, ranged: { rng: 13, keep: 8, wind: .8, rec: .8, cd: 2.4 }, caster: { rng: 12, keep: 7, wind: 1.3, rec: 1, cd: 3.2 }, charge: { rng: 8, wind: .6, rec: 1, cd: 2.6 }, flyer: { rng: 10, keep: 6, wind: .7, rec: .8, cd: 2.8 }, heavy: { rng: 3.6, wind: 1.2, rec: 1.4, cd: 3 }, animal: { rng: 0 }, boss: { rng: 0 } };
  G.spawnEnemy = function (id, x, z, o) {
    o = o || {}; var def = D.EN[id], reg = W.region(x, z), base = def.lvl || (D.REGION[reg] || { lvl: 1 }).lvl, lvl = o.lvl || base + ST.WL() * 6 + (def.elite ? 2 : 0);
    var hm = .7 * (1 + .1 * lvl + .012 * lvl * lvl), am = 1 + .08 * lvl + .004 * lvl * lvl, y = o.y != null ? o.y : W.ground(x, z, 99);
    var e = { def: def, x: x, y: y, gy: y, z: z, yaw: Math.random() * 6.28, hp: def.hp * hm * (o.hpMul || 1) * (AUTO.on && def.boss ? .8 : 1), atk: def.atk * am, lvl: lvl, state: 'idle', stT: 0, cd: 1 + Math.random() * 2, home: { x: x, z: z }, seed: Math.random() * 10, sc: def.boss ? def.size / 2.2 : def.size, aura: def.aura ? { el: def.aura, t: 1e9 } : null, shield: def.shield ? { el: def.shield.el, g: def.shield.g, max: def.shield.g, weak: def.shield.weak } : null, phase: 0, flash: 0, frozen: 0, stun: 0, invT: 0, kx: 0, kz: 0, group: o.group, inst: o.inst, noDrop: o.noDrop, pi: 0, wander: 0 };
    e.maxHp = e.hp; if (def.boss) e.armor = { g: 100, max: 100, els: def.final ? [def.weak[0]] : def.weak };
    G.ens.push(e); return e;
  };
  function eMove(e, dx, dz, sp, dt) {
    var l = Math.hypot(dx, dz); if (l < .01) return false; dx /= l; dz /= l; var nx = e.x + dx * sp * dt, nz = e.z + dz * sp * dt, g = W.ground(nx, nz, e.y + .7);
    if (!e.def.fly) { if (g - e.y > .75 || e.y - g > 3) return false; var lq = W.liquid(nx, nz); if (lq && lq.depth > .8 && !W.ice[W.cid(nx, nz)]) return false; }
    if (e.inst && Math.hypot(nx - W.arena.x, nz - W.arena.z) > 20) return false;
    e.x = nx; e.z = nz; e.yaw = Math.atan2(dx, dz); e.moving = true; return true;
  }
  function ePlayerHit(e, dmg, el) { G.hurtPlayer(dmg, el, e); }
  G.updateEnemies = function (dt) {
    P = G.P; var alive = ST.S.chars[G.cur()].hp > 0;
    G.boss = null;
    for (var i = G.ens.length - 1; i >= 0; i--) {
      var e = G.ens[i], def = e.def;
      if (e.dead) { e.deadT += dt; if (e.deadT > .7) G.ens.splice(i, 1); continue; }
      var d = d2(e, P); if (d > 95 && !e.inst) continue;
      e.flash -= dt; e.cd -= dt; e.moving = false; if (e.shredT > 0) e.shredT -= dt; if (e.physShred > 0) e.physShred -= dt; if (e.invT > 0) e.invT -= dt; if (e.slowT > 0) e.slowT -= dt;
      if (e.aura && e.aura.t < 1e8 && (e.aura.t -= dt) <= 0) e.aura = null; if (e.auraCd > 0 && (e.auraCd -= dt) <= 0 && !e.aura) e.aura = { el: def.aura, t: 1e9 };
      if (e.shockT > 0) { var b0 = Math.floor(e.shockT); e.shockT -= dt; if (Math.floor(e.shockT) < b0) { transHit(e, e.shockD, 'elec'); FX.bolt(e.x, e.y + 2.5, e.z, e.x, e.y, e.z, EC.elec, .08); if (e.dead) continue; } }
      if (e.burnT > 0) { var b1 = Math.floor(e.burnT * 2); e.burnT -= dt; if (Math.floor(e.burnT * 2) < b1) { transHit(e, e.burnD, 'fire'); FX.part(e.x, e.y + .8, e.z, EC.fire, 3, 2, { up: 2 }); if (e.dead) continue; } if (G.env.cur == 'rain') e.burnT = 0; }
      // 넉백·중력
      if (e.kx || e.kz) { var g0 = W.ground(e.x + e.kx * dt * 6, e.z + e.kz * dt * 6, e.y + .7); if (g0 - e.y < .75) { e.x += e.kx * dt * 6; e.z += e.kz * dt * 6; } e.kx *= Math.pow(.002, dt); e.kz *= Math.pow(.002, dt); if (Math.abs(e.kx) + Math.abs(e.kz) < .05) e.kx = e.kz = 0; }
      var gy = W.ground(e.x, e.z, e.y + .7); e.gy = gy; if (!e.leap) { if (e.y > gy) e.y = Math.max(gy, e.y - 14 * dt); else e.y = gy; }
      if (e.frozen > 0) { e.frozen -= dt; continue; }
      if (def.boss) { bossAI(e, dt, d, alive); continue; }
      if (e.stun > 0) { e.stun -= dt; continue; }
      var ai = AIS[def.ai], sp = def.spd * (e.slowT > 0 ? .5 : 1);
      if (def.animal) { if (d < 7) { e.state = 'flee'; e.stT = 1.5; } if (e.state == 'flee') { eMove(e, e.x - P.x, e.z - P.z, sp, dt) || eMove(e, e.z - P.z, P.x - e.x, sp, dt); if ((e.stT -= dt) <= 0) e.state = 'idle'; } else wander(e, dt, sp * .3); continue; }
      e.stT += dt;
      if (e.state == 'idle') { if (alive && (d < (e.aggro ? 40 : 13)) && Math.abs(P.y - e.y) < 8 && !G.safe) { e.state = 'chase'; e.aggro = true; if (!e.seen) { e.seen = 1; FX.num(e.x, e.y + 2, e.z, '!', [255, 220, 80], 'r'); } } else wander(e, dt, sp * .3); }
      else if (e.state == 'chase') {
        var hd = d2(e, e.home); if (!alive || d > 42 || (hd > 45 && !e.inst)) { e.state = 'return'; e.aggro = false; continue; }
        var keep = ai.keep || 0;
        if (keep && d < keep - 2.5) eMove(e, e.x - P.x, e.z - P.z, sp * .8, dt);
        else if (d > (keep ? ai.rng - 1.5 : ai.rng * .8 + hr(e))) { if (!eMove(e, P.x - e.x, P.z - e.z, sp, dt)) { var sd = (e.seed > 5 ? 1 : -1); eMove(e, (P.z - e.z) * sd, -(P.x - e.x) * sd, sp, dt); } }
        else e.yaw = Math.atan2(P.x - e.x, P.z - e.z);
        if (e.cd <= 0 && d < ai.rng + hr(e) && Math.abs(P.y - e.y) < 4) { e.state = 'wind'; e.stT = 0; e.yaw = Math.atan2(P.x - e.x, P.z - e.z); e.tx = P.x; e.tz = P.z; windStart(e, ai); }
      } else if (e.state == 'wind') { if (e.stT >= ai.wind) { e.state = 'rec'; e.stT = 0; e.recT = ai.rec; e.cd = ai.cd * (.8 + Math.random() * .5); strike(e, ai); } }
      else if (e.state == 'rec') {
        if (e.leap) { var L = e.leap; L.t += dt; var k = Math.min(1, L.t / L.dur); e.x = L.sx + (L.tx - L.sx) * k; e.z = L.sz + (L.tz - L.sz) * k; e.hopY = Math.sin(k * Math.PI) * L.h; if (k >= 1) { e.leap = null; e.hopY = 0; if (L.r) { FX.boom(e.x, e.y, e.z, def.el || 'phys', L.r); if (d2(e, P) < L.r + .3 && Math.abs(P.y - e.y) < 2) ePlayerHit(e, e.atk * 1.1, def.el); if (def.el) G.elemWorld(def.el, e.x, e.z, L.r); } } }
        if (e.stT >= e.recT) e.state = 'chase';
      } else if (e.state == 'return') { if (d2(e, e.home) < 2) { e.state = 'idle'; e.hp = e.maxHp; } else if (!eMove(e, e.home.x - e.x, e.home.z - e.z, sp, dt)) { e.x = e.home.x; e.z = e.home.z; e.y = W.ground(e.x, e.z, 99); } }
    }
    // 서로 밀어내기
    for (var a = 0; a < G.ens.length; a++) { var ea = G.ens[a]; if (ea.dead || ea.def.boss) continue; for (var b = a + 1; b < G.ens.length; b++) { var eb = G.ens[b]; if (eb.dead || eb.def.boss) continue; var dx = eb.x - ea.x, dz = eb.z - ea.z, l = Math.hypot(dx, dz), mn = (ea.def.size + eb.def.size) * .45; if (l < mn && l > .01) { var p = (mn - l) * .5; ea.x -= dx / l * p; ea.z -= dz / l * p; eb.x += dx / l * p; eb.z += dz / l * p; } } }
  };
  function wander(e, dt, sp) { e.wander -= dt; if (e.wander <= 0) { e.wander = 2 + Math.random() * 3; var a = Math.random() * 6.28; e.wx = Math.cos(a); e.wz = Math.sin(a); e.wgo = Math.random() < .5; if (d2(e, e.home) > 6) { e.wx = e.home.x - e.x; e.wz = e.home.z - e.z; e.wgo = true; } } if (e.wgo) eMove(e, e.wx, e.wz, sp, dt); }
  function addTele(o) { o.t = 0; G.tele.push(o); return o; }
  function windStart(e, ai) {
    var def = e.def, dx = Math.sin(e.yaw), dz = Math.cos(e.yaw);
    if (def.ai == 'heavy') addTele({ sh: 'c', x: e.x + dx * 2.2, z: e.z + dz * 2.2, y: e.y, r: 3.6, max: ai.wind, dmg: e.atk * 1.8, el: def.el, src: e });
    else if (def.ai == 'caster') addTele({ sh: 'c', x: P.x, z: P.z, y: P.y, r: 2.6, max: ai.wind, dmg: e.atk * 1.5, el: def.el, src: e });
    else if (def.ai == 'charge') addTele({ sh: 'l', x: e.x, z: e.z, x1: e.x + dx * 9, z1: e.z + dz * 9, y: e.y, hw: .9, max: ai.wind, dmg: e.atk * 1.2, el: def.el, src: e });
  }
  function strike(e, ai) {
    var def = e.def, d = d2(e, P), dx = Math.sin(e.yaw), dz = Math.cos(e.yaw);
    if (def.ai == 'melee') { AUD.sfx('swing'); FX.slash(e.x + dx, e.y + .8 * e.sc, e.z + dz, e.yaw, 1.3 * e.sc, def.el ? EC[def.el] : [255, 200, 200], .3); if (d < ai.rng + .9 + hr(e) && Math.abs(U.angDiff(Math.atan2(P.x - e.x, P.z - e.z), e.yaw)) < 1.1 && Math.abs(P.y - e.y) < 2) ePlayerHit(e, e.atk, def.el); }
    else if (def.ai == 'hop') e.leap = { sx: e.x, sz: e.z, tx: e.tx, tz: e.tz, t: 0, dur: .45, h: 1.6, r: 1.7 };
    else if (def.ai == 'charge') { e.leap = { sx: e.x, sz: e.z, tx: e.x + dx * 8.5, tz: e.z + dz * 8.5, t: 0, dur: .28, h: 0, r: 0 }; var g = W.ground(e.leap.tx, e.leap.tz, e.y + 1); if (Math.abs(g - e.y) > 1.5) { e.leap.tx = e.x + dx * 3; e.leap.tz = e.z + dz * 3; } }
    else if (def.ai == 'ranged' || def.ai == 'flyer') { var sy = e.y + 1 + (def.fly || 0), tx = P.x - e.x, ty = P.y + .8 - sy, tz = P.z - e.z, l = Math.hypot(tx, ty, tz) || 1, sp = def.ai == 'flyer' ? 9 : 17; G.projs.push({ x: e.x, y: sy, z: e.z, vx: tx / l * sp, vy: ty / l * sp, vz: tz / l * sp, el: def.el || 'phys', own: 'e', src: e, dmg: e.atk, arrow: def.ai == 'ranged', home: def.ai == 'flyer', life: 3, sp: sp, size: .4 }); AUD.sfx('bow'); }
  }
  // ───── 보스 ─────
  var BP = {
    b_root: [[['slam', 3.2, 1.2], ['line', 14, 1.5, 1.2], ['rain', 5, 2.2, 1.1]], [['nova', 7, 1.5], ['rain', 8, 2.2, 1], ['cross', 13, 1.3, 1.3], ['spawn', 'sl_grass', 2], ['slam', 3.6, .9]]],
    b_magma: [[['slam', 3.6, 1.2], ['line', 16, 2, 1.2], ['rain', 4, 2.6, 1.2]], [['nova', 8, 1.5], ['chase', 3, 3, .8], ['rain', 8, 2.4, 1], ['line', 18, 2.4, 1]]],
    b_frost: [[['rain', 6, 2.2, 1.1], ['line', 16, 1.6, 1.1], ['slam', 3.4, 1]], [['cross', 15, 1.5, 1.2], ['donut', 11, 4, 1.6], ['rain', 9, 2.2, .9], ['spawn', 'wolf', 2]]],
    b_storm: [[['line', 18, 1.8, 1], ['rain', 6, 2.3, 1], ['slam', 3.8, 1]], [['cross', 16, 1.6, 1.1], ['chase', 3, 3, .7], ['rain', 8, 2.3, .9]], [['nova', 8.5, 1.4], ['rain', 11, 2.3, .8], ['donut', 12, 4, 1.4], ['line', 20, 2.2, .8]]],
    b_nox: [[['slam', 4.6, 1.3], ['line', 20, 2.6, 1.3], ['nova', 9, 1.7], ['rain', 5, 2.6, 1.2]], [['rain', 9, 2.5, 1], ['cross', 19, 1.9, 1.2], ['chase', 3, 3.4, .75], ['spawn', 'wisp', 3], ['line', 22, 2.8, 1]], [['donut', 15, 5, 1.5], ['nova', 10, 1.3], ['rain', 13, 2.5, .8], ['cross', 20, 2.1, 1], ['chase', 4, 3.6, .65]]]
  };
  var PHN = { b_root: ['', '붉게 물든 고목'], b_magma: ['', '끓어오르는 용암'], b_frost: ['', '분노한 눈보라'], b_storm: ['', '뇌운의 날개', '폭풍 그 자체'], b_nox: ['갑주의 거신', '성운의 날개', '삼켜진 별'] };
  function bossAI(e, dt, d, alive) {
    var def = e.def, pats = BP[def.id][e.phase];
    if (e.bstate == null) { e.bstate = 'sleep'; }
    if (e.bstate == 'sleep') { if (alive && d < (e.inst ? 60 : 17) && !G.safe) { e.bstate = 'idle'; e.stT = 1.2; e.engaged = true; G.onBossEngage(e); } return; }
    G.boss = e; if (!alive || (!e.inst && d > 60)) { e.bstate = 'sleep'; e.hp = e.maxHp; e.phase = 0; e.armor.g = 100; e.engaged = false; G.tele = G.tele.filter(function (t) { return t.src != e; }); return; }
    // 단계 전환
    var np = e.phase + 1; if (np < def.phases.length && e.hp / e.maxHp <= def.phases[np]) { e.phase = np; e.invT = 2.4; e.stun = 0; e.bstate = 'idle'; e.stT = 2.6; e.state = 'idle'; e.armor.g = 100; if (def.final) e.armor.els = [def.weak[np]]; G.tele = G.tele.filter(function (t) { return t.src != e; }); G.shakeAdd(1); AUD.sfx('roar'); FX.boom(e.x, e.y, e.z, def.el, 8); UI.banner((np + 1) + '단계 · ' + PHN[def.id][np], '약점: ' + e.armor.els.map(function (x) { return D.EL[x].n; }).join('·')); G.orbitCine(e.x, e.y + 2, e.z, 2.2, 14, 9, G.cam.yaw + Math.PI, G.cam.yaw + Math.PI + 1.2, 3, 5, null, 8); return; }
    if (e.stun > 0) { e.stun -= dt; e.state = 'idle'; if (e.stun <= 0) { e.armor.g = 100; e.bstate = 'idle'; e.stT = 1; } return; }
    e.yaw += U.angDiff(Math.atan2(P.x - e.x, P.z - e.z), e.yaw) * Math.min(1, dt * 3);
    e.stT -= dt; var sl = e.slowT > 0 ? .5 : 1;
    if (e.bstate == 'idle') { e.state = 'idle'; if (def.id != 'b_root' && d > 7) eMove(e, P.x - e.x, P.z - e.z, 2.2 * sl, dt); if (e.stT <= 0) { var p = pats[e.pi % pats.length]; e.pi++; bossAtk(e, p); } }
    else if (e.bstate == 'wind') { e.state = 'wind'; if (e.stT <= 0) { e.bstate = 'rec'; e.stT = .9; } }
    else if (e.bstate == 'rec') { e.state = 'strike'; if (e.stT <= 0) { e.bstate = 'idle'; e.stT = (1.5 - e.phase * .25) / sl; } }
  }
  function bossAtk(e, p) {
    var def = e.def, k = p[0], el = def.el == 'phys' ? ['fire', 'ice', 'elec'][e.phase] : def.el, dm = e.atk, y = e.y, dx = P.x - e.x, dz = P.z - e.z, l = Math.hypot(dx, dz) || 1, wind = 1.2; dx /= l; dz /= l;
    if (k == 'slam') { wind = p[2]; addTele({ sh: 'c', x: P.x, z: P.z, y: P.y, r: p[1], max: wind, dmg: dm * 1.6, el: el, src: e }); }
    else if (k == 'nova') { wind = p[2]; addTele({ sh: 'c', x: e.x, z: e.z, y: y, r: p[1], max: wind, dmg: dm * 1.9, el: el, src: e }); }
    else if (k == 'line') { wind = p[3]; addTele({ sh: 'l', x: e.x, z: e.z, x1: e.x + dx * p[1], z1: e.z + dz * p[1], y: P.y, hw: p[2], max: wind, dmg: dm * 1.7, el: el, src: e }); }
    else if (k == 'cross') { wind = p[3]; var a0 = Math.atan2(dx, dz); for (var i = 0; i < 4; i++) { var a = a0 + i * Math.PI / 2 + (e.pi % 2 ? .785 : 0); addTele({ sh: 'l', x: e.x, z: e.z, x1: e.x + Math.sin(a) * p[1], z1: e.z + Math.cos(a) * p[1], y: P.y, hw: p[2], max: wind, dmg: dm * 1.6, el: el, src: e }); } }
    else if (k == 'rain') { wind = p[3] + p[1] * .12; for (var j = 0; j < p[1]; j++) { var ra = Math.random() * 6.28, rr = j == 0 ? 0 : 2 + Math.random() * 8; addTele({ sh: 'c', x: P.x + Math.cos(ra) * rr, z: P.z + Math.sin(ra) * rr, y: P.y, r: p[2], max: p[3] + j * .16, dmg: dm * 1.3, el: el, src: e }); } }
    else if (k == 'chase') { wind = p[3] * p[1]; for (var c = 0; c < p[1]; c++) addTele({ sh: 'c', x: P.x, z: P.z, y: P.y, r: p[2], max: p[3] * (c + 1), dmg: dm * 1.5, el: el, src: e, follow: p[3] * c }); }
    else if (k == 'donut') { wind = p[3]; addTele({ sh: 'd', x: e.x, z: e.z, y: y, r: p[1], r0: p[2], max: wind, dmg: dm * 2, el: el, src: e }); }
    else if (k == 'spawn') { wind = .8; var cnt = G.ens.filter(function (x) { return !x.dead && x.summ == e; }).length; if (cnt < 4) for (var s = 0; s < p[2]; s++) { var sa = Math.random() * 6.28, m = G.spawnEnemy(p[1], e.x + Math.cos(sa) * 5, e.z + Math.sin(sa) * 5, { lvl: e.lvl - 4, noDrop: true, inst: e.inst }); m.summ = e; m.state = 'chase'; m.aggro = true; FX.boom(m.x, m.y, m.z, m.def.el || 'phys', 1.5); } }
    e.bstate = 'wind'; e.stT = wind; AUD.sfx('warn');
  }
  G.updateTele = function (dt) {
    for (var i = G.tele.length - 1; i >= 0; i--) {
      var t = G.tele[i]; t.t += dt; if (t.follow != null && t.t < t.follow + .25) { t.x = P.x; t.z = P.z; t.y = P.y; }
      if (t.t < t.max) continue; G.tele.splice(i, 1);
      var hit = false, dy = Math.abs(P.y - t.y) < 3.5;
      if (t.sh == 'c') { hit = Math.hypot(P.x - t.x, P.z - t.z) < t.r; FX.boom(t.x, t.y, t.z, t.el || 'phys', t.r); if (t.el == 'elec') FX.bolt(t.x, t.y + 14, t.z, t.x, t.y, t.z, EC.elec, .2); }
      else if (t.sh == 'd') { var dd = Math.hypot(P.x - t.x, P.z - t.z); hit = dd < t.r && dd > t.r0; FX.decal('ring', t.x, t.y, t.z, t.r0, t.r, .4, EC[t.el] || [255, 80, 60]); for (var a = 0; a < 12; a++) FX.part(t.x + Math.cos(a * .52) * (t.r0 + t.r) / 2, t.y + .5, t.z + Math.sin(a * .52) * (t.r0 + t.r) / 2, EC[t.el] || [255, 80, 60], 4, 5, {}); }
      else { var vx = t.x1 - t.x, vz = t.z1 - t.z, ll = vx * vx + vz * vz, k = U.clamp(((P.x - t.x) * vx + (P.z - t.z) * vz) / ll, 0, 1); hit = Math.hypot(P.x - t.x - vx * k, P.z - t.z - vz * k) < t.hw; for (var s = 0; s <= 5; s++) FX.part(t.x + vx * s / 5, t.y + .5, t.z + vz * s / 5, EC[t.el] || [255, 120, 80], 5, 5, {}); }
      G.shakeAdd(t.r > 4 ? .6 : .3); AUD.sfx('boom');
      if (hit && dy) G.hurtPlayer(t.dmg, t.el, t.src);
      if (t.both) aoeTrans(t.x, t.z, t.r, t.edmg, t.el || 'elec');
      if (t.el && t.sh == 'c') G.elemWorld(t.el, t.x, t.z, t.r);
    }
  };
  // ───── 투사체·장판·씨앗·불 ─────
  G.updateProjs = function (dt) {
    for (var i = G.projs.length - 1; i >= 0; i--) {
      var p = G.projs[i]; p.life -= dt; var dead = p.life <= 0;
      if (p.home) { var tx, ty, tz; if (p.own == 'p') { if (p.tg && !p.tg.dead) { tx = p.tg.x; ty = p.tg.y + .7 * p.tg.sc + (p.tg.def.fly || 0); tz = p.tg.z; } } else { tx = P.x; ty = P.y + .8; tz = P.z; } if (tx != null) { var dx = tx - p.x, dy = ty - p.y, dz = tz - p.z, l = Math.hypot(dx, dy, dz) || 1, k = Math.min(1, dt * (p.own == 'p' ? 9 : 1.6)); p.vx += (dx / l * p.sp - p.vx) * k; p.vy += (dy / l * p.sp - p.vy) * k; p.vz += (dz / l * p.sp - p.vz) * k; } }
      p.x += p.vx * dt; p.y += p.vy * dt; p.z += p.vz * dt;
      if (p.own == 'p') { for (var j = 0; j < G.ens.length; j++) { var e = G.ens[j]; if (e.dead) continue; var ey = e.y + (e.def.fly || 0); if (Math.hypot(e.x - p.x, e.z - p.z) < hr(e) + .45 && p.y > ey - .3 && p.y < ey + 2.2 * e.sc + (e.def.boss ? 3 : 0)) { G.hitEnemy(e, p.o); if (p.o.en || p.o.kind == 'skill') { if (!p.o.gave) G.gainEnergy(p.o.en ? 14 : 0, p.o.cid); p.o.gave = 1; } else if (p.o.kind == 'na') G.gainEnergy(1); if (p.o.el != 'phys') G.elemWorld(p.o.el, p.x, p.z, 1.2); dead = true; break; } } }
      else if (Math.hypot(P.x - p.x, P.z - p.z) < .6 && p.y > P.y - .2 && p.y < P.y + 1.8) { G.hurtPlayer(p.dmg, p.el, p.src); dead = true; }
      if (p.y < W.ground(p.x, p.z, p.y + 1)) { dead = true; if (p.el != 'phys') G.elemWorld(p.el, p.x, p.z, 1.2); }
      if (dead) { FX.part(p.x, p.y, p.z, EC[p.el] || EC.phys, 4, 2.5, { life: .3 }); G.projs.splice(i, 1); }
    }
    for (var f = G.fields.length - 1; f >= 0; f--) {
      var fd = G.fields[f]; fd.t -= dt; fd.tk -= dt; if (fd.follow) { fd.x = P.x; fd.y = P.y; fd.z = P.z; }
      if (fd.tk <= 0) { fd.tk += fd.tick; var n = G.aoe(fd.x, fd.y, fd.z, fd.r, { cid: fd.cid, mult: fd.tm, el: fd.el, kind: 'burst', w: 1.5 }, true); if (n) { G.gainEnergy(1, fd.cid); FX.decal('ring', fd.x, fd.y, fd.z, fd.r * .4, fd.r, .3, EC[fd.el], .6); } if (fd.heal && Math.hypot(P.x - fd.x, P.z - fd.z) < fd.r + 1) G.healParty(fd.heal, 0, false, fd.cid); if (fd.shred) G.ens.forEach(function (e) { if (!e.dead && Math.hypot(e.x - fd.x, e.z - fd.z) < fd.r) { e.shredT = 2; e.shred = Math.max(e.shred || 0, fd.shred); } }); }
      if (fd.pull) G.ens.forEach(function (e) { if (!e.dead && !e.def.boss && e.frozen <= 0) { var dx = fd.x - e.x, dz = fd.z - e.z, l = Math.hypot(dx, dz); if (l < fd.r + 2 && l > .6) eMove(e, dx, dz, 4, dt); } });
      if (fd.t <= 0) G.fields.splice(f, 1);
    }
    for (var s = G.seeds.length - 1; s >= 0; s--) { var sd = G.seeds[s]; sd.t -= dt; R.px && FX.part(sd.x, sd.y + .3, sd.z, EC.grass, Math.random() < .3 ? 1 : 0, .5, { up: 1 }); if (sd.t <= 0) { G.seeds.splice(s, 1); FX.boom(sd.x, sd.y, sd.z, 'grass', 3); aoeTrans(sd.x, sd.z, 3, sd.d, 'grass'); AUD.sfx('boom'); } }
    for (var q = G.fires.length - 1; q >= 0; q--) {
      var fr = G.fires[q]; fr.t -= dt; fr.tk -= dt;
      if (fr.tk <= 0) { fr.tk = .8; G.ens.forEach(function (e) { if (!e.dead && Math.hypot(e.x - fr.x, e.z - fr.z) < 1.6 && Math.abs(e.y - fr.y) < 2 && !e.def.fly) { transHit(e, lvlBase(ST.S.chars[G.cur()].lv) * .35, 'fire'); if (!e.aura) e.aura = { el: 'fire', t: 4 }; } }); if (Math.hypot(P.x - fr.x, P.z - fr.z) < 1.3 && Math.abs(P.y - fr.y) < 1) G.hurtPlayer(0, 'fire', null, .03); if (!fr.spread && fr.t < 4.5 && fr.gen < 3) { fr.spread = 1;[[2, 0], [-2, 0], [0, 2], [0, -2]].forEach(function (o) { if (Math.random() < .45) ignite(fr.x + o[0], fr.z + o[1], fr.gen + 1); }); } }
      if (fr.t <= 0) G.fires.splice(q, 1);
    }
  };
  function ignite(x, z, gen) { var id = W.cid(x, z); if (!W.gset[id] || W.burnt[id] > G.t || G.env.cur == 'rain' || G.env.cur == 'thunder') return; W.burnt[id] = G.t + 40; G.fires.push({ x: (id % 256) * 2 + 1, z: Math.floor(id / 256) * 2 + 1, y: W.ground(x, z, 99), t: 6, tk: .4, gen: gen || 0 }); }
  // 원소가 지형에 닿았을 때
  G.elemWorld = function (el, x, z, r) {
    if (el == 'fire') { for (var a = -r; a <= r; a += 2) for (var b = -r; b <= r; b += 2) if (a * a + b * b <= r * r + 1) ignite(x + a, z + b, 0); G.onElemHit && G.onElemHit('fire', x, z, r); }
    else if (el == 'ice') { var any = false; for (var a2 = -r; a2 <= r; a2 += 2) for (var b2 = -r; b2 <= r; b2 += 2) { if (a2 * a2 + b2 * b2 > r * r + 1) continue; var lq = W.liquid(x + a2, z + b2); if (lq && !lq.lava) { W.ice[W.cid(x + a2, z + b2)] = { y: lq.y + .1, until: G.t + 12 }; any = true; } } if (any) { AUD.sfx('ice'); var pl = W.ice[W.cid(P.x, P.z)]; if (pl && P.state == 'swim') { P.y = pl.y; P.state = 'ground'; } } G.onElemHit && G.onElemHit('ice', x, z, r); }
    else if (el == 'elec') { var lq2 = W.liquid(x, z); if (lq2 && !lq2.lava) { FX.decal('ring', x, lq2.y, z, 1, r + 4, .4, EC.elec); G.ens.forEach(function (e) { var l = W.liquid(e.x, e.z); if (!e.dead && l && Math.hypot(e.x - x, e.z - z) < r + 4) transHit(e, lvlBase(ST.S.chars[G.cur()].lv) * .8, 'elec'); }); if (P.state == 'swim' && Math.hypot(P.x - x, P.z - z) < r + 4) { G.hurtPlayer(0, 'elec', null, .08); G.toast('물에 번개가 흘러 감전되었습니다!'); } } G.onElemHit && G.onElemHit('elec', x, z, r); }
    else G.onElemHit && G.onElemHit(el, x, z, r);
  };
  G.weatherTick = function (w, reg) {
    var wet = w == 'rain' || w == 'thunder';
    if (wet) { G.fires.length = 0; G.ens.forEach(function (e) { if (!e.dead && !e.aura && !e.def.aura && !e.inst && d2(e, P) < 45) e.aura = { el: 'water', t: 4 }; }); if (!P.aura && P.state != 'swim') P.aura = { el: 'water', t: 3.5 }; }
    if (w == 'snow') { G.ens.forEach(function (e) { if (!e.dead && !e.aura && !e.def.aura && d2(e, P) < 45) e.aura = { el: 'ice', t: 4 }; }); if (!P.aura) P.aura = { el: 'ice', t: 3 }; }
    if (P.state == 'swim' && !P.aura) P.aura = { el: 'water', t: 3 };
  };
  G.lightning = function () {
    var cands = G.ens.filter(function (e) { return !e.dead && !e.inst && d2(e, P) < 28; }), x, z, y;
    if (cands.length && Math.random() < .6) { var e = U.pick(cands); x = e.x; z = e.z; y = e.y; } else { var a = Math.random() * 6.28, r = 3 + Math.random() * 9; x = P.x + Math.cos(a) * r; z = P.z + Math.sin(a) * r; y = W.ground(x, z, 99); }
    var lv = ST.S.chars[G.cur()].lv; addTele({ sh: 'c', x: x, z: z, y: y, r: 2.4, max: 1.1, dmg: 25 * (1 + lv * .12), el: 'elec', both: true, edmg: lvlBase(lv) * 2.5, src: { lvl: lv } });
    setTimeout(function () { G.env.flash = .8; AUD.sfx('thunder'); }, 1000);
  };
  // ───── 플레이어 피격 ─────
  G.hurtPlayer = function (amt, el, src, pct, noShield) {
    P = G.P; var S = ST.S, cid = G.cur(), c = S.chars[cid]; if (G.cine || c.hp <= 0 || G.mode != 'play') return; if (!pct && P.ifr > 0) return;
    var st = G.cst(cid), dmg, name = null;
    if (pct) dmg = st.hp * pct; else {
      dmg = amt * (1 - st.def / (st.def + 5 * (src ? src.lvl : 1) + 500));
      if (el && el != 'phys') { var a = P.aura && P.aura.el; if (a && a != el) { var pr = [a, el].sort().join('+'); if (pr == 'ice+water') { name = 'freeze'; P.frozen = 1.6; AUD.sfx('ice'); } else if (pr == 'fire+water') { name = 'vapor'; dmg *= 1.5; } else if (pr == 'fire+ice') { name = 'melt'; dmg *= 1.5; } else if (pr == 'elec+water') { name = 'shock'; dmg *= 1.35; } else if (pr == 'elec+fire') { name = 'overload'; dmg *= 1.4; } else if (pr == 'elec+ice') { name = 'frag'; dmg *= 1.3; } if (name) { P.aura = null; FX.num(P.x, P.y + 2.3, P.z, D.REACT[name], EC[el], 'r'); } else P.aura = { el: el, t: 6 }; } else P.aura = { el: el, t: 6 }; }
      if (P.shield && !noShield) { var ab = Math.min(P.shield.hp, dmg); P.shield.hp -= ab; dmg -= ab; FX.part(P.x, P.y + 1, P.z, EC[P.shield.el], 5, 3, { sh: 'diamond' }); AUD.sfx('block'); if (dmg <= 0) return; }
    }
    if (AUTO.on) dmg *= .3;
    c.hp = Math.max(0, c.hp - dmg / st.hp); FX.num(P.x, P.y + 1.9, P.z, '-' + Math.round(dmg), [255, 90, 90], 'p'); P.hitT = .35; if (P.castT <= 0 && P.atkT <= 0) { P.anim = 'hit'; P.at = 0; } G.shakeAdd(.3); AUD.sfx('hurt'); if (!pct) P.ifr = .45; UI.hurtFlash();
    if (P.state == 'climb' || P.state == 'glide') { P.state = 'air'; P.fallTop = P.y; }
    if (c.hp <= 0) { P.state = P.state == 'swim' ? 'swim' : 'ground'; AUD.sfx('down'); }
  };
  G.onDown = function () {
    var S = ST.S; for (var i = 0; i < S.party.length; i++) if (S.chars[S.party[i]].hp > 0) { S.active = i; P.downT = 0; P.anim = 'idle'; P.ifr = 1.5; UI.dirty = true; return; }
    G.wipe();
  };
  // ───── 무리·보스 스폰 ─────
  G.groups = []; G.bossSlots = {};
  G.initGroups = function () {
    G.groups = []; W.o.spawns.forEach(function (s) { G.groups.push({ id: s.id, x: s.x, z: s.z, mobs: s.mobs, state: 'off', deadAt: -1e9, list: [] }); });
    W.o.camps.forEach(function (s) { G.groups.push({ id: s.id, x: s.x, z: s.z, mobs: s.mobs, camp: s, state: 'off', deadAt: -1e9, list: [] }); });
    W.o.animals.forEach(function (s) { G.groups.push({ id: s.id, x: s.x, z: s.z, mobs: [s.mob], state: 'off', deadAt: -1e9, list: [], animal: 1 }); });
    for (var k in W.bossPos) G.bossSlots[k] = { id: k, x: W.bossPos[k].x, z: W.bossPos[k].z, e: null, deadAt: -1e9 };
    G.bossSlots.b_nox = { id: 'b_nox', x: W.altar.x, z: W.altar.z, e: null, deadAt: -1e9 };
  };
  G.updateGroups = function () {
    G.groups.forEach(function (g) {
      var d = Math.hypot(g.x - P.x, g.z - P.z);
      if (g.state == 'off' && d < 72 && G.t - g.deadAt > 300) { g.state = 'on'; g.list = g.mobs.map(function (m, i) { var a = i * 2.1 + g.x, r = 1.5 + i * .9, x = g.x + Math.cos(a) * r, z = g.z + Math.sin(a) * r; if (W.liquid(x, z) || Math.abs(W.ground(x, z, 99) - W.ground(g.x, g.z, 99)) > 1.5) { x = g.x; z = g.z; } return G.spawnEnemy(m, x, z, { group: g }); }); }
      else if (g.state == 'on') { var all = g.list.every(function (e) { return e.dead; }); if (all) { g.state = 'off'; g.deadAt = G.t; g.list = []; if (g.camp) G.onCampClear(g.camp); } else if (d > 115) { g.list.forEach(function (e) { var i = G.ens.indexOf(e); if (i >= 0) G.ens.splice(i, 1); }); g.list = []; g.state = 'off'; } }
    });
    for (var k in G.bossSlots) { var b = G.bossSlots[k], d = Math.hypot(b.x - P.x, b.z - P.z); if (k == 'b_nox' && (!ST.S.flags.altar || (ST.S.flags.noxDead && G.t - b.deadAt > 1e8))) continue; if (!b.e && d < 80 && G.t - b.deadAt > 150) { b.e = G.spawnEnemy(k, b.x, b.z, {}); b.e.slot = b; } else if (b.e && b.e.dead) { b.e = null; b.deadAt = G.t; } else if (b.e && d > 120) { var i = G.ens.indexOf(b.e); if (i >= 0) G.ens.splice(i, 1); b.e = null; } }
  };
  // ───── 인스턴스(비경·주간 보스·첨탑) ─────
  G.enterInst = function (cfg) {
    cfg.ret = { x: P.x, y: P.y, z: P.z }; cfg.wi = -1; cfg.t = cfg.timer || 0; cfg.wait = 1.2;
    UI.transition('iris', function () { G.inst = cfg; G.tele = []; G.fields = []; G.projs = []; G.teleport(W.arena.x, null, W.arena.z + 8); G.cam.yaw = Math.PI; P.yaw = Math.PI; ST.temp.mods = cfg.mods || null; ST.ver++; G.orbitCine(W.arena.x, P.y, W.arena.z, 2, 16, 9, 0, .8, 9, 4, null, 6); UI.banner(cfg.name, cfg.sub || ''); AUD.music(cfg.boss ? 'boss' : 'battle'); });
  };
  G.updateInst = function (dt) {
    var c = G.inst; if (!c || c.done) return;
    if (c.timer) { c.t -= dt; if (c.t <= 0) { c.done = true; c.onFail && c.onFail('time'); return; } }
    var left = G.ens.filter(function (e) { return e.inst && !e.dead && !e.summ; }).length;
    if (left == 0) { c.wait -= dt; if (c.wait <= 0) { c.wi++; c.wait = 1.2; if (c.wi >= c.waves.length) { c.done = true; AUD.sfx('clear'); c.onClear(); } else { c.waves[c.wi].forEach(function (m, i) { var a = i * 6.28 / c.waves[c.wi].length + c.wi, r = D.EN[m].boss ? 0 : 6; var e = G.spawnEnemy(m, W.arena.x + Math.cos(a) * r, W.arena.z - 3 + Math.sin(a) * r, { lvl: c.lvl + (D.EN[m].elite ? 2 : 0), inst: true, hpMul: c.hpMul, noDrop: !D.EN[m].boss }); e.state = 'chase'; e.aggro = true; FX.boom(e.x, e.y, e.z, e.def.el || 'phys', 1.5); }); if (c.waves.length > 1) G.toast((c.wi + 1) + ' / ' + c.waves.length + ' 웨이브'); } } }
  };
  G.exitInst = function (cb) { var c = G.inst; if (!c) return; UI.transition('iris', function () { G.ens = G.ens.filter(function (e) { return !e.inst; }); G.inst = null; G.tele = []; G.fields = []; ST.temp.mods = null; ST.ver++; G.teleport(c.ret.x, c.ret.y, c.ret.z); G.boss = null; if (cb) cb(); }); };
  G.wipe = function () {
    var S = ST.S; if (G.inst) { var c = G.inst; if (!c.done) { c.done = true; S.party.forEach(function (id) { S.chars[id].hp = .35; }); S.active = 0; c.onFail && c.onFail('wipe'); } return; }
    UI.transition('fade', function () { S.party.forEach(function (id) { S.chars[id].hp = .4; }); S.active = 0; var best = W.o.wps[0], bd = 1e9; W.o.wps.forEach(function (w) { if (S.wps[w.id]) { var d = Math.hypot(w.x - P.x, w.z - P.z); if (d < bd) { bd = d; best = w; } } }); G.teleport(best.x + 2, null, best.z + 2); P.anim = 'idle'; P.downT = 0; G.ens.forEach(function (e) { e.aggro = false; if (!e.dead && e.state != 'idle') e.state = 'return'; }); G.tele = []; G.toast('파티가 전멸해 가까운 별문으로 돌아왔습니다'); });
  };
})();
