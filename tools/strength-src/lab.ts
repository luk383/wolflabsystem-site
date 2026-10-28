// Adattatori tra l'editor del builder (valori testuali) e il nucleo v2 (numerico, versionato).
// Nessuna logica di dominio duplicata: progressione, diff, ordine circuito, CSV e salvataggio stanno in ./core.
// @ts-nocheck
import {routineFromLegacy,startWorkout,recordSet,finishWorkout,diffTemplate,copy} from './core/core.mjs';
export const KIND={work:'Lavoro',warm:'Riscaldamento',ramp:'Crescente'};
const uid=()=>Math.random().toString(36).slice(2,10);
export const clone=(x:any)=>JSON.parse(JSON.stringify(x));
const num=(x:any)=>x===''||x==null||!Number.isFinite(Number(x))?null:Number(x);
const free=(set:Set<string>,want:string,base:string)=>{let id=want&&!set.has(want)?want:'',k=set.size+1;while(!id||set.has(id)){id=base+k;k++;}set.add(id);return id;};
export function normalize(r:any){
  const n=clone(r),eIds=new Set<string>(),sIds=new Set<string>();
  n.exercises=(n.exercises||[]).map((e:any)=>{const id=free(eIds,e.id,'x');
    return {...e,id,sets:(e.sets||[]).map((s:any)=>({...s,id:free(sIds,s.id,'s')}))};});
  return n;
}
const kindOut=(l:string)=>l===KIND.warm?'warmup':l===KIND.ramp?'ramp':'work';
const kindIn=(k:string)=>k==='warmup'?KIND.warm:k==='ramp'?KIND.ramp:KIND.work;
export function uiToV2(r:any){
  const n=normalize(r);routineFromLegacy(n);
  const out:any={id:n.id,name:n.name,method:n.method,notes:n.notes||'',revision:n.revision||1};
  if(n.goal)out.goal=n.goal;if(n.split)out.split=n.split;if(n.source)out.source=clone(n.source);
  out.exercises=n.exercises.map((e:any)=>{const x:any={id:e.id,name:e.name,muscle:e.muscle,equipment:e.equipment,notes:e.notes||''};if(e.groupId)x.groupId=e.groupId;
    x.sets=e.sets.map((s:any)=>{const reps=num(s.reps),mx=num(s.repsMax);return {id:s.id,kind:kindOut(s.kind),kg:num(s.kg),repsMin:reps,repsMax:reps!=null&&mx!=null?mx:reps,restSeconds:num(s.rest)};});return x;});
  return out;
}
export function v2ToUi(v:any){
  const r=clone(v);
  r.exercises=r.exercises.map((e:any)=>({...e,sets:e.sets.map((s:any)=>({...s,kg:s.kg==null?'':String(s.kg),reps:s.repsMin==null?'':String(s.repsMin),repsMax:s.repsMax!=null&&s.repsMax!==s.repsMin?String(s.repsMax):'',rest:s.restSeconds==null?'':String(s.restSeconds),kind:kindIn(s.kind),done:false}))}));
  return r;
}
export const toStore=(ui:any)=>({schemaVersion:2,routines:ui.routines.map(uiToV2),history:ui.history});
export const fromStore=(d:any)=>({routines:d.routines.map(v2ToUi),history:d.history});
export function groupsOk(r:any){
  const seen:Record<string,number>={};let last='';
  for(let i=0;i<r.exercises.length;i++){const g=r.exercises[i].groupId||'';if(g&&g!==last&&seen[g]!==undefined)return false;if(g)seen[g]=i;last=g;}
  return true;
}
// Registro finale: prescrizione congelata dalla scheda all'avvio, risultati per id serie.
export function buildWorkout(session:any){
  const base=uiToV2(session.base);if(base.source)delete base.source.snapshot;
  let w=startWorkout(base,'w'+session.started,new Date(session.started).toISOString());
  session.exercises.forEach((e:any,i:number)=>e.sets.forEach((s:any,j:number)=>{
    const id=base.exercises[i].sets[j].id,kg=num(s.kg),reps=num(s.reps);
    const ok=s.done&&kg!=null&&Number.isInteger(reps)&&reps>=0;
    w=recordSet(w,id,{kg:kg!=null&&kg>=0?kg:null,reps:Number.isInteger(reps)&&reps>=0?reps:null,done:!!ok,technique:(session.technique||{})[e.id]||'unknown',pain:!!(session.pain||{})[e.id]});
  }));
  const f=finishWorkout(w,new Date().toISOString());
  return {...f,name:session.name};
}
const FIELD:any={kg:'kg',repsMin:'ripetizioni',repsMax:'ripetizioni',restSeconds:'recupero',kind:'tipo serie',groupId:'circuito',name:'nome'};
export function readableDiff(source:any,current:any){
  const rows:string[]=[];
  const nm=(id:string)=>(current.exercises.find((e:any)=>e.id===id)||source.exercises.find((e:any)=>e.id===id)||{name:id}).name;
  const idx=(eid:string,sid:string)=>{const e=current.exercises.find((x:any)=>x.id===eid)||source.exercises.find((x:any)=>x.id===eid);return e?e.sets.findIndex((s:any)=>s.id===sid)+1:0;};
  const seen=new Set<string>();
  for(const d of diffTemplate(source,current)){
    const m=d.path.match(/^exercises\[([^\]]+)\](?:\.sets\[([^\]]+)\])?(?:\.(.+))?$/);
    let t='';
    if(d.path==='exercises.$order')t='Ordine o numero degli esercizi cambiato';
    else if(m&&m[3]==='sets.$order')t=nm(m[1])+': numero o ordine delle serie cambiato';
    else if(m&&!m[2]&&!m[3])t=nm(m[1])+(d.before==null?': esercizio aggiunto':': esercizio rimosso');
    else if(m&&m[2]&&!m[3])t=nm(m[1])+' · serie '+(idx(m[1],m[2])||'')+(d.before==null?' aggiunta':' rimossa');
    else if(m&&FIELD[m[3]]){const f=FIELD[m[3]];const p=m[2]?nm(m[1])+' · serie '+idx(m[1],m[2]):nm(m[1]);const vv=(x:any)=>x==null?'—':m[3]==='kind'?kindIn(x):x;t=p+' · '+f+': '+vv(d.before)+' → '+vv(d.after);}
    if(t&&!seen.has(t)){seen.add(t);rows.push(t);}
  }
  return rows;
}

export async function saveText(text:string,filename:string,mime:string):Promise<'saved'|'cancelled'|'error'|'download'>{
  const N=(window as any).WolfNative;
  if(N&&typeof N.exportText==='function'){try{const r=await N.exportText({text,filename,mime:mime.split(';')[0]});return r&&r.saved===true?'saved':'error';}catch(e:any){return e&&(e.code==='CANCELLED'||e.message==='CANCELLED')?'cancelled':'error';}}
  try{const b=new Blob([text],{type:mime}),u=URL.createObjectURL(b),a=document.createElement('a');a.href=u;a.download=filename;a.click();URL.revokeObjectURL(u);return 'download';}catch(e){return 'error';}
}
export const saveMsg=(r:string)=>r==='saved'?'File salvato.':r==='cancelled'?'Salvataggio annullato: nessun file creato.':r==='error'?'Salvataggio non riuscito: nessun file creato.':'';
export async function pickText():Promise<string|null|undefined|'cancelled'>{
  const N=(window as any).WolfNative;if(!(N&&typeof N.importText==='function'))return undefined;
  try{const r=await N.importText();if(!r||typeof r.text!=='string')return null;return r.text;}catch(e:any){return e&&(e.code==='CANCELLED'||e.message==='CANCELLED')?'cancelled':null;}
}
