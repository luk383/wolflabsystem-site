(function(){
'use strict';
function apply(plan,profile){
 const n=JSON.parse(JSON.stringify(plan));n.methodProfile={level:profile.level,alreadyToleratesModerate:profile.alreadyToleratesModerate===true};
 for(const w of n.weeks){const block=Math.floor(w.index/4)%3,qualityAllowed=profile.level==='advanced'&&profile.alreadyToleratesModerate===true&&!w.frequencyAdaptation&&!w.beginnerStage&&!w.eventWeek&&!w.originalTaperChoice&&!w.recoveryWeek;
  for(const s of w.sessions){if(s.sport==='strength'&&s.routine){if(w.originalTaperChoice)continue;if(w.recoveryWeek){s.routine=s.routine.map(r=>({...r,sets:1}));s.method='Consolidamento: tecnica facile, una serie per schema, nessun nuovo carico.';continue;}const base=profile.level==='base';s.routine=s.routine.map(r=>({...r,sets:base?1:block===2?3:2,reps:base?[8,10,12][block]:[10,12,8][block]}));s.method=['Controllo e apprendimento degli schemi, variante comoda.','Stessi schemi, piu ripetizioni solo con tecnica stabile.','Consolidamento: stessa durata totale, recuperi liberi, non aggiungere carico per riempire il tempo.'][block]+' La durata e un limite massimo, non un obbligo di esaurimento. Lascia ripetizioni possibili, fermati prima di perdere la forma.';s.originalStrengthVariation=true;}
   else if(!s.pattern&&!w.originalTaperChoice&&!w.eventWeek&&!w.frequencyAdaptation){s.method=s.method||['Continuo facile, conversazione comoda.','Stessa dose: alterna percorsi pianeggianti, senza cercare velocita.','Stessa dose: partenza molto tranquilla, finale facile e regolare.'][block];}
  }
  if(qualityAllowed){const s=w.sessions.find(s=>s.sport==='run'&&s.role!=='endurance'&&s.minutes>=25);if(s){s.method=block===0?'Stessa durata totale: primi e ultimi 8min facili; nella parte centrale 4 tratti di30s fluidi e controllati, ciascuno seguito da90s molto facili. Non sprint.':block===1?'Stessa durata totale: primi e ultimi 8min facili; al centro 2 tratti di3min a sforzo moderato gia abituale, separati da3min facili.':'Settimana di consolidamento qualitativo: intera durata facile, niente tratti moderati.';s.moderateWorkOptional=true;s.priorModerateHabitConfirmed=true;s.kmUndefinedForVariedEffort=true;delete s.km;s.intensity='Facile con soli tratti moderati gia abituali, nessun ritmo o zona inventati';}}
 }
 return n;
}
window.WolfMethods={apply};

})();