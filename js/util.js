// 공용 유틸
var U = (function () {
  function mulberry(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function hash2(x, y, s) { var h = (x * 374761393 + y * 668265263 + (s || 0) * 1274126177) | 0; h = (h ^ (h >>> 13)) * 1274126177 | 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; }
  function sm(t) { return t * t * (3 - 2 * t); }
  function noise2(x, y, s) { var xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi; var a = hash2(xi, yi, s), b = hash2(xi + 1, yi, s), c = hash2(xi, yi + 1, s), d = hash2(xi + 1, yi + 1, s); var u = sm(xf), v = sm(yf); return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v; }
  function fbm(x, y, s, o) { var v = 0, a = .5, f = 1; for (var i = 0; i < (o || 4); i++) { v += a * noise2(x * f, y * f, s + i * 17); a *= .5; f *= 2; } return v; }
  return {
    rng: mulberry, hash2: hash2, noise2: noise2, fbm: fbm,
    clamp: function (v, a, b) { return v < a ? a : v > b ? b : v; },
    lerp: function (a, b, t) { return a + (b - a) * t; },
    angDiff: function (a, b) { var d = (a - b) % (Math.PI * 2); if (d > Math.PI) d -= Math.PI * 2; if (d < -Math.PI) d += Math.PI * 2; return d; },
    pick: function (arr, r) { return arr[Math.floor((r || Math.random)() * arr.length)]; },
    hex: function (h) { var n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; },
    fmt: function (n) { n = Math.floor(n); return n.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','); },
    dayKey: function (t) { var d = new Date((t || Date.now()) - 4 * 3600e3); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); },
    weekKey: function (t) { var d = new Date((t || Date.now()) - 4 * 3600e3); var day = (d.getDay() + 6) % 7; d.setDate(d.getDate() - day); return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate(); },
    weekday: function () { return new Date(Date.now() - 4 * 3600e3).getDay(); },
    dur: function (ms) { var s = Math.max(0, Math.floor(ms / 1000)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60); return h > 0 ? h + '시간 ' + m + '분' : m > 0 ? m + '분 ' + (s % 60) + '초' : s + '초'; }
  };
})();
if (typeof module !== 'undefined') module.exports = U;
