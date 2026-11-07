import "./guard.mjs";
// Wolf Lab dedicated tool landing pages (SEO entry points for existing tools).
// Run after build.mjs (needs regenerated index.html as shell template). Static HTML, no dependencies.
import fs from 'node:fs';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..');
const esc=s=>String(s).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const SITE='https://wolflabsystem.com';

const PAGES=[
{
 slug:{it:'convertitore-passo-corsa',en:'pace-converter'},
 title:{it:'Convertitore passo corsa: min/km, km/h e min/miglio',en:'Running pace converter: min/km, km/h and min/mile'},
 desc:{it:'Converti il passo di corsa tra min/km, km/h e min/miglio. Aritmetica esatta, esempi pronti e riferimenti alle guide WOLFLAB. Gratis, i dati restano sul tuo dispositivo.',
       en:'Convert running pace between min/km, km/h and min/mile. Exact arithmetic, ready examples and links to WOLFLAB guides. Free, your data stays on your device.'},
 h1:{it:'Convertitore passo corsa',en:'Running pace converter'},
 lede:{it:'Da min/km a km/h e min/miglio, e viceversa. Conversioni puramente aritmetiche, senza stime sulla tua forma: il risultato è solo la stessa velocità scritta in un\'altra unità.',
       en:'From min/km to km/h and min/mile, and back. Pure arithmetic, no fitness estimates: the result is just the same speed written in another unit.'},
 crumb:{it:'Convertitore passo',en:'Pace converter'},
 tool:'pace'
},
{
 slug:{it:'previsione-tempo-gara',en:'race-time-predictor'},
 title:{it:'Previsione tempo di gara con la formula di Riegel: come funziona e i suoi limiti',en:'Race time prediction with the Riegel formula: how it works and its limits'},
 desc:{it:'Stima il tempo su 5 km, 10 km, mezza o maratona da una gara recente con la formula di Riegel (1981). Metodo, costante 1,06 e limiti dichiarati. Gratis, i dati restano sul tuo dispositivo.',
       en:'Estimate your 5K, 10K, half or marathon time from a recent race with the Riegel formula (1981). Method, 1.06 constant and stated limits. Free, your data stays on your device.'},
 h1:{it:'Previsione tempo di gara',en:'Race time prediction'},
 lede:{it:'La formula di Riegel proietta una prestazione recente su un\'altra distanza. È una stima statistica con limiti dichiarati, non una promessa né un obiettivo assegnato.',
       en:'The Riegel formula projects a recent performance onto another distance. It is a statistical estimate with stated limits, not a promise or an assigned goal.'},
 crumb:{it:'Previsione tempo gara',en:'Race time predictor'},
 tool:'riegel'
}
];

const PACE_TOOL={
 it:`<div class="tool"><div class="fields">
<div class="field"><label for="cv-pace">Passo (min/km, es. 4:30)</label><input id="cv-pace" value="4:30" inputmode="numeric" autocomplete="off"></div>
<div class="field"><label for="cv-speed">oppure velocità (km/h)</label><input id="cv-speed" type="number" step="0.1" min="1" max="40" placeholder="13,3" inputmode="decimal"></div>
</div>
<div class="results" id="cv-out" aria-live="polite"></div></div>`,
 en:`<div class="tool"><div class="fields">
<div class="field"><label for="cv-pace">Pace (min/km, e.g. 7:15)</label><input id="cv-pace" value="7:15" inputmode="numeric" autocomplete="off"></div>
<div class="field"><label for="cv-speed">or speed (km/h)</label><input id="cv-speed" type="number" step="0.1" min="1" max="40" placeholder="8.3" inputmode="decimal"></div>
</div>
<div class="results" id="cv-out" aria-live="polite"></div></div>`};

const RIEGEL_TOOL={
 it:`<div class="tool"><div class="fields">
<div class="field"><label for="rg-dist">Distanza della gara nota (km)</label><input id="rg-dist" type="number" step="0.1" min="1" max="100" value="10" inputmode="decimal"></div>
<div class="field"><label for="rg-time">Tempo su quella distanza (h:mm:ss o mm:ss)</label><input id="rg-time" value="45:00" inputmode="numeric" autocomplete="off"></div>
<div class="field"><label for="rg-target">Distanza da stimare (km)</label><input id="rg-target" type="number" step="0.1" min="1" max="100" value="21.0975" inputmode="decimal"></div>
</div>
<div class="results" id="rg-out" aria-live="polite"></div></div>`,
 en:`<div class="tool"><div class="fields">
<div class="field"><label for="rg-dist">Known race distance (km)</label><input id="rg-dist" type="number" step="0.1" min="1" max="100" value="10" inputmode="decimal"></div>
<div class="field"><label for="rg-time">Time on that distance (h:mm:ss or mm:ss)</label><input id="rg-time" value="45:00" inputmode="numeric" autocomplete="off"></div>
<div class="field"><label for="rg-target">Distance to estimate (km)</label><input id="rg-target" type="number" step="0.1" min="1" max="100" value="21.0975" inputmode="decimal"></div>
</div>
<div class="results" id="rg-out" aria-live="polite"></div></div>`};

const INLINE_JS=`<script>(function(){
function parseT(s){s=String(s||'').trim();var p=s.split(':').map(Number);if(p.some(isNaN)||!p.length)return null;var sec=0;for(var i=0;i<p.length;i++)sec=sec*60+p[i];return sec>0?sec:null}
function fmtPace(secKm){var m=Math.floor(secKm/60),s=Math.round(secKm%60);if(s===60){m++;s=0}return m+':'+String(s).padStart(2,'0')}
function fmtTime(sec){var h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=Math.round(sec%60);if(s===60){m++;s=0}if(m===60){h++;m=0}return (h?h+':':'')+String(m).padStart(h?2:1,'0')+':'+String(s).padStart(2,'0')}
var MI=1.609344;
var cp=document.getElementById('cv-pace'),cs=document.getElementById('cv-speed'),co=document.getElementById('cv-out');
function conv(from){var kmh=null,secKm=null;
 if(from==='pace'){var t=parseT(cp.value);if(!t)return;secKm=t;kmh=3600/t;cs.value=kmh.toFixed(1)}
 else{var v=parseFloat(String(cs.value).replace(',','.'));if(!v||v<=0)return;kmh=v;secKm=3600/v;cp.value=fmtPace(secKm)}
 var secMi=secKm*MI;
 co.innerHTML='<p><b>'+fmtPace(secKm)+' /km</b> = '+kmh.toFixed(2)+' km/h = '+fmtPace(secMi)+' /mi</p>'}
if(cp&&cs&&co){cp.addEventListener('input',function(){conv('pace')});cs.addEventListener('input',function(){conv('speed')});conv('pace')}
var rd=document.getElementById('rg-dist'),rt=document.getElementById('rg-time'),rg=document.getElementById('rg-target'),ro=document.getElementById('rg-out');
function pred(){var d1=parseFloat(String(rd.value).replace(',','.')),t=parseT(rt.value),d2=parseFloat(String(rg.value).replace(',','.'));
 if(!d1||!t||!d2||d1<=0||d2<=0)return;var est=t*Math.pow(d2/d1,1.06);
 ro.innerHTML='<p><b>'+fmtTime(est)+'</b> '+ro.dataset.label+'</p>'}
if(rd&&rt&&rg&&ro){[rd,rt,rg].forEach(function(el){el.addEventListener('input',pred)});pred()}
})();</script>`;

function body(p,lang){
 const it=lang==='it', alt=it?'en':'it';
 const base=it?'/strumenti/':'/en/tools/';
 const altBase=it?'/en/tools/':'/strumenti/';
 const url=SITE+base+p.slug[lang]+'/', altUrl=SITE+altBase+p.slug[alt]+'/';
 const toolHtml=(p.tool==='pace'?PACE_TOOL[lang]:RIEGEL_TOOL[lang]);
 const explain=p.tool==='pace'?explainPace(lang):explainRiegel(lang);
 const roLabel=it?'stimati su '+'' :'estimated for ';
 const tool=toolHtml.replace('id="rg-out"','id="rg-out" data-label="'+(it?'è il tempo stimato (formula di Riegel, esponente 1,06)':'is the estimated time (Riegel formula, 1.06 exponent)')+'"');
 return {url,altUrl,html:`<article class="page library"><header class="art-hero"><div class="wrap"><p class="kicker">${it?'STRUMENTI':'TOOLS'}</p><h1>${esc(p.h1[lang])}</h1><p class="lede">${esc(p.lede[lang])}</p></div></header>
<div class="wrap library-body">
<section class="library-section">${tool}</section>
${explain}
<section class="library-section"><h2>${it?'Strumenti collegati':'Related tools'}</h2>
<ul class="library-sources">
<li><a href="${it?'/engine':'/en/engine'}">Wolf Engine</a> - ${it?'ritmi di allenamento, zone, fuel e tempo previsto in un unico posto':'training paces, zones, fuel and predicted time in one place'}</li>
<li><a href="${it?'/allenamento/#calcolatori':'/en/training/#splits'}">${it?'Tutti i calcolatori WOLFLAB':'All WOLFLAB calculators'}</a></li>
<li><a href="${it?'/articoli/preparare-maratona/':'/en/articles/marathon-training-guide/'}">${it?'Guida completa alla preparazione della maratona':'Complete marathon training guide'}</a></li>
</ul></section>
</div></article>`,
 jsonld:{"@context":"https://schema.org","@type":"BreadcrumbList","itemListElement":[
  {"@type":"ListItem","position":1,"name":it?'Home':'Home',"item":SITE+(it?'/':'/en/')},
  {"@type":"ListItem","position":2,"name":it?'Strumenti':'Tools',"item":SITE+(it?'/allenamento/':'/en/training/')},
  {"@type":"ListItem","position":3,"name":p.crumb[lang],"item":url}]},
 headExtra:''};
}

function explainPace(lang){
 const it=lang==='it';
 return `<section class="library-section"><h2>${it?'Come si converte il passo':'How pace conversion works'}</h2>
<p>${it?'Sono conversioni aritmetiche esatte, non stime: km/h = 60 diviso il passo in minuti decimali; il passo in min/miglio è il passo in min/km moltiplicato per 1,609344 (la lunghezza esatta di un miglio in chilometri).':'These are exact arithmetic conversions, not estimates: km/h = 60 divided by pace in decimal minutes; pace in min/mile is pace in min/km multiplied by 1.609344 (the exact length of a mile in kilometres).'}</p>
<h3>${it?'Esempi pronti':'Ready examples'}</h3>
<div class="results"><p>4:00 /km = 15,00 km/h = 6:26 /mi<br>4:30 /km = 13,33 km/h = 7:15 /mi<br>5:00 /km = 12,00 km/h = 8:03 /mi<br>5:30 /km = 10,91 km/h = 8:51 /mi<br>6:00 /km = 10,00 km/h = 9:39 /mi</p></div>
<p>${it?'Per passare dal passo ai ritmi di allenamento e al tempo previsto sulle distanze di gara, usa il':'To go from pace to training paces and predicted times across race distances, use the'} <a href="${it?'/engine':'/en/engine'}">Wolf Engine</a>.</p>
</section>`;
}

function explainRiegel(lang){
 const it=lang==='it';
 return `<section class="library-section"><h2>${it?'Il metodo':'The method'}</h2>
<p>${it?'La formula pubblicata da Peter Riegel nel 1981 è: tempo2 = tempo1 × (distanza2 / distanza1)^1,06. La costante 1,06 (detta fattore di fatica) tiene conto del fatto che il ritmo cala all\'aumentare della distanza. È la stessa convenzione usata dal Wolf Engine.':'The formula published by Peter Riegel in 1981 is: time2 = time1 × (distance2 / distance1)^1.06. The 1.06 constant (the fatigue factor) captures how pace slows as distance grows. It is the same convention used by Wolf Engine.'}</p>
<h2>${it?'I limiti, dichiarati':'The limits, stated'}</h2>
<p>${it?'La stima assume che la preparazione sia equivalente tra le due distanze: se la gara nota è una 5 km e il traguardo una maratona, il risultato vale solo con un allenamento specifico per la maratona. Assume inoltre percorso, meteo e condizioni simili. Più le distanze sono lontane tra loro, più la stima è incerta. Non è una promessa di prestazione né un obiettivo assegnato: è un riferimento per ragionare sui ritmi, da incrociare con sensazioni e lavoro svolto.':'The estimate assumes equivalent preparation across the two distances: if the known race is a 5K and the target a marathon, the result only holds with marathon-specific training. It also assumes a similar course, weather and conditions. The farther apart the distances, the less certain the estimate. It is not a promise of performance nor an assigned goal: it is a reference for reasoning about paces, to be cross-checked with how you feel and the work done.'}</p>
<ul class="library-sources"><li><a href="https://www.semanticscholar.org/paper/Athletic-records-and-human-endurance-Riegel/2e29334d91ed8af4747ac08d37d1dccac5" rel="noopener">Riegel, P.S. (1981): Athletic records and human endurance, American Scientist 69(3)</a></li></ul>
</section>`;
}

for(const p of PAGES){
 for(const lang of ['it','en']){
  const it=lang==='it';
  const template=fs.readFileSync(path.join(root,it?'index.html':'en/index.html'),'utf8');
  const b=body(p,lang);
  let html=template.replace(/<title>[\s\S]*?<\/title>/,`<title>${esc(p.title[lang])} - Wolf Lab</title>`)
   .replace(/(<meta (?:name="description"|property="og:description") content=")[^"]*/g,'$1'+esc(p.desc[lang]))
   .replace(/(<meta property="og:title" content=")[^"]*/,'$1'+esc(p.title[lang]+' - Wolf Lab'))
   .replace(/(<link rel="canonical" href=")[^"]+/,'$1'+b.url)
   .replace(/(<meta property="og:url" content=")[^"]+/,'$1'+b.url)
   .replace(/(<link rel="alternate" hreflang="it" href=")[^"]+/,'$1'+SITE+'/strumenti/'+p.slug.it+'/')
   .replace(/(<link rel="alternate" hreflang="en" href=")[^"]+/,'$1'+SITE+'/en/tools/'+p.slug.en+'/')
   .replace(/(<a class="lang" href=")[^"]+/,'$1'+b.altUrl);
  html=html.replace(/<main id="main">[\s\S]*?<\/main>/,`<main id="main">${b.html}</main>`);
  html=html.replace('</head>',`<link rel="stylesheet" href="/assets/article.css"><link rel="stylesheet" href="/assets/library.css"><script type="application/ld+json">${JSON.stringify(b.jsonld)}</script></head>`);
  html=html.replace('</body>',INLINE_JS+'</body>');
  const out=path.join(root,it?'/strumenti/':'/en/tools/',p.slug[lang]);fs.mkdirSync(out,{recursive:true});
  fs.writeFileSync(path.join(out,'index.html'),html);
 }
 // sitemap entries (apex)
 const sm=path.join(root,'sitemap.xml');let s=fs.readFileSync(sm,'utf8');
 for(const u of ['/strumenti/'+p.slug.it+'/','/en/tools/'+p.slug.en+'/'])
  if(!s.includes(SITE+u+'</loc>'))s=s.replace('</urlset>',`<url><loc>${SITE}${u}</loc></url>\n</urlset>`);
 fs.writeFileSync(sm,s);
}
console.log('tool pages: 4 written, sitemap updated');
