// Wolf Engine: interfaccia. Legge il modulo, calcola con WolfEngine, scrive i risultati. Nessun dato lascia il browser.
(function () {
  "use strict";
  var form = document.getElementById("engine-form");
  var out = document.getElementById("engine-out");
  if (!form || !out || !window.WolfEngine) return;
  var E = window.WolfEngine, EN = document.documentElement.lang === "en";
  var L = function (it, en) { return EN ? en : it; };
  var q = function (n) { return form.elements[n]; };
  var num = function (n) { var v = parseFloat(String(q(n).value).replace(",", ".")); return v > 0 ? v : 0; };
  var tim = function (n) { var v = E.parseTime(q(n).value); return v > 0 ? v : 0; };
  var km = function (s) { return E.mmss(s) + "/km"; };
  var w = function (x) { return Math.round(x); };
  var esc = function (s) { return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;"); };

  function table(head, rows) {
    return '<div class="eng-table"><table><thead><tr>' + head.map(function (h) { return "<th>" + h + "</th>"; }).join("") + "</tr></thead><tbody>" +
      rows.map(function (r) { return "<tr>" + r.map(function (c, k) { return k === 0 ? "<th scope=\"row\">" + c + "</th>" : "<td>" + c + "</td>"; }).join("") + "</tr>"; }).join("") + "</tbody></table></div>";
  }
  function block(id, title, body, note) {
    return '<section class="eng-block" id="' + id + '"><h3>' + title + "</h3>" + body + (note ? '<p class="eng-note">' + note + "</p>" : "") + "</section>";
  }
  function empty(msg) { return '<p class="eng-empty">' + msg + "</p>"; }
  function range(a, b, u) { return w(a) + "–" + w(b) + (u ? " " + u : ""); }

  function read() {
    return {
      age: num("age"), weight: num("weight"), ftp: num("ftp"),
      t5k: tim("t5k"), t10k: tim("t10k"), thm: tim("thm"), tm: tim("tm"),
      hrmax: num("hrmax"), lthr: num("lthr"), hours: num("hours"), days: Math.min(7, num("days")),
      sports: { run: q("sport-run").checked, bike: q("sport-bike").checked, strength: q("sport-strength").checked },
      goal: q("goal").value, target: tim("target"), duration: tim("duration"), sweat: num("sweat")
    };
  }

  function render() {
    var i = read(), r = E.compute(i), h = "";
    var anyInput = i.t5k || i.t10k || i.thm || i.tm || i.ftp || i.hours || i.lthr;
    if (!anyInput) { out.innerHTML = empty(L("Inserisci almeno un dato: un tempo di gara, la FTP o le ore a settimana. Il resto compare man mano.", "Enter at least one value: a race time, FTP or weekly hours. The rest appears as you go.")); return; }

    // RUN
    var run = "";
    if (r.run) {
      var p = r.run.paces, e = r.run.equivalents;
      run += '<div class="big-figures"><div><strong>' + r.run.vdot.toFixed(1) + "</strong><span>VDOT (" + L("da ", "from ") + ({ "5K": "5 km", "10K": "10 km", HM: L("mezza", "half"), M: L("maratona", "marathon") })[r.run.from] + ")</span></div>" +
        "<div><strong>" + km(p.threshold) + "</strong><span>" + L("ritmo soglia (stima)", "threshold pace (estimate)") + "</span></div>" +
        "<div><strong>" + E.hms(e.M) + "</strong><span>" + L("maratona equivalente", "equivalent marathon") + "</span></div></div>";
      run += table([L("Allenamento", "Training"), L("Ritmo", "Pace"), L("Uso", "Use")], [
        [L("Facile / lungo", "Easy / long"), km(p.easyFast) + " – " + km(p.easySlow), L("59–74% VO₂max", "59–74% VO₂max")],
        [L("Maratona", "Marathon"), km(p.marathon), L("ritmo gara equivalente", "equivalent race pace")],
        [L("Soglia", "Threshold"), km(p.threshold), L("88% VO₂max", "88% VO₂max")],
        [L("Intervalli", "Intervals"), km(p.interval), L("98% VO₂max", "98% VO₂max")]
      ]);
      run += "<h4>" + L("Prestazioni equivalenti", "Equivalent performances") + "</h4>" + table(["", L("Tempo", "Time")], [["5 km", E.mmss(e["5K"])], ["10 km", E.hms(e["10K"])], [L("Mezza", "Half"), E.hms(e.HM)], [L("Maratona", "Marathon"), E.hms(e.M)]]);
      if (r.run.riegelMarathon) run += '<p class="eng-note">' + L("Controllo con la formula di Riegel (T₂ = T₁ × (D₂/D₁)^1,06): maratona ", "Cross-check with Riegel's formula (T₂ = T₁ × (D₂/D₁)^1.06): marathon ") + E.hms(r.run.riegelMarathon) + L(". Le stime dalle gare corte tendono a essere ottimistiche se il chilometraggio settimanale è basso: considera il tempo più lento come prudente.", ". Estimates from short races tend to be optimistic when weekly mileage is low: treat the slower time as the cautious one.") + "</p>";
      if (r.warnings.indexOf("vdot") >= 0) run += '<p class="eng-warn">' + L("Il VDOT è fuori dall'intervallo 20–85 in cui il modello è sensato: controlla i tempi inseriti.", "VDOT is outside the 20–85 range where the model makes sense: check the times you entered.") + "</p>";
    } else run += empty(L("Serve un tempo di gara (5K, 10K, mezza o maratona) per VDOT e ritmi.", "A race time (5K, 10K, half or marathon) is needed for VDOT and paces."));
    if (r.hr) {
      var f = function (z) { return z[2] == null ? ">" + w(z[1]) : (z[1] ? w(z[1]) + "–" + w(z[2]) : "≤" + w(z[2])); };
      run += "<h4>" + L("Zone cardio dalla soglia (LTHR " + w(i.lthr) + ")", "Heart-rate zones from threshold (LTHR " + w(i.lthr) + ")") + "</h4>" + table(["", L("Corsa (bpm)", "Run (bpm)"), L("Bici (bpm)", "Bike (bpm)")], r.hr.run.map(function (z, k) { return [z[0], f(z), f(r.hr.bike[k])]; }));
    } else {
      run += '<p class="eng-note">' + L("Per le zone cardio serve la frequenza di soglia (LTHR): una prova da 30 minuti da soli, media degli ultimi 20 minuti (Friel).", "Heart-rate zones need your threshold heart rate (LTHR): a solo 30-minute time trial, average of the last 20 minutes (Friel).") + (r.hrmaxEst ? " " + L("Stima della FC max per l'età: ", "Age-based max heart rate estimate: ") + w(r.hrmaxEst) + L(" bpm, con scarto tipico di circa ±10 bpm: non usarla per fissare le zone.", " bpm, typical spread around ±10 bpm: do not use it to set zones.") : "") + "</p>";
    }
    h += block("run", "RUN", run, L("Modello: Daniels e Gilbert. Calcolo entro circa lo 0,2% dalle tabelle stampate di Daniels. Sono punti di partenza, non una prescrizione.", "Model: Daniels and Gilbert. Calculation within about 0.2% of Daniels' printed tables. Starting points, not a prescription."));

    // RIDE
    var ride = "";
    if (r.ride) {
      ride += '<div class="big-figures"><div><strong>' + w(r.ride.ftp) + " W</strong><span>FTP</span></div>" +
        (r.ride.wkg ? "<div><strong>" + r.ride.wkg.toFixed(2) + "</strong><span>W/kg</span></div>" : "") +
        "<div><strong>" + range(r.ride.endurance[0], r.ride.endurance[1], "W") + "</strong><span>" + L("potenza endurance (zona 2)", "endurance power (zone 2)") + "</span></div></div>";
      var names = { "1": L("Recupero attivo", "Active recovery"), "2": "Endurance", "3": "Tempo", "4": L("Soglia", "Threshold"), "5": "VO₂max", "6": L("Capacità anaerobica", "Anaerobic capacity") };
      ride += table([L("Zona", "Zone"), L("Nome", "Name"), "W", "% FTP"], r.ride.zones.map(function (z) {
        var wt = z[2] == null ? ">" + w(z[1]) : (z[1] ? w(z[1]) + "–" + w(z[2]) : "≤" + w(z[2]));
        var pc = z[4] == null ? ">" + Math.round(z[3] * 100) : (z[3] ? Math.round(z[3] * 100) + "–" + Math.round(z[4] * 100) : "<" + Math.round(z[4] * 100));
        return [z[0], names[z[0]], wt, pc];
      }));
    } else ride += empty(L("Serve la FTP (potenza media di 20 minuti × 0,95, oppure test da 30 minuti).", "FTP is needed (20-minute average power × 0.95, or a 30-minute test)."));
    h += block("ride", "RIDE", ride, L("Zone di Coggan (Allen e Coggan, Training and Racing with a Power Meter). Il carico settimanale è indicativo: TSS = ore × IF² × 100.", "Coggan zones (Allen and Coggan, Training and Racing with a Power Meter). Weekly load is indicative: TSS = hours × IF² × 100."));

    // HYBRID
    var hy = "";
    if (r.hybrid) {
      var y = r.hybrid;
      hy += '<div class="big-figures"><div><strong>' + (y.runH ? y.runH.toFixed(1) : "0") + " h</strong><span>" + L("corsa", "run") + "</span></div><div><strong>" + (y.rideH ? y.rideH.toFixed(1) : "0") + " h</strong><span>" + L("bici", "ride") + "</span></div><div><strong>" + (y.strengthH ? y.strengthH.toFixed(1) : "0") + " h</strong><span>" + L("forza", "strength") + "</span></div></div>";
      hy += table([L("Settimana tipo", "Typical week"), ""], [
        [L("Sedute di corsa", "Run sessions"), y.runSessions],
        [L("Sedute in bici", "Rides"), y.rideSessions],
        [L("Sedute di forza", "Strength sessions"), y.strengthSessions],
        [L("Giorni duri", "Hard days"), y.hardDays],
        [L("Giorni facili", "Easy days"), y.easyDays],
        [L("Quota facile del tempo di endurance", "Easy share of endurance time"), "~80%"]
      ]);
      if (y.rideLoad) hy += '<p class="eng-note">' + L("Carico in bici indicativo a ritmo endurance: ", "Indicative cycling load at endurance effort: ") + range(y.rideLoad[0], y.rideLoad[1], "TSS/" + L("settimana", "week")) + "</p>";
      if (i.sports.run && i.sports.bike && i.sports.strength) hy += '<p class="eng-note">' + L("Interferenza forza/endurance: negli studi l'effetto negativo sulla forza è maggiore con più sedute e con la corsa che con la bici (Wilson 2012). Tieni la forza pesante lontana dalle sedute chiave di corsa quando puoi.", "Strength/endurance interference: in studies the negative effect on strength is larger with higher frequency and with running than with cycling (Wilson 2012). Keep heavy strength away from key run sessions when you can.") + "</p>";
    } else hy += empty(L("Servono ore e giorni disponibili e almeno uno sport.", "Available hours and days and at least one sport are needed."));
    h += block("hybrid", "HYBRID", hy, L("Regola pratica Wolf Lab, non il risultato di uno studio. Parte da due punti con prove: la gran parte del tempo facile (Seiler) e la forza 1–2 volte a settimana. Il resto è una proposta da adattare.", "Wolf Lab rule of thumb, not the result of a study. It starts from two points with evidence: most time easy (Seiler) and strength once or twice a week. The rest is a proposal to adapt."));

    // FUEL
    var fu = "";
    if (r.fuel) {
      var F = r.fuel;
      fu += '<div class="big-figures"><div><strong>' + (F.carbs[1] ? F.carbs[0] + "–" + F.carbs[1] : "0") + " g/h</strong><span>" + L("carboidrati", "carbohydrate") + "</span></div><div><strong>" + range(F.fluid[0], F.fluid[1], "ml/h") + "</strong><span>" + L("fluidi (punto di partenza)", "fluids (starting point)") + "</span></div></div>";
      var rows = [[L("Durata considerata", "Duration used"), E.hms(r.fuelDuration)]];
      if (!F.carbs[1]) rows.push([L("Carboidrati", "Carbohydrate"), L("sotto l'ora non servono: basta un risciacquo", "not needed under an hour: a mouth rinse is enough")]);
      if (F.preMeal) rows.push([L("Pasto pre-gara (1–4 h prima)", "Pre-race meal (1–4 h before)"), range(F.preMeal[0], F.preMeal[1], "g")]);
      if (F.load) rows.push([L("Carico 36–48 h prima", "Loading 36–48 h before"), range(F.load[0], F.load[1], L("g/giorno", "g/day"))]);
      rows.push([L("Sodio", "Sodium"), F.sodiumLoss ? L("perdita stimabile ", "possible loss ") + range(F.sodiumLoss[0], F.sodiumLoss[1], "mg/h") + L(" (concentrazione nel sudore 5–60 mmol/L: molto variabile)", " (sweat concentration 5–60 mmol/L: highly variable)") : L("nessun valore orario valido per tutti: misura il tuo sudore (peso prima/dopo) e inseriscilo", "no hourly value fits everyone: measure your sweat (weight before/after) and enter it")]);
      fu += table([L("Voce", "Item"), L("Valore", "Value")], rows);
    } else fu += empty(L("Serve un tempo di gara (o la durata) per la strategia di carboidrati e fluidi.", "A race time (or duration) is needed for carbohydrate and fluid strategy."));
    h += block("fuel", "FUEL", fu, L("Carboidrati: Jeukendrup 2014 e posizione ACSM/AND/DC 2016, oltre 2,5 h fino a 90 g/h solo con miscele glucosio e fruttosio e allenamento intestinale. Fluidi: ACSM 2007, 0,4–0,8 L/h in maratona, da adattare al sudore. Prove tutto nei lunghi.", "Carbohydrate: Jeukendrup 2014 and the 2016 ACSM/AND/DC position, beyond 2.5 h up to 90 g/h only with glucose and fructose blends and gut training. Fluids: ACSM 2007, 0.4–0.8 L/h in a marathon, adapt to your sweat. Try everything in long sessions."));

    // RACE
    var rc = "";
    if (r.race) {
      var R = r.race, label = { "42195": L("Maratona", "Marathon"), "21097.5": L("Mezza", "Half"), "10000": "10K" }[String(R.dist)];
      rc += '<div class="big-figures"><div><strong>' + E.hms(R.target) + "</strong><span>" + (R.fromTarget ? L("obiettivo inserito", "goal entered") : L("proiezione dal VDOT", "projection from VDOT")) + "</span></div><div><strong>" + km(R.target / (R.dist / 1000)) + "</strong><span>" + L("ritmo medio", "average pace") + "</span></div></div>";
      var neg = R.negative, evn = R.even;
      rc += table([L(label + " passaggi", label + " splits"), L("Ritmo costante", "Even pace"), L("Negative split 2%", "Negative split 2%")], evn.rows.map(function (row, k) {
        var lab = row[0] === R.dist ? L("Arrivo", "Finish") : (row[0] / 1000) + " km";
        return [lab, E.hms(row[1]), E.hms(neg.rows[k][1])];
      }));
      rc += '<p class="eng-note">' + L("Negative split 2%: prima metà a " + km(neg.p1) + ", seconda a " + km(neg.p2) + ", stesso tempo finale.", "Negative split 2%: first half at " + km(neg.p1) + ", second at " + km(neg.p2) + ", same finish time.") + "</p>";
      if (r.fuel && r.fuel.carbs[1]) {
        var gel = 25, g = (r.fuel.carbs[0] + r.fuel.carbs[1]) / 2, every = Math.max(10, Math.round(gel / g * 60)), t = [], s = 20;
        while (s < R.target / 60 - 5) { t.push(s); s += every; }
        rc += "<h4>" + L("Tempi di assunzione (gel da " + gel + " g, " + w(g) + " g/h)", "Intake timeline (" + gel + " g gels, " + w(g) + " g/h)") + "</h4><p class=\"eng-timeline\">" + t.map(function (m) { return "<span>" + m + "′</span>"; }).join("") + "</p><p class=\"eng-note\">" + L("Dal minuto 20, un gel ogni " + every + " minuti. Se bevi anche bevanda con carboidrati, riduci i gel.", "From minute 20, one gel every " + every + " minutes. If you also drink a carbohydrate drink, cut the gels.") + "</p>";
      }
    } else rc += empty(L("Scegli come obiettivo maratona, mezza o 10K per passaggi e proiezione.", "Pick marathon, half or 10K as goal for splits and a projection."));
    h += block("race", "RACE", rc, L("Il tempo previsto da VDOT presume allenamento specifico per la distanza. Meteo, percorso e giornata possono cambiarlo di molto.", "The VDOT-predicted time assumes distance-specific training. Weather, course and the day can change it a lot."));

    out.innerHTML = h;
  }
  form.addEventListener("input", render);
  form.addEventListener("change", render);
  form.addEventListener("submit", function (e) { e.preventDefault(); render(); });
  // My Wolf: salvataggio solo locale, solo su azione esplicita.
  var KEY = "wolf-my-v1", st = document.getElementById("my-status");
  var say = function (t) { if (st) st.textContent = t; };
  function snapshot() {
    var d = {};
    Array.prototype.forEach.call(form.elements, function (e) { if (!e.name) return; d[e.name] = e.type === "checkbox" ? e.checked : e.value; });
    return d;
  }
  function restore(d) {
    Object.keys(d).forEach(function (k) { var e = form.elements[k]; if (!e) return; if (e.type === "checkbox") e.checked = !!d[k]; else e.value = d[k]; });
  }
  try {
    var saved = localStorage.getItem(KEY);
    if (saved) { var o = JSON.parse(saved); restore(o.v || {}); say(L("Dati caricati da questo dispositivo (salvati il ", "Loaded from this device (saved on ") + new Date(o.t).toLocaleDateString(EN ? "en-GB" : "it-IT") + ").");}
  } catch (e) {}
  var sv = document.getElementById("my-save"), dl = document.getElementById("my-del");
  if (sv) sv.addEventListener("click", function () {
    try { localStorage.setItem(KEY, JSON.stringify({ t: Date.now(), v: snapshot() })); say(L("Salvato solo su questo dispositivo.", "Saved on this device only.")); }
    catch (e) { say(L("Il browser non permette il salvataggio.", "Your browser does not allow saving.")); }
  });
  if (dl) dl.addEventListener("click", function () {
    try { localStorage.removeItem(KEY); say(L("Dati salvati cancellati.", "Saved data deleted.")); } catch (e) { say(L("Impossibile cancellare.", "Could not delete.")); }
  });
  render();
})();
