// quality.js v2 - P3 structured quality layer. Spec of record: P3-spec-coach.md v3 (03/11/2026)
// + writer review 11:44 (recuperi deterministici conteggiati, minuti noti conservati, regola
// centrale dichiarata, separazione cross-sport reale, strengthExp usato, metodo operativo breve).
// Every published quantity traces to: declared habit input, cited published convention, or a
// product convention explicitly labeled as such. Unknown habit is never treated as zero.
(function(){
'use strict';
const ADJ=(a,b)=>[1,6].includes(Math.abs(a-b));
const DAYN=['lun','mar','mer','gio','ven','sab','dom'];
const copy=x=>JSON.parse(JSON.stringify(x));
function combos(a,k){const out=[];(function rec(i,pre){if(pre.length===k){out.push(pre);return;}for(let j=i;j<a.length;j++)rec(j+1,[...pre,a[j]]);})(0,[]);return out;}
function fmtT(s){s=Math.round(s);return Math.floor(s/60)+'\u2032'+String(s%60).padStart(2,'0')+'\u2033';}
function fmtPace(p){const m=Math.floor(p);return m+'\u2032'+String(Math.round((p-m)*60)).padStart(2,'0')+'\u2033';}
function apply(plan,config,hist,options){
 if(plan?.status!=='provisional-whole-plan')return plan;
 const n=copy(plan),notes=[],offeredFor=[];
 const fp=acceptFingerprint(config,hist);
 for(const w of n.weeks){
  const lbl=w.recoveryWeek===true?'Settimana di scarico':'Settimana di avvicinamento evento',redTxt=w.recoveryWeek===true?'(-30%)':'(riduzione di avvicinamento, convenzione pubblicata)';
  if(w.eventWeek===true){notes.push('Settimana evento: nessuna qualita aggiunta dal planner (settimana parziale fino all\u2019evento); conteggio sedute mantenuto.');continue;}
  const runs=w.sessions.filter(s=>s.sport==='run'&&Number.isFinite(s.km));
  // --- RUN quality ---
  const q=hist?.runQuality;
  if((q==null)&&runs.length&&config.runMode!=='beginner'&&!offeredFor.includes('RUN'))offeredFor.push('RUN');
  if(q>0&&runs.length&&config.runMode!=='beginner'){
   const easyP=Number.isFinite(hist?.run?.easyMinutesPerKm)?hist.run.easyMinutesPerKm:null;
   const susP=Number.isFinite(hist?.run?.sustainedPace)?hist.run.sustainedPace:null;
   const long=runs.find(s=>s.role==='endurance')||runs.reduce((a,b)=>a.km>=b.km?a:b);
   const W=runs.reduce((a,s)=>a+s.km,0);
   // Declared rule: sustained central <= 10% of weekly km (GVH/Daniels), rounded DOWN to 0.5 km.
   const per=Math.floor((0.10*W)/q*2)/2;
   const deload=w.recoveryWeek===true||w.originalTaperChoice===true;
   if(per<1){if(!deload)return{status:'quality-placement-conflict',qualityConflict:true,canReduce:q>1,canAccept:false,reason:'Il volume RUN dichiarato ('+W.toFixed(1)+' km) non copre riscaldamento (2 km), parte sostenuta e defaticamento (1,5 km) per '+q+' sedute di qualita. Riduci il numero di qualita o aggiorna la tua abitudine reale.'};notes.push(lbl+': volume RUN ridotto '+redTxt+', qualita rimossa; conteggio sedute mantenuto.');}
   if(per>=1){
   const cand=runs.filter(s=>s!==long);let chosen=null;
   if(cand.length>=q)for(const c of combos(cand,q)){if(c.every(s=>!ADJ(s.day,long.day))&&c.every((s,i)=>c.every((t,j)=>j<=i||!ADJ(s.day,t.day)))){chosen=c;break;}}
   if(!chosen){
    if(hist?.runQualityAcceptAdjacent===fp){
     chosen=cand.slice(0,q);
     if(chosen.length<q)return{status:'quality-placement-conflict',qualityConflict:true,canReduce:q>1,canAccept:false,reason:'Servono almeno '+(q+1)+' corse per '+q+' qualita piu il lungo: riduci le qualita o aggiungi corse reali ai tuoi giorni.'};
     notes.push('Adiacenza accettata esplicitamente da te: la separazione qualita/lungo (convenzione "hard-easy") non e rispettata. Dichiarato, non nascosto.');
    }else{
     return{status:'quality-placement-conflict',qualityConflict:true,canReduce:q>1,canAccept:true,reason:'Con i giorni che hai scelto non riesco a separare le qualita dal lungo e tra loro (convenzione pubblicata "hard-easy": giorni facili tra gli stimoli sostenuti). Puoi ridurre il numero di qualita, cambiare i giorni disponibili, oppure accettare l\u2019adiacenza dichiarandola: nessuna soluzione silenziosa.'};
    }
   }
   for(const s of chosen){
    const wu=Math.min(2,s.km*0.3),cd=1.5;
    let central=Math.min(per,s.km-wu-cd);
    if(central<1){if(!deload)return{status:'quality-placement-conflict',qualityConflict:true,canReduce:q>1,canAccept:false,reason:'La singola corsa non copre riscaldamento + parte sostenuta + defaticamento. Riduci le qualita o aggiorna l\u2019abitudine.'};notes.push(lbl+': una corsa troppo breve per la struttura ridotta resta facile; conteggio mantenuto.');continue;}
    // Declared deterministic shape: central <=2.5 km one block; above, 2 blocks with two explicit
    // 90" jog recoveries (between the blocks and before the cooldown), counted in distance and time.
    const split=central>2.5;
    const recMin=split?3:0; // 2 x 90"
    const recKm=split&&easyP?Math.floor((1.5/easyP)*100)/100:0; // km per 90" jog... computed below per-recovery
    const recKmOne=easyP?Math.floor(((90/60)/easyP)*100)/100:0; // 90" in min / pace min-per-km, floor 10 m
    const recKmTot=split?recKmOne*2:0;
    const kmTot=wu+central+recKmTot+cd;
    s.role='quality';s.qualityStructure={wuKm:wu,centralKm:central,cdKm:cd,split,recKm:recKmTot,recMin};
    s.km=Math.round(kmTot*100)/100;
    s.intensity='Sostenuta (talk test "non comodo")';
    const shape=split?('2 tratti da '+(central/2).toFixed(2).replace(/\.?0+$/,'')+' km sostenuti, recupero 90" di jog (~'+Math.round(recKmOne*1000)+' m) tra i tratti e 90" di jog prima del defaticamento'):('un tratto unico da '+central.toFixed(1)+' km sostenuto');
    if(easyP&&susP){
     s.minutesExact=wu*easyP+central*susP+recMin+cd*easyP;s.minutes=Math.round(s.minutesExact);
     s.method='Riscaldamento '+wu.toFixed(1)+' km facile (~'+Math.round(wu*easyP)+'\u2032). Parte sostenuta: '+shape+', talk test "non comodo" (parli a frasi corte), ~'+Math.round(central*susP+recMin)+'\u2032 stimati al tuo passo sostenuto dichiarato '+fmtPace(susP)+'/km. Defaticamento '+cd.toFixed(1)+' km facile (~'+Math.round(cd*easyP)+'\u2032).\nDurate stimate dai passi che hai dichiarato: non garanzia dei tempi effettivi. Il passo sostenuto dichiarato e una tua stima, NON una soglia misurata. Convenzioni e fonti in "Metodo, fonti e limiti".';
     notes.push('Durate qualita RUN stimate dai tuoi passi dichiarati (facile + sostenuto): stime su dati tuoi, non garanzia dei tempi effettivi.');
    }else if(easyP){
     // Keep the KNOWN minutes (wu + recoveries + cd): totals and budgets read a declared lower bound.
     s.minutesExact=wu*easyP+recMin+cd*easyP;s.minutes=Math.round(s.minutesExact);s.minutesPartial=true;
     s.timeFeasibilityUnverified=true;s.qualityUnknownTime=true;s.qualityCentralUnknownKm=central;
     s.method='Riscaldamento '+wu.toFixed(1)+' km facile (~'+Math.round(wu*easyP)+'\u2032). Parte sostenuta: '+shape+', talk test "non comodo" (parli a frasi corte). Defaticamento '+cd.toFixed(1)+' km facile (~'+Math.round(cd*easyP)+'\u2032).\nMinuti noti conteggiati (riscaldamento'+(split?'+recuperi':'')+'+defaticamento): '+s.minutes+'\u2032. La parte sostenuta NON ha durata calcolata: manca il passo sostenuto recente dichiarato (lo aggiungi in Modifica scelte, stima non soglia). Convenzioni e fonti in "Metodo, fonti e limiti".';
    }else{
     delete s.minutes;s.timeFeasibilityUnverified=true;s.qualityUnknownTime=true;s.qualityCentralUnknownKm=central;
     s.method='Riscaldamento '+wu.toFixed(1)+' km facile. Parte sostenuta: '+shape+', talk test "non comodo" (parli a frasi corte). Defaticamento '+cd.toFixed(1)+' km facile.\nNessuna durata calcolata: servono passo facile E passo sostenuto recente dichiarati in Modifica scelte (stime su dati tuoi, non soglie misurate). Senza, intensita a talk test e controlli tempo parziali. Convenzioni e fonti in "Metodo, fonti e limiti".';
    }
   }
   if(chosen.length){
    const facili=runs.filter(s=>s!==long&&!chosen.includes(s));
    const rest=W-long.km-chosen.reduce((a,s)=>a+s.km,0);
    if(facili.length&&rest<0){if(!deload)return{status:'quality-placement-conflict',qualityConflict:true,canReduce:q>1,canAccept:false,reason:'Struttura e recuperi superano i km dichiarati: riduci le qualita o aggiorna l\u2019abitudine.'};}
    if(facili.length&&rest>=0){const per2=rest/facili.length;for(const s of facili){s.km=per2;if(Number.isFinite(hist.run.easyMinutesPerKm))s.minutes=Math.ceil(s.km*hist.run.easyMinutesPerKm);}}
    if(!(easyP&&susP))n.missingQualityTimeFor=['run'];
    w.phase=(w.phase||'')+((easyP&&susP)?' · qualita: durate stimate dai tuoi passi dichiarati':' · qualita: distanza strutturata, parte sostenuta senza durata (controlli tempo parziali)');
    if(n.weeks.length===1)n.reason=(n.reason||'')+' Qualita RUN applicata alla settimana generata: il percorso di piu settimane si sblocca quando ogni sport ha abitudine e riferimento di durata.';
    if(deload){notes.push(lbl+': parte sostenuta ridotta insieme al volume '+redTxt+'; conteggio delle qualita mantenuto.');for(const s2 of chosen)if(s2.role==='quality'&&s2.method)s2.method=lbl+': parte sostenuta ridotta insieme al volume '+redTxt+'. '+s2.method;}
   }}
  }
  // --- hard days accumulate across sports (run first, then each cross-sport quality) ---
  const hardDays=[];
  const hardRunDays=w.sessions.filter(s=>s.sport==='run'&&(s.role==='quality'||s.role==='endurance')).map(s=>s.day);
  hardDays.push(...hardRunDays);
  const farFrom=days=>(s=>Math.min(...days.map(d=>Math.abs(s.day-d)),7));
  const tryPick=(sessions,k)=>{if(k<=0)return[];for(const c of combos(sessions,k)){if(c.every(x=>!hardDays.some(d=>ADJ(d,x.day)))&&c.every((x,i)=>c.every((t,j)=>j<=i||!ADJ(x.day,t.day))))return c;}return null;};
  // --- RIDE quality (minutes stay known; product convention) ---
  const rides=w.sessions.filter(s=>s.sport==='ride'&&Number.isFinite(s.minutes));
  const qr=hist?.rideQuality;
  if((qr==null)&&rides.length)if(!offeredFor.includes('RIDE'))offeredFor.push('RIDE');
  if(qr>0&&rides.length){
   if(qr>rides.length)return{status:'quality-placement-conflict',qualityConflict:true,sport:'ride',canReduce:true,canAccept:false,reason:'Hai dichiarato '+qr+' qualita RIDE ma nella settimana ci sono '+rides.length+' sedute RIDE. Riduci il numero di qualita o aggiungi sedute RIDE reali: nessuna riduzione silenziosa.'};
   let picked=tryPick(rides,qr);
   if(!picked){
    if(hist?.rideQualityAcceptAdjacent===fp){
     picked=rides.slice().sort((a,b)=>farFrom(hardDays)(b)-farFrom(hardDays)(a)||a.day-b.day).slice(0,qr);
     notes.push('Adiacenza RIDE con sedute impegnative accettata esplicitamente da te: la separazione hard-easy non e rispettata. Dichiarato, non nascosto. L’accettazione vale solo per questa configurazione di giorni, sport e sedute.');
    }else return{status:'quality-placement-conflict',qualityConflict:true,sport:'ride',canReduce:qr>1,canAccept:true,reason:'Con i giorni scelti non riesco a separare le qualita RIDE dalle sedute impegnative gia fissate (lungo o qualita corsa, o qualita di altri sport; convenzione pubblicata "hard-easy"). Puoi ridurre le qualita RIDE, cambiare i giorni disponibili, oppure accettare l’adiacenza dichiarandola: nessuna soluzione silenziosa. L’accettazione vale solo per questa configurazione.'};
   }
   const deloadR=w.recoveryWeek===true||w.originalTaperChoice===true;
   for(const s of picked){
    const central=Math.round(s.minutes*0.25),wu=15,cd=s.minutes-wu-central;
    if(cd<5){notes.push('RIDE: seduta di '+s.minutes+'\u2032 troppo breve per la struttura qualita (wu 15\u2032 + centrale + cd): resta facile.');continue;}
    s.role='quality';s.intensity='Sostenuta (talk test "non comodo")';
    s.method='Riscaldamento 15\u2032 facile + '+central+'\u2032 sostenuta: talk test "non comodo" + '+cd+'\u2032 defaticamento facile. Convenzione di prodotto dichiarata (fonti in "Metodo, fonti e limiti").';
    s.rideStructure={wuMin:15,centralMin:central,cdMin:cd,origin:'product-convention-talk-test'};
    hardDays.push(s.day);
   }
   if(deloadR&&picked.some(s=>s.role==='quality'))notes.push(lbl+': qualita RIDE ridotta con il volume '+redTxt+' o mantenuta facile se troppo breve; conteggi mantenuti.');
  }
  // --- SWIM quality (CSS only from declared 400m+200m tests) ---
  const swims=w.sessions.filter(s=>s.sport==='swim'&&Number.isFinite(s.minutes));
  const qs=hist?.swimQuality;
  if((qs==null)&&swims.length)if(!offeredFor.includes('SWIM'))offeredFor.push('SWIM');
  if(qs>0&&swims.length){
   if(qs>swims.length)return{status:'quality-placement-conflict',qualityConflict:true,sport:'swim',canReduce:true,canAccept:false,reason:'Hai dichiarato '+qs+' qualita SWIM ma nella settimana ci sono '+swims.length+' sedute SWIM. Riduci il numero di qualita o aggiungi sedute SWIM reali: nessuna riduzione silenziosa.'};
   let picked=tryPick(swims,qs);
   if(!picked){
    if(hist?.swimQualityAcceptAdjacent===fp){
     picked=swims.slice().sort((a,b)=>farFrom(hardDays)(b)-farFrom(hardDays)(a)||a.day-b.day).slice(0,qs);
     notes.push('Adiacenza SWIM con sedute impegnative accettata esplicitamente da te: la separazione hard-easy non e rispettata. Dichiarato, non nascosto. L’accettazione vale solo per questa configurazione di giorni, sport e sedute.');
    }else return{status:'quality-placement-conflict',qualityConflict:true,sport:'swim',canReduce:qs>1,canAccept:true,reason:'Con i giorni scelti non riesco a separare le qualita SWIM dalle sedute impegnative gia fissate (lungo o qualita corsa, o qualita di altri sport; convenzione pubblicata "hard-easy"). Puoi ridurre le qualita SWIM, cambiare i giorni disponibili, oppure accettare l’adiacenza dichiarandola: nessuna soluzione silenziosa. L’accettazione vale solo per questa configurazione.'};
   }
   const t400=hist?.swimTT?.t400,t200=hist?.swimTT?.t200;
   for(const s of picked){
    s.role='quality';s.intensity='Sostenuta';
    if(Number.isFinite(t400)&&Number.isFinite(t200)&&t400>t200){
     const css=200/(t400-t200),pace100=100/css; // full precision internally
     s.method='Serie principale: 5 x 200 m a '+fmtT(pace100+2)+'/100 m (CSS + 2"), recupero 20" tra le ripetute; resto della seduta facile.\nCSS dai tuoi test dichiarati 400 m e 200 m: riferimento di ritmo sostenuto, NON soglia fisiologica. Convenzioni, fonti e limiti in "Metodo, fonti e limiti". Se i metri della serie superano i tuoi metri abituali riduci le ripetute: mai oltre il volume dichiarato.';
    }else{
     s.method='Tratti sostenuti a sforzo 7/10 (fiato corto, ritmo tenibile a fatica) dentro i tuoi metri/minuti abituali, recuperi liberi. Nessun ritmo numerico: senza i test 400 m + 200 m (Modifica scelte) la CSS non esiste, e non la inventiamo.';
    }
    hardDays.push(s.day);
   }
  }
  // --- Strength template (opt-in; experience changes the dose) ---
  const str=w.sessions.filter(s=>s.sport==='strength');
  if(hist?.strengthTemplate&&str.length){
   const exp=hist?.strengthExp,sets=(exp==='intermediate'||exp==='advanced')?'1-2':'1';
   const setsWhy=(exp==='intermediate'||exp==='advanced')?'1-2 serie per esperienza dichiarata '+exp:'1 serie: esperienza non dichiarata o principiante, partenza conservativa';
   const T=[['Squat o leg press'],['Stacco da terra o hinge (variante comoda)'],['Spinta: panca o piegamenti sulle braccia'],['Trazione: rematore o trazioni assistite'],['Core: plank o bird dog']];
   for(const s of str){
    s.routine=T.map(([movement])=>({movement,sets,reps:'8-12 ripetizioni, 1-2 in riserva'}));
    s.method='Modello forza da convenzione ACSM 2009 (adulti sani): 5 esercizi multiarticolari, '+setsWhy+', 8-12 ripetizioni lasciando SEMPRE 1-2 in riserva, mai a cedimento. Carichi scelti da te: nessun peso numerico prescritto. Convenzione generale di salute, non prescrizione individuale.';
   }
  }
  // --- Strength the day before a run quality: declared note, never a silent move ---
  const qRunDays=w.sessions.filter(s=>s.sport==='run'&&s.role==='quality').map(s=>s.day);
  for(const s of str)if(qRunDays.includes((s.day+1)%7))notes.push('FORZA alla vigilia di una qualita corsa: se puoi spostala (fonti in "Metodo, fonti e limiti"). Nessuno spostamento automatico.');
 }
 if(offeredFor.length)n.qualityOffered=offeredFor;
 if(notes.length)n.qualityNotes=[...new Set(notes)];
 // re-check daily caps after restructuring, ALL weeks (minutes may have moved between days);
 // known minutes only = lower bound (partial). Provable overrun -> explicit conflict, no silent cut.
 if(options&&options.dayMinutes&&typeof options.dayMinutes==='object'){
  for(let wi=0;wi<(n.weeks||[]).length;wi++){
   const ws=n.weeks[wi].sessions||[];
   for(let d=0;d<7;d++){
    const cap=options.dayMinutes[d];
    if(!Number.isFinite(cap))continue;
    const ds=ws.filter(t=>t.day===d&&Number.isFinite(t.minutes));
    if(!ds.length)continue;
    const known=ds.reduce((a,t)=>a+(t.minutesExact??t.minutes),0);
    if(known>cap){
     const partial=ws.some(t=>t.day===d&&(!Number.isFinite(t.minutes)||t.minutesPartial));
     return{status:'time-budget-conflict',week:wi+1,day:d,neededMinutes:Math.ceil(known),availableMinutes:cap,partialMinutes:partial,conflictSessions:ds.map(t=>({sport:t.sport,minutes:t.minutes})),feasibleWeeks:n.weeks.slice(0,wi),conflictKind:wi>0?'future-development':'initial-week',notACompleteGoalPlan:wi>0,reason:'Con la struttura qualita i minuti '+(partial?'noti ':'')+'di '+DAYN[d]+' (settimana '+(wi+1)+': '+Math.ceil(known)+'\u2032) superano il limite ('+cap+'\u2032).'+(partial?' Conteggio parziale: le parti senza durata restano non verificate, quindi il totale reale e almeno questo.':'')+' Nessun input cambiato.'};
    }
   }
  }
 }
 return n;
}
function acceptFingerprint(config,hist){return JSON.stringify({d:(config&&config.days||[]).slice().sort((a,b)=>a-b),sp:(config&&config.sports||[]).slice().sort(),c:['run','ride','swim','strength'].map(x=>config&&config.counts&&config.counts[x]||0),q:[hist&&hist.runQuality!=null?hist.runQuality:null,hist&&hist.rideQuality!=null?hist.rideQuality:null,hist&&hist.swimQuality!=null?hist.swimQuality:null]});}
window.WolfQuality={apply,acceptFingerprint};
})();
