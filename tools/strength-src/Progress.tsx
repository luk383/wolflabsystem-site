// @ts-nocheck
import React,{useState} from 'react';
import {proposeProgression,applyProposal,executionOrder,csvHistory,validateImport} from './core/core.mjs';
import {mergeImport} from './core/storage.mjs';
import {uiToV2,v2ToUi,clone,readableDiff,toStore,fromStore,saveText,saveMsg,pickText} from './lab';
const REASON:any={
 all_required_sets_completed:'Tutte le serie richieste sono state completate al carico prescritto o oltre, con tecnica indicata come pulita.',
 no_work_sets:'Nessuna serie di lavoro da valutare.',
 pain_or_technique:'Dolore o tecnica compromessa: nessuna progressione. Se il dolore persiste, serve una valutazione appropriata.',
 incomplete_or_unconfirmed_technique:'Serie mancanti o tecnica non indicata: nessuna proposta. La tecnica la indichi tu, non viene dedotta dalle ripetizioni.',
 manual_rule:'Regola manuale: decidi tu il carico successivo.',
 prescription_incomplete:'Carico o ripetizioni prescritti mancanti: non si può valutare.',
 increment_below_equipment_step:'L’incremento è più piccolo del passo dei dischi: nessun aumento possibile.',
 repeat_load:'Ripeti questo carico.',
 repeat_until_upper_rep_range:'Ripeti finché non raggiungi il limite alto delle ripetizioni.',
 repeated_incomplete_sessions:'Sedute incomplete ripetute: riduzione di carico proposta.',
};
const ACTION:any={increase:'Proposta: aumentare',hold:'Proposta: mantenere',stop:'Proposta: fermare la progressione',reset:'Proposta: ridurre'};
const fmtP=(s:any)=>(s.kg==null?'carico da definire':s.kg+' kg')+' × '+(s.repsMin==null?'ripetizioni da definire':s.repsMin===s.repsMax?s.repsMin:s.repsMin+'–'+s.repsMax)+(s.side==='left'?' · sinistra':s.side==='right'?' · destra':s.side==='each'?' · ogni lato':'')+(s.rir!=null?' · RIR '+s.rir:'')+(s.rpe!=null?' · RPE '+s.rpe:'')+(s.tempo?' · tempo '+s.tempo:'');
const KL:any={work:'Lavoro',warmup:'Riscaldamento',ramp:'Crescente'};
const TECH:any={unknown:'non indicata',valid:'pulita',compromised:'compromessa'};
export function CircuitOrder({base}:any){
  const v=uiToV2(base);if(!v.exercises.some((e:any)=>e.groupId))return null;
  const lines:string[]=[];let last='';
  for(const o of executionOrder(v)){const e=v.exercises.find((x:any)=>x.id===o.exerciseId);const j=e.sets.findIndex((s:any)=>s.id===o.setId)+1;
    const key=o.groupId?o.groupId+'|'+o.round:o.exerciseId+'|'+j;
    if(o.groupId){if(key===last)lines[lines.length-1]+=' → '+e.name;else lines.push('Giro '+o.round+' · circuito '+o.groupId+': '+e.name);}else lines.push(e.name+' · serie '+j);
    last=key;}
  return <details className="circuit"><summary>Ordine di esecuzione</summary><ol>{lines.map((l,i)=><li key={i}>{l}</li>)}</ol><small>Gli esercizi con la stessa lettera si alternano serie dopo serie.</small></details>;
}
export function TechniqueBox({e,session,setSession}:any){
  const t=(session.technique||{})[e.id]||'unknown',p=!!(session.pain||{})[e.id];
  const set=(k:string,v:any)=>{const n=clone(session);n[k]=n[k]||{};n[k][e.id]=v;setSession(n);};
  return <div className="tech"><label>Tecnica<select aria-label={e.name+' tecnica'} value={t} onChange={v=>set('technique',v.target.value)}><option value="unknown">Non indicata</option><option value="valid">Pulita</option><option value="compromised">Compromessa</option></select></label><label className="check"><input type="checkbox" checked={p} aria-label={e.name+' dolore'} onChange={v=>set('pain',v.target.checked)}/> Dolore</label></div>;
}
export function DiffBox({draft}:any){
  if(!draft.source)return null;
  const rows=readableDiff(draft.source.snapshot,uiToV2(draft));
  return <details className="diffbox"><summary>{rows.length?'Scheda personalizzata · '+rows.length+(rows.length===1?' modifica':' modifiche'):'Uguale alla ricostruzione di partenza'}</summary><p>Base: {draft.source.label}. La ricostruzione non viene mai modificata: le differenze sono solo in questa copia.</p>{rows.length>0&&<ul>{rows.map((r,i)=><li key={i}>{r}</li>)}</ul>}</details>;
}
const missed=(w:any,eid:string)=>{const e=w.prescription.exercises.find((x:any)=>x.id===eid);if(!e)return null;const ws=e.sets.filter((s:any)=>s.kind!=='warmup');if(!ws.length)return null;return ws.some((s:any)=>{const a=w.results[s.id];return !a||!a.done||(s.repsMin!=null&&a.reps<s.repsMin)||(s.kg!=null&&a.kg<s.kg);});};
const priorFailures=(history:any[],k:number,w:any,eid:string)=>{let n=0;for(let i=k+1;i<history.length;i++){const h=history[i];if(!(h.schemaVersion===2&&h.prescription&&h.prescription.id===w.prescription.id))continue;const m=missed(h,eid);if(m===null)continue;if(m)n++;else break;}return n;};
function Proposal({w,e,routines,onApply,history,k}:any){
  const [type,setType]=useState(''),[inc,setInc]=useState(''),[rnd,setRnd]=useState(''),[ra,setRa]=useState(''),[rp,setRp]=useState(''),[msg,setMsg]=useState(''),[done,setDone]=useState(false);
  let p:any=null,err='';
  if(type&&Number(inc)>0&&Number(rnd)>0){const pf=priorFailures(history,k,w,e.id),useReset=Number(ra)>=1&&Number(rp)>0&&Number(rp)<100;try{p=proposeProgression(w,e.id,{type,version:'wolflab-digital-1',incrementKg:Number(inc),roundingKg:Number(rnd),...(useReset?{resetAfter:Number(ra),resetPercent:Number(rp)}:{})},useReset?pf:0);}catch(x:any){err='Regola non valida.';}}
  const apply=()=>{try{const cur=routines.find((r:any)=>r.id===w.prescription.id);if(!cur)throw Error('x');onApply(v2ToUi(applyProposal(uiToV2(cur),p)));setDone(true);setMsg('');}catch(x:any){setMsg('La scheda è cambiata dopo questo allenamento o non esiste più: la proposta non è più applicabile.');}};
  return <details><summary>Proposta di carico · {e.name}</summary>
   <p>Regola digitale WOLFLAB (versione wolflab-digital-1), scelta da te. Non è la regola di Starr e non è un consiglio personale. Nessun valore predefinito.</p>
   <div className="fields"><label>Regola<select aria-label={e.name+' regola'} value={type} onChange={v=>setType(v.target.value)}><option value="">Scegli…</option><option value="linear">Lineare</option><option value="double">Doppia</option><option value="manual">Manuale</option></select></label>{type==='linear'&&<p className="hint">Lineare: valuta il limite basso delle ripetizioni.</p>}{type==='double'&&<p className="hint">Doppia: valuta il limite alto delle ripetizioni.</p>}
   <label>Incremento · kg<input type="number" min="0" step="0.5" value={inc} aria-label={e.name+' incremento'} onChange={v=>setInc(v.target.value)}/></label>
   <label>Passo dei dischi · kg<input type="number" min="0" step="0.5" value={rnd} aria-label={e.name+' passo dischi'} onChange={v=>setRnd(v.target.value)}/></label><label>Riduzione dopo N sedute incomplete (opz.)<input type="number" min="1" value={ra} aria-label={e.name+' sedute incomplete'} onChange={v=>setRa(v.target.value)}/></label><label>Riduzione · % (opz.)<input type="number" min="1" max="99" value={rp} aria-label={e.name+' riduzione'} onChange={v=>setRp(v.target.value)}/></label></div>
   {err&&<p role="status">{err}</p>}
   {p&&<div className="notice" role="status"><b>{ACTION[p.action]}</b><p>{REASON[p.reason]||''}</p>{p.action!=='stop'&&p.loads&&<p>Carichi · {p.loads.map((x:any)=>x==null?'—':x+' kg').join(' · ')}</p>}{p.failures!=null&&<p>Sedute incomplete consecutive, questa compresa: {p.failures}</p>}{(p.action==='increase'||p.action==='reset')&&!done&&<button className="primary" onClick={apply}>Applica alla scheda</button>}{done&&<p>Applicata alla scheda. L’allenamento registrato non cambia.</p>}{msg&&<p>{msg}</p>}</div>}
  </details>;
}
function V2Item({w,routines,update,data,setPending,edit,k,onApply}:any){
  return <article><small>{new Date(w.finishedAt).toLocaleString('it-IT')}</small><h3>{w.name||w.prescription.name}</h3>
   {w.prescription.exercises.map((e:any)=>{const r0=w.results[e.sets[0].id]||{};return <div key={e.id}><b>{e.name}</b><small> · tecnica {TECH[r0.technique||'unknown']}{r0.pain?' · dolore segnalato':''}</small>
    <ul className="pe">{e.sets.map((s:any,j:number)=>{const a=w.results[s.id]||{};return <li key={s.id}>Serie {j+1} · {KL[s.kind]} · Prescritto {fmtP(s)} · Eseguito {a.done?a.kg+' kg × '+a.reps+(a.rir!=null?' · RIR '+a.rir:'')+(a.rpe!=null?' · RPE '+a.rpe:''):'non completata'}</li>;})}</ul>
    <Proposal w={w} e={e} routines={routines} onApply={onApply} history={data.history} k={k}/></div>;})}
   <div className="actions"><button onClick={()=>edit(v2ToUi({...w.prescription,id:String(Date.now()),name:(w.name||w.prescription.name)+' nuova scheda',revision:1}))}>Usa come nuova scheda</button><button onClick={()=>setPending({label:'Eliminare questa registrazione?',run:()=>update({...data,history:data.history.filter((_:any,i:number)=>i!==k)})})}>Elimina registrazione</button></div></article>;
}
function LegacyItem({w,data,update,setPending,edit,k}:any){
  return <article><small>{new Date(w.finished).toLocaleString('it-IT')}</small><h3>{w.name}</h3><p>Registro precedente: il carico prescritto non era salvato, quindi non viene ricostruito.</p>{w.exercises.map((e:any)=><div key={e.id}><b>{e.name}</b><p>{e.sets.filter((s:any)=>s.done).map((s:any)=>`${s.kg} kg × ${s.reps}`).join(' · ')||'Nessuna serie completata'}</p></div>)}
   <div className="actions"><button onClick={()=>edit({...clone(w),id:String(Date.now()),name:w.name+' nuova scheda',exercises:w.exercises.map((e:any)=>({...e,sets:e.sets.map((s:any)=>({...s,done:false}))}))})}>Usa come nuova scheda</button><button onClick={()=>setPending({label:'Eliminare questa registrazione?',run:()=>update({...data,history:data.history.filter((_:any,i:number)=>i!==k)})})}>Elimina registrazione</button></div></article>;
}
export function History({data,update,setPending,edit,setNotice}:any){
  const v2=data.history.filter((w:any)=>w.schemaVersion===2&&w.prescription);
  const csv=async()=>{const r=await saveText(csvHistory(v2),'wolflab-allenamenti.csv','text/csv;charset=utf-8');const extra=v2.length<data.history.length?'CSV con '+v2.length+' registrazioni. Quelle precedenti, senza prescritto salvato, non sono incluse.':'';setNotice([saveMsg(r),extra].filter(Boolean).join(' '));};
  const apply=(nr:any)=>update({...data,routines:data.routines.map((r:any)=>r.id===nr.id?nr:r)});
  return <><h2>Quello che hai fatto</h2><p>Per ogni serie vedi il carico prescritto e quello eseguito. Le proposte di carico sono solo proposte: si applicano se le accetti.</p>{!data.history.length&&<p>Nessun allenamento registrato. Avvia una scheda, completa una serie e termina.</p>}
   {data.history.map((w:any,k:number)=>w.schemaVersion===2&&w.prescription?<V2Item key={w.id||k} w={w} k={k} routines={data.routines} update={update} data={data} setPending={setPending} edit={edit} onApply={apply}/>:<LegacyItem key={k} w={w} k={k} data={data} update={update} setPending={setPending} edit={edit}/>)}
   {v2.length>0&&<div className="actions"><button onClick={csv}>Esporta CSV (prescritto ed eseguito)</button><button onClick={()=>window.print()}>Stampa o salva PDF</button></div>}</>;
}

export function ImportBox({data,update,setPending}:any){
  const [inc,setInc]=useState<any>(null),[msg,setMsg]=useState('');
  const parse=(t:string)=>{try{let v=JSON.parse(t);if(v&&v.format==='wolf-strength-backup')v=v.state&&v.state.data;const ok=validateImport(v);setInc(v);setMsg('Backup valido: '+ok.routines.length+' schede, '+ok.history.length+' registrazioni. Nulla è stato ancora cambiato.');}catch(x:any){setMsg('File non valido o non compatibile: nessuna modifica.');}};
  const read=(f:File|undefined)=>{if(!f)return;setInc(null);setMsg('');const fr=new FileReader();fr.onload=()=>parse(String(fr.result));fr.onerror=()=>setMsg('Lettura del file non riuscita.');fr.readAsText(f);};
  const native=async()=>{setInc(null);setMsg('');const t=await pickText();if(t==null||t==='cancelled')setMsg('Nessun file letto: nessuna modifica.');else parse(t);};
  const hasNative=typeof (window as any).WolfNative?.importText==='function';
  const merge=()=>{try{const m=mergeImport(toStore(data),inc,'append');if(update(fromStore(m))){setInc(null);setMsg('Importazione completata: schede e registrazioni aggiunte.');}}catch(x:any){setMsg(x&&x.message==='import_id_conflict'?'Conflitto: stesso identificativo con contenuto diverso. Esporta prima i dati attuali, poi scegli Sostituisci se vuoi il backup al posto.':'Importazione non riuscita: nessuna modifica.');}};
  const replace=()=>setPending({label:'Sostituire tutte le schede e i registri attuali con il backup? Esporta prima il JSON se vuoi conservarli.',run:()=>{if(update(fromStore(inc))){setInc(null);setMsg('Dati sostituiti con il backup.');}}});
  return <div>{hasNative?<button onClick={native}>Importa backup JSON</button>:<label>Importa backup JSON<input type="file" accept="application/json,.json" aria-label="Importa backup" onChange={e=>read(e.target.files&&e.target.files[0])}/></label>}{msg&&<p role="status">{msg}</p>}{inc&&<div className="actions"><button onClick={merge}>Aggiungi ai dati attuali</button><button onClick={replace}>Sostituisci tutto</button></div>}</div>;
}
