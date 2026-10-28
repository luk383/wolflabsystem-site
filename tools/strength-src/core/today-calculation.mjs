/* Phase 1 calculator, not a goal/sport-based prescriber. Numeric v2 routines
 * only: UI adapters stay in lab.ts. No defaults for volume or loading. */
import {copy,validateRoutine,createProgram} from './core.mjs';
const finite=n=>typeof n==='number'&&Number.isFinite(n);
export function calculateToday({id,routine,referenceLoads,factorPercent,setFactorsPercent={},roundingKg,date}){
 validateRoutine(routine);
 if(!id||!finite(factorPercent)||factorPercent<=0||factorPercent>150||!finite(roundingKg)||roundingKg<=0)throw Error('explicit_loading_parameters_required');
 if(!referenceLoads||typeof referenceLoads!=='object')throw Error('reference_loads_required');
 const exerciseIds=new Set(routine.exercises.map(e=>e.id)),setIds=new Set(routine.exercises.flatMap(e=>e.sets.map(s=>s.id)));
 if(Object.keys(referenceLoads).some(k=>!exerciseIds.has(k))||Object.keys(setFactorsPercent).some(k=>!setIds.has(k)))throw Error('unknown_loading_identity');
 const exercises=routine.exercises.map(e=>{
  const ref=referenceLoads[e.id];if(!finite(ref)||ref<0)throw Error('reference_required_'+e.id);
  return {...copy(e),exerciseId:e.id,sets:e.sets.map(s=>{
   // Ramps/warmups require their own explicit factor, never silently flatten.
   const pct=setFactorsPercent[s.id]??(s.kind==='work'?factorPercent:null);
   if(!finite(pct)||pct<=0||pct>150)throw Error('set_factor_required_'+s.id);
   const next={...copy(s),referenceFactor:pct/100};delete next.kg;return next;
  })};
 });
 const template={versionId:'wolflab-explicit-session-1',method:'user-parameter-calculation',sourceRoutineId:routine.id,sourceRoutineRevision:routine.revision||1,loadingParameters:{factorPercent,setFactorsPercent:copy(setFactorsPercent),referenceType:'user_chosen_kg',roundingMode:'down'},sessions:[{id:'today',name:routine.name,exercises}]};
 const program=createProgram({id,template,referenceLoads:copy(referenceLoads),weeks:1,startDate:date,roundingKg});
 const session=program.weeks[0].sessions[0];
 const result={...copy(routine),id:id+'-today',revision:1,method:'WOLFLAB · parametri scelti',programRef:{programId:id,week:1,sessionId:'today'},calculation:{ruleVersion:template.versionId,sourceRoutineId:routine.id,sourceRoutineRevision:routine.revision||1,referenceType:'user_chosen_kg',roundingMode:'down'},exercises:session.exercises.map(e=>{const out=copy(e);delete out.exerciseId;return out;})};
 // Old source snapshots would describe the uncalculated routine and mislead diffs.
 delete result.source;
 validateRoutine(result);
 return {program:{...program,name:routine.name,routineId:routine.id,routineName:routine.name,routineSnapshot:copy(routine)},routine:result};
}
