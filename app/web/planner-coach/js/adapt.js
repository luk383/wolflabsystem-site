(function(){
'use strict';
const copy=x=>JSON.parse(JSON.stringify(x));
function feedback(plan,index,report){
 if(!plan||!Array.isArray(plan.weeks)||!Number.isInteger(index)||index<0||index>=plan.weeks.length||!['done','partial','skipped'].includes(report?.outcome)||!['easy','right','hard'].includes(report.effort)||typeof report.symptoms!=='boolean'||typeof report.recovered!=='boolean')return{status:'invalid-feedback'};
 if(index>0&&!plan.weeks[index-1].responseAccepted&&!plan.weeks[index].rebaselineEntryConfirmed)return{status:'earlier-feedback-needed',reason:'Prima registra come sono andate le settimane precedenti; non considero gia acquisita la progressione futura.'};
 const n=copy(plan),current=n.weeks[index];current.feedback={...copy(report),kind:'subjective-adherence',recordsActualDistance:false,recordsActualDuration:false};
 if(report.symptoms){n.progressionSuspended=true;n.suspensionReason='Sintomi: nessuna nuova dose proposta.';for(const w of n.weeks.slice(index+1))w.suspended=true;return{status:'symptom-stop',plan:n};}
 if(report.outcome!=='done'||!report.recovered||report.effort==='hard'){
  // Freeze future prescription at current dose; keep dates and historicalweeks.
  // This isn't a recoverydose: it suspends furthergrowth, never prescribes throughpoor recovery.
  n.progressionSuspended=true;n.suspensionReason='Riscontro richiede revisione: niente aumenti o recupero di sedute perse.';
  for(const w of n.weeks.slice(index+1)){w.suspended=true;w.priorForecastInvalidated=true;w.phase='Da rivedere dopo il riscontro';}
  return{status:'review-preview',plan:n,requiresConfirmation:true,reason:'Le settimane future vengono sospese, non mantengo crescita prevista come se il recupero fosse positivo.'};
 }
 if(n.progressionSuspended)return{status:'rebaseline-needed',plan:n,reason:'Un riscontro positivo non cancella una sospensione precedente. Riconferma il passato attuale per ricalcolare, non uso un checkbox come via libera clinico.'};
 current.responseAccepted=true;const next=n.weeks[index+1];if(next){next.feedbackGateSatisfied=true;next.authorizedAfterWeek=index+1;}return{status:'positive-feedback',plan:n,reason:'Aderenza e recupero registrati, non chilometri realmente misurati.'};
}
function move(plan,{weekIndex,sessionId,newDay,dayBudget}){
 if(!plan||!Number.isInteger(weekIndex)||!plan.weeks[weekIndex]||!Number.isInteger(newDay)||newDay<0||newDay>6)return{status:'invalid-move'};
 const n=copy(plan),w=n.weeks[weekIndex],s=w.sessions.find(s=>s.id===sessionId);if(!s||w.feedback)return{status:'history-protected'};
 if(plan.beginner&&s.sport==='run'&&w.sessions.some(t=>t.id!==s.id&&t.sport==='run'&&[1,6].includes(Math.abs(t.day-newDay))))return{status:'beginner-restday-conflict',reason:'Mantieni un giorno senza corsa fra le sedute iniziali.'};
 if(w.sessions.filter(t=>t.id!==s.id&&t.day===newDay).length>=2)return{status:'double-capacity-conflict'};
 if(w.sessions.some(t=>t.id!==s.id&&t.day===newDay&&t.sport===s.sport))return{status:'same-sport-double-conflict'};
 const total=w.sessions.filter(t=>t.id!==s.id&&t.day===newDay).reduce((a,t)=>a+t.minutes,0)+s.minutes;
 if(!Number.isFinite(s.minutes)||s.minutes<=0)return{status:'unverified-session-duration'};
 if(!Number.isFinite(dayBudget?.[newDay])||total>dayBudget[newDay])return{status:'time-budget-conflict',neededMinutes:total};
 const date=new Date(w.start+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+newDay);s.day=newDay;s.date=date.toISOString().slice(0,10);s.slot=w.sessions.filter(t=>t.day===newDay).length===2?'Doppia proposta, orari da confermare':'Orario da scegliere';
 return{status:'move-preview',plan:n,requiresConfirmation:true,reason:'Cambia solo collocazione: dose e storico conservati. Nessun aumento o seduta persa recuperata.'};
}
function rebase(plan,lastIndex,future){
 if(!plan||!future||future.status!=='provisional-whole-plan'||!Number.isInteger(lastIndex)||lastIndex<0||lastIndex>=plan.weeks.length)return{status:'invalid-rebase'};
 const history=copy(plan.weeks.slice(0,lastIndex+1)),last=history.at(-1);
 if(!future.weeks.length||future.weeks[0].start<=last.start)return{status:'rebase-date-conflict'};
 const n=copy(future);n.weeks=[...history,...n.weeks.map((w,i)=>({...w,index:history.length+i}))];n.weeks[history.length].rebaselineEntryConfirmed=true;n.rebasedFrom={afterWeek:lastIndex+1,previousForecastInvalidated:true};n.progressionSuspended=false;
 return{status:'rebase-preview',plan:n,requiresConfirmation:true,reason:'Conserva le settimane registrate. Sostituisce solo il futuro con una proposta dal riepilogo recente appena confermato. Nessun recupero di sedute perse.'};
}
window.WolfAdapt={feedback,move,rebase};

})();