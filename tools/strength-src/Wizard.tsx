import React,{useState} from 'react';
import {GOALS,LEVELS,TIME_BUDGETS,SPORTS,validateWizardContext,previewWolfProfile} from './core/wizard.mjs';
const GL:any={strength:['Forza','Carichi alti e tecnica.'],hypertrophy:['Ipertrofia','Più massa muscolare.'],power:['Potenza','Forza applicata veloce.'],endurance:['Endurance','Forza per corsa, bici e triathlon.']};
const SL:any={run:'Corsa',bike:'Bici',swim:'Nuoto',triathlon:'Triathlon',hyrox:'HYROX',hybrid:'Ibrido',strength:'Forza'};
const LL:any={beginner:'Principiante',intermediate:'Intermedio',advanced:'Avanzato'};
export function Wizard({routines,onStart,onEdit,onNew,onMethod,onLibrary,onClose}:any){
 const [view,setView]=useState('root');
 const [step,setStep]=useState(1),[goal,setGoal]=useState(''),[sports,setSports]=useState<string[]>([]),[exp,setExp]=useState(''),[time,setTime]=useState(''),[age,setAge]=useState(''),[weight,setWeight]=useState(''),[rid,setRid]=useState(''),[msg,setMsg]=useState(''),[err,setErr]=useState('');
 const tog=(s:string)=>setSports(sports.includes(s)?sports.filter(x=>x!==s):[...sports,s]);
 const importProfile=()=>{setMsg('');try{const raw=localStorage.getItem('wolf-my-v1');if(!raw){setMsg('Nessun profilo Wolf salvato su questo dispositivo.');return;}const p=previewWolfProfile(raw);const f:any=p.fields;if(f.age!=null&&!age)setAge(String(f.age));if(f.weightKg!=null&&!weight)setWeight(String(f.weightKg));if(f.sports)setSports(Array.from(new Set([...sports,...f.sports])));setMsg('Importati solo età, peso e sport: controlla e modifica.');}catch{setMsg('Profilo non leggibile: nessun dato importato.');}};
 const next2=()=>{if(!time){setErr('Scegli il tempo.');return;}const a=age.trim()===''?null:Number(age),w=weight.trim()===''?null:Number(weight.replace(',','.'));try{validateWizardContext({goal,experience:exp,timeBudget:time,sports,age:a,weightKg:w});setErr('');setStep(4);}catch{setErr('Controlla età e peso.');}};
 const r=routines.find((x:any)=>x.id===rid);
 if(view==='root')return <section className="wiz"><h2>Strength</h2><div className="tiles"><button className="tile" onClick={()=>setView('build')}><strong>Build</strong><span>Costruisci la seduta di oggi.</span></button><button className="tile" onClick={()=>setView('explore')}><strong>Explore</strong><span>Metodi, esercizi e fonti.</span></button></div></section>;
 if(view==='explore')return <section className="wiz"><h2>Explore</h2><div className="tiles"><button className="tile" onClick={onMethod}><strong>Methods</strong><span>Versioni e fonti separate.</span></button><button className="tile" onClick={onLibrary}><strong>Exercises</strong><span>Catalogo per muscolo e attrezzo.</span></button><button className="tile" onClick={()=>setView('science')}><strong>Science</strong><span>Revisioni generali, non per metodo.</span></button></div><p><button className="linkish" onClick={()=>setView('root')}>← Indietro</button></p></section>;
 if(view==='science')return <section className="wiz"><h2>Science</h2><article><p>Revisioni sull'allenamento di forza in generale. Non provano che un metodo specifico sia migliore.</p><ul><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC12965823/" target="_blank" rel="noreferrer">ACSM 2026, prescrizione dell'allenamento di forza ↗</a></li><li><a href="https://pmc.ncbi.nlm.nih.gov/articles/PMC8891239/" target="_blank" rel="noreferrer">Concurrent training, meta-analisi 2022 ↗</a></li><li><a href={location.pathname.indexOf('/en/')===0?'/en/train/strength/starr-5x5/':'/train/strength/starr-5x5/'}>Bill Starr 5×5: scheda metodologica →</a></li></ul></article><p><button className="linkish" onClick={()=>setView('explore')}>← Indietro</button></p></section>;
 return <section className="wiz">
  <small>PASSO {step} DI 5</small>
  {step===1&&<><h2>Cosa vuoi sviluppare?</h2><div className="tiles">{GOALS.filter((g:string)=>g!=='endurance').map((g:string)=><button key={g} className={'tile'+(goal===g?' on':'')} onClick={()=>{setGoal(g);setStep(2);}}><strong>{GL[g][0]}</strong><span>{GL[g][1]}</span></button>)}</div></>}
  {step===2&&<><h2>Che atleta sei?</h2>
   <fieldset className="chips"><legend>Sport che pratichi</legend>{SPORTS.map((s:string)=><button key={s} aria-pressed={sports.includes(s)} className={sports.includes(s)?'on':''} onClick={()=>tog(s)}>{SL[s]}</button>)}</fieldset>
   <label>Esperienza con la forza<select aria-label="Esperienza" value={exp} onChange={e=>setExp(e.target.value)}><option value="">Scegli</option>{LEVELS.map((l:string)=><option key={l} value={l}>{LL[l]}</option>)}</select></label>
   <div className="filters"><label>Età (opz.)<input inputMode="numeric" aria-label="Età" value={age} onChange={e=>setAge(e.target.value)}/></label><label>Peso kg (opz.)<input inputMode="decimal" aria-label="Peso" value={weight} onChange={e=>setWeight(e.target.value)}/></label></div>
   <div className="actions"><button onClick={importProfile}>Importa dal profilo Wolf</button></div>{msg&&<p role="status">{msg}</p>}
   <p>Sport ed esperienza sono contesto: non cambiano carichi o dosi.</p>{err&&<p role="alert">{err}</p>}
   <div className="actions sticky"><button onClick={()=>setStep(1)}>← Indietro</button><button className="primary" onClick={()=>{if(!exp){setErr('Scegli la tua esperienza.');return;}setErr('');setStep(3);}}>Avanti</button></div></>}
  {step===3&&<><h2>Quanto tempo hai?</h2>
   <div className="tiles">{TIME_BUDGETS.map((t:string)=><button key={t} className={'tile'+(time===t?' on':'')} onClick={()=>setTime(t)}><strong>{t} min</strong></button>)}</div>
   <p>Il tempo è un budget, non una garanzia. Nessuna dose viene scelta da questi dati.</p>{err&&<p role="alert">{err}</p>}
   <div className="actions sticky"><button onClick={()=>setStep(2)}>← Indietro</button><button className="primary" onClick={next2}>Avanti</button></div></>}
  {step===4&&<><h2>Da quale base parti?</h2>
   <p>La seduta non viene generata da obiettivo e contesto: la base la scegli tu.</p>
   <article><h3>Una tua scheda</h3>{routines.length?<><label>Scheda<select aria-label="Scheda base" value={rid} onChange={e=>setRid(e.target.value)}><option value="">Scegli</option>{routines.map((x:any)=><option key={x.id} value={x.id}>{x.name}</option>)}</select></label><div className="actions"><button className="primary" disabled={!rid} onClick={()=>setStep(5)}>Usa questa scheda</button></div></>:<p>Nessuna scheda salvata.</p>}</article>
   <article><h3>Scheda libera</h3><div className="actions"><button onClick={onNew}>Crea da zero</button></div></article>
   <article><h3>Metodo avanzato</h3><div className="actions"><button onClick={onMethod}>Apri i metodi</button></div></article>
   <div className="actions sticky"><button onClick={()=>setStep(3)}>← Indietro</button></div></>}
  {step===5&&r&&<><h2>{r.name}</h2>
   {r.exercises.map((e:any)=><article key={e.id}><strong>{e.name}</strong><p>{e.sets.length} serie · {e.sets.map((s:any)=>(s.kg===''?'—':s.kg)+' kg × '+(s.reps===''?'—':s.reps)).join(' · ')}</p></article>)}
   <div className="actions sticky"><button onClick={()=>setStep(4)}>← Indietro</button><button onClick={()=>onEdit(r)}>Modifica numeri</button><button className="primary" onClick={()=>onStart(r)}>Inizia oggi</button></div></>}
  <p><button className="linkish" onClick={()=>setView('root')}>Torna all'inizio</button></p>
 </section>;
}
