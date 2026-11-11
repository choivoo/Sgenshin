// 칩튠 합성: 효과음과 음악을 전부 코드로 만든다
var AUD = (function () {
  var ac = null, master, mg, sg, noiseBuf, cur = null, tracks = {}, timer = null, vol = { bgm: .6, sfx: .8 };
  function init() {
    if (ac) { if (ac.state == 'suspended') ac.resume(); return; }
    try { ac = new (window.AudioContext || window.webkitAudioContext)(); } catch (e) { return; }
    master = ac.createGain(); master.connect(ac.destination); mg = ac.createGain(); mg.connect(master); sg = ac.createGain(); sg.connect(master); setVol();
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate); var d = noiseBuf.getChannelData(0); for (var i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
    timer = setInterval(sched, 90); if (want) music(want);
  }
  function setVol(b, s) { if (b != null) vol.bgm = b; if (s != null) vol.sfx = s; if (ac) { mg.gain.value = vol.bgm * .5; sg.gain.value = vol.sfx * .6; } }
  function tone(type, f0, f1, dur, v, delay, dest, t0) {
    if (!ac) return; var t = (t0 || ac.currentTime) + (delay || 0), g = ac.createGain(); g.connect(dest || sg);
    g.gain.setValueAtTime(0.0001, t); g.gain.linearRampToValueAtTime(v, t + .008); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    if (type == 'n') { var s = ac.createBufferSource(); s.buffer = noiseBuf; s.loop = true; var f = ac.createBiquadFilter(); f.type = f1 < 0 ? 'highpass' : 'lowpass'; f.frequency.setValueAtTime(f0, t); if (f1 > 0) f.frequency.exponentialRampToValueAtTime(f1, t + dur); s.connect(f); f.connect(g); s.start(t, Math.random()); s.stop(t + dur + .02); }
    else { var o = ac.createOscillator(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 != f0) o.frequency.exponentialRampToValueAtTime(f1, t + dur); o.connect(g); o.start(t); o.stop(t + dur + .02); }
  }
  var SQ = 'square', TR = 'triangle', SW = 'sawtooth', SI = 'sine';
  var SFX = {
    ui: [[SQ, 880, 1320, .06, .15]], deny: [[SQ, 220, 160, .12, .2]], step: [['n', 500, 200, .05, .12]], jump: [[SQ, 300, 620, .1, .14]], dash: [['n', 3000, 600, .14, .25]], glide: [['n', 800, 2400, .3, .14]], splash: [['n', 1800, 300, .3, .35]], land: [['n', 300, 80, .2, .5], [SI, 120, 50, .2, .4]],
    swing: [['n', 2600, 700, .09, .25]], swingH: [['n', 1500, 300, .16, .35], [SI, 160, 70, .12, .2]], bow: [[TR, 900, 300, .1, .25], ['n', 4000, 1500, .06, .12]], magic: [[SI, 700, 1400, .12, .22], [TR, 1400, 900, .1, .1, .05]],
    hit: [['n', 1400, 400, .07, .4], [SQ, 200, 90, .06, .25]], crit: [['n', 2600, 500, .1, .5], [SQ, 320, 110, .1, .3], [SQ, 1760, 1760, .05, .12, .02]], kill: [[SQ, 500, 120, .22, .22], ['n', 900, 200, .22, .25]], hurt: [[SW, 240, 90, .18, .3], ['n', 700, 200, .12, .3]], block: [[SQ, 1200, 800, .06, .2], ['n', 3000, 1000, .05, .2]], down: [[SW, 300, 60, .6, .3]],
    skill: [[SQ, 440, 1100, .16, .2], [SI, 1100, 1800, .2, .14, .08]], burst: [[SW, 110, 880, .5, .28], ['n', 400, 5000, .5, .22], [SQ, 880, 1760, .3, .16, .4]], boom: [['n', 900, 60, .45, .6], [SI, 130, 35, .4, .5]], heal: [[SI, 660, 990, .18, .2], [SI, 990, 1320, .2, .16, .12]], swap: [[SQ, 660, 990, .07, .16], [SQ, 990, 1480, .07, .14, .06]],
    react: [[SQ, 1320, 1980, .08, .16], [TR, 1980, 2640, .1, .12, .05]], ice: [[SI, 2400, 1600, .2, .2], ['n', 6000, -1, .12, .15]], 'break': [['n', 3000, 300, .35, .5], [SQ, 1500, 300, .3, .25]], warn: [[SQ, 620, 620, .08, .14], [SQ, 620, 620, .08, .14, .14]], roar: [[SW, 90, 50, .9, .4], ['n', 500, 150, .9, .4]], thunder: [['n', 2500, 80, 1.1, .6], [SI, 80, 40, .8, .4]],
    clear: [[SQ, 523, 523, .12, .2], [SQ, 659, 659, .12, .2, .12], [SQ, 784, 784, .12, .2, .24], [SQ, 1047, 1047, .35, .22, .36]], quest: [[SQ, 659, 659, .1, .18], [SQ, 880, 880, .1, .18, .1], [SQ, 1319, 1319, .3, .2, .2]], coin: [[SQ, 1568, 1568, .05, .16], [SQ, 2093, 2093, .12, .16, .05]], orb: [[SI, 1047, 2093, .3, .22], [TR, 1568, 3136, .3, .12, .1]],
    solve: [[SQ, 784, 784, .09, .18], [SQ, 988, 988, .09, .18, .09], [SQ, 1175, 1175, .09, .18, .18], [SQ, 1568, 1568, .3, .2, .27]], fire: [['n', 1200, 3000, .25, .3]], mine: [[SQ, 1800, 900, .05, .2], ['n', 4000, 1500, .06, .25]], chest: [[SQ, 523, 523, .08, .18], [SQ, 784, 784, .08, .18, .08], [SQ, 1047, 1047, .08, .18, .16], [SQ, 1568, 1568, .4, .2, .24], ['n', 6000, -1, .4, .08, .24]], pick: [[TR, 700, 1100, .08, .22]],
    meteor: [['n', 300, 4000, 1.3, .3], [SW, 1200, 200, 1.3, .12]], star3: [[SI, 880, 880, .25, .2], [SI, 1320, 1320, .3, .14, .1]], star4: [[SQ, 660, 660, .12, .16], [SQ, 880, 880, .12, .16, .1], [SQ, 1320, 1320, .4, .18, .2], [SI, 2640, 2640, .5, .1, .2]],
    star5: [[SW, 65, 65, 1.6, .3], [SQ, 523, 523, .16, .2], [SQ, 659, 659, .16, .2, .16], [SQ, 784, 784, .16, .2, .32], [SQ, 1047, 1047, .16, .22, .48], [SQ, 1319, 1319, .16, .22, .64], [SQ, 1568, 1568, .9, .25, .8], [SI, 3136, 3136, 1.2, .14, .8], ['n', 8000, -1, 1.2, .14, .8], [TR, 2093, 2093, .9, .16, .95]],
    reveal: [[SI, 1568, 2093, .15, .16]], fish: [[SQ, 1400, 1400, .05, .2], [SQ, 1400, 1400, .05, .2, .1]], cook: [['n', 5000, 2000, .4, .15]], door: [[SW, 60, 45, 2.2, .3], ['n', 200, 900, 2.2, .25]], tele: [[SI, 300, 2400, .6, .2], ['n', 500, 6000, .6, .15]], shutter: [['n', 5000, 800, .08, .4], ['n', 5000, 800, .08, .3, .1]]
  };
  var ELF = { fire: [SW, 300, 900], water: [SI, 500, 250], ice: [TR, 2000, 2600], elec: [SQ, 1500, 500], wind: ['n', 1500, 4000], grass: [TR, 600, 900], rock: [SQ, 150, 90] };
  var last = {};
  function sfx(n) { if (!ac) return; var now = ac.currentTime; if (last[n] && now - last[n] < .04) return; last[n] = now; (SFX[n] || SFX.ui).forEach(function (s) { tone(s[0], s[1], s[2], s[3], s[4], s[5]); }); }
  function el(e) { var f = ELF[e]; if (f) tone(f[0], f[1], f[2], .25, .16, .03); }
  // ── 음악 ──
  var MAJ = [0, 2, 4, 5, 7, 9, 11], MIN = [0, 2, 3, 5, 7, 8, 10];
  function T(bpm, root, sc, ch, lead, o) { return Object.assign({ bpm: bpm, root: root, sc: sc, ch: ch, lead: lead, drum: 1, bass: 1, arp: 1, lw: SQ }, o || {}); }
  var TR_ = {
    title: T(80, 60, MAJ, [0, 5, 3, 4], ['4-.2 4-7- 6-.4 2-..', '5-.3 5-8- 7-65 4-..', '4-.2 4-7- 9-87 6-..', '5-67 8-6- 7--- ....'], { drum: 0, lw: TR, arpw: SI }),
    meadow: T(112, 55, MAJ, [0, 4, 5, 3], ['7.79 8-7- 5-42 4-..', '4.45 6-5- 4-21 2-..', '7.79 8-7- 9-b9 8-..', '6.54 5-6- 7--- ....'], {}),
    town: T(124, 53, MAJ, [0, 3, 4, 0], ['4.47 6.4. 5.57 8.7.', '6.64 5.3. 4-56 4-..', '4.47 6.4. 5.57 9.8.', '7.65 4.5. 4--- ....'], { drum: 2 }),
    canyon: T(100, 50, MIN, [0, 6, 5, 4], ['7--4 5-7- 8-74 5-..', '6--3 4-6- 7-65 4-..', '7--4 5-7- 9-87 8-..', 'a-98 7-5- 7--- ....'], { lw: SW, drum: 3 }),
    snow: T(78, 57, MIN, [0, 5, 2, 6], ['9-.7 8--- 7-.4 5---', '8-.6 7--- 5-.2 4---', '9-.7 8--- b-.9 a---', '9-87 5--- 7--- ....'], { drum: 0, lw: SI, arpw: TR }),
    battle: T(152, 52, MIN, [0, 5, 6, 4], ['7.77 9.7. 8.7. 5.4.', '7.77 9.7. a.9. 8.7.', '5.55 7.5. 6.5. 4.2.', '4.56 7.89 a-9- 7-..'], { drum: 4, bass: 2 }),
    boss: T(166, 48, MIN, [0, 0, 5, 6], ['7-.7 .7a- 9-87 8-..', '7-.7 .7b- a-9a b-..', '9-.9 .9c- b-a9 a-..', 'b-a9 8-79 7--- 7.7.'], { drum: 4, bass: 2, lw: SW }),
    gacha: T(104, 59, MAJ, [3, 4, 2, 5], ['7-9- b-9- 8-a- c-a-', '9-b- d-b- a-8- 7-..', '7-9- b-9- 8-a- c-a-', 'b-c- d-e- d--- ....'], { drum: 1, lw: TR, arpw: SQ })
  };
  var want = null, st = null;
  function music(name) {
    want = name; if (!ac || !TR_[name]) return; if (cur == name) return; var now = ac.currentTime;
    if (st) { var og = st.g; og.gain.cancelScheduledValues(now); og.gain.setValueAtTime(og.gain.value, now); og.gain.linearRampToValueAtTime(0, now + 1.2); setTimeout(function () { og.disconnect(); }, 1500); }
    var g = ac.createGain(); g.gain.setValueAtTime(0, now); g.gain.linearRampToValueAtTime(1, now + 1.2); g.connect(mg); cur = name; st = { g: g, tr: TR_[name], step: 0, next: now + .1 };
  }
  function deg(tr, d, oct) { return 440 * Math.pow(2, (tr.root + tr.sc[((d % 7) + 7) % 7] + 12 * Math.floor(d / 7) + 12 * (oct || 0) - 69) / 12); }
  function sched() {
    if (!ac || !st) return; var tr = st.tr, spb = 60 / tr.bpm / 4;
    while (st.next < ac.currentTime + .25) {
      var s = st.step % 64, bar = s >> 4, b = s % 16, t = st.next, ch = tr.ch[bar], g = st.g;
      // 리드(8분음표)
      if (b % 2 == 0) { var str = tr.lead[bar].replace(/ /g, ''), c = str[b >> 1]; if (c != '-' && c != '.') { var d = parseInt(c, 16), len = 1; for (var q = (b >> 1) + 1; q < 8 && str[q] == '-'; q++) len++; tone(tr.lw, deg(tr, d, 1), 0, spb * 2 * len * .95, .1, 0, g, t); } }
      // 베이스
      if (tr.bass == 1 ? (b % 8 == 0 || b == 6 || b == 12) : b % 2 == 0) tone(TR, deg(tr, ch, -1), 0, spb * (tr.bass == 1 ? 3 : 1.6), .2, 0, g, t);
      // 아르페지오
      if (tr.arp && b % 2 == (tr.drum == 0 ? 0 : 1)) { var a = [0, 2, 4, 2, 7, 4, 2, 4][(b >> 1) % 8]; tone(tr.arpw || TR, deg(tr, ch + a, 1), 0, spb * 1.8, .045, 0, g, t); }
      // 드럼
      var dr = tr.drum; if (dr) { if (b % 8 == 0 || (dr >= 3 && b == 10) || (dr == 4 && b % 4 == 0)) { tone(SI, 150, 45, .12, .32, 0, g, t); } if (b % 8 == 4) tone('n', 1800, 500, .1, .16, 0, g, t); if (b % 2 == 0 && dr != 3 || (dr == 4)) tone('n', 7000, -1, .03, .05, 0, g, t); if (dr == 2 && b % 4 == 2) tone('n', 5000, -1, .05, .07, 0, g, t); }
      st.step++; st.next += spb;
    }
  }
  return { init: init, sfx: sfx, el: el, music: music, setVol: setVol, get cur() { return cur; } };
})();
