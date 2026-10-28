import {copy,freeze,roundLoad,validateRoutine,createProgram,acceptReferenceUpdate} from './core.mjs';
const positive=n=>typeof n==='number'&&Number.isFinite(n)&&n>0;
function factors(values,count,label){if(!Array.isArray(values)||values.length!==count||values.some(x=>!positive(x)))throw Error('Explicit factors required: '+label);return values;}
/* One source/version, explicit loading parameters. Never mix source variants. */
export function buildMadcowTemplate(config) {
 const {versionId,source,exercises,loading}=config||{};
 if(!versionId||!source?.url||!source?.label||!exercises||!loading)throw Error('Version, source and explicit configuration required');
 const names=['squat','bench','row','press','deadlift'];for(const role of names)if(!exercises[role]?.id||!exercises[role]?.name)throw Error('Missing exercise role '+role);
 if(new Set(names.map(k=>exercises[k].id)).size!==names.length)throw Error('Distinct exercise identities required');
 const make=(role,day,reps,fs)=>{
  const e=exercises[role],options=e.setOptions||{};
  const out={exerciseId:e.id,name:e.name,muscle:e.muscle||'',equipment:e.equipment||'',notes:e.notes||'',sets:reps.map((rep,i)=>({...copy(options),id:day+'-'+e.id+'-s'+(i+1),kind:reps.length===6&&i===5?'work':'ramp',repsMin:rep,repsMax:rep,referenceFactor:fs[i],role:reps.length===6?(i===4?'top_triple':i===5?'backoff':'ramp'):(i===reps.length-1?'top':'ramp')}))};
  validateRoutine({id:day,name:day,exercises:[{...out,id:e.id}]});return out;
 };
 const monday=['squat','bench','row'].map(role=>{const f=factors(loading[role]?.monday,5,role+' monday');if(f[4]!==1||f.some((v,i)=>i>0&&v<=f[i-1]))throw Error('Monday must ascend to top-set reference 1');return make(role,'A',[5,5,5,5,5],f);});
 const sq=loading.squat.monday;
 const wednesday=[make('squat','B',[5,5,5,5],[sq[0],sq[1],sq[2],sq[2]]),...['press','deadlift'].map(role=>{
  const f=factors(loading[role]?.wednesday,4,role+' wednesday');if(f[3]!==1||f.some((v,i)=>i>0&&v<=f[i-1]))throw Error('Wednesday press/deadlift ascend to own reference');return make(role,'B',[5,5,5,5],f);
 })];
 const friday=['squat','bench','row'].map(role=>{const f=factors(loading[role]?.friday,6,role+' friday');const mon=loading[role].monday;
  if(f.slice(0,4).some((v,i)=>v!==mon[i])||f[4]<=1||f[5]>=f[4])throw Error('Friday first four match Monday, explicit heavier triple and lighter backoff required');
  return make(role,'C',[5,5,5,5,3,8],f);
 });
 return freeze({versionId,method:'madcow-adaptation',source:copy(source),loadingParameters:copy(loading),adaptation:true,sessions:[{id:'A',name:'A',exercises:monday},{id:'B',name:'B',exercises:wednesday},{id:'C',name:'C',exercises:friday}]});
}
export function createMethodProgram({config,...program}) {return createProgram({...program,template:buildMadcowTemplate(config)});}
/* Digital WOLFLAB rule: a successful Friday triple becomes next Monday's top five reference.
 This is a proposal, not automatic progression and not a clinical/historical claim. */
export function proposeTopSetReference(program,workout,{ruleVersion,roundingKg}) {
 const base={action:'hold',requiresAcceptance:true,ruleVersion,programId:program.id,sourceWorkoutId:workout.id,sourceWeek:workout.programRef?.week,programFingerprint:JSON.stringify(program)};
 const hold=reason=>({...base,reason,loads:{}});
 if(!ruleVersion||!positive(roundingKg))throw Error('Explicit version and equipment rounding required');
 if(program.roundingKg!==roundingKg)return hold('equipment_rounding_changed');
 if(workout.status!=='finished'||workout.programRef?.programId!==program.id||workout.programRef?.sessionId!=='C')return hold('wrong_source_session');
 if(program.templateSnapshot.method!=='madcow-adaptation')return hold('wrong_program_method');
 const expected=program.weeks.find(w=>w.weekIndex===workout.programRef.week)?.sessions.find(s=>s.id==='C');
 if(!expected)return hold('source_week_missing');
 const loads={};
 for(const e of expected.exercises){
  const prescribed=workout.prescription.exercises.find(x=>x.id===e.exerciseId);
  if(!prescribed||prescribed.sets.length!==e.sets.length)return hold('prescription_changed');
  for(let i=0;i<e.sets.length;i++){
   const set=e.sets[i],p=prescribed.sets[i],a=workout.results[p.id];
   if(p.id!==set.id||p.kg!==set.kg||p.repsMin!==set.repsMin||p.repsMax!==set.repsMax)return hold('prescription_changed');
   if(a?.pain||a?.technique==='compromised')return {...hold('pain_or_technique'),action:'stop'};
   if(!a?.done||a.technique!=='valid'||a.reps<set.repsMin||a.kg<set.kg)return hold('required_sets_incomplete');
  }
  const triple=e.sets.find(s=>s.role==='top_triple');if(!triple)return hold('triple_missing');
  // At least the prescribed triple is carried, not an unplanned heavier actual load.
  loads[e.exerciseId]=roundLoad(triple.kg,roundingKg,'down');
  const current=program.referenceHistory.at(-1).loads[e.exerciseId];
  if(!positive(current)||loads[e.exerciseId]<=current)return hold('no_increase_after_rounding');
 }
 return {...base,action:'reference_proposal',reason:'friday_completed',loads};
}
export function acceptTopSetReference(program,proposal,{effectiveWeek,loggedWeeks=[]}) {
 if(proposal.action!=='reference_proposal'||proposal.programId!==program.id||proposal.programFingerprint!==JSON.stringify(program))throw Error('Invalid or stale proposal');
 const lower=Math.max(2,proposal.sourceWeek+1,...loggedWeeks.map(x=>x+1));if(effectiveWeek<lower)throw Error('Cannot change performed or source weeks');
 const p=copy(program);p.weeks=p.weeks.map(w=>loggedWeeks.includes(w.weekIndex)?{...w,completed:true}:w);
 return acceptReferenceUpdate(p,{effectiveWeek,loads:proposal.loads,sourceWorkoutId:proposal.sourceWorkoutId});
}
