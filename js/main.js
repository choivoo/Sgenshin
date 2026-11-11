// 부팅, 화면 크기(정수 배 확대), 입력(키보드·마우스·터치), 메인 루프
(function () {
  var D = DATA, stage = document.getElementById('stage'), glc = document.getElementById('gl'), fxc = document.getElementById('fx'), uiEl = document.getElementById('ui'), uiScale = 1, keys = {}, last = 0, musT = 0, saveT = 0, grpT = 0, sightT = 0, titleA = 0;
  function resize() {
    var dpr = window.devicePixelRatio || 1, aw = innerWidth * dpr, ah = innerHeight * dpr, fitH = Math.min(ah, aw * 9 / 16), k = Math.max(1, Math.ceil(fitH / 300)), H = Math.floor(fitH / k), Wd = Math.floor(H * 16 / 9 / 2) * 2;
    var cw = Wd * k / dpr, ch = H * k / dpr; stage.style.width = cw + 'px'; stage.style.height = ch + 'px'; stage.style.left = ((innerWidth - cw) / 2) + 'px'; stage.style.top = ((innerHeight - ch) / 2) + 'px';
    R.resize(Wd, H); fxc.width = Wd * 2; fxc.height = H * 2; uiScale = ch / 1080; uiEl.style.transform = 'scale(' + (cw / 1920) + ',' + uiScale + ')'; G.kScale = k;
  }
  function startPos() { for (var j = 210; j > 190; j--) { var x = 137 * 2 + 1, z = j * 2 + 1; if (W.h[j * 256 + 137] > 2 && !W.liquid(x, z)) return { x: x, z: z }; } return { x: W.town.x, z: W.town.z + 40 }; }
  function boot() {
    UI.init(); try { R.init(glc); } catch (e) { document.getElementById('loadtxt').textContent = 'WebGL을 사용할 수 없는 브라우저입니다: ' + e.message; return; }
    resize(); addEventListener('resize', resize); addEventListener('orientationchange', function () { setTimeout(resize, 200); });
    var lf = document.getElementById('loadf');
    R.bake(function (p) { lf.style.width = (p * 90) + '%'; }).then(function () {
      W = WORLD.init(); R.buildWorld(W); lf.style.width = '100%';
      var has = ST.load(); if (!has) { ST.noSave = true; ST.fresh(); }
      var sp = startPos(); G.newPlayer(sp.x, sp.z); G.hideP = true; G.mode = 'title'; ST.S.clock = has ? ST.S.clock : 17.6;
      UI.title(has); bindInput(); requestAnimationFrame(frame);
      var q = new URLSearchParams(location.search); if (q.get('auto')) setTimeout(function () { UI.acts.start('auto'); }, 600);
      window.__ready = true;
    });
  }
  UI.acts.start = function (kind) {
    AUD.init(); AUD.music('title');
    if (kind == 'import') { var t = prompt('내보낸 저장 문자열을 붙여 넣으세요'); if (t) { try { ST.noSave = false; ST.importS(t); location.reload(); } catch (e) { UI.toast('저장 데이터를 읽을 수 없습니다'); } } return; }
    if (kind == 'new') { ST.clear(); ST.noSave = false; ST.fresh(); } else if (kind == 'auto') { ST.noSave = true; ST.fresh(); AUTO.setup(); } else ST.noSave = false;
    var S = ST.S, sp = S.pos || startPos(); G.newPlayer(sp.x, sp.z); if (S.pos) G.P.y = W.ground(sp.x, sp.z, S.pos.y + .5); G.hideP = false; G.initGroups(); G.buildObjs(); AUD.setVol(S.set.bgm, S.set.sfx); ST.daily(); UI.dirty = true;
    G.cam.yaw = Math.PI; G.P.yaw = Math.PI; var P = G.P;
    G.cine = { t: 0, dur: 2.6, fn: function (k) { var e = k * k * (3 - 2 * k), a = titleA + (Math.PI * 2 - (titleA % (Math.PI * 2))) * e, r = 34 - 27 * e, h = 16 - 12.6 * e, cx = W.town.x + (P.x - W.town.x) * e, cz = W.town.z + (P.z - W.town.z) * e, cy = W.town.y + (P.y - W.town.y) * e; return { x: cx + Math.sin(a) * r, y: cy + h, z: cz + Math.cos(a) * r, yaw: a + Math.PI, pitch: Math.atan2(h - 1, r) }; }, done: function () { } };
    G.mode = 'opening';
    UI.openDoor(function () { G.mode = 'play'; UI.E.hud.classList.remove('hide'); musT = 0; if (kind == 'auto') AUTO.run(); else if (kind == 'new') UI.toast('WASD로 이동, 마우스로 시점을 돌려 보세요'); });
  };
  // ───── 입력 ─────
  var KM = { KeyW: 'u', ArrowUp: 'u', KeyS: 'd', ArrowDown: 'd', KeyA: 'l', ArrowLeft: 'l', KeyD: 'r', ArrowRight: 'r' };
  var PRESS = { Space: 'jump', ShiftLeft: 'dash', ShiftRight: 'dash', KeyE: 'skill', KeyQ: 'burst', KeyF: 'interact', KeyX: 'drop', Digit1: 'sw0', Digit2: 'sw1', Digit3: 'sw2', Digit4: 'sw3' };
  var OPEN = { KeyM: 'map', KeyB: 'bag', KeyC: 'chars', KeyJ: 'quests', KeyG: 'gacha', KeyL: 'party', KeyK: 'book' };
  function press(b, down) { var inp = G.inp; if (down) { inp.p[b] = true; inp.h[b] = true; if (b == 'sight') toggleSight(); } else inp.h[b] = false; }
  function toggleSight() { G.sight = !G.sight; sightT = 10; AUD.sfx(G.sight ? 'orb' : 'ui'); if (G.sight) UI.toast('정령안: 원소 흔적과 숨은 보물이 보입니다'); }
  function bindInput() {
    addEventListener('keydown', function (e) {
      if (e.target.tagName == 'TEXTAREA' || e.target.tagName == 'INPUT') return; AUD.init(); var c = e.code; if (e.repeat) { if (c == 'Space' || c == 'Tab') e.preventDefault(); return; }
      if (c == 'Space' || c == 'Tab' || c.indexOf('Arrow') == 0) e.preventDefault();
      if (UI.gachaOn) { if (c == 'Space' || c == 'Enter' || c == 'KeyF') UI.gachaClick(); if (c == 'Escape') UI.acts.gskip(); return; }
      if (G.mode == 'dialog') { if (c == 'Space' || c == 'Enter' || c == 'KeyF') UI.dlgNext(); return; }
      if (c == 'Escape') { if (G.photo) UI.acts.photoend(); else if (UI.cur) UI.close(); else if (G.mode == 'play') UI.open('menu'); return; }
      if (G.mode == 'menu') { if (UI.cur && UI.cur.name == 'fishing' && (c == 'Space' || c == 'KeyF')) UI.fishKey(true); else if (UI.cur && UI.cur.name == 'cook' && (c == 'Space' || c == 'KeyF')) UI.acts.cookstop(); else if (OPEN[c] && UI.cur && UI.cur.name == OPEN[c]) UI.close(); return; }
      if (G.mode != 'play') return;
      keys[c] = true; if (PRESS[c]) press(PRESS[c], true); if (c == 'KeyV') toggleSight(); if (c == 'KeyZ') UI.acts.quickfood(); if (OPEN[c] && !G.photo) UI.open(OPEN[c]);
    });
    addEventListener('keyup', function (e) { var c = e.code; keys[c] = false; if (PRESS[c]) press(PRESS[c], false); if (c == 'Space' || c == 'KeyF') UI.fishKey(false); });
    addEventListener('blur', function () { keys = {}; G.inp.h = {}; });
    // 마우스
    var drag = false, lx = 0, ly = 0;
    glc.addEventListener('mousedown', function (e) { AUD.init(); if (G.mode != 'play') return; if (e.button == 0 && !G.photo) press('atk', true); drag = true; lx = e.clientX; ly = e.clientY; if (!document.pointerLockElement && glc.requestPointerLock && !document.body.classList.contains('touch') && !G.photo && !AUTO.on) { try { var pr = glc.requestPointerLock(); if (pr && pr.catch) pr.catch(function () { }); } catch (er) { } } e.preventDefault(); });
    addEventListener('mouseup', function (e) { if (e.button == 0) press('atk', false); drag = false; });
    addEventListener('mousemove', function (e) { if (G.mode != 'play') return; var dx, dy; if (document.pointerLockElement == glc) { dx = e.movementX; dy = e.movementY; } else if (drag) { dx = e.clientX - lx; dy = e.clientY - ly; lx = e.clientX; ly = e.clientY; } else return; G.cam.yaw -= dx * .0042; G.cam.pitch += dy * .0036; });
    glc.addEventListener('wheel', function (e) { G.cam.dist += e.deltaY * .006; e.preventDefault(); }, { passive: false });
    glc.addEventListener('contextmenu', function (e) { e.preventDefault(); });
    // 버튼(마우스+터치)
    [].forEach.call(document.querySelectorAll('[data-btn]'), function (el) {
      var b = el.getAttribute('data-btn'); function dn(e) { e.preventDefault(); e.stopPropagation(); AUD.init(); if (G.mode == 'play') press(b, true); el.classList.add('press'); } function up(e) { press(b, false); el.classList.remove('press'); }
      el.addEventListener('touchstart', dn, { passive: false }); el.addEventListener('touchend', up); el.addEventListener('touchcancel', up); el.addEventListener('mousedown', dn); el.addEventListener('mouseup', up); el.addEventListener('mouseleave', up);
    });
    // 터치: 왼쪽 스틱, 오른쪽 카메라
    var stickId = null, sx = 0, sy = 0, camId = null, cx = 0, cy = 0, st = UI.E.stick, pinch = 0;
    glc.addEventListener('touchstart', function (e) {
      e.preventDefault(); AUD.init(); document.body.classList.add('touch'); var r = stage.getBoundingClientRect();
      for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i], x = t.clientX - r.left, y = t.clientY - r.top; if (x < r.width * .42 && stickId == null && !G.photo) { stickId = t.identifier; sx = x; sy = y; st.style.display = 'block'; st.style.left = (x / uiScale - 100) + 'px'; st.style.top = (y / uiScale - 100) + 'px'; st.firstChild.style.transform = ''; } else if (camId == null) { camId = t.identifier; cx = t.clientX; cy = t.clientY; } else pinch = Math.hypot(t.clientX - cx, t.clientY - cy); }
    }, { passive: false });
    glc.addEventListener('touchmove', function (e) {
      e.preventDefault(); var r = stage.getBoundingClientRect();
      for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; if (t.identifier == stickId) { var dx = t.clientX - r.left - sx, dy = t.clientY - r.top - sy, m = 60 * uiScale, l = Math.hypot(dx, dy); if (l > m) { dx *= m / l; dy *= m / l; } G.inp.tx = dx / m; G.inp.tz = -dy / m; st.firstChild.style.transform = 'translate(' + (dx / uiScale) + 'px,' + (dy / uiScale) + 'px)'; G.inp.h.dash = l > m * 1.9; } else if (t.identifier == camId) { if (G.mode == 'play') { G.cam.yaw -= (t.clientX - cx) * .007; G.cam.pitch += (t.clientY - cy) * .006; } cx = t.clientX; cy = t.clientY; } else if (pinch) { var d = Math.hypot(t.clientX - cx, t.clientY - cy); G.cam.dist -= (d - pinch) * .03; pinch = d; } }
    }, { passive: false });
    function tend(e) { for (var i = 0; i < e.changedTouches.length; i++) { var t = e.changedTouches[i]; if (t.identifier == stickId) { stickId = null; G.inp.tx = G.inp.tz = 0; st.style.display = 'none'; G.inp.h.dash = false; } else if (t.identifier == camId) camId = null; else pinch = 0; } }
    glc.addEventListener('touchend', tend); glc.addEventListener('touchcancel', tend);
    document.addEventListener('visibilitychange', function () { if (document.hidden && G.mode != 'title' && ST.S) { G.savePos(); ST.save(); } });
  }
  function pollInput() {
    var inp = G.inp; if (AUTO.on) { AUTO.tick(G.rdt); return; }
    var mx = (keys.KeyD || keys.ArrowRight ? 1 : 0) - (keys.KeyA || keys.ArrowLeft ? 1 : 0), mz = (keys.KeyW || keys.ArrowUp ? 1 : 0) - (keys.KeyS || keys.ArrowDown ? 1 : 0);
    if (inp.tx || inp.tz) { mx = inp.tx; mz = inp.tz; } inp.mx = mx; inp.mz = mz;
  }
  // ───── 루프 ─────
  function music() {
    if (G.inst) return; var P = G.P, tr; if (G.boss) tr = 'boss'; else if (G.ens.some(function (e) { return !e.dead && e.aggro && !e.def.animal && Math.hypot(e.x - P.x, e.z - P.z) < 32; })) tr = 'battle'; else { tr = G.env.reg || 'meadow'; if (tr == 'arena') tr = 'battle'; }
    AUD.music(tr);
  }
  function frame(now) {
    requestAnimationFrame(frame); var dt = Math.min(.05, (now - last) / 1000 || .016); last = now; G.rdt = dt;
    if (G.mode == 'title') { titleA += dt * .12; ST.S.clock = 17.6; G.updateEnv(dt); G.t += dt; var cx = W.town.x + Math.sin(titleA) * 34, cz = W.town.z + Math.cos(titleA) * 34; R.cam.fov = 58; R.setCam(cx, W.town.y + 16, cz, titleA + Math.PI, Math.atan2(15, 34)); G.dt = 0; G.draw(); return; }
    pollInput();
    var sdt = dt; if (G.freeze > 0) { G.freeze -= dt; sdt = 0; } sdt *= G.timeScale; if (G.mode != 'play' || G.photo) sdt = 0;
    G.dt = sdt; G.t += sdt;
    if (sdt > 0) {
      G.updatePlayer(sdt); G.updateEnemies(sdt); G.updateProjs(sdt); G.updateTele(sdt); G.updateInst(sdt); G.updateInteract(sdt);
      if ((grpT -= sdt) <= 0) { grpT = .5; G.updateGroups(); }
      if (G.sight && (sightT -= sdt) <= 0) G.sight = false;
      if ((saveT += sdt) > 20) { saveT = 0; G.savePos(); ST.save(); }
    }
    if (G.mode != 'title') { G.updateEnv(G.mode == 'play' ? dt : 0); G.updateCam(dt); }
    if ((musT -= dt) <= 0 && G.mode == 'play') { musT = 1; music(); }
    G.draw();
    if (G.wantShot) { G.wantShot = false; try { var a = document.createElement('a'), big = document.createElement('canvas'), k = 4; big.width = R.W * k; big.height = R.H * k; var bg = big.getContext('2d'); bg.imageSmoothingEnabled = false; bg.drawImage(glc, 0, 0, big.width, big.height); a.href = big.toDataURL('image/png'); a.download = 'dotria_photo.png'; a.click(); UI.toast('사진을 저장했습니다'); } catch (e) { } }
    UI.drawFx(dt); UI.update(dt);
    G.inp.p = {};
  }
  window.__G = G;
  boot();
})();
