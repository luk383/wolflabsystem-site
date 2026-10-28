/* Phase 1 navigation context, selective profile import and Today projection.
 * No storage, dose selection, method recommendation or external calls. */
import {copy,executionOrder} from './core.mjs';
export const GOALS=['strength','hypertrophy','power','endurance'];
export const LEVELS=['beginner','intermediate','advanced'];
export const TIME_BUDGETS=['20-30','30-45','45-60','60+'];
export const SPORTS=['run','bike','swim','triathlon','hyrox','hybrid','strength'];
export function validateWizardContext(c){
 if(!c||!GOALS.includes(c.goal)||!LEVELS.includes(c.experience)||!TIME_BUDGETS.includes(c.timeBudget))throw Error('wizard_context_incomplete');
 if(!Array.isArray(c.sports)||c.sports.some(s=>!SPORTS.includes(s))||new Set(c.sports).size!==c.sports.length)throw Error('wizard_sports_invalid');
 if(c.age!=null&&(!Number.isInteger(c.age)||c.age<=0||c.age>120))throw Error('wizard_age_invalid');
 if(c.weightKg!=null&&(!Number.isFinite(c.weightKg)||c.weightKg<=0||c.weightKg>=1000))throw Error('wizard_weight_invalid');
 return true;
}
/* Call only after the explicit import tap. Merge/confirmation belongs to UI.
 * No reads from storage and no replacement of pre-existing user values. */
export function previewWolfProfile(raw){
 let env;try{env=typeof raw==='string'?JSON.parse(raw):copy(raw);}catch{throw Error('wolf_profile_corrupt');}
 if(!env||!env.v||typeof env.v!=='object'||Array.isArray(env.v))throw Error('wolf_profile_invalid');
 const v=env.v,fields={},rejected=[];
 for(const [key,out,integer,max] of [['age','age',true,120],['weight','weightKg',false,999.999]]){
  if(v[key]==null||String(v[key]).trim()==='')continue;
  const text=String(v[key]).trim().replace(',','.');const n=/^\d+(?:\.\d+)?$/.test(text)?Number(text):NaN;
  if(!Number.isFinite(n)||n<=0||n>max||integer&&!Number.isInteger(n))rejected.push(key);else fields[out]=n;
 }
 const sports=[];
 for(const [key,out] of [['sport-run','run'],['sport-bike','bike'],['sport-strength','strength']]){
  if(v[key]===true)sports.push(out);else if(v[key]!=null&&v[key]!==false)rejected.push(key);
 }
 if(['sport-run','sport-bike','sport-strength'].some(k=>typeof v[k]==='boolean'))fields.sports=sports;
 return {source:'wolf-my-v1',savedAt:typeof env.t==='number'&&Number.isFinite(env.t)?env.t:null,fields,rejected};
}
/* Existing immutable core workout is authoritative. Completed sets are never
 * selected as current, no time/goal/sport-based adjustment is inferred. */
export function todayCard(workout){
 if(!workout?.prescription||!workout.results)throw Error('workout_required');
 const order=executionOrder(workout.prescription);
 const completed=order.filter(s=>workout.results[s.setId]?.done===true).length;
 const pending=order.filter(s=>workout.results[s.setId]?.done!==true);
 const project=entry=>{if(!entry)return null;const e=workout.prescription.exercises.find(e=>e.id===entry.exerciseId);const s=e.sets.find(s=>s.id===entry.setId);return {exerciseId:e.id,exerciseName:e.name,setId:s.id,setNumber:e.sets.findIndex(x=>x.id===s.id)+1,setCount:e.sets.length,round:entry.round,groupId:entry.groupId,prescribed:copy(s),performed:copy(workout.results[s.id]||{})};};
 return {workoutId:workout.id,status:workout.status,completed,total:order.length,allSetsDone:completed===order.length,current:workout.status==='active'?project(pending[0]):null,next:workout.status==='active'?project(pending[1]):null};
}
