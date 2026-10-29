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
    var marks = [5, 10, 15, 20, HALF, 25, 30, 35, 40, MARATHON];
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
        band.innerHTML = "";
        if (pace) pace.textContent = "";
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
      return EN ? "Beyond 2.5 hours, about 60 g per hour is the usual range. Up to 90 g per hour is for much longer efforts, with glucose and fructose mixes, and only if trained in long runs." : "Oltre 2,5 ore il riferimento abituale è circa 60 g all'ora. Fino a 90 g all'ora è per sforzi molto più lunghi, con miscele di glucosio e fruttosio e solo se provato nei lunghi.";
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
      if (hours < 1) {
        out.innerHTML = "<p>" + guidance(hours) + "</p>";
        return;
      }
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
        (hours > 1.5 ? "<tr><th>" + L("Carico nei 36–48 h prima", "Loading, 36–48 h before") + "</th><td>" + Math.round(kg * 10) + "–" + Math.round(kg * 12) + L(" g al giorno (10–12 g/kg), solo oltre 90 minuti di gara", " g per day (10–12 g/kg), only for events over 90 minutes") + "</td></tr>" : "") +
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
  function apply(f, btn) {
    group.querySelectorAll("button").forEach(function (b) { b.setAttribute("aria-pressed", String(b === btn)); });
    list.querySelectorAll("li").forEach(function (li) { li.hidden = f === "major" ? li.dataset.major !== "1" : f === "run" ? li.dataset.sport === "bike" : f !== "all" && li.dataset.sport !== f; });
  }
  group.addEventListener("click", function (e) {
    var btn = e.target.closest("button[data-filter]");
    if (!btn) return;
    apply(btn.dataset.filter, btn);
  });
  var q = new URLSearchParams(location.search).get("f");
  if (q === "run") apply("run", null);
  else if (q) { var qb = group.querySelector('button[data-filter="' + q.replace(/[^a-z]/g, "") + '"]'); if (qb) apply(q, qb); }
})();


// One training entry across older generated pages as well as the new hub.
(function(){var en=document.documentElement.lang==='en',nav=document.querySelector('.site-head .nav');if(!nav)return;var P=en?'/en':'';var NV=en?[['RUN','/en/run'],['RIDE','/en/ride'],['SWIM','/en/swim'],['STRENGTH','/en/strength/'],['ARTICLES','/en/articles/'],['WOLF ENGINE','/en/engine']]:[['RUN','/run'],['RIDE','/ride'],['SWIM','/swim'],['STRENGTH','/strength/'],['ARTICOLI','/articoli/'],['WOLF ENGINE','/engine']];var p0=location.pathname.replace(/\.html$/,'').replace(/\/$/,'')||'/';nav.innerHTML=NV.map(function(i){var key=i[1].replace(/\/$/,'');var on=p0===key||((i[0]==='ARTICLES'||i[0]==='ARTICOLI')&&/^\/(en\/articles|articoli)(\/|$)/.test(p0))||(i[0]==='STRENGTH'&&/^\/(en\/)?(train\/)?strength(\/|$)/.test(p0));return '<a href="'+i[1]+'"'+(on?' aria-current="page"':'')+'>'+i[0]+'</a>';}).join('');if(location.hash){var el=document.getElementById(location.hash.slice(1));if(el){if(el.tagName==='DETAILS')el.open=true;var d=el.closest('details')||el.querySelector('details');if(d)d.open=true;el.scrollIntoView();}}document.addEventListener('click',function(e){var a=e.target.closest('a[href^="#"]');if(!a)return;var el=document.getElementById(a.hash.slice(1));if(el){if(el.tagName==='DETAILS')el.open=true;var d=el.closest('details')||el.querySelector('details');if(d)d.open=true;}});})();
// Remove the three text blocks requested for deletion, including their direct English counterparts.
(function(){
  "use strict";
  var exact=new Set([
    "Da leggere, poi da provare.",
    "Read it. Then try it.",
    "Corsa, bici, nutrizione e allenamento per amatori. Le informazioni non sostituiscono il parere di un medico.",
    "Running, cycling, nutrition and training for amateurs. This information doesn't replace advice from a doctor.",
    "Primo nucleo verificato, non tutte le metodiche. Corsa, ciclismo e pesi si possono consultare separatamente. Le schede spiegano le prove e i limiti, non sostituiscono un piano individuale.",
    "A checked starting collection, not every method. Running, cycling and strength can be explored separately. These summaries explain evidence and limits, not individual prescriptions."
  ]);
  document.querySelectorAll("h2, p").forEach(function(el){if(exact.has(el.textContent.trim()))el.remove();});
})();

// Wolf v3: tema chiaro/scuro (solo pagine nuove), contatori, filtri esplora, barra Wolf negli articoli.
(function(){
  "use strict";
  var en=document.documentElement.lang==='en',root=document.documentElement;
  if(!root.classList.contains('wolf2')){root.classList.add('wolf2');try{if(localStorage.getItem('wolf-theme')==='dark')root.setAttribute('data-theme','dark');}catch(e){}}
  if(root.classList.contains('wolf2')){
    var head=document.querySelector('.site-head .wrap'),lang=document.querySelector('.site-head .lang');
    if(head){var b=document.createElement('button');b.type='button';b.className='theme-toggle';b.setAttribute('aria-label',en?'Toggle dark mode':'Attiva/disattiva modalità scura');
      var set=function(){b.textContent=root.getAttribute('data-theme')==='dark'?(en?'Light':'Chiaro'):(en?'Dark':'Scuro');var tl=b.textContent.toLowerCase();b.setAttribute('aria-label',b.textContent+(en?', switch to '+tl+' theme':', attiva tema '+tl));};set();
      b.addEventListener('click',function(){var d=root.getAttribute('data-theme')==='dark';if(d)root.removeAttribute('data-theme');else root.setAttribute('data-theme','dark');try{localStorage.setItem('wolf-theme',d?'light':'dark');}catch(e){}set();});
      head.appendChild(b);}
  }
  // Filtri per gare e training camp, dai dati con fonte in /assets/explore-data.json
  var raceList=document.querySelector('.race-list'),tripList=document.querySelector('.trip-list');
  if(raceList||tripList){fetch('/assets/explore-data.json').then(function(r){return r.json();}).then(function(D){
    var list=raceList||tripList,meta=raceList?D.races:D.trips,items=[].slice.call(list.querySelectorAll('li'));
    items.forEach(function(li){var a=li.querySelector('a');var m=a&&meta[new URL(a.href).pathname];li._m=m;});
    var box=document.createElement('div');box.className='explore';
    function sel(id,label,opts){var l=document.createElement('label');l.textContent=label;var s=document.createElement('select');s.id=id;opts.forEach(function(o){var op=document.createElement('option');op.value=o[0];op.textContent=o[1];s.appendChild(op);});l.appendChild(s);return l;}
    var row=document.createElement('div');row.className='row';var apply;
    if(raceList){
      var C={};items.forEach(function(li){if(li._m)C[li._m.country]=1;});
      var mn=en?['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec']:['gen','feb','mar','apr','mag','giu','lug','ago','set','ott','nov','dic'];
      row.appendChild(sel('x-country',en?'Country':'Paese',[['',en?'All':'Tutti']].concat(Object.keys(C).sort().map(function(c){return [c,c];}))));
      row.appendChild(sel('x-month',en?'Month':'Mese',[['',en?'All':'Tutti']].concat(mn.map(function(m,i){return [String(i+1),m];}))));
      row.appendChild(sel('x-entry',en?'Entry':'Iscrizione',[['',en?'All':'Tutte'],['lottery',en?'Lottery / ballot':'Lotteria / sorteggio'],['qualifying',en?'Qualifying time':'Tempo di qualifica'],['open',en?'Open / standard':'Standard'],['soldout',en?'Sold out':'Esaurita']]));
      row.appendChild(sel('x-course',en?'Course data':'Dati percorso',[['',en?'All':'Tutti'],['1',en?'With official source':'Con fonte ufficiale'],['0',en?'Not yet verified':'Non ancora verificati']]));
      apply=function(){var c=x('x-country'),m=x('x-month'),e=x('x-entry'),k=x('x-course'),n=0;items.forEach(function(li){var d=li._m,ok=!d||((!c||d.country===c)&&(!m||String(d.month)===m)&&(!e||d.entry===e)&&(!k||String(d.course)===k));li.dataset.xhide=ok?'':'1';n+=ok?1:0;});sync();};
    }else{
      row.appendChild(sel('x-sport',en?'Focus':'Focus',[['',en?'All':'Tutti'],['bike',en?'Cycling':'Bici'],['run',en?'Running':'Corsa'],['altitude',en?'Altitude':'Altura']]));
      apply=function(){var s=x('x-sport'),n=0;items.forEach(function(li){var d=li._m,ok=!d||!s||d.sports.indexOf(s)>=0;li.dataset.xhide=ok?'':'1';n+=ok?1:0;});sync();};
    }
    function x(id){return document.getElementById(id).value;}
    function sync(){items.forEach(function(li){li.hidden=li.dataset.xhide==='1'||li.dataset.fhide==='1';});}
    items.forEach(function(li){li.dataset.fhide=li.hidden?'1':'';});box.appendChild(row);list.parentNode.insertBefore(box,list);box.addEventListener('change',apply);apply();
    var f=document.querySelector('.filter');if(f)f.addEventListener('click',function(){setTimeout(function(){items.forEach(function(li){li.dataset.fhide=li.hidden&&li.dataset.xhide!=='1'?'1':'';});sync();},0);});
  }).catch(function(){});}
  // Barra Wolf negli articoli: livello di prova, aggiornamento, lettura (dati già presenti nella pagina)
  var side=document.querySelector('.art-side'),badge=document.querySelector('.art-hero .evidence, .art-body .evidence, .evidence'),tm=document.querySelector('.art-hero time');
  if(side&&tm&&!side.querySelector('.wolf-side')){var lv=badge?badge.textContent.trim():null,mins=(document.querySelector('.art-hero .article-meta')||{textContent:''}).textContent.match(/(\d+)\s*(min)/);
    var w=document.createElement('div');w.className='wolf-side';w.innerHTML='<h2>WOLF LAB</h2><dl>'+(lv?'<div><dt>'+(en?'Evidence':'Prove')+'</dt><dd>'+lv+'</dd></div>':'')+'<div><dt>'+(en?'Published':'Pubblicato')+'</dt><dd>'+tm.textContent.replace(/^(Published|Pubblicato il)\s*/i,'')+'</dd></div>'+(mins?'<div><dt>'+(en?'Read':'Lettura')+'</dt><dd>'+mins[1]+' min</dd></div>':'')+'</dl>';side.insertBefore(w,side.firstChild);}
})();
