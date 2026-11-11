// 게임 코어: 플레이어 이동(달리기·점프·벽 타기·활공·수영), 카메라, 환경, 효과, 장면 그리기
var G = { t: 0, dt: 0, mode: 'title', ens: [], projs: [], fields: [], parts: [], nums: [], tele: [], decals: [], slashes: [], bolts: [], fires: [], freeze: 0, shake: 0, inst: null, boss: null, rt: {}, buffs: [], sight: false, photo: false, cine: null, timeScale: 1,
  inp: { mx: 0, mz: 0, p: {}, h: {} }, cam: { yaw: Math.PI, pitch: .38, dist: 7.5, d: 7.5 }, env: { weather: { meadow: 'clear', town: 'clear' }, wT: { meadow: 100, town: 100 }, flash: 0, cur: 'clear' } };
var W;
G.binds = [];
(function () {
  var D = DATA, P;
  var EC = {}; for (var k in D.EL) EC[k] = U.hex(D.EL[k].c); G.EC = EC;
  // ───── 효과 ─────
  var FX = G.FX = {
    part: function (x, y, z, c, n, sp, o) { o = o || {}; for (var i = 0; i < n && G.parts.length < 700; i++) { var a = Math.random() * 6.283, b = Math.random() * 2 - .4, s = sp * (.4 + Math.random() * .8); G.parts.push({ x: x, y: y, z: z, vx: Math.cos(a) * s, vy: (o.up || 0) + b * s, vz: Math.sin(a) * s, life: 0, max: (o.life || .5) * (.6 + Math.random() * .7), size: o.size || .14, c: c, g: o.g == null ? 9 : o.g, sh: o.sh }); } },
    num: function (x, y, z, txt, c, big) { G.nums.push({ x: x + (Math.random() - .5) * .8, y: y, z: z + (Math.random() - .5) * .8, txt: txt, c: c, life: 0, big: big }); if (G.nums.length > 60) G.nums.shift(); },
    decal: function (sh, x, y, z, r0, r1, life, c, a) { G.decals.push({ sh: sh, x: x, y: y + .08, z: z, r0: r0, r1: r1, life: 0, max: life, c: c, a: a == null ? .8 : a }); },
    slash: function (x, y, z, ang, size, c, tilt) { G.slashes.push({ x: x, y: y, z: z, ang: ang, size: size, c: c, tilt: tilt || 0, life: 0 }); },
    bolt: function (x0, y0, z0, x1, y1, z1, c, w) { var pts = [[x0, y0, z0]], n = 5; for (var i = 1; i < n; i++) { var t = i / n; pts.push([x0 + (x1 - x0) * t + (Math.random() - .5) * 1.2, y0 + (y1 - y0) * t, z0 + (z1 - z0) * t + (Math.random() - .5) * 1.2]); } pts.push([x1, y1, z1]); G.bolts.push({ pts: pts, c: c, life: 0, w: w || .12 }); },
    boom: function (x, y, z, el, r) { var c = EC[el] || EC.phys; FX.part(x, y + .5, z, c, 14, 5 + r, { life: .5, size: .2 }); FX.decal('ring', x, y, z, r * .3, r, .3, c); FX.decal('circle', x, y, z, r * .8, r, .18, c, .5); }
  };
  G.shakeAdd = function (a) { G.shake = Math.min(1.2, Math.max(G.shake, a)); };
  G.hitstop = function (t) { G.freeze = Math.max(G.freeze, t); };

  // ───── 파티 런타임 ─────
  G.cur = function () { return ST.S.party[ST.S.active] || ST.S.party[0]; };
  function rt(cid) { return G.rt[cid] || (G.rt[cid] = { cdS: 0, cdB: 0, ch: 0, chT: 0 }); } G.rtOf = rt;
  var stCache = {}, stVer = -1;
  G.cst = function (cid) { var key = ST.ver + '_' + G.buffs.length + '_' + (G.buffs.length ? G.buffs[0].id : 0); if (stVer != key) { stCache = {}; stVer = key; } return stCache[cid] || (stCache[cid] = ST.stats(cid, G.buffs.map(function (b) { return b.m; }))); };
  G.addBuff = function (m, dur, name) { G.buffs.push({ m: m, t: dur, id: Math.random(), n: name }); };
  G.healParty = function (pct, flat, all, src) { var S = ST.S, hb = src ? 1 + G.cst(src).heal / 100 : 1; (all ? S.party : [G.cur()]).forEach(function (id) { var c = S.chars[id]; if (c.hp <= 0) return; var mx = G.cst(id).hp, amt = (mx * pct / 100 + (flat || 0)) * hb; c.hp = Math.min(1, c.hp + amt / mx); if (id == G.cur()) FX.num(P.x, P.y + 1.8, P.z, '+' + Math.round(amt), [120, 255, 140]); }); };
  G.gainEnergy = function (n, cid) { var S = ST.S; S.party.forEach(function (id) { var c = S.chars[id], cost = burstCost(id), mul = (id == (cid || G.cur()) ? 1 : .6) * G.cst(id).er / 100; c.en = Math.min(cost, (c.en || 0) + n * mul); }); };
  function burstCost(id) { return Math.max(20, D.CH[id].burst.cost + (G.cst(id).m.burstCost || 0)); } G.burstCost = burstCost;
  G.skillCd = function (id) { return D.CH[id].skill.cd * Math.max(.4, 1 + (G.cst(id).m.skillCd || 0) / 100); };
  G.maxCharges = function (id) { return 1 + (G.cst(id).m.charges || 0); };
  G.maxStam = function () { return ST.S.stam + (G.cst(G.cur()).m.stamina || 0); };
  function stSave() { var m = G.cst(G.cur()).m; return 1 - Math.min(.5, (m.stSave || 0) / 100); }

  // ───── 플레이어 ─────
  G.newPlayer = function (x, z) {
    P = G.P = { x: x, y: W.topY(x, z), z: z, vx: 0, vy: 0, vz: 0, yaw: Math.PI, state: 'ground', st: 100, stWait: 0, anim: 'idle', at: 0, combo: 0, atkT: 0, atkPhase: 0, comboT: 0, holdT: 0, ifr: 0, dashT: 0, dashCd: 0, swapCd: 0, shield: null, infuse: null, aura: null, hitT: 0, frozen: 0, fallTop: 0, airT: 0, pushT: 0, wn: null, safe: null, plunge: false, castT: 0, downT: 0, moving: false, lavaT: 0, glideD: 0 };
    P.safe = { x: P.x, y: P.y, z: P.z }; G.binds.forEach(function (f) { f(P); });
  };
  function solidAt(x, z) { var l = W.decor[(Math.floor(z / 2) >> 4) * 16 + (Math.floor(x / 2) >> 4)]; if (!l) return false; for (var i = 0; i < l.length; i++) { var d = l[i]; if (d.solid && Math.abs(d.x - x) < .45 && Math.abs(d.z - z) < .45) return true; } return false; }
  // 이동 시도. 반환: 0 성공, 1 벽(오를 수 있음), 2 기타 막힘
  function probe(nx, nz, y) { var g = W.ground(nx, nz, y + .6); if (g - y > .62) return 1; if (W.ceil(nx, nz, y + .2) - Math.max(g, y) < 1.4) return 2; if (solidAt(nx, nz)) return 2; return 0; }
  function moveXZ(dx, dz) {
    var res = 0, r = .32;
    if (dx) { var b = probe(P.x + dx + Math.sign(dx) * r, P.z, P.y); if (!b) P.x += dx; else res = b == 1 ? { n: [Math.sign(dx), 0] } : res || 2; }
    if (dz) { var b2 = probe(P.x, P.z + dz + Math.sign(dz) * r, P.y); if (!b2) P.z += dz; else if (b2 == 1 && (!res || res == 2 || Math.abs(dz) > Math.abs(dx))) res = { n: [0, Math.sign(dz)] }; else res = res || 2; }
    P.x = U.clamp(P.x, 4, 508); P.z = U.clamp(P.z, 4, 508);
    return res;
  }
  function useSt(n) { P.st = Math.max(0, P.st - n * stSave()); P.stWait = 1.2; }
  function setAnim(a) { if (P.anim != a) { P.anim = a; P.at = 0; } }
  G.teleport = function (x, y, z) { P.x = x; P.z = z; P.y = y == null ? W.topY(x, z) : y; P.vy = 0; P.state = 'ground'; P.fallTop = P.y; P.safe = { x: P.x, y: P.y, z: P.z }; G.cam.d = G.cam.dist; };
  G.updatePlayer = function (dt) {
    var S = ST.S, inp = G.inp, cid = G.cur(), cs = S.chars[cid];
    P.at += dt; P.ifr -= dt; P.dashCd -= dt; P.swapCd -= dt; P.hitT -= dt; P.castT -= dt; P.comboT -= dt;
    if (P.infuse && (P.infuse.t -= dt) <= 0) P.infuse = null;
    if (P.shield && ((P.shield.t -= dt) <= 0 || P.shield.hp <= 0)) P.shield = null;
    if (P.aura && (P.aura.t -= dt) <= 0) P.aura = null;
    for (var i = G.buffs.length - 1; i >= 0; i--) if ((G.buffs[i].t -= dt) <= 0) G.buffs.splice(i, 1);
    S.party.forEach(function (id) { var r = rt(id); r.cdB -= dt; if (r.ch < G.maxCharges(id)) { r.chT -= dt; if (r.chT <= 0) { r.ch++; r.chT = G.skillCd(id); } } });
    if (cs.hp <= 0) { setAnim('down'); P.downT += dt; if (P.downT > 1) G.onDown(); return; } P.downT = 0;
    if (P.frozen > 0) { P.frozen -= dt; if (inp.p.jump || inp.p.atk) P.frozen -= .25; return; }
    // 입력 → 월드 방향
    var cy = G.cam.yaw, fx = Math.sin(cy), fz = Math.cos(cy), rx = -Math.cos(cy), rz = Math.sin(cy);
    var ix = fx * inp.mz + rx * inp.mx, iz = fz * inp.mz + rz * inp.mx, il = Math.hypot(ix, iz); if (il > 1) { ix /= il; iz /= il; il = 1; }
    P.moving = il > .15;
    var liq = W.liquid(P.x, P.z), acting = P.atkT > 0 || P.castT > 0;
    if (P.atkT > 0) G.updateAttack(dt);
    // 전투 입력
    if (P.state != 'climb' && P.state != 'swim') G.combatInput(dt);
    if (P.state == 'ground') {
      var sprint = inp.h.dash && P.moving && P.st > 0 && P.dashT <= 0 && !acting;
      if (inp.p.dash && P.dashCd <= 0 && P.st >= 12 && P.castT <= 0) { P.dashT = .22; P.dashCd = .5; P.ifr = .35; useSt(15); P.atkT = 0; P.combo = 0; if (P.moving) P.yaw = Math.atan2(ix, iz); AUD.sfx('dash'); FX.part(P.x, P.y + .5, P.z, [255, 255, 255], 6, 2, { life: .3 }); }
      var spd = P.dashT > 0 ? 15 : sprint ? 8 : 5.4; if (acting) spd = P.atkLunge > 0 ? 3 : 0;
      if (liq && !liq.lava && liq.y > P.y + .3) spd *= .6;
      if (W.region(P.x, P.z) == 'snow' && G.env.cur == 'snow') spd *= .95;
      var mx2, mz2;
      if (P.dashT > 0) { P.dashT -= dt; mx2 = Math.sin(P.yaw); mz2 = Math.cos(P.yaw); }
      else if (acting) { mx2 = Math.sin(P.yaw); mz2 = Math.cos(P.yaw); P.atkLunge -= dt; }
      else { mx2 = ix; mz2 = iz; if (P.moving) P.yaw = Math.atan2(ix, iz); if (sprint) useSt(11 * dt); }
      var res = (P.moving || P.dashT > 0 || (acting && P.atkLunge > 0)) ? moveXZ(mx2 * spd * dt, mz2 * spd * dt) : 0;
      if (res && res.n && P.moving && !acting && (ix * res.n[0] + iz * res.n[1]) > .5) { P.pushT += dt; if (P.pushT > .13 && P.st > 5) startClimb(res.n); } else P.pushT = 0;
      var g = W.ground(P.x, P.z, P.y + .6);
      if (g < P.y - .65) { P.state = 'air'; P.vy = 0; P.fallTop = P.y; P.airT = 0; }
      else { P.y = g; if (inp.p.jump && !acting) { P.vy = 8.6; P.state = 'air'; P.fallTop = P.y; P.airT = 0; AUD.sfx('jump'); } }
      if (!acting && P.hitT <= 0) setAnim(P.moving || P.dashT > 0 ? 'run' : 'idle'); P.sprint = sprint || P.dashT > 0;
      if (!sprint && P.dashT <= 0) { P.stWait -= dt; if (P.stWait <= 0) P.st = Math.min(G.maxStam(), P.st + 28 * dt * (G.env.cur == 'snow' ? .7 : 1)); }
      if (liq && liq.lava && P.y < liq.y + .1) { P.lavaT -= dt; if (P.lavaT <= 0) { P.lavaT = .6; G.hurtPlayer(0, 'fire', null, .1); P.vy = 9; P.state = 'air'; P.fallTop = P.y; } }
      else if (!liq || liq.y < P.y + .2) { if (G.t % 1 < dt) P.safe = { x: P.x, y: P.y, z: P.z }; }
    } else if (P.state == 'air' || P.state == 'glide') {
      P.airT += dt;
      var gl = P.state == 'glide', spd2 = gl ? 7.2 : 5.2;
      if (P.plunge) { P.vy = -32; } else if (gl) { P.vy += (-1.9 - P.vy) * Math.min(1, dt * 8); useSt(3.2 * dt); if (P.moving) P.yaw = Math.atan2(ix, iz); var before = P.x + P.z; moveXZ(Math.sin(P.yaw) * spd2 * dt, Math.cos(P.yaw) * spd2 * dt); P.glideD += spd2 * dt; if (P.glideD > 10) { ST.bump('glide', 10); P.glideD = 0; } if (inp.p.jump || P.st <= 0) P.state = 'air'; }
      else {
        P.vy -= 24 * dt; if (P.moving) { P.yaw = Math.atan2(ix, iz); var r2 = moveXZ(ix * spd2 * dt, iz * spd2 * dt); if (r2 && r2.n && (ix * r2.n[0] + iz * r2.n[1]) > .5 && P.st > 5 && P.airT > .12) { startClimb(r2.n); return; } }
        var gg = W.ground(P.x, P.z, P.y + .6);
        if (inp.p.jump && P.airT > .15 && P.y - gg > 1.2 && P.st > 1 && !(liq && liq.y > P.y - 1)) { P.state = 'glide'; P.vy = Math.max(P.vy, -3); AUD.sfx('glide'); inp.p.jump = false; }
      }
      P.fallTop = Math.max(P.fallTop, P.y);
      var ny = P.y + P.vy * dt, cl = W.ceil(P.x, P.z, P.y); if (ny + 1.6 > cl) { ny = cl - 1.6; P.vy = Math.min(0, P.vy); }
      var g2 = W.ground(P.x, P.z, P.y + .1);
      if (liq && !liq.lava && liq.depth > 1.15 && ny <= liq.y - 1 && g2 < liq.y - 1.1) { P.state = 'swim'; P.y = liq.y - 1; P.plunge = false; FX.part(P.x, liq.y, P.z, [200, 230, 255], 12, 4, { life: .5 }); AUD.sfx('splash'); }
      else if (ny <= g2) {
        P.y = g2; var fall = P.fallTop - g2, wasPl = P.plunge; P.state = 'ground';
        if (wasPl) { P.plunge = false; G.plungeHit(); } else if (fall > 10 && !gl) { G.hurtPlayer(0, 'phys', null, Math.min(.95, (fall - 10) * .05), true); G.shakeAdd(.5); AUD.sfx('land'); } else if (fall > 1) AUD.sfx('step');
      } else P.y = ny;
      if (!acting && P.hitT <= 0) setAnim(P.state == 'glide' ? 'glide' : 'run');
    } else if (P.state == 'climb') {
      var n = P.wn, wx = P.x + n[0] * .7, wz = P.z + n[1] * .7, wt = W.ground(wx, wz, P.y + 1.3), own = W.ground(P.x, P.z, P.y + .3), mvd = false;
      P.yaw = Math.atan2(n[0], n[1]);
      if (wt <= P.y + .3) { P.x = wx; P.z = wz; P.y = wt; P.state = 'ground'; P.safe = { x: P.x, y: P.y, z: P.z }; }
      else if (P.st <= 0 || inp.p.dash || inp.p.drop) { P.state = 'air'; P.vy = 0; P.fallTop = P.y; P.airT = 0; }
      else {
        // 화면 기준 입력: 위/아래 = mz, 좌우 = mx (벽 접선)
        var tx = -n[1], tz = n[0], sgn = (tx * rx + tz * rz) >= 0 ? 1 : -1, up = inp.mz, sd = inp.mx * sgn;
        if (P.leapT > 0) { P.leapT -= dt; up = 3; }
        if (Math.abs(up) > .2) { var ny2 = P.y + up * 2.5 * dt; if (up > 0 && ny2 + 1.7 > W.ceil(P.x, P.z, P.y)) ny2 = P.y; if (ny2 <= own) { P.y = own; P.state = 'ground'; } else P.y = ny2; mvd = true; ST.S.stat.climbAcc = (ST.S.stat.climbAcc || 0) + Math.abs(up) * 2.5 * dt; if (ST.S.stat.climbAcc > 10) { ST.S.stat.climbAcc = 0; ST.bump('climb', 10); } }
        if (Math.abs(sd) > .2) { var nx3 = P.x + tx * sd * 2.2 * dt, nz3 = P.z + tz * sd * 2.2 * dt; if (W.ground(nx3 + tx * Math.sign(sd) * .3, nz3 + tz * Math.sign(sd) * .3, P.y + .6) <= P.y + .6 && W.ground(nx3 + n[0] * .7, nz3 + n[1] * .7, P.y + 1.3) > P.y + .3) { P.x = nx3; P.z = nz3; mvd = true; } }
        if (mvd) useSt(9 * dt);
        if (inp.p.jump && P.st > 18 && !(P.leapT > 0)) { P.leapT = .22; useSt(18); AUD.sfx('jump'); }
        setAnim('climb'); P.climbMove = mvd;
      }
    } else if (P.state == 'swim') {
      if (!liq || liq.depth <= 1.1) { P.state = 'ground'; P.y = W.ground(P.x, P.z, P.y + 1.2); }
      else {
        P.y = liq.y - 1; var fast = inp.h.dash && P.moving, sp3 = fast ? 4.6 : 3.2;
        if (P.moving) {
          P.yaw = Math.atan2(ix, iz); var nx4 = P.x + ix * sp3 * dt, nz4 = P.z + iz * sp3 * dt, l2 = W.liquid(nx4 + ix * .4, nz4 + iz * .4), g4 = W.ground(nx4 + ix * .4, nz4 + iz * .4, liq.y + .6);
          if (g4 > liq.y - 1.15 && g4 <= liq.y + .7) { P.x = nx4 + ix * .4; P.z = nz4 + iz * .4; P.y = g4; P.state = 'ground'; }
          else if (l2 && l2.depth > 1.1 && g4 < liq.y) { P.x = nx4; P.z = nz4; }
          else if (g4 > liq.y + .7) { P.pushT += dt; if (P.pushT > .2 && P.st > 5) { var ax = Math.abs(ix) > Math.abs(iz); P.y = liq.y - .6; startClimb(ax ? [Math.sign(ix), 0] : [0, Math.sign(iz)]); } }
          useSt((fast ? 9 : 3.5) * dt); ST.S.stat.swimAcc = (ST.S.stat.swimAcc || 0) + sp3 * dt; if (ST.S.stat.swimAcc > 10) { ST.S.stat.swimAcc = 0; ST.bump('swim', 10); }
          if (Math.random() < dt * 6) FX.part(P.x, liq.y, P.z, [220, 240, 255], 1, 1.5, { life: .4, g: 3 });
        } else P.pushT = 0;
        setAnim('swim');
        if (P.st <= 0) { G.toast('스태미나가 바닥나 물에 빠졌습니다'); G.hurtPlayer(0, 'phys', null, .25, true); G.teleport(P.safe.x, P.safe.y, P.safe.z); P.st = G.maxStam() * .5; }
      }
    }
    if (P.y < -8) G.teleport(P.safe.x, P.safe.y, P.safe.z);
  };
  function startClimb(n) {
    P.state = 'climb'; P.wn = n; P.vy = 0; P.pushT = 0; P.plunge = false; P.leapT = 0; P.atkT = 0;
    if (n[0]) { var face = n[0] > 0 ? Math.floor((P.x + .7) / 2) * 2 : Math.ceil((P.x - .7) / 2) * 2; P.x = face - n[0] * .36; } else { var f2 = n[1] > 0 ? Math.floor((P.z + .7) / 2) * 2 : Math.ceil((P.z - .7) / 2) * 2; P.z = f2 - n[1] * .36; }
  }
  // ───── 카메라 ─────
  G.updateCam = function (dt) {
    var c = G.cam; c.pitch = U.clamp(c.pitch, -.35, 1.35); c.dist = U.clamp(c.dist, 3.5, 13);
    var tx = P.x, ty = P.y + 1.35, tz = P.z, cp = Math.cos(c.pitch), dx = -Math.sin(c.yaw) * cp, dy = Math.sin(c.pitch), dz = -Math.cos(c.yaw) * cp, want = c.dist, inC = W.inCave(P.x, P.z, P.y);
    for (var s = 1; s <= 14; s++) { var d = s / 14 * c.dist, px = tx + dx * d, py = ty + dy * d, pz = tz + dz * d; if (py < W.ground(px, pz, py + (inC ? 0 : 3)) + .35 || (inC && py > W.ceil(px, pz, ty) - .3) || (!inC && W.inCave(px, pz, py))) { want = Math.max(.8, (s - 1) / 14 * c.dist); break; } }
    c.d = want < c.d ? want : c.d + (want - c.d) * Math.min(1, dt * 4);
    var sx = 0, sy = 0; if (G.shake > .01) { sx = (Math.random() - .5) * G.shake * .5; sy = (Math.random() - .5) * G.shake * .5; G.shake *= Math.pow(.004, dt); }
    c.x = tx + dx * c.d + sx; c.y = ty + dy * c.d + sy; c.z = tz + dz * c.d; c.ry = c.yaw; c.rp = c.pitch;
    if (G.cine) { var ci = G.cine; ci.t += dt; var k = Math.min(1, ci.t / ci.dur), o = ci.fn(k); if (o) { c.x = o.x; c.y = o.y; c.z = o.z; c.ry = o.yaw; c.rp = o.pitch; } if (k >= 1) { var done = ci.done; G.cine = null; if (done) done(); } }
    R.cam.fov = c.fov || 58; R.setCam(c.x, c.y, c.z, c.ry, c.rp);
  };
  // 대상 주위를 도는 연출 카메라
  G.orbitCine = function (x, y, z, dur, r0, r1, a0, a1, h0, h1, done, fovA) { G.cine = { t: 0, dur: dur, done: done, fn: function (k) { var e = k * k * (3 - 2 * k), a = a0 + (a1 - a0) * e, r = r0 + (r1 - r0) * e, h = h0 + (h1 - h0) * e; G.cam.fov = 58 + (fovA || 0) * Math.sin(k * Math.PI); var cxx = x + Math.sin(a) * r, czz = z + Math.cos(a) * r, cyy = Math.max(y + h, W.ground(cxx, czz, y + h + 3) + .5); return { x: cxx, y: cyy, z: czz, yaw: a + Math.PI, pitch: Math.atan2(cyy - y - 1, r) }; } }; };

  // ───── 환경: 시간·날씨 ─────
  var WTAB = { meadow: [['clear', 6], ['rain', 2.5], ['thunder', 1.5]], town: [['clear', 7], ['rain', 3]], canyon: [['clear', 7], ['thunder', 3]], snow: [['snow', 6], ['clear', 4]], arena: [['clear', 1]] };
  G.updateEnv = function (dt) {
    var S = ST.S, e = G.env, reg = W.region(P.x, P.z); S.clock = (S.clock + dt * 24 / 1200) % 24; e.reg = reg;
    if (e.wT[reg] == null || (e.wT[reg] -= dt) <= 0) { var tab = WTAB[reg], tot = 0, r = Math.random(); tab.forEach(function (w) { tot += w[1]; }); r *= tot; for (var i = 0; i < tab.length; i++) { if ((r -= tab[i][1]) <= 0) { e.weather[reg] = tab[i][0]; break; } } e.wT[reg] = 80 + Math.random() * 90; }
    if (e.force) e.weather[reg] = e.force;
    e.cur = W.inCave(P.x, P.z, P.y) ? 'clear' : e.weather[reg] || 'clear'; e.flash = Math.max(0, e.flash - dt * 4);
    var h = S.clock, day = U.clamp(Math.min(h - 5, 19.5 - h) / 1.5, 0, 1), night = 1 - day, dusk = Math.max(0, 1 - Math.abs(h - 18.3) / 1.6) + Math.max(0, 1 - Math.abs(h - 5.8) / 1.4);
    e.night = night; e.isNight = night > .6;
    var env = R.env, rain = e.cur == 'rain' || e.cur == 'thunder', sn = e.cur == 'snow', dim = rain ? .72 : sn ? .88 : 1;
    var L = [U.lerp(.4, 1, day) * dim + dusk * .12, U.lerp(.44, 1, day) * dim, U.lerp(.7, 1, day) * (rain ? .85 : 1)];
    var fogc = (D.REGION[reg] || { fog: [40, 36, 70] }).fog, ft = e.fogc || (e.fogc = fogc.slice()); for (var q = 0; q < 3; q++) ft[q] += (fogc[q] - ft[q]) * Math.min(1, dt * .8);
    var top = [.2 * day + .02, .45 * day + .04, .85 * day + .14], bot = [ft[0] / 255, ft[1] / 255, ft[2] / 255];
    if (rain) { top = [.3 * day + .03, .34 * day + .04, .42 * day + .1]; bot = [.5, .55, .62]; } if (sn) { top = [.62 * day + .05, .7 * day + .07, .82 * day + .16]; }
    bot = [bot[0] * L[0] + dusk * .35, bot[1] * L[1] + dusk * .12, bot[2] * L[2]]; top = [top[0] + dusk * .15, top[1], top[2]];
    var fn = 55, ff = 150; if (rain) { fn = 30; ff = 105; } if (sn) { fn = 25; ff = 95; }
    if (reg == 'arena') { top = [.05, .04, .12]; bot = [.16, .12, .3]; L = [.85, .82, 1]; fn = 30; ff = 62; e.night = .8; }
    if (W.inCave(P.x, P.z, P.y)) { L = [L[0] * .55, L[1] * .55, L[2] * .65]; fn = 18; ff = 70; }
    if (G.sight) { L = [L[0] * .55, L[1] * .7, L[2] * 1.05]; }
    var f = e.flash; env.light = [L[0] + f, L[1] + f, L[2] + f]; env.fog = bot; env.skyT = top; env.skyB = bot; env.fogN += (fn - env.fogN) * Math.min(1, dt); env.fogF += (ff - env.fogF) * Math.min(1, dt);
    env.night = e.night; env.cloud = rain ? 1 : sn ? .8 : .45; env.time = G.t; var sa = (h - 6) / 24 * 6.283, moon = night > .5; env.sun = moon ? [Math.cos(sa + 3.14) * .8, Math.max(.15, Math.sin(sa + 3.14)), .45] : [Math.cos(sa) * .8, Math.max(.05, Math.sin(sa)), .45]; var sl = Math.hypot(env.sun[0], env.sun[1], env.sun[2]); env.sun = env.sun.map(function (v) { return v / sl; });
    // 날씨 효과
    e.tick = (e.tick || 0) - dt;
    if (e.tick <= 0) { e.tick = 2.5; G.weatherTick(e.cur, reg); }
    if (e.cur == 'thunder' && Math.random() < dt * .22) G.lightning();
  };

  // ───── 장면 그리기 ─────
  function dirIdx(yaw, x, z) { var a = Math.atan2(R.cam.x - x, R.cam.z - z) - yaw, k = Math.round(a / (Math.PI / 4)); k = ((k % 8) + 8) % 8; return k; }
  G.sprDir = function (frames, yaw, x, y, z, o) { var k = dirIdx(yaw, x, z); o = o || {}; o.flip = k > 4; R.spr(frames[k > 4 ? 8 - k : k], x, y, z, o); };
  function near(o, d) { var dx = o.x - P.x, dz = o.z - P.z; return dx * dx + dz * dz < d * d; }
  G.near = near;
  G.draw = function () {
    var S = ST.S, cid = G.cur(), t = G.t, cam = R.cam, FRM = PX.FR;
    // 장식
    var c0 = Math.floor(cam.x / 32), c1 = Math.floor(cam.z / 32), fh = Math.hypot(cam.fx, cam.fz) || 1, hx = cam.fx / fh, hz = cam.fz / fh;
    for (var a = -3; a <= 3; a++) for (var b = -3; b <= 3; b++) {
      var cx = c0 + a, cz = c1 + b; if (cx < 0 || cz < 0 || cx > 15 || cz > 15) continue; var l = W.decor[cz * 16 + cx], far = Math.abs(a) > 1 || Math.abs(b) > 1;
      for (var i = 0; i < l.length; i++) { var d = l[i], dx = d.x - cam.x, dz = d.z - cam.z; if (dx * hx + dz * hz < -3) continue; if (d.g) { if (far) continue; if (W.burnt[d.g] > t) continue; } else if (!d.solid && far && dx * dx + dz * dz > 3600) continue; var o2 = { sc: d.sc }; if (d.solid) { var ex = P.x - cam.x, ez = P.z - cam.z, el2 = ex * ex + ez * ez, kk = (dx * ex + dz * ez) / (el2 || 1); if (kk > -.1 && kk < 1.15 && Math.abs(dx * ez - dz * ex) / Math.sqrt(el2 || 1) < 2.2 * d.sc) o2.a = .3; } R.spr(SPR.prop[d.s], d.x, d.y, d.z, o2); }
    }
    G.drawObjects(t);
    // 얼음 발판·불
    for (var id in W.ice) { var ic = W.ice[id]; if (ic.until < t) { delete W.ice[id]; continue; } var ix = (id % 256) * 2 + 1, iz = Math.floor(id / 256) * 2 + 1; R.flat('diamond', ix, ic.y + .02, iz, 1.42, 200, 240, 255, ic.until - t < 2 ? .5 : 1, .785, true); }
    for (var f = G.fires.length - 1; f >= 0; f--) { var fr = G.fires[f]; if (Math.random() < .5) FX.part(fr.x + (Math.random() - .5) * 1.6, fr.y + .1, fr.z + (Math.random() - .5) * 1.6, Math.random() < .5 ? [255, 150, 40] : [255, 230, 120], 1, .6, { up: 2, life: .5, g: -2, size: .22 }); R.flat('circle', fr.x, fr.y + .05, fr.z, 1.1, 40, 30, 30, .6, 0, true); }
    // 장판
    G.fields.forEach(function (fd) { var c = EC[fd.el]; R.flat('rune', fd.x, fd.y + .1, fd.z, fd.r, c[0], c[1], c[2], .85, t * .8); if (Math.random() < .4) { var a2 = Math.random() * 6.28, r2 = Math.random() * fd.r; FX.part(fd.x + Math.cos(a2) * r2, fd.y + .2, fd.z + Math.sin(a2) * r2, c, 1, .5, { up: 2.5, life: .6, g: 0 }); } });
    // 예고 표시
    G.tele.forEach(function (tl) { var k = tl.t / tl.max, c = tl.el && EC[tl.el] ? EC[tl.el] : [255, 60, 60], y = tl.y + .12; if (tl.sh == 'c') { R.flat('tele', tl.x, y, tl.z, tl.r, 255, 50, 40, .9); R.flat('circle', tl.x, y + .02, tl.z, tl.r * k, c[0], c[1] * .7, c[2] * .7, .55); } else if (tl.sh == 'd') { R.flat('ring', tl.x, y, tl.z, tl.r, 255, 50, 40, 1); R.flat('tele', tl.x, y, tl.z, tl.r, 255, 60, 40, .5 + k * .4); R.flat('circle', tl.x, y + .04, tl.z, tl.r0, 80, 255, 120, .7); } else { R.flatRect(tl.x, tl.z, tl.x1, tl.z1, tl.hw, y, 255, 50, 40, .9); R.flatRect(tl.x, tl.z, tl.x + (tl.x1 - tl.x) * k, tl.z + (tl.z1 - tl.z) * k, tl.hw * .8, y + .02, c[0], c[1] * .7, c[2] * .7, .5); } });
    // 적
    G.ens.forEach(function (e) {
      if (e.dead && e.deadT > .6) return; var def = e.def, fr, key = def.boss ? def.id + '_' + e.phase : def.id, frames = SPR.en[key]; if (!frames) return;
      if (def.boss) fr = e.stun > 0 ? 3 : (e.state == 'wind' || e.state == 'strike') ? 2 : (t * 2 | 0) % 2;
      else fr = e.frozen > 0 ? 0 : e.state == 'wind' ? 4 : (e.state == 'rec' && e.stT > e.recT - .25) ? 5 : e.moving ? 2 + (t * 6 | 0) % 2 : (t * 2 + e.seed | 0) % 2;
      var o = { sc: e.sc }, fl = e.flash > 0; if (fl) { o.ar = o.ag = o.ab = 200; } if (e.frozen > 0) { o.r = 90; o.g = 150; o.b = 255; o.ar = 0; o.ag = 40; o.ab = 80; } if (e.dead) o.a = 1 - e.deadT / .6; if (e.invT > 0 && (t * 12 | 0) % 2) { o.ar = 120; o.ag = 100; o.ab = 160; }
      var yy = e.y + (def.fly || 0) + (e.hopY || 0); R.flat('circle', e.x, e.gy + .06, e.z, .45 * e.sc * (def.boss ? 2.2 : 1), 0, 0, 0, .45, 0, true);
      G.sprDir(frames[fr], e.yaw, e.x, yy, e.z, o);
      if (e.shield && e.shield.g > 0) { var sc = EC[e.shield.el]; R.px(e.x, yy + .7 * e.sc, e.z, 1.9 * e.sc, sc[0], sc[1], sc[2], .35, 'ring'); }
      if (e.aura && (G.sight || true)) { var ac = EC[e.aura.el]; R.px(e.x, yy + 1.75 * e.sc + (def.boss ? 2.5 : 0), e.z, .28, ac[0], ac[1], ac[2], 1, 'diamond'); }
      if (e.armor && e.armor.g > 0 && e.stun <= 0) { var wc = EC[e.armor.els[0]]; R.px(e.x, yy + 1.4 * e.sc * (def.boss ? 1.6 : 1), e.z, .7 + Math.sin(t * 6) * .1, wc[0], wc[1], wc[2], 1, 'star'); }
    });
    // 플레이어
    if (!G.hideP) {
      var frs = SPR.ch[cid], an = P.anim, fi;
      if (an == 'idle') fi = FRM.idle[(P.at * 1.6 | 0) % 2]; else if (an == 'run') fi = FRM.run[(P.at * (P.sprint ? 13 : 9) | 0) % 4]; else if (an == 'climb') fi = FRM.climb[P.climbMove ? (P.at * 5 | 0) % 2 : 0]; else if (an == 'glide') fi = FRM.glide[0]; else if (an == 'swim') fi = FRM.swim[(P.at * 3 | 0) % 2];
      else if (an == 'atk') fi = FRM.atk[Math.min(2, P.atkPhase)]; else if (an == 'hit') fi = FRM.hit[0]; else if (an == 'down') fi = FRM.down[0]; else fi = FRM.cast[0];
      var po = {}; if (P.ifr > 0 && P.dashT > 0) po.a = .6; if (P.hitT > .2) { po.ar = 160; po.ag = 40; po.ab = 40; } if (P.frozen > 0) { po.r = 90; po.g = 150; po.b = 255; }
      var py = P.y; if (P.state != 'swim') R.flat('circle', P.x, W.ground(P.x, P.z, P.y + .3) + .06, P.z, .42, 0, 0, 0, .5, 0, true);
      G.sprDir(frs[fi], P.yaw, P.x, py, P.z, po);
      if (P.shield) { var shc = EC[P.shield.el]; R.px(P.x, P.y + .8, P.z, 2.1, shc[0], shc[1], shc[2], .4, 'ring'); }
      if (P.infuse) { var ic2 = EC[P.infuse.el]; if (Math.random() < .5) FX.part(P.x, P.y + .8, P.z, ic2, 1, .8, { up: 1, life: .4, g: 0 }); }
      if (P.aura) { var pc = EC[P.aura.el]; R.px(P.x, P.y + 1.95, P.z, .25, pc[0], pc[1], pc[2], 1, 'diamond'); }
    }
    // 투사체
    G.projs.forEach(function (p) { var c = EC[p.el] || EC.phys; if (p.arrow) R.line(p.x - p.vx * .03, p.y - p.vy * .03, p.z - p.vz * .03, p.x, p.y, p.z, .07, c[0], c[1], c[2]); else { R.px(p.x, p.y, p.z, p.size || .45, c[0], c[1], c[2], 1, 'glow'); R.px(p.x, p.y, p.z, (p.size || .45) * .45, 255, 255, 255, 1, 'circle'); } });
    // 효과
    var dtr = G.rdt;
    for (var i2 = G.parts.length - 1; i2 >= 0; i2--) { var p = G.parts[i2]; p.life += dtr; if (p.life > p.max) { G.parts[i2] = G.parts[G.parts.length - 1]; G.parts.pop(); continue; } p.vy -= p.g * dtr; p.x += p.vx * dtr; p.y += p.vy * dtr; p.z += p.vz * dtr; R.px(p.x, p.y, p.z, p.size * (1 - p.life / p.max * .6), p.c[0], p.c[1], p.c[2], 1, p.sh); }
    for (var i3 = G.decals.length - 1; i3 >= 0; i3--) { var dc = G.decals[i3]; dc.life += dtr; if (dc.life > dc.max) { G.decals.splice(i3, 1); continue; } var k = dc.life / dc.max; R.flat(dc.sh, dc.x, dc.y, dc.z, dc.r0 + (dc.r1 - dc.r0) * k, dc.c[0], dc.c[1], dc.c[2], dc.a * (1 - k * .8)); }
    for (var i4 = G.slashes.length - 1; i4 >= 0; i4--) { var s = G.slashes[i4]; s.life += dtr; if (s.life > .16) { G.slashes.splice(i4, 1); continue; } R.sprRot('slash', s.x, s.y, s.z, s.size * (.8 + s.life * 2), s.ang, s.tilt, s.c[0], s.c[1], s.c[2], 1 - s.life / .2); }
    for (var i5 = G.bolts.length - 1; i5 >= 0; i5--) { var bt = G.bolts[i5]; bt.life += dtr; if (bt.life > .18) { G.bolts.splice(i5, 1); continue; } for (var q = 0; q < bt.pts.length - 1; q++) { var A = bt.pts[q], B = bt.pts[q + 1]; R.line(A[0], A[1], A[2], B[0], B[1], B[2], bt.w, bt.c[0], bt.c[1], bt.c[2]); R.line(A[0], A[1], A[2], B[0], B[1], B[2], bt.w * .4, 255, 255, 255); } }
    // 날씨 입자
    var wc2 = G.env.cur;
    if (wc2 == 'rain' || wc2 == 'thunder') for (var r = 0; r < 70; r++) { var rx2 = cam.x + cam.fx * 9 + (U.hash2(r, 1, 3) - .5) * 26, rz2 = cam.z + cam.fz * 9 + (U.hash2(r, 2, 3) - .5) * 26, ry = cam.y + 7 - ((t * 22 + U.hash2(r, 3, 3) * 14) % 14); if (ry > W.ground(rx2, rz2, 99)) R.line(rx2, ry, rz2, rx2 + .08, ry + .55, rz2, .012, 170, 200, 255, .7); }
    if (wc2 == 'snow') for (var r3 = 0; r3 < 70; r3++) { var sx = cam.x + cam.fx * 8 + (U.hash2(r3, 1, 4) - .5) * 24 + Math.sin(t + r3) * .5, sz = cam.z + cam.fz * 8 + (U.hash2(r3, 2, 4) - .5) * 24, sy = cam.y + 6 - ((t * 2.2 + U.hash2(r3, 3, 4) * 12) % 12); if (sy > W.ground(sx, sz, 99)) R.px(sx, sy, sz, .1, 255, 255, 255, 1, 'flake'); }
    R.frame();
  };
})();
