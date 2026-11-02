(function(){
'use strict';
function daySets(k){let out=[];function rec(at,arr){if(arr.length===k){out.push(arr);return;}for(let i=at;i<7;i++)rec(i+1,[...arr,i]);}rec(0,[]);return out;}
function generate(config,history,options,D){
 const make=c=>{const w=D.S.schedule(c);if(w.status!=='automatic-week-proposal')return w;let q;if(c.runMode==='beginner'&&(c.counts.run||0)>0)q=D.B.generate(c,history,options,D.S,D.H);else{const b=D.A.initialize(w,history);if(b.status!=='aggregate-baseline-proposal')return b;q=D.H.forecast(b,options);}return q.status==='provisional-whole-plan'?D.M.apply(q,{level:c.level,alreadyToleratesModerate:history.alreadyToleratesModerate}):q;};
 let q=make(config);if(q.status!=='time-budget-conflict'||!options.dayMinutes)return q;
 const initial=q;for(const days of daySets(config.dayCount)){if(days.some(d=>!Number.isFinite(options.dayMinutes[d])||options.dayMinutes[d]<=0))continue;const p=make({...config,days});if(p.status==='provisional-whole-plan'){p.availabilityReallocated=true;p.selectedAvailableDays=days;p.availabilityReason='Distribuzione automatica spostata nei giorni con tempo sufficiente, senza tagliare dose o moltiplicare sedute.';return p;}}
 return{...initial,allDayArrangementsChecked:true,reason:'Nessuna distribuzione dei giorni supportata rispetta i limiti di tempo del percorso. Non taglio dosi o concentro sedute per nascondere il conflitto.'};
}
window.WolfPlanner={generate};

})();