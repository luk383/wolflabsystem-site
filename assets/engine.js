// Wolf Engine: calcoli di profilo atleta. Nessuna dipendenza, nessun invio di dati: tutto resta nel browser.
// Fonti dei modelli: vedi /metodologia e le note in pagina.
(function (root) {
  "use strict";
  var D = { "5K": 5000, "10K": 10000, "HM": 21097.5, "M": 42195 };

  // ---------- Modelli ----------
  // Daniels e Gilbert, "Oxygen Power" (1979): costo di ossigeno e frazione sostenibile di VO2max.
  function vo2OfVelocity(v) { return -4.6 + 0.182258 * v + 0.000104 * v * v; } // v in m/min
  function pctOfTime(t) { return 0.8 + 0.1894393 * Math.exp(-0.012778 * t) + 0.2989558 * Math.exp(-0.1932605 * t); } // t in minuti
  function vdotFromRace(meters, seconds) {
    var t = seconds / 60, v = meters / t;
    return vo2OfVelocity(v) / pctOfTime(t);
  }
  function velocityAtVo2(vo2) { // m/min
    var a = 0.000104, b = 0.182258, c = -(4.6 + vo2);
    return (-b + Math.sqrt(b * b - 4 * a * c)) / (2 * a);
  }
  function timeForDistance(vdot, meters) { // secondi, per bisezione
    var lo = 3, hi = 600; // minuti
    for (var i = 0; i < 80; i++) {
      var mid = (lo + hi) / 2, v = meters / mid;
      var needed = vo2OfVelocity(v) / pctOfTime(mid);
      if (needed > vdot) lo = mid; else hi = mid;
    }
    return ((lo + hi) / 2) * 60;
  }
  function paceAtPct(vdot, pct) { return 60000 / velocityAtVo2(vdot * pct); } // sec/km
  function riegel(t1, d1, d2) { return t1 * Math.pow(d2 / d1, 1.06); }
  function tanakaHRmax(age) { return 208 - 0.7 * age; } // Tanaka, Monahan, Seals 2001

  var HR_RUN = [["Z1", 0, 0.85], ["Z2", 0.85, 0.89], ["Z3", 0.90, 0.94], ["Z4", 0.95, 0.99], ["Z5a", 1.00, 1.02], ["Z5b", 1.03, 1.06], ["Z5c", 1.06, null]];
  var HR_BIKE = [["Z1", 0, 0.81], ["Z2", 0.81, 0.89], ["Z3", 0.90, 0.93], ["Z4", 0.94, 0.99], ["Z5a", 1.00, 1.02], ["Z5b", 1.03, 1.06], ["Z5c", 1.06, null]];
  var PW = [["1", 0, 0.55], ["2", 0.56, 0.75], ["3", 0.76, 0.90], ["4", 0.91, 1.05], ["5", 1.06, 1.20], ["6", 1.21, null]];

  // ---------- Formati ----------
  function mmss(sec) { sec = Math.round(sec); var m = Math.floor(sec / 60), s = sec % 60; return m + ":" + (s < 10 ? "0" : "") + s; }
  function hms(sec) { sec = Math.round(sec); var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60; return h + ":" + (m < 10 ? "0" : "") + m + ":" + (s < 10 ? "0" : "") + s; }
  function parseTime(str) {
    if (str == null) return NaN; str = String(str).trim(); if (!str) return NaN;
    var p = str.replace(/[.,]/g, ":").split(":").map(Number);
    if (p.some(isNaN) || p.some(function (x) { return x < 0; })) return NaN;
    if (p.length === 2) return p[0] * 60 + p[1];
    if (p.length === 3) return p[0] * 3600 + p[1] * 60 + p[2];
    return NaN;
  }

  // ---------- Calcolo del profilo ----------
  // in: {age, sex, weight, height, ftp, t5k, t10k, thm, tm (secondi), hrmax, lthr, hours, days, sports:{run,bike,strength}, goal, sweat}
  // Zone contigue: il limite basso e' il valore arrotondato; l'alto e' il basso della zona dopo meno 1. Nessun valore resta senza zona.
  function contig(T, base, withPct) {
    return T.map(function (z, k) {
      var lo = k === 0 ? 0 : Math.round(z[1] * base);
      var hi = k === T.length - 1 ? null : Math.round(T[k + 1][1] * base) - 1;
      return withPct ? [z[0], lo, hi, z[1], z[2]] : [z[0], lo, hi];
    });
  }
  function compute(i) {
    var out = { warnings: [] };
    var races = [["5K", i.t5k], ["10K", i.t10k], ["HM", i.thm], ["M", i.tm]].filter(function (r) { return r[1] > 0; });
    // RUN
    if (races.length) {
      var vs = races.map(function (r) { return { k: r[0], v: vdotFromRace(D[r[0]], r[1]) }; });
      var best = vs.reduce(function (a, b) { return b.v > a.v ? b : a; });
      var vd = best.v;
      var plausible = vd >= 20 && vd <= 85;
      if (!plausible) out.warnings.push("vdot");
      var eq = {}; Object.keys(D).forEach(function (k) { eq[k] = timeForDistance(vd, D[k]); });
      var fromBestRiegel = riegel(races.filter(function (r) { return r[0] === best.k; })[0][1], D[best.k], D.M);
      out.run = {
        vdot: vd, from: best.k, all: vs, plausible: plausible,
        paces: {
          easyFast: paceAtPct(vd, 0.74), easySlow: paceAtPct(vd, 0.59),
          marathon: eq.M / 42.195, threshold: paceAtPct(vd, 0.88), interval: paceAtPct(vd, 0.98)
        },
        equivalents: eq,
        riegelMarathon: best.k === "M" ? null : fromBestRiegel
      };
    }
    // HR
    if (i.lthr > 0) out.hr = { run: contig(HR_RUN, i.lthr), bike: contig(HR_BIKE, i.lthr) };
    if (i.age >= 14 && i.age <= 90) out.hrmaxEst = tanakaHRmax(i.age);
    if (i.hrmax > 0 && i.lthr > 0 && i.lthr > i.hrmax) out.warnings.push("lthr>hrmax");
    // RIDE
    if (i.ftp > 0) {
      out.ride = {
        ftp: i.ftp, wkg: i.weight > 0 ? i.ftp / i.weight : null,
        zones: contig(PW, i.ftp, true),
        endurance: [0.56 * i.ftp, 0.75 * i.ftp]
      };
    }
    // HYBRID: regola pratica, non uno studio
    var s = i.sports || {}, H = i.hours || 0, Dd = i.days || 0;
    if (H > 0 && Dd > 0) {
      var strengthSessions = s.strength ? (Dd >= 5 ? 2 : 1) : 0;
      var strengthH = strengthSessions * 0.75;
      var endH = Math.max(0, H - strengthH);
      var hard = H < 4 ? 1 : 2;
      var runShare = 0, rideShare = 0;
      var both = s.run && s.bike;
      if (both) {
        if (i.goal === "bike") { runShare = 0.3; rideShare = 0.7; }
        else if (i.goal === "hybrid") { runShare = 0.5; rideShare = 0.5; }
        else { runShare = 0.65; rideShare = 0.35; }
      } else if (s.run) runShare = 1; else if (s.bike) rideShare = 1;
      var enduranceDays = Math.max(1, Dd - strengthSessions + (strengthSessions ? 1 : 0)); // la forza può stare nel giorno di una seduta facile
      var runSessions = runShare ? Math.max(1, Math.round(runShare * Math.min(Dd, 6))) : 0;
      var rideSessions = rideShare ? Math.max(1, Math.round(rideShare * Math.min(Dd, 6))) : 0;
      out.hybrid = {
        runH: endH * runShare, rideH: endH * rideShare, strengthH: strengthH,
        runSessions: runSessions, rideSessions: rideSessions, strengthSessions: strengthSessions,
        hardDays: hard, easyDays: Math.max(0, Dd - hard), easyShare: 0.8,
        enduranceDays: enduranceDays,
        rideLoad: out.ride ? [endH * rideShare * 31, endH * rideShare * 56] : null
      };
    }
    // FUEL
    var dur = i.duration > 0 ? i.duration : (out.run ? out.run.equivalents.M : 0);
    out.fuelDuration = dur;
    if (dur > 0) {
      var h = dur / 3600, c;
      if (h < 1) c = [0, 0]; else if (h <= 2.5) c = [30, 60]; else c = [60, 90];
      var fluid = [400, 800];
      out.fuel = { hours: h, carbs: c, fluid: fluid };
      if (i.weight > 0) out.fuel.preMeal = [i.weight * 1, i.weight * 4];
      if (i.weight > 0 && h > 1.5) out.fuel.load = [i.weight * 10, i.weight * 12];
      if (i.sweat > 0) out.fuel.sodiumLoss = [i.sweat * 5 * 23, i.sweat * 60 * 23]; // 5-60 mmol/L x 23 mg/mmol, per ora
    }
    // RACE: passaggi
    var dist = { m: 42195, hm: 21097.5, "10k": 10000 }[i.goal];
    if (dist) {
      var target = i.target > 0 ? i.target : (out.run ? out.run.equivalents[{ m: "M", hm: "HM", "10k": "10K" }[i.goal]] : 0);
      if (target > 0) {
        out.race = { dist: dist, target: target, fromTarget: i.target > 0 };
        var perKm = target / (dist / 1000);
        out.race.even = splits(dist, perKm, 0);
        out.race.negative = splits(dist, perKm, 0.02);
      }
    }
    return out;
  }
  // Passaggi ogni 5 km (+ arrivo). neg = frazione: prima metà più lenta di neg, seconda più veloce di neg, a parità di tempo totale.
  function splits(dist, perKm, neg) {
    var total = perKm * dist / 1000, half = dist / 2;
    var p1 = perKm * (1 + neg), p2 = (total - p1 * half / 1000) / (half / 1000);
    function tAt(m) { return m <= half ? p1 * m / 1000 : p1 * half / 1000 + p2 * (m - half) / 1000; }
    var marks = [], m = 5000;
    while (m < dist - 1) { marks.push(m); m += 5000; }
    marks.push(dist);
    return { p1: p1, p2: p2, rows: marks.map(function (x) { return [x, tAt(x)]; }) };
  }

  var API = { vdotFromRace: vdotFromRace, timeForDistance: timeForDistance, paceAtPct: paceAtPct, riegel: riegel, tanakaHRmax: tanakaHRmax, compute: compute, splits: splits, parseTime: parseTime, mmss: mmss, hms: hms, velocityAtVo2: velocityAtVo2 };
  if (typeof module !== "undefined" && module.exports) module.exports = API;
  root.WolfEngine = API;
})(typeof window !== "undefined" ? window : globalThis);
