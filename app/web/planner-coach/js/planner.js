(function(){
'use strict';
function daySets(k){let out=[];function rec(at,arr){if(arr.length===k){out.push(arr);return;}for(let i=at;i<7;i++)rec(i+1,[...arr,i]);}rec(0,[]);return out;}
// A week gets a multi-week forecast only when every session carries a dose
// (finite minutes) and, for distance goals, run sessions carry km. Otherwise
// the result is one honest week: habit-based where declared, structure-only
// elsewhere. No ramp is projected from incomplete data.
function singleWeek(b,options,D){
 const w=JSON.parse(JSON.stringify(b.week));w.index=0;w.start=options.start;w.provisional=false;
 w.phase=b.week.hasStructureOnly?'Struttura dalla tua abitudine: dosi solo dove dichiarata':'Settimana dalla tua abitudine dichiarata';
 for(const s of w.sessions){s.date=D.H.dateAdd(options.start,s.day);s.actualKm=null;s.actualMinutes=null;}
 if(options.dayMinutes)for(let d=0;d<7;d++){const ss=w.sessions.filter(s=>s.day===d);const tot=ss.reduce((a,s)=>a+(Number.isFinite(s.minutes)?s.minutes:0),0);if(tot>options.dayMinutes[d])return{status:'time-budget-conflict',week:1,day:d,neededMinutes:Math.ceil(tot),availableMinutes:options.dayMinutes[d],conflictSessions:ss.map(t=>({sport:t.sport,minutes:t.minutes})),feasibleWeeks:[],noSilentCut:true};}
 const missing=[...new Set(w.sessions.filter(s=>!Number.isFinite(s.minutes)).map(s=>s.sport))];
 return{status:'provisional-whole-plan',weeks:[w],structureOnly:true,missingHabitFor:missing,goal:b.week.goal||null,maintenance:true,progressVolume:false,eventDate:null,eventReadinessClaim:false,forecastDeferred:true,allFutureDoseChangesRequireFeedback:true,reason:'Settimana singola: dosi solo dagli sport con abitudine dichiarata'+(missing.length?' (manca: '+missing.map(s=>s.toUpperCase()).join(', ')+')':'')+'. Il percorso di piu settimane si genera quando ogni sport ha la sua abitudine.'};
}
function forecastable(b,goal){return b.week.sessions.every(s=>Number.isFinite(s.minutes))&&(goal==='fitness'||b.week.sessions.filter(s=>s.sport==='run').every(s=>Number.isFinite(s.km)));}
function generate(config,history,options,D){
 const make=c=>{const w=D.S.schedule(c);if(w.status!=='automatic-week-proposal')return w;let q;if(c.runMode==='beginner'&&(c.counts.run||0)>0)q=D.B.generate(c,history,options,D.S,D.H);else{const b=D.A.initialize(w,history);if(b.status!=='aggregate-baseline-proposal')return b;q=forecastable(b,c.goal)?D.H.forecast(b,options):singleWeek(b,options,D);}return q.status==='provisional-whole-plan'?D.M.apply(q,{level:c.level,alreadyToleratesModerate:history.alreadyToleratesModerate}):q;};
 let q=make(config);if(q.status!=='time-budget-conflict'||!options.dayMinutes)return q;
 let best=q;let tried=1;const better=(x,y)=>x.status==='time-budget-conflict'&&((x.week||0)>(y.week||0)||x.week===y.week&&(x.neededMinutes-x.availableMinutes)<(y.neededMinutes-y.availableMinutes));for(const days of daySets(config.dayCount)){if(days.some(d=>!Number.isFinite(options.dayMinutes[d])||options.dayMinutes[d]<=0))continue;const p=make({...config,days});tried++;if(better(p,best))best=p;if(p.status==='provisional-whole-plan'){p.availabilityReallocated=true;p.selectedAvailableDays=days;p.availabilityReason='Distribuzione automatica spostata nei giorni con tempo sufficiente, senza tagliare dose o moltiplicare sedute.';return p;}}
 return{...best,daySetsChecked:tried,allDaySetsChecked:true,conflictKind:best.week>1?'future-development':'initial-week',reason:'Il limite di tempo incontra una dose proposta. Dettaglio disponibile sotto; i dati inseriti non sono stati cambiati.',feasibleWeeks:(best.feasibleWeeks||[]).map(w=>({...w,provisional:true,incompleteForecast:true})),notACompleteGoalPlan:true};
}
window.WolfPlanner={generate};

})();
