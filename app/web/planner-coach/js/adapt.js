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
const SPORTLIST=['run','ride','swim','strength'];
function adjust(plan,{weekIndex,sessionId,minutes,sport}){
 if(!plan||!Number.isInteger(weekIndex)||!plan.weeks[weekIndex])return{status:'invalid-adjust'};
 const n=copy(plan),w=n.weeks[weekIndex],s=w.sessions.find(x=>x.id===sessionId);
 if(!s||w.feedback)return{status:'history-protected'};
 let changed=false;
 if(minutes!=null){
  if(!Number.isFinite(minutes)||minutes<10)return{status:'invalid-minutes'};
  if(minutes>=s.minutes)return{status:'no-manual-increase',reason:'Un aumento inserito a mano non e una dose: le progressioni arrivano solo da storico e riscontri.'};
  s.minutes=minutes;delete s.km;changed=true;
 }
 if(sport&&sport!==s.sport){
  if(!SPORTLIST.includes(sport))return{status:'invalid-sport'};
  if(w.sessions.some(t=>t.id!==s.id&&t.day===s.day&&t.sport===sport))return{status:'same-sport-double-conflict'};
  s.sport=sport;delete s.km;delete s.routine;delete s.method;changed=true;
 }
 if(!changed)return{status:'no-change'};
 s.userAdjusted=true;s.doseOrigin='manual-user-adjustment-not-computed';w.userModified=true;
 return{status:'adjust-preview',plan:n,requiresConfirmation:true,reason:'Modifica manuale alla singola seduta: non e una dose calcolata ne una equivalenza fra sport. Storico e altre sedute invariati.'};
}
function addSession(plan,{weekIndex,day,sport,minutes,intensity}){
 if(!plan||!Number.isInteger(weekIndex)||!plan.weeks[weekIndex])return{status:'invalid-add'};
 if(!Number.isInteger(day)||day<0||day>6||!SPORTLIST.includes(sport))return{status:'invalid-add'};
 if(!Number.isFinite(minutes)||minutes<10||minutes>600)return{status:'invalid-minutes'};
 const n=copy(plan),w=n.weeks[weekIndex];
 if(w.feedback)return{status:'history-protected'};
 if(w.sessions.filter(t=>t.day===day).length>=2)return{status:'double-capacity-conflict'};
 if(w.sessions.some(t=>t.day===day&&t.sport===sport))return{status:'same-sport-double-conflict'};
 const date=new Date(w.start+'T12:00:00Z');date.setUTCDate(date.getUTCDate()+day);
 w.sessions.push({id:'user-'+sport+'-'+day+'-'+minutes+'-'+w.index,day,sport,role:'user-added',minutes,intensity:intensity||'Facile, conversazione possibile',slot:'Orario da scegliere',date:date.toISOString().slice(0,10),userCreated:true,doseOrigin:'manual-user-added-not-computed'});
 w.userModified=true;
 return{status:'add-preview',plan:n,requiresConfirmation:true,reason:'Seduta aggiunta da te: e una tua scelta, non una dose calcolata, e non cambia storico o progressioni future.'};
}
function addEvent(plan,{date,label}){
 if(!plan||typeof date!=='string'||!/^\d{4}-\d{2}-\d{2}$/.test(date)||!label||!String(label).trim())return{status:'invalid-event'};
 const n=copy(plan);n.events=[...(n.events||[]),{date,label:String(label).trim().slice(0,60),userCreated:true}];
 return{status:'event-preview',plan:n,requiresConfirmation:true,reason:'Evento annotato da te: il percorso non viene ricalcolato sull evento e non promette preparazione specifica.'};
}
window.WolfAdapt={feedback,move,rebase,adjust,addSession,addEvent};

})();