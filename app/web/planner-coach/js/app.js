(function(){
'use strict';
const app=document.getElementById('app'),S=WolfSchedule,A=WolfAggregate,H=WolfHorizon,X=WolfExport,KEY='wolf-web-coach-beta.v1',days=['Lun','Mar','Mer','Gio','Ven','Sab','Dom'];
let budgetConflict=null;
let planBackup=null,configBackup=null,editingFromPlan=false,entryDone=false,intent=null,smartMode=false;
let changePreview=null,rebaseOriginal=null,rebaseIndex=null;
let sd=null;
let view='today',planSub='pan',timeBand=null,trimNote='';
let recDraft=null;let step=0,config={goal:null,sports:[],level:'base',dayCount:null,counts:{run:0,ride:0,swim:0,strength:0},progressVolume:true,runMode:'continuous'},hist={confirmed:false,run:{currentFrequency:null,weeklyKm:null,longestKm:null,easyMinutesPerKm:null},ride:{currentFrequency:null,weeklyMinutes:null},swim:{currentFrequency:null,weeklyMinutes:null}},plan=null,preview=null,msg='',wi=0,start=nextMonday(),eventDate='',dayCap=120,dayBudgets=null,feedback={outcome:'done',effort:'right',symptoms:false,recovered:true},undo=null;
function nextMonday(){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()+((8-d.getDay())%7||7));return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function currentMonday(){const d=new Date();d.setHours(12,0,0,0);d.setDate(d.getDate()-((d.getDay()+6)%7));return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function todayStr(){const d=new Date();return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');}
function fmtDate(s){return s.slice(8,10)+'/'+s.slice(5,7)+'/'+s.slice(0,4);}
function dow(s){return (new Date(s+'T12:00:00').getDay()+6)%7;}
function freshHist(){return{confirmed:false,run:{currentFrequency:null,weeklyKm:null,longestKm:null,easyMinutesPerKm:null},ride:{currentFrequency:null,weeklyMinutes:null},swim:{currentFrequency:null,weeklyMinutes:null}};}
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const ICONS={
run:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="14" cy="4.5" r="1.8"/><path d="M6 20.5l3.5-4.5 2-3-1-4 4-1 2.5 2 3.5 1"/><path d="M10.5 9l-3 2.5-3 1"/><path d="M11.5 13l1 4-1.5 4"/></svg>',
ride:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="6.5" cy="16.5" r="3"/><circle cx="17.5" cy="16.5" r="3"/><path d="M6.5 16.5L10 8h4.5l3 8.5M10 8L8.5 5h2.5M14.5 8L13 5"/></svg>',
swim:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="16.5" cy="6" r="1.8"/><path d="M3 12l5-4 5 3 4-1M3 17c2-1.5 4-1.5 6 0s4 1.5 6 0 4-1.5 6 0"/></svg>',
strength:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 9v6M7.5 6.5v11M16.5 6.5v11M20 9v6M7.5 12h9"/></svg>',
clock:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 7.5V12l3 2"/></svg>',
cal:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="4" y="5" width="16" height="15" rx="2"/><path d="M4 10h16M8 3v4M16 3v4"/></svg>',
target:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="4"/><circle cx="12" cy="12" r="1" fill="currentColor"/></svg>',
info:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="8.5"/><path d="M12 11v5M12 7.5v.5"/></svg>',
rest:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 18v-7a2 2 0 012-2h14a2 2 0 012 2v7M3 18h18M3 18v2M21 18v2M6 9V7h7v2"/></svg>',
chart:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 20V10M10 20V4M16 20v-8M22 20H2"/></svg>',
user:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 3.5-6.5 8-6.5s8 2.5 8 6.5"/></svg>',
trophy:'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 21h8M12 17v4M7 4h10v5a5 5 0 01-10 0V4z"/><path d="M7 6H4a1 1 0 00-1 1c0 2.5 2 4 4 4M17 6h3a1 1 0 011 1c0 2.5-2 4-4 4"/></svg>'};
function icon(s){return ICONS[s]||'';}
const SPORTIT={run:'Corsa',ride:'Ride',swim:'Nuoto',strength:'Forza'};
function shortInt(s){return String(s.intensity||'').split(/[\u00b7,]/)[0].trim();}
function sessTitle(s){const si=shortInt(s);return (SPORTIT[s.sport]||s.sport)+(si?' '+si.toLowerCase():'');}
function buttons(key,values,current){return '<div class="opts">'+values.map(v=>{const p=Array.isArray(v)?v:[v,v];return '<button data-key="'+key+'" data-val="'+p[0]+'" class="'+(current===p[0]?'selected':'')+'" aria-pressed="'+(current===p[0])+'">'+p[1]+'</button>';}).join('')+'</div>';}
function select(key,label,values,current){return '<label>'+label+'<select data-select="'+key+'"><option value=""'+(current===null?' selected':'')+'>Scegli il dato reale</option>'+values.map(v=>'<option value="'+v+'"'+(v===current?' selected':'')+'>'+v+'</option>').join('')+'</select></label>';}
function histChips(field,values){const[sp,k]=field.split('.');const cur=hist[sp][k];return '<div class="opts">'+values.map(v=>{const p=Array.isArray(v)?v:[v,v];return '<button data-hist="'+field+'" data-val="'+p[0]+'" class="'+(cur===p[0]?'selected':'')+'" aria-pressed="'+(cur===p[0])+'">'+p[1]+'</button>';}).join('')+'</div>';}
function inferIntent(){if(intent)return;if(config.goal&&config.goal!=='fitness')intent='race';else if(config.runMode==='beginner')intent='start';else intent='improve';}
function autoCounts(){const c=Object.fromEntries(S.SPORTS.map(sp=>[sp,0]));const sel=S.SPORTS.filter(sp=>config.sports.includes(sp));if(!sel.length||!config.dayCount)return c;const prim=sel.includes('run')?'run':sel[0];for(const sp of sel)c[sp]=1;c[prim]=Math.max(1,config.dayCount-(sel.length-1));return c;}
function selDays(){return config.days||(config.dayCount&&S.dayChoices[config.dayCount]?S.dayChoices[config.dayCount]:[]);}
function applyTimeBand(){if(timeBand&&config.dayCount){dayCap=Math.max(30,Math.floor(timeBand/config.dayCount/5)*5);dayBudgets=null;}}
function coverDays(){const sel=S.SPORTS.filter(sp=>config.sports.includes(sp));for(const sp of S.SPORTS)if(!sel.includes(sp))config.counts[sp]=0;trimNote='';if(!sel.length||!config.dayCount)return;const trimmed=[];for(const sp of sel)if((config.counts[sp]||0)>config.dayCount){trimmed.push(sp.toUpperCase()+' '+config.counts[sp]+' -> '+config.dayCount);config.counts[sp]=config.dayCount;}if(trimmed.length)trimNote='Sedute adattate ai '+config.dayCount+' giorni scelti: '+trimmed.join(', ')+'. Nessuna seduta sparita in silenzio: la composizione effettiva e visibile qui e nel riepilogo Ritmo prima di confermare.';const tot=sel.reduce((a,sp)=>a+(config.counts[sp]||0),0);if(tot>0&&tot<config.dayCount){const prim=sel.includes('run')?'run':sel[0];config.counts[prim]=(config.counts[prim]||0)+(config.dayCount-tot);}}
function syncGoal(){if(intent==='race'&&!config.sports.includes('run')&&config.goal&&config.goal!=='fitness')config.goal=null;}
const RPE_SCALE=[[0,'Riposo'],[1,'Molto molto facile'],[2,'Facile'],[3,'Moderato'],[4,'Abbastanza duro'],[5,'Duro'],[6,''],[7,'Molto duro'],[8,''],[9,''],[10,'Massimale']];
function recordBlock(s){if(!plan||preview||!s.date||s.date>todayStr())return '';
const rec=Number.isFinite(s.actualMinutes)&&Number.isFinite(s.rpe);const d=recDraft&&recDraft.id===s.id?recDraft:null;
return '<div class="recbox"><h4>'+(rec?'Esito registrato':'Registra esito seduta')+'</h4>'
+(rec?'<p class="cap">'+s.actualMinutes+' min effettivi \u00b7 sforzo '+s.rpe+'/10 \u00b7 carico '+Math.round(s.actualMinutes*s.rpe)+' (min x sforzo). Correggi i valori e salva di nuovo se serve.</p>':'')
+'<label>Minuti effettivi<input type="number" id="rec-min-'+esc(s.id)+'" min="1" max="600" step="1" placeholder="pianificati: '+s.minutes+'" value="'+(rec?s.actualMinutes:(d&&d.min!==undefined?d.min:''))+'"></label>'
+'<label>Sforzo percepito (0-10)<select id="rec-rpe-'+esc(s.id)+'"><option value="">Scegli dopo la seduta</option>'+RPE_SCALE.map(o=>'<option value="'+o[0]+'"'+((rec?s.rpe===o[0]:(d&&String(o[0])===d.rpe))?' selected':'')+'>'+o[0]+(o[1]?' \u00b7 '+o[1]:'')+'</option>').join('')+'</select></label>'
+'<p class="cap">Scala: 0 Riposo \u00b7 2 Facile \u00b7 3 Moderato \u00b7 5 Duro \u00b7 7 Molto duro \u00b7 10 Massimale. Come e stato l\u2019allenamento? Un solo numero per l\u2019intera seduta, registrato dopo. Carico = minuti effettivi x sforzo (metodo session-RPE): indice soggettivo, non misura fisiologica.</p>'
+'<button data-action="sess-outcome" data-sess="'+esc(s.id)+'">Salva esito seduta</button></div>';}
function statsRow(w,label){const min=w.sessions.reduce((a,s)=>a+s.minutes,0),km=w.sessions.reduce((a,s)=>a+(s.km||0),0);return '<div class="stats"><span class="stat">'+icon('clock')+'<b>'+min+'</b><i>min</i></span>'+(km>0?'<span class="stat">'+icon('run')+'<b>'+km.toFixed(0)+'</b><i>km RUN stimati</i></span>':'')+'<span class="stat">'+icon('cal')+'<b>'+w.sessions.length+'</b><i>sedute</i></span></div><p class="cap">Totali '+label+'.</p>';}
function render(){
let h='<p role="status">'+esc(msg)+'</p>';
if(budgetConflict){
const c=budgetConflict,day=days[c.day]||'giorno da verificare';
h+='<section class="setup" role="alert"><h2>'+(c.week>1?'Il limite riguarda una settimana futura':'Il limite riguarda la partenza')+'</h2><p>Settimana '+c.week+' · '+day+': la proposta richiede '+(Number.isFinite(c.neededMinutes)?c.neededMinutes:'non verificati')+' min, il limite inserito e '+(Number.isFinite(c.availableMinutes)?c.availableMinutes:'non verificato')+' min.</p>'+(c.conflictSessions?'<p>'+c.conflictSessions.map(s=>esc(s.sport.toUpperCase())+' '+Math.ceil(s.minutes)+' min').join(' + ')+'</p>':'')+'<p>'+((c.feasibleWeeks||[]).length?'Le prime '+c.feasibleWeeks.length+' settimane rispettano il tempo indicato. Il percorso completo verso l\u2019obiettivo non e ancora compatibile: non e necessario cambiare i km realmente abituali.':'Non ho ancora una prima settimana compatibile. Non modifico il tuo passato per fare tornare i conti.')+'</p><button data-action="review-budget">Rivedi solo il tempo disponibile</button><button data-action="review-choices">Rivedi giorni, frequenze e progressione</button>'+((c.feasibleWeeks||[]).length?'<details><summary>Mostra la parte fattibile, solo anteprima</summary>'+c.feasibleWeeks.map(w=>'<p>Settimana '+(w.index+1)+' · '+esc(w.start)+' · '+w.sessions.reduce((a,s)=>a+s.minutes,0)+' min totali</p>').join('')+'<p>Non salvata come piano completo, nessun aumento autorizzato.</p></details>':'')+'<p>Dati inseriti conservati. Aumenta la disponibilita soltanto se il tempo esiste davvero; cambiare data da solo non rende piu breve una seduta.</p></section>';
}
if(!plan&&!preview&&!rebaseOriginal&&!entryDone){
// ---- Schermata iniziale: sport, intento, Continua. Nient'altro. ----
h+='<h1>WOLF PLANNER</h1><p>Tu scegli l\u2019obiettivo. Wolf costruisce il percorso.</p><section class="setup"><h2>Cosa vuoi ottenere?</h2>';
h+='<div class="opts opts-lg">'+S.SPORTS.map(s=>'<button data-sport="'+s+'" class="'+(config.sports.includes(s)?'selected':'')+'">'+icon(s)+'<span>'+s.toUpperCase()+'</span></button>').join('')+'<button data-multisport class="'+(config.sports.length===S.SPORTS.length?'selected':'')+'">MULTISPORT</button></div><p>MULTISPORT seleziona tutti e quattro gli sport; puoi toglierli singolarmente.</p>';
h+='<hr><div class="opts opts-lg">'+[['race','PREPARO UNA GARA'],['improve','VOGLIO MIGLIORARE'],['start','VOGLIO INIZIARE']].map(([v,l])=>'<button data-intent="'+v+'" class="'+(intent===v?'selected':'')+'">'+l+'</button>').join('')+'</div>';
h+='<hr><div class="btnrow"><button data-entry-next class="primary">Continua</button></div>';
if(planBackup)h+='<p>Hai un piano salvato su questo dispositivo: resta intatto finche non confermi uno nuovo. <button data-action="restore-saved">Torna al piano salvato</button></p>';
h+='</section>';
}
if(!plan&&!preview&&(rebaseOriginal||entryDone)){
const smart=smartMode||!!rebaseOriginal||intent==='start';
h+='<section class="setup">';
if(!rebaseOriginal){
h+='<p><button data-entry-back>&larr; Sport e obiettivo</button></p>';
if(intent==='race'&&config.sports.includes('run'))h+='<h2>Qual e il tuo obiettivo?</h2><div class="tiles">'+[['5k','5 km',''],['10k','10 km',''],['half','Mezza','21 km'],['marathon','Maratona','42 km']].map(([v,l,sub])=>'<button data-key="goal" data-val="'+v+'" class="tile'+(config.goal===v?' selected':'')+'">'+icon('run')+'<span>'+l+'</span>'+(sub?'<small>'+sub+'</small>':'')+'</button>').join('')+'</div>';
else if(intent==='race')h+='<h2>Qual e il tuo obiettivo?</h2><p>Le gare a distanza disponibili sono per la corsa. Con gli sport scelti il percorso punta a migliorare, senza gara a distanza: aggiungi RUN se la gara e di corsa.</p>';
else if(intent==='improve')h+='<h2>Qual e il tuo obiettivo?</h2><p>Migliorare, senza gara obbligatoria. Se un giorno avrai una gara, torna su Sport e obiettivo.</p>';
else if(intent==='start')h+='<h2>Qual e il tuo obiettivo?</h2><p>Iniziare, con passi graduali. Nessuna gara richiesta.</p>';
if(intent!=='start')h+='<h2>Il tuo percorso</h2><div class="pills"><button data-action="to-start" class="pill'+(!smart?' selected':'')+'">Start</button><button data-action="to-smart" class="pill'+(smart?' selected':'')+'">Smart</button></div><p class="cap">Start: settimana di esempio senza storico. Smart: dosi calcolate sui dati reali che inserisci.</p>';
{const sel=selDays();const eff=S.SPORTS.some(sp=>(config.counts[sp]||0)>0)?config.counts:autoCounts();const comp=config.dayCount?config.sports.map(sp=>(eff[sp]||0)+' '+sp.toUpperCase()).join(' + '):'';h+='<h2>Quando ti alleni?</h2><div class="daycircles">'+['L','M','M','G','V','S','D'].map((l,i)=>'<button data-daytoggle="'+i+'" class="dcirc'+(sel.includes(i)?' selected':'')+'" aria-pressed="'+sel.includes(i)+'">'+l+'</button>').join('')+'</div><p class="cap">Tocca i giorni: le sedute si distribuiscono li. E una tua scelta, non una misura della tua disponibilita reale: lo cambi quando vuoi.</p>'+(config.dayCount?'<p class="cap">Su '+config.dayCount+' giorni: '+comp+'.</p>':'')+(trimNote?'<p class="cap trimnote">'+esc(trimNote)+'</p>':'');}
h+='<h2>Quanto tempo hai?</h2><label class="timesel"><select id="timeband"><option value="">Scegli il tempo settimanale</option>'+[[120,'Fino a 2 h/settimana'],[240,'2-4 h/settimana'],[360,'4-6 h/settimana'],[480,'6-8 h/settimana'],[600,'8-10 h/settimana']].map(([v,l])=>'<option value="'+v+'"'+(timeBand===v?' selected':'')+'>'+l+'</option>').join('')+'</select></label>';
if(timeBand&&config.dayCount)h+='<p class="cap">Fascia settimanale: il piano non la supera. Limite derivato: '+dayCap+' min al giorno su '+config.dayCount+' giorni (totale max '+(dayCap*config.dayCount)+' min, entro la fascia).</p>';
}
if(!smart){
// ---- START rapido: obiettivo + giorni, niente storico. Proposta iniziale dichiarata non personalizzata. ----
if(config.sports.includes('swim'))h+='<button data-swim class="'+(config.swimAutonomy?'selected':'')+'">Confermo nuoto autonomo e piscina sorvegliata</button>';
if(planBackup)h+='<p>Hai un piano salvato su questo dispositivo: resta intatto finche non confermi uno nuovo. <button data-action="restore-saved">Torna al piano salvato</button></p>';
h+='<p class="cap">Senza storico la settimana e un esempio generico: scelte di programmazione originali WOLFLAB, non dosi calcolate su di te ne soglie sicure per tutti.</p>';
h+='<div class="btnrow"><button data-next class="primary ctabig">Genera la settimana di esempio</button></div>';
h+='</section>';
}
if(smart){
// ---- SMART: piano personalizzato sullo storico reale. ----
h+='<h2>Da dove parti ora</h2>';
if(config.sports.includes('run')&&config.runMode==='beginner')h+='<button data-beginner class="'+(hist.run.beginnerEntryConfirmed?'selected':'')+'">Confermo cammino comodo di circa 30 min e brevi tratti di corsa facile gia tollerati senza sintomi</button><p>La fase iniziale usa corsa e cammino e al massimo 3 RUN con riposo fra loro. Dopo 6 settimane rivaluto la continuita reale prima di proporre il percorso successivo. Non e preparazione completa per la gara.</p>';
if(config.sports.includes('run')&&config.runMode!=='beginner'){
h+='<h3>RUN</h3><p>Corse a settimana</p>'+histChips('run.currentFrequency',[1,2,3,4,5,6,7]);
h+='<p>Km totali a settimana</p>'+histChips('run.weeklyKm',[10,15,20,25,30,35,40,50,60]);
h+='<p>Corsa lunga abituale, km</p>'+histChips('run.longestKm',[5,8,10,12,15,18,21,25]);
h+='<p>Passo facile, min/km</p>'+histChips('run.easyMinutesPerKm',[[5,'5:00'],[5.5,'5:30'],[6,'6:00'],[6.5,'6:30'],[7,'7:00'],[7.5,'7:30']]);
}
for(const s of ['ride','swim'])if(config.sports.includes(s)){
h+='<h3>'+s.toUpperCase()+'</h3><p>'+(s==='ride'?'Uscite':'Volte')+' a settimana</p>'+histChips(s+'.currentFrequency',[1,2,3,4,5]);
h+='<p>Minuti totali a settimana</p>'+histChips(s+'.weeklyMinutes',[30,60,90,120,180,240]);
}
if(config.level==='advanced'&&config.sports.includes('run')&&config.runMode!=='beginner')h+='<button data-moderate class="'+(hist.alreadyToleratesModerate?'selected':'')+'">Faccio gia tratti moderati con recupero regolare: includi varieta controllata</button><p>Facoltativo. Non deduco soglie o ritmi dalla parola avanzato.</p>';
if(config.sports.includes('swim'))h+='<button data-swim class="'+(config.swimAutonomy?'selected':'')+'">Confermo nuoto autonomo e piscina sorvegliata</button>';
if(rebaseOriginal)h+='<button data-return class="'+(hist.returnReady?'selected':'')+'">Sono recuperato e senza sintomi attuali: rivedi il futuro</button><p>Se non corrisponde, il piano resta sospeso. Non usare il ricalcolo per ignorare sintomi.</p>';
if(!rebaseOriginal){
const total=config.sports.reduce((a,s)=>a+(config.counts[s]||0),0);
const split=config.sports.map(s=>(config.counts[s]||0)+' '+s.toUpperCase()).join(' + ');
const volLabel=config.progressVolume?'progressione con consolidamento ogni 4 settimane':'volume stabile, metodo varia ogni 4 settimane';
const lvlLabel={base:'base',intermediate:'intermedio',advanced:'avanzato'}[config.level]||config.level;
h+='<details class="gcard" id="ritmo"><summary>Ritmo: '+(config.dayCount||'?')+' giorni · '+split+' · limite '+dayCap+' min/giorno (modificabile) · '+volLabel+' · livello '+lvlLabel+'</summary>';
h+='<h3>Sedute per sport</h3>';for(const s of config.sports)h+='<h3>'+s.toUpperCase()+'</h3>'+buttons('count.'+s,[1,2,3,4,5,6,7],config.counts[s]);
h+='<p>'+total+' sedute in '+(config.dayCount||'?')+' giorni. Le doppie vengono organizzate automaticamente, non devi aggiungere slot.</p>';
h+='<h3>Volume</h3>'+buttons('progressVolume',[[true,'Progressioni se recupero bene'],[false,'Mantieni volume · cambia metodo']],config.progressVolume);
h+='<h3 id="tempo-giorno">Tempo massimo in un giorno, doppie incluse</h3>'+buttons('dayCap',[30,45,60,90,120,150,180],dayCap);
h+='<h3>Tempo per singolo giorno (facoltativo)</h3>'+days.map((d,i)=>'<label>'+d+'<input data-budget="'+i+'" type="number" min="0" max="600" value="'+(dayBudgets?.[i]??dayCap)+'"></label>').join('');
h+='<h3>Metodo e livello</h3>'+buttons('level',[['base','Base · sto costruendo abitudine'],['intermediate','Intermedio · mi alleno gia con costanza'],['advanced','Avanzato · esperienza continuativa']],config.level)+'<p>Il livello orienta solo il metodo, non prova quanti km puoi fare.</p></details>';
}
if(planBackup)h+='<p>Hai un piano salvato su questo dispositivo: resta intatto finche non confermi uno nuovo. <button data-action="restore-saved">Torna al piano salvato</button></p>';
h+='<div class="btnrow"><button data-next class="primary">'+(rebaseOriginal?'Ricalcola il futuro':'Genera il piano')+'</button></div>';

if(!rebaseOriginal){
let dp='';
if(config.sports.includes('run')&&config.runMode!=='beginner')dp+=select('run.currentFrequency','RUN attuali a settimana',[1,2,3,4,5,6,7],hist.run.currentFrequency)+select('run.weeklyKm','Km RUN in una settimana recente abituale',[3,5,8,10,12,15,18,20,24,25,30,35,40,45,50,60,65,70,80],hist.run.weeklyKm)+select('run.longestKm','Corsa piu lunga abituale, km',[1,2,3,4,5,6,7,8,9,10,12,15,18,20,24,28,30],hist.run.longestKm)+select('run.easyMinutesPerKm','Riferimento facile recente, min/km',[4,4.5,5,5.5,6,6.5,7,7.5,8,9,10],hist.run.easyMinutesPerKm);
for(const s of ['ride','swim'])if(config.sports.includes(s))dp+=select(s+'.currentFrequency',s.toUpperCase()+' attuali a settimana',[1,2,3,4,5,6,7],hist[s].currentFrequency)+select(s+'.weeklyMinutes',s.toUpperCase()+' minuti settimanali abituali',[10,15,20,30,40,45,60,75,90,120,150,180,240,300],hist[s].weeklyMinutes);
if(dp)h+='<details class="gcard" id="precise"><summary>Dati precisi (facoltativo)</summary><p>Se il tuo valore non c\u2019e tra le scelte rapide, inseriscilo qui: sostituisce la scelta rapida.</p>'+dp+'</details>';
h+='<details class="gcard"><summary>Date: partenza e gara (facoltativo)</summary><label>Lunedi di partenza<input id="start" type="date" value="'+start+'"></label><label>Data evento facoltativa<input id="event" type="date" value="'+eventDate+'"></label></details>';
}else h+='<label>Lunedi di partenza<input id="start" type="date" value="'+start+'"></label><label>Data evento facoltativa<input id="event" type="date" value="'+eventDate+'"></label>';
h+='</section>';
}
}
const p=preview||plan;
if(p){
const today=todayStr();
const wToday=p.weeks.find(w=>w.start<=today&&H.dateAdd(w.start,7)>today)||null;
const tSessions=wToday?wToday.sessions.filter(s=>s.date===today):[];
const wk=p.weeks[Math.min(wi,p.weeks.length-1)];
const firstActive=wk.sessions.length?Math.min(...wk.sessions.map(s=>s.day)):0;
const inWk=wk.start<=today&&H.dateAdd(wk.start,7)>today,todayD=inWk?dow(today):-1;
if(sd===null||sd<0||sd>6)sd=inWk?todayD:firstActive;
const noteBar=p.starter?'<div class="note">'+icon('info')+'<p><b>Settimana di esempio, non personalizzata.</b> Struttura generica originale WOLFLAB: non e calcolata sul tuo storico, non stima la tua capacita e non e una soglia sicura per tutti.'+(p.goal&&p.goal!=='fitness'?' Non e una preparazione alla distanza scelta ('+esc(S.GOALS[p.goal].label)+'): per la progressione servono i tuoi dati reali.':'')+'</p><button data-action="to-smart" class="linkbtn">Personalizza con i tuoi dati reali (SMART)</button></div>':'';
const VIEWS=[['today','Today','clock'],['plan','Plan','target'],['calendar','Calendar','cal'],['progress','Progress','chart'],['profile','Profile','user']];
h+='<nav class="tabnav" aria-label="Sezioni">'+VIEWS.map(([v,l,ic])=>'<button data-view="'+v+'" class="'+(view===v?'on':'')+'">'+icon(ic)+'<span>'+l+'</span></button>').join('')+'</nav>';
if(view==='today'){
h+=(p.goal&&p.goal!=='fitness'?'<p class="goal-line">'+icon('target')+'Obiettivo: '+esc(S.GOALS[p.goal].label)+(p.eventDate?' \u00b7 '+esc(p.eventDate):'')+'</p>':'');
h+='<section class="gcard today"><h1 class="todayh">Oggi \u00b7 '+fmtDate(today)+'</h1>';
if(wToday){
h+=tSessions.length?tSessions.map(s=>'<button class="wcard" data-action="goto-detail"><span class="wic sp-'+s.sport+'">'+icon(s.sport)+'</span><span class="wtxt"><span class="wtitle">'+esc(sessTitle(s))+'</span><span class="wmeta">'+(Number.isFinite(s.actualMinutes)&&Number.isFinite(s.rpe)?'Eseguita: '+s.actualMinutes+' min \u00b7 sforzo '+s.rpe+'/10':(s.minutes+' min'+(Number.isFinite(s.km)?' \u00b7 '+Number(s.km.toFixed(1))+' km':'')+' \u00b7 '+esc(s.intensity)+' \u00b7 '+esc(s.slot)))+'</span></span><span class="chev">&#8250;</span></button>').join('')+(p.starter?'<span class="etag">Settimana di esempio</span>':''):'<div class="wcard"><span class="wic">'+icon('rest')+'</span><span class="wtxt"><span class="wtitle">Riposo</span><span class="wmeta">Giorno libero nella settimana corrente del percorso.</span></span></div>'+(p.starter?'<span class="etag">Settimana di esempio</span>':'');
h+='</section><section class="gcard stats"><h2>Questa settimana</h2>'+statsRow(wToday,'questa settimana')+'</section>';
}else if(p.weeks[0].start>today){
h+='<div class="wcard wrap"><span class="wic">'+icon('cal')+'</span><span class="wtxt"><span class="wtitle">Il piano inizia lunedi '+fmtDate(p.weeks[0].start)+'</span><span class="wmeta">Oggi non fa ancora parte del percorso: nessuna seduta prevista fino alla settimana 1.</span></span></div></section><section class="gcard stats"><h2>Settimana 1</h2>'+statsRow(p.weeks[0],'nella settimana 1')+'</section>';
}else{
h+='<div class="wcard wrap"><span class="wtxt"><span class="wtitle">Il piano e terminato il '+fmtDate(H.dateAdd(p.weeks[p.weeks.length-1].start,6))+'</span></span></div></section>';
}
if(!p.starter&&p.weeks.length>1){const ci=wToday?p.weeks.indexOf(wToday)+1:(p.weeks[0].start>today?0:p.weeks.length);h+='<section class="gcard"><h2>Percorso</h2><p class="cap">Posizione nel calendario del percorso, non un avanzamento: le dosi future restano condizionate ai riscontri.</p><p>Settimana '+ci+' di '+p.weeks.length+(p.eventDate?' \u00b7 Evento: '+esc(p.eventDate):'')+'</p><div class="ptrack"><i data-w="'+Math.round(ci/p.weeks.length*100)+'"></i></div></section>';}
h+=noteBar;
if(plan&&!preview){
if(wToday){const fwi=p.weeks.indexOf(wToday);
h+='<section class="setup"><h2>Com e andata?</h2><p>Riscontro della settimana '+(fwi+1)+' in corso ('+fmtDate(wToday.start)+' - '+fmtDate(H.dateAdd(wToday.start,6))+'): vale solo per questa settimana.</p>'+buttons('feedback.outcome',[['done','Fatto'],['partial','In parte'],['skipped','Saltato']],feedback.outcome)+buttons('feedback.effort',[['easy','Facile'],['right','Giusto'],['hard','Troppo']],feedback.effort)+buttons('feedback.symptoms',[[false,'Nessun fastidio'],[true,'Fastidi o sintomi']],feedback.symptoms)+buttons('feedback.recovered',[[true,'Recuperato'],[false,'Non recuperato']],feedback.recovered)+'<button data-action="feedback">Salva riscontro</button><p>Registra aderenza e sensazioni, non inventa minuti o km realmente svolti.</p></section>';
}else if(p.weeks[0].start>today){
h+='<section class="gcard"><h2>Riscontri</h2><p>I riscontri si aprono lunedi '+fmtDate(p.weeks[0].start)+', quando inizia la settimana 1: non si registrano su un periodo non ancora iniziato.</p></section>';
}else{
h+='<section class="gcard"><h2>Riscontri</h2><p>Il piano e terminato il '+fmtDate(H.dateAdd(p.weeks[p.weeks.length-1].start,6))+': il periodo dei riscontri e chiuso, lo storico registrato resta intatto.</p></section>';
}}
}
if(view==='plan'){
h+='<h1>'+(preview?(p.starter?'La settimana di esempio proposta.':'Il piano proposto.'):'Il Mio Piano')+'</h1>';
h+='<div class="subtabs">'+[['pan','Panoramica'],['fasi','Fasi'],['ob','Obiettivo']].map(([v,l])=>'<button data-plansub="'+v+'" class="'+(planSub===v?'on':'')+'">'+l+'</button>').join('')+'</div>';
if(planSub==='pan'){
const wkV=wToday||p.weeks[0];
const kmR=wkV.sessions.filter(s=>s.sport==='run').reduce((a,s)=>a+(s.km||0),0);
const minT=wkV.sessions.reduce((a,s)=>a+s.minutes,0);
const goalLabel=S.GOALS[p.goal||config.goal].label;
const nextEv=(p.events||[]).slice().sort((a,b)=>a.date<b.date?-1:1).find(e=>e.date>=today);
const dateLine=p.eventDate?'Evento: '+fmtDate(p.eventDate):(nextEv?esc(nextEv.label)+' \u00b7 '+fmtDate(nextEv.date):(p.starter?'Settimana di esempio, nessuna gara impostata.':'Nessuna data evento annotata.'));
h+='<section class="goalcard"><span class="trophy">'+icon('trophy')+'</span><h2>'+esc(goalLabel)+'</h2><p>'+dateLine+'</p></section>';
const segs=[];for(const w of p.weeks){const ph=w.phase||'';if(w.recoveryWeek&&segs.length){segs[segs.length-1].count++;continue;}if(segs.length&&segs[segs.length-1].phase===ph)segs[segs.length-1].count++;else segs.push({phase:ph,count:1});}
h+='<section class="gcard"><h2>Periodizzazione</h2><div class="roadmap"><div class="rline"></div>'+segs.map((g,gi)=>'<div class="rseg"><span class="rdot c'+(gi%5)+'"></span><b>'+esc(g.phase.split(/[ :]/)[0])+'</b><i>('+g.count+'w)</i></div>').join('')+'</div><p class="cap">Fasi reali del piano generato, raggruppate settimana per settimana: i testi completi sono nella scheda Fasi.</p></section>';
h+='<section class="gcard"><h2>Volume settimanale</h2><div class="voltiles"><span class="vtile">'+icon('run')+'<b>'+(kmR>0?kmR.toFixed(0)+' km':'\u2014')+'</b><i>RUN stimati</i></span><span class="vtile">'+icon('clock')+'<b>'+(Math.round(minT/6)/10)+' h</b><i>totale</i></span><span class="vtile">'+icon('cal')+'<b>'+wkV.sessions.length+'x</b><i>sedute</i></span></div><p class="cap">Settimana '+(wkV.index+1)+': stime di programmazione, non misure.</p></section>';
if(timeBand&&p.starter){const tot=p.weeks[0].sessions.reduce((a,s)=>a+s.minutes,0);if(tot>timeBand)h+='<p class="cap">La settimana di esempio propone '+tot+' min, oltre il tempo indicato ('+Math.round(timeBand/60)+' h): valuta meno giorni.</p>';}
h+='<button class="ghostbtn" data-action="goto-calendar">Visualizza calendario &#8594;</button>';
}
if(planSub==='fasi'){
h+='<section class="gcard"><h2>Periodizzazione</h2>'+p.weeks.map(w=>'<div class="wkrow"><b>Settimana '+(w.index+1)+'</b><span>'+esc(w.phase)+(w.suspended?' (sospesa dopo i riscontri)':'')+'</span><span>'+w.sessions.reduce((a,s)=>a+s.minutes,0)+' min'+(w.sessions.some(s=>s.km)?' \u00b7 RUN '+w.sessions.filter(s=>s.sport==='run').reduce((a,s)=>a+(s.km||0),0).toFixed(1)+' km stimati':'')+(w.sessions.some(s=>s.kmUndefinedForVariedEffort)?' + seduta a tempo senza stima distanza':'')+'</span></div>').join('')+'</section>';
}
if(planSub==='ob'){
if(!p.starter){
h+='<p>'+p.weeks.length+' settimane'+(p.availabilityReallocated?'<p>Giorni riorganizzati automaticamente per rispettare il tempo disponibile.</p>':'')+(p.beginner?' di avvio, NON preparazione completa \u00b7 obiettivo successivo ':' \u00b7 ')+S.GOALS[p.goal||config.goal].label+' \u00b7 '+(p.maintenance?'volume stabile e metodo ogni 4 settimane':'progressione futura condizionata ai riscontri, non garanzia gara')+'</p>'+(p.frequencyAdaptation?'<p>La frequenza scelta e il traguardo: prima '+p.frequencyAdaptation.weeks+' settimane di adattamento, senza aumento del volume. Nei primi passaggi ci sono meno sedute e meno giorni attivi.</p>':'')+(p.beginner?'<p>Avvio: '+p.initialRunFrequency+' RUN/settimana. Frequenza finale desiderata: '+p.requestedRunFrequency+'.</p><details><summary>Prima di passare al percorso gara</summary><p>'+esc(p.gateway.reason)+'</p></details>':'')+(p.eventWeek?'<p>Evento: '+p.eventDate+'. Settimana alleggerita, partenza da confermare.</p><details><summary>Gara e recupero</summary><p>La gara non e una prontezza certificata. Dopo gara: recupero e nuovo riscontro, nessun rientro automatico.</p></details>':p.eventNotAssessed?'<p>La data evento resta annotata, ma questo percorso a volume stabile non valuta la preparazione per la gara.</p>':'');
}else{h+='<p>Obiettivo: '+esc(S.GOALS[p.goal||config.goal].label)+'. Settimana di esempio non personalizzata: per la progressione servono i tuoi dati reali.</p>';}
if((p.events||[]).length)h+='<section class="gcard"><h2>Eventi annotati</h2>'+p.events.map(e=>'<p>'+esc(e.label)+' \u00b7 '+fmtDate(e.date)+'</p>').join('')+'<p class="cap">Annotazioni tue: il percorso non viene ricalcolato sugli eventi.</p></section>';
else h+='<p class="cap">Nessun evento annotato. Puoi aggiungerne uno dalla scheda Calendar.</p>';
}
if(preview)h+='<div class="btnrow"><button data-action="apply" class="primary ctabig">Conferma piano</button><button data-action="cancel">Rivedi le scelte</button></div>';
else h+='<div class="opts"><button data-action="reset">Modifica scelte e tempi (i dati restano)</button></div>';
h+=noteBar;
}
if(view==='calendar'){
h+='<h1>Calendario</h1>';
if(p.weeks.length>1)h+='<label>Settimana<select id="week-nav">'+p.weeks.map((w,i)=>'<option value="'+i+'"'+(wi===i?' selected':'')+'>Settimana '+(i+1)+' \u00b7 '+esc(w.start)+'</option>').join('')+'</select></label>';
h+='<h2>Settimana '+(wk.index+1)+' \u00b7 '+esc(wk.phase)+'</h2>'+(wk.suspended?'<p class="danger">Sospesa dopo i riscontri: non seguire le dosi future finche il percorso non e rivisto.</p>':'')+(wk.index>0&&!wk.feedbackGateSatisfied?'<p>Previsione condizionata: prima di passare a questa dose occorrono i riscontri delle settimane precedenti. Non e una progressione gia confermata.</p>':'')+'<div class="weekgrid">';
for(let d=0;d<7;d++){const ss=wk.sessions.filter(s=>s.day===d);const past=H.dateAdd(wk.start,d)<today;h+='<button class="plan-day'+(ss.length?' sp-'+ss[0].sport:'')+(sd===d?' sel':'')+(past?' past':'')+'" data-day="'+d+'"><span class="dhead"><span class="kicker">'+days[d]+'</span><span class="dnum">'+fmtDate(H.dateAdd(wk.start,d)).slice(0,5)+'</span></span>'+(ss.length?ss.map(s=>'<span class="wsess '+s.sport+'">'+icon(s.sport)+'<b>'+esc(sessTitle(s))+'</b><i><span class="wmin">'+s.minutes+'\u2032</span><span class="wint"> \u00b7 '+esc(shortInt(s))+'</span></i></span>').join(''):'<span class="wsess rest">'+icon('rest')+'<b>Riposo</b></span>')+(p.events||[]).filter(e=>e.date===H.dateAdd(wk.start,d)).map(e=>'<span class="evmark">'+esc(e.label)+'</span>').join('')+'</button>';}
h+='</div><div class="day-detail">'+wk.sessions.filter(s=>s.day===sd).map(s=>'<div class="sess"><div class="dhead2"><span class="back">&#8592;</span><h3>'+esc(sessTitle(s))+'</h3><span class="ddate">'+days[sd]+' '+fmtDate(s.date)+'</span></div><div class="dbody"><div class="dmain"><span class="dicon sp-'+s.sport+'">'+icon(s.sport)+'</span><p class="dmin">'+s.minutes+' MIN</p><p class="dmeta">'+esc(s.intensity)+(Number.isFinite(s.km)?' \u00b7 '+Number(s.km.toFixed(1))+' km stimati':'')+' \u00b7 '+esc(s.slot)+'</p><p class="why"><b>Perche?</b> '+esc(wk.phase)+'</p></div><div class="dwhat"><h4>Cosa fare</h4><p>'+esc(s.method||'Seduta facile nella durata proposta.').replace(/\n/g,'<br>')+'</p>'+(s.routine?'<ol>'+s.routine.map(r=>'<li>'+esc(r.movement)+' \u00b7 '+esc(r.sets)+'x'+esc(r.reps)+'</li>').join('')+'</ol><p>Recupera tra le serie quanto serve per tecnica e respirazione, senza forzare ripetizioni. Variante piu semplice se la forma si perde.</p>':'')+'</div></div>'+recordBlock(s)+'</div>').join('')+(wk.sessions.some(s=>s.day===sd)?'':'<div class="sess"><div class="dhead2"><h3>'+days[sd]+' '+fmtDate(H.dateAdd(wk.start,sd))+'</h3></div><p class="dmeta">Riposo, nessuna seduta prevista.</p></div>')+'</div>';
if(plan&&!preview)h+='<details class="gcard"><summary>Sposta una seduta, senza cambiare dose</summary><label>Seduta<select id="move-id">'+plan.weeks[Math.min(wi,plan.weeks.length-1)].sessions.map(s=>'<option value="'+esc(s.id)+'">'+s.sport.toUpperCase()+' '+days[s.day]+' '+s.minutes+'min</option>').join('')+'</select></label><label>Nuovo giorno<select id="move-day">'+days.map((d,i)=>'<option value="'+i+'">'+d+'</option>').join('')+'</select></label><button data-action="move">Anteprima spostamento</button></details>'+'<details class="gcard"><summary>Riduci o sostituisci una seduta</summary><p class="cap">Scelta manuale sulla settimana mostrata: non e una dose calcolata ne una equivalenza fra sport. Per aumentare servono storico e riscontri, non una modifica a mano.</p><label>Seduta<select id="adj-id">'+wk.sessions.map(s=>'<option value="'+esc(s.id)+'">'+s.sport.toUpperCase()+' '+days[s.day]+' '+s.minutes+'min</option>').join('')+'</select></label><label>Riduci a (minuti, vuoto = invariato)<input id="adj-min" type="number" min="10" step="5" placeholder="es. 40"></label><label>Sostituisci sport<select id="adj-sport"><option value="">Invariato</option>'+S.SPORTS.map(sp=>'<option value="'+sp+'">'+sp.toUpperCase()+'</option>').join('')+'</select></label><button data-action="adjust">Anteprima modifica</button></details>'
+'<details class="gcard"><summary>Aggiungi una seduta</summary><p class="cap">La seduta aggiunta e una tua scelta: non e una dose calcolata e non cambia le progressioni future.</p><label>Giorno<select id="add-day">'+days.map((d,i)=>'<option value="'+i+'">'+d+'</option>').join('')+'</select></label><label>Sport<select id="add-sport">'+S.SPORTS.map(sp=>'<option value="'+sp+'">'+sp.toUpperCase()+'</option>').join('')+'</select></label><label>Durata (minuti)<input id="add-min" type="number" min="10" max="600" step="5" value="45"></label><label>Intensita<select id="add-int"><option>Facile, conversazione possibile</option><option>Impegno moderato</option><option>Impegno sostenuto</option></select></label><button data-action="add-session">Anteprima aggiunta</button></details>'
+'<details class="gcard"><summary>Aggiungi un evento o obiettivo</summary><p class="cap">Annotazione tua: il percorso non viene ricalcolato sull evento e non promette preparazione specifica.</p><label>Data<input id="ev-date" type="date"></label><label>Nome<input id="ev-label" type="text" maxlength="60" placeholder="es. Granfondo di primavera"></label><button data-action="add-event">Anteprima evento</button></details>';
}
if(view==='progress'){
h+='<h1>Progressi</h1>';
const rows=p.weeks.map(w=>({w,t:WolfLoad.weekTotals(w),f:w.feedback}));
const anyFb=rows.some(r=>r.f||r.t.recorded>0);
if(!anyFb){
h+='<section class="gcard"><p>Nessun dato registrato finora. I progressi si costruiscono dagli esiti che salvi sulle sedute e dai riscontri nella scheda Oggi: senza registrazioni reali non mostriamo grafici o carichi inventati.</p></section>';
}else{
const maxMin=Math.max(...rows.map(r=>r.t.plannedMin),1);
h+='<section class="gcard"><h2>Volume, eseguito e carico</h2>'+rows.map(r=>'<div class="prow"><span class="plab">S'+(r.w.index+1)+'</span><span class="pbar"><i data-w="'+Math.round(r.t.plannedMin/maxMin*100)+'"></i></span><span class="pval">'+r.t.plannedMin+'\u2032</span><span class="pload">'+(r.t.recorded?r.t.actualMin+'\u2032 eff \u00b7 carico '+r.t.load+' \u00b7 '+r.t.recorded+'/'+r.t.total:'\u2014')+'</span><span class="pfb">'+(r.f?({done:'Fatto',partial:'In parte',skipped:'Saltato'})[r.f.outcome]:'\u2014')+'</span></div>').join('')+'</section><p class="cap">Barra: minuti pianificati. eff: minuti effettivi registrati dopo le sedute. Carico = minuti effettivi x sforzo 0-10 (metodo session-RPE): indice soggettivo dai tuoi inserimenti, non misura fisiologica, di forma o di prestazione. n/N = sedute con esito registrato; quelle senza esito non producono carico. Ultima colonna: riscontro settimanale, usato per adattare il piano.</p>';
}
}
if(view==='profile'){
h+='<h1>Profilo</h1>';
h+='<section class="gcard"><h2>Le tue scelte</h2><p>Sport: '+config.sports.map(s=>s.toUpperCase()).join(' + ')+' \u00b7 Obiettivo: '+esc(S.GOALS[p.goal||config.goal].label)+' \u00b7 Giorni a settimana: '+(config.dayCount||'-')+'</p><p>Percorso: '+(p.starter?'START, settimana di esempio non personalizzata':'SMART, calcolato sullo storico che hai inserito')+'. Le funzioni avanzate compaiono quando servono: i dati precisi restano facoltativi.</p></section>';
if(plan&&!preview){
h+='<details class="gcard"><summary>Strumenti, backup ed export</summary><p class="cap">Funzioni avanzate, da aprire solo se servono: backup, ripristino, formati per altre app e azioni sul piano.</p><div class="opts"><button data-action="json">Backup JSON</button><label>Ripristina backup<input id="restore" type="file" accept="application/json,.json"></label><label>Allenamento da esportare<select id="export-session">'+plan.weeks[Math.min(wi,plan.weeks.length-1)].sessions.map(s=>'<option value="'+esc(s.id)+'">'+s.sport.toUpperCase()+' \u00b7 '+days[s.day]+'</option>').join('')+'</select></label><button data-action="workout-text">Testo allenamento selezionato</button><button data-action="csv">Export CSV</button><button data-action="ics">Calendario ICS</button><button data-action="intervals">File Intervals API JSON</button><button data-action="ride">Workout bici ZWO</button><button data-action="availability">Modifica tempo disponibile</button><button data-action="rebase">Ricalcola il futuro dal mio passato recente</button><button data-action="undo">Annulla ultima modifica</button><button data-action="reset">Modifica scelte e tempi (i dati restano)</button></div></details><details><summary>Come portare il piano in altre app</summary><ol><li>Calendario: scarica ICS e importalo in un calendario compatibile. Ogni seduta e un evento distinto; le doppie restano separate.</li><li>Intervals, singola seduta: seleziona allenamento e scarica il testo. Crea un workout manuale, scegli lo sport e incolla il testo nel builder. Controlla durata, blocchi e giorno prima di usarlo.</li><li>Intervals, bici: scarica ZWO e caricalo nella libreria workout, poi assegna il giorno. Nessuna potenza inventata.</li><li>JSON API e per un connettore tecnico, non un file importabile dalla normale schermata. Nessun account collegato o upload eseguito.</li></ol><p>Formati verificati con parser indipendenti; import server Intervals non provato. ICS locale non equivale a una sottoscrizione: nessun calendario pubblico creato.</p><a href="https://forum.intervals.icu/t/bulk-import-of-zwo-mrc-and-erg-files/5312" target="_blank" rel="noopener">Istruzioni libreria ZWO</a><p>Prima di usare dosi future controlla riscontri e recupero: sono previsioni, non aumenti gia confermati.</p></details>';
}
}
}

if(changePreview)h+='<section class="setup"><h2>Controlla la modifica</h2><p>'+esc(changePreview.reason)+'</p><button data-action="apply-change">Applica modifica</button><button data-action="cancel-change">Scarta</button></section>';
h+='<details class="gcard"><summary>Metodo, fonti e limiti</summary><p>Fonte ACSM: progressione graduale, individualizzazione e forza. Dosi, allocazione e riferimenti sono scelte originali WOLFLAB, non soglie di sicurezza o piano clinico. Settimane future sono scenari condizionati al recupero e vanno riviste. La data non comprime carico o riposo. Livello e passato aggregato non sono una valutazione medica.</p><p>Tempi e sequenza corsa/cammino sono programmazione originale WOLFLAB. La fase di adattamento della frequenza usa una proposta originale a volume non crescente. Dopo riscontri difficili il futuro viene sospeso finche riconfermi il passato recente. Import esterno non e stato verificato. Non modifica i piani delle altre versioni del planner.</p></details><p class="foot">Versione beta. Dati locali e backup manuale, nessun account o sincronizzazione. Non modifica i piani delle altre versioni. <a href="/app/web/planner-beta/">Apri Wolf Planner beta</a> · <a href="/app/web/planner/">Apri la prima versione</a></p>';
app.innerHTML=h;
app.querySelectorAll('.ptrack i[data-w],.pbar i[data-w]').forEach(el=>{el.style.width=el.dataset.w+'%';});
if(!plan&&!preview)try{sessionStorage.setItem(KEY+'.draft',JSON.stringify({step,config,hist,start,eventDate,dayCap,dayBudgets,timeBand,fromPlan:editingFromPlan,entryDone,intent,smartMode}));}catch(e){}
}
function validBackup(d){return d?.format==='wolf-web-coach-beta'&&d.config&&S.GOALS[d.config.goal]&&S.LEVELS[d.config.level]&&d.plan?.status==='provisional-whole-plan'&&Array.isArray(d.plan.weeks)&&d.plan.weeks.length>0&&d.plan.weeks.length<=180&&d.plan.weeks.every(w=>Array.isArray(w.sessions)&&w.sessions.length<=14&&/^\d{4}-\d{2}-\d{2}$/.test(w.start)&&w.sessions.every(s=>S.SPORTS.includes(s.sport)&&Number.isInteger(s.day)&&s.day>=0&&s.day<=6&&Number.isFinite(s.minutes)&&s.minutes>0&&s.minutes<=600&&typeof s.id==='string'&&typeof s.date==='string'));}
function save(){localStorage.setItem(KEY,JSON.stringify({config,plan,hist,start,eventDate,dayCap,dayBudgets,timeBand}));}
function download(text,name,type){const u=URL.createObjectURL(new Blob([text],{type})),a=document.createElement('a');a.href=u;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
function missingHistory(){
const miss=[];
if(config.sports.includes('run')&&config.runMode==='beginner'&&!hist.run.beginnerEntryConfirmed)miss.push('conferma avvio corsa/cammino');
if(config.sports.includes('run')&&config.runMode!=='beginner'){if(!hist.run.currentFrequency)miss.push('RUN attuali a settimana');if(!hist.run.weeklyKm)miss.push('km RUN settimanali');if(!hist.run.longestKm)miss.push('corsa piu lunga abituale');if(!hist.run.easyMinutesPerKm)miss.push('riferimento facile min/km');}
for(const s of ['ride','swim'])if(config.sports.includes(s)){if(!hist[s].currentFrequency)miss.push(s.toUpperCase()+' attuali a settimana');if(!hist[s].weeklyMinutes)miss.push(s.toUpperCase()+' minuti settimanali');}
if(config.sports.includes('swim')&&!config.swimAutonomy)miss.push('conferma nuoto autonomo');
return miss;
}
function starterPlan(){
const goal=(intent==='race'&&config.sports.includes('run'))?config.goal:'fitness';
const c={goal,level:'base',dayCount:config.dayCount,days:selDays(),counts:autoCounts(),swimAutonomy:config.swimAutonomy};
const w=S.schedule(c);
if(w.status!=='automatic-week-proposal')throw Error(w.reason||'Combinazione non supportata: prova a cambiare giorni o sport.');
const monday=currentMonday();
const week={index:0,start:monday,phase:'Settimana di esempio generica',provisional:false,sessions:w.sessions.map(s=>({...s,status:'planned',date:H.dateAdd(monday,s.day),actualKm:null,actualMinutes:null}))};
return{status:'provisional-whole-plan',weeks:[week],starter:true,goal,eventDate:null,eventReadinessClaim:false,maintenance:false,progressVolume:false,allFutureDoseChangesRequireFeedback:true,limitations:w.limitations};
}
function generate(){
if(rebaseOriginal&&!hist.returnReady)throw Error('Prima di riproporre carico conferma recupero e assenza di sintomi attuali. Con sintomi il piano resta sospeso.');
if(!config.dayCount)throw Error('Scegli quanti giorni a settimana puoi allenarti.');
const raceRun=intent==='race'&&config.sports.includes('run');
if(intent==='race'&&raceRun&&!config.goal)throw Error('Scegli la distanza della gara.');
if(intent==='race'&&!raceRun)config.goal='fitness';
const smart=smartMode||!!rebaseOriginal||intent==='start';
if(!smart){
if(config.sports.includes('swim')&&!config.swimAutonomy)throw Error('Per SWIM serve la conferma di nuoto autonomo e piscina sorvegliata.');
config.counts=autoCounts();
preview=starterPlan();view='plan';wi=0;budgetConflict=null;msg='';render();window.scrollTo(0,0);return;
}
const miss=missingHistory();
if(miss.length)throw Error('Mancano solo questi dati reali: '+miss.join(', ')+'.');
hist.confirmed=true;
start=document.getElementById('start').value;eventDate=document.getElementById('event').value;
if(!S.SPORTS.some(s=>(config.counts[s]||0)>0))config.counts=autoCounts();
config.counts=Object.fromEntries(S.SPORTS.map(s=>[s,config.sports.includes(s)?(config.counts[s]||0):0]));
config.days=selDays();
const opts={start,eventDate:eventDate||undefined,progressVolume:config.progressVolume,dayMinutes:dayBudgets||Object.fromEntries(days.map((_,i)=>[i,dayCap]))};
const q=WolfPlanner.generate(config,hist,opts,{S,A,H,B:WolfBeginner,M:WolfMethods});
if(q.status==='time-budget-conflict'){budgetConflict=q;msg='Conflitto di tempo: dettaglio sotto. I dati restano inseriti.';render();window.scrollTo(0,0);return;}
if(q.status!=='provisional-whole-plan')throw Error(q.reason||q.status);
budgetConflict=null;
if(rebaseOriginal){const r=WolfAdapt.rebase(rebaseOriginal,rebaseIndex,q);if(r.status!=='rebase-preview')throw Error(r.reason||r.status);preview=r.plan;view='plan';wi=rebaseIndex+1;msg=r.reason;}else{preview=q;view='plan';wi=0;}
render();
}
function saveDraft(){if(!plan&&!preview)try{sessionStorage.setItem(KEY+'.draft',JSON.stringify({step,config,hist,start,eventDate,dayCap,dayBudgets,timeBand,fromPlan:editingFromPlan,entryDone,intent,smartMode}));}catch(e){}}
document.addEventListener('click',ev=>{
const t=ev.target.closest('button');if(!t)return;
try{
msg='';
if(t.dataset.key){const k=t.dataset.key;let v=t.dataset.val;if(v==='true'||v==='false')v=v==='true';else if(['dayCount','dayCap'].includes(k)||k.startsWith('count.'))v=Number(v);if(k==='dayCap'){dayCap=v;dayBudgets=null;}else if(k.startsWith('feedback.'))feedback[k.split('.')[1]]=v;else if(k.startsWith('count.'))config.counts[k.split('.')[1]]=v;else config[k]=v;if(k==='dayCount')coverDays();}
if(t.dataset.multisport!==undefined){config.sports=[...S.SPORTS];coverDays();syncGoal();}
if(t.dataset.intent){intent=t.dataset.intent;hist.confirmed=false;if(intent==='race'){config.goal=null;config.runMode='continuous';}if(intent==='improve'){config.goal='fitness';config.runMode='continuous';}if(intent==='start'){config.goal='fitness';config.level='base';config.runMode='beginner';}}
if(t.hasAttribute('data-entry-next')){if(!config.sports.length)throw Error('Scegli almeno uno sport.');if(!intent)throw Error('Scegli cosa vuoi ottenere: preparare una gara, migliorare o iniziare.');syncGoal();entryDone=true;render();return;}
if(t.hasAttribute('data-entry-back')){entryDone=false;render();return;}
if(t.dataset.sport){const s=t.dataset.sport;config.sports=config.sports.includes(s)?config.sports.filter(x=>x!==s):[...config.sports,s];coverDays();syncGoal();}
if(t.hasAttribute('data-return'))hist.returnReady=!hist.returnReady;
if(t.hasAttribute('data-moderate'))hist.alreadyToleratesModerate=!hist.alreadyToleratesModerate;
if(t.hasAttribute('data-beginner'))hist.run.beginnerEntryConfirmed=!hist.run.beginnerEntryConfirmed;
if(t.hasAttribute('data-swim'))config.swimAutonomy=!config.swimAutonomy;
if(t.dataset.hist){const[sp,k]=t.dataset.hist.split('.');hist[sp][k]=Number(t.dataset.val);hist.confirmed=false;saveDraft();}
if(t.hasAttribute('data-next')){generate();return;}
if(t.dataset.daytoggle!==undefined){const i=Number(t.dataset.daytoggle);const cur=selDays().slice();const n=cur.includes(i)?cur.filter(d=>d!==i):[...cur,i].sort((a,b)=>a-b);config.days=n;config.dayCount=n.length||null;coverDays();applyTimeBand();render();return;}
if(t.dataset.plansub!==undefined){planSub=t.dataset.plansub;render();return;}
if(t.dataset.view!==undefined){view=t.dataset.view;render();return;}
if(t.dataset.week!==undefined){wi=Number(t.dataset.week);sd=null;}
if(t.dataset.day!==undefined)sd=Number(t.dataset.day);
const a=t.dataset.action;
if(a==='goto-detail'){const _p=plan||preview;if(_p){const _tw=_p.weeks.findIndex(w=>w.start<=todayStr()&&H.dateAdd(w.start,7)>todayStr());if(_tw>=0){wi=_tw;sd=dow(todayStr());}view='calendar';render();const _dd=document.querySelector('.day-detail');if(_dd)_dd.scrollIntoView({behavior:'smooth'});}return;}
if(a==='goto-calendar'){view='calendar';render();return;}
if(a==='to-smart'){smartMode=true;hist=freshHist();if(plan){planBackup=plan;configBackup=JSON.parse(JSON.stringify(config));plan=null;}preview=null;entryDone=true;if(!S.SPORTS.some(sp=>(config.counts[sp]||0)>0))config.counts=autoCounts();if(config.level==='base'&&intent!=='start')config.level='intermediate';msg='SMART calcola le dosi sullo storico che inserisci: restano proposte da verificare con i riscontri.';}
if(a==='to-start'){smartMode=false;}
if(a==='review-budget'){render();const d=document.getElementById('ritmo');if(d){d.open=true;const g=document.getElementById('tempo-giorno');(g||d).scrollIntoView({block:'start'});}return;}
if(a==='review-choices'){render();const d=document.getElementById('ritmo');if(d){d.open=true;d.scrollIntoView({block:'start'});}return;}
if(a==='availability'){msg='Imposta i limiti per giorno e riconferma il passato recente: ricalcolo solo il futuro.';}
if(a==='rebase'||a==='availability'){rebaseOriginal=JSON.parse(JSON.stringify(plan));rebaseIndex=wi;start=H.dateAdd(plan.weeks[wi].start,7);plan=null;hist=freshHist();}
if(a==='restore-saved'&&planBackup){view='today';plan=planBackup;config=configBackup;planBackup=null;configBackup=null;editingFromPlan=false;try{sessionStorage.removeItem(KEY+'.draft');}catch(e){}msg='Piano salvato ripristinato: nessuna modifica applicata.';}
if(a==='undo'){if(undo){plan=undo;undo=null;save();msg='Modifica annullata.';}}
if(a==='apply'){view='today';if(rebaseOriginal)undo=rebaseOriginal;plan=preview;preview=null;rebaseOriginal=null;rebaseIndex=null;planBackup=null;configBackup=null;editingFromPlan=false;try{sessionStorage.removeItem(KEY+'.draft');}catch(e){}save();msg='Piano salvato su questo dispositivo.';}
if(a==='cancel'){preview=null;}
if(a==='feedback'){const _t=todayStr();const _w=plan?plan.weeks.find(w=>w.start<=_t&&H.dateAdd(w.start,7)>_t):null;
if(!_w){msg='Nessuna settimana del percorso in corso oggi: il riscontro non e stato registrato.';render();return;}
const _fwi=plan.weeks.indexOf(_w);
const r=WolfAdapt.feedback(plan,_fwi,feedback);undo=JSON.parse(JSON.stringify(plan));if(r.requiresConfirmation){changePreview=r;msg=r.reason;render();return;}if(!r.plan)throw Error(r.reason||r.status);if(r.plan)plan=r.plan;msg=r.status==='symptom-stop'?'Sintomi: progressione sospesa.':r.status==='recovery-choice'?'Recupero da rivedere: nessun aumento confermato.':r.status==='repeat-no-catchup'?'Niente recupero sedute perse: prossima proposta da rivedere.':'Riscontro soggettivo salvato. Non certifica distanze reali.';save();}
if(a==='move'){const r=WolfAdapt.move(plan,{weekIndex:wi,sessionId:document.getElementById('move-id').value,newDay:Number(document.getElementById('move-day').value),dayBudget:dayBudgets||Object.fromEntries(days.map((_,i)=>[i,dayCap]))});if(r.status!=='move-preview')throw Error(r.reason||r.status);changePreview=r;}
if(a==='adjust'){const minv=document.getElementById('adj-min').value;const r=WolfAdapt.adjust(plan,{weekIndex:wi,sessionId:document.getElementById('adj-id').value,minutes:minv?Number(minv):null,sport:document.getElementById('adj-sport').value||null});if(r.status!=='adjust-preview')throw Error(r.reason||r.status);changePreview=r;}
if(a==='add-session'){const r=WolfAdapt.addSession(plan,{weekIndex:wi,day:Number(document.getElementById('add-day').value),sport:document.getElementById('add-sport').value,minutes:Number(document.getElementById('add-min').value),intensity:document.getElementById('add-int').value});if(r.status!=='add-preview')throw Error(r.reason||r.status);changePreview=r;}
if(a==='sess-outcome'){const id=t.dataset.sess,w0=plan&&plan.weeks[Math.min(wi,plan.weeks.length-1)];const s0=w0&&w0.sessions.find(x=>x.id===id);if(!s0)throw Error('Seduta non trovata nella settimana mostrata.');
if(s0.date>todayStr())throw Error('La seduta non e ancora avvenuta: l\u2019esito si registra dopo.');
const mRaw=document.getElementById('rec-min-'+id).value,mv=Number(mRaw),rv=document.getElementById('rec-rpe-'+id).value;
if(!Number.isFinite(mv)||mv<1||mv>600){recDraft={id,min:mRaw,rpe:rv};throw Error('Inserisci i minuti effettivi (1-600).');}
if(rv===''){recDraft={id,min:mRaw,rpe:rv};throw Error('Scegli lo sforzo percepito (0-10).');}
recDraft=null;
undo=JSON.parse(JSON.stringify(plan));s0.actualMinutes=mv;s0.rpe=Number(rv);s0.outcomeRecordedAt=todayStr();save();msg='Esito seduta registrato: '+mv+' min effettivi, sforzo '+s0.rpe+'/10, carico '+Math.round(mv*s0.rpe)+' (min x sforzo).';}
if(a==='add-event'){const r=WolfAdapt.addEvent(plan,{date:document.getElementById('ev-date').value,label:document.getElementById('ev-label').value});if(r.status!=='event-preview')throw Error(r.reason||r.status);changePreview=r;}
if(a==='apply-change'){undo=JSON.parse(JSON.stringify(plan));plan=changePreview.plan;if(changePreview.config)config=changePreview.config;changePreview=null;save();msg='Modifica salvata.';}
if(a==='cancel-change')changePreview=null;
if(a==='workout-text'){const s=plan.weeks[wi].sessions.find(s=>s.id===document.getElementById('export-session').value);if(!s)throw Error('Nessuna seduta in questa settimana.');download(s.date+' '+s.sport.toUpperCase()+' WOLFLAB\n\n'+X.workoutText(s),'WOLFLAB-'+s.date+'-'+s.sport+'.txt','text/plain');}
if(a==='json')download(JSON.stringify({format:'wolf-web-coach-beta',config,plan},null,2),'WOLFLAB-piano.json','application/json');
if(['csv','ics','intervals','ride','workout-text'].includes(a)&&plan.weeks.some(w=>w.suspended))throw Error('Il futuro e sospeso: rivedi il percorso prima di esportare allenamenti. Il backup JSON conserva lo stato.');
if(a==='csv')download(X.csv(plan),'WOLFLAB-piano.csv','text/csv');
if(a==='ics')download(X.ics(plan),'WOLFLAB-piano.ics','text/calendar');
if(a==='intervals')download(JSON.stringify(X.events(plan),null,2),'WOLFLAB-intervals-payload.json','application/json');
if(a==='ride'){const s=plan.weeks[wi].sessions.find(s=>s.sport==='ride');if(!s)throw Error('Questa settimana non ha RIDE. ZWO non applicato ad altri sport.');const z=X.zwoRide(s);download(z.contents,z.filename,'application/xml');}
if(a==='reset'){if(plan){planBackup=plan;configBackup=JSON.parse(JSON.stringify(config));}plan=null;preview=null;changePreview=null;rebaseOriginal=null;smartMode=false;editingFromPlan=!!planBackup;entryDone=false;inferIntent();}
render();
}catch(e){msg=e.message;render();}
if(t.hasAttribute('data-next')||msg)window.scrollTo(0,0);
});
document.addEventListener('change',async ev=>{
if(ev.target.id==='restore'){try{const f=ev.target.files[0];if(!f||f.size>2e6)throw Error('Backup assente o troppo grande.');const d=JSON.parse(await f.text());if(!validBackup(d))throw Error('Backup non valido: nessuna modifica.');changePreview={plan:d.plan,config:d.config,requiresConfirmation:true,reason:'Ripristina solo il backup WOLFLAB selezionato. Il piano attuale non cambia finche confermi.'};msg='Controlla il ripristino prima di applicare.';render();}catch(e){msg=e.message;render();}return;}
if(ev.target.id==='start'){start=ev.target.value;saveDraft();return;}
if(ev.target.id==='event'){eventDate=ev.target.value;saveDraft();return;}
if(ev.target.dataset.budget!==undefined){if(!dayBudgets)dayBudgets=Object.fromEntries(days.map((_,i)=>[i,dayCap]));dayBudgets[Number(ev.target.dataset.budget)]=Number(ev.target.value);saveDraft();return;}
if(ev.target.id==='timeband'){timeBand=ev.target.value?Number(ev.target.value):null;applyTimeBand();saveDraft();render();return;}
if(ev.target.id==='week-nav'){wi=Number(ev.target.value);render();return;}
if(ev.target.dataset.select){const[s,k]=ev.target.dataset.select.split('.');hist[s][k]=ev.target.value===''?null:Number(ev.target.value);hist.confirmed=false;saveDraft();render();const pd=document.getElementById('precise');if(pd)pd.open=true;}
});
try{const d=JSON.parse(localStorage.getItem(KEY)||'null');if(d?.plan?.status==='provisional-whole-plan'){config=d.config;plan=d.plan;if(d.hist)hist=d.hist;start=d.start||nextMonday();eventDate=d.eventDate||'';dayCap=d.dayCap||120;dayBudgets=d.dayBudgets||null;timeBand=d.timeBand||null;}}catch(e){}
try{const d=JSON.parse(sessionStorage.getItem(KEY+'.draft')||'null');if(d?.config&&d.hist){if(d.fromPlan&&plan){planBackup=plan;configBackup=JSON.parse(JSON.stringify(config));plan=null;editingFromPlan=true;}if(!plan){config=d.config;hist=d.hist;step=Math.max(0,Math.min(3,d.step||0));start=d.start||nextMonday();eventDate=d.eventDate||'';dayCap=d.dayCap||120;dayBudgets=d.dayBudgets||null;entryDone=d.entryDone===true;intent=d.intent||null;smartMode=d.smartMode===true;timeBand=d.timeBand||null;if(!('entryDone' in d))inferIntent();}}}catch(e){}
render();
})();
