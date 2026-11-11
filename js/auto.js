// 녹화용 자동 플레이: 시작 → 10회 기원 → 탐험(벽 타기·활공·상자) → 전투(교체·반응·필살기) → 최종 보스 격파
var AUTO = (function () {
  var D = DATA, A = { on: false }, nav = null, mode = 'idle', stuckT = 0, lastP = null, side = 0, sideT = 0, atkT = 0, swapT = 4, dodge = null, climbDir = null, note = null;
  function wait(s) { return new Promise(function (r) { setTimeout(r, s * 1000); }); }
  function until(f, to) { return new Promise(function (r) { var t0 = Date.now(), iv = setInterval(function () { if (f() || Date.now() - t0 > (to || 30) * 1000) { clearInterval(iv); r(); } }, 100); }); }
  function say(t) { UI.banner('자동 플레이', t); }
  A.setup = function () {
    var S = ST.S; ['serapin', 'lunaria', 'raika', 'yuna', 'miru'].forEach(function (c) { ST.addChar(c); });
    Object.keys(S.chars).forEach(function (c) { var s = S.chars[c]; s.lv = 80; s.asc = 5; s.tal = [8, 8, 8]; s.en = 40; var w = S.weapons[s.w]; w.lv = 60; w.asc = 3; });
    var give = { serapin: 'w_s4a', lunaria: 'w_k4a', raika: 'w_k4b', lio: 'w_s4b' }; for (var c in give) { var u = ST.addWeapon(give[c]); S.weapons[u].lv = 70; S.weapons[u].asc = 4; S.chars[c].w = u; }
    ['serapin', 'lunaria', 'raika', 'lio'].forEach(function (c, i) { D.SLOTS.forEach(function (sl) { var u = ST.genArt(['ember', 'frost', 'volt', 'glad'][i], 5, sl.id); S.arts[u].lv = 16; S.chars[c].art[sl.id] = u; }); });
    S.party = ['lio', 'serapin', 'lunaria', 'raika']; S.active = 0; S.inv.gem = 1600; S.inv.f_skewer = 9; S.inv.f_omelet = 3; S.q.main = { s: 12, pre: 1 }; S.q.miru = { s: 2, done: true }; S.flags.altar = 1; S.statues.st_meadow = 1; S.clock = 9.5; S.ar = 12;
    W.o.wps.forEach(function (w) { S.wps[w.id] = 1; }); S.party.forEach(function (c) { S.chars[c].hp = 1; }); ST.ver++;
  };
  function go(x, z, o) { o = o || {}; nav = { x: x, z: z, stop: o.stop || 1.2, sprint: o.sprint !== false }; mode = 'nav'; stuckT = 0; return until(function () { return !nav; }, o.to || 40).then(function () { nav = null; mode = 'idle'; }); }
  function fight(done, to) { mode = 'fight'; return until(done, to).then(function () { mode = 'idle'; }); }
  function findCliff(cx, cz) { // 가까운 4~8m 절벽의 아래쪽 칸
    var best = null, bd = 1e9, N = 256, ci = Math.floor(cx / 2), cj = Math.floor(cz / 2);
    for (var j = cj - 16; j <= cj + 16; j++) for (var i = ci - 16; i <= ci + 16; i++) { var h = W.h[j * N + i]; if (h < 3 || W.wl[j * N + i] > h || W.st[j * N + i]) continue; [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(function (d) { var h2 = W.h[(j + d[1]) * N + i + d[0]], h0 = W.h[(j - d[1]) * N + i - d[0]], h3 = W.h[(j + d[1] * 2) * N + i + d[0] * 2]; if (h2 - h >= 8 && h2 - h <= 18 && Math.abs(h0 - h) <= 1 && Math.abs(h3 - h2) <= 1 && !(W.reg[(j + d[1]) * N + i + d[0]] & 32)) { var dd = Math.hypot(i - ci, j - cj); if (dd < bd && dd > 3) { bd = dd; best = { x: i * 2 + 1, z: j * 2 + 1, d: d, top: h2 * .5 }; } } }); }
    return best;
  }
  A.run = function () {
    A.on = true; UI.autoDlg = true; var S = ST.S, P = G.P;
    (async function () {
      say('별등 유랑기 — 녹화용 시연'); await wait(2.5);
      // 1) 마을까지 달리기
      say('① 새벽나루로 달려갑니다'); await go(257, 402); await go(257, 351, { stop: 1.5 });
      // 2) 10회 기원
      say('② 별등 기원 10회'); await wait(1); UI.open('gacha'); await wait(2); UI.acts.gv('rates'); await wait(2); UI.acts.gv('main'); await wait(.8); UI.acts.pull('10'); await wait(1); await until(function () { return !UI.gachaOn; }, 60); await wait(1.2); UI.close(); await wait(.5);
      UI.open('party'); await wait(1.8); UI.close();
      // 3) 탐험: 야영지 절벽을 타고 올라가 활공
      var camp = W.o.camps[0], cl = findCliff(camp.x, camp.z) || findCliff(P.x, P.z);
      say('③ 탐험 — 벽 타기와 활공'); await go(257, 330, { stop: 2 });
      if (cl) { await go(cl.x - cl.d[0] * 3, cl.z - cl.d[1] * 3, { stop: 1.6, to: 45 }); climbDir = cl.d; mode = 'climb'; await until(function () { return P.y >= cl.top - .2 && P.state == 'ground'; }, 18); mode = 'idle'; climbDir = null; await wait(.4);
        // 활공: 절벽 반대쪽으로 뛰어내림
        mode = 'glide'; note = { d: [-cl.d[0], -cl.d[1]], t: 0 }; await until(function () { return note.t > 1.2 && P.state == 'ground'; }, 12); mode = 'idle'; await wait(.5);
        // 다시 올라가 낙하 공격 준비
      }
      // 4) 전투
      say('④ 전투 — 교체·원소 반응·필살기'); G.sight = true; await go(camp.x + 4, camp.z + 4, { stop: 5, to: 50 }); G.sight = false;
      await fight(function () { return S.camps.camp0 && !G.ens.some(function (e) { return !e.dead && e.aggro && !e.def.animal; }); }, 70);
      var ch = G.objs.filter(function (o) { return o.k == 'chest' && o.ref.camp == 'camp0'; })[0]; if (ch && !S.opened[ch.ref.id]) { await go(ch.x, ch.z, { stop: 1.6, to: 15 }); G.inp.p.interact = true; mode = 'tap'; await wait(1.5); mode = 'idle'; }
      // 5) 장비 강화 시연
      UI.open('chars', { c: 'serapin', t: 'art', sl: 'ring' }); await wait(1.5); UI.acts.aenh('4'); await wait(2); UI.close();
      // 6) 최종 보스
      say('⑤ 별의 제단 — 녹스 아스트라'); await wait(1.5); UI.open('map'); await wait(2); UI.close(); UI.teleportTo(W.o.wps.filter(function (w) { return w.id == 'wp_altar'; })[0]); await wait(3.5);
      S.party.forEach(function (c) { S.chars[c].hp = 1; S.chars[c].en = 80; });
      await go(W.altar.x, W.altar.z + 9, { stop: 2, to: 30 });
      await fight(function () { return S.flags.noxDead; }, 400);
      await until(function () { return UI.done; }, 90); say('시연 끝 — 플레이해 주셔서 고맙습니다'); A.on = false; UI.autoDlg = false; G.inp.mx = G.inp.mz = 0; G.inp.h = {};
    })();
  };
  function steer(tx, tz, dt, sprint) { var P = G.P, inp = G.inp, h = Math.atan2(tx - P.x, tz - P.z), df = U.angDiff(h, G.cam.yaw); G.cam.yaw += df * Math.min(1, dt * 5); inp.mz = Math.abs(df) < 1.3 ? 1 : .2; inp.mx = side; inp.h.dash = !!sprint && P.st > 25; }
  A.tick = function (dt) {
    var P = G.P, inp = G.inp, S = ST.S; inp.mx = 0; inp.mz = 0; inp.h.dash = false; inp.h.atk = false; if (G.mode != 'play') return;
    G.cam.pitch += (.42 - G.cam.pitch) * Math.min(1, dt * 2); G.cam.dist += (8.5 - G.cam.dist) * Math.min(1, dt * 2);
    if (sideT > 0) { sideT -= dt; if (sideT <= 0) side = 0; }
    stuckT += dt; if (stuckT > .6) { if (lastP && Math.hypot(P.x - lastP[0], P.z - lastP[1]) < .35 && (mode == 'nav' || (mode == 'fight' && inp._want)) && P.state != 'climb') { inp.p.jump = true; side = Math.random() < .5 ? 1 : -1; sideT = .7; } lastP = [P.x, P.z]; stuckT = 0; }
    if (mode == 'nav' && nav) { if (Math.hypot(nav.x - P.x, nav.z - P.z) < nav.stop) { nav = null; return; } steer(nav.x, nav.z, dt, nav.sprint); if (P.state == 'climb') { inp.mz = 1; inp.mx = 0; } }
    else if (mode == 'climb') { var d = climbDir, h = Math.atan2(d[0], d[1]); G.cam.yaw += U.angDiff(h, G.cam.yaw) * Math.min(1, dt * 6); inp.mz = 1; if (P.state == 'climb' && P.st > 40 && Math.random() < dt * .8) inp.p.jump = true; }
    else if (mode == 'glide') { var n = note; n.t += dt; var h2 = Math.atan2(n.d[0], n.d[1]); G.cam.yaw += U.angDiff(h2, G.cam.yaw) * Math.min(1, dt * 6); inp.mz = 1; inp.h.dash = P.state == 'ground'; if (P.state == 'ground' && n.t > .5 && !n.j) { var ax = P.x + n.d[0] * 2.2, az = P.z + n.d[1] * 2.2; if (W.ground(ax, az, P.y + .6) < P.y - 2) { inp.p.jump = true; n.j = 1; } } else if (P.state == 'air' && n.j == 1 && P.vy < 2) { inp.p.jump = true; n.j = 2; } }
    else if (mode == 'fight') {
      var cid = G.cur(), c = D.CH[cid], best = null, bd = 1e9; G.ens.forEach(function (e) { if (e.dead || e.def.animal) return; var d = Math.hypot(e.x - P.x, e.z - P.z); if (d < 45 && d < bd) { bd = d; best = e; } }); inp._want = false;
      // 위험 장판 피하기
      var esc = null; G.tele.forEach(function (t) { if (t.max - t.t > 1.4) return; var dx = P.x - t.x, dz = P.z - t.z, dl = Math.hypot(dx, dz) || 1; if (t.sh == 'c' && dl < t.r + .8) esc = [t.x + dx / dl * (t.r + 4), t.z + dz / dl * (t.r + 4)]; else if (t.sh == 'd' && dl > t.r0 - .8 && dl < t.r + .5) esc = [t.x, t.z]; else if (t.sh == 'l') { var vx = t.x1 - t.x, vz = t.z1 - t.z, k = U.clamp((dx * vx + dz * vz) / (vx * vx + vz * vz), 0, 1), ox = P.x - t.x - vx * k, oz = P.z - t.z - vz * k, ol = Math.hypot(ox, oz) || 1; if (ol < t.hw + .8) esc = [P.x + ox / ol * 6, P.z + oz / ol * 6]; } });
      if (esc) { steer(esc[0], esc[1], dt * 3, true); inp.mz = 1; if (P.dashCd <= 0 && P.st > 20) inp.p.dash = true; return; }
      if (!best) return; var rng = (c.wt == 'bow' || c.wt == 'book') ? 7 : 1.7 + (best.def.boss ? best.def.size * .42 : .4);
      if (bd > rng) { inp._want = true; steer(best.x, best.z, dt, bd > 9); } else { var hh = Math.atan2(best.x - P.x, best.z - P.z); G.cam.yaw += U.angDiff(hh, G.cam.yaw) * Math.min(1, dt * 2); }
      atkT -= dt; if (bd < rng + 2 && atkT <= 0) { atkT = .2; inp.p.atk = true; }
      var r = G.rtOf(cid); if (bd < 9) { if (r.ch > 0 && Math.random() < dt * 3) inp.p.skill = true; if ((S.chars[cid].en || 0) >= G.burstCost(cid) && r.cdB <= 0 && Math.random() < dt * 2) inp.p.burst = true; }
      swapT -= dt; var b = G.boss, want = -1; if (b && b.armor.g > 0 && b.stun <= 0) S.party.forEach(function (id, i) { if (b.armor.els.indexOf(D.CH[id].el) >= 0 && S.chars[id].hp > 0) want = i; });
      if (want >= 0 && want != S.active && P.swapCd <= 0) { inp.p['sw' + want] = true; swapT = 5; } else if (swapT <= 0 && want < 0) { swapT = 4.5; for (var k2 = 1; k2 < 4; k2++) { var ni = (S.active + k2) % S.party.length; if (S.chars[S.party[ni]].hp > 0) { inp.p['sw' + ni] = true; break; } } }
      if (S.chars[cid].hp < .4 && Math.random() < dt * 2) UI.acts.quickfood();
    }
  };
  return A;
})();
