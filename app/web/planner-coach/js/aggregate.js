(function(){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
// Aggregate history is user-confirmed input; distributing it creates a proposal,
// never actual per-session records.
function initialize(week,input){
 if(week?.status!=='automatic-week-proposal'||!input?.confirmed)return{status:'history-confirmation-needed'};
 const n=copy(week),run=n.sessions.filter(s=>s.sport==='run');
 if(run.length){
  const h=input.run;
  if(!h||!Number.isFinite(h.weeklyKm)||h.weeklyKm<=0||!Number.isFinite(h.longestKm)||h.longestKm<=0||h.longestKm>h.weeklyKm||!Number.isInteger(h.currentFrequency)||h.currentFrequency<1||h.currentFrequency>7)return{status:'run-summary-needed'};
  if(run.length!==h.currentFrequency)n.frequencyTransition={sport:'run',current:h.currentFrequency,desired:run.length,weeklyKmBefore:h.weeklyKm,originalProgrammingChoice:true};
  if(run.length===1){run[0].aggregateAllocationEstimate=true;run[0].km=Math.min(h.weeklyKm,h.longestKm);run[0].role='easy';}
  else{const long=run.find(s=>s.role==='endurance')||run.at(-1),support=(Math.min(h.weeklyKm,h.longestKm*run.length)-h.longestKm)/(run.length-1);if(support<=0)return{status:'inconsistent-run-summary'};for(const s of run){s.km=s===long?h.longestKm:support;s.aggregateAllocationEstimate=true;s.intensity='Facile, conversazione possibile';}}
  if(Number.isFinite(h.easyMinutesPerKm)&&h.easyMinutesPerKm>0)for(const s of run){s.minutes=Math.ceil(s.km*h.easyMinutesPerKm);s.durationEstimate=true;}
  else for(const s of run){delete s.minutes;s.timeFeasibilityUnverified=true;}
 }
 for(const sport of ['ride','swim']){const ss=n.sessions.filter(s=>s.sport===sport);if(!ss.length)continue;const h=input[sport];if(!h||!Number.isFinite(h.weeklyMinutes)||h.weeklyMinutes<=0||!Number.isInteger(h.currentFrequency)||h.currentFrequency<1||h.currentFrequency>7)return{status:sport+'-summary-needed'};if(h.currentFrequency!==ss.length){n.sportFrequencyTransitions=n.sportFrequencyTransitions||[];n.sportFrequencyTransitions.push({sport,current:h.currentFrequency,desired:ss.length});}for(const s of ss){s.minutes=Math.min(h.weeklyMinutes/ss.length,h.weeklyMinutes/h.currentFrequency);s.aggregateAllocationEstimate=true;}}
 for(const s of n.sessions){if(s.sport==='strength'){s.originalStrengthProposal=true;s.actualLoad=null;}s.status='planned';s.actualMinutes=null;s.actualKm=null;}
 n.totalMinutes=n.sessions.every(s=>Number.isFinite(s.minutes))?n.sessions.reduce((a,s)=>a+s.minutes,0):null;
 return{status:'aggregate-baseline-proposal',week:n,history:copy(input),requiresConfirmation:true,reason:'Piano generato da riepilogo recente. La distribuzione nelle singole sedute e proposta, non una cronologia ricostruita.'};
}
function simpleFeedback(week,report){
 if(!report||!['done','partial','skipped'].includes(report.outcome)||!['easy','right','hard'].includes(report.effort)||typeof report.symptoms!=='boolean'||typeof report.recovered!=='boolean')return{status:'invalid-feedback'};
 const n=copy(week);n.feedback={...copy(report),kind:'subjective-adherence',recordsActualDistance:false,recordsActualDuration:false};
 // Preserve no invented actual values. A done report is adherence only.
 return{status:report.symptoms?'symptom-stop':!report.recovered||report.effort==='hard'?'recovery-choice':report.outcome==='done'?'completed-subjective':'repeat-no-catchup',week:n};
}
window.WolfAggregate={initialize,simpleFeedback};

})();