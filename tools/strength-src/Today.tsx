import React from 'react';
import {uiToV2} from './lab';
import {todayCard} from './core/wizard.mjs';
const n=(x:any)=>x===''||x==null?null:Number(x);
export function Today({session,seconds,deadline,setDeadline,changeSet,complete,finish,onAbandon,children}:any){
 let card:any=null;
 try{
  const prescription=uiToV2(session.base);const results:any={};
  session.exercises.forEach((e:any,i:number)=>e.sets.forEach((s:any,j:number)=>{results[prescription.exercises[i].sets[j].id]={done:!!s.done,kg:n(s.kg),reps:n(s.reps)};}));
  card=todayCard({id:'today',status:'active',prescription,results});
  card.idx=(c:any)=>{if(!c)return null;const i=prescription.exercises.findIndex((e:any)=>e.id===c.exerciseId);return {i,j:c.setNumber-1};};
 }catch{card=null;}
 if(!card)return <>{children}</>;
 const cur=card.current,nx=card.next,ci=card.idx(cur),ni=card.idx(nx);
 const s=ci?session.exercises[ci.i].sets[ci.j]:null;
 const rest=cur?.prescribed?.restSeconds;
 return <section className="today">
  <small>{'OGGI'} · {card.completed}/{card.total} {'SERIE'}</small>
  <div className="bar" aria-hidden="true"><i style={{width:(card.total?100*card.completed/card.total:0)+'%'}}/></div>
  {cur&&s?<article className="now"><small>{cur.exerciseName} · {'Serie'} {cur.setNumber}/{cur.setCount}{cur.groupId?' · '+'circuito'+' '+cur.groupId:''}</small>
   <p className="target">{cur.prescribed.kg==null?'—':cur.prescribed.kg} kg × {cur.prescribed.repsMin==null?'—':cur.prescribed.repsMin}{cur.prescribed.repsMax!=null&&cur.prescribed.repsMax!==cur.prescribed.repsMin?'–'+cur.prescribed.repsMax:''}</p>
   <div className="fields two"><label>kg fatti<input type="number" min="0" inputMode="decimal" value={s.kg} aria-label="kg fatti" onChange={v=>changeSet(ci.i,ci.j,'kg',v.target.value,true)}/></label><label>Reps fatte<input type="number" min="0" inputMode="numeric" value={s.reps} aria-label="Reps fatte" onChange={v=>changeSet(ci.i,ci.j,'reps',v.target.value,true)}/></label></div>
   <div className="actions"><button className="primary big" onClick={()=>complete(ci.i,ci.j)}>Completa serie</button></div>
   <div className="rest"><span>{deadline?(seconds?'Recupero'+' '+Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'):'Recupero terminato'):(rest?'Recupero previsto'+' '+rest+' s':'Recupero libero')}</span><button disabled={!deadline} onClick={()=>setDeadline(deadline+30000)}>+30 s</button><button onClick={()=>setDeadline(0)}>Salta</button></div>
  </article>:<article className="now"><p className="target">Tutte le serie fatte</p></article>}
  {nx&&<p className="next">{'Dopo'}: {nx.exerciseName} · {nx.prescribed.kg==null?'—':nx.prescribed.kg} kg × {nx.prescribed.repsMin==null?'—':nx.prescribed.repsMin}</p>}
  <div className="actions"><button className={card.allSetsDone?'primary':''} onClick={finish}>Termina e registra</button><button onClick={onAbandon}>Abbandona</button></div>
  <details><summary>Tutte le serie, tecnica e RIR/RPE</summary>{children}</details>
 </section>;
}
