// Wolf Lab — calcolatori. Nessuna dipendenza.
(function () {
  "use strict";
  var EN = document.documentElement.lang === "en";
  var MARATHON = 42.195;
  var HALF = 21.0975;

  function parseTime(str) {
    if (!str) return NaN;
    var parts = String(str).trim().replace(/[.,]/g, ":").split(":").map(Number);
    if (parts.some(isNaN)) return NaN;
    if (parts.length === 2) return parts[0] * 3600 + parts[1] * 60;
    if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];
    return NaN;
  }
  function fmt(sec, forceHours) {
    sec = Math.round(sec);
    var h = Math.floor(sec / 3600), m = Math.floor((sec % 3600) / 60), s = sec % 60;
    var mm = String(m).padStart(2, "0"), ss = String(s).padStart(2, "0");
    return h > 0 || forceHours ? h + ":" + mm + ":" + ss : m + ":" + ss;
  }
  function validTarget(sec) { return sec >= 2 * 3600 && sec <= 7 * 3600; }

  // Banda dei passaggi (home e strumenti)
  function renderBand(el, total) {
    var marks = [5, 10, 15, 20, 25, 30, 35, 40, MARATHON];
    el.classList.add("updating");
    el.innerHTML = marks.map(function (km) {
      var label = km === MARATHON ? "42,2 km" : km === HALF ? (EN ? "Half" : "Mezza") : km + " km";
      if (EN) label = label.replace(",", ".");
      return '<div><span class="km">' + label + '</span><span class="t">' + fmt(total * km / MARATHON, total * km / MARATHON >= 3600) + "</span></div>";
    }).join("");
    requestAnimationFrame(function () { el.classList.remove("updating"); });
  }

  function paceText(total) {
    var perKm = total / MARATHON;
    var perMi = perKm * 1.609344;
    return EN
      ? "Even-pace splits. " + fmt(perMi) + " per mile."
      : "Passaggi a ritmo costante. " + fmt(perMi) + " al miglio.";
  }

  document.querySelectorAll("[data-paceband]").forEach(function (root) {
    var input = root.querySelector("input");
    var band = root.querySelector(".band");
    var foot = root.querySelector(".band-foot");
    var pace = root.querySelector("[data-pace]");
    function update() {
      var total = parseTime(input.value);
      if (!validTarget(total)) {
        foot.textContent = EN ? "Enter a time between 2:00 and 7:00, for example 3:30." : "Scrivi un tempo tra 2:00 e 7:00, per esempio 3:30.";
        return;
      }
      renderBand(band, total);
      if (pace) pace.textContent = fmt(total / MARATHON);
      foot.textContent = paceText(total);
    }
    input.addEventListener("input", update);
    update();
  });

  // Ritmi di allenamento in percentuale del ritmo maratona
  var paceTool = document.getElementById("pace-tool");
  if (paceTool) {
    var pInput = paceTool.querySelector("#target");
    var pOut = paceTool.querySelector("#pace-out");
    var rows = EN
      ? [[0.8, "Long easy runs"], [0.85, "Steady aerobic"], [0.9, "Long run, last part"], [0.95, "Marathon-specific, longer reps"], [1.0, "Marathon pace"], [1.05, "Faster reps / threshold area"], [1.1, "Short reps for speed support"]]
      : [[0.8, "Lunghi tranquilli"], [0.85, "Aerobico continuo"], [0.9, "Lungo, parte finale"], [0.95, "Specifico maratona, prove lunghe"], [1.0, "Ritmo maratona"], [1.05, "Prove più veloci / zona soglia"], [1.1, "Prove brevi di supporto alla velocità"]];
    function updatePace() {
      var total = parseTime(pInput.value);
      if (!validTarget(total)) {
        pOut.innerHTML = '<p class="error">' + (EN ? "Enter a marathon time between 2:00 and 7:00." : "Scrivi un tempo maratona tra 2:00 e 7:00.") + "</p>";
        return;
      }
      var mp = total / MARATHON;
      var html = '<table><thead><tr><th>' + (EN ? "% of marathon speed" : "% velocità maratona") + "</th><th>" + (EN ? "Pace per km" : "Ritmo al km") + "</th><th>" + (EN ? "Typical use" : "Uso tipico") + "</th></tr></thead><tbody>";
      rows.forEach(function (r) {
        html += "<tr><td>" + Math.round(r[0] * 100) + "%</td><td><strong>" + fmt(mp / r[0]) + "</strong></td><td>" + r[1] + "</td></tr>";
      });
      pOut.innerHTML = html + "</tbody></table>";
    }
    pInput.addEventListener("input", updatePace);
    updatePace();
  }

  // Carboidrati in gara
  var carbTool = document.getElementById("carb-tool");
  if (carbTool) {
    var c = function (id) { return carbTool.querySelector("#" + id); };
    var rate = c("rate"), rateVal = c("rate-val"), out = c("carb-out");
    function guidance(hours) {
      if (hours < 1) return EN ? "Under an hour, carbohydrate during the race is not needed; a mouth rinse or a few sips are enough." : "Sotto l'ora non servono carboidrati in gara: bastano un risciacquo o qualche sorso.";
      if (hours <= 2.5) return EN ? "For 1 to 2.5 hours, guidelines suggest 30 to 60 g per hour." : "Tra 1 e 2,5 ore le linee guida indicano 30–60 g all'ora.";
      return EN ? "Beyond 2.5 hours, up to 90 g per hour, using glucose and fructose mixes and only if trained in long runs." : "Oltre 2,5 ore si sale fino a 90 g all'ora, con miscele di glucosio e fruttosio e solo se provato nei lunghi.";
    }
    function updateCarb() {
      var total = parseTime(c("race-time").value);
      var kg = parseFloat(c("weight").value);
      var gel = parseFloat(c("gel").value);
      var g = parseFloat(rate.value);
      rateVal.textContent = g + " g/h";
      if (!(total > 0) || !(kg > 30 && kg < 200) || !(gel > 0)) {
        out.innerHTML = '<p class="error">' + (EN ? "Check race time (h:mm), weight (kg) and grams per gel." : "Controlla tempo di gara (h:mm), peso (kg) e grammi per gel.") + "</p>";
        return;
      }
      var hours = total / 3600;
      // si inizia dopo circa 20 minuti
      var fuelHours = Math.max(0, hours - 1 / 3);
      var grams = Math.round(g * fuelHours);
      var gels = Math.ceil(grams / gel);
      var every = gels > 0 ? Math.round((fuelHours * 60) / gels) : 0;
      var L = function (it, en) { return EN ? en : it; };
      out.innerHTML =
        '<p>' + guidance(hours) + "</p>" +
        '<div class="big-figures">' +
        "<div><strong>" + grams + " g</strong><span>" + L("carboidrati in gara", "carbohydrate in the race") + "</span></div>" +
        "<div><strong>" + gels + "</strong><span>" + L("gel da ", "gels of ") + gel + " g</span></div>" +
        "<div><strong>" + (every ? L("ogni ", "every ") + every + " min" : "—") + "</strong><span>" + L("dopo i primi 20 minuti", "after the first 20 minutes") + "</span></div>" +
        "</div>" +
        "<table><tbody>" +
        "<tr><th>" + L("Carico nei 36–48 h prima", "Loading, 36–48 h before") + "</th><td>" + Math.round(kg * 10) + "–" + Math.round(kg * 12) + L(" g al giorno (10–12 g/kg)", " g per day (10–12 g/kg)") + "</td></tr>" +
        "<tr><th>" + L("Pasto pre-gara, 1–4 h prima", "Pre-race meal, 1–4 h before") + "</th><td>" + Math.round(kg * 1) + "–" + Math.round(kg * 4) + L(" g (1–4 g/kg, meno se manca poco al via)", " g (1–4 g/kg, less the closer to the start)") + "</td></tr>" +
        "</tbody></table>" +
        '<p class="small">' + L("Parte dei grammi può arrivare dalla bevanda ai ristori: in quel caso riduci i gel. Prova tutto nei lunghi prima della gara.", "Some of the grams can come from sports drink at aid stations; if so, use fewer gels. Rehearse everything in long runs first.") + "</p>";
    }
    carbTool.addEventListener("input", updateCarb);
    updateCarb();
  }

})();

// Filtro delle gare per sport
(function () {
  "use strict";
  var group = document.querySelector(".filter");
  var list = document.querySelector("[data-filter-list]");
  if (!group || !list) return;
  group.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    var f = btn.dataset.filter;
    group.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
    list.querySelectorAll("li").forEach(function (li) { li.hidden = f === "major" ? li.dataset.major !== "1" : f !== "all" && li.dataset.sport !== f; });
  });
})();
