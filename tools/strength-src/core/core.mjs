/* WOLF Strength domain core. No storage, DOM, network or implicit mutations. */
export const SCHEMA_VERSION = 2;
export const copy = x => JSON.parse(JSON.stringify(x));
export function freeze(x) { if(x && typeof x==='object') {Object.values(x).forEach(freeze); Object.freeze(x);} return x; }
const number=(x,min=0)=>typeof x==='number'&&Number.isFinite(x)&&x>=min;
const positive=x=>number(x)&&x>0;
const integer=(x,min=0)=>Number.isInteger(x)&&x>=min;
export function roundLoad(kg, step, mode='nearest') {
 if(!number(kg)||!positive(step)||!['nearest','down','up'].includes(mode)) throw Error('Invalid load rounding');
 const fn=mode==='down'?Math.floor:mode==='up'?Math.ceil:Math.round;
 return Number((fn(Number((kg/step).toFixed(9)))*step).toFixed(6));
}
export function validatePrescription(p) {
 if(!p||!p.id||!['warmup','work','ramp'].includes(p.kind)) throw Error('Set identity/kind required');
 for(const key of ['kg','restSeconds','rir','rpe']) if(p[key]!=null&&!number(p[key]))throw Error('Invalid '+key);
 if(p.rir!=null&&p.rir>10||p.rpe!=null&&(p.rpe<1||p.rpe>10))throw Error('Effort out of range');
 if((p.repsMin!=null||p.repsMax!=null)&&(!integer(p.repsMin,1)||!integer(p.repsMax,1)||p.repsMax<p.repsMin))throw Error('Invalid rep range');
 if(p.side!=null&&!['both','left','right','each'].includes(p.side))throw Error('Invalid side');
 return true;
}
export function validateRoutine(r) {
 if(!r?.id||!r.name?.trim()||!Array.isArray(r.exercises)||!r.exercises.length)throw Error('Routine requires identity, name and exercises');
 const ids=new Set(),exerciseIds=new Set(),groupPositions=new Map();
 r.exercises.forEach((e,index)=>{if(exerciseIds.has(e.id))throw Error('Duplicate exercise id');exerciseIds.add(e.id);if(e.groupId){const positions=groupPositions.get(e.groupId)||[];positions.push(index);groupPositions.set(e.groupId,positions);}});
 for(const positions of groupPositions.values())if(positions.at(-1)-positions[0]+1!==positions.length)throw Error('Circuit members must be consecutive');
 r.exercises.forEach(e=>{if(!e.id||!e.sets?.length)throw Error('Exercise requires identity and sets');e.sets.forEach(s=>{validatePrescription(s);if(ids.has(s.id))throw Error('Duplicate set id');ids.add(s.id);});});
 return true;
}
export function startWorkout(routine,id,startedAt) {
 validateRoutine(routine);
 if(!id||!Number.isFinite(Date.parse(startedAt)))throw Error('Workout identity and timestamp required');
 return {schemaVersion:SCHEMA_VERSION,id,startedAt,status:'active',routineId:routine.id,routineRevision:routine.revision||1,
  prescription:freeze(copy(routine)), results:Object.fromEntries(routine.exercises.flatMap(e=>e.sets.map(s=>[s.id,{kg:null,reps:null,rir:null,rpe:null,done:false,technique:'unknown',pain:false}]))),notes:''};
}
export function recordSet(workout,setId,patch) {
 if(workout.status!=='active'||!workout.results[setId])throw Error('Unknown or closed workout');
 const allowed=['kg','reps','rir','rpe','done','technique','pain','notes'];
 if(Object.keys(patch).some(k=>!allowed.includes(k)))throw Error('Unknown result field');
 const next=copy(workout), result={...next.results[setId],...patch};
 for(const k of ['kg','rir','rpe'])if(result[k]!=null&&!number(result[k]))throw Error('Invalid result '+k);
 if(result.reps!=null&&!integer(result.reps,0))throw Error('Invalid performed reps');
 if(result.rir!=null&&result.rir>10||result.rpe!=null&&(result.rpe<1||result.rpe>10))throw Error('Invalid performed effort');
 if(typeof result.done!=='boolean'||typeof result.pain!=='boolean'||!['unknown','valid','compromised'].includes(result.technique))throw Error('Invalid execution flags');
 if(result.done&&(!number(result.kg)||!integer(result.reps,0)))throw Error('Complete performed values first');
 next.results[setId]=result;next.prescription=workout.prescription;return next;
}
export function finishWorkout(workout,finishedAt) {
 if(workout.status!=='active'||!Number.isFinite(Date.parse(finishedAt))||Date.parse(finishedAt)<Date.parse(workout.startedAt))throw Error('Invalid finish');
 if(!Object.values(workout.results).some(x=>x.done))throw Error('No sets recorded');
 return freeze({...copy(workout),finishedAt,status:'finished'});
}
export function executionOrder(routine) {
 validateRoutine(routine);
 const result=[],seen=new Set();
 for(const e of routine.exercises){
  const group=e.groupId?routine.exercises.filter(x=>x.groupId===e.groupId):[e];
  if(seen.has(e.id))continue;group.forEach(x=>seen.add(x.id));
  const circuit=group.length>1;
  if(circuit){for(let round=0;round<Math.max(...group.map(x=>x.sets.length));round++){for(const member of group){if(member.sets[round])result.push({exerciseId:member.id,setId:member.sets[round].id,round:round+1,groupId:e.groupId});}}}
  else {e.sets.forEach((s,i)=>result.push({exerciseId:e.id,setId:s.id,round:i+1,groupId:null}));}
 }
 return result;
}
export function diffTemplate(original,customized) {
 const out=[];
 const walk=(a,b,path)=>{
  if(JSON.stringify(a)===JSON.stringify(b))return;
  if(Array.isArray(a)&&Array.isArray(b)&&a.every(x=>x?.id)&&b.every(x=>x?.id)){
   const before=a.map(x=>x.id),after=b.map(x=>x.id);
   if(JSON.stringify(before)!==JSON.stringify(after))out.push({path:path+'.$order',before,after});
   for(const id of new Set([...before,...after]))walk(a.find(x=>x.id===id),b.find(x=>x.id===id),path+'['+id+']');
  }else if(a&&b&&typeof a==='object'&&typeof b==='object'&&!Array.isArray(a)&&!Array.isArray(b)){
   for(const k of new Set([...Object.keys(a),...Object.keys(b)]))if(!['id','revision','updatedAt','createdAt'].includes(k))walk(a[k],b[k],path?path+'.'+k:k);
  }else out.push({path,before:copy(a??null),after:copy(b??null)});
 };
 walk(original,customized,'');return out;
}
export function proposeProgression(workout,exerciseId,rule,previousFailures=0) {
 if(workout.status!=='finished')throw Error('Finish workout before progression');
 if(!integer(previousFailures,0))throw Error('Invalid failure history');
 if(!rule?.version||!['linear','double','manual'].includes(rule.type))throw Error('Versioned rule required');
 const e=workout.prescription.exercises.find(x=>x.id===exerciseId);if(!e)throw Error('Unknown exercise');
 const sets=e.sets.filter(s=>s.kind!=='warmup'),results=sets.map(s=>({prescribed:s,actual:workout.results[s.id]}));
 const base={rule:copy(rule),exerciseId,requiresAcceptance:true,sourceWorkoutId:workout.id,prescriptionFingerprint:JSON.stringify(e)};
 const hold=reason=>({...base,action:'hold',reason,loads:sets.map(s=>s.kg)});
 if(!sets.length)return hold('no_work_sets');
 if(results.some(({actual:a})=>a?.pain||a?.technique==='compromised'))return {...hold('pain_or_technique'),action:'stop'};
 if(results.some(({actual:a})=>!a?.done||a.technique!=='valid'||!number(a.kg)))return hold('incomplete_or_unconfirmed_technique');
 if(rule.type==='manual')return hold('manual_rule');
 if(sets.some(s=>s.kg==null||s.repsMin==null||s.repsMax==null))return hold('prescription_incomplete');
 if(!positive(rule.incrementKg)||!positive(rule.roundingKg))throw Error('Configure increment and equipment rounding');
 const success=results.every(({prescribed:p,actual:a})=>a.reps>=(rule.type==='double'?p.repsMax:p.repsMin)&& (p.kg==null||a.kg>=p.kg));
 if(success){
  const loads=results.map(({actual:a})=>roundLoad(a.kg+rule.incrementKg,rule.roundingKg,'down'));
  if(loads.some((kg,i)=>kg<=results[i].actual.kg))return hold('increment_below_equipment_step');
  return {...base,action:'increase',reason:'all_required_sets_completed',loads,reps:sets.map(s=>s.repsMin)};
 }
 const failures=previousFailures+1;
 if(rule.resetAfter!=null&&(!integer(rule.resetAfter,1)||!number(rule.resetPercent)||rule.resetPercent<=0||rule.resetPercent>=100))throw Error('Invalid reset settings');
 if(rule.resetAfter&&failures>=rule.resetAfter)return {...base,action:'reset',reason:'repeated_incomplete_sessions',failures,loads:sets.map(s=>s.kg==null?null:roundLoad(s.kg*(1-rule.resetPercent/100),rule.roundingKg,'down'))};
 return {...hold(rule.type==='double'?'repeat_until_upper_rep_range':'repeat_load'),failures};
}
export function applyProposal(routine,proposal) {
 if(!['increase','reset'].includes(proposal.action))throw Error('Proposal does not change load');
 if(!Array.isArray(proposal.loads)||proposal.loads.some(kg=>!number(kg)))throw Error('Invalid proposal loads');
 const r=copy(routine),e=r.exercises.find(x=>x.id===proposal.exerciseId);if(!e)throw Error('Unknown exercise');
 if(JSON.stringify(e)!==proposal.prescriptionFingerprint)throw Error('Prescription changed; recalculate proposal');
 const sets=e.sets.filter(s=>s.kind!=='warmup');if(sets.length!==proposal.loads.length)throw Error('Prescription changed; recalculate proposal');
 sets.forEach((s,i)=>{s.kg=proposal.loads[i];if(proposal.reps)s.repsMin=s.repsMax=proposal.reps[i];});r.revision=(r.revision||1)+1;return r;
}
export function generateLinkedWeek(template,referenceLoads,weekIndex,roundingKg) {
 if(!integer(weekIndex,1)||!template.versionId||!Array.isArray(template.sessions))throw Error('Invalid template/week');
 return template.sessions.map(session=>({...copy(session),weekIndex,versionId:template.versionId,exercises:session.exercises.map(e=>({...copy(e),sets:e.sets.map(s=>{
  const reference=referenceLoads[e.exerciseId];if(!number(reference)||!positive(s.referenceFactor))throw Error('Explicit reference and per-set factor required');
  return {...copy(s),kg:roundLoad(reference*s.referenceFactor,roundingKg,'down'),referenceKg:reference};
 })}))}));
}
export function enduranceConflicts(events,windowHours=24) {
 if(!positive(windowHours))throw Error('Invalid conflict window');
 const warnings=[];for(const strength of events.filter(e=>e.sport==='strength'&&e.lowerBodyHeavy))for(const endurance of events.filter(e=>e.sport!=='strength'&&e.intensity==='hard')){
  const difference=(Date.parse(endurance.startsAt)-Date.parse(strength.startsAt))/3600000;
  if(Number.isFinite(difference)&&Math.abs(difference)<=windowHours)warnings.push({strengthId:strength.id,enduranceId:endurance.id,hoursApart:Math.abs(difference),reason:'potential_lower_body_fatigue',advisory:true});
 }return warnings;
}
export function migrateLegacy(data) {
 if(data.schemaVersion===2)return copy(data);
 const routine=r=>({...copy(r),revision:r.revision||1,exercises:r.exercises.map((e,i)=>({...copy(e),id:e.id||r.id+'-e'+i,sets:e.sets.map((s,j)=>({...copy(s),id:s.id||r.id+'-e'+i+'-s'+j,kind:['Riscaldamento','Warm-up','Warmup'].includes(s.kind)?'warmup':'work',kg:s.kg==null||s.kg===''?null:Number(s.kg),repsMin:s.reps==null||s.reps===''?null:Number(s.reps),repsMax:s.reps==null||s.reps===''?null:Number(s.reps),restSeconds:s.rest==null||s.rest===''?null:Number(s.rest),legacyUnspecifiedReps:s.reps==null||s.reps===''}))}))});
 return {schemaVersion:2,routines:(data.routines||[]).map(routine),history:(data.history||[]).map(h=>({...copy(h),legacy:true,prescriptionUnavailable:true})),legacyBackup:copy(data)};
}
export function csvHistory(workouts) {
 const cell=x=>{const v=String(x??'');return '"'+(/^[=+@\-\t\r]/.test(v)?"'":'')+v.replaceAll('"','""')+'"';};const rows=[['workout','startedAt','exercise','set','prescribedKg','repsMin','repsMax','performedKg','performedReps','done','rir','rpe']];
 for(const w of workouts){if(!w.prescription)continue;for(const e of w.prescription.exercises)for(const s of e.sets){const a=w.results[s.id]||{};rows.push([w.id,w.startedAt,e.name,s.id,s.kg,s.repsMin,s.repsMax,a.kg,a.reps,a.done,a.rir,a.rpe]);}}
 return '\uFEFF'+rows.map(row=>row.map(cell).join(',')).join('\r\n');
}
export function createProgram({id,template,referenceLoads,weeks,startDate,roundingKg,deloadWeeks=[],deloadFactor}) {
 if(!id||!integer(weeks,1)||weeks>52||!/^\d{4}-\d{2}-\d{2}$/.test(startDate)||!Number.isFinite(Date.parse(startDate+'T12:00:00Z'))||new Date(startDate+'T12:00:00Z').toISOString().slice(0,10)!==startDate)throw Error('Invalid program');
 if(deloadWeeks.some(w=>!integer(w,1)||w>weeks)||(deloadWeeks.length&&(!positive(deloadFactor)||deloadFactor>=1)))throw Error('Invalid deload schedule');
 // Preview uses fixed reference. Future loads are NOT increased before performance is logged.
 return {schemaVersion:2,id,templateSnapshot:freeze(copy(template)),startDate,roundingKg,referenceHistory:[{effectiveWeek:1,loads:copy(referenceLoads),reason:'initial'}],weeks:Array.from({length:weeks},(_,i)=>{
  const weekIndex=i+1,deload=deloadWeeks.includes(weekIndex),refs=Object.fromEntries(Object.entries(referenceLoads).map(([k,v])=>[k,deload?v*deloadFactor:v]));
  return {weekIndex,deload,loadStatus:i===0?'current':'provisional',sessions:generateLinkedWeek(template,refs,weekIndex,roundingKg)};
 })};
}
export function acceptReferenceUpdate(program,{effectiveWeek,loads,sourceWorkoutId}) {
 if(!integer(effectiveWeek,2)||effectiveWeek>program.weeks.length||!sourceWorkoutId||effectiveWeek<program.referenceHistory.at(-1).effectiveWeek)throw Error('Invalid reference update');
 const p=copy(program),original=p.referenceHistory.at(-1).loads;
 if(Object.keys(loads).some(k=>!(k in original)||!number(loads[k])))throw Error('Invalid reference loads');
 const next={...original,...loads};
 p.referenceHistory.push({effectiveWeek,loads:next,sourceWorkoutId,reason:'accepted_proposal'});
 for(const w of p.weeks)if(w.weekIndex>=effectiveWeek&&!w.completed){
  if(w.deload)continue; // Deload prescriptions are intentionally retained for review.
  w.sessions=generateLinkedWeek(p.templateSnapshot,next,w.weekIndex,p.roundingKg);w.loadStatus=w.weekIndex===effectiveWeek?'current':'provisional';
 }
 return p;
}
export function routineFromLegacy(routine) {return migrateLegacy({routines:[routine],history:[]}).routines[0];}
export function validateProgram(p) {
 if(!p?.id||!p.templateSnapshot?.versionId||!positive(p.roundingKg)||!Array.isArray(p.weeks)||!p.weeks.length||p.weeks.length>52||!Array.isArray(p.referenceHistory)||!p.referenceHistory.length)throw Error('Invalid program');
 if(!/^\d{4}-\d{2}-\d{2}$/.test(p.startDate)||!Number.isFinite(Date.parse(p.startDate+'T12:00:00Z'))||new Date(p.startDate+'T12:00:00Z').toISOString().slice(0,10)!==p.startDate)throw Error('Invalid program date');
 if(!Array.isArray(p.templateSnapshot.sessions)||!p.templateSnapshot.sessions.length)throw Error('Invalid program template');
 const initialRefs=p.referenceHistory[0]?.loads;
 if(!initialRefs)throw Error('Missing reference loads');
 generateLinkedWeek(p.templateSnapshot,initialRefs,1,p.roundingKg);
 const weekIds=new Set();
 for(const w of p.weeks){if(!integer(w.weekIndex,1)||weekIds.has(w.weekIndex)||!Array.isArray(w.sessions)||!w.sessions.length)throw Error('Invalid program week');weekIds.add(w.weekIndex);const sessions=new Set();for(const se of w.sessions){if(!se.id||sessions.has(se.id)||!Array.isArray(se.exercises)||!se.exercises.length)throw Error('Invalid program session');sessions.add(se.id);validateRoutine({id:se.id,name:se.name||se.id,exercises:se.exercises.map(e=>({...e,id:e.exerciseId,sets:e.sets}))});for(const e of se.exercises)for(const st of e.sets)if(!positive(st.referenceFactor)||!number(st.kg))throw Error('Invalid program load rule');}}
 for(const h of p.referenceHistory)if(!integer(h.effectiveWeek,1)||!h.loads||Object.values(h.loads).some(v=>!number(v)))throw Error('Invalid reference history');
 return true;
}
export function validateImport(value) {
 if(!value||value.schemaVersion!==2||!Array.isArray(value.routines)||!Array.isArray(value.history))throw Error('Unsupported backup');
 if(value.programs!=null&&!Array.isArray(value.programs))throw Error('Invalid program list');
 const programIds=new Set();for(const p of value.programs||[]){validateProgram(p);if(programIds.has(p.id))throw Error('Duplicate program identity');programIds.add(p.id);}
 if(JSON.stringify(value).length>5000000)throw Error('Backup too large');
 const ids=new Set();for(const r of value.routines){validateRoutine(r);if(ids.has(r.id))throw Error('Duplicate routine identity');ids.add(r.id);}
 for(const h of value.history){if(h.programRef&&(!h.programRef.programId||!integer(h.programRef.week,1)||!h.programRef.sessionId))throw Error('Invalid program reference');if(h.legacy&&h.prescriptionUnavailable)continue;if(h.status!=='finished'||!h.prescription||!h.results)throw Error('Invalid workout history');validateRoutine(h.prescription);for(const e of h.prescription.exercises)for(const s of e.sets){const a=h.results[s.id];if(!a)throw Error('Missing set result');recordSet({...h,status:'active'},s.id,a);}}
 return copy(value);
}
