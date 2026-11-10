// 도트 생성기: 작은 3D 프리미티브를 한 점씩 광선으로 찍어 8방향 도트 스프라이트를 만든다.
var PX = (function () {
  var hex = U.hex;
  function col(c) { return typeof c == 'string' ? hex(c) : c; }
  function E(c, r, co, o) { var p = { k: 0, c: c, r: typeof r == 'number' ? [r, r, r] : r, col: col(co) }; if (o) for (var k in o) p[k] = o[k]; return p; }
  function C(a, b, r, co, o) { var p = { k: 1, a: a, b: b, r: r, col: col(co) }; if (o) for (var k in o) p[k] = o[k]; return p; }
  function B(c, r, co, o) { var p = { k: 2, c: c, r: r, col: col(co) }; if (o) for (var k in o) p[k] = o[k]; return p; }
  function dark(c, f) { f = f || .62; return [c[0] * f | 0, c[1] * f * .95 | 0, Math.min(255, c[2] * f * 1.12) | 0]; }
  function lite(c) { return [Math.min(255, c[0] * 1.15 + 14) | 0, Math.min(255, c[1] * 1.15 + 14) | 0, Math.min(255, c[2] * 1.12 + 10) | 0]; }

  // 렌더: prims -> RGBA
  function render(prims, w, h, yaw, pitch, S, ox, oy, noOutline) {
    var out = new Uint8ClampedArray(w * h * 4), dep = new Float32Array(w * h), gid = new Int16Array(w * h);
    dep.fill(1e9);
    var sa = Math.sin(yaw), ca = Math.cos(yaw), sp = Math.sin(pitch), cp = Math.cos(pitch);
    var fx = -sa * cp, fy = -sp, fz = -ca * cp, rx = ca, rz = -sa;
    var ux = -rz * fy, uy = rz * fx - rx * fz, uz = rx * fy; // cross(r,f), r.y=0
    // 광원(뷰 기준 좌상단 앞)
    var lx = -.45, ly = .75, lz = .5, ll = Math.hypot(lx, ly, lz); lx /= ll; ly /= ll; lz /= ll;
    var Lx = rx * lx + ux * ly - fx * lz, Ly = uy * ly - fy * lz, Lz = rz * lx + uz * ly - fz * lz;
    for (var pi = 0; pi < prims.length; pi++) {
      var p = prims[pi], g = p.g != null ? p.g : pi + 1;
      // 화면 경계 상자
      var pts = p.k == 1 ? [p.a, p.b] : [p.c], rad = p.k == 1 ? p.r : Math.hypot(p.r[0], p.r[1], p.r[2]) * (p.k == 2 ? 1 : .8);
      if (p.k == 0) rad = Math.max(p.r[0], p.r[1], p.r[2]);
      var x0 = 1e9, x1 = -1e9, y0 = 1e9, y1 = -1e9;
      for (var q = 0; q < pts.length; q++) {
        var P = pts[q], sx = (P[0] * rx + P[2] * rz) * S + ox, sy = oy - (P[0] * ux + P[1] * uy + P[2] * uz) * S;
        x0 = Math.min(x0, sx - rad * S - 1); x1 = Math.max(x1, sx + rad * S + 1); y0 = Math.min(y0, sy - rad * S - 1); y1 = Math.max(y1, sy + rad * S + 1);
      }
      x0 = Math.max(1, Math.floor(x0)); y0 = Math.max(1, Math.floor(y0)); x1 = Math.min(w - 2, Math.ceil(x1)); y1 = Math.min(h - 2, Math.ceil(y1));
      for (var j = y0; j <= y1; j++) for (var i = x0; i <= x1; i++) {
        var sx2 = (i - ox + .5) / S, sy2 = (oy - j - .5) / S;
        var o0 = rx * sx2 + ux * sy2 - fx * 20, o1 = uy * sy2 - fy * 20, o2 = rz * sx2 + uz * sy2 - fz * 20;
        var t = -1, nx = 0, ny = 0, nz = 0, lx2 = 0, ly2 = 0, lz2 = 0;
        if (p.k == 0) {
          var R = p.r, a0 = (o0 - p.c[0]) / R[0], a1 = (o1 - p.c[1]) / R[1], a2 = (o2 - p.c[2]) / R[2], d0 = fx / R[0], d1 = fy / R[1], d2 = fz / R[2];
          var Aq = d0 * d0 + d1 * d1 + d2 * d2, Bq = a0 * d0 + a1 * d1 + a2 * d2, Cq = a0 * a0 + a1 * a1 + a2 * a2 - 1, ds = Bq * Bq - Aq * Cq;
          if (ds < 0) continue; t = (-Bq - Math.sqrt(ds)) / Aq;
          lx2 = a0 + d0 * t; ly2 = a1 + d1 * t; lz2 = a2 + d2 * t;
          if (p.clip && p.clip(lx2, ly2, lz2)) continue;
          nx = lx2 / R[0]; ny = ly2 / R[1]; nz = lz2 / R[2];
        } else if (p.k == 1) {
          var pa = p.a, pb = p.b, bx = pb[0] - pa[0], by = pb[1] - pa[1], bz = pb[2] - pa[2], ax = o0 - pa[0], ay = o1 - pa[1], az = o2 - pa[2];
          var baba = bx * bx + by * by + bz * bz, bard = bx * fx + by * fy + bz * fz, baoa = bx * ax + by * ay + bz * az, rdoa = fx * ax + fy * ay + fz * az, oaoa = ax * ax + ay * ay + az * az;
          var a = baba - bard * bard, b = baba * rdoa - baoa * bard, c = baba * oaoa - baoa * baoa - p.r * p.r * baba, hh = b * b - a * c, hit = false;
          if (hh >= 0 && a > 1e-7) { t = (-b - Math.sqrt(hh)) / a; var yy = baoa + t * bard; if (yy > 0 && yy < baba) hit = true; else { var cx = yy <= 0 ? ax : o0 - pb[0], cy = yy <= 0 ? ay : o1 - pb[1], cz = yy <= 0 ? az : o2 - pb[2]; b = fx * cx + fy * cy + fz * cz; c = cx * cx + cy * cy + cz * cz - p.r * p.r; hh = b * b - c; if (hh > 0) { t = -b - Math.sqrt(hh); hit = true; } } }
          else if (a <= 1e-7) { for (var e2 = 0; e2 < 2; e2++) { var E0 = e2 ? pb : pa, cx2 = o0 - E0[0], cy2 = o1 - E0[1], cz2 = o2 - E0[2]; b = fx * cx2 + fy * cy2 + fz * cz2; c = cx2 * cx2 + cy2 * cy2 + cz2 * cz2 - p.r * p.r; hh = b * b - c; if (hh > 0) { var tt = -b - Math.sqrt(hh); if (!hit || tt < t) t = tt; hit = true; } } }
          if (!hit) continue;
          var qx = o0 + fx * t - pa[0], qy = o1 + fy * t - pa[1], qz = o2 + fz * t - pa[2], hq = Math.max(0, Math.min(1, (qx * bx + qy * by + qz * bz) / baba));
          nx = qx - bx * hq; ny = qy - by * hq; nz = qz - bz * hq; ly2 = hq;
        } else {
          var tmin = -1e9, tmax = 1e9, ax2 = -1, sgn = 1, O = [o0, o1, o2], Dd = [fx, fy, fz];
          for (var k = 0; k < 3; k++) {
            if (Math.abs(Dd[k]) < 1e-7) { if (Math.abs(O[k] - p.c[k]) > p.r[k]) { tmin = 1e9; break; } continue; }
            var t1 = (p.c[k] - p.r[k] - O[k]) / Dd[k], t2 = (p.c[k] + p.r[k] - O[k]) / Dd[k], s1 = -1; if (t1 > t2) { var tm = t1; t1 = t2; t2 = tm; s1 = 1; }
            if (t1 > tmin) { tmin = t1; ax2 = k; sgn = s1; } if (t2 < tmax) tmax = t2;
          }
          if (tmin > tmax || ax2 < 0) continue; t = tmin; nx = ax2 == 0 ? sgn : 0; ny = ax2 == 1 ? sgn : 0; nz = ax2 == 2 ? sgn : 0;
          lx2 = (o0 + fx * t - p.c[0]) / p.r[0]; ly2 = (o1 + fy * t - p.c[1]) / p.r[1]; lz2 = (o2 + fz * t - p.c[2]) / p.r[2];
        }
        var idx = j * w + i; if (t >= dep[idx]) continue;
        var nl = Math.hypot(nx, ny, nz) || 1, ndl = (nx * Lx + ny * Ly + nz * Lz) / nl;
        var base = p.col, cc = null; if (p.f) { var fc = p.f(lx2, ly2, lz2, ndl); if (fc) { if (fc.em) { cc = fc.c; ndl = 9; } else base = fc; } }
        if (!cc) cc = p.em ? base : ndl > .45 ? lite(base) : ndl > -.1 ? base : dark(base);
        dep[idx] = t; gid[idx] = g; var o4 = idx * 4; out[o4] = cc[0]; out[o4 + 1] = cc[1]; out[o4 + 2] = cc[2]; out[o4 + 3] = 255;
      }
    }
    if (noOutline) return out;
    // 안쪽 윤곽(깊이 차) + 바깥 윤곽
    var src = new Uint8ClampedArray(out);
    for (var y = 1; y < h - 1; y++) for (var x = 1; x < w - 1; x++) {
      var id = y * w + x, o = id * 4;
      if (src[o + 3]) {
        var d = dep[id], gg = gid[id]; var nb = [id - 1, id + 1, id - w, id + w];
        for (var n = 0; n < 4; n++) { var ni = nb[n]; if (src[ni * 4 + 3] && gid[ni] != gg && dep[ni] < d - .06) { out[o] = src[o] * .55; out[o + 1] = src[o + 1] * .5; out[o + 2] = src[o + 2] * .62; break; } }
      } else {
        var nb2 = [id - 1, id + 1, id - w, id + w];
        for (var n2 = 0; n2 < 4; n2++) { var q2 = nb2[n2] * 4; if (src[q2 + 3]) { out[o] = src[q2] * .28; out[o + 1] = src[q2 + 1] * .22; out[o + 2] = src[q2 + 2] * .34 + 12; out[o + 3] = 255; break; } }
      }
    }
    return out;
  }
  function tilt(prims, ang, py) {
    var s = Math.sin(ang), c = Math.cos(ang);
    function rot(v) { var y = v[1] - py, z = v[2]; return [v[0], py + y * c - z * s, y * s + z * c]; }
    prims.forEach(function (p) { if (p.k == 1) { p.a = rot(p.a); p.b = rot(p.b); } else { p.c = rot(p.c); if (Math.abs(ang) > .8) p.r = [p.r[0], p.r[2], p.r[1]]; } });
    return prims;
  }
  function scaleP(prims, s) { prims.forEach(function (p) { if (p.k == 1) { p.a = p.a.map(function (v) { return v * s; }); p.b = p.b.map(function (v) { return v * s; }); p.r *= s; } else { p.c = p.c.map(function (v) { return v * s; }); p.r = p.r.map(function (v) { return v * s; }); } }); return prims; }

  // ───────── 인간형 리그 ─────────
  var FR = { idle: [0, 1], run: [2, 3, 4, 5], climb: [6, 7], glide: [8], swim: [9, 10], atk: [11, 12, 13], hit: [14], down: [15], cast: [16] }, NFR = 17;
  function pose(fi, wt) {
    var P = { bob: 0, legL: 0, legR: 0, aL: [.15, .12], aR: [.15, .12], lean: 0, wd: [-.45, .85, .2], tilt: 0 };
    if (wt == 'bow') P.wd = [0, 1, .1]; if (wt == 'book') P.wd = [0, 1, 0];
    if (fi == 1) { P.bob = -.014; P.aL = [.2, .16]; P.aR = [.2, .16]; }
    else if (fi >= 2 && fi <= 5) { var ph = (fi - 2) / 4 * Math.PI * 2, s = Math.sin(ph); P.legL = s * 1.0; P.legR = -s * 1.0; P.aL = [-s * .9, .15]; P.aR = [s * .9 + .2, .15]; P.bob = Math.abs(Math.cos(ph)) * .035; P.lean = .16; P.wd = [-.5, .5, -.6]; }
    else if (fi == 6 || fi == 7) { var k = fi == 6 ? 1 : -1; P.aL = [2.6 + k * .3, .25]; P.aR = [2.6 - k * .3, .25]; P.legL = .5 + k * .35; P.legR = .5 - k * .35; P.lean = .12; P.wd = null; P.bob = k * .02; }
    else if (fi == 8) { P.aL = [1.4, 1.3]; P.aR = [1.4, 1.3]; P.legL = -.5; P.legR = -.7; P.lean = .3; P.glider = 1; P.wd = null; }
    else if (fi == 9 || fi == 10) { var k2 = fi == 9 ? 1 : -1; P.aL = [1.8 + k2 * .7, .3]; P.aR = [1.8 - k2 * .7, .3]; P.lean = .35; P.wd = null; P.bob = -.05 + k2 * .015; }
    else if (fi == 11) { P.aR = [2.5, .5]; P.wd = [-.3, .8, -.5]; P.lean = -.08; P.legL = .3; P.legR = -.3; if (wt == 'bow') { P.aL = [1.5, .1]; P.aR = [1.2, .5]; P.wd = [0, 1, 0]; P.bowF = 1; } if (wt == 'book') { P.aR = [2.8, .3]; P.aL = [1.2, .3]; } }
    else if (fi == 12) { P.aR = [1.5, -.1]; P.wd = [.25, .05, 1]; P.lean = .22; P.legL = .5; P.legR = -.5; if (wt == 'bow') { P.aL = [1.55, .1]; P.aR = [1.0, .9]; P.wd = [0, 1, 0]; P.bowF = 1; P.lean = 0; } if (wt == 'book') { P.aR = [1.6, 0]; P.aL = [1.5, .2]; P.orb = 1; } }
    else if (fi == 13) { P.aR = [.6, -.5]; P.wd = [.8, -.35, .5]; P.lean = .25; P.legL = .45; P.legR = -.45; if (wt == 'bow') { P.aL = [1.3, .1]; P.aR = [.5, .5]; P.wd = [0, 1, 0]; P.bowF = 1; P.lean = 0; } if (wt == 'book') { P.aR = [1.2, .2]; P.aL = [.8, .3]; } }
    else if (fi == 14) { P.lean = -.3; P.aL = [.9, .8]; P.aR = [.9, .8]; P.legL = .25; P.legR = -.1; }
    else if (fi == 15) { P.tilt = -1.45; P.aL = [.4, .9]; P.aR = [.5, .9]; P.wd = null; }
    else if (fi == 16) { P.aL = [2.7, .45]; P.aR = [2.9, .35]; P.lean = -.1; P.wd = [-.1, 1, .1]; P.bob = .03; P.orb = wt == 'book' ? 1 : 0; }
    return P;
  }
  var STEEL = [200, 210, 225], WOOD = [130, 90, 55];
  function humanoid(L, P, wt, elc) {
    var pr = [], hipY = .42 + P.bob, lean = P.lean || 0;
    var skin = col(L.skin), hair = col(L.hair), c1 = col(L.c1), c2 = col(L.c2), c3 = col(L.c3), eye = col(L.eye), ex = L.ex || [];
    var hz = lean * .22, headY = hipY + .68, tz = lean * .1;
    function has(x) { return ex.indexOf(x) >= 0; }
    // 다리
    [[-1, P.legL], [1, P.legR]].forEach(function (s) {
      var a = s[1], foot = [s[0] * .1, .08 + (1 - Math.cos(a)) * .1 + (a < 0 ? -a * .1 : 0), Math.sin(a) * .3];
      pr.push(C([s[0] * .09, hipY, 0], foot, .075, L.sk ? skin : dark(c1, .8), { g: 1 }));
      pr.push(E([foot[0], foot[1] - .01, foot[2] + .03], [.085, .075, .12], dark(c1, .5), { g: 1 }));
    });
    if (has('cape')) pr.push(E([0, hipY + .16, -.17 + tz], [.27, .4, .07], dark(c3, .8), { g: 2 }));
    // 몸통
    pr.push(E([0, hipY + .2, tz], [.19, .25, .15], c1, { g: 3 }));
    if (L.sk) pr.push(E([0, hipY + .02, tz * .5], [.27, .15, .22], c2, { g: 3, f: function (x, y) { return y < -.45 ? c3 : null; } }));
    else pr.push(E([0, hipY + .03, tz * .5], [.2, .1, .16], c3, { g: 3 }));
    if (has('scarf')) { pr.push(E([0, hipY + .43, hz * .6], [.21, .08, .19], c3, { g: 4 })); pr.push(C([.08, hipY + .4, -.15], [.16, hipY + .12 + P.bob * 2, -.3 - lean * .5], .05, c3, { g: 4 })); }
    // 팔
    var hands = [];
    [[-1, P.aR], [1, P.aL]].forEach(function (s) {
      var a = s[1][0], sd = s[1][1], sh = [s[0] * .23, hipY + .36, tz];
      var d = [s[0] * Math.sin(sd), -Math.cos(a) * Math.cos(sd), Math.sin(a) * Math.cos(sd)], hd = [sh[0] + d[0] * .3, sh[1] + d[1] * .3, sh[2] + d[2] * .3];
      pr.push(C(sh, hd, .062, c2, { g: s[0] < 0 ? 5 : 6 })); pr.push(E(hd, .068, skin, { g: s[0] < 0 ? 5 : 6 })); hands.push(hd);
    });
    // 머리
    var hc = [0, headY, hz];
    pr.push(E(hc, .3, skin, { g: 7, f: function (x, y, z) { if (z > .45 && Math.abs(Math.abs(x) - .4) < .19 && y > -.4 && y < .12) return y > -.05 ? dark(eye, .45) : eye; if (z > .6 && Math.abs(Math.abs(x) - .62) < .12 && y < -.4 && y > -.62) return [255, 170, 160]; return null; } }));
    var hcl = function (x, y, z) { return z > .28 && y < .28 - Math.abs(x) * .25; };
    pr.push(E([0, headY + .035, hz - .03], [.335, .315, .335], hair, { g: 8, clip: hcl }));
    var hs = L.hs;
    if (hs == 'long') pr.push(E([0, headY - .32, hz - .19], [.27, .4, .13], hair, { g: 8 }));
    if (hs == 'pony') pr.push(C([0, headY + .08, hz - .3], [0, headY - .42, hz - .46 - lean * .4], .085, hair, { g: 8 }));
    if (hs == 'twin') { pr.push(C([-.33, headY + .02, hz - .06], [-.44, headY - .42, hz - .1 - lean * .3], .09, hair, { g: 8 })); pr.push(C([.33, headY + .02, hz - .06], [.44, headY - .42, hz - .1 - lean * .3], .09, hair, { g: 8 })); }
    if (hs == 'bob') pr.push(E([0, headY - .13, hz - .07], [.36, .2, .31], hair, { g: 8, clip: function (x, y, z) { return z > .2; } }));
    if (hs == 'spiky') { pr.push(E([0, headY + .33, hz - .05], [.1, .14, .1], hair, { g: 8 })); pr.push(E([-.2, headY + .27, hz - .08], [.1, .13, .1], hair, { g: 8 })); pr.push(E([.2, headY + .27, hz - .08], [.1, .13, .1], hair, { g: 8 })); pr.push(E([0, headY + .2, hz - .3], [.12, .14, .1], hair, { g: 8 })); }
    if (has('hat')) { pr.push(E([0, headY + .2, hz - .02], [.46, .055, .46], c1, { g: 9 })); pr.push(E([0, headY + .38, hz - .05], [.22, .24, .22], c1, { g: 9, f: function (x, y) { return y < -.55 ? c3 : null; } })); pr.push(E([.05, headY + .6, hz - .12], [.08, .1, .08], c1, { g: 9 })); }
    if (has('crown')) { pr.push(E([0, headY + .34, hz + .05], [.07, .09, .05], c3, { g: 9, em: 1 })); pr.push(E([-.13, headY + .3, hz + .05], [.05, .07, .04], c3, { g: 9 })); pr.push(E([.13, headY + .3, hz + .05], [.05, .07, .04], c3, { g: 9 })); }
    if (has('horns')) { pr.push(C([-.2, headY + .22, hz], [-.33, headY + .5, hz + .04], .05, c3, { g: 9 })); pr.push(C([.2, headY + .22, hz], [.33, headY + .5, hz + .04], .05, c3, { g: 9 })); }
    if (has('ears')) { pr.push(C([-.3, headY + .05, hz], [-.5, headY + .22, hz - .08], .05, skin, { g: 9 })); pr.push(C([.3, headY + .05, hz], [.5, headY + .22, hz - .08], .05, skin, { g: 9 })); }
    if (has('ribbon')) { pr.push(E([-.14, headY + .12, hz - .34], [.13, .1, .05], c3, { g: 9 })); pr.push(E([.14, headY + .12, hz - .34], [.13, .1, .05], c3, { g: 9 })); }
    if (has('leaf')) { pr.push(C([0, headY + .33, hz], [.1, headY + .52, hz], .03, [90, 160, 60], { g: 9 })); pr.push(E([.16, headY + .54, hz], [.1, .05, .06], [120, 200, 70], { g: 9 })); }
    if (has('halo')) pr.push(E([0, headY + .5, hz], [.24, .035, .24], c3, { g: 10, em: 1, clip: function (x, y, z) { return x * x + z * z < .45; } }));
    if (has('band')) pr.push(E([0, headY + .12, hz - .01], [.345, .05, .345], c3, { g: 9 }));
    if (has('mask')) pr.push(E([0, headY - .02, hz + .2], [.2, .22, .12], c3, { g: 9, f: function (x, y, z) { return (Math.abs(Math.abs(x) - .4) < .2 && y > -.1 && y < .3) ? [20, 20, 30] : null; } }));
    // 무기
    var hr = hands[0], hl = hands[1], d = P.wd;
    if (d && wt) {
      var n = Math.hypot(d[0], d[1], d[2]); d = [d[0] / n, d[1] / n, d[2] / n];
      var at = function (o, t) { return [o[0] + d[0] * t, o[1] + d[1] * t, o[2] + d[2] * t]; };
      if (wt == 'sword') { pr.push(C(at(hr, .08), at(hr, .62), .04, elc || STEEL, { g: 11, em: !!elc })); pr.push(E(at(hr, .06), .075, c3, { g: 11 })); }
      else if (wt == 'claymore') { pr.push(C(at(hr, .1), at(hr, .92), .07, elc || STEEL, { g: 11, em: !!elc })); pr.push(E(at(hr, .08), [.12, .07, .12], c3, { g: 11 })); }
      else if (wt == 'club') { pr.push(C(at(hr, 0), at(hr, .5), .05, WOOD, { g: 11 })); pr.push(E(at(hr, .6), .13, dark(WOOD, .8), { g: 11 })); }
      else if (wt == 'spear') { pr.push(C(at(hr, -.4), at(hr, .8), .028, WOOD, { g: 11 })); pr.push(E(at(hr, .9), [.06, .13, .06], elc || STEEL, { g: 11, em: !!elc })); }
      else if (wt == 'staff') { pr.push(C(at(hr, -.4), at(hr, .7), .03, WOOD, { g: 11 })); pr.push(E(at(hr, .8), .1, elc || c3, { g: 11, em: 1 })); }
      else if (wt == 'bow') { var hb = P.bowF ? hl : hr, m = [hb[0], hb[1], hb[2] + .04]; pr.push(C([m[0], m[1] + .42, m[2] - .1], m, .03, c3, { g: 11 })); pr.push(C([m[0], m[1] - .42, m[2] - .1], m, .03, c3, { g: 11 })); }
      else if (wt == 'book') { var bk = [hr[0] - .1, hr[1] + .16, hr[2] + .1]; pr.push(B(bk, [.11, .14, .04], c3, { g: 11 })); pr.push(B([bk[0], bk[1], bk[2] + .03], [.09, .12, .03], [245, 240, 225], { g: 11 })); }
    }
    if (P.orb) pr.push(E([hr[0], hr[1] + .2, hr[2] + .15], .12, elc || [255, 255, 200], { g: 12, em: 1 }));
    if (P.shield) pr.push(E([.3, hipY + .25, .22], [.28, .36, .07], P.shield, { g: 13, f: function (x, y) { return (x * x + y * y < .12) ? lite(P.shield) : null; } }));
    if (P.glider) { pr.push(E([-.55, hipY + .62, -.2], [.5, .035, .3], c3, { g: 14 })); pr.push(E([.55, hipY + .62, -.2], [.5, .035, .3], c3, { g: 14 })); pr.push(C([-.9, hipY + .62, -.05], [.9, hipY + .62, -.05], .03, WOOD, { g: 14 })); }
    if (P.tilt) tilt(pr, P.tilt, .12);
    return pr;
  }

  // ───────── 적 리그: frame 0,1 대기 / 2,3 이동 / 4 공격준비 / 5 공격 ─────────
  var GOB = { skin: '#7fa0a8', hair: '#33303f', hs: 'spiky', eye: '#ffe060', c1: '#7a4a3a', c2: '#a8804a', c3: '#e8d8b0', ex: ['horns'], sk: 0 };
  var EFR = [0, 1, 2, 4, 11, 12];
  function enemyPrims(rig, f, form, tint) {
    var t = tint ? col(tint) : null, pr = [], b = f == 1 ? .03 : 0, at = f == 5, wu = f == 4, mv = f == 2 ? 1 : f == 3 ? -1 : 0;
    if (rig == 'gob') { return scaleP(humanoid(GOB, pose(EFR[f]), 'club'), .92); }
    if (rig == 'gobarch') { var L = Object.assign({}, GOB, { c1: '#4a6a3a', ex: ['horns', 'band'], c3: '#c04040' }); return scaleP(humanoid(L, pose(EFR[f], 'bow'), 'bow'), .92); }
    if (rig == 'gobshield') { var P = pose(EFR[f]); P.shield = [110, 150, 60]; var L2 = Object.assign({}, GOB, { c1: '#5a5a6a', hs: 'short', ex: ['horns', 'mask'] }); return scaleP(humanoid(L2, P, 'club'), 1.05); }
    if (rig == 'gobmage') { var P2 = pose(f == 4 ? 16 : f == 5 ? 12 : EFR[f]); var L3 = Object.assign({}, GOB, { c1: '#8a2a3a', c2: '#3a2a3a', hs: 'long', hair: '#e0e0e0', ex: ['hat', 'mask'], sk: 1, c3: '#ffb040' }); return humanoid(L3, P2, 'staff', [255, 120, 50]); }
    if (rig == 'knight') { var P3 = pose(EFR[f]); var L4 = { skin: '#3a3038', hair: '#2a2028', hs: 'short', eye: '#ff6020', c1: '#3a3040', c2: '#5a4a58', c3: '#ff7030', ex: ['horns', 'cape', 'mask'], sk: 0 }; return scaleP(humanoid(L4, P3, 'claymore', [255, 110, 40]), 1.05); }
    if (rig == 'slime') {
      var sq = f == 1 ? .9 : wu ? .7 : at ? 1.25 : mv ? 1.1 : 1, c = t || [100, 200, 120], y0 = at ? .5 : mv > 0 ? .25 : 0;
      pr.push(E([0, y0 + .32 * sq, 0], [.42 / Math.sqrt(sq), .34 * sq, .42 / Math.sqrt(sq)], c, { f: function (x, y, z) { if (z > .5 && Math.abs(Math.abs(x) - .38) < .15 && y > -.15 && y < .3) return [30, 30, 50]; if (y > .55) return lite(lite(c)); return null; } }));
      pr.push(E([0, y0 + .68 * sq, 0], .09, lite(c), { em: 1 })); return pr;
    }
    if (rig == 'wolf' || rig == 'boar') {
      var bc = rig == 'wolf' ? [190, 215, 235] : [150, 105, 80], fat = rig == 'boar' ? 1.25 : 1, ph = mv * .5, lz = at ? .15 : 0, hy = wu ? .42 : .55;
      pr.push(E([0, .5 + b, 0], [.24 * fat, .24 * fat, .46], bc, { g: 1 }));
      pr.push(E([0, hy + b + .08, .5 + lz], [.19, .18, .22], bc, { g: 2, f: function (x, y, z) { if (z > .3 && Math.abs(Math.abs(x) - .5) < .22 && y > 0 && y < .5) return rig == 'wolf' ? [80, 200, 255] : [30, 20, 20]; return null; } }));
      pr.push(E([0, hy + b, .72 + lz], [.1, .08, .12], rig == 'wolf' ? dark(bc, .7) : [220, 150, 140], { g: 2 }));
      if (rig == 'wolf') { pr.push(C([-.12, hy + .22, .45], [-.16, hy + .42, .4], .05, bc, { g: 2 })); pr.push(C([.12, hy + .22, .45], [.16, hy + .42, .4], .05, bc, { g: 2 })); pr.push(C([0, .55, -.42], [0, .78 + b, -.75], .07, lite(bc), { g: 1 })); }
      else { pr.push(C([0, .55, -.45], [0, .62, -.56], .04, bc, { g: 1 })); pr.push(E([-.1, hy - .02, .78], .04, [240, 240, 220], { g: 2 })); pr.push(E([.1, hy - .02, .78], .04, [240, 240, 220], { g: 2 })); }
      [[-1, 1, ph], [1, 1, -ph], [-1, -1, -ph], [1, -1, ph]].forEach(function (l) { pr.push(C([l[0] * .15, .4, l[1] * .3], [l[0] * .16, .07, l[1] * .3 + l[2] * .5], .06, dark(bc, .8), { g: 3 })); });
      return pr;
    }
    if (rig == 'bird') { pr.push(E([0, .3 + b, 0], [.14, .13, .2], [220, 190, 130])); pr.push(E([0, .42 + b, .16], .1, [230, 200, 140], { f: function (x, y, z) { return z > .3 && Math.abs(Math.abs(x) - .5) < .25 && y > 0 ? [20, 20, 20] : null; } })); pr.push(E([0, .4 + b, .28], [.03, .03, .06], [240, 150, 40])); var wy = mv ? mv * .12 : 0; pr.push(E([-.18, .32 + wy, -.02], [.12, .03, .14], [180, 150, 100])); pr.push(E([.18, .32 + wy, -.02], [.12, .03, .14], [180, 150, 100])); return pr; }
    if (rig == 'wisp') { var c2 = t || [200, 150, 255], yy = .5 + (f % 2) * .06; pr.push(E([0, yy, 0], at ? .3 : .22, c2, { em: 1, f: function (x, y, z) { return (x * x + y * y < .25 && z > 0) ? { em: 1, c: [255, 255, 255] } : null; } })); pr.push(E([-.3, yy + .1 + mv * .08, -.05], [.2, .04, .1], lite(c2), { em: 1 })); pr.push(E([.3, yy + .1 - mv * .08, -.05], [.2, .04, .1], lite(c2), { em: 1 })); return pr; }
    if (rig == 'spirit') {
      var ic = t || [170, 225, 255], fy = .35 + (f % 2) * .05;
      pr.push(E([0, fy + .3, 0], [.3, .42, .26], dark(ic, .8), { g: 1 })); pr.push(E([0, fy + .62, 0], [.17, .2, .14], [240, 250, 255], { g: 1 }));
      pr.push(E([0, fy + .98, 0], .2, [235, 245, 255], { g: 2, f: function (x, y, z) { return z > .45 && Math.abs(Math.abs(x) - .42) < .18 && y > -.3 && y < .15 ? [60, 110, 220] : null; } }));
      pr.push(E([0, fy + 1.03, -.04], [.23, .2, .23], ic, { g: 2, clip: function (x, y, z) { return z > .3 && y < .3; } }));
      for (var i = 0; i < 4; i++) { var a = i * 1.57 + f * .4, rr = wu || at ? .75 : .55; pr.push(C([Math.cos(a) * rr, fy + .5, Math.sin(a) * rr], [Math.cos(a) * rr, fy + .85, Math.sin(a) * rr], .05, lite(ic), { em: 1, g: 3 })); }
      var ar = wu ? 2.7 : at ? 1.5 : .3; pr.push(C([-.2, fy + .72, 0], [-.3, fy + .72 - Math.cos(ar) * .3, Math.sin(ar) * .3], .045, [240, 250, 255], { g: 4 })); pr.push(C([.2, fy + .72, 0], [.3, fy + .72 - Math.cos(ar) * .3, Math.sin(ar) * .3], .045, [240, 250, 255], { g: 4 }));
      return pr;
    }
    if (rig == 'golem') {
      var rc = [125, 120, 115], gl = [255, 200, 80], ay = wu ? 1.5 : at ? .25 : .65, az = at ? .5 : 0;
      pr.push(E([0, .85 + b, 0], [.5, .45, .38], rc, { g: 1, f: function (x, y, z) { return z > .5 && x * x + y * y < .12 ? { em: 1, c: gl } : (Math.abs(x + y * .5) < .06 ? dark(rc) : null); } }));
      pr.push(E([0, 1.4 + b, .05], [.22, .2, .2], dark(rc, .85), { g: 2, f: function (x, y, z) { return z > .4 && Math.abs(y) < .2 && Math.abs(x) < .6 ? { em: 1, c: gl } : null; } }));
      pr.push(C([-.62, 1.1 + b, 0], [-.72, ay, az], .17, rc, { g: 3 })); pr.push(C([.62, 1.1 + b, 0], [.72, ay, az], .17, rc, { g: 4 }));
      pr.push(E([-.72, ay - .08, az], .24, dark(rc, .85), { g: 3 })); pr.push(E([.72, ay - .08, az], .24, dark(rc, .85), { g: 4 }));
      pr.push(C([-.25, .45, 0], [-.27, .12, mv * .2], .16, dark(rc, .8), { g: 5 })); pr.push(C([.25, .45, 0], [.27, .12, -mv * .2], .16, dark(rc, .8), { g: 5 }));
      pr.push(E([-.3, 1.25, -.2], [.2, .12, .15], [90, 140, 70], { g: 1 }));
      return pr;
    }
    // ── 보스: f 0,1 대기 / 2 공격 / 3 기절 ──
    var atk = f == 2, stun = f == 3; b = f == 1 ? .04 : 0;
    if (rig == 'boss_root') {
      var bark = [110, 80, 55], leaf = form ? [215, 120, 50] : [80, 160, 70], core = form ? [255, 90, 40] : [180, 255, 120], dy = stun ? -.25 : 0;
      pr.push(C([0, .3, 0], [0, 1.7 + dy, 0], .5, bark, { g: 1, f: function (x, y, z) { return (Math.sin(x * 9) > .7) ? dark(bark) : null; } }));
      pr.push(E([0, 1.35 + dy, .42], form ? .3 : .2, core, { em: 1, g: 2 }));
      pr.push(E([0, 2.5 + dy + b, 0], [1.05, .7, .95], leaf, { g: 3, f: function (x, y, z) { return U.hash2(Math.floor(x * 7), Math.floor(y * 7 + z * 3), 3) > .7 ? lite(leaf) : null; } }));
      pr.push(E([-.8, 2.15 + dy + b, .2], [.55, .45, .5], dark(leaf, .85), { g: 3 })); pr.push(E([.8, 2.2 + dy + b, -.1], [.6, .45, .5], dark(leaf, .85), { g: 3 }));
      pr.push(E([-.2, 1.85 + dy, .43], .08, [255, 240, 120], { em: 1, g: 2 })); pr.push(E([.2, 1.85 + dy, .43], .08, [255, 240, 120], { em: 1, g: 2 }));
      var ah = atk ? 2.4 : stun ? .5 : 1.2; pr.push(C([-.5, 1.5 + dy, 0], [-1.3, ah, atk ? .6 : .2], .16, bark, { g: 4 })); pr.push(C([.5, 1.5 + dy, 0], [1.3, ah + b, atk ? .6 : .2], .16, bark, { g: 5 }));
      pr.push(E([-1.35, ah, atk ? .65 : .2], .26, dark(bark, .8), { g: 4 })); pr.push(E([1.35, ah + b, atk ? .65 : .2], .26, dark(bark, .8), { g: 5 }));
      for (var i2 = 0; i2 < 5; i2++) { var a2 = i2 * 1.256; pr.push(C([Math.cos(a2) * .3, .25, Math.sin(a2) * .3], [Math.cos(a2) * 1.0, .06, Math.sin(a2) * 1.0], .13, dark(bark, .85), { g: 6 })); }
      return pr;
    }
    if (rig == 'boss_magma') {
      var rk = form ? [70, 45, 45] : [60, 55, 62], lv = form ? [255, 220, 90] : [255, 120, 40], dy2 = stun ? -.3 : 0, crack = function (x, y, z) { return U.hash2(Math.floor(x * 5 + 9), Math.floor(y * 5 + z * 2 + 9), form + 1) > (form ? .62 : .8) ? { em: 1, c: lv } : null; };
      pr.push(E([0, 1.25 + dy2 + b, 0], [.95, .8, .7], rk, { g: 1, f: crack }));
      pr.push(E([0, 2.05 + dy2 + b, .25], [.4, .36, .36], rk, { g: 2, f: function (x, y, z) { return z > .3 && Math.abs(Math.abs(x) - .4) < .2 && Math.abs(y) < .18 ? { em: 1, c: lv } : (z > .5 && y < -.4 && Math.abs(x) < .5 ? { em: 1, c: lv } : null); } }));
      pr.push(C([-.3, 2.3 + dy2, .2], [-.6, 2.85 + dy2 + (form ? .25 : 0), .2], .09, lv, { g: 2, em: !!form })); pr.push(C([.3, 2.3 + dy2, .2], [.6, 2.85 + dy2 + (form ? .25 : 0), .2], .09, lv, { g: 2, em: !!form }));
      var fy2 = atk ? 2.6 : stun ? .3 : .75, fz2 = atk ? .7 : .2;
      pr.push(C([-1.0, 1.7 + dy2, 0], [-1.35, fy2, fz2], .26, rk, { g: 3, f: crack })); pr.push(C([1.0, 1.7 + dy2, 0], [1.35, fy2, fz2], .26, rk, { g: 4, f: crack }));
      pr.push(E([-1.38, fy2 - .1, fz2], .42, dark(rk, .9), { g: 3, f: crack })); pr.push(E([1.38, fy2 - .1, fz2], .42, dark(rk, .9), { g: 4, f: crack }));
      pr.push(C([-.45, .6, 0], [-.5, .2, 0], .3, dark(rk, .8), { g: 5 })); pr.push(C([.45, .6, 0], [.5, .2, 0], .3, dark(rk, .8), { g: 5 }));
      return pr;
    }
    if (rig == 'boss_frost') {
      var ice = form ? [90, 120, 220] : [170, 220, 250], wh = [240, 248, 255], fy3 = .5 + b + (stun ? -.4 : 0), wing = form ? 1.5 : 1;
      pr.push(E([0, fy3 + .45, 0], [.75, .7, .65], ice, { g: 1, f: function (x, y) { return y < -.6 ? wh : Math.sin(x * 8) > .8 ? lite(ice) : null; } }));
      pr.push(E([0, fy3 + 1.2, 0], [.3, .42, .24], wh, { g: 1 }));
      pr.push(E([0, fy3 + 1.9, 0], .3, [245, 240, 250], { g: 2, f: function (x, y, z) { return z > .45 && Math.abs(Math.abs(x) - .4) < .18 && y > -.35 && y < .1 ? [80, 60, 200] : null; } }));
      pr.push(E([0, fy3 + 1.95, -.04], [.34, .31, .34], dark(ice, .9), { g: 2, clip: function (x, y, z) { return z > .28 && y < .25; } })); pr.push(E([0, fy3 + 1.35, -.25], [.34, .7, .14], dark(ice, .9), { g: 2 }));
      for (var i3 = -2; i3 <= 2; i3++) pr.push(C([i3 * .13, fy3 + 2.2, 0], [i3 * .2, fy3 + 2.5 + (i3 == 0 ? .15 : 0), 0], .045, lite(ice), { em: 1, g: 3 }));
      var ar2 = atk ? 2.4 : stun ? .1 : .8; pr.push(C([-.3, fy3 + 1.5, 0], [-.3 - Math.sin(ar2) * .6, fy3 + 1.5 - Math.cos(ar2) * .6, .2], .07, wh, { g: 4 })); pr.push(C([.3, fy3 + 1.5, 0], [.3 + Math.sin(ar2) * .6, fy3 + 1.5 - Math.cos(ar2) * .6, .2], .07, wh, { g: 4 }));
      if (!stun) for (var i4 = 0; i4 < 3; i4++) { [-1, 1].forEach(function (s) { pr.push(C([s * .35, fy3 + 1.5, -.3], [s * (.9 + i4 * .3) * wing, fy3 + 2.2 - i4 * .5 + (atk ? .3 : 0), -.4], .07, lite(ice), { em: 1, g: 5 })); }); }
      return pr;
    }
    if (rig == 'boss_storm') {
      var sc = [[70, 60, 120], [90, 60, 150], [130, 60, 170]][form], el = [[200, 150, 255], [230, 170, 255], [255, 230, 255]][form], hy2 = 1.7 + b + (stun ? -.9 : 0) + (atk ? .2 : 0);
      for (var i5 = 0; i5 < 7; i5++) { var tt = i5 / 6; pr.push(E([Math.sin(tt * 3 + f) * .25, hy2 - tt * .9 - (stun ? 0 : Math.sin(tt * 3) * .2), -tt * 2.2 + .4], [.42 - tt * .28, .38 - tt * .26, .45], sc, { g: 1, f: function (x, y) { return y < -.5 ? el : null; } })); }
      pr.push(E([0, hy2 + .25, .95], [.3, .26, .42], sc, { g: 2, f: function (x, y, z) { return Math.abs(Math.abs(x) - .6) < .25 && y > 0 && y < .5 && z > -.2 ? { em: 1, c: el } : null; } }));
      pr.push(C([-.15, hy2 + .45, .8], [-.4, hy2 + .95, .45], .06, el, { g: 2, em: 1 })); pr.push(C([.15, hy2 + .45, .8], [.4, hy2 + .95, .45], .06, el, { g: 2, em: 1 }));
      var wy2 = stun ? -.6 : f == 1 ? .5 : atk ? .9 : .1;
      [-1, 1].forEach(function (s) { pr.push(C([s * .3, hy2, .2], [s * 1.5, hy2 + wy2 + .3, -.1], .09, sc, { g: 3 })); pr.push(E([s * 1.1, hy2 + wy2 * .6, -.35], [.8, .06, .55], dark(el, .75), { g: 3 })); pr.push(C([s * 1.5, hy2 + wy2 + .3, -.1], [s * 2.1, hy2 + wy2 * .5 - .2, -.5], .06, sc, { g: 3 })); });
      pr.push(C([-.25, hy2 - .3, .2], [-.35, hy2 - .9, .4], .1, sc, { g: 4 })); pr.push(C([.25, hy2 - .3, .2], [.35, hy2 - .9, .4], .1, sc, { g: 4 }));
      return pr;
    }
    if (rig == 'boss_nox') {
      var ar3 = [[45, 40, 70], [60, 35, 85], [30, 25, 45]][form], st = [[150, 130, 255], [255, 120, 220], [255, 255, 255]][form], gold = [230, 190, 90], dy3 = stun ? -.35 : 0, starf = function (x, y, z) { return U.hash2(Math.floor(x * 6 + 20), Math.floor(y * 6 + z * 3 + 20), 7) > .86 ? { em: 1, c: st } : null; };
      pr.push(E([0, 1.45 + dy3 + b, 0], [.8, .75, .55], ar3, { g: 1, f: form == 2 ? function (x, y, z) { return z > .2 && x * x + y * y < .3 ? { em: 1, c: x * x + y * y < .1 ? [255, 255, 255] : st } : starf(x, y, z); } : starf }));
      pr.push(E([0, .75 + dy3, 0], [.5, .4, .4], dark(ar3, .85), { g: 1 }));
      pr.push(E([0, 2.45 + dy3 + b, .05], [.33, .36, .33], form ? [20, 15, 30] : ar3, { g: 2, f: function (x, y, z) { return z > .3 && Math.abs(y - .05) < .13 && Math.abs(x) < .7 ? { em: 1, c: st } : null; } }));
      if (form < 2) { pr.push(C([-.2, 2.7 + dy3, 0], [-.5, 3.3 + dy3, 0], .08, gold, { g: 2 })); pr.push(C([.2, 2.7 + dy3, 0], [.5, 3.3 + dy3, 0], .08, gold, { g: 2 })); pr.push(C([0, 2.8 + dy3, 0], [0, 3.35 + dy3, 0], .07, gold, { g: 2 })); }
      else pr.push(E([0, 3.15 + dy3 + b, -.1], [.6, .05, .6], st, { em: 1, g: 6, clip: function (x, y, z) { return x * x + z * z < .55; } }));
      pr.push(E([-.95, 2.0 + dy3 + b, 0], [.42, .3, .4], form ? dark(ar3) : gold, { g: 3, f: starf })); pr.push(E([.95, 2.0 + dy3 + b, 0], [.42, .3, .4], form ? dark(ar3) : gold, { g: 4, f: starf }));
      var hy3 = atk ? 3.0 : stun ? .5 : 1.0, hz2 = atk ? .6 : .25;
      pr.push(C([-1.05, 1.9 + dy3, 0], [-1.45, hy3, hz2], .2, ar3, { g: 3, f: starf })); pr.push(C([1.05, 1.9 + dy3, 0], [1.45, hy3, hz2], .2, ar3, { g: 4, f: starf }));
      pr.push(E([-1.47, hy3 - .1, hz2], .3, gold, { g: 3 })); pr.push(E([1.47, hy3 - .1, hz2], .3, gold, { g: 4 }));
      if (form == 2) { pr.push(C([-.9, 1.6 + dy3, -.1], [-1.9, 2.3 + b * 3, -.3], .13, ar3, { g: 7, f: starf })); pr.push(C([.9, 1.6 + dy3, -.1], [1.9, 2.3 + b * 3, -.3], .13, ar3, { g: 7, f: starf })); pr.push(E([-1.95, 2.35 + b * 3, -.3], .2, st, { em: 1, g: 7 })); pr.push(E([1.95, 2.35 + b * 3, -.3], .2, st, { em: 1, g: 7 })); }
      if (form >= 1 && !stun) [-1, 1].forEach(function (s) { for (var k = 0; k < 3; k++) pr.push(E([s * (1.2 + k * .4), 2.3 - k * .45 + b * 2, -.5], [.55, .12, .3], dark(st, .5 + k * .1), { g: 8, f: starf })); });
      pr.push(C([-.3, .6 + dy3, 0], [-.4, .15, 0], .24, ar3, { g: 5 })); pr.push(C([.3, .6 + dy3, 0], [.4, .15, 0], .24, ar3, { g: 5 }));
      if (form == 0) pr.push(E([0, 1.3 + dy3, -.5], [.9, 1.0, .1], [70, 30, 60], { g: 9 }));
      return pr;
    }
    return pr;
  }

  // ───────── 소품 ─────────
  function prop(name, v) {
    var pr = [], h2 = U.hash2;
    function leafF(c, s) { return function (x, y, z) { return h2(Math.floor(x * 5 + 30), Math.floor(y * 5 + z * 3 + 30), s) > .68 ? lite(c) : h2(Math.floor(x * 4 + 30), Math.floor(y * 4 + 30), s + 1) > .75 ? dark(c, .8) : null; }; }
    if (name == 'tree') { var lc = [[70, 150, 70], [95, 165, 60], [60, 135, 85]][v % 3]; pr.push(C([0, 0, 0], [0, 1.5, 0], .16, [115, 80, 50], { g: 1 })); pr.push(E([0, 2.2, 0], [.95, .8, .9], lc, { g: 2, f: leafF(lc, v) })); pr.push(E([-.6, 1.8, .2], [.55, .45, .5], dark(lc, .85), { g: 2, f: leafF(lc, v + 3) })); pr.push(E([.6, 1.9, -.1], [.6, .5, .5], lc, { g: 2, f: leafF(lc, v + 5) })); pr.push(E([.1, 2.9, 0], [.5, .4, .5], lite(lc), { g: 2, f: leafF(lc, v + 7) })); }
    else if (name == 'pine') { pr.push(C([0, 0, 0], [0, 1.2, 0], .13, [95, 70, 55], { g: 1 })); for (var i = 0; i < 4; i++) { var c = [50, 105, 90]; pr.push(E([0, 1.0 + i * .6, 0], [.85 - i * .19, .42, .85 - i * .19], c, { g: 2 + i, f: (function (i) { return function (x, y) { return y > .25 ? [235, 245, 255] : null; }; })(i) })); } }
    else if (name == 'dead') { var w = [85, 65, 60]; pr.push(C([0, 0, 0], [.1, 1.6, 0], .14, w)); pr.push(C([.05, 1.0, 0], [.7, 1.9, .1], .07, w)); pr.push(C([.05, 1.3, 0], [-.6, 2.1, -.1], .07, w)); pr.push(C([.1, 1.6, 0], [.2, 2.4, 0], .06, w)); if (v % 2) pr.push(E([.7, 1.95, .1], .16, [255, 140, 50], { em: 1 })); }
    else if (name == 'palm') { pr.push(C([0, 0, 0], [.25, 2.0, 0], .12, [150, 115, 75])); for (var i6 = 0; i6 < 6; i6++) { var a = i6 * 1.05; pr.push(C([.25, 2.0, 0], [.25 + Math.cos(a) * .9, 1.8, Math.sin(a) * .9], .09, [80, 170, 80], { g: 2 })); } }
    else if (name == 'bush') { var bc = v == 1 ? [220, 235, 245] : v == 2 ? [140, 110, 70] : [80, 160, 70]; pr.push(E([0, .32, 0], [.5, .34, .45], bc, { f: leafF(bc, v) })); pr.push(E([.3, .25, .1], [.3, .25, .3], dark(bc, .85), { g: 1 })); if (v == 3) [[-.2, .5, .3], [.2, .4, .35], [0, .3, .42]].forEach(function (p) { pr.push(E(p, .07, [230, 60, 80], { g: 2 })); }); }
    else if (name == 'rock') { var rc = [[130, 130, 135], [150, 90, 70], [200, 215, 230]][v % 3]; pr.push(E([0, .3, 0], [.5, .38, .42], rc, { f: function (x, y) { return Math.abs(x + y) < .08 ? dark(rc) : null; } })); pr.push(E([.35, .2, .15], [.3, .24, .28], dark(rc, .85), { g: 1 })); }
    else if (name == 'grass') { var gc = [[90, 180, 70], [200, 180, 90], [225, 240, 250], [120, 150, 90]][v % 4]; for (var i7 = -2; i7 <= 2; i7++) pr.push(C([i7 * .07, 0, 0], [i7 * .16, .32 - Math.abs(i7) * .05, 0], .03, i7 % 2 ? gc : dark(gc, .8), { g: 1 })); }
    else if (name == 'flower') { var fc = [[245, 245, 255], [255, 100, 70], [200, 240, 255], [255, 220, 80]][v % 4]; pr.push(C([0, 0, 0], [0, .4, 0], .025, [70, 150, 60])); for (var i8 = 0; i8 < 5; i8++) { var a3 = i8 * 1.256; pr.push(E([Math.cos(a3) * .1, .45, Math.sin(a3) * .1], [.09, .05, .09], fc, { g: 2, em: v == 2 })); } pr.push(E([0, .47, 0], .05, [255, 210, 60], { g: 3 })); pr.push(E([.08, .15, 0], [.09, .03, .05], [80, 170, 70])); }
    else if (name == 'mush') { var mc = [[130, 190, 255], [215, 165, 110]][v % 2]; pr.push(C([0, 0, 0], [0, .22, 0], .06, [240, 235, 220])); pr.push(E([0, .3, 0], [.2, .13, .2], mc, { f: function (x, y, z) { return h2(Math.floor(x * 3 + 9), Math.floor(z * 3 + 9), 2) > .7 ? [255, 255, 255] : null; }, em: v == 0 })); pr.push(C([.2, 0, .05], [.2, .12, .05], .04, [240, 235, 220])); pr.push(E([.2, .17, .05], [.11, .08, .11], mc)); }
    else if (name == 'herb') { var hc = v ? [165, 225, 225] : [90, 190, 90]; for (var i9 = 0; i9 < 4; i9++) { var a4 = i9 * 1.57 + .4; pr.push(C([0, 0, 0], [Math.cos(a4) * .22, .3, Math.sin(a4) * .22], .045, hc, { g: 1, em: !!v })); } pr.push(E([0, .38, 0], .06, v ? [255, 255, 255] : [250, 230, 90], { g: 2 })); }
    else if (name == 'fruit') { var bc2 = [80, 160, 70]; pr.push(E([0, .35, 0], [.42, .36, .4], bc2, { f: leafF(bc2, 2) })); [[-.2, .5, .3], [.2, .38, .33], [0, .25, .38], [.3, .55, .1]].forEach(function (p) { pr.push(E(p, .08, v ? [240, 70, 50] : [230, 60, 100], { g: 2 })); }); }
    else if (name == 'carrot') { pr.push(E([0, .05, 0], [.1, .08, .1], [255, 140, 40])); for (var j = -1; j <= 1; j++) pr.push(C([0, .08, 0], [j * .15, .38, 0], .035, [90, 190, 80], { g: 1 })); }
    else if (name == 'wheat') { for (var j2 = -1; j2 <= 1; j2++) { pr.push(C([j2 * .12, 0, 0], [j2 * .16, .5, 0], .02, [200, 180, 90])); pr.push(E([j2 * .17, .58, 0], [.045, .12, .045], [235, 205, 100], { g: 2 })); } }
    else if (name == 'ore') { var oc = [[140, 120, 100], [180, 225, 255], [255, 180, 70]][v % 3]; pr.push(E([0, .25, 0], [.42, .3, .38], [100, 100, 108])); [[-.15, .45, .15], [.18, .4, .1], [0, .3, .3]].forEach(function (p, i) { pr.push(B(p, [.1, .13 + i * .02, .1], oc, { g: 2, em: v > 0 })); }); }
    else if (name == 'chest') { var cc = [[150, 100, 60], [90, 130, 190], [200, 150, 60], [190, 70, 90]][v % 4], band = v == 0 ? [180, 180, 190] : [255, 220, 110]; pr.push(B([0, .2, 0], [.36, .2, .25], cc, { g: 1, f: function (x, y, z) { return Math.abs(x) > .78 || Math.abs(y) > .8 ? band : (Math.abs(x) < .14 && y > .2 ? band : null); } })); pr.push(E([0, .4, 0], [.37, .17, .26], cc, { g: 2, f: function (x, y, z) { return Math.abs(x) > .8 || Math.abs(x) < .12 ? band : null; } })); if (v >= 2) pr.push(E([0, .42, .26], .05, [120, 240, 255], { em: 1, g: 3 })); }
    else if (name == 'chestopen') { var cc2 = [[150, 100, 60], [90, 130, 190], [200, 150, 60], [190, 70, 90]][v % 4]; pr.push(B([0, .2, 0], [.36, .2, .25], cc2, { g: 1, f: function (x, y, z) { return y > .75 ? [40, 30, 30] : null; } })); pr.push(B([0, .55, -.25], [.36, .18, .04], dark(cc2, .8), { g: 2 })); }
    else if (name == 'statue') { var sc = [150, 160, 175], gl = v ? [130, 240, 255] : [110, 115, 125]; pr.push(B([0, .15, 0], [.75, .15, .75], dark(sc, .8), { g: 1 })); pr.push(B([0, .5, 0], [.5, .22, .5], sc, { g: 2, f: function (x, y) { return Math.abs(y) < .2 && Math.abs(x) < .7 ? { em: v, c: gl } : null; } })); pr.push(C([0, .8, 0], [0, 1.9, 0], .26, sc, { g: 3 })); pr.push(E([0, 2.35, 0], .27, sc, { g: 4 })); pr.push(E([0, 1.4, -.25], [.6, .8, .08], dark(sc, .85), { g: 5 })); pr.push(C([-.25, 1.75, 0], [-.45, 2.3, .3], .08, sc, { g: 6 })); pr.push(C([.25, 1.75, 0], [.45, 2.3, .3], .08, sc, { g: 6 })); pr.push(E([0, 2.55, .32], .22, gl, { em: v, g: 7 })); pr.push(E([-.9, 1.6, -.3], [.3, .08, .12], dark(sc, .9), { g: 5 })); pr.push(E([.9, 1.6, -.3], [.3, .08, .12], dark(sc, .9), { g: 5 })); }
    else if (name == 'gate') { var gc2 = [120, 125, 150], g2 = v ? [140, 220, 255] : [90, 90, 110]; pr.push(B([-.55, .7, 0], [.14, .7, .14], gc2, { g: 1 })); pr.push(B([.55, .7, 0], [.14, .7, .14], gc2, { g: 2 })); pr.push(B([0, .08, 0], [.8, .08, .4], dark(gc2, .8), { g: 3 })); pr.push(E([0, 1.25, 0], [.2, .3, .2], g2, { em: v, g: 4, f: function (x, y) { return Math.abs(x) + Math.abs(y) < .5 ? { em: v, c: v ? [255, 255, 255] : g2 } : null; } })); pr.push(E([-.55, 1.5, 0], .12, g2, { em: v, g: 1 })); pr.push(E([.55, 1.5, 0], .12, g2, { em: v, g: 2 })); }
    else if (name == 'orb') { var oc2 = [[110, 245, 200], [255, 140, 70], [170, 230, 255]][v % 3]; pr.push(E([0, .4, 0], .2, oc2, { em: 1, f: function (x, y, z) { return x * x + y * y < .2 ? { em: 1, c: [255, 255, 255] } : null; } })); pr.push(E([0, .4, 0], [.36, .04, .36], lite(oc2), { em: 1, g: 2, clip: function (x, y, z) { return x * x + z * z < .6; } })); pr.push(E([-.28, .55, 0], [.14, .05, .06], lite(oc2), { em: 1, g: 3 })); pr.push(E([.28, .55, 0], [.14, .05, .06], lite(oc2), { em: 1, g: 3 })); }
    else if (name == 'seelie') { pr.push(E([0, .4, 0], .17, [150, 240, 255], { em: 1, f: function (x, y) { return x * x + y * y < .3 ? { em: 1, c: [255, 255, 255] } : null; } })); pr.push(C([0, .3, 0], [0, .05, -.15], .06, [120, 200, 255], { em: 1 })); pr.push(E([-.2, .5, 0], [.12, .16, .04], [220, 250, 255], { em: 1 })); pr.push(E([.2, .5, 0], [.12, .16, .04], [220, 250, 255], { em: 1 })); }
    else if (name == 'pedestal') { pr.push(B([0, .2, 0], [.3, .2, .3], [130, 135, 150])); pr.push(B([0, .45, 0], [.22, .06, .22], [160, 165, 180], { g: 2 })); if (v) pr.push(E([0, .75, 0], .15, [150, 240, 255], { em: 1, g: 3 })); }
    else if (name == 'torch') { pr.push(C([0, 0, 0], [0, .9, 0], .08, [100, 75, 55])); pr.push(E([0, 1.0, 0], [.2, .1, .2], [80, 80, 90], { g: 2 })); if (v) { pr.push(E([0, 1.25, 0], [.16, .24, .16], [255, 140, 40], { em: 1, g: 3 })); pr.push(E([0, 1.2, 0], [.09, .14, .09], [255, 240, 150], { em: 1, g: 4 })); } }
    else if (name == 'monu') { var ec = hex(DATA.EL[DATA.ELS[v % 7]].c), on = v >= 7; pr.push(B([0, .1, 0], [.4, .1, .4], [110, 110, 125])); pr.push(B([0, .7, 0], [.22, .55, .22], [135, 135, 150], { g: 2, f: function (x, y) { return Math.abs(x) < .3 && Math.abs(y - .2) < .5 ? { em: on, c: on ? ec : dark(ec, .55) } : null; } })); pr.push(E([0, 1.45, 0], .18, on ? ec : dark(ec, .5), { em: on, g: 3 })); }
    else if (name == 'flag') { pr.push(C([0, 0, 0], [0, 1.4, 0], .04, [200, 200, 210])); pr.push(B([.28, 1.2, 0], [.26, .16, .02], v ? [255, 200, 60] : [230, 70, 70], { g: 2 })); pr.push(B([0, .06, 0], [.3, .06, .3], [120, 120, 130], { g: 3 })); }
    else if (name == 'pot') { pr.push(E([0, .3, 0], [.4, .28, .4], [60, 60, 70], { clip: function (x, y) { return y > .55; } })); pr.push(E([0, .42, 0], [.33, .06, .33], [240, 190, 110], { g: 2 })); pr.push(C([-.45, 0, 0], [-.3, .15, 0], .04, [90, 70, 50])); pr.push(C([.45, 0, 0], [.3, .15, 0], .04, [90, 70, 50])); pr.push(E([0, .08, .1], [.14, .12, .1], [255, 140, 40], { em: 1, g: 3 })); }
    else if (name == 'anvil') { pr.push(B([0, .15, 0], [.2, .15, .16], [70, 60, 55])); pr.push(B([0, .4, 0], [.4, .1, .18], [90, 95, 110], { g: 2 })); pr.push(B([.55, .5, 0], [.3, .5, .3], [120, 80, 70], { g: 3, f: function (x, y, z) { return y < -.3 && Math.abs(x) < .5 && z > 0 ? { em: 1, c: [255, 150, 50] } : null; } })); }
    else if (name == 'bench') { pr.push(B([0, .35, 0], [.55, .05, .3], [150, 110, 75])); [[-.45, -.2], [.45, -.2], [-.45, .2], [.45, .2]].forEach(function (p) { pr.push(B([p[0], .15, p[1]], [.04, .15, .04], [110, 80, 55], { g: 2 })); }); pr.push(C([-.2, .4, 0], [-.2, .65, 0], .07, [120, 220, 180], { g: 3, em: 1 })); pr.push(C([.15, .4, 0], [.15, .58, 0], .06, [230, 120, 200], { g: 4, em: 1 })); pr.push(E([-.2, .72, 0], .05, [240, 240, 240], { g: 3 })); }
    else if (name == 'board') { pr.push(C([-.3, 0, 0], [-.3, 1.0, 0], .04, [110, 80, 55])); pr.push(C([.3, 0, 0], [.3, 1.0, 0], .04, [110, 80, 55])); pr.push(B([0, .8, 0], [.45, .3, .03], [170, 130, 85], { g: 2, f: function (x, y) { return (Math.abs(y) < .1 || Math.abs(y - .5) < .08) && Math.abs(x) < .7 ? [245, 235, 210] : null; } })); }
    else if (name == 'tent') { var tc = [150, 90, 70]; pr.push(E([0, .5, 0], [.9, .75, .8], tc, { clip: function (x, y) { return y < -.65; }, f: function (x, y, z) { return z > .5 && Math.abs(x) < .25 && y < .1 ? [35, 25, 25] : Math.sin(x * 10) > .85 ? dark(tc) : null; } })); pr.push(C([0, 1.1, 0], [0, 1.5, 0], .03, [100, 75, 55])); pr.push(B([.1, 1.42, 0], [.1, .06, .01], [220, 60, 60], { g: 2 })); }
    else if (name == 'fire') { pr.push(C([-.25, .05, 0], [.25, .1, 0], .06, [100, 70, 50])); pr.push(C([0, .05, -.25], [0, .1, .25], .06, [90, 65, 45])); pr.push(E([0, .35, 0], [.18, .3, .18], [255, 130, 40], { em: 1, g: 2 })); pr.push(E([0, .28, 0], [.1, .18, .1], [255, 235, 140], { em: 1, g: 3 })); }
    else if (name == 'crate') { pr.push(B([0, .3, 0], [.3, .3, .3], [165, 125, 80], { f: function (x, y, z) { return Math.abs(x) > .75 || Math.abs(y) > .75 || Math.abs(x - y) < .12 ? [120, 85, 55] : null; } })); }
    else if (name == 'buoy') { pr.push(E([0, .1, 0], [.18, .14, .18], [230, 70, 60], { f: function (x, y) { return y > .2 ? [245, 245, 245] : null; } })); pr.push(C([0, .2, 0], [0, .5, 0], .025, [90, 70, 50])); pr.push(B([.1, .44, 0], [.1, .06, .01], [255, 220, 80], { g: 2 })); }
    else if (name == 'crystal') { var kc = [[150, 220, 255], [255, 120, 80], [190, 130, 255]][v % 3]; pr.push(C([0, 0, 0], [0, .9, 0], .16, kc, { em: 1 })); pr.push(C([.1, 0, 0], [.4, .5, .1], .1, dark(kc, .8), { em: 1, g: 2 })); pr.push(C([-.1, 0, 0], [-.35, .4, -.1], .09, lite(kc), { em: 1, g: 3 })); }
    else if (name == 'weak') { pr.push(E([0, .3, 0], .28, [255, 255, 255], { em: 1, f: function (x, y) { return x * x + y * y > .45 ? { em: 1, c: [255, 220, 80] } : null; } })); }
    else if (name == 'dummy') { pr.push(C([0, 0, 0], [0, 1.2, 0], .06, [120, 90, 60])); pr.push(E([0, .9, 0], [.25, .3, .2], [220, 190, 120], { g: 2 })); pr.push(E([0, 1.35, 0], .17, [220, 190, 120], { g: 3 })); pr.push(C([-.45, 1.0, 0], [.45, 1.0, 0], .05, [120, 90, 60], { g: 4 })); }
    return pr;
  }
  // 무기 아이콘용
  function weaponPrims(w) {
    var pr = [], t = w.type, c = hex(['#b0b8c8', '#b0b8c8', '#b0b8c8', '#a0c8ff', '#ffd070'][w.r - 1]), h = U.hash2(w.id.length, w.id.charCodeAt(4) + w.id.charCodeAt(3), 5), ac = [80 + h * 150 | 0, 80 + ((h * 7) % 1) * 150 | 0, 120 + ((h * 13) % 1) * 130 | 0];
    if (w.id == 'w_s5x') { c = [255, 120, 90]; ac = [255, 210, 90]; } if (w.id == 'w_k5x') ac = [150, 160, 255];
    if (t == 'sword') { pr.push(C([0, .35, 0], [0, 1.25, 0], .07, c, { em: w.r == 5 })); pr.push(B([0, .3, 0], [.22, .05, .06], ac, { g: 2 })); pr.push(C([0, .02, 0], [0, .25, 0], .045, [90, 60, 50], { g: 3 })); pr.push(E([0, 0, 0], .07, ac, { g: 2 })); }
    else if (t == 'claymore') { pr.push(B([0, .82, 0], [.13, .5, .04], c, { em: w.r == 5 })); pr.push(E([0, 1.33, 0], [.13, .12, .04], c, { g: 1 })); pr.push(B([0, .3, 0], [.28, .06, .07], ac, { g: 2 })); pr.push(C([0, 0, 0], [0, .25, 0], .05, [90, 60, 50], { g: 3 })); }
    else if (t == 'spear') { pr.push(C([0, -.05, 0], [0, 1.05, 0], .035, [120, 85, 55])); pr.push(E([0, 1.22, 0], [.09, .2, .05], c, { g: 2, em: w.r == 5 })); pr.push(E([0, 1.03, 0], .07, ac, { g: 3 })); }
    else if (t == 'bow') { for (var i = 0; i < 6; i++) { var a = -1.1 + i * .44, a2 = a + .44; pr.push(C([Math.cos(a) * .55 - .3, .65 + Math.sin(a) * .65, 0], [Math.cos(a2) * .55 - .3, .65 + Math.sin(a2) * .65, 0], .05, i == 2 || i == 3 ? ac : c, { g: 1 })); } pr.push(C([-.05, .07, 0], [-.05, 1.23, 0], .015, [230, 230, 230], { g: 2 })); }
    else { pr.push(B([0, .65, 0], [.36, .46, .09], ac)); pr.push(B([.03, .65, .02], [.33, .42, .08], [245, 240, 225], { g: 2 })); pr.push(B([0, .65, .1], [.36, .46, .02], ac, { g: 3, f: function (x, y) { return Math.abs(x) + Math.abs(y) < .45 ? c : null; } })); }
    return tiltZ(pr, t == 'book' ? -.15 : -.6);
  }
  function tiltZ(prims, ang) { var s = Math.sin(ang), c = Math.cos(ang); function rot(v) { var x = v[0], y = v[1] - .65; return [x * c - y * s, .65 + x * s + y * c, v[2]]; } prims.forEach(function (p) { if (p.k == 1) { p.a = rot(p.a); p.b = rot(p.b); } else { p.c = rot(p.c); if (p.k == 2) { p.k = 1; var hy = p.r[1], x = p.c; p.a = [x[0] + s * hy, x[1] - c * hy, x[2]]; p.b = [x[0] - s * hy, x[1] + c * hy, x[2]]; p.r = Math.max(p.r[0], .05); } } }); return prims; }

  // ───────── 지형 타일 (32px) ─────────
  var TS = 32;
  function tiles() {
    var cv = document.createElement('canvas'); cv.width = cv.height = 256; var g = cv.getContext('2d'), im = g.createImageData(256, 256), d = im.data, h = U.hash2;
    function P(cols) { return cols.map(hex); }
    function T(i, fn) { var bx = (i % 8) * TS, by = (i >> 3) * TS; for (var y = 0; y < TS; y++) for (var x = 0; x < TS; x++) { var c = fn(x, y), o = ((by + y) * 256 + bx + x) * 4; d[o] = c[0]; d[o + 1] = c[1]; d[o + 2] = c[2]; d[o + 3] = 255; } }
    function tn(x, y, s, sc) { // 타일링 노이즈
      var f = TS / sc, xi = Math.floor(x / sc), yi = Math.floor(y / sc), xf = x / sc - xi, yf = y / sc - yi; function hh(a, b) { return h((a % f + f) % f, (b % f + f) % f, s); }
      var u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf); return hh(xi, yi) * (1 - u) * (1 - v) + hh(xi + 1, yi) * u * (1 - v) + hh(xi, yi + 1) * (1 - u) * v + hh(xi + 1, yi + 1) * u * v;
    }
    function ground(p, s, sp) { return function (x, y) { var n = tn(x, y, s, 8) * .6 + tn(x, y, s + 1, 4) * .4, r = h(x, y, s + 2); if (r > 1 - (sp || .06)) return p[3]; if (r < (sp || .06) * .7) return p[0]; return n > .62 ? p[2] : n > .38 ? p[1] : p[0]; }; }
    var G = P(['#3f9a48', '#52b052', '#6cc45a', '#9ada6a']), Dt = P(['#6a4a34', '#80583c', '#94694a', '#a87a58']), Rk = P(['#6c6e78', '#82848e', '#9799a2', '#b0b2ba']), Sd = P(['#d2b878', '#e2ca8a', '#eeda9e', '#f8eab8']);
    var Sn = P(['#d0deee', '#e4eef8', '#f2f8ff', '#ffffff']), Ic = P(['#7ab8e0', '#96d0f0', '#b4e4fa', '#e0f8ff']), Rd = P(['#9a5038', '#b46444', '#c87a54', '#dc9468']), As = P(['#3c3638', '#4c4446', '#5c5254', '#746664']);
    var Cv = P(['#34323e', '#44424e', '#55535f', '#686674']), Ms = P(['#4a6a48', '#5a7c50', '#6c8e58', '#88a868']);
    T(0, ground(G, 1)); T(2, ground(Dt, 3)); T(3, ground(Rk, 5, .04)); T(4, ground(Sd, 7, .03)); T(5, ground(Sn, 9, .03)); T(7, ground(Ic, 11, .05)); T(8, ground(Rd, 13)); T(10, ground(As, 15)); T(18, ground(Cv, 17, .04)); T(24, ground(Ms, 19));
    function sideOf(topP, botFn, s) { return function (x, y) { var edge = 5 + Math.floor(h(x, 0, s) * 4); if (y < edge) return topP[y < 2 ? 2 : y >= edge - 1 ? 0 : 1]; return strata(botFn, s)(x, y); }; }
    function strata(p, s) { return function (x, y) { var yy = y + Math.floor(tn(x, 0, s, 8) * 3), band = Math.floor(yy / 5), r = h(Math.floor((x + band * 7) / 6), band, s); if (yy % 5 == 0) return p[0]; if (h(x, y, s + 4) > .93) return p[3]; return r > .6 ? p[2] : p[1]; }; }
    T(1, sideOf(G, Dt, 21)); T(6, sideOf(Sn, Rk, 23)); T(9, strata(Rd, 25)); T(27, strata(Rk, 27)); T(28, strata(As, 29)); T(26, strata(Cv, 31)); T(31, sideOf(Ms, Dt, 33)); T(25, sideOf(Sd, Sd, 35));
    function brick(p, bw, bh, s) { return function (x, y) { var row = Math.floor(y / bh), xx = (x + (row % 2) * (bw / 2)) % TS, bxi = Math.floor(xx / bw); if (y % bh == 0 || xx % bw == 0) return p[0]; var r = h(bxi, row, s); if (h(x, y, s + 1) > .95) return p[3]; return r > .55 ? p[2] : p[1]; }; }
    T(11, brick(P(['#77705f', '#9a927c', '#aaa28a', '#beb69c']), 8, 8, 41)); T(17, brick(P(['#5a5c6a', '#7c7e8c', '#8c8e9c', '#a4a6b2']), 16, 8, 43)); T(19, brick(P(['#a89878', '#cfc0a0', '#dccdae', '#eadcc0']), 16, 16, 45));
    T(21, brick(P(['#2c2a3c', '#3e3c52', '#48465e', '#5c5a74']), 16, 16, 47)); T(22, brick(P(['#1e1c2c', '#33314a', '#3c3a54', '#504e6c']), 16, 8, 49));
    T(20, function (x, y) { var b = brick(P(['#20203a', '#2e2e52', '#36365e', '#8080ff']), 16, 16, 51)(x, y); var cx = x % 16 - 8, cy = y % 16 - 8; if (Math.abs(cx) + Math.abs(cy) == 4 || (cx == 0 && cy == 0)) return [170, 170, 255]; return b; });
    var Pl = P(['#6e4c30', '#8c6440', '#a0744c', '#b68a5e']); T(12, function (x, y) { if (x % 8 == 0) return Pl[0]; var r = h(Math.floor(x / 8), Math.floor((y + Math.floor(x / 8) * 5) / 16), 53); if ((y + Math.floor(x / 8) * 5) % 16 == 0) return Pl[0]; return h(x, y, 54) > .9 ? Pl[3] : r > .5 ? Pl[2] : Pl[1]; });
    var Wl = P(['#c8b89a', '#e6dcc2', '#f2ead4', '#fff8e6']), Tm = P(['#5c4030', '#7a5640']);
    function wall(x, y) { if (y < 3 || y > 28 || x < 2 || x > 29) return Tm[(x + y) % 5 == 0 ? 0 : 1]; if (Math.abs(x - y) < 2 && false) return Tm[1]; return h(x, y, 55) > .93 ? Wl[0] : h(Math.floor(x / 4), Math.floor(y / 4), 56) > .7 ? Wl[2] : Wl[1]; }
    T(13, wall);
    T(14, function (x, y) { if (x >= 9 && x <= 22 && y >= 8 && y <= 23) { if (x == 9 || x == 22 || y == 8 || y == 23 || x == 15 || x == 16 || y == 15) return Tm[0]; return (x + y) % 9 < 3 ? [150, 210, 240] : [100, 170, 220]; } return wall(x, y); });
    T(23, function (x, y) { if (x >= 8 && x <= 23 && y >= 6) { if (x == 8 || x == 23 || y == 6) return Tm[0]; if (x == 20 && y >= 18 && y <= 20) return [240, 200, 90]; return x % 5 == 0 ? Pl[0] : Pl[1 + (h(Math.floor(x / 5), 0, 57) > .5 ? 1 : 0)]; } return wall(x, y); });
    function roof(p, s) { return function (x, y) { var row = Math.floor(y / 6), xx = (x + (row % 2) * 4) % 8; if (y % 6 == 5) return p[0]; if (xx == 0) return p[0]; return y % 6 < 2 ? p[3] : h(Math.floor((x + (row % 2) * 4) / 8), row, s) > .5 ? p[2] : p[1]; }; }
    T(15, roof(P(['#7a2c2a', '#b04038', '#c44e42', '#da6a58']), 59)); T(16, roof(P(['#2a3e7a', '#3c58a8', '#4868be', '#6484d6']), 61)); T(30, roof(P(['#8a7030', '#b8983c', '#ccac48', '#e2c666']), 63));
    T(29, function (x, y) { var r = Math.floor(y / 8); if (y % 8 == 0) return Pl[0]; return h(x, r, 65) > .85 ? Pl[3] : h(Math.floor(x / 6), r, 66) > .5 ? Pl[2] : Pl[1]; });
    for (var f = 0; f < 4; f++) {
      (function (f) {
        var Wt = P(['#2a78c8', '#3a90dc', '#58aaea', '#bfe6ff']), Lv = P(['#c83c10', '#f06818', '#ffa028', '#ffe870']);
        function liq(p, s) { return function (x, y) { var w = Math.sin((x + f * 8) * Math.PI / 16 + tn(x, y, s, 8) * 4) + Math.sin((y * 2 + f * 8) * Math.PI / 16); var n = tn((x + f * 8) % TS, y, s + 1, 8); if (w > 1.55 && n > .35) return p[3]; if (w > .9) return p[2]; return n > .55 ? p[1] : p[0]; }; }
        T(32 + f, liq(Wt, 71)); T(36 + f, liq(Lv, 73));
      })(f);
    }
    g.putImageData(im, 0, 0); return cv;
  }

  // ───────── 아이콘 (16px, 점 함수) ─────────
  var ICONF = {
    coin: function (x, y) { var r = Math.hypot(x, y); return r < 6.5 ? (r > 4.8 ? 3 : (Math.abs(x) < 1.2 && Math.abs(y) < 3.2) ? 2 : 1) : 0; },
    star: function (x, y) { var v = Math.pow(Math.abs(x), .62) + Math.pow(Math.abs(y), .62); return v < 3.3 ? (v < 1.7 ? 4 : x + y < -1 ? 2 : 1) : 0; },
    lamp: function (x, y) { if (y < -4) return Math.abs(x) < 1.5 && y > -7.5 ? 3 : 0; if (y > 5) return Math.abs(x) < 3.5 && y < 7 ? 3 : 0; var w = 4.8 - Math.abs(y) * .25; return Math.abs(x) < w ? (Math.abs(x) < 1.8 && Math.abs(y - .5) < 2.5 ? 4 : Math.abs(x) > w - 1.2 ? 3 : 1) : 0; },
    dust: function (x, y) { var v = Math.abs(x * .8) + Math.abs(y + 1) * 1.1 + (y > -1 ? 2 : 0); if (y > 1 && Math.hypot(x, (y - 3) * 2.2) < 6) return U.hash2(x + 9, y + 9, 1) > .7 ? 4 : 1; return Math.hypot(x - 2, y + 3) < 1.5 || Math.hypot(x + 3, y + 1) < 1.2 || Math.hypot(x, y + 5.5) < 1.2 ? 2 : 0; },
    book: function (x, y) { return Math.abs(x) < 5.5 && Math.abs(y) < 6.5 ? (x < -3.5 ? 3 : (Math.abs(y) > 5 ? 4 : (Math.abs(x - 1) < 2.2 && Math.abs(y + 1) < 2.2 ? 2 : 1))) : 0; },
    ore: function (x, y) { var a = Math.atan2(y, x), r = 5.6 + Math.sin(a * 3) * 1 + Math.cos(a * 5) * .6; var d = Math.hypot(x, y); return d < r ? (x - y > 3 ? 3 : x + y < -3 ? 2 : (Math.abs(x + y * .6) < .7 ? 3 : 1)) : 0; },
    gem: function (x, y) { var v = Math.abs(x) * .85 + Math.abs(y); return v < 6.5 ? (y < -1 && x < 0 ? 2 : y < -1 ? 4 : x > 1 ? 3 : 1) : 0; },
    drop: function (x, y) { var w = y < 0 ? (y + 7) * .62 : Math.sqrt(Math.max(0, 22 - (y - 1.5) * (y - 1.5))); return Math.abs(x) < w && y > -7 ? (x < -1 && y > -1 && y < 3 ? 4 : x > 2 ? 3 : 1) : 0; },
    horn: function (x, y) { var cx = -2 + (y + 6) * (y + 6) * .045, w = 3.2 - (6 - y) * .22; return Math.abs(x - cx) < w && Math.abs(y) < 7 ? ((y + 20) % 4 < 1 ? 3 : x < cx ? 2 : 1) : 0; },
    fang: function (x, y) { var w = (6.5 - y) * .32; return Math.abs(x + y * .15) < w && y > -6.5 ? (y < -4 ? 3 : x < 0 ? 4 : 1) : 0; },
    flower: function (x, y) { if (y > 2) return Math.abs(x) < 1 || (y > 3 && y < 6 && x > 0 && x < 4.5 - Math.abs(y - 4.5) * 2) ? 5 : 0; var a = Math.atan2(y + 2, x), r = Math.hypot(x, y + 2); return r < 1.6 ? 6 : r < 3.4 + Math.abs(Math.sin(a * 2.5)) * 2 ? (r > 4 ? 2 : 1) : 0; },
    mush: function (x, y) { if (y > 0) return Math.abs(x) < 2 && y < 6.5 ? 4 : 0; var r = Math.hypot(x, (y + .5) * 1.5); return r < 6.5 ? ((Math.hypot(x + 2, y + 3) < 1.3 || Math.hypot(x - 3, y + 1.5) < 1) ? 4 : y > -1.2 ? 3 : 1) : 0; },
    herb: function (x, y) { var l1 = Math.abs(x + 2.5 + y * .35) < 1.6 - Math.abs(y) * .12, l2 = Math.abs(x - 2.5 - y * .35) < 1.6 - Math.abs(y) * .12, l3 = Math.abs(x) < 1.3 && y < 3; return Math.abs(y) < 6.5 && (l1 || l2 || l3) ? (l3 ? 2 : 1) : 0; },
    scroll: function (x, y) { return Math.abs(y) < 6 && Math.abs(x) < 5 ? (Math.abs(y) > 4.2 ? 1 : (Math.abs(x) < 3.5 && (y + 8) % 2 < 1 && Math.abs(y) < 3.5 ? 3 : 4)) : (Math.abs(y) > 3.8 && Math.abs(y) < 6.4 && Math.abs(x) < 6.2 ? 3 : 0); },
    ingot: function (x, y) { var w = 6.5 - (y < 0 ? -y * .45 : 0); return Math.abs(x) < w && y > -3.5 && y < 4.5 ? (y < -1.5 ? 2 : y > 2.5 ? 3 : 1) : 0; },
    fruit: function (x, y) { if (y < -4) return (Math.abs(x) < .8 && y > -7) ? 5 : (x > 0 && x < 4 && y > -6.5 && y < -4.5) ? 5 : 0; var r = Math.hypot(x, y - 1); return r < 5.6 ? (Math.hypot(x + 2, y + 1) < 1.3 ? 4 : x > 2.5 ? 3 : 1) : 0; },
    meat: function (x, y) { var r = Math.hypot(x + 1, (y + 1) * 1.25); if (r < 5.2) return r < 1.6 ? 4 : r > 4 ? 3 : 1; return Math.abs(x - y) < 1.4 && x > 2 && x < 7 ? 4 : 0; },
    fish: function (x, y) { var w = 3.2 - x * x * .09; if (x > 4) return Math.abs(y) < (x - 3) * 1.1 && x < 7.5 ? 3 : 0; return Math.abs(y) < w && x > -7 ? (x < -4 && y < 0 && Math.hypot(x + 4.5, y + .5) < .8 ? 6 : y < -.5 ? 2 : 1) : 0; },
    egg: function (x, y) { var r = Math.hypot(x * (y < 0 ? 1.25 : 1.05), y); return r < 6 ? (x + y < -3 ? 4 : x > 2 ? 3 : 1) : 0; },
    carrot: function (x, y) { if (y < -3) return Math.abs(x - (y + 3) * .3) < 2.5 && y > -7 ? 5 : 0; var w = (7 - y) * .32; return Math.abs(x) < w ? ((y + 9) % 3 < 1 ? 3 : 1) : 0; },
    feather: function (x, y) { var d = Math.abs(x + y), l = (x - y); return d < 2.4 - Math.abs(l) * .12 && Math.abs(l) < 12 ? (d < .7 ? 3 : 1) : 0; },
    dish: function (x, y) { var r = Math.hypot(x, (y - 2.5) * 2); if (y < 1 && Math.hypot(x, y - 1) < 4.8) return U.hash2(x + 9, y + 9, 3) > .75 ? 2 : 1; return r < 7.2 ? (r > 5.5 ? 3 : 4) : 0; },
    neck: function (x, y) { var r = Math.hypot(x, y + 2); if (r > 4.5 && r < 6.2 && y < 2) return 3; return Math.abs(x) + Math.abs(y - 3.5) < 3.2 ? (x < 0 ? 2 : 1) : 0; },
    ring: function (x, y) { var r = Math.hypot(x, y - 1.5); if (r > 3.2 && r < 5.2) return x < 0 ? 4 : 3; return Math.abs(x) + Math.abs(y + 4.5) < 2.6 ? 1 : 0; },
    brace: function (x, y) { var r = Math.hypot(x, y * 1.6); return r < 6.8 && r > 3.4 ? ((Math.abs(x) < 1.6 && y > 0) ? 1 : y < 0 ? 3 : 4) : 0; },
    ear: function (x, y) { if (y < -3) return Math.hypot(x, y + 5) < 2 && Math.hypot(x, y + 5) > .9 ? 3 : 0; var w = y < 3 ? (y + 4) * .5 : (7 - y) * .9; return Math.abs(x) < w ? (x < 0 ? 2 : 1) : 0; },
    crown: function (x, y) { if (y > 1) return Math.abs(x) < 6 && y < 5 ? (y > 3.5 ? 3 : 4) : 0; var p = 5 - Math.abs(((x + 6) % 4) - 2) * 2.6; return Math.abs(x) < 6 && y > -p ? (Math.abs(x) < 1 && y > -1.5 ? 1 : 4) : 0; },
    el: function (x, y) { var r = Math.hypot(x, y); return r < 6.5 ? (r > 5 ? 3 : Math.abs(x) + Math.abs(y) < 3.4 ? 4 : 1) : 0; }
  };
  function icon(kind, color, size) {
    var cv = document.createElement('canvas'); cv.width = cv.height = 16; var g = cv.getContext('2d'), im = g.createImageData(16, 16), d = im.data, f = ICONF[kind] || ICONF.gem, c = col(color || '#cccccc');
    var pal = [null, c, lite(c), dark(c), [255, 255, 245], [80, 170, 70], [40, 30, 40]], m = new Uint8Array(256);
    for (var y = 0; y < 16; y++) for (var x = 0; x < 16; x++) { var v = f(x - 7.5, y - 7.5); m[y * 16 + x] = v; if (v) { var o = (y * 16 + x) * 4, p = pal[v]; d[o] = p[0]; d[o + 1] = p[1]; d[o + 2] = p[2]; d[o + 3] = 255; } }
    for (var y2 = 0; y2 < 16; y2++) for (var x2 = 0; x2 < 16; x2++) if (!m[y2 * 16 + x2]) { var n = (x2 > 0 && m[y2 * 16 + x2 - 1]) || (x2 < 15 && m[y2 * 16 + x2 + 1]) || (y2 > 0 && m[y2 * 16 - 16 + x2]) || (y2 < 15 && m[y2 * 16 + 16 + x2]); if (n) { var o2 = (y2 * 16 + x2) * 4; d[o2] = 30; d[o2 + 1] = 22; d[o2 + 2] = 40; d[o2 + 3] = 255; } }
    g.putImageData(im, 0, 0); return cv;
  }
  function toCanvas(data, w, h) { var cv = document.createElement('canvas'); cv.width = w; cv.height = h; var g = cv.getContext('2d'), im = g.createImageData(w, h); im.data.set(data); g.putImageData(im, 0, 0); return cv; }
  var cache = {};
  function charCanvas(id, S, fi, yaw) { // UI용 초상(크게 찍어도 도트)
    var k = id + '_' + S + '_' + (fi || 0) + '_' + (yaw || 0); if (cache[k]) return cache[k];
    var c = DATA.CH[id], w = Math.round(S * 2.3), h = Math.round(S * 2.2);
    var pr = humanoid(c.look, pose(fi || 0, c.wt), c.wt, fi == 16 || fi == 12 ? hex(DATA.EL[c.el].c) : null);
    return cache[k] = toCanvas(render(pr, w, h, yaw == null ? .35 : yaw, .12, S, w / 2, h - S * .12), w, h);
  }
  function weaponCanvas(id, S) { var k = 'w' + id + S; if (cache[k]) return cache[k]; S = S || 22; var w = Math.round(S * 1.9); return cache[k] = toCanvas(render(weaponPrims(DATA.WP[id]), w, w, .25, .1, S, w / 2, w - S * .28), w, w); }
  function enemyCanvas(id, S) { var k = 'e' + id + S; if (cache[k]) return cache[k]; var e = DATA.EN[id], big = e.boss, w = Math.round(S * (big ? 4.6 : 2.2)), h = Math.round(S * (big ? 3.9 : 2.2)); return cache[k] = toCanvas(render(enemyPrims(e.rig, 0, 0, e.tint), w, h, .4, .15, S, w / 2, h - S * .15), w, h); }
  return { render: render, humanoid: humanoid, pose: pose, FR: FR, NFR: NFR, enemyPrims: enemyPrims, prop: prop, tiles: tiles, icon: icon, toCanvas: toCanvas, charCanvas: charCanvas, weaponCanvas: weaponCanvas, enemyCanvas: enemyCanvas, hex: hex, lite: lite, dark: dark, E: E, C: C, B: B };
})();
