'use strict';
const GOALS={
 '5k':{weeklyKm:12,longKm:5,minFrequency:2},
 '10k':{weeklyKm:24,longKm:10,minFrequency:2},
 half:{weeklyKm:40,longKm:18,minFrequency:3},
 marathon:{weeklyKm:64,longKm:28,minFrequency:3}
};
const VERSION='original-endurance-v4-private';
const copy=x=>JSON.parse(JSON.stringify(x));
function initialize(input){
 if(!input||!GOALS[input.goal]||!input.habitConfirmed||!Array.isArray(input.sessions)||!input.sessions.length||input.sessions.length>7)return{status:'needs-real-baseline'};
 const ids=new Set(),days=new Set();
 for(const s of input.sessions){if(!s||typeof s.id!=='string'||!s.id||ids.has(s.id)||!Number.isInteger(s.day)||s.day<0||s.day>6||days.has(s.day)||!Number.isFinite(s.minutes)||s.minutes<=0||!Number.isFinite(s.km)||s.km<=0)return{status:'invalid-baseline'};ids.add(s.id);days.add(s.day);}
 const longId=input.sessions.reduce((a,b)=>a.km>b.km?a:b).id;
 return{status:'baseline-proposal',plan:{version:VERSION,goal:input.goal,sessions:copy(input.sessions),longId,observations:[],source:'actual-session-level-confirmed',claims:{readiness:false,injuryPrevention:false}}};
}
function signature(p){return JSON.stringify(p.sessions.map(s=>[s.id,s.day,s.minutes,s.km]));}
function validDate(s){return typeof s==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(s)&&!Number.isNaN(Date.parse(s+'T12:00:00Z'))&&new Date(s+'T12:00:00Z').toISOString().slice(0,10)===s;}
function observe(p,r){
 if(!r||!validDate(r.period)||!validDate(r.asOf)||r.asOf<r.period||p.observations.some(o=>Date.parse(r.period)-Date.parse(o.period)<604800000))return{status:'invalid-period'};
 if(!Array.isArray(r.sessions)||r.sessions.length!==p.sessions.length||new Set(r.sessions.map(s=>s.id)).size!==p.sessions.length||r.sessions.some(s=>!p.sessions.some(t=>t.id===s.id)||!['done','partial','skipped'].includes(s.status)||!Number.isFinite(s.actualMinutes)||s.actualMinutes<0||!Number.isFinite(s.actualKm)||s.actualKm<0||typeof s.recovered!=='boolean'||typeof s.symptoms!=='boolean'||typeof s.unexpectedEffort!=='boolean'))return{status:'invalid-report'};
 const n=copy(p),tolerated=r.sessions.every(s=>s.status==='done'&&s.recovered&&!s.symptoms&&!s.unexpectedEffort&&s.actualMinutes>=p.sessions.find(t=>t.id===s.id).minutes)&&r.combinedRecovered===true;
 n.observations.push({...copy(r),dose:signature(p),tolerated});return{status:'observed',plan:n};
}
function next(p,availability){
 const last=p.observations.at(-1),g=GOALS[p.goal],n=copy(p);
 if(last?.sessions.some(s=>s.symptoms))return{status:'symptom-stop'};
 if(last&&(last.combinedRecovered!==true||last.sessions.some(s=>!s.recovered||s.unexpectedEffort)))return{status:'recovery-choice'};
 if(p.sessions.length<g.minFrequency)return{status:'frequency-outside-supported-development',plan:n};
 const tail=p.observations.slice(-2);
 if(tail.length<2||tail.some(r=>!r.tolerated||r.dose!==signature(p))||Date.parse(tail[1].period)-Date.parse(tail[0].period)!==604800000)return{status:'repeat',plan:n};
 // Re-estimate logistics from latest actual paired time/distance, never planned km.
 for(const s of n.sessions){const actual=last.sessions.find(t=>t.id===s.id);if(actual.actualKm<=0||actual.actualMinutes<=0)return{status:'actual-pair-needed'};s.km=s.minutes*actual.actualKm/actual.actualMinutes;s.distanceEstimate=true;}
 const long=n.sessions.find(s=>s.id===p.longId),weeklyReference=p.sessions.length===2?g.longKm*2:g.weeklyKm,support=(weeklyReference-g.longKm)/(p.sessions.length-1),targets=n.sessions.map(s=>Math.max(s.km,s.id===p.longId?g.longKm:support));
 if(n.sessions.every((s,i)=>last.sessions.find(t=>t.id===s.id).actualKm>=targets[i]-1e-6))return{status:'milestone-review',plan:n,readiness:false};
 if(n.sessions.every((s,i)=>s.km>=targets[i]-1e-6))return{status:'distance-reference-review',plan:n,readiness:false,reason:'Estimated distance reached reference but actual distance did not; confirm current paired time/distance rather than infer completion.'};
 // Estimated km are logistics estimates using each session's own real pairedreference.
 // Prescribed minutes alone change; a future actual report never inherits estimated km.
 const order=n.sessions.map((s,i)=>i).sort((a,b)=>n.sessions[a].km/targets[a]-n.sessions[b].km/targets[b]);
 const changes=[];
 for(const i of order){
  const s=n.sessions[i],pace=s.minutes/s.km;
  const step=s.minutes<10?1:s.minutes<20?2:5;
  let add=Math.min(step,Math.max(0,targets[i]-s.km)*pace);
  if(s.id===p.longId){const otherKm=n.sessions.filter(t=>t.id!==s.id).reduce((a,t)=>a+t.km,0);add=Math.min(add,Math.max(0,otherKm*(p.sessions.length===2?1:.45/.55)-s.km)*pace);if(s.minutes+add>180+1e-8)return{status:'long-duration-feasibility',minutes:s.minutes+add,boundaryNature:'original-product-scope'};}
  if(add<1e-6)continue;
  if(!availability||!Number.isFinite(availability[s.day])||availability[s.day]<s.minutes+add-1e-8)return{status:'availability-choice',sessionId:s.id,neededMinutes:s.minutes+add};
  const before=copy(s);s.minutes=Math.ceil(s.minutes+add-1e-8);s.km=s.minutes/pace;s.distanceEstimate=true;changes.push({id:s.id,before,after:copy(s)});
 }
 if(!changes.length)return{status:'distribution-review'};
 n.observations=[];
 return{status:'duration-proposal',plan:n,changes,requiresConfirmation:true,nature:'original-source-informed-policy',readiness:false};
}
const api={GOALS,VERSION,initialize,observe,next};if(typeof module!=='undefined')module.exports=api;else window.WolfEndurance=api;
