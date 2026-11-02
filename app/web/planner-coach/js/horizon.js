(function(){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x)),DAY=86400000;
const GOALS={fitness:{longKm:null,weeklyKm:null,minRuns:0,taperWeeks:0},'5k':{longKm:5,weeklyKm:12,minRuns:2,taperWeeks:1},'10k':{longKm:10,weeklyKm:24,minRuns:2,taperWeeks:1},half:{longKm:18,weeklyKm:40,minRuns:3,taperWeeks:2},marathon:{longKm:28,weeklyKm:64,minRuns:3,taperWeeks:3}};
function dateValid(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;}
function dateAdd(s,n){return new Date(Date.parse(s+'T12:00:00Z')+n*DAY).toISOString().slice(0,10);}
function originalForecast(base,options){
 if(base?.status!=='aggregate-baseline-proposal'||!GOALS[base.week.goal]||!dateValid(options?.start)||options.eventDate&&!dateValid(options.eventDate))return{status:'invalid-forecast-input'};
 if(new Date(options.start+'T12:00:00Z').getUTCDay()!==1)return{status:'monday-start-needed',reason:'La settimana usa lunedi come partenza. Scegli un lunedi.'};
 const g=GOALS[base.week.goal],p=copy(base.week),run=p.sessions.filter(s=>s.sport==='run');
 if(base.week.goal==='fitness')return options.progressVolume===true?fitnessGrowth(base,options):maintenance(base,options);if(options.progressVolume===false)return maintenance(base,options);
 if(run.length<g.minRuns)return{status:'unsupported-target-frequency',desired:run.length,supportedMinimum:g.minRuns};
 if(run.some(s=>!Number.isFinite(s.km)||!Number.isFinite(s.minutes)||s.minutes<=0))return{status:'time-reference-needed',reason:'Serve un solo riferimento facile tempo/distanza o passo recente per verificare durate, non il tempo di ogni seduta.'};
 const long=run.find(s=>s.role==='endurance')||run.at(-1),weeklyRef=run.length===2?g.longKm*2:g.weeklyKm,supportRef=(weeklyRef-g.longKm)/(run.length-1),targets=new Map(run.map(s=>[s.id,Math.max(s.km,s.id===long.id?g.longKm:supportRef)]));
 const availableWeeks=options.eventDate?Math.floor((Date.parse(options.eventDate+'T12:00:00Z')-Date.parse(options.start+'T12:00:00Z'))/(7*DAY)):null;
 if(availableWeeks!==null&&availableWeeks>155)return{status:'event-outside-supported-horizon',reason:'La data supera il percorso supportato di 156 settimane.'};
 if(availableWeeks!==null&&availableWeeks<g.taperWeeks+2)return{status:'event-too-close',availableWeeks,reason:'Non concentro preparazione e recupero per far tornare la data.'};
 const weeks=[];let milestone=null;
 for(let i=0;i<156;i++){
  const w=copy(p);w.index=i;w.start=dateAdd(options.start,i*7);w.phase=milestone===null?'Sviluppo endurance condizionato ai riscontri':'Mantenimento prima della fase evento';if(i%4===3&&milestone===null){w.recoveryWeek=true;w.originalRecoveryChoice=true;w.phase='Consolidamento: settimana alleggerita';for(const s of w.sessions)if(s.sport!=='strength'){s.minutes=Math.max(5,Math.round(s.minutes*.8));if(Number.isFinite(s.km))s.km*=.8;}}else if(milestone===null)w.phase=i<4?'Base e regolarita':i<8?'Costruzione della continuita':'Resistenza verso la distanza';w.provisional=i>0;w.assumption=i?'Ipotesi futura: sedute svolte, recupero adeguato e nessun sintomo. Non e aumento gia autorizzato.':'Prima settimana proposta dal passato aggregato';
  for(const s of w.sessions){s.date=dateAdd(w.start,s.day);s.actualKm=null;s.actualMinutes=null;if(options.dayMinutes&&Number.isFinite(options.dayMinutes[s.day])){const total=w.sessions.filter(t=>t.day===s.day).reduce((a,t)=>a+(t.minutes||0),0);if(total>options.dayMinutes[s.day])return{status:'time-budget-conflict',week:i+1,day:s.day,neededMinutes:Math.ceil(total),availableMinutes:options.dayMinutes[s.day],noSilentCut:true,conflictSessions:w.sessions.filter(t=>t.day===s.day).map(t=>({sport:t.sport,minutes:t.minutes})),feasibleWeeks:copy(weeks)};}}
  weeks.push(w);
  if(!w.recoveryWeek&&run.every(s=>s.km>=targets.get(s.id)-1e-8)&&milestone===null)milestone=i;
  if(milestone!==null){if(availableWeeks===null)break;if(i>=availableWeeks-1)break;continue;}
  if(i%2===0)continue;
  const order=run.map(s=>s).sort((a,b)=>a.km/targets.get(a.id)-b.km/targets.get(b.id));
  for(const s of order){const pace=s.minutes/s.km,maxExtra=s.minutes<10?1:s.minutes<20?2:5;let km=Math.min(targets.get(s.id),s.km+maxExtra/pace);
   if(s.id===long.id){const others=run.filter(t=>t.id!==s.id).reduce((a,t)=>a+t.km,0);km=Math.min(km,others*(run.length===2?1:.45/.55));if(km*pace>180)return{status:'long-duration-outside-support',neededMinutes:Math.ceil(km*pace),notReadiness:false};}
   if(km>s.km){s.km=km;s.minutes=Math.ceil(km*pace);}
  }
 }
 if(milestone===null)return{status:'forecast-outside-horizon',weeks:weeks.length};
 if(availableWeeks!==null&&milestone+g.taperWeeks+1>availableWeeks)return{status:'event-not-supported-by-forecast',availableWeeks,modelDevelopmentWeeks:milestone+1,modelTaperWeeks:g.taperWeeks,earliestModelDate:dateAdd(options.start,(milestone+1+g.taperWeeks)*7),reason:'La data non e sostenuta da questo modello anche ipotizzando riscontri sempre positivi. Non comprimo la progressione.'};
 if(availableWeeks!==null){
  // Include the actual event week. Source table distinguishes event week,
  // not an extra full week ending before event Monday.
  const eventStart=dateAdd(options.start,availableWeeks*7),eventDay=Math.round((Date.parse(options.eventDate+'T12:00:00Z')-Date.parse(eventStart+'T12:00:00Z'))/DAY),event=copy(p);event.index=availableWeeks;event.start=eventStart;event.phase='Settimana evento: scarico e scelta finale';event.provisional=true;event.eventWeek=true;event.sessions=event.sessions.filter(s=>s.day<eventDay-1);for(const s of event.sessions)s.date=dateAdd(eventStart,s.day);event.notes=['La gara e un segnaposto, non autorizzazione a partire o promessa di completamento.','Nessuna seduta extra per recuperare quelle omesse. Giorno precedente libero.'];weeks.push(event);
  const taper=base.week.goal==='marathon'?[.8,.6,.4]:g.taperWeeks===2?[.7,.5]:[.5];for(let j=0;j<taper.length;j++){const i=availableWeeks-taper.length+1+j,w=weeks[i];if(!w)continue;w.phase=w.eventWeek?'Settimana evento: volume ridotto e scelta finale':'Avvicinamento evento, riduzione del volume';w.originalTaperChoice=true;for(const s of w.sessions){s.minutes=Math.max(5,Math.round(s.minutes*taper[j]));if(s.sport==='run'){s.km*=taper[j];s.distanceEstimate=true;}if(s.sport==='strength'){s.routine=s.routine.map(r=>({...r,sets:1}));s.method='Tecnica facile, niente nuovi carichi o esercizi impegnativi in avvicinamento evento.';}}}
 }
 return{status:'provisional-whole-plan',weeks,modelMilestoneWeek:milestone+1,eventDate:options.eventDate||null,eventWeek:options.eventDate?{date:options.eventDate,kind:'event-marker-not-workout',distanceKm:base.week.goal==='half'?21.0975:base.week.goal==='marathon'?42.195:base.week.goal==='10k'?10:5,preEventWeekNotPrescribed:false,recoveryAfterEventNotPrescribed:true}:null,eventReadinessClaim:false,recoveryGateway:options.eventDate?{date:dateAdd(options.eventDate,1),requiresActualEventOutcome:true,automaticRunningRestart:false,reason:'Dopo evento: riposo e movimento leggero solo se confortevole. Niente rientro automatico alla dose precedente; conferma esito gara, sintomi e recupero per riprogrammare.'}:null,allFutureDoseChangesRequireFeedback:true,forecastNature:'original-programming-scenario-not-performance-or-safety-validation',exportAudience:'private-user-file'};
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
 future.weeks=[...prefix,...future.weeks.map(w=>({...w,index:w.index+prefix.length}))];future.frequencyAdaptation={weeks:prefix.length,targetCountsDeferred:true,requiresPositiveFeedback:true,originalProgrammingChoice:true,reason:'Frequenze finali sono obiettivo, non abitudine gia acquisita. Due settimane per passaggio sono una proposta originale, non garanzia di adattamento.'};if(future.modelMilestoneWeek)future.modelMilestoneWeek+=prefix.length;return future;
}
function fitnessGrowth(base,options){
 const out=maintenance(base,options);if(out.status!=='provisional-whole-plan')return out;out.maintenance=false;out.progressVolume=true;out.timeOnlyDevelopment=true;
 for(const w of out.weeks){w.phase='Fitness: sviluppo facoltativo del tempo, condizionato ai riscontri';for(const s of w.sessions){if(s.sport==='strength')continue;const block=Math.floor(w.index/4),add=s.minutes<20?2:5;s.minutes+=block*add;if(block){delete s.km;s.distanceNotPredicted=true;}const cap=options.dayMinutes?.[s.day];if(Number.isFinite(cap)&&w.sessions.filter(t=>t.day===s.day).reduce((a,b)=>a+b.minutes,0)>cap)return{status:'time-budget-conflict',week:w.index+1,day:s.day,neededMinutes:Math.ceil(w.sessions.filter(t=>t.day===s.day).reduce((a,t)=>a+t.minutes,0)),availableMinutes:cap,feasibleWeeks:copy(out.weeks.slice(0,w.index))};}}
 out.reason='Proposta originale: piccoli passi di durata ogni4settimane, solo se i riscontri li sostengono. Nessun ritmo o distanza derivati dal tempo futuro.';return out;
}
function maintenance(base,options){
 const count=options.weeks||12;if(!Number.isInteger(count)||count<4||count>52)return{status:'invalid-horizon'};
 const weeks=[];for(let i=0;i<count;i++){const w=copy(base.week);w.index=i;w.start=dateAdd(options.start,i*7);w.phase=['Familiarita e tecnica','Varieta a volume stabile','Consolidamento e scelta preferita'][Math.floor(i/4)%3];w.provisional=i>0;w.progressVolume=false;for(const s of w.sessions){s.date=dateAdd(w.start,s.day);s.actualKm=null;s.actualMinutes=null;s.method=s.sport==='strength'?(Math.floor(i/4)%2?'Stessi schemi e serie, variante equivalente piu comoda':'Tecnica controllata, stessi schemi e serie'):(Math.floor(i/4)%3===0?'Facile continuo':Math.floor(i/4)%3===1?'Stesso tempo facile, alterna tratti su percorso piano senza alzare sforzo':'Stesso tempo, primo tratto molto tranquillo poi conversazione comoda');if(options.dayMinutes&&w.sessions.filter(t=>t.day===s.day).reduce((a,t)=>a+(t.minutes||0),0)>options.dayMinutes[s.day])return{status:'time-budget-conflict',week:i+1,day:s.day,neededMinutes:Math.ceil(w.sessions.filter(t=>t.day===s.day).reduce((a,t)=>a+t.minutes,0)),availableMinutes:options.dayMinutes[s.day],feasibleWeeks:copy(weeks),noSilentCut:true};}weeks.push(w);}
 return{status:'provisional-whole-plan',weeks,eventDate:options.eventDate||null,eventNotAssessed:!!options.eventDate,eventReadinessClaim:false,maintenance:true,progressVolume:false,methodVariationEveryWeeks:4,allFutureDoseChangesRequireFeedback:true,reason:'Varieta del metodo ogni4settimane, stesso volume. Nessuna maggiore velocita o distanza promessa a tempo fisso.'};
}
window.WolfHorizon={forecast,maintenance,GOALS,dateAdd};

})();