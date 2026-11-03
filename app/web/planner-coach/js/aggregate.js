(function(){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
// Aggregate history is user-confirmed input; distributing it creates a proposal,
// never actual per-session records.
// Coherence rules (review v3): no silent caps, no silent reductions of declared
// volume. Declared sums stay as declared or the summary is rejected as
// inconsistent, with the reason shown to the user.
function structureOnly(s,reason){delete s.minutes;delete s.km;delete s.durationEstimate;delete s.aggregateAllocationEstimate;s.structureOnly=true;s.doseOrigin='structure-only-no-habit';s.structureReason=reason;}
function initialize(week,input){
 if(week?.status!=='automatic-week-proposal'||!input?.confirmed)return{status:'history-confirmation-needed'};
 const n=copy(week);let hasStructureOnly=false;
 const run=n.sessions.filter(s=>s.sport==='run');
 if(run.length){
  const h=input.run;
  const zero=!h||!Number.isInteger(h.currentFrequency)||h.currentFrequency===0;
  if(zero){for(const s of run)structureOnly(s,'Nessuna abitudine RUN dichiarata: la seduta resta senza dose personale.');hasStructureOnly=true;}
  else{
   if(!Number.isFinite(h.weeklyKm)||h.weeklyKm<=0||!Number.isFinite(h.longestKm)||h.longestKm<=0||h.longestKm>h.weeklyKm||!Number.isInteger(h.currentFrequency)||h.currentFrequency<1||h.currentFrequency>7)return{status:'run-summary-needed'};
   if(run.length!==h.currentFrequency)n.frequencyTransition={sport:'run',current:h.currentFrequency,desired:run.length,weeklyKmBefore:h.weeklyKm,originalProgrammingChoice:true};
   if(run.length===1){
    if(h.longestKm<h.weeklyKm)return{status:'inconsistent-run-summary',reason:'Con una sola corsa a settimana, la corsa lunga e il totale settimanale coincidono: ricontrolla i due valori dichiarati.'};
    run[0].km=h.weeklyKm;run[0].role='easy';run[0].aggregateAllocationEstimate=true;run[0].doseOrigin='declared-habit';
   }else{
    // No cap on weeklyKm: the declared total is distributed as declared.
    const long=run.find(s=>s.role==='endurance')||run.at(-1),support=(h.weeklyKm-h.longestKm)/(run.length-1);
    if(support<=0)return{status:'inconsistent-run-summary',reason:'Il lungo dichiarato copre gia tutto il volume settimanale: ricontrolla km settimanali e lungo abituale.'};
    if(support>h.longestKm)return{status:'inconsistent-run-summary',reason:(h.currentFrequency!==run.length?'Disallineamento: la settimana scelta ha '+run.length+' corse, l\u2019abitudine dichiarata e '+h.currentFrequency+'. ':'')+'Con questi numeri le corse brevi verrebbero piu lunghe del lungo dichiarato: ricontrolla km settimanali, lungo e numero di corse.'};
    for(const s of run){s.km=s===long?h.longestKm:support;s.aggregateAllocationEstimate=true;s.doseOrigin='declared-habit';s.intensity='Facile, conversazione possibile';}
   }
   if(Number.isFinite(h.easyMinutesPerKm)&&h.easyMinutesPerKm>0)for(const s of run){s.minutes=Math.ceil(s.km*h.easyMinutesPerKm);s.durationEstimate=true;}
   else for(const s of run){delete s.minutes;s.timeFeasibilityUnverified=true;}
  }
 }
 for(const sport of ['ride','swim']){
  const ss=n.sessions.filter(s=>s.sport===sport);if(!ss.length)continue;const h=input[sport];
  if(!h||!h.currentFrequency||!Number.isFinite(h.weeklyMinutes)||h.weeklyMinutes<=0){for(const s of ss)structureOnly(s,'Nessuna abitudine '+sport.toUpperCase()+' dichiarata: la seduta resta senza dose personale.');hasStructureOnly=true;continue;}
  if(h.currentFrequency!==ss.length){n.sportFrequencyTransitions=n.sportFrequencyTransitions||[];n.sportFrequencyTransitions.push({sport,current:h.currentFrequency,desired:ss.length});}
  for(const s of ss){s.minutes=Math.min(h.weeklyMinutes/ss.length,h.weeklyMinutes/h.currentFrequency);
   if(s.minutes<10)return{status:'inconsistent-'+sport+'-summary',reason:'Con '+h.weeklyMinutes+' min/settimana su '+ss.length+' sedute restano meno di 10 minuti a seduta: ricontrolla il totale o riduci le sedute '+sport.toUpperCase()+'.'};
   s.aggregateAllocationEstimate=true;s.doseOrigin='declared-habit';}
 }
 for(const s of n.sessions){if(s.sport==='strength'){
  const h=input.strength;
  if(h&&Number.isFinite(h.weeklyMinutes)&&h.weeklyMinutes>0&&Number.isInteger(h.currentFrequency)&&h.currentFrequency>=1){
   s.minutes=Math.min(h.weeklyMinutes/n.sessions.filter(x=>x.sport==='strength').length,h.weeklyMinutes/h.currentFrequency);
   if(s.minutes<10)return{status:'inconsistent-strength-summary',reason:'Con '+h.weeklyMinutes+' min/settimana su le sedute forza restano meno di 10 minuti a seduta: ricontrolla il totale.'};
   s.aggregateAllocationEstimate=true;s.doseOrigin='declared-habit';
  }else{structureOnly(s,'Nessuna abitudine FORZA dichiarata: la routine e una proposta originale, la durata resta da definire con i tuoi dati.');hasStructureOnly=true;s.originalStrengthProposal=true;}
  s.actualLoad=null;}
  s.status='planned';s.actualMinutes=null;s.actualKm=null;}
 n.totalMinutes=n.sessions.every(s=>Number.isFinite(s.minutes))?n.sessions.reduce((a,s)=>a+s.minutes,0):null;
 n.hasStructureOnly=hasStructureOnly;
 return{status:'aggregate-baseline-proposal',week:n,history:copy(input),requiresConfirmation:true,reason:'Piano generato da riepilogo recente. La distribuzione nelle singole sedute e proposta, non una cronologia ricostruita.'+(hasStructureOnly?' Le sedute senza abitudine dichiarata restano senza dose personale.':'')};
}
function simpleFeedback(week,report){
 if(!report||!['done','partial','skipped'].includes(report.outcome)||!['easy','right','hard'].includes(report.effort)||typeof report.symptoms!=='boolean'||typeof report.recovered!=='boolean')return{status:'invalid-feedback'};
 const n=copy(week);n.feedback={...copy(report),kind:'subjective-adherence',recordsActualDistance:false,recordsActualDuration:false};
 // Preserve no invented actual values. A done report is adherence only.
 return{status:report.symptoms?'symptom-stop':!report.recovered||report.effort==='hard'?'recovery-choice':report.outcome==='done'?'completed-subjective':'repeat-no-catchup',week:n};
}
window.WolfAggregate={initialize,simpleFeedback};

})();
