import {migrateLegacy,copy} from './core.mjs';
/* Storage is injected for tests. No global storage access, implicit opt-in or key removal. */
export function loadState(storage,key) {
 const raw=storage.getItem(key);if(raw==null)return {data:null,saved:false,migrated:false};
 let env;try{env=JSON.parse(raw);}catch{throw Error('storage_corrupt');}
 if(![1,2].includes(env.schema)||!env.data)throw Error('storage_schema_unsupported');
 const data=env.schema===1?migrateLegacy(env.data):copy(env.data);
 return {data,saved:true,migrated:env.schema===1,originalEnvelope:raw,activeSession:env.activeSession||null,timerDeadline:env.timerDeadline||0};
}
export function saveState(storage,key,{data,activeSession=null,timerDeadline=0},optIn,now=Date.now()) {
 if(!optIn)return {saved:false,reason:'opt_in_required'};
 if(data?.schemaVersion!==2)throw Error('storage_schema_unsupported');
 const current=storage.getItem(key);
 if(current){let env;try{env=JSON.parse(current);}catch{throw Error('storage_corrupt');}
  if(![1,2].includes(env.schema)||!env.data)throw Error('storage_schema_unsupported');
  if(env.schema===1&&!storage.getItem(key+'.schema1-backup'))storage.setItem(key+'.schema1-backup',current);
 }
 const value=JSON.stringify({schema:2,saved:now,data,activeSession,timerDeadline});
 try {storage.setItem(key,value);}catch{throw Error('storage_write_failed');}
 if(storage.getItem(key)!==value)throw Error('storage_verification_failed');
 return {saved:true,savedAt:now};
}
export function exportBackup(storage,key,state) {return JSON.stringify({format:'wolf-strength-backup',schema:2,exportedAt:new Date().toISOString(),state,originalSchema1:storage.getItem(key+'.schema1-backup')},null,2);}
export function clearState(storage,key,confirmed=false) {
 if(!confirmed)throw Error('confirmation_required');
 storage.removeItem(key);storage.removeItem(key+'.schema1-backup');
}
export function mergeImport(existing,incoming,mode='append') {
 if(!['append','replace'].includes(mode))throw Error('import_mode_invalid');
 if(mode==='replace')return copy(incoming);
 const merge=(a,b)=>{const result=copy(a);for(const x of b){const prior=result.find(y=>y.id===x.id);if(!prior)result.push(copy(x));else if(JSON.stringify(prior)!==JSON.stringify(x))throw Error('import_id_conflict');}return result;};
 return {...copy(existing),routines:merge(existing.routines,incoming.routines),history:merge(existing.history,incoming.history),programs:merge(existing.programs||[],incoming.programs||[])};
}
