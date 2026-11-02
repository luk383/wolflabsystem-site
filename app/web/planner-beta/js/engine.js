(function(root){'use strict';
const P=typeof module!=='undefined'?require('./planner'):root.WolfPlanner,R=typeof module!=='undefined'?require('./replan'):root.WolfReplan,E=typeof module!=='undefined'?require('./endurance-policy'):root.WolfEndurance;
const copy=P.clone;
function build(c){
 if(!c||!c.confirmed||!P.dateValid(c.start)||new Date(c.start+'T12:00:00Z').getUTCDay()!==1)return{error:'Conferma la tua settimana reale e il lunedi di inizio.'};
 if(!Array.isArray(c.rows)||!c.rows.length||c.rows.length>7||new Set(c.rows.map(s=>s.day)).size!==c.rows.length)return{error:'Scegli1-7sedute su giorni distinti. Una seduta endurance al giorno.'};
 if(c.rows.some(s=>!P.SPORTS.includes(s.sport)||!Number.isInteger(s.day)||s.day<0||s.day>6||!Number.isInteger(s.minutes)||s.minutes<5||s.minutes>240||s.sport==='run'&&(!Number.isFinite(s.km)||s.km<=0)))return{error:'Completa giorni, tempo e distanza reali di ogni seduta.'};
 if(!Number.isInteger(c.maxMinutes)||c.maxMinutes<5||c.rows.some(s=>s.minutes>c.maxMinutes))return{error:'La durata abituale supera il tempo disponibile. Non la taglio automaticamente.'};
 const run=c.rows.filter(s=>s.sport==='run');if(run.length&&c.currentRunFrequency!==run.length)return{error:'Prima crea la settimana alla frequenza attuale; dopo due riscontri potrai valutare un solo giorno nuovo.'};
 const sports=Object.fromEntries(P.SPORTS.map(s=>[s,{freq:c.rows.filter(t=>t.sport===s).length,minutes:0,level:'base'}]));
 const sessions=c.rows.map((s,i)=>({...copy(s),id:'w0s'+i,policySessionId:s.sport==='run'?'r'+i:undefined,date:P.dateAdd(c.start,s.day),originalMinutes:s.minutes,status:'planned',actual:null,rpe:null,note:'',fastidio:false,kind:'easy',qualityMinutes:0,distanceKm:s.sport==='run'?s.km:undefined,purpose:'Seduta facile dalla tua abitudine reale'}));
 // All selected days are already habitual: automatic reflow keeps that distribution.
 const p={schema:'wolf-web-planner-1',rulesVersion:'original-endurance-v4',config:{start:c.start,primary:run.length?'run':c.rows[0].sport,goal:'base',confirmedConsecutiveHabit:true,preserveHabitDays:true,sports,days:Array.from({length:7},()=>({cap:c.maxMinutes,strength:0,windows:[{start:'08:00',end:'20:00'}]}))},weeks:[{index:0,label:'La tua partenza',sessions}],events:[],calendarRevision:0,targetIntent:{goal:run.length?c.goal:'habit',originalSetup:copy(c)},createdAt:new Date().toISOString()};
 if(run.length){const q=E.initialize({goal:c.goal,habitConfirmed:true,sessions:sessions.filter(s=>s.sport==='run').map(s=>({id:s.policySessionId,day:s.day,minutes:s.minutes,km:s.km}))});if(!q.plan)return{error:'Base RUN non valida.'};p.targetPrescription=q.plan;}
 const q=R.initialize(p);if(q.error)return q;return{plan:R.apply(p,q).plan,reason:'Prima settimana dalla tua abitudine reale. Orari proposti08:00-20:00, modificabili; nessuna gara o data inventata.'};
}
function report(p,asOf){
 const w=p.weeks.at(-1),end=P.dateAdd(p.config.start,w.index*7+6);
 if(!P.dateValid(asOf)||asOf<end)return{error:'La settimana non e conclusa. Puoi modificare il calendario, non anticipare i riscontri.'};
 if(asOf>P.dateAdd(end,7))return{error:'Dopo questa pausa riparti da una settimana attuale confermata. Non accumulo sedute perse.'};
 const sessions=[];
 for(const s of w.sessions){const f=s.response;if(!f||!['done','partial','skipped'].includes(s.status)||!['yes','no'].includes(f.recovered)||!['yes','no'].includes(f.symptoms)||!['yes','no'].includes(f.unexpectedEffort))return{error:'Completa esito e riscontri di ogni seduta.'};
  if(s.status!=='skipped'&&(!Number.isFinite(s.actual)||s.actual<=0||s.sport==='run'&&(!Number.isFinite(s.distanceActualKm)||s.distanceActualKm<=0)))return{error:'Seleziona tempo e distanza realmente svolti. Non copio la dose prevista.'};
  sessions.push({id:s.policySessionId||s.id,sport:s.sport,status:s.status,actualMinutes:s.status==='skipped'?0:s.actual,actualKm:s.sport==='run'?(s.status==='skipped'?0:s.distanceActualKm):undefined,recovered:f.recovered==='yes',symptoms:f.symptoms==='yes',unexpectedEffort:f.unexpectedEffort==='yes'});
 }
 return{period:end,asOf,sessions:sessions.filter(s=>s.sport==='run'),otherSports:sessions.filter(s=>s.sport!=='run'),combinedRecovered:sessions.filter(s=>s.sport!=='run').every(s=>s.status==='done'&&s.recovered&&!s.symptoms&&!s.unexpectedEffort),all:sessions};
}
function next(p,asOf,mode){
 if(!valid(p))return{error:'Piano non valido.'};if(p.weeks.flatMap(w=>w.sessions).some(s=>s.response?.symptoms==='yes'))return{error:'Sintomi nello storico del percorso: niente nuove proposte automatiche di carico. Riconferma una partenza attuale soltanto dopo aver chiarito la ripresa, non come autorizzazione medica.'};if(p.weeks.length>=156)return{error:'Esporta lo storico prima di iniziare un nuovo percorso.'};
 const r=report(p,asOf);if(r.error)return r;
 if(r.all.some(s=>s.symptoms))return{error:'Sintomi o fastidi: sospendo le nuove proposte di carico. Questo planner non decide una ripresa clinica.'};
 if(r.all.some(s=>!s.recovered||s.unexpectedEffort))return{error:'Recupero o sforzo da rivedere. Non propongo aumenti: puoi ridurre o saltare le sedute future nel calendario e ripartire dalla tua capacita attuale.'};
 if(p.weeks.at(-1).sessions.some(s=>s.distanceReviewRequired))return{error:'Hai modificato le dosi. Riconferma una settimana attuale, invece di usare la vecchia prescrizione.'};
 let state=p.targetPrescription,q={status:'repeat'};
 if(state){const o=E.observe(state,r);if(!o.plan)return{error:'Riscontro gia usato o periodo non valido.'};state=o.plan;q=mode==='repeat'?{status:'repeat',plan:state}:E.next(state,Object.fromEntries(p.config.days.map((d,i)=>[i,d.cap])));
 if(['symptom-stop','recovery-choice'].includes(q.status))return{error:'Recupero da rivedere; nessun aumento.'};
 if(q.status==='frequency-outside-supported-development'&&mode!=='repeat')return{error:'Per questo traguardo la versione attuale richiede almeno'+E.GOALS[state.goal].minFrequency+'uscite gia abituali. Conservo il calendario, non invento preparazione con meno sedute.'};
 if(q.status==='milestone-review')return{error:'Hai praticato i riferimenti di questa fase. Non significa prontezza gara. Mantieni o riconferma una nuova fase; nessuna distanza gara automatica.'};
 if(mode==='repeat')q={status:'repeat',plan:state};
 if(!['repeat','duration-proposal'].includes(q.status))return{error:q.status==='long-duration-feasibility'?'Il lungo supererebbe180minuti, fuori dal supporto di questa versione. Non prometto una preparazione completa in questo caso.':q.status==='availability-choice'?'La nuova durata non entra nel tempo disponibile. Modifica tu la disponibilita o ripeti la dose.':'La distribuzione richiede una nuova conferma della base attuale.'};
 }
 if(mode==='repeat')q={status:'repeat',plan:state};
 const n=copy(p),index=n.weeks.length,previous=n.weeks.at(-1),policy=q.plan||state;
 const ns=previous.sessions.map(old=>{const target=old.sport==='run'&&policy?policy.sessions.find(s=>s.id===old.policySessionId):null;if(target&&target.day!==old.day)target.day=old.day;return{...copy(old),id:'w'+index+'-'+old.sport+'-'+(old.policySessionId||old.id.replace(/^w\d+-/,'')),date:P.dateAdd(p.config.start,index*7+old.day),minutes:target?target.minutes:old.minutes,originalMinutes:target?target.minutes:old.minutes,distanceKm:target?target.km:old.distanceKm,estimatedDistance:!!target&&q.status==='duration-proposal',status:'planned',actual:null,distanceActualKm:undefined,response:undefined,rpe:null,note:'',fastidio:false,startTime:undefined};});
 n.weeks.push({index,label:q.status==='duration-proposal'?'Sviluppo facile in durata':'Consolidamento dalla tua base',sessions:ns});if(policy){n.targetPrescription=copy(policy);if(n.targetPrescription.sessions.every(s=>Number.isFinite(s.km)&&s.km>0))n.targetPrescription.awaitingNewFrequencyActuals=false;}
 const init=R.initialize(n);if(init.error)return init;const applied=R.apply(n,init);if(applied.error)return applied;
 return{plan:applied.plan,reason:q.status==='duration-proposal'?'Proposta originale: piccoli aumenti di durata dopo due settimane tollerate. Distanze stimate da tempo/distanza reali, non un ritmo imposto o una soglia sicura.':'Stesse dosi: nessun aumento e nessun recupero delle sedute perse.',changed:q.status==='duration-proposal'};
}
function changeFrequency(p,request,asOf){
 if(!valid(p)||!p.targetPrescription)return{error:'Serve un percorso RUN continuo attuale.'};if(p.weeks.flatMap(w=>w.sessions).some(s=>s.response?.symptoms==='yes'))return{error:'Sintomi nello storico: nessun cambio automatico di frequenza.'};
 const reportNow=report(p,asOf);if(reportNow.error)return reportNow;
 if(reportNow.all.some(s=>s.symptoms||!s.recovered||s.unexpectedEffort||s.status!=='done'))return{error:'Il cambio frequenza richiede riscontri completi, recupero e assenza di sintomi su tutti gli sport.'};
 const observed=E.observe(p.targetPrescription,reportNow);if(!observed.plan)return{error:'Periodo gia utilizzato o non valido.'};
 const state=observed.plan,tail=state.observations.slice(-2),signature=JSON.stringify(state.sessions.map(s=>[s.id,s.day,s.minutes,s.km]));
 if(tail.length!==2||tail.some(t=>!t.tolerated||t.dose!==signature)||Date.parse(tail[1].period)-Date.parse(tail[0].period)!==604800000)return{error:'Servono due settimane effettive alla stessa dose prima di cambiare frequenza.'};
 if(!request?.confirmed)return{error:'Conferma il giorno e il cambiamento di volume mostrato.'};
 const current=state.sessions.length;if(![1,2].includes(current)||request.desiredFrequency!==current+1)return{error:'Questa transizione copre solo1->2o2->3uscite. Nessun salto automatico maggiore.'};
 const day=request.addedDay;if(!Number.isInteger(day)||day<0||day>6||p.weeks.at(-1).sessions.some(s=>s.day===day)||state.sessions.some(s=>[1,6].includes(Math.abs(s.day-day))))return{error:'Scegli un giorno libero e non adiacente alle altre RUN. Non sposto gli sport esistenti.'};
 if(p.config.days[day].cap<5)return{error:'Servono almeno5minuti disponibili sul nuovo giorno.'};
 const n=P.clone(p),index=n.weeks.length,prior=n.weeks.at(-1),policy=P.clone(state),id='r-new-'+day;
 policy.sessions.push({id,day,minutes:5,km:null,needsActualDistance:true});policy.observations=[];policy.awaitingNewFrequencyActuals=true;
 const sessions=prior.sessions.map(old=>({...P.clone(old),id:'w'+index+'-'+old.sport+'-'+(old.policySessionId||old.id.replace(/^w\d+-/,'')),date:P.dateAdd(p.config.start,index*7+old.day),status:'planned',actual:null,distanceActualKm:undefined,response:undefined,rpe:null,note:'',fastidio:false,startTime:undefined}));
 sessions.push({id:'w'+index+'-run-'+id,policySessionId:id,sport:'run',day,date:P.dateAdd(p.config.start,index*7+day),minutes:5,originalMinutes:5,distanceKm:null,status:'planned',actual:null,rpe:null,note:'',fastidio:false,kind:'easy',qualityMinutes:0,purpose:'Nuovo giorno RUNfacile5min, distanza non presunta',frequencyEntry:true});
 n.config.sports.run.freq++;n.weeks.push({index,label:'Nuova frequenza da osservare',sessions});n.targetPrescription=policy;n.frequencyTransition={from:current,to:current+1,extraWeeklyMinutes:5,addedDay:day,pendingActuals:true};
 const init=R.initialize(n);if(init.error)return init;const applied=R.apply(n,init);if(applied.error)return applied;
 return{plan:applied.plan,reason:'Aggiungi un giorno nuovo con 5 minuti facili. Le altre sedute restano uguali: 5 minuti settimanali in piu, non carico equivalente. Scelta originale, non soglia sicura. Due settimane reali alla nuova frequenza prima di altra progressione; distanza nuova non stimata.'};
}
function reduceFrequency(p,request,asOf){
 if(!valid(p)||!p.targetPrescription||!request?.confirmed)return{error:'Conferma la seduta da rimuovere e il volume inferiore.'};if(p.targetPrescription.awaitingNewFrequencyActuals)return{error:'Prima completa e misura la nuova frequenza, oppure riparti da una base attuale. Non concateno transizioni non osservate.'};if(p.weeks.flatMap(w=>w.sessions).some(s=>s.response?.symptoms==='yes'))return{error:'Sintomi nello storico: nessun cambio automatico di frequenza.'};
 const r=report(p,asOf);if(r.error)return r;if(r.all.some(s=>s.symptoms||!s.recovered||s.unexpectedEffort))return{error:'Recupero o sintomi da rivedere, non una decisione automatica sulla ripresa.'};
 const prior=p.weeks.at(-1),remove=prior.sessions.find(s=>s.policySessionId===request.removeId&&s.sport==='run');
 if(!remove||p.config.sports.run.freq<2)return{error:'Scegli una RUN esistente, lasciandone almeno una.'};
 const n=P.clone(p),index=n.weeks.length;n.config.sports.run.freq--;n.targetPrescription.sessions=n.targetPrescription.sessions.filter(s=>s.id!==request.removeId);n.targetPrescription.observations=[];
 if(n.targetPrescription.longId===request.removeId)n.targetPrescription.longId=n.targetPrescription.sessions.reduce((a,b)=>a.km>b.km?a:b).id;
 const sessions=prior.sessions.filter(s=>s.id!==remove.id).map(old=>({...P.clone(old),id:'w'+index+'-'+old.sport+'-'+(old.policySessionId||old.id.replace(/^w\d+-/,'')),date:P.dateAdd(p.config.start,index*7+old.day),status:'planned',actual:null,distanceActualKm:undefined,response:undefined,rpe:null,note:'',fastidio:false,startTime:undefined}));
 n.weeks.push({index,label:'Frequenza ridotta, volume non trasferito',sessions});n.frequencyReduction={removedId:request.removeId,removedMinutes:remove.minutes,volumeTransferred:false};
 const init=R.initialize(n);if(init.error)return init;const applied=R.apply(n,init);if(applied.error)return applied;return{plan:applied.plan,reason:'Rimuovi la RUN di '+remove.minutes+' minuti. Nessun minuto o km viene trasferito alle altre sedute. Due settimane di riscontri prima di rivalutare lo sviluppo. Il traguardo potrebbe non essere piu supportato a questa frequenza.'};
}
function valid(p){try{return R.valid(p)&&p.rulesVersion==='original-endurance-v4'&&p.targetIntent&&['5k','10k','half','marathon','habit'].includes(p.targetIntent.goal)&&(!p.targetPrescription||p.targetPrescription.version==='original-endurance-v4-private'&&p.targetPrescription.goal===p.targetIntent.goal&&Array.isArray(p.targetPrescription.sessions)&&p.targetPrescription.sessions.length===p.config.sports.run.freq&&new Set(p.targetPrescription.sessions.map(s=>s.id)).size===p.targetPrescription.sessions.length&&p.targetPrescription.sessions.every(s=>typeof s.id==='string'&&Number.isInteger(s.day)&&s.day>=0&&s.day<7&&Number.isInteger(s.minutes)&&s.minutes>=5&&s.minutes<=240&&(Number.isFinite(s.km)&&s.km>0&&s.km<=200||p.targetPrescription.awaitingNewFrequencyActuals&&s.km===null&&s.needsActualDistance===true))&&Array.isArray(p.targetPrescription.observations)&&p.targetPrescription.observations.length<=156)&&p.weeks.every(w=>w.sessions.every(s=>(s.distanceKm==null||Number.isFinite(s.distanceKm)&&s.distanceKm>0)&&(s.distanceActualKm==null||Number.isFinite(s.distanceActualKm)&&s.distanceActualKm>=0)));}catch(e){return false;}}
const api={build,next,report,valid,changeFrequency,reduceFrequency};if(typeof module!=='undefined')module.exports=api;else root.WolfEngine=api;
})(typeof window!=='undefined'?window:globalThis);
