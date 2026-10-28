import React,{useState} from 'react';
import {createMethodProgram,proposeTopSetReference,acceptTopSetReference} from './core/method-program.mjs';
import {validProgram} from './lab';
const SOURCES:any={
 sl:{label:'StrongLifts, Madcow 5×5 workout guide',url:'https://stronglifts.com/madcow-5x5/workout-guide/'},
 vz:{label:'Violent Zen, MadCow 5x5 lineare per intermedi',url:'https://violentzen.com/MadCow/5x5_Program/Linear_5x5.htm'}
};
const ROLES:any=[['squat','Squat con bilanciere'],['bench','Panca piana'],['row','Rematore con bilanciere'],['press','Press'],['deadlift','Stacco']];
const REASON:any={wrong_source_session:'Scegli un allenamento del venerdì (seduta C) di questo programma.',equipment_rounding_changed:'Il passo dei dischi è cambiato: ricostruisci il programma.',wrong_program_method:'Programma non Madcow.',source_week_missing:'Settimana di partenza non trovata.',prescription_changed:'La prescrizione registrata non coincide con quella del programma.',pain_or_technique:'Dolore o tecnica compromessa segnalati: nessuna proposta, ferma e valuta.',required_sets_incomplete:'Servono tutte le serie completate, con ripetizioni, carico e tecnica valida.',triple_missing:'Triplo non trovato.',no_increase_after_rounding:'Dopo l’arrotondamento il carico non supera il riferimento attuale: nessun aumento.'};
const nums=(t:string)=>String(t||'').split(/[\/\s;]+/).filter(Boolean).map(x=>Number(x.replace(',','.'))/100);
const bad=(m:string)=>Object.assign(new Error(m),{own:true});
export function MadcowBox({data,update,onClose,setPending,startSession}:any){
  const [src,setSrc]=useState(''),[pv,setPv]=useState(''),[f,setF]=useState<any>({}),[ref,setRef]=useState<any>({}),[weeks,setWeeks]=useState('4'),[start,setStart]=useState(''),[round,setRound]=useState('2.5'),[prog,setProg]=useState<any>(null),[name,setName]=useState(''),[err,setErr]=useState(''),[msg,setMsg]=useState('');
  const sf=(k:string,v:string)=>{setF({...f,[k]:v});setProg(null);},sr=(k:string,v:string)=>{setRef({...ref,[k]:v});setProg(null);};
  const gen=()=>{setMsg('');try{
    if(!src)throw bad('Scegli la fonte da cui prendi la struttura.');
    if(!pv)throw bad('Scegli la variante del mercoledì: è un adattamento distinto, non una sostituzione silenziosa.');
    const ex:any={};for(const [k,n] of ROLES)ex[k]={id:'mc-'+k,name:k==='press'?(pv==='incline'?'Panca inclinata':'Military press'):n};
    const L:any={squat:{monday:nums(f.squat_m)},bench:{monday:nums(f.bench_m)},row:{monday:nums(f.row_m)},press:{wednesday:nums(f.press_w)},deadlift:{wednesday:nums(f.deadlift_w)}};
    for(const k of ['squat','bench','row']){const t=Number(String(f[k+'_t']||'').replace(',','.'))/100,b=Number(String(f[k+'_b']||'').replace(',','.'))/100;L[k].friday=[...L[k].monday.slice(0,4),t,b];}
    const rl:any={};for(const [k] of ROLES){const v=Number(String(ref[k]||'').replace(',','.'));if(!(v>0))throw bad('Inserisci il carico di riferimento (kg) per ogni alzata.');rl['mc-'+k]=v;}
    const w=Number(weeks);if(!Number.isInteger(w)||w<1||w>12)throw bad('Settimane: da 1 a 12.');
    if(!/^\d{4}-\d{2}-\d{2}$/.test(start))throw bad('Scegli la data di inizio.');
    const r=Number(round);if(!(r>0))throw bad('Passo dei dischi non valido.');
    let p:any;try{p=createMethodProgram({config:{versionId:'madcow-'+src+'-user-params',source:{url:SOURCES[src].url,label:SOURCES[src].label},exercises:ex,loading:L},id:'p'+Date.now(),referenceLoads:rl,weeks:w,startDate:start,roundingKg:r});}catch(x){throw bad('Fattori non validi: lunedì 5 valori crescenti con ultimo 100, mercoledì squat come lunedì (serie 4 = serie 3), press e stacco 4 valori crescenti con ultimo 100, venerdì triplo sopra 100 e back-off sotto il triplo.');}
    setProg(p);setErr('');
  }catch(x:any){setProg(null);setErr(x&&x.own?x.message:'Programma non valido: controlla i campi.');}};
  const save=()=>{const nm=name.trim();if(!nm){setErr('Dai un nome al programma prima di salvarlo.');return;}const saved={...prog,name:nm,routineId:'madcow-'+prog.id,routineName:'Madcow 5×5 (adattamento)',routineSnapshot:{id:'madcow-'+prog.id,name:'Madcow 5×5 (adattamento)',method:'Libera',notes:'Adattamento da fonte secondaria, non verificato su fonte primaria.',revision:1,exercises:[]}};if(update({...data,programs:[...(data.programs||[]),saved]})){setErr('');setMsg('Programma salvato.');}else setMsg('Programma non salvato: nessuna modifica.');};
  const fld=(k:string,label:string,ph:string)=><label key={k}>{label}<input aria-label={label} placeholder={ph} value={f[k]??''} onChange={v=>sf(k,v.target.value)}/></label>;
  return <div className="program"><div className="heading"><div><small>PROGRAMMA</small><h2>Madcow 5×5 (adattamento)</h2></div><div className="actions"><button onClick={onClose}>← Programma</button></div></div>
   <p className="hint">Adattamento da fonti secondarie, non verificato su una fonte primaria e non è il Bill Starr originale. Le fonti non concordano sui numeri: non propongo percentuali, le inserisci tu. Lunedì A: 5 serie a rampa. Mercoledì B: squat 4×5 con la quarta serie uguale alla terza, press e stacco 4×5. Venerdì C: 4 serie come lunedì, triplo pesante, serie da 8.</p>
   <label>Fonte<select aria-label="Fonte Madcow" value={src} onChange={v=>{setSrc(v.target.value);setProg(null);}}><option value="">Scegli…</option>{Object.keys(SOURCES).map(k=><option key={k} value={k}>{SOURCES[k].label}</option>)}</select></label>
   {src&&<p className="hint"><a href={SOURCES[src].url} target="_blank" rel="noopener noreferrer">{SOURCES[src].label}</a> (fonte secondaria)</p>}
   <label>Mercoledì: variante<select aria-label="Variante mercoledì" value={pv} onChange={v=>{setPv(v.target.value);setProg(null);}}><option value="">Scegli…</option><option value="incline">Panca inclinata</option><option value="ohp">Military press</option></select></label>
   <p className="hint">Percentuali del riferimento, separate da “/”. Esempio di formato, non un valore: a / b / c / d / 100.</p>
   <div className="fields">{fld('squat_m','Squat lunedì (5 valori, ultimo 100)','…')}{fld('bench_m','Panca lunedì (5 valori, ultimo 100)','…')}{fld('row_m','Rematore lunedì (5 valori, ultimo 100)','…')}{fld('press_w','Press mercoledì (4 valori, ultimo 100)','…')}{fld('deadlift_w','Stacco mercoledì (4 valori, ultimo 100)','…')}
   {['squat','bench','row'].map(k=><React.Fragment key={k}>{fld(k+'_t',ROLES.find((r:any)=>r[0]===k)[1]+' venerdì triplo (%, sopra 100)','…')}{fld(k+'_b',ROLES.find((r:any)=>r[0]===k)[1]+' venerdì back-off (%, sotto il triplo)','…')}</React.Fragment>)}</div>
   <h3>Carichi di riferimento (kg)</h3><p className="hint">Squat, panca e rematore: top set da 5 del lunedì. Press e stacco: top set da 5 del mercoledì.</p>
   <div className="fields">{ROLES.map(([k,n]:any)=><label key={k}>{k==='press'?'Press':n} · kg<input type="number" min="0" step="0.5" aria-label={'Riferimento '+k} value={ref[k]??''} onChange={v=>sr(k,v.target.value)}/></label>)}</div>
   <div className="fields"><label>Settimane<input type="number" min="1" max="12" aria-label="Settimane Madcow" value={weeks} onChange={v=>{setWeeks(v.target.value);setProg(null);}}/></label><label>Inizio<input type="date" aria-label="Inizio Madcow" value={start} onChange={v=>{setStart(v.target.value);setProg(null);}}/></label><label>Passo dei dischi · kg<input type="number" min="0.25" step="0.25" aria-label="Passo dischi Madcow" value={round} onChange={v=>{setRound(v.target.value);setProg(null);}}/></label></div>
   <div className="actions"><button className="primary" onClick={gen}>Genera anteprima</button></div>
   {err&&<p role="alert">{err}</p>}{msg&&<p role="status">{msg}</p>}
   {prog&&<div><p className="hint">Anteprima non salvata. I carichi cambiano solo se accetti una proposta dopo il venerdì.</p>{prog.weeks.slice(0,1).map((w:any)=><details key={w.weekIndex} open><summary>Settimana {w.weekIndex}</summary>{w.sessions.map((s:any)=><article key={s.id}><b>{s.name}</b><ul className="pe">{s.exercises.map((e:any)=><li key={e.exerciseId}>{e.name} · {e.sets.map((t:any)=>t.kg+'×'+t.repsMin).join(' / ')}</li>)}</ul></article>)}</details>)}
    <label>Nome del programma<input value={name} aria-label="Nome programma Madcow" onChange={v=>setName(v.target.value)}/></label><div className="actions"><button className="primary" onClick={save}>Salva programma</button></div></div>}
  </div>;
}
export function MadcowRule({g,data,update,setPending}:any){
  const src=(data.history||[]).filter((w:any)=>w.programRef&&w.programRef.programId===g.id&&w.programRef.sessionId==='C');
  const [wid,setWid]=useState(''),[wk,setWk]=useState(''),[pr,setPr]=useState<any>(null),[m,setM]=useState('');
  const logged=(data.history||[]).filter((w:any)=>w.programRef&&w.programRef.programId===g.id).map((w:any)=>w.programRef.week);
  const nm=(id:string)=>(g.weeks[0].sessions.flatMap((s:any)=>s.exercises).find((e:any)=>e.exerciseId===id)||{}).name||id;
  const cur=g.referenceHistory[g.referenceHistory.length-1].loads;
  const eva=()=>{setM('');const w=src.find((x:any)=>x.id===wid);if(!w){setPr(null);setM('Scegli un allenamento del venerdì.');return;}try{setPr(proposeTopSetReference(g,w,{ruleVersion:'wolflab-top-set-1',roundingKg:g.roundingKg}));}catch(e){setPr(null);setM('Valutazione non possibile.');}};
  const acc=()=>{const w=Number(wk);const lower=Math.max(2,pr.sourceWeek+1,...logged.map((x:number)=>x+1));if(!Number.isInteger(w)||w<lower||w>g.weeks.length){setM('Settimana effettiva: '+lower+'–'+g.weeks.length+'.');return;}
    setPending({label:'Aggiornare il riferimento dalla settimana '+w+'? Le settimane con allenamenti registrati e lo storico non cambiano.',run:()=>{try{const next=acceptTopSetReference(g,pr,{effectiveWeek:w,loggedWeeks:logged});const audit=[...(g.ruleAudit||[]),{ruleVersion:pr.ruleVersion,sourceWorkoutId:pr.sourceWorkoutId,sourceWeek:pr.sourceWeek,effectiveWeek:w,loads:pr.loads,acceptedAt:new Date().toISOString()}];if(update({...data,programs:data.programs.map((x:any)=>x.id===g.id?{...next,name:g.name,routineId:g.routineId,routineName:g.routineName,routineSnapshot:g.routineSnapshot,ruleAudit:audit}:x)})){setM('Riferimento aggiornato dalla settimana '+w+'.');setPr(null);}}catch(e){setM('Aggiornamento non valido: nessuna modifica.');}}});};
  return <div className="set"><h3>Proposta dal venerdì</h3><p className="hint">Regola digitale WOLFLAB, non regola originale: se tutte le serie del venerdì sono completate con tecnica valida e senza dolore, il carico del triplo prescritto può diventare il nuovo riferimento. Solo su tua accettazione.</p>
   {src.length===0?<p className="hint">Registra prima un venerdì (seduta C) di questo programma.</p>:<>
   <label>Venerdì registrato<select aria-label="Venerdì registrato" value={wid} onChange={v=>{setWid(v.target.value);setPr(null);}}><option value="">Scegli…</option>{src.map((w:any)=><option key={w.id} value={w.id}>{new Date(w.startedAt).toLocaleDateString()} · sett. {w.programRef.week}</option>)}</select></label>
   <div className="actions"><button onClick={eva}>Valuta</button></div></>}
   {pr&&pr.action==='reference_proposal'&&<div><p role="status">Proposta: {Object.keys(pr.loads).map((k:string)=>nm(k)+' '+cur[k]+' → '+pr.loads[k]+' kg').join(' · ')}</p><label>Dalla settimana<input type="number" aria-label="Settimana effettiva Madcow" value={wk} onChange={v=>setWk(v.target.value)}/></label><div className="actions"><button className="primary" onClick={acc}>Accetta proposta</button></div></div>}
   {pr&&pr.action!=='reference_proposal'&&<p role="status">{pr.action==='stop'?'Stop. ':'Nessun aumento. '}{REASON[pr.reason]||''}</p>}
   {m&&<p role="status">{m}</p>}</div>;
}
