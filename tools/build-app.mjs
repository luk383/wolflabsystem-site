// Builds /app/ and /en/app/ (Android alpha download). Reads the shell from gear.html / en/gear.html.
import fs from 'node:fs';
const SHA='e5a3c80e07435f7206e44a4317515da83081efac7e3a3348eb19cfad158288dd';
const CERT='1ed886753b6302f37a933d81d8af90beb13ddd22b6c81c6936a1ce2ffc9a2665';
const FILE='WOLFLAB-0.2.0-alpha-release.apk', BYTES=3267986;
const apk='/assets/app/'+FILE;
const T={it:{
 shell:'gear.html', path:'/app/', alt:'/en/app/', lang:'it',
 title:'App Android alpha - Wolf Lab',
 desc:'WOLFLAB per Android, versione alpha 0.2.0: download dell\'APK, checksum, cosa funziona e cosa manca.',
 kicker:'APP ANDROID · ALPHA', h1:'WOLFLAB per Android.',
 lede:'Versione alpha 0.2.0: calcolatori base e guide offline di nuoto e pesi, dati solo sul telefono. È una prova, non un prodotto finito.',
 btn:'Scarica APK · 3,3 MB', btnNote:'Alpha non pubblicata su Google Play. Android mostrerà un avviso perché l\'app arriva fuori dallo store.',
 state:'Stato', stateL:['Versione alpha: funzioni limitate, possibili errori.','TRAIN è in preparazione: tre percorsi proposti, nessun programma operativo e nessuna seduta prescritta.','Questo APK firmato non è ancora stato provato su un telefono.','Non è su Google Play. Gli aggiornamenti sono manuali.'],
 has:'Cosa c\'è', hasL:['PACE, FTP, FUEL, RACE e ZONES: cinque calcolatori base, con metodo e limiti dichiarati in app.','Guide offline di nuoto e pesi, con ritmo per 100 m e parziali (solo aritmetica, non CSS né zone) e calcolo del carico esterno (aritmetica, non una prescrizione). Preferiti salvati sul telefono.','Nessun programma o scheda settimanale e nessun registro di serie e ripetizioni.','MyWolf: preferenze salvate sul telefono solo se scegli di salvarle, cancellabili.','Nessun account, nessuna telemetria, nessun GPS, nessun collegamento Garmin o Strava, nessuna chat AI.'],
 data:'Dati e privacy', dataP:'L\'app non invia dati a server WOLFLAB. Nel pacchetto la pagina web interna ha una regola di sicurezza che vieta le connessioni di rete (connect-src none). Android elenca il permesso INTERNET nel manifesto: è presente nel pacchetto, ma il codice dell\'app non fa richieste di rete. I link esterni si aprono solo su tua azione, nel browser.',
 inst:'Come installare', instL:['Scarica il file dal pulsante sopra.','Apri il file. Se Android lo chiede, consenti al browser o al gestore file di installare app sconosciute, solo per questa installazione.','Se vuoi, controlla prima il checksum SHA-256 qui sotto.','Se hai la 0.1.0: stessa app, stessa firma, versione più alta (versionCode 2). L\'aggiornamento sul posto è previsto ma non è stato verificato su un telefono; se vuoi tenere i dati, annotali prima. Non c\'è aggiornamento automatico.'],
 debug:'Se hai installato la versione di prova (debug), ha una firma diversa: questo APK non la aggiorna. Annota i dati che vuoi tenere e disinstalla prima quella: i salvataggi locali si perdono.',
 tech:'Dettagli del file', rows:[['Versione','0.2.0-alpha (versionCode 2)'],['Pacchetto','com.wolflabsystem.app'],['Android','7 o successivo'],['Dimensione',BYTES.toLocaleString('it-IT')+' byte'],['SHA-256 del file',SHA],['SHA-256 del certificato di firma',CERT]],
 how:'Per controllare il file: sha256sum '+FILE+' (Linux/macOS) oppure Get-FileHash (Windows). Deve coincidere con il valore sopra.',
 back:'Torna a TRAIN', backH:'/train'},
 en:{
 shell:'en/gear.html', path:'/en/app/', alt:'/app/', lang:'en',
 title:'Android app alpha - Wolf Lab',
 desc:'WOLFLAB for Android, alpha 0.2.0: APK download, checksum, what works and what is missing.',
 kicker:'ANDROID APP · ALPHA', h1:'WOLFLAB for Android.',
 lede:'Alpha 0.2.0: basic calculators and offline swimming and weights guides, data stays on your phone. A test, not a finished product.',
 btn:'Download APK · 3.3 MB', btnNote:'Alpha, not published on Google Play. Android will show a warning because the app comes from outside the store.',
 state:'Status', stateL:['Alpha version: limited features, errors possible.','TRAIN is in preparation: three proposed paths, no working programmes and no prescribed sessions.','This signed APK has not yet been tested on a phone.','Not on Google Play. Updates are manual.'],
 has:'What is in it', hasL:['PACE, FTP, FUEL, RACE and ZONES: five basic calculators, with method and limits stated in the app.','Offline swimming and weights guides, with pace per 100 m and splits (arithmetic only, not CSS or zones) and an external-load calculation (arithmetic, not a prescription). Favourites are saved on the phone.','No weekly programmes or plans, and no set and rep log.','MyWolf: preferences saved on the phone only if you choose to save them, and deletable.','No account, no telemetry, no GPS, no Garmin or Strava link, no AI chat.'],
 data:'Data and privacy', dataP:'The app does not send data to WOLFLAB servers. Inside the package, the web page carries a security rule that blocks network connections (connect-src none). Android lists the INTERNET permission in the manifest: it is in the package, but the app code makes no network requests. External links open only when you tap them, in the browser.',
 inst:'How to install', instL:['Download the file with the button above.','Open the file. If Android asks, allow your browser or file manager to install unknown apps, only for this install.','If you want, check the SHA-256 checksum below first.','If you have 0.1.0: same app, same signature, higher version (versionCode 2). An in-place update is expected but has not been verified on a phone; if you want to keep your data, note it first. There is no automatic update.'],
 debug:'If you installed the test (debug) build, it has a different signature: this APK will not update it. Note the data you want to keep and uninstall that build first: local saves are lost.',
 tech:'File details', rows:[['Version','0.2.0-alpha (versionCode 2)'],['Package','com.wolflabsystem.app'],['Android','7 or later'],['Size',BYTES.toLocaleString('en-US')+' bytes'],['File SHA-256',SHA],['Signing certificate SHA-256',CERT]],
 how:'To check the file: sha256sum '+FILE+' (Linux/macOS) or Get-FileHash (Windows). It must match the value above.',
 back:'Back to TRAIN', backH:'/en/train'}};
const css='<style>.app-dl{display:flex;flex-wrap:wrap;gap:16px 24px;align-items:center;margin:0 0 8px}.app-body h2{margin:44px 0 12px;font-size:1.4rem}.app-body ul,.app-body ol{padding-left:1.2em;max-width:62ch}.app-body li{margin:6px 0}.app-body p{max-width:62ch}.app-tab{border-top:1px solid var(--rule);margin:0}.app-tab div{display:grid;grid-template-columns:minmax(120px,220px) 1fr;gap:16px;padding:10px 0;border-bottom:1px solid var(--rule)}.app-tab dt{color:var(--muted)}.app-tab dd{margin:0;overflow-wrap:anywhere;font-family:var(--mono,monospace);font-size:.85rem}@media(max-width:560px){.app-tab div{grid-template-columns:1fr;gap:2px}}</style>';
for (const [k,t] of Object.entries(T)) {
  let h=fs.readFileSync(t.shell,'utf8');
  const i=h.indexOf('<main'), j=h.indexOf('</main>')+7;
  let head=h.slice(0,i), foot=h.slice(j);
  const url='https://wolflabsystem.com'+t.path, alt='https://wolflabsystem.com'+t.alt;
  head=head.replace(/<title>[^<]*<\/title>/,`<title>${t.title}</title>`)
   .replace(/<meta name="description" content="[^"]*">/,`<meta name="description" content="${t.desc}"><meta name="robots" content="noindex,follow">`)
   .replace(/<link rel="canonical" href="[^"]*">/,`<link rel="canonical" href="${url}">`)
   .replace(/<link rel="alternate" hreflang="it" href="[^"]*">/,`<link rel="alternate" hreflang="it" href="https://wolflabsystem.com/app/">`)
   .replace(/<link rel="alternate" hreflang="en" href="[^"]*">/,`<link rel="alternate" hreflang="en" href="https://wolflabsystem.com/en/app/">`)
   .replace(/<meta property="og:title" content="[^"]*">/,`<meta property="og:title" content="${t.title}">`)
   .replace(/<meta property="og:description" content="[^"]*">/,`<meta property="og:description" content="${t.desc}">`)
   .replace(/<meta property="og:url" content="[^"]*">/,`<meta property="og:url" content="${url}">`)
   .replace(/ aria-current="page"/g,'')
   .replace(/(<a class="lang" href=")[^"]*(")/,`$1${t.alt}$2`)
   .replace('</head>',css+'</head>');
  head=head.replace(/<meta name="twitter:title" content="[^"]*">/,`<meta name="twitter:title" content="${t.title}">`).replace(/<meta name="twitter:description" content="[^"]*">/,`<meta name="twitter:description" content="${t.desc}">`);
  const li=a=>a.map(x=>`<li>${x}</li>`).join('');
  const main=`<main id="main">
<header class="w-page-hero"><div class="wrap"><p class="w-kicker">${t.kicker}</p><h1>${t.h1}</h1><p class="w-lede">${t.lede}</p></div></header>
<div class="wrap w-body app-body">
<div class="app-dl"><a class="btn btn-primary" href="${apk}" download>${t.btn}</a></div>
<p class="note" style="border:0;margin-top:8px;padding-top:0">${t.btnNote}</p>
<h2>${t.state}</h2><ul>${li(t.stateL)}</ul>
<h2>${t.has}</h2><ul>${li(t.hasL)}</ul>
<h2>${t.data}</h2><p>${t.dataP}</p>
<h2>${t.inst}</h2><ol>${li(t.instL)}</ol><p>${t.debug}</p>
<h2>${t.tech}</h2><dl class="app-tab">${t.rows.map(r=>`<div><dt>${r[0]}</dt><dd>${r[1]}</dd></div>`).join('')}</dl><p>${t.how}</p>
<p><a href="${t.backH}">${t.back} →</a></p>
</div></main>`;
  fs.mkdirSync((k==='it'?'app':'en/app'),{recursive:true});
  fs.writeFileSync((k==='it'?'app':'en/app')+'/index.html',head+main+foot);
}
fs.mkdirSync('assets/app',{recursive:true});
// footer link on every page (idempotent)
import path from 'node:path';
const walk=(d,o=[])=>{for(const e of fs.readdirSync(d,{withFileTypes:true})){if(['.git','node_modules','content','tools','assets'].includes(e.name))continue;const p=path.join(d,e.name);e.isDirectory()?walk(p,o):e.name.endsWith('.html')&&o.push(p)}return o};
let n=0;
for(const f of walk('.')){let h=fs.readFileSync(f,'utf8');if(!/class="foot-links"/.test(h)||h.includes('/app/">')||h.includes('/en/app/">'))continue;
 const en=/<html lang="en"/.test(h);
 const h2=h.replace(/(<a href="(?:\/en)?\/feed\.xml">RSS<\/a>)/,`<a href="${en?'/en/app/':'/app/'}">${en?'Android app':'App Android'}</a> $1`);
 if(h2!==h){fs.writeFileSync(f,h2);n++}}
console.log('footer links',n);
