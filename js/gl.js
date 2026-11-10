// WebGL 렌더러: 낮은 내부 해상도 + 최근접 샘플링 + 디더 포스터라이즈. 스프라이트 아틀라스 굽기 포함.
var SPR = { ch: {}, en: {}, prop: {}, fx: {}, npc: {} };
var R = (function () {
  var gl, cv, W = 480, H = 270, progT, progS, progSky, texTiles, texAtlas, atlasCv, atlasG, chunks = [], world;
  var cam = { x: 0, y: 0, z: 0, yaw: 0, pitch: 0, fx: 0, fy: 0, fz: 1, rx: 1, rz: 0, ux: 0, uy: 1, uz: 0, vp: new Float32Array(16), fov: 58 };
  var env = { light: [1, 1, 1], fog: [.6, .8, .95], fogN: 60, fogF: 150, skyT: [.25, .5, .9], skyB: [.7, .87, 1], night: 0, cloud: .4, sun: [0.3, .8, .5], time: 0, lev: 24 };
  var MAXQ = 6000, qbuf = new ArrayBuffer(MAXQ * 4 * 28), qf = new Float32Array(qbuf), qb = new Uint8Array(qbuf), qn = 0, qvbo, qibo;
  var BAYER = 'float b2(vec2 a){a=floor(a);return fract(a.x*.5+a.y*a.y*.75);}float bayer(vec2 a){return b2(.5*a)*.25+b2(a);}';
  var FOGPOST = 'vec3 post(vec3 c,float d){float f=clamp((d-u_fog.x)/(u_fog.y-u_fog.x),0.,1.);float b=bayer(gl_FragCoord.xy);f=floor(f*8.+b)/8.;c=mix(c,u_fogc,clamp(f,0.,1.));return floor(c*u_lev+b)/u_lev;}';
  function sh(type, src) { var s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s); if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) + src); return s; }
  function prog(vs, fs, attrs) { var p = gl.createProgram(); gl.attachShader(p, sh(gl.VERTEX_SHADER, vs)); gl.attachShader(p, sh(gl.FRAGMENT_SHADER, 'precision mediump float;' + fs)); attrs.forEach(function (a, i) { gl.bindAttribLocation(p, i, a); }); gl.linkProgram(p); if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p)); var u = {}, n = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS); for (var i = 0; i < n; i++) { var nm = gl.getActiveUniform(p, i).name; u[nm] = gl.getUniformLocation(p, nm); } p.u = u; return p; }
  function init(canvas) {
    cv = canvas; gl = cv.getContext('webgl', { antialias: false, alpha: false, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
    if (!gl) throw new Error('WebGL을 사용할 수 없습니다');
    progT = prog('attribute vec3 a_p;attribute vec2 a_uv;attribute vec4 a_c;uniform mat4 u_vp;uniform float u_anim;varying vec2 v_uv;varying vec4 v_c;varying float v_d;void main(){gl_Position=u_vp*vec4(a_p,1.);v_d=gl_Position.w;v_uv=a_uv;if(a_c.a<.6)v_uv.x+=u_anim;v_c=a_c;}',
      'uniform sampler2D u_t;uniform vec3 u_light,u_fogc;uniform vec2 u_fog;uniform float u_lev;varying vec2 v_uv;varying vec4 v_c;varying float v_d;' + BAYER + FOGPOST + 'void main(){vec3 c=texture2D(u_t,v_uv).rgb*v_c.rgb*1.6;if(v_c.a>.9||v_c.a<.2)c*=u_light;gl_FragColor=vec4(post(c,v_d),1.);}', ['a_p', 'a_uv', 'a_c']);
    progS = prog('attribute vec3 a_p;attribute vec2 a_uv;attribute vec4 a_c;attribute vec4 a_a;uniform mat4 u_vp;varying vec2 v_uv;varying vec4 v_c;varying vec4 v_a;varying float v_d;void main(){gl_Position=u_vp*vec4(a_p,1.);v_d=gl_Position.w;v_uv=a_uv;v_c=a_c;v_a=a_a;}',
      'uniform sampler2D u_t;uniform vec3 u_light,u_fogc;uniform vec2 u_fog;uniform float u_lev;varying vec2 v_uv;varying vec4 v_c;varying vec4 v_a;varying float v_d;' + BAYER + FOGPOST + 'void main(){vec4 t=texture2D(u_t,v_uv);if(t.a<.5)discard;if(v_c.a<bayer(gl_FragCoord.xy)+.04)discard;vec3 c=t.rgb*v_c.rgb*2.;if(v_a.a<.5)c*=u_light;c+=v_a.rgb;gl_FragColor=vec4(post(c,v_a.a>.9?0.:v_d),1.);}', ['a_p', 'a_uv', 'a_c', 'a_a']);
    progSky = prog('attribute vec2 a_p;varying vec2 v_p;void main(){v_p=a_p;gl_Position=vec4(a_p,.9999,1.);}',
      'uniform vec3 u_f,u_r,u_u,u_top,u_bot,u_sun;uniform vec4 u_p;uniform float u_lev,u_cl;varying vec2 v_p;' + BAYER +
      'float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}float n(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h(i),h(i+vec2(1,0)),f.x),mix(h(i+vec2(0,1)),h(i+vec2(1,1)),f.x),f.y);}' +
      'void main(){vec3 d=normalize(u_f+u_r*v_p.x*u_p.x+u_u*v_p.y*u_p.y);float b=bayer(gl_FragCoord.xy);float t=clamp(d.y*1.6+.15,0.,1.);t=floor(t*10.+b)/10.;vec3 c=mix(u_bot,u_top,t);' +
      'float sd=dot(d,u_sun);if(sd>.9975)c=mix(vec3(1.,.97,.8),vec3(.85,.9,1.),u_p.w);else if(sd>.99)c+=vec3(.12,.1,.06)*(1.-u_p.w);' +
      'if(u_p.w>.3&&d.y>0.){vec2 sp=floor(vec2(atan(d.z,d.x)*90.,d.y*140.));if(h(sp)>.992)c+=vec3(.8)*u_p.w*step(.5,h(sp+3.)+.3*sin(u_p.z*2.+sp.x));}' +
      'if(d.y>.03){vec2 uv=d.xz/(d.y+.12)*1.5+vec2(u_p.z*.02,0.);uv=floor(uv*14.)/14.;float cl=n(uv*1.3)*.6+n(uv*3.1)*.4;cl=smoothstep(.9-.5*u_cl,1.-.4*u_cl,cl);vec3 cc=mix(vec3(1.),u_bot,.25)*(1.-u_p.w*.6);c=mix(c,cc,floor(cl*3.+b*.9)/3.*min(1.,d.y*6.));}' +
      'gl_FragColor=vec4(floor(c*u_lev+b)/u_lev,1.);}', ['a_p']);
    qvbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, qvbo); gl.bufferData(gl.ARRAY_BUFFER, qbuf.byteLength, gl.DYNAMIC_DRAW);
    var idx = new Uint16Array(MAXQ * 6); for (var i = 0; i < MAXQ; i++) { idx.set([i * 4, i * 4 + 1, i * 4 + 2, i * 4, i * 4 + 2, i * 4 + 3], i * 6); }
    qibo = gl.createBuffer(); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, qibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, idx, gl.STATIC_DRAW);
    R.skyvbo = gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER, R.skyvbo); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, 1, 1, -1, -1, 1, 1, -1, 1]), gl.STATIC_DRAW);
    texTiles = mkTex(PX.tiles(), true);
    atlasCv = document.createElement('canvas'); atlasCv.width = 4096; atlasCv.height = 2048; atlasG = atlasCv.getContext('2d');
    gl.enable(gl.DEPTH_TEST); gl.depthFunc(gl.LEQUAL);
  }
  function mkTex(src, mip) { var t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t); gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, gl.RGBA, gl.UNSIGNED_BYTE, src); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, mip ? gl.NEAREST_MIPMAP_NEAREST : gl.NEAREST); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE); gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE); if (mip) gl.generateMipmap(gl.TEXTURE_2D); return t; }
  function resize(w, h) { W = w; H = h; cv.width = w; cv.height = h; }

  // ── 아틀라스 ──
  var ax = 0, ay = 0, arow = 0;
  function alloc(w, h) { if (ax + w > 4096) { ax = 0; ay += arow; arow = 0; } if (ay + h > 2048) throw new Error('아틀라스 초과'); var r = { x: ax, y: ay }; ax += w; arow = Math.max(arow, h); return r; }
  function put(data, w, h, S, ox, oy) { var p = alloc(w, h), im = atlasG.createImageData(w, h); im.data.set(data); atlasG.putImageData(im, p.x, p.y); return { u0: p.x / 4096, v0: p.y / 2048, u1: (p.x + w) / 4096, v1: (p.y + h) / 2048, w: w, h: h, s: S, ox: ox, oy: oy, px: p.x, py: p.y }; }
  var D5 = [0, 1, 2, 3, 4];
  function bakeJobs() {
    var jobs = [];
    DATA.CHARS.forEach(function (c) { jobs.push(function () { var fr = []; var elc = PX.hex(DATA.EL[c.el].c); for (var f = 0; f < PX.NFR; f++) { fr[f] = D5.map(function (k) { return put(PX.render(PX.humanoid(c.look, PX.pose(f, c.wt), c.wt, f == 16 ? elc : null), 48, 48, k * Math.PI / 4, .2, 24, 24, 45), 48, 48, 24, 24, 45); }); } SPR.ch[c.id] = fr; }); });
    DATA.ENEMIES.forEach(function (e) {
      if (e.boss) { for (var fm = 0; fm < e.phases.length; fm++) (function (fm) { jobs.push(function () { var fr = []; for (var f = 0; f < 4; f++) fr[f] = D5.map(function (k) { return put(PX.render(PX.enemyPrims(e.rig, f, fm), 104, 96, k * Math.PI / 4, .2, 22, 52, 92), 104, 96, 22, 52, 92); }); SPR.en[e.id + '_' + fm] = fr; }); })(fm); }
      else jobs.push(function () { var fr = []; for (var f = 0; f < 6; f++) fr[f] = D5.map(function (k) { return put(PX.render(PX.enemyPrims(e.rig, f, 0, e.tint), 48, 48, k * Math.PI / 4, .2, 24, 24, 45), 48, 48, 24, 24, 45); }); SPR.en[e.id] = fr; });
    });
    var props = [['tree', 3, 72, 84], ['pine', 1, 56, 84], ['dead', 2, 56, 72], ['palm', 1, 64, 64], ['bush', 4, 32, 24], ['rock', 3, 32, 24], ['grass', 4, 16, 12], ['flower', 4, 16, 16], ['mush', 2, 16, 14], ['herb', 2, 16, 14], ['fruit', 2, 28, 24], ['carrot', 1, 16, 14], ['wheat', 1, 16, 20], ['ore', 3, 28, 20], ['chest', 4, 24, 20], ['chestopen', 4, 24, 24], ['statue', 2, 56, 72], ['gate', 2, 48, 48], ['orb', 3, 24, 22], ['seelie', 1, 16, 20], ['pedestal', 2, 20, 28], ['torch', 2, 16, 40], ['monu', 14, 24, 44], ['flag', 2, 24, 40], ['pot', 1, 28, 20], ['anvil', 1, 48, 32], ['bench', 1, 36, 26], ['board', 1, 28, 32], ['tent', 1, 48, 44], ['fire', 1, 20, 22], ['crate', 1, 20, 20], ['buoy', 1, 16, 18], ['crystal', 3, 28, 30], ['weak', 1, 20, 20], ['dummy', 1, 28, 40]];
    jobs.push(function () { props.forEach(function (p) { for (var v = 0; v < p[1]; v++) SPR.prop[p[0] + v] = put(PX.render(PX.prop(p[0], v), p[2], p[3], .4, .22, 22, p[2] / 2, p[3] - 3), p[2], p[3], 22, p[2] / 2, p[3] - 3); }); });
    jobs.push(function () { Object.keys(DATA.NPC || {}).forEach(function (id) { var n = DATA.NPC[id]; SPR.npc[id] = D5.map(function (k) { return put(PX.render(PX.humanoid(n.look, PX.pose(0), null), 48, 48, k * Math.PI / 4, .2, 24, 24, 45), 48, 48, 24, 24, 45); }); }); });
    jobs.push(function () { // 효과 도형
      function shape(name, n, fn) { var d = new Uint8ClampedArray(n * n * 4); for (var y = 0; y < n; y++) for (var x = 0; x < n; x++) { var v = fn((x + .5) / n * 2 - 1, (y + .5) / n * 2 - 1, x, y); if (v > 0) { var o = (y * n + x) * 4; d[o] = d[o + 1] = d[o + 2] = v > 1 ? 255 : 255 * v; d[o + 3] = 255; } } SPR.fx[name] = put(d, n, n, n / 2, n / 2, n / 2); }
      shape('dot', 4, function () { return 1; });
      shape('circle', 32, function (x, y) { return x * x + y * y < .92 ? 1 : 0; });
      shape('ring', 48, function (x, y) { var r = Math.hypot(x, y); return r < .96 && r > .82 ? 1 : 0; });
      shape('tele', 48, function (x, y, px, py) { var r = Math.hypot(x, y); return r < .96 && (r > .86 || (px + py) % 4 == 0) ? 1 : 0; });
      shape('rect', 16, function (x, y, px, py) { return (Math.abs(x) > .8 || Math.abs(y) > .8 || (px + py) % 4 == 0) ? 1 : 0; });
      shape('slash', 32, function (x, y) { var r = Math.hypot(x, y + .5), a = Math.atan2(y + .5, x); return r < 1.3 && r > 1.3 - .32 * Math.max(0, Math.sin((a + 2.6) * 1.5)) && a < -.5 && a > -2.6 ? 1 : 0; });
      shape('star', 16, function (x, y) { return Math.pow(Math.abs(x), .6) + Math.pow(Math.abs(y), .6) < 1 ? 1 : 0; });
      shape('diamond', 16, function (x, y) { return Math.abs(x) + Math.abs(y) < .95 ? 1 : 0; });
      shape('glow', 32, function (x, y, px, py) { var r = Math.hypot(x, y); return r < .5 ? 1 : (r < .95 && ((px + py) % 2 == 0) && U.hash2(px, py, 1) > r - .2) ? 1 : 0; });
      shape('arrow', 16, function (x, y) { return Math.abs(y) < .14 && x < .6 || (x > .3 && Math.abs(y) < (1 - x) * .7) ? 1 : 0; });
      shape('rune', 48, function (x, y) { var r = Math.hypot(x, y), a = Math.atan2(y, x); return (r < .97 && r > .9) || (r < .7 && r > .64) || (r < .9 && r > .7 && Math.abs(Math.sin(a * 6)) < .12) || (Math.abs(x) + Math.abs(y) < .45 && Math.abs(x) + Math.abs(y) > .36) ? 1 : 0; });
      shape('drop', 8, function (x, y) { return Math.abs(x) < .3 ? 1 : 0; });
      shape('flake', 8, function (x, y) { return Math.abs(x) < .28 || Math.abs(y) < .28 ? 1 : 0; });
    });
    return jobs;
  }
  function bake(onProg) { var jobs = bakeJobs(), i = 0; return new Promise(function (res) { (function step() { var t = performance.now(); while (i < jobs.length && performance.now() - t < 30) jobs[i++](); if (onProg) onProg(i / jobs.length); if (i < jobs.length) setTimeout(step, 0); else { texAtlas = mkTex(atlasCv, false); res(); } })(); }); }

  // ── 지형 메시 ──
  var TW = 1 / 8, EPS = .002;
  function buildWorld(w) { world = w; chunks.forEach(function (c) { gl.deleteBuffer(c.vbo); gl.deleteBuffer(c.ibo); }); chunks = []; var n = w.N / 16; for (var cz = 0; cz < n; cz++) for (var cx = 0; cx < n; cx++) chunks.push(buildChunk(cx, cz)); }
  function buildChunk(cx, cz) {
    var w = world, N = w.N, CS = w.CS, v = [], cols = [], ind = [], nv = 0;
    function hAt(i, j) { if (i < 0 || j < 0 || i >= N || j >= N) return -99; return w.h[j * N + i]; }
    function quad(p, tile, c, a, vt) { // p: 4 꼭짓점 [x,y,z], c: 밝기 4개
      var u0 = (tile % 8) * TW + EPS, v0 = (tile >> 3) * TW + EPS, u1 = u0 + TW - 2 * EPS, v1 = v0 + TW - 2 * EPS, vv = vt == null ? v1 : v0 + (TW - 2 * EPS) * vt;
      var uv = [[u0, v0], [u1, v0], [u1, vv], [u0, vv]];
      for (var k = 0; k < 4; k++) { v.push(p[k][0], p[k][1], p[k][2], uv[k][0], uv[k][1]); var b = c[k]; cols.push(b[0], b[1], b[2], a); }
      ind.push(nv, nv + 1, nv + 2, nv, nv + 2, nv + 3); nv += 4;
    }
    function g3(b) { b = Math.max(0, Math.min(255, b * 160)); return [b, b, b]; }
    for (var j = cz * 16; j < cz * 16 + 16; j++) for (var i = cx * 16; i < cx * 16 + 16; i++) {
      var id = j * N + i, h = w.h[id], y = h * .5, x0 = i * CS, z0 = j * CS, x1 = x0 + CS, z1 = z0 + CS, jit = .94 + U.hash2(i, j, 5) * .1;
      var ao = function (di, dj) { var c = 0; if (hAt(i + di, j) > h) c++; if (hAt(i, j + dj) > h) c++; if (hAt(i + di, j + dj) > h) c++; return g3(jit * (1 - c * .16)); };
      var tint = w.tint ? w.tint[id] : 0, emis = w.top[id] >= 36 && w.top[id] < 40;
      quad([[x0, y, z0], [x1, y, z0], [x1, y, z1], [x0, y, z1]], w.top[id], [ao(-1, -1), ao(1, -1), ao(1, 1), ao(-1, 1)], 255);
      var lv = w.wl[id];
      if (lv > h) { var ly = lv * .5 - .12, dp = (lv - h) * .5, lava = w.wt[id] == 1, f = lava ? 1 : Math.max(.42, 1 - dp * .14), cc = lava ? [160, 160, 160] : [150 * f, 160 * f, 165 * (f * .5 + .5)]; quad([[x0, ly, z0], [x1, ly, z0], [x1, ly, z1], [x0, ly, z1]], lava ? 36 : 32, [cc, cc, cc, cc], lava ? 128 : 0); }
      var sides = [[1, 0, .8, [x1, z1], [x1, z0]], [-1, 0, .66, [x0, z0], [x0, z1]], [0, 1, .92, [x0, z1], [x1, z1]], [0, -1, .58, [x1, z0], [x0, z0]]];
      for (var s = 0; s < 4; s++) {
        var sd = sides[s], nh = hAt(i + sd[0], j + sd[1]); if (nh == -99 || nh >= h) continue;
        var top = y, bot = nh * .5, seg = 0;
        while (top > bot + .001) { var b2 = Math.max(bot, top - 2), fr = (top - b2) / 2, tile = seg == 0 ? w.side[id] : w.under[id], bt = g3(sd[2] * jit), bb = g3(sd[2] * jit * (b2 <= bot + .001 ? .78 : 1)); quad([[sd[3][0], top, sd[3][1]], [sd[4][0], top, sd[4][1]], [sd[4][0], b2, sd[4][1]], [sd[3][0], b2, sd[3][1]]], tile, [bt, bt, bb, bb], 255, fr); top = b2; seg++; }
      }
      var st = w.st[id];
      if (st) {
        var sy = st * .5, sby = w.sb[id] * .5, tl = w.stile[id], c1 = g3(jit), c5 = g3(.5);
        quad([[x0, sy, z0], [x1, sy, z0], [x1, sy, z1], [x0, sy, z1]], tl, [c1, c1, c1, c1], 255);
        quad([[x0, sby, z0], [x1, sby, z0], [x1, sby, z1], [x0, sby, z1]], w.under[id], [c5, c5, c5, c5], 255);
        for (var s2 = 0; s2 < 4; s2++) { var sd2 = sides[s2], ni = i + sd2[0], nj = j + sd2[1]; if (ni < 0 || nj < 0 || ni >= N || nj >= N) continue; var nid = nj * N + ni; if (w.st[nid] == st || w.h[nid] >= st) continue; var b3 = g3(sd2[2] * .9); quad([[sd2[3][0], sy, sd2[3][1]], [sd2[4][0], sy, sd2[4][1]], [sd2[4][0], sby, sd2[4][1]], [sd2[3][0], sby, sd2[3][1]]], w.sside ? w.sside[id] : tl, [b3, b3, b3, b3], 255, Math.min(1, (sy - sby) / 2)); }
      }
    }
    var buf = new ArrayBuffer(nv * 24), f32 = new Float32Array(buf), u8 = new Uint8Array(buf);
    for (var k = 0; k < nv; k++) { for (var q = 0; q < 5; q++) f32[k * 6 + q] = v[k * 5 + q]; for (var q2 = 0; q2 < 4; q2++) u8[k * 24 + 20 + q2] = cols[k * 4 + q2]; }
    var c = { vbo: gl.createBuffer(), ibo: gl.createBuffer(), n: ind.length, x: cx * 32 + 16, z: cz * 32 + 16 };
    gl.bindBuffer(gl.ARRAY_BUFFER, c.vbo); gl.bufferData(gl.ARRAY_BUFFER, buf, gl.STATIC_DRAW); gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, c.ibo); gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(ind), gl.STATIC_DRAW);
    return c;
  }

  // ── 카메라 ──
  function setCam(x, y, z, yaw, pitch) {
    cam.x = x; cam.y = y; cam.z = z; cam.yaw = yaw; cam.pitch = pitch;
    var cp = Math.cos(pitch), sp = Math.sin(pitch); cam.fx = Math.sin(yaw) * cp; cam.fy = -sp; cam.fz = Math.cos(yaw) * cp; // yaw: 0 = +z 방향을 봄
    cam.rx = -Math.cos(yaw); cam.rz = Math.sin(yaw); // 화면 오른쪽
    cam.ux = cam.rz * cam.fy * -1; cam.ux = -(0 * cam.fz - cam.rz * cam.fy); // up = f × r 의 부호 맞춤
    var ux = cam.fy * cam.rz - cam.fz * 0, uy = cam.fz * cam.rx - cam.fx * cam.rz, uz = cam.fx * 0 - cam.fy * cam.rx; if (uy < 0) { ux = -ux; uy = -uy; uz = -uz; } cam.ux = ux; cam.uy = uy; cam.uz = uz;
    var f = 1 / Math.tan(cam.fov * Math.PI / 360), asp = W / H, n = .25, fa = 420, m = cam.vp;
    // view 행렬 행: r, u, -f
    var tx = -(cam.rx * x + cam.rz * z), ty = -(ux * x + uy * y + uz * z), tz = (cam.fx * x + cam.fy * y + cam.fz * z);
    var V = [cam.rx, ux, -cam.fx, 0, 0, uy, -cam.fy, 0, cam.rz, uz, -cam.fz, 0, tx, ty, tz, 1];
    var P = [f / asp, 0, 0, 0, 0, f, 0, 0, 0, 0, (fa + n) / (n - fa), -1, 0, 0, 2 * fa * n / (n - fa), 0];
    for (var c = 0; c < 4; c++) for (var r = 0; r < 4; r++) { var s = 0; for (var k = 0; k < 4; k++) s += P[k * 4 + r] * V[c * 4 + k]; m[c * 4 + r] = s; }
  }
  function project(x, y, z) { var m = cam.vp, w = m[3] * x + m[7] * y + m[11] * z + m[15]; if (w < .1) return null; return { x: (m[0] * x + m[4] * y + m[8] * z + m[12]) / w * .5 + .5, y: .5 - (m[1] * x + m[5] * y + m[9] * z + m[13]) / w * .5, w: w }; }

  // ── 동적 쿼드 ──
  function vtx(x, y, z, u, v, r, g, b, a, ar, ag, ab, fl) { var o = qn * 7, ob = qn * 28 + 20; qf[o] = x; qf[o + 1] = y; qf[o + 2] = z; qf[o + 3] = u; qf[o + 4] = v; qb[ob] = r; qb[ob + 1] = g; qb[ob + 2] = b; qb[ob + 3] = a; qb[ob + 4] = ar; qb[ob + 5] = ag; qb[ob + 6] = ab; qb[ob + 7] = fl; qn++; }
  // 빌보드 스프라이트. o:{flip,sc,r,g,b,a,ar,ag,ab,unlit}
  function spr(rc, x, y, z, o) {
    if (!rc || qn > MAXQ * 4 - 8) return; o = o || {};
    var sc = (o.sc || 1) / rc.s, l = -rc.ox * sc, r = (rc.w - rc.ox) * sc, t = rc.oy * sc, b = -(rc.h - rc.oy) * sc, u0 = o.flip ? rc.u1 : rc.u0, u1 = o.flip ? rc.u0 : rc.u1;
    var cr = o.r == null ? 128 : o.r, cg = o.g == null ? 128 : o.g, cb = o.b == null ? 128 : o.b, a = o.a == null ? 255 : o.a * 255, ar = o.ar || 0, ag = o.ag || 0, ab = o.ab || 0, fl = o.unlit ? 128 : 0;
    vtx(x + cam.rx * l, y + t, z + cam.rz * l, u0, rc.v0, cr, cg, cb, a, ar, ag, ab, fl); vtx(x + cam.rx * r, y + t, z + cam.rz * r, u1, rc.v0, cr, cg, cb, a, ar, ag, ab, fl);
    vtx(x + cam.rx * r, y + b, z + cam.rz * r, u1, rc.v1, cr, cg, cb, a, ar, ag, ab, fl); vtx(x + cam.rx * l, y + b, z + cam.rz * l, u0, rc.v1, cr, cg, cb, a, ar, ag, ab, fl);
  }
  // 완전 카메라 정면 빌보드(입자)
  function px(x, y, z, size, r, g, b, a, shape) {
    if (qn > MAXQ * 4 - 8) return; var rc = SPR.fx[shape || 'dot'], s = size * .5, rx = cam.rx * s, rz = cam.rz * s, ux = cam.ux * s, uy = cam.uy * s, uz = cam.uz * s, al = a == null ? 255 : a * 255;
    vtx(x - rx + ux, y + uy, z - rz + uz, rc.u0, rc.v0, r >> 1, g >> 1, b >> 1, al, 0, 0, 0, 255); vtx(x + rx + ux, y + uy, z + rz + uz, rc.u1, rc.v0, r >> 1, g >> 1, b >> 1, al, 0, 0, 0, 255);
    vtx(x + rx - ux, y - uy, z + rz - uz, rc.u1, rc.v1, r >> 1, g >> 1, b >> 1, al, 0, 0, 0, 255); vtx(x - rx - ux, y - uy, z - rz - uz, rc.u0, rc.v1, r >> 1, g >> 1, b >> 1, al, 0, 0, 0, 255);
  }
  // 바닥 데칼
  function flat(shape, x, y, z, rad, r, g, b, a, rot, lit) {
    if (qn > MAXQ * 4 - 8) return; var rc = SPR.fx[shape], c = Math.cos(rot || 0) * rad, s = Math.sin(rot || 0) * rad, al = a * 255, fl = lit ? 0 : 128; r >>= 1; g >>= 1; b >>= 1;
    vtx(x - c + s, y, z - s - c, rc.u0, rc.v0, r, g, b, al, 0, 0, 0, fl); vtx(x + c + s, y, z + s - c, rc.u1, rc.v0, r, g, b, al, 0, 0, 0, fl); vtx(x + c - s, y, z + s + c, rc.u1, rc.v1, r, g, b, al, 0, 0, 0, fl); vtx(x - c - s, y, z - s + c, rc.u0, rc.v1, r, g, b, al, 0, 0, 0, fl);
  }
  // 바닥 사각(선형 예고)
  function flatRect(x0, z0, x1, z1, hw, y, r, g, b, a) {
    if (qn > MAXQ * 4 - 8) return; var rc = SPR.fx.rect, dx = x1 - x0, dz = z1 - z0, l = Math.hypot(dx, dz) || 1, nx = -dz / l * hw, nz = dx / l * hw, al = a * 255; r >>= 1; g >>= 1; b >>= 1;
    vtx(x0 + nx, y, z0 + nz, rc.u0, rc.v0, r, g, b, al, 0, 0, 0, 128); vtx(x1 + nx, y, z1 + nz, rc.u1, rc.v0, r, g, b, al, 0, 0, 0, 128); vtx(x1 - nx, y, z1 - nz, rc.u1, rc.v1, r, g, b, al, 0, 0, 0, 128); vtx(x0 - nx, y, z0 - nz, rc.u0, rc.v1, r, g, b, al, 0, 0, 0, 128);
  }
  // 선(번개/베기)
  function line(x0, y0, z0, x1, y1, z1, wd, r, g, b, a) {
    if (qn > MAXQ * 4 - 8) return; var rc = SPR.fx.dot, dx = x1 - x0, dy = y1 - y0, dz = z1 - z0, nx = dy * cam.fz - dz * cam.fy, ny = dz * cam.fx - dx * cam.fz, nz = dx * cam.fy - dy * cam.fx, l = Math.hypot(nx, ny, nz) || 1; nx *= wd / l; ny *= wd / l; nz *= wd / l; var al = (a == null ? 1 : a) * 255; r >>= 1; g >>= 1; b >>= 1;
    vtx(x0 + nx, y0 + ny, z0 + nz, rc.u0, rc.v0, r, g, b, al, 0, 0, 0, 255); vtx(x1 + nx, y1 + ny, z1 + nz, rc.u1, rc.v0, r, g, b, al, 0, 0, 0, 255); vtx(x1 - nx, y1 - ny, z1 - nz, rc.u1, rc.v1, r, g, b, al, 0, 0, 0, 255); vtx(x0 - nx, y0 - ny, z0 - nz, rc.u0, rc.v1, r, g, b, al, 0, 0, 0, 255);
  }
  // 임의 방향 스프라이트(베기 호)
  function sprRot(shape, x, y, z, size, ang, tilt, r, g, b, a) {
    if (qn > MAXQ * 4 - 8) return; var rc = SPR.fx[shape], ca = Math.cos(ang), sa = Math.sin(ang), al = a * 255; r >>= 1; g >>= 1; b >>= 1;
    var pts = [[-1, -1], [1, -1], [1, 1], [-1, 1]], uv = [[rc.u0, rc.v0], [rc.u1, rc.v0], [rc.u1, rc.v1], [rc.u0, rc.v1]];
    for (var k = 0; k < 4; k++) { var lx = pts[k][0] * size, lz = -pts[k][1] * size, ly = lx * tilt; vtx(x + lx * ca + lz * sa, y + ly, z - lx * sa + lz * ca, uv[k][0], uv[k][1], r, g, b, al, 0, 0, 0, 255); }
  }

  function frame() {
    gl.viewport(0, 0, W, H); gl.clear(gl.DEPTH_BUFFER_BIT);
    // 하늘
    gl.disable(gl.DEPTH_TEST); gl.useProgram(progSky); gl.bindBuffer(gl.ARRAY_BUFFER, R.skyvbo); gl.enableVertexAttribArray(0); gl.disableVertexAttribArray(1); gl.disableVertexAttribArray(2); gl.disableVertexAttribArray(3); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    var u = progSky.u, th = Math.tan(cam.fov * Math.PI / 360);
    gl.uniform3f(u.u_f, cam.fx, cam.fy, cam.fz); gl.uniform3f(u.u_r, cam.rx, 0, cam.rz); gl.uniform3f(u.u_u, cam.ux, cam.uy, cam.uz); gl.uniform3fv(u.u_top, env.skyT); gl.uniform3fv(u.u_bot, env.skyB); gl.uniform3fv(u.u_sun, env.sun);
    gl.uniform4f(u.u_p, th * W / H, th, env.time, env.night); gl.uniform1f(u.u_lev, env.lev); gl.uniform1f(u.u_cl, env.cloud); gl.drawArrays(gl.TRIANGLES, 0, 6);
    gl.enable(gl.DEPTH_TEST);
    // 지형
    gl.useProgram(progT); u = progT.u; gl.uniformMatrix4fv(u.u_vp, false, cam.vp); gl.uniform1f(u.u_anim, Math.floor(env.time * 3) % 4 * TW); gl.uniform3fv(u.u_light, env.light); gl.uniform3fv(u.u_fogc, env.fog); gl.uniform2f(u.u_fog, env.fogN, env.fogF); gl.uniform1f(u.u_lev, env.lev);
    gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, texTiles); gl.uniform1i(u.u_t, 0);
    gl.enableVertexAttribArray(1); gl.enableVertexAttribArray(2);
    var fh = Math.hypot(cam.fx, cam.fz) || 1, hx = cam.fx / fh, hz = cam.fz / fh, far = env.fogF + 28;
    for (var i = 0; i < chunks.length; i++) {
      var c = chunks[i], dx = c.x - cam.x, dz = c.z - cam.z; if (dx * dx + dz * dz > far * far) continue; if (dx * hx + dz * hz < -30 && cam.pitch < 1.2) continue;
      gl.bindBuffer(gl.ARRAY_BUFFER, c.vbo); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 24, 0); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 24, 12); gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 24, 20);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, c.ibo); gl.drawElements(gl.TRIANGLES, c.n, gl.UNSIGNED_SHORT, 0);
    }
    // 스프라이트
    if (qn) {
      gl.useProgram(progS); u = progS.u; gl.uniformMatrix4fv(u.u_vp, false, cam.vp); gl.uniform3fv(u.u_light, env.light); gl.uniform3fv(u.u_fogc, env.fog); gl.uniform2f(u.u_fog, env.fogN, env.fogF); gl.uniform1f(u.u_lev, env.lev);
      gl.bindTexture(gl.TEXTURE_2D, texAtlas); gl.uniform1i(u.u_t, 0);
      gl.bindBuffer(gl.ARRAY_BUFFER, qvbo); gl.bufferSubData(gl.ARRAY_BUFFER, 0, new Uint8Array(qbuf, 0, qn * 28));
      gl.enableVertexAttribArray(3); gl.vertexAttribPointer(0, 3, gl.FLOAT, false, 28, 0); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 28, 12); gl.vertexAttribPointer(2, 4, gl.UNSIGNED_BYTE, true, 28, 20); gl.vertexAttribPointer(3, 4, gl.UNSIGNED_BYTE, true, 28, 24);
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, qibo); gl.drawElements(gl.TRIANGLES, qn / 4 * 6, gl.UNSIGNED_SHORT, 0);
    }
    qn = 0;
  }
  return { init: init, resize: resize, bake: bake, buildWorld: buildWorld, setCam: setCam, project: project, spr: spr, px: px, flat: flat, flatRect: flatRect, line: line, sprRot: sprRot, frame: frame, cam: cam, env: env, get W() { return W; }, get H() { return H; }, atlas: function () { return atlasCv; } };
})();
