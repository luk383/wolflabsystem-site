import React,{useState} from 'react';
import {createProgram,enduranceConflicts,acceptReferenceUpdate} from './core/core.mjs';
import {validProgram,uiToV2,saveText,saveMsg,routineFromProgramSession} from './lab';
const PRESETS:any={
 custom:{label:'Configurazione digitale WOLFLAB (fattori scelti da te)',note:'Regole digitali WOLFLAB scelte da te. Non sono attribuite a una fonte storica.',days:[{name:'Giorno 1',f:'100'}]},
 a:{label:'HLM, variante 80 / 90',note:'Pesante 100%, Media 90%, Leggera 80% del carico di riferimento. Preset non verificato su una fonte storica originale.',days:[{name:'Pesante',f:'100'},{name:'Leggera',f:'80'},{name:'Media',f:'90'}]},
 b:{label:'HLM, variante 70–75 / 80–85',note:'Leggera 70 o 75%, Media 80 o 85%: scegli un valore preciso, non esiste un punto medio. Preset non verificato su una fonte storica originale.',days:[{name:'Pesante',f:'100'},{name:'Leggera',f:''},{name:'Media',f:''}],choices:{1:['70','75'],2:['80','85']}}
};
const own=(m:string)=>Object.assign(new Error(m),{own:true});
const cell=(x:any)=>{const v=String(x??'');return '"'+(/^[=+@\-\t\r]/.test(v)?"'":'')+v.replaceAll('"','""')+'"';};
export function ProgramBox({routine,onClose,data,update,setPending,startSession}:any){
  const [name,setName]=useState(''),[open,setOpen]=useState<string>(''),[ver,setVer]=useState('custom'),[days,setDays]=useState<any[]>(PRESETS.custom.days),[refs,setRefs]=useState<any>({}),[weeks,setWeeks]=useState('4'),[start,setStart]=useState(''),[round,setRound]=useState('2.5'),[prog,setProg]=useState<any>(null),[ramp,setRamp]=useState<any>({}),[err,setErr]=useState(''),[msg,setMsg]=useState('');
  const P=PRESETS[ver],pick=(v:string)=>{setVer(v);setDays(PRESETS[v].days.map((d:any)=>({...d})));setProg(null);setErr('');};
  const setDay=(i:number,k:string,v:string)=>{const n=days.map((d:any)=>({...d}));n[i][k]=v;setDays(n);setProg(null);};
  const gen=()=>{setMsg('');try{
    const v2=uiToV2(routine);
    if(days.some((d:any)=>!d.name.trim()||!(Number(d.f)>0&&Number(d.f)<=150)))throw own('Ogni giorno richiede un nome e un fattore tra 1 e 150%.');
    const ex=v2.exercises;if(ex.some((e:any)=>!(Number(refs[e.id])>0)))throw own('Inserisci un carico di riferimento (kg) per ogni esercizio.');
    const bad=ex.some((e:any)=>e.sets.some((s:any)=>s.kind==='ramp'&&!(Number(ramp[s.id])>0&&Number(ramp[s.id])<=150)));if(bad)throw own('Ogni serie crescente richiede la tua percentuale del carico del giorno.');
    const w=Number(weeks);if(!Number.isInteger(w)||w<1||w>12)throw own('Settimane: da 1 a 12.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw own('Scegli la data di inizio.');
    const r=Number(round);if(!(r>0))throw own('Passo dei dischi non valido.');
    const versionId=ver==='custom'?'wolflab-digital-1':ver==='a'?'hlm-80-90-unverified':'hlm-70-75-80-85-unverified-'+days[1].f+'-'+days[2].f;
    const template={versionId,sessions:days.map((d:any,i:number)=>({id:'d'+(i+1),name:d.name.trim(),exercises:ex.map((e:any)=>({exerciseId:e.id,name:e.name,...(e.groupId?{groupId:e.groupId}:{}),sets:e.sets.filter((s:any)=>s.kind!=='warmup').map((s:any)=>{const pc=s.kind==='ramp'?Number(ramp[s.id]):100;const o:any={...s,referenceFactor:Number(d.f)/100*pc/100};delete o.kg;return o;})})).filter((e:any)=>e.sets.length)}))};
    const rl:any=Object.fromEntries(ex.map((e:any)=>[e.id,Number(refs[e.id])]));
    setProg(createProgram({id:'p'+Date.now(),template,referenceLoads:rl,weeks:w,startDate:start,roundingKg:r}));setErr('');
  }catch(x:any){setProg(null);setErr(x&&x.own?x.message:'Programma non valido: controlla i campi.');}};
  const rows=()=>{const out=[['week','session','exercise','set','kg','repsMin','repsMax','status','version']];for(const w of prog.weeks)for(const s of w.sessions)for(const e of s.exercises)e.sets.forEach((t:any,j:number)=>out.push([w.weekIndex,s.name,e.name,j+1,t.kg,t.repsMin,t.repsMax,w.loadStatus,s.versionId]));return out;};
  const saveProg=()=>{const nm=name.trim();if(!nm){setErr('Dai un nome al programma prima di salvarlo.');return;}const saved={...prog,name:nm,routineId:routine.id,routineName:routine.name||'Scheda',routineSnapshot:JSON.parse(JSON.stringify(routine))};if(update({...data,programs:[...(data.programs||[]),saved]})){setErr('');setMsg('Programma salvato.');}else setMsg('Programma non salvato: nessuna modifica.');};
  const exp=async()=>{const t='\uFEFF'+rows().map(r=>r.map(cell).join(',')).join('\r\n');setMsg(saveMsg(await saveText(t,'wolflab-programma.csv','text/csv;charset=utf-8')));};
  return <div className="program"><div className="heading"><div><small>PROGRAMMA</small><h2>{routine.name||'Scheda'}</h2></div><div className="actions"><button onClick={onClose}>← Schede</button></div></div>
   <label>Configurazione<select aria-label="Configurazione programma" value={ver} onChange={v=>pick(v.target.value)}>{Object.keys(PRESETS).map(k=><option key={k} value={k}>{k==='custom'?'Digitale WOLFLAB':k==='a'?'HLM 80 / 90':'HLM 70–75 / 80–85'}</option>)}</select></label>
   <p className="hint">{P.label}. {P.note}</p>
   <div className="fields">{days.map((d:any,i:number)=><React.Fragment key={i}><label>Giorno {i+1}<input value={d.name} aria-label={'Nome giorno '+(i+1)} onChange={v=>setDay(i,'name',v.target.value)}/></label>{P.choices&&P.choices[i]?<label>% del riferimento<select aria-label={'Fattore giorno '+(i+1)} value={d.f} onChange={v=>setDay(i,'f',v.target.value)}><option value="">Scegli…</option>{P.choices[i].map((c:string)=><option key={c} value={c}>{c}%</option>)}</select></label>:<label>% del riferimento<input type="number" min="1" max="150" value={d.f} aria-label={'Fattore giorno '+(i+1)} onChange={v=>setDay(i,'f',v.target.value)}/></label>}</React.Fragment>)}</div>
   {ver==='custom'&&<div className="actions"><button onClick={()=>{setDays([...days,{name:'Giorno '+(days.length+1),f:'100'}]);setProg(null);}}>+ Giorno</button>{days.length>1&&<button onClick={()=>{setDays(days.slice(0,-1));setProg(null);}}>Rimuovi ultimo giorno</button>}</div>}
   <h3>Carichi di riferimento</h3><div className="fields">{routine.exercises.map((e:any)=><label key={e.id}>{e.name} · kg<input type="number" min="0" step="0.5" value={refs[e.id]??''} aria-label={e.name+' riferimento'} onChange={v=>{setRefs({...refs,[e.id]:v.target.value});setProg(null);}}/></label>)}</div>
   {routine.exercises.some((e:any)=>(e.sets||[]).some((s:any)=>s.kind==='Crescente'||s.kind==='ramp'))&&<><h3>Serie crescenti</h3><p className="hint">Indica tu la percentuale del carico del giorno per ogni serie crescente. WOLFLAB non inventa una rampa.</p><div className="fields">{uiToV2(routine).exercises.flatMap((e:any)=>e.sets.filter((s:any)=>s.kind==='ramp').map((s:any,j:number)=>({e,s,j}))).map(({e,s,j}:any)=><label key={s.id}>{e.name} · serie crescente {j+1} · %<input type="number" min="1" max="150" value={ramp[s.id]??''} aria-label={e.name+' crescente '+s.id} onChange={v=>{setRamp({...ramp,[s.id]:v.target.value});setProg(null);}}/></label>)}</div></>}
   <div className="fields"><label>Settimane<input type="number" min="1" max="12" value={weeks} aria-label="Settimane" onChange={v=>{setWeeks(v.target.value);setProg(null);}}/></label><label>Inizio<input type="date" value={start} aria-label="Data di inizio" onChange={v=>{setStart(v.target.value);setProg(null);}}/></label><label>Passo dei dischi · kg<input type="number" min="0" step="0.5" value={round} aria-label="Passo dischi programma" onChange={v=>{setRound(v.target.value);setProg(null);}}/></label></div>
   <div className="actions"><button className="primary" onClick={gen}>Genera anteprima</button></div>
   {err&&<p role="alert">{err}</p>}{msg&&<p role="status">{msg}</p>}
   {(data.programs||[]).filter(validProgram).length>0&&<div><h3>Programmi salvati</h3>{(data.programs||[]).filter(validProgram).map((g:any)=><div key={g.id} className="set"><div className="set-top"><b>{g.name}</b><button aria-label={'Elimina programma '+g.name} onClick={()=>setPending({label:'Eliminare il programma? Gli allenamenti già registrati restano nello storico.',run:()=>update({...data,programs:data.programs.filter((x:any)=>x.id!==g.id)})})}>×</button></div><p className="hint">{g.routineName} · {g.weeks.length} settimane · da {g.startDate}</p><div className="actions"><button onClick={()=>setOpen(open===g.id?'':g.id)}>{open===g.id?'Chiudi':'Apri'}</button></div>{open===g.id&&<RefUpdate g={g} data={data} update={update} setPending={setPending}/>}{open===g.id&&g.weeks.map((w:any)=><details key={w.weekIndex}><summary>Settimana {w.weekIndex}</summary>{w.sessions.map((s:any)=><article key={s.id}><b>{s.name}</b><ul className="pe">{s.exercises.map((e:any)=><li key={e.exerciseId}>{e.name} · {e.sets.map((t:any)=>t.kg+' kg × '+(t.repsMin===t.repsMax||t.repsMax==null?t.repsMin:t.repsMin+'–'+t.repsMax)).join(' / ')}</li>)}</ul><div className="actions"><button onClick={()=>startSession(routineFromProgramSession(g,w,s,g.routineSnapshot))}>Avvia questa seduta</button></div></article>)}</details>)}</div>)}</div>}
   {prog&&<div><p className="hint">Anteprima non salvata: esporta se vuoi conservarla. I carichi delle settimane successive restano fissi sul riferimento finché non registri allenamenti e accetti una proposta. Carichi arrotondati per difetto al passo scelto.</p>
    {prog.weeks.map((w:any)=><details key={w.weekIndex} open={w.weekIndex===1}><summary>Settimana {w.weekIndex} · {w.loadStatus==='current'?'in corso':'provvisoria'}</summary>{w.sessions.map((s:any)=><article key={s.id}><b>{s.name}</b><ul className="pe">{s.exercises.map((e:any)=><li key={e.exerciseId}>{e.name} · {e.sets.map((t:any)=>t.kg+' kg × '+(t.repsMin===t.repsMax||t.repsMax==null?t.repsMin:t.repsMin+'–'+t.repsMax)).join(' / ')}</li>)}</ul></article>)}</details>)}
    <label>Nome del programma<input value={name} aria-label="Nome programma" onChange={v=>setName(v.target.value)}/></label><div className="actions"><button className="primary" onClick={saveProg}>Salva programma</button><button onClick={exp}>Esporta CSV del programma</button><button onClick={()=>window.print()}>Stampa o salva PDF</button></div></div>}
  </div>;
}

export function EnduranceBox(){
  const [ev,setEv]=useState<any[]>([]),[win,setWin]=useState('24'),[out,setOut]=useState<any>(null);
  const add=()=>{setEv([...ev,{id:'e'+(ev.length+1),sport:'strength',startsAt:'',intensity:'hard',lowerBodyHeavy:true}]);setOut(null);};
  const set=(i:number,k:string,v:any)=>{const n=ev.map((e:any)=>({...e}));n[i][k]=v;setEv(n);setOut(null);};
  const run=()=>{const ok=ev.every((e:any)=>Number.isFinite(Date.parse(e.startsAt)));if(!ok){setOut({err:'Inserisci data e ora per ogni sessione.'});return;}
    const w=Number(win);if(!(w>0&&w<=168)){setOut({err:'Finestra: da 1 a 168 ore.'});return;}
    setOut({list:enduranceConflicts(ev.map((e:any)=>({...e,startsAt:new Date(e.startsAt).toISOString()})),w)});};
  const name=(id:string)=>{const i=ev.findIndex((e:any)=>e.id===id);const e=ev[i];return (e.sport==='strength'?'Forza':e.sport==='run'?'Corsa':e.sport==='ride'?'Bici':'Nuoto')+' '+(i+1);};
  return <div className="program"><h3>Promemoria di pianificazione: forza e resistenza</h3>
   <p className="hint">Inserisci tu le sessioni previste. WOLFLAB segnala solo vicinanza nel calendario tra una sessione di forza per le gambe e una sessione intensa di corsa, bici o nuoto. Non è una valutazione medica né una prescrizione.</p>
   {ev.map((e:any,i:number)=><div className="fields" key={e.id}><label>Sport<select aria-label={'Sport '+(i+1)} value={e.sport} onChange={v=>set(i,'sport',v.target.value)}><option value="strength">Forza</option><option value="run">Corsa</option><option value="ride">Bici</option><option value="swim">Nuoto</option></select></label><label>Data e ora<input type="datetime-local" aria-label={'Data e ora '+(i+1)} value={e.startsAt} onChange={v=>set(i,'startsAt',v.target.value)}/></label>{e.sport==='strength'?<label className="check"><input type="checkbox" checked={e.lowerBodyHeavy} aria-label={'Gambe pesanti '+(i+1)} onChange={v=>set(i,'lowerBodyHeavy',v.target.checked)}/> Gambe impegnative</label>:<label className="check"><input type="checkbox" checked={e.intensity==='hard'} aria-label={'Intensa '+(i+1)} onChange={v=>set(i,'intensity',v.target.checked?'hard':'easy')}/> Intensa</label>}<button aria-label={'Rimuovi sessione '+(i+1)} onClick={()=>{setEv(ev.filter((_:any,j:number)=>j!==i));setOut(null);}}>×</button></div>)}
   <div className="actions"><button onClick={add}>+ Sessione</button>{ev.length>1&&<button className="primary" onClick={run}>Controlla vicinanza</button>}<label>Finestra · ore<input type="number" min="1" max="168" value={win} aria-label="Finestra ore" onChange={v=>{setWin(v.target.value);setOut(null);}}/></label></div>
   {out&&out.err&&<p role="alert">{out.err}</p>}
   {out&&out.list&&(out.list.length?<ul className="pe">{out.list.map((c:any,i:number)=><li key={i}>{name(c.strengthId)} + {name(c.enduranceId)}: {Math.round(c.hoursApart*10)/10} ore di distanza. Valuta tu se spostare una delle due.</li>)}</ul>:<p role="status">Nessuna vicinanza trovata entro {win} ore tra le sessioni inserite.</p>)}
  </div>;
}

export function RefUpdate({g,data,update,setPending}:any){
  const src=(data.history||[]).filter((w:any)=>w.programRef&&w.programRef.programId===g.id);
  const [wid,setWid]=useState(''),[wk,setWk]=useState(''),[ld,setLd]=useState<any>({}),[m,setM]=useState('');
  const refs=g.referenceHistory[g.referenceHistory.length-1].loads;const last=g.referenceHistory[g.referenceHistory.length-1].effectiveWeek;
  const ex=g.templateSnapshot.sessions[0].exercises;
  const go=()=>{setM('');const loads:any={};for(const e of ex){if(ld[e.exerciseId]!==undefined&&ld[e.exerciseId]!==''){const n=Number(ld[e.exerciseId]);if(!(n>0)){setM('Carico di riferimento non valido.');return;}loads[e.exerciseId]=n;}}
    if(!wid){setM('Scegli l’allenamento da cui parte l’aggiornamento.');return;}if(!Object.keys(loads).length){setM('Inserisci almeno un nuovo carico di riferimento.');return;}
    const w=Number(wk);if(!Number.isInteger(w)||w<Math.max(2,last)||w>g.weeks.length){setM('Settimana effettiva: '+Math.max(2,last)+'–'+g.weeks.length+'.');return;}
    setPending({label:'Aggiornare il riferimento dalla settimana '+w+'? Le settimane già completate e lo storico non cambiano.',run:()=>{try{const next=acceptReferenceUpdate(g,{effectiveWeek:w,loads,sourceWorkoutId:wid});if(update({...data,programs:data.programs.map((x:any)=>x.id===g.id?{...next,name:g.name,routineId:g.routineId,routineName:g.routineName,routineSnapshot:g.routineSnapshot}:x)})){setM('Riferimento aggiornato dalla settimana '+w+'.');setLd({});}}catch(e){setM('Aggiornamento non valido: nessuna modifica.');}}});};
  return <div className="set"><h3>Aggiorna il riferimento</h3><p className="hint">Solo su tua accettazione. Il programma cambia dalla settimana scelta; gli allenamenti già registrati non cambiano.</p>
   {src.length===0?<p className="hint">Registra prima un allenamento da una seduta di questo programma.</p>:<>
   <label>Allenamento di partenza<select aria-label="Allenamento di partenza" value={wid} onChange={v=>setWid(v.target.value)}><option value="">Scegli…</option>{src.map((w:any)=><option key={w.id} value={w.id}>{new Date(w.startedAt).toLocaleDateString()} · sett. {w.programRef.week}</option>)}</select></label>
   <div className="fields">{ex.map((e:any)=><label key={e.exerciseId}>{e.name} · kg (ora {refs[e.exerciseId]})<input type="number" min="0" step="0.5" value={ld[e.exerciseId]??''} aria-label={e.name+' nuovo riferimento'} onChange={v=>setLd({...ld,[e.exerciseId]:v.target.value})}/></label>)}<label>Dalla settimana<input type="number" min="2" max={g.weeks.length} value={wk} aria-label="Settimana effettiva" onChange={v=>setWk(v.target.value)}/></label></div>
   <div className="actions"><button onClick={go}>Aggiorna riferimento</button></div></>}
   {m&&<p role="status">{m}</p>}</div>;
}
