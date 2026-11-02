(function(){
'use strict';
const clone=x=>JSON.parse(JSON.stringify(x));
function valid(pattern){return Array.isArray(pattern)&&pattern.length>0&&pattern.length<=1000&&pattern.every(b=>b&&Number.isInteger(b.runSeconds)&&b.runSeconds>=0&&Number.isInteger(b.walkSeconds)&&b.walkSeconds>=0&&b.runSeconds+b.walkSeconds>0)&&pattern.some(b=>b.runSeconds>0);}
const seconds=p=>p.reduce((a,b)=>a+b.runSeconds+b.walkSeconds,0);
const running=p=>p.reduce((a,b)=>a+b.runSeconds,0);
function extend(pattern,budgetSeconds,referenceCycle){
 if(!valid(pattern)||!Number.isInteger(budgetSeconds)||budgetSeconds<1||budgetSeconds>300)return{status:'invalid-pattern-or-budget'};
 // Representative actualcycle, not a changed recoveryratio across all priorbouts.
 const cycle=referenceCycle||pattern.at(-1),total=cycle.runSeconds+cycle.walkSeconds,add=Math.min(total,budgetSeconds);
 const run=Math.floor(add*cycle.runSeconds/total),walk=add-run;
 if(run===0)return{status:'no-running-increment'};
 const n=clone(pattern);n.push({runSeconds:run,walkSeconds:walk});
 return{status:'pattern-proposal',pattern:n,priorSeconds:seconds(pattern),seconds:seconds(n),extraSeconds:add,extraRunSeconds:run,extraWalkSeconds:walk,longestRunSeconds:Math.max(...n.map(b=>b.runSeconds)),continuousClaim:false};
}
function estimate(pattern,actual){if(!valid(pattern)||!actual||!Number.isFinite(actual.actualKm)||actual.actualKm<=0||!Number.isFinite(actual.actualSeconds)||actual.actualSeconds<=0)return{status:'actual-pair-needed'};return{status:'whole-session-distance-estimate',km:actual.actualKm*seconds(pattern)/actual.actualSeconds,includesWalk:true,continuousPace:false};}
const api={valid,seconds,running,extend,estimate};if(typeof module!=='undefined')module.exports=api;else window.WolfPattern=api;

})();