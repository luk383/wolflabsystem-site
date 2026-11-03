// horizon.js v3 - unified volume/progression policy for NEW generations only.
// Saved plans are never recalculated: this applies when a plan is (re)generated explicitly.
// B9 RUN progression: adaptation to km (declared product convention) of the official
// Daniels mileage rule (+n.runs miles/week, max +10, hold >=4 weeks, never week 1;
// 10% rule discouraged): https://news.vdoto2.com/2015/07/how-to-increase-your-weekly-mileage/
// B10 deload: after every 4 load weeks, one week at -30% endurance volume (product
// convention from published models with planned recovery weeks:
// https://www.pfitzingercoaching.com/marathonplans + Seiler volume-reduction periodization).
// The deload includes RIDE/SWIM (B9 stability concerns increases, it does not forbid a
// deload) and leaves strength unchanged. RIDE/SWIM have no founded increase rule: stable.
// GOALS entries are distance REFERENCES that cap model growth: orientation upper bounds,
// never a promise of complete preparation from volume growth alone.
(function(){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x)),DAY=86400000;
const GOALS={fitness:{longKm:null,weeklyKm:null,minRuns:0,taperWeeks:0},'5k':{longKm:5,weeklyKm:12,minRuns:2,taperWeeks:1},'10k':{longKm:10,weeklyKm:24,minRuns:2,taperWeeks:1},half:{longKm:18,weeklyKm:40,minRuns:3,taperWeeks:2},marathon:{longKm:28,weeklyKm:64,minRuns:3,taperWeeks:3}};
function dateValid(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;}
function dateAdd(s,n){return new Date(Date.parse(s+'T12:00:00Z')+n*DAY).toISOString().slice(0,10);}
const DELOAD_PHASE='Scarico: volume endurance -30%. Include RIDE e SWIM, forza invariata';
function scaleDeload(w){for(const s of w.sessions){if(s.sport==='strength')continue;s.minutes=Math.max(5,Math.round(s.minutes*.7));if(Number.isFinite(s.km))s.km=s.km*.7;}}
function originalForecast(base,options){
 if(base?.status!=='aggregate-baseline-proposal'||!GOALS[base.week.goal]||!dateValid(options?.start)||options.eventDate&&!dateValid(options.eventDate))return{status:'invalid-forecast-input'};
 if(new Date(options.start+'T12:00:00Z').getUTCDay()!==1)return{status:'monday-start-needed',reason:'La settimana usa lunedi come partenza. Scegli un lunedi.'};
 const g=GOALS[base.week.goal],p=copy(base.week),run=p.sessions.filter(s=>s.sport==='run');
 if(base.week.goal==='fitness')return options.progressVolume===true?fitnessGrowth(base,options):maintenance(base,options);
 if(options.progressVolume===false)return maintenance(base,options);
 if(run.length<g.minRuns)return{status:'unsupported-target-frequency',desired:run.length,supportedMinimum:g.minRuns};
 if(run.some(s=>!Number.isFinite(s.km)||!Number.isFinite(s.minutes)||s.minutes<=0))return{status:'time-reference-needed',reason:'Serve un solo riferimento facile tempo/distanza o passo recente per verificare durate, non il tempo di ogni seduta.'};
 const long=run.find(s=>s.role==='endurance')||run.at(-1),weeklyRef=run.length===2?g.longKm*2:g.weeklyKm;
 const availableWeeks=options.eventDate?Math.floor((Date.parse(options.eventDate+'T12:00:00Z')-Date.parse(options.start+'T12:00:00Z'))/(7*DAY)):null;
 if(availableWeeks!==null&&availableWeeks>155)return{status:'event-outside-supported-horizon',reason:'La data supera il percorso supportato di 156 settimane.'};
 if(availableWeeks!==null&&availableWeeks<g.taperWeeks+2)return{status:'event-too-close',availableWeeks,reason:'Non concentro preparazione e recupero per far tornare la data.'};
 // B9: +1 km per run session (declared km adaptation of +n.runs miles; step capped at 10).
 const step=Math.min(run.length,10),curKm=new Map(run.map(s=>[s.id,s.km])),basePace=new Map(run.map(s=>[s.id,s.minutes/s.km]));
 const weeks=[];let loadAtLevel=0,increasesBlocked=false,blockedReason=null,milestone=null;
 const loadPhase=i=>['Base e regolarita','Costruzione della continuita','Resistenza verso la distanza'][Math.min(Math.floor(i/5),2)];
 for(let i=0;i<156;i++){
  const w=copy(p);w.index=i;w.start=dateAdd(options.start,i*7);
  const isDeload=i>0&&i%5===4;
  if(!isDeload){
   if(i>0&&loadAtLevel>=4&&!increasesBlocked){
    const weekly=run.reduce((a,s)=>a+curKm.get(s.id),0),longKm=curKm.get(long.id);
    if((longKm+1)*basePace.get(long.id)>180){increasesBlocked=true;blockedReason='Aumenti fermati: il lungo supererebbe 180 minuti, limite del supporto del modello (non una valutazione di prontezza). Volume stabile da qui.';}
    else if(weekly+step>weeklyRef+1e-9||longKm+1>g.longKm+1e-9){increasesBlocked=true;blockedReason='Riferimento distanza obiettivo raggiunto (lungo '+g.longKm+' km, volume '+weeklyRef+' km/settimana): orientamento del modello, NON promessa di preparazione completa dalla sola crescita di volume. Volume stabile da qui.';}
    else{for(const s of run)curKm.set(s.id,curKm.get(s.id)+1);loadAtLevel=0;}
   }
   loadAtLevel++;
  }
  for(const s of w.sessions){const km=curKm.get(s.id);if(km!==undefined){s.km=km;s.minutes=Math.ceil(km*basePace.get(s.id));}}
  if(isDeload){w.recoveryWeek=true;w.originalRecoveryChoice=true;w.phase=DELOAD_PHASE;scaleDeload(w);}
  else w.phase=increasesBlocked?'Volume stabile al riferimento o al limite del modello':loadPhase(i);
  w.provisional=i>0;w.assumption=i?'Ipotesi futura: sedute svolte, recupero adeguato e nessun sintomo. Non e aumento gia autorizzato.':'Prima settimana proposta dal passato aggregato';
  for(const s of w.sessions){s.date=dateAdd(w.start,s.day);s.actualKm=null;s.actualMinutes=null;if(options.dayMinutes&&Number.isFinite(options.dayMinutes[s.day])){const total=w.sessions.filter(t=>t.day===s.day).reduce((a,t)=>a+(t.minutes||0),0);if(total>options.dayMinutes[s.day])return{status:'time-budget-conflict',week:i+1,day:s.day,neededMinutes:Math.ceil(total),availableMinutes:options.dayMinutes[s.day],noSilentCut:true,conflictSessions:w.sessions.filter(t=>t.day===s.day).map(t=>({sport:t.sport,minutes:t.minutes})),feasibleWeeks:copy(weeks)};}}
  weeks.push(w);
  if(!w.recoveryWeek&&milestone===null&&increasesBlocked)milestone=i;
  if(availableWeeks!==null&&i>=availableWeeks-1)break;
  if(milestone!==null&&availableWeeks===null)break;
 }
 if(milestone===null&&availableWeeks===null)return{status:'forecast-outside-horizon',weeks:weeks.length};
 let eventReferenceGap=null;
 if(availableWeeks!==null){
  // Writer alignment (a): distance references with the new cadence, no promise of
  // complete preparation from volume growth alone. The date never compresses the model.
  const lastLoad=[...weeks].reverse().find(w=>!w.recoveryWeek)||weeks[weeks.length-1];
  const lRuns=lastLoad.sessions.filter(s=>s.sport==='run');
  const modelWeekly=lRuns.reduce((a,s)=>a+(s.km||0),0),modelLong=lRuns.length?Math.max(...lRuns.map(s=>s.km||0)):0;
  if(modelWeekly<weeklyRef-1e-9||modelLong<g.longKm-1e-9)eventReferenceGap={modelWeeklyKm:Math.round(modelWeekly*10)/10,modelLongKm:Math.round(modelLong*10)/10,referenceWeeklyKm:weeklyRef,referenceLongKm:g.longKm,message:'Alla data evento il modello arriva a ~'+(Math.round(modelWeekly*10)/10)+' km/settimana e lungo ~'+(Math.round(modelLong*10)/10)+' km, sotto i riferimenti distanza ('+weeklyRef+' km/settimana, lungo '+g.longKm+' km). La sola crescita di volume non e una preparazione completa e la data non comprime la progressione.'};
  // Include the actual event week. Source table distinguishes event week,
  // not an extra full week ending before event Monday.
  const eventStart=dateAdd(options.start,availableWeeks*7),eventDay=Math.round((Date.parse(options.eventDate+'T12:00:00Z')-Date.parse(eventStart+'T12:00:00Z'))/DAY),event=copy(p);event.index=availableWeeks;event.start=eventStart;event.phase='Settimana evento: scarico e scelta finale';event.provisional=true;event.eventWeek=true;event.sessions=event.sessions.filter(s=>s.day<eventDay-1);for(const s of event.sessions){const km=curKm.get(s.id);if(km!==undefined){s.km=km;s.minutes=Math.ceil(km*basePace.get(s.id));}s.date=dateAdd(eventStart,s.day);}event.notes=['La gara e un segnaposto, non autorizzazione a partire o promessa di completamento.','Nessuna seduta extra per recuperare quelle omesse. Giorno precedente libero.'];weeks.push(event);
  // Pre-event volume reduction: published taper convention (Pfitzinger). A reduction
  // of volume toward the event, NOT a declaration of completed preparation.
  const taper=base.week.goal==='marathon'?[.8,.6,.4]:g.taperWeeks===2?[.7,.5]:[.5];for(let j=0;j<taper.length;j++){const i=availableWeeks-taper.length+1+j,w=weeks[i];if(!w)continue;w.phase=w.eventWeek?'Settimana evento: volume ridotto':'Avvicinamento evento: volume ridotto';w.originalTaperChoice=true;for(const s of w.sessions){s.minutes=Math.max(5,Math.round(s.minutes*taper[j]));if(s.sport==='run'){s.km*=taper[j];s.distanceEstimate=true;}if(s.sport==='strength'&&s.routine){s.routine=s.routine.map(r=>({...r,sets:1}));s.method='Tecnica facile, niente nuovi carichi o esercizi impegnativi in avvicinamento evento.';}}}
 }
 return{status:'provisional-whole-plan',weeks,modelMilestoneWeek:milestone!==null?milestone+1:null,progressionPolicy:'B9-run-km-step-hold4load-deload30',progressionBlockedReason:blockedReason,goalReferences:{longKm:g.longKm,weeklyKm:weeklyRef,orientationOnly:true},eventReferenceGap,eventDate:options.eventDate||null,eventWeek:options.eventDate?{date:options.eventDate,kind:'event-marker-not-workout',distanceKm:base.week.goal==='half'?21.0975:base.week.goal==='marathon'?42.195:base.week.goal==='10k'?10:5,preEventWeekNotPrescribed:false,recoveryAfterEventNotPrescribed:true}:null,eventReadinessClaim:false,recoveryGateway:options.eventDate?{date:dateAdd(options.eventDate,1),requiresActualEventOutcome:true,automaticRunningRestart:false,reason:'Dopo evento: riposo e movimento leggero solo se confortevole. Niente rientro automatico alla dose precedente; conferma esito gara, sintomi e recupero per riprogrammare.'}:null,allFutureDoseChangesRequireFeedback:true,forecastNature:'original-programming-scenario-not-performance-or-safety-validation',exportAudience:'private-user-file'};
}
function forecast(base,options){
 if(options&&dateValid(options.start)&&new Date(options.start+'T12:00:00Z').getUTCDay()!==1)return{status:'monday-start-needed',reason:'Scegli un lunedi per la partenza.'};
 if(!base?.week||!dateValid(options?.start))return originalForecast(base,options);
 const transitions=[...(base.week.frequencyTransition?[base.week.frequencyTransition]:[]),...(base.week.sportFrequencyTransitions||[])].filter(t=>t.desired>t.current);
 if(!transitions.length)return originalForecast(base,options);
 const stages=Math.max(...transitions.map(t=>t.desired-t.current)),prefix=[];
 for(let stage=0;stage<stages;stage++)for(let repeat=0;repeat<2;repeat++){
  const w=copy(base.week);w.index=prefix.length;w.start=dateAdd(options.start,w.index*7);w.phase='Adattamento della frequenza a volume non crescente';w.provisional=w.index>0;w.frequencyAdaptation=true;w.originalProgrammingChoice=true;
  for(const t of transitions){const all=w.sessions.filter(s=>s.sport===t.sport),count=Math.min(t.desired,t.current+stage);const chosen=all.slice(0,count),ids=new Set(chosen.map(s=>s.id));w.sessions=w.sessions.filter(s=>s.sport!==t.sport||ids.has(s.id));
   const h=base.history[t.sport];for(const s of chosen){if(t.sport==='run'){s.km=Math.min(h.weeklyKm/count,h.longestKm);s.minutes=Math.ceil(s.km*h.easyMinutesPerKm);}else s.minutes=h.weeklyMinutes/count;s.adaptationAllocationEstimate=true;}}
  for(const s of w.sessions){s.date=dateAdd(w.start,s.day);if(!Number.isFinite(s.minutes)||s.minutes<=0)return{status:'time-reference-needed'};if(options.dayMinutes&&w.sessions.filter(t=>t.day===s.day).reduce((a,t)=>a+t.minutes,0)>options.dayMinutes[s.day])return{status:'time-budget-conflict',week:w.index+1,day:s.day,neededMinutes:Math.ceil(w.sessions.filter(t=>t.day===s.day).reduce((a,t)=>a+t.minutes,0)),availableMinutes:options.dayMinutes[s.day],conflictSessions:w.sessions.filter(t=>t.day===s.day).map(t=>({sport:t.sport,minutes:t.minutes})),feasibleWeeks:copy(prefix)};}prefix.push(w);
 }
 const future=originalForecast(base,{...options,start:dateAdd(options.start,prefix.length*7)});if(future.status!=='provisional-whole-plan'){if(future.status==='time-budget-conflict')return{...future,week:future.week+prefix.length,feasibleWeeks:[...prefix,...(future.feasibleWeeks||[]).map(w=>({...w,index:w.index+prefix.length}))]};return future;}
 future.weeks=[...prefix,...future.weeks.map(w=>({...w,index:w.index+prefix.length}))];future.frequencyAdaptation={weeks:prefix.length,targetCountsDeferred:true,requiresPositiveFeedback:true,originalProgrammingChoice:true,notConfirmedVolumeWeeks:true,reason:'Frequenze finali sono obiettivo, non abitudine gia acquisita. Due settimane per passaggio sono una proposta originale, non garanzia di adattamento. Queste settimane di adattamento NON contano come settimane a volume confermato per la progressione.'};if(future.modelMilestoneWeek)future.modelMilestoneWeek+=prefix.length;return future;
}
function fitnessGrowth(base,options){
 const out=maintenance(base,options);if(out.status!=='provisional-whole-plan')return out;out.maintenance=false;out.progressVolume=true;out.timeOnlyDevelopment=true;
 let loadIdx=0;
 for(const w of out.weeks){
  if(w.index>0&&w.index%5===4){w.recoveryWeek=true;w.originalRecoveryChoice=true;w.phase=DELOAD_PHASE;for(const s of w.sessions){if(s.sport==='strength')continue;s.minutes=Math.max(5,Math.round(s.minutes*.7));delete s.km;s.distanceNotPredicted=true;}continue;}
  const level=Math.floor(loadIdx/4);loadIdx++;
  w.phase='Fitness: sviluppo facoltativo del tempo, condizionato ai riscontri';
  for(const s of w.sessions){if(s.sport==='strength')continue;if(s.sport==='run'){const add=s.minutes<20?2:5;s.minutes+=level*add;if(level){delete s.km;s.distanceNotPredicted=true;}}const cap=options.dayMinutes?.[s.day];if(Number.isFinite(cap)&&w.sessions.filter(t=>t.day===s.day).reduce((a,b)=>a+b.minutes,0)>cap)return{status:'time-budget-conflict',week:w.index+1,day:s.day,neededMinutes:Math.ceil(w.sessions.filter(t=>t.day===s.day).reduce((a,t)=>a+t.minutes,0)),availableMinutes:cap,feasibleWeeks:copy(out.weeks.slice(0,w.index))};}
 }
 out.progressionPolicy='B9-fitness-time-steps-hold4load-deload30';
 out.reason='Proposta originale: piccoli passi di durata solo sulle corse (RIDE e SWIM restano stabili) ogni 4 settimane di carico, scarico -30% dopo 4 settimane di carico (include RIDE e SWIM, forza invariata), solo se i riscontri li sostengono. Nessun ritmo o distanza derivati dal tempo futuro.';return out;
}
function maintenance(base,options){
 const count=options.weeks||12;if(!Number.isInteger(count)||count<4||count>52)return{status:'invalid-horizon'};
 const weeks=[];for(let i=0;i<count;i++){const w=copy(base.week);w.index=i;w.start=dateAdd(options.start,i*7);w.phase=['Familiarita e tecnica','Varieta a volume stabile','Consolidamento e scelta preferita'][Math.floor(i/4)%3];w.provisional=i>0;w.progressVolume=false;for(const s of w.sessions){s.date=dateAdd(w.start,s.day);s.actualKm=null;s.actualMinutes=null;s.method=s.sport==='strength'?(Math.floor(i/4)%2?'Stessi schemi e serie, variante equivalente piu comoda':'Tecnica controllata, stessi schemi e serie'):(Math.floor(i/4)%3===0?'Facile continuo':Math.floor(i/4)%3===1?'Stesso tempo facile, alterna tratti su percorso piano senza alzare sforzo':'Stesso tempo, primo tratto molto tranquillo poi conversazione comoda');if(options.dayMinutes&&w.sessions.filter(t=>t.day===s.day).reduce((a,t)=>a+(t.minutes||0),0)>options.dayMinutes[s.day])return{status:'time-budget-conflict',week:i+1,day:s.day,neededMinutes:Math.ceil(w.sessions.filter(t=>t.day===s.day).reduce((a,t)=>a+t.minutes,0)),availableMinutes:options.dayMinutes[s.day],feasibleWeeks:copy(weeks),noSilentCut:true};}weeks.push(w);}
 return{status:'provisional-whole-plan',weeks,eventDate:options.eventDate||null,eventNotAssessed:!!options.eventDate,eventReadinessClaim:false,maintenance:true,progressVolume:false,methodVariationEveryWeeks:4,allFutureDoseChangesRequireFeedback:true,reason:'Varieta del metodo ogni4settimane, stesso volume. Nessuna maggiore velocita o distanza promessa a tempo fisso. Nessuno scarico forzato: il volume fissato resta stabile.'};
}
window.WolfHorizon={forecast,maintenance,GOALS,dateAdd};

})();
