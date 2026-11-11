// UI 코어: HUD, 피해 숫자 오버레이, 대화, 전환 연출, 지도, 시작 화면
var UI = (function () {
  var D = DATA, $ = function (s) { return document.querySelector(s); }, E = {}, T = { dirty: true, acts: {}, screens: {}, cur: null, queue: [], autoDlg: false };
  var icache = {};
  function url(key, fn) { return icache[key] || (icache[key] = fn().toDataURL()); }
  T.icon = function (id) { var it = D.ITEMS[id]; if (D.WP[id]) return url('w' + id, function () { return PX.weaponCanvas(id, 22); }); if (id == 'arxp') return url('arxp', function () { return PX.icon('star', '#80e0a0'); }); if (!it) return url('q', function () { return PX.icon('gem', '#888'); }); return url('i' + id, function () { return PX.icon(it.ic, it.col); }); };
  T.ic = function (id, cls) { return '<img class="px ' + (cls || '') + '" src="' + T.icon(id) + '">'; };
  T.face = function (cid) { return url('f' + cid, function () { return PX.charCanvas(cid, 64, 0, .3); }); };
  T.art = function (cid, f) { return url('a' + cid + (f || 0), function () { return PX.charCanvas(cid, 110, f || 0, .32); }); };
  T.artIcon = function (a) { return url('ar' + a.slot + a.set, function () { return PX.icon(a.slot, D.SETS[a.set].col); }); };
  T.elIcon = function (el) { return url('el' + el, function () { return PX.icon('el', D.EL[el].c); }); };
  T.enIcon = function (id) { return url('en' + id, function () { return PX.enemyCanvas(id, 22); }); };
  T.name = function (id) { return id == 'arxp' ? '모험 경험치' : D.WP[id] ? D.WP[id].name : D.ITEMS[id] ? D.ITEMS[id].n : id; };
  T.stars = function (n) { return '<span class="stars">' + '★★★★★'.slice(0, n) + '</span>'; };
  T.init = function () {
    ['hud', 'mm', 'mminfo', 'qt', 'party', 'bossbar', 'bossname', 'bosshp', 'bossar', 'bossweak', 'timer', 'buffs', 'hpname', 'hpf', 'shf', 'hptxt', 'stf', 'stbar', 'prompt', 'loot', 'screen', 'dlg', 'dlgname', 'dlgtxt', 'dlgch', 'dlgnext', 'toasts', 'banner', 'cutin', 'hurt', 'trans', 'title', 'loading', 'stick', 'b_skill', 'b_burst', 'fx', 'over', 'gachaAnim'].forEach(function (id) { E[id] = document.getElementById(id); });
    T.E = E; T.fxc = E.fx.getContext('2d');
    $('#ui').addEventListener('click', function (ev) { var el = ev.target.closest('[data-a]'); if (!el) return; var a = el.getAttribute('data-a').split(':'), f = T.acts[a[0]]; if (f) { AUD.init(); AUD.sfx('ui'); f.apply(el, a.slice(1).concat([ev])); ev.stopPropagation(); } });
    E.dlg.addEventListener('click', function (ev) { if (!ev.target.closest('button')) T.dlgNext(); });
    G.toast = T.toast; ST.onToast = T.toast;
  };
  // ───── 알림 ─────
  T.toast = function (txt, cls) { var d = document.createElement('div'); d.textContent = txt; if (cls) d.className = cls; var w = document.createElement('p'); w.appendChild(d); E.toasts.appendChild(w); if (E.toasts.children.length > 4) E.toasts.removeChild(E.toasts.firstChild); setTimeout(function () { if (w.parentNode) w.parentNode.removeChild(w); }, 3000); if (cls == 'ach' || cls == 'ar') AUD.sfx('quest'); };
  T.loot = function (id, n, label, art) { var d = document.createElement('div'); d.innerHTML = '<img class="px" src="' + (art ? T.artIcon(art) : T.icon(id)) + '"><span>' + (label || T.name(id)) + (n > 1 ? ' ×' + U.fmt(n) : '') + '</span>'; E.loot.appendChild(d); if (E.loot.children.length > 7) E.loot.removeChild(E.loot.firstChild); setTimeout(function () { if (d.parentNode) d.parentNode.removeChild(d); }, 3200); };
  T.prompt = function (t) { if (T._pr === t) return; T._pr = t; E.prompt.classList.toggle('hide', !t); if (t) E.prompt.lastChild.textContent = t; };
  T.timer = function (t, txt) { E.timer.classList.toggle('hide', t == null); if (t != null) E.timer.textContent = txt + '  ' + Math.max(0, t).toFixed(1) + '초'; };
  T.banner = function (a, b) { var e = E.banner; e.firstChild.textContent = a; e.lastChild.textContent = b || ''; e.classList.remove('hide'); e.style.animation = 'none'; void e.offsetWidth; e.style.animation = ''; clearTimeout(T._bt); T._bt = setTimeout(function () { e.classList.add('hide'); }, 3200); };
  T.cutin = function (cid, name) { var c = D.CH[cid], col = D.EL[c.el].c; E.cutin.innerHTML = '<div class="band" style="background:linear-gradient(90deg,#15122a,' + col + ' 45%,#fff 62%,' + col + ')"></div><img src="' + T.art(cid, 16) + '"><div class="nm" style="color:' + col + '">' + name + '<small>' + c.name + ' · ' + D.EL[c.el].n + ' 원소 필살기</small></div>'; E.cutin.classList.remove('hide'); clearTimeout(T._ct); T._ct = setTimeout(function () { E.cutin.classList.add('hide'); }, 960); };
  T.hurtFlash = function () { E.hurt.classList.remove('on'); void E.hurt.offsetWidth; E.hurt.classList.add('on'); };
  T.transition = function (kind, cb) {
    var e = E.trans; AUD.sfx(kind == 'fade' ? 'ui' : 'tele');
    if (kind == 'iris') { var r = 100, dir = -1; e.className = 'iris'; clearInterval(T._ti); T._ti = setInterval(function () { r += dir * 10; e.style.setProperty('--r', r + '%'); if (r <= 0 && dir < 0) { dir = 1; cb && cb(); } if (r >= 110 && dir > 0) { clearInterval(T._ti); e.className = ''; e.style.removeProperty('--r'); } }, 40); }
    else { e.className = ''; void e.offsetWidth; e.className = kind; setTimeout(function () { cb && cb(); }, 430); setTimeout(function () { e.className = ''; }, 920); }
  };
  // ───── 대화 ─────
  var dl = null;
  T.dialog = function (lines, cb) { T.queue.push({ lines: lines, cb: cb }); };
  function dlgStart(q) { dl = { lines: q.lines.slice(), cb: q.cb, i: -1, t: 0, full: '', typing: false }; G.mode = 'dialog'; E.dlg.classList.remove('hide'); E.hud.classList.add('hide'); T.prompt(null); G.inp.mx = G.inp.mz = 0; if (document.pointerLockElement) document.exitPointerLock(); dlgAdv(); }
  function dlgAdv() { dl.i++; if (dl.i >= dl.lines.length) return dlgEnd(); var l = dl.lines[dl.i]; E.dlgch.innerHTML = ''; if (l.c) { dl.choice = l.c; E.dlgnext.style.display = 'none'; E.dlgch.innerHTML = l.c.map(function (c, i) { return '<button data-a="dlgpick:' + i + '">' + c[0] + '</button>'; }).join(''); E.dlgtxt.textContent = ''; E.dlgname.textContent = '리오'; dl.typing = false; if (T.autoDlg) setTimeout(function () { if (dl && dl.choice) T.acts.dlgpick('0'); }, 1100); return; } show(l); }
  function show(l) { dl.choice = null; E.dlgnext.style.display = ''; E.dlgname.textContent = l[0]; dl.full = l[1]; dl.t = 0; dl.typing = true; dl.hold = 0; E.dlgtxt.textContent = ''; }
  function dlgEnd() { var cb = dl.cb; dl = null; E.dlg.classList.add('hide'); E.hud.classList.remove('hide'); G.mode = 'play'; if (cb) cb(); }
  T.dlgNext = function () { if (!dl || dl.choice) return; if (dl.typing) { dl.typing = false; E.dlgtxt.textContent = dl.full; } else { AUD.sfx('ui'); dlgAdv(); } };
  T.acts.dlgpick = function (i) { var c = dl.choice[+i]; dl.choice = null; E.dlgch.innerHTML = ''; if (c[1]) show(c[1]); else dlgAdv(); };
  T.acts.dlgskip = function () { if (dl) dlgEnd(); };
  T.inDialog = function () { return !!dl; };
  // ───── HUD 갱신 ─────
  var pSig = '', pEls = [], mapBase = null, mapFog = null, fogSig = '', mmT = 0;
  T.update = function (dt) {
    var S = ST.S, P = G.P;
    if (dl) { if (dl.typing) { dl.t += dt * 42; var n = Math.floor(dl.t); if (n >= dl.full.length) { dl.typing = false; n = dl.full.length; } if (E.dlgtxt.textContent.length != n) { E.dlgtxt.textContent = dl.full.slice(0, n); if (n % 3 == 0) AUD.sfx('step'); } } else if (T.autoDlg && !dl.choice) { dl.hold += dt; if (dl.hold > 1.3) T.dlgNext(); } return; }
    if (T.queue.length && G.mode == 'play' && !G.cine) { dlgStart(T.queue.shift()); return; }
    if (G.mode != 'play') return;
    var cid = G.cur(), cs = S.chars[cid], st = G.cst(cid), c = D.CH[cid];
    var sig = S.party.join() + S.active; if (sig != pSig || T.dirty) { pSig = sig; T.dirty = false; E.party.innerHTML = S.party.map(function (id, i) { var ch = D.CH[id]; return '<div class="pm' + (i == S.active ? ' on' : '') + '" data-a="swap:' + i + '"><img src="' + T.face(id) + '"><div class="n">' + ch.name + '</div><span class="k">' + (i + 1) + '</span><div class="bar"><i></i></div><div class="en"><i></i></div><span class="e" style="background:' + D.EL[ch.el].c + '"></span></div>'; }).join(''); pEls = [].slice.call(E.party.children); }
    S.party.forEach(function (id, i) { var el = pEls[i]; if (!el) return; var ch = S.chars[id]; el.querySelector('.bar i').style.width = (ch.hp * 100) + '%'; el.querySelector('.en i').style.width = Math.min(100, (ch.en || 0) / G.burstCost(id) * 100) + '%'; el.classList.toggle('dead', ch.hp <= 0); });
    E.hpname.textContent = 'Lv.' + cs.lv + ' ' + c.name + (P.infuse ? '  ◆' + D.EL[P.infuse.el].n + ' 부여' : ''); E.hpf.style.width = (cs.hp * 100) + '%'; E.hpf.style.background = cs.hp < .3 ? '#e0524a' : '#7be06a'; E.shf.style.width = P.shield ? Math.min(100, P.shield.hp / st.hp * 100) + '%' : '0'; E.hptxt.textContent = Math.ceil(cs.hp * st.hp) + ' / ' + Math.round(st.hp);
    var ms = G.maxStam(); E.stbar.style.visibility = P.st < ms - .5 ? 'visible' : 'hidden'; E.stf.style.width = (P.st / ms * 100) + '%'; E.stf.style.background = P.st < 20 ? '#ff6a4a' : '#ffd24a';
    var r = G.rtOf(cid), cdEl = E.b_skill.firstElementChild; cdEl.textContent = r.ch > 0 ? '' : Math.ceil(r.chT); E.b_skill.querySelector('span').textContent = G.maxCharges(cid) > 1 ? '스킬 ×' + r.ch : '스킬';
    var en = (cs.en || 0) / G.burstCost(cid); E.b_burst.querySelector('.en').style.height = Math.min(100, en * 100) + '%'; E.b_burst.classList.toggle('ready', en >= 1 && r.cdB <= 0); E.b_burst.style.background = en >= 1 ? D.EL[c.el].c : '';
    var bt = G.buffs.map(function (b) { return (b.n || '강화') + ' ' + Math.ceil(b.t) + '초'; }); if (S.food && S.food.until > Date.now()) bt.push('음식 효과 ' + Math.ceil((S.food.until - Date.now()) / 1000) + '초'); if (G.inst && G.inst.sub && G.inst.kind == 'tower') bt.push(G.inst.sub); E.buffs.textContent = bt.join(' · ');
    var b = G.boss; E.bossbar.classList.toggle('hide', !b); if (b) { E.bossname.textContent = b.def.n + '  Lv.' + b.lvl; E.bosshp.style.width = Math.max(0, b.hp / b.maxHp * 100) + '%'; E.bossar.style.width = (b.stun > 0 ? 0 : b.armor.g) + '%'; E.bossweak.innerHTML = b.stun > 0 ? '<span class="gold">약점 노출! 지금 공격하세요</span>' : '갑주 — 약점 원소: ' + b.armor.els.map(function (x) { return '<span style="color:' + D.EL[x].c + '">' + D.EL[x].n + '</span>'; }).join(' · '); }
    if (G.inst && G.inst.timer && !G.inst.done) T.timer(G.inst.t, D.TOWER[G.tower ? G.tower.fi : 0].n);
    else if (G.inst && G.inst.timer) T.timer(null);
    // 미니맵·임무 추적 (간헐 갱신)
    mmT -= dt; if (mmT <= 0) { mmT = .12; drawMini();
      var reg = G.env.reg, h = S.clock, wn = { clear: '맑음', rain: '비', thunder: '뇌우', snow: '눈' }[G.env.cur];
      E.mminfo.textContent = (reg == 'arena' ? (G.inst ? G.inst.name : '') : D.REGION[reg].n) + ' · ' + ('0' + Math.floor(h)).slice(-2) + ':' + ('0' + Math.floor(h % 1 * 60)).slice(-2) + ' · ' + wn;
      var tid = S.track && S.q[S.track] && !S.q[S.track].done ? S.track : 'main', q = D.Q[tid], qs = S.q[tid]; if (qs && !qs.done) { var sp = q.steps[qs.s], tg = G.questTarget(), extra = sp.t == 'collect' ? ' (' + Math.min(sp.n, ST.cnt(sp.item)) + '/' + sp.n + ')' : ''; E.qt.innerHTML = '<b>[' + q.type + '] ' + q.n + '</b>' + sp.txt + extra + (tg ? ' <small>' + Math.round(Math.hypot(tg.x - P.x, tg.z - P.z)) + 'm</small>' : ''); E.qt.classList.remove('hide'); } else E.qt.classList.add('hide'); }
  };
  // ───── 지도 ─────
  var TC = { 0: [86, 176, 82], 2: [128, 88, 60], 3: [130, 132, 142], 4: [226, 202, 138], 5: [228, 238, 248], 7: [150, 208, 240], 8: [180, 100, 68], 10: [76, 68, 70], 11: [154, 146, 124], 12: [140, 100, 64], 15: [176, 64, 56], 16: [60, 88, 168], 18: [68, 66, 78], 19: [207, 192, 160], 20: [60, 60, 130], 21: [62, 60, 82], 22: [40, 38, 60], 24: [90, 124, 80], 30: [184, 152, 60] };
  function buildMap() {
    var cv = document.createElement('canvas'); cv.width = cv.height = 256; var g = cv.getContext('2d'), im = g.createImageData(256, 256), d = im.data, w = W;
    for (var j = 0; j < 256; j++) for (var i = 0; i < 256; i++) { var id = j * 256 + i, h = w.h[id], c = TC[w.stile[id] && w.st[id] ? w.stile[id] : w.top[id]] || [120, 120, 120], sh = 1 + (h - (i > 0 ? w.h[id - 1] : h)) * .06 + (h - (j > 0 ? w.h[id - 256] : h)) * .06 + h * .004; if (w.wl[id] > h) { var dp = w.wl[id] - h; c = w.wt[id] ? [240, 110, 30] : [58 - dp * 2, 140 - dp * 4, 215 - dp * 3]; sh = 1; } if ((w.reg[id] & 16)) { c = [40, 110, 190]; sh = 1; } var o = id * 4; d[o] = U.clamp(c[0] * sh, 0, 255); d[o + 1] = U.clamp(c[1] * sh, 0, 255); d[o + 2] = U.clamp(c[2] * sh, 0, 255); d[o + 3] = 255; }
    g.putImageData(im, 0, 0); return cv;
  }
  T.mapImg = function () {
    var S = ST.S, sig = Object.keys(S.statues).join(); if (!mapBase) mapBase = buildMap(); if (mapFog && sig == fogSig) return mapFog; fogSig = sig;
    var cv = document.createElement('canvas'); cv.width = cv.height = 256; var g = cv.getContext('2d'); g.drawImage(mapBase, 0, 0); var im = g.getImageData(0, 0, 256, 256), d = im.data, on = [S.statues.st_meadow, S.statues.st_canyon, S.statues.st_snow, 1];
    for (var id = 0; id < 65536; id++) { var r = W.reg[id] & 7; if (r > 3) r = 0; if (!on[r] && W.h[id] > 0 && !(W.reg[id] & 16)) { var o = id * 4, hs = U.hash2(id % 256 >> 1, id >> 9, 3) * 12; d[o] = 34 + hs; d[o + 1] = 38 + hs; d[o + 2] = 58 + hs; } }
    g.putImageData(im, 0, 0); return mapFog = cv;
  };
  function drawMini() {
    var P = G.P, g = E.mm.getContext('2d'), S = ST.S, px = P.x / 2, pz = P.z / 2, sc = 2.5; g.imageSmoothingEnabled = false; g.fillStyle = '#1c3a5a'; g.fillRect(0, 0, 110, 110);
    g.drawImage(T.mapImg(), px - 22, pz - 22, 44, 44, 0, 0, 110, 110);
    function mk(x, z, col, s) { var mx = (x / 2 - px) * sc + 55, mz = (z / 2 - pz) * sc + 55, out = mx < 3 || mz < 3 || mx > 107 || mz > 107; mx = U.clamp(mx, 3, 107); mz = U.clamp(mz, 3, 107); g.fillStyle = '#000'; g.fillRect(mx - s - 1, mz - s - 1, s * 2 + 2, s * 2 + 2); g.fillStyle = col; g.fillRect(mx - s, mz - s, s * 2, s * 2); return out; }
    W.o.wps.forEach(function (w) { if (Math.abs(w.x - P.x) < 50 && Math.abs(w.z - P.z) < 50) mk(w.x, w.z, S.wps[w.id] ? '#6cf' : '#567', 2); });
    W.statues.forEach(function (w) { if (Math.abs(w.x - P.x) < 50 && Math.abs(w.z - P.z) < 50) mk(w.x, w.z, S.statues[w.id] ? '#9f9' : '#565', 2); });
    G.ens.forEach(function (e) { if (!e.dead && !e.def.animal && e.aggro && Math.abs(e.x - P.x) < 44 && Math.abs(e.z - P.z) < 44) mk(e.x, e.z, '#f44', 1); });
    if (G.hasMiru) G.objs.forEach(function (o) { if (o.k == 'gather' && !o.ref.ore && Math.abs(o.x - P.x) < 40 && Math.abs(o.z - P.z) < 40) mk(o.x, o.z, '#af6', 1); });
    S.pins.forEach(function (p) { mk(p[0], p[1], '#f8f', 2); });
    var q = G.questTarget(); if (q) mk(q.x, q.z, '#fd4', 3);
    g.save(); g.translate(55, 55); g.rotate(-G.cam.yaw + Math.PI); g.fillStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(0, 0); g.lineTo(-14, -22); g.lineTo(14, -22); g.fill(); g.restore();
    g.save(); g.translate(55, 55); g.rotate(-P.yaw + Math.PI); g.fillStyle = '#000'; g.fillRect(-3, -5, 6, 9); g.fillStyle = '#fff'; g.fillRect(-2, -4, 4, 7); g.fillStyle = '#fd4'; g.fillRect(-1, -6, 2, 3); g.restore();
  }
  T.screens.map = function () {
    var S = ST.S, P = G.P, sz = 840, mk = '';
    function m(x, z, txt, col, sub) { return '<div class="mk" style="left:' + (x / 512 * 100) + '%;top:' + (z / 512 * 100) + '%;color:' + col + '">' + txt + (sub ? '<br><span class="xs">' + sub + '</span>' : '') + '</div>'; }
    W.o.wps.forEach(function (w) { if (w.id == 'wp_altar' && !S.flags.altar) return; mk += m(w.x, w.z, '◈', S.wps[w.id] ? '#6cf' : '#667'); });
    W.statues.forEach(function (w) { mk += m(w.x, w.z, '♜', S.statues[w.id] ? '#9f9' : '#787'); });
    W.o.gates.forEach(function (w) { mk += m(w.x, w.z, '▣', '#fc6', w.name); });
    for (var k in W.bossPos) mk += m(W.bossPos[k].x, W.bossPos[k].z, '☠', '#f66', D.EN[k].n.split(' ').pop());
    if (S.flags.altar) mk += m(W.altar.x, W.altar.z, '☠', '#f6f', '별의 제단');
    mk += m(W.town.x, W.town.z + 34, '', '#fff', '새벽나루'); S.pins.forEach(function (p) { mk += m(p[0], p[1], '⚑', '#f8f'); });
    var q = G.questTarget(); if (q) mk += m(q.x, q.z, '◆', '#fd4', '임무');
    mk += m(P.x, P.z, '▲', '#fff', '현재 위치');
    setTimeout(function () { var c = document.getElementById('mapcv'); if (c) { var g = c.getContext('2d'); g.drawImage(T.mapImg(), 0, 0); } }, 0);
    return '<div class="win"><h2>지도 — 아스텔 대륙<span><button class="x" data-a="close">닫기</button></span></h2><div class="body"><div id="mapwrap"><div style="position:absolute;left:50%;top:50%;width:' + sz + 'px;height:' + sz + 'px;margin:-' + sz / 2 + 'px"><canvas id="mapcv" width="256" height="256" style="width:100%;height:100%" data-a="mapclick"></canvas>' + mk + '</div>' +
      '<div class="maplg"><span style="color:#6cf">◈</span> 별문 (클릭: 순간이동)<br><span style="color:#9f9">♜</span> 길잡이 석상<br><span style="color:#fc6">▣</span> 비경·첨탑<br><span style="color:#f66">☠</span> 보스<br><span style="color:#f8f">⚑</span> 표식 (빈 곳 클릭)<br><span style="color:#fd4">◆</span> 임무 목표<br><span class="dim xs">석상을 활성화하면 지역이 밝혀집니다</span></div></div></div></div>';
  };
  T.acts.mapclick = function (ev) {
    var r = this.getBoundingClientRect(), x = (ev.clientX - r.left) / r.width * 512, z = (ev.clientY - r.top) / r.height * 512, S = ST.S, best = null, bd = 16;
    W.o.wps.forEach(function (w) { var d = Math.hypot(w.x - x, w.z - z); if (d < bd && S.wps[w.id]) { bd = d; best = w; } });
    if (best) { if (G.inst) { T.toast('비경 안에서는 이동할 수 없습니다'); return; } T.close(); T.teleportTo(best); return; }
    for (var i = 0; i < S.pins.length; i++) if (Math.hypot(S.pins[i][0] - x, S.pins[i][1] - z) < 12) { S.pins.splice(i, 1); T.refresh(); return; }
    if (S.pins.length >= 8) S.pins.shift(); S.pins.push([Math.round(x), Math.round(z)]); T.refresh();
  };
  T.teleportTo = function (w) { T.transition('tele', function () { G.teleport(w.x + 1.6, null, w.z + 1.6); G.ens.forEach(function (e) { e.aggro = false; }); ST.bump('teleports', 1); T.banner(w.name, ''); var P = G.P; G.orbitCine(P.x, P.y, P.z, 1.5, 14, 7.5, G.cam.yaw + Math.PI - 1.2, G.cam.yaw + Math.PI, 9, 3.8, null, 10); }); };
  // ───── 화면 관리 ─────
  T.open = function (name, arg) { if (!T.screens[name] || G.mode == 'title') return; if (G.inst && ['gate', 'fishing', 'cook', 'forge', 'alchemy', 'shop'].indexOf(name) >= 0) return; T.cur = { name: name, arg: arg }; if (G.mode == 'play') G.mode = 'menu'; E.screen.innerHTML = T.screens[name](arg); E.screen.classList.remove('hide'); T.prompt(null); if (document.pointerLockElement) document.exitPointerLock(); G.inp.mx = G.inp.mz = 0; G.inp.h = {}; };
  T.refresh = function (arg) { if (!T.cur) return; if (arg !== undefined) T.cur.arg = arg; var sc = [].map.call(E.screen.querySelectorAll('.col'), function (c) { return c.scrollTop; }); E.screen.innerHTML = T.screens[T.cur.name](T.cur.arg); [].forEach.call(E.screen.querySelectorAll('.col'), function (c, i) { c.scrollTop = sc[i] || 0; }); };
  T.close = function () { if (T.cur && T.onClose) { var f = T.onClose; T.onClose = null; f(); } T.cur = null; E.screen.classList.add('hide'); E.screen.innerHTML = ''; if (G.mode == 'menu') G.mode = 'play'; ST.save(); T.dirty = true; };
  T.acts.close = function () { T.close(); }; T.acts.open = function (n, a) { if (G.mode == 'play' || G.mode == 'menu') T.open(n, a); }; T.acts.swap = function (i) { G.inp.p['sw' + i] = true; };
  T.acts.tab = function (v) { T.refresh(isNaN(v) ? v : +v); };
  // ───── 피해 숫자·적 체력바 (2D 오버레이) ─────
  T.drawFx = function (dt) {
    var c = T.fxc, cw = E.fx.width, chh = E.fx.height, k = cw / R.W; c.clearRect(0, 0, cw, chh); if (G.photo) return;
    c.textAlign = 'center'; c.lineJoin = 'round';
    G.ens.forEach(function (e) { if (e.dead || e.def.boss || e.def.animal || (!e.aggro && e.hp >= e.maxHp)) return; var p = R.project(e.x, e.y + (e.def.fly || 0) + 1.75 * e.sc, e.z); if (!p || p.w > 45) return; var x = p.x * cw, y = p.y * chh, w = 26 * k * (e.def.elite ? 1.3 : 1), h = 2 * k; c.fillStyle = '#0e0c1c'; c.fillRect(x - w / 2 - k, y - k, w + 2 * k, h + 2 * k); c.fillStyle = '#e0524a'; c.fillRect(x - w / 2, y, w * Math.max(0, e.hp / e.maxHp), h); if (e.shield && e.shield.g > 0) { c.fillStyle = '#0e0c1c'; c.fillRect(x - w / 2 - k, y + h + k, w + 2 * k, h + k); c.fillStyle = D.EL[e.shield.el].c; c.fillRect(x - w / 2, y + h + k, w * e.shield.g / e.shield.max, h); } c.font = 'bold ' + (5 * k) + 'px sans-serif'; c.fillStyle = '#fff'; c.strokeStyle = '#000'; c.lineWidth = k; c.strokeText('Lv.' + e.lvl, x, y - 2 * k); c.fillText('Lv.' + e.lvl, x, y - 2 * k); });
    for (var i = G.nums.length - 1; i >= 0; i--) { var n = G.nums[i]; n.life += dt; if (n.life > .95) { G.nums.splice(i, 1); continue; } var p = R.project(n.x, n.y + n.life * 1.4, n.z); if (!p) continue; var big = n.big == 'c', re = n.big == 'r', sz = (big ? 11 : re ? 8.5 : 7.5) * k * (n.life < .1 ? 1.5 - n.life * 5 : 1); c.font = 'bold ' + sz + 'px sans-serif'; c.globalAlpha = n.life > .7 ? (0.95 - n.life) * 4 : 1; c.lineWidth = k * (big ? 2 : 1.5); c.strokeStyle = big ? '#3a1800' : '#0e0c1c'; c.fillStyle = 'rgb(' + n.c[0] + ',' + n.c[1] + ',' + n.c[2] + ')'; c.strokeText(n.txt, p.x * cw, p.y * chh); c.fillText(n.txt, p.x * cw, p.y * chh); if (big) { c.fillStyle = '#fff'; c.font = 'bold ' + sz * .45 + 'px sans-serif'; c.fillText('치명타', p.x * cw, p.y * chh - sz * .9); } }
    c.globalAlpha = 1;
    if (G.sight) { c.fillStyle = 'rgba(40,160,200,.14)'; c.fillRect(0, 0, cw, chh); }
  };
  // ───── 시작 화면 ─────
  T.title = function (hasSave) {
    E.loading.classList.add('hide'); E.title.classList.remove('hide'); E.title.classList.remove('open');
    E.title.innerHTML = '<div class="door dl"></div><div class="door dr"></div><div class="tc"><div class="logo">도트리아<small>별등 유랑기</small></div><div style="height:30px"></div>' + (hasSave ? '<button class="gold" data-a="start:load">이어서 하기</button>' : '') + '<button class="' + (hasSave ? '' : 'gold') + '" data-a="start:new">' + (hasSave ? '처음부터 (저장 삭제)' : '문을 열고 시작') + '</button><button data-a="start:auto">자동 플레이 (녹화용)</button><button data-a="start:import">저장 불러오기</button><div class="ver">모든 그림과 소리는 코드로 만들어졌습니다 · 실제 결제 없음 · 저장은 이 브라우저에만 남습니다</div></div>';
  };
  T.openDoor = function (cb) { E.title.classList.add('open'); AUD.sfx('door'); setTimeout(function () { E.title.classList.add('hide'); cb && cb(); }, 2500); };
  T.questDone = function (q, rw) {
    var d = document.createElement('div'); d.className = 'qdone'; d.style.pointerEvents = 'auto'; var main = q.id == 'main';
    d.innerHTML = '<h1>임무 완료</h1><div style="font-size:44px">[' + q.type + '] ' + q.n + '</div><div class="rw">' + rw.map(function (r) { if (r[0] == 'art') { var a = ST.S.arts[r[1]]; return '<div class="it r' + a.r + '"><img class="px" src="' + T.artIcon(a) + '"><div class="c">장신구</div></div>'; } return '<div class="it r' + ((D.ITEMS[r[0]] || { r: 3 }).r) + '"><img class="px" src="' + T.icon(r[0]) + '"><div class="c">×' + U.fmt(r[1]) + '</div></div>'; }).join('') + '</div><button class="gold" style="font-size:34px;padding:12px 80px">확인</button>';
    E.over.appendChild(d); AUD.sfx('clear'); G.mode = 'menu';
    d.querySelector('button').onclick = function () { if (main && !d.cr) { d.cr = 1; d.innerHTML = '<h1 style="font-size:90px">별이 돌아왔다</h1><div class="credits">도트리아: 별등 유랑기<br><br>기획·그림·소리·프로그램 — 전부 코드 한 줄 한 줄로<br>모든 도트는 한 점씩 계산해 찍었고, 모든 소리는 파형으로 합성했습니다<br><br>여정은 끝나지 않습니다. 비경, 별빛 첨탑, 주간 보스,<br>그리고 아직 만나지 못한 인연이 기다립니다.<br><br>플레이해 주셔서 고맙습니다.</div><button class="gold" style="font-size:34px;padding:12px 80px">여정 계속하기</button>'; d.querySelector('button').onclick = arguments.callee; AUD.music('title'); return; } d.parentNode.removeChild(d); G.mode = 'play'; T.done = true; };
    if (T.autoDlg) setTimeout(function () { var b = d.querySelector('button'); b && b.click(); }, 4000);
  };
  return T;
})();
