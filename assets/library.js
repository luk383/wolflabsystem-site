/* Wolf Lab educational macro arithmetic. No user data is stored or sent. */
(function(root){
'use strict';
const ranges={light:[3,5],moderate:[5,7],high:[6,10],very:[8,12]};
function calculate(x){
 const w=Number(x.weight), p=Number(x.protein), duration=Number(x.duration),range=ranges[x.load];
 if(!Number.isFinite(w)||w<35||w>250)throw new Error('weight');
 if(!['daily','loading','cycling'].includes(x.mode))throw new Error('mode');
 if(x.mode==='loading'){
  if(!Number.isFinite(duration)||duration<=90||duration>1440)throw new Error('duration');
  return{mode:x.mode,carbs:[10*w,12*w],window:'36–48',per:'24'};
 }
 if(!range)throw new Error('load');
 if(!Number.isFinite(p)||p<1.2||p>2)throw new Error('protein');
 const result={mode:x.mode,carbs:range.map(v=>v*w),protein:p*w,proteinRange:[1.2*w,2*w]};
 if(x.energy!==undefined&&String(x.energy).trim()!==''){
  const e=Number(x.energy),c=Number(x.carb);
  if(!Number.isFinite(e)||e<800||e>12000)throw new Error('energy');
  if(!Number.isFinite(c)||c<range[0]||c>range[1])throw new Error('carb');
  const fatKcal=e-4*w*c-4*p*w;
  if(fatKcal<=0)throw new Error('balance');
  result.split={carbs:w*c,protein:w*p,fat:fatKcal/9,fatPercent:100*fatKcal/e,energy:e};
 }
 return result;
}
if(typeof module!=='undefined'&&module.exports)module.exports={calculate,ranges};
if(typeof document==='undefined')return;
const f=document.getElementById('macro-form');if(!f)return;
const en=document.documentElement.lang==='en',out=document.getElementById('macro-result'),get=id=>document.getElementById('macro-'+id),n=v=>v.toLocaleString(en?'en-GB':'it-IT',{maximumFractionDigits:1});
const errors={weight:en?'Enter a body mass from 35 to 250 kg. This is the tool validation range, not a medical limit.':'Inserisci un peso tra 35 e 250 kg. È il limite tecnico del tool, non un limite medico.',duration:en?'Loading mode is only shown for events longer than 90 minutes, up to 1440 minutes. No loading estimate for shorter events.':'Il carico è mostrato solo per gare oltre 90 minuti, fino a 1440 minuti. Nessuna stima di carico per gare più brevi.',protein:en?'Choose 1.2–2.0 g/kg/day protein.':'Scegli proteine tra 1,2 e 2,0 g/kg/giorno.',energy:en?'Enter 800–12000 kcal/day or leave energy blank. This is an arithmetic validation range, not a recommended intake.':'Inserisci 800–12000 kcal/giorno o lascia energia vuota. È un limite di calcolo, non un apporto consigliato.',carb:en?'Chosen carbohydrate target must fall within the range for the selected training demand.':'I carboidrati scelti devono rientrare nell’intervallo del carico selezionato.',balance:en?'Incompatible energy target: there is no energy left for fat. Do not cut protein or carbohydrates automatically; review the targets with a professional.':'Energia incompatibile: non resta energia per i grassi. Non tagliare automaticamente proteine o carboidrati; rivedi gli obiettivi con un professionista.'};
function modeChange(){const loading=get('mode').value==='loading';f.querySelectorAll('[data-loading]').forEach(e=>e.hidden=!loading);f.querySelectorAll('[data-not-loading],[data-daily]').forEach(e=>e.hidden=loading);out.textContent='';}
get('mode').addEventListener('change',modeChange);f.addEventListener('input',()=>out.textContent='');f.addEventListener('change',()=>out.textContent='');
f.addEventListener('submit',e=>{e.preventDefault();try{
const r=calculate({weight:get('weight').value,mode:get('mode').value,load:get('load').value,protein:get('protein').value,duration:get('duration').value,energy:get('energy').value,carb:get('carb').value});
let text='';
if(r.mode==='loading')text=en?`<strong>Carbohydrates: ${n(r.carbs[0])}–${n(r.carbs[1])} g per 24 hours</strong><p>For the 36–48 hours before the event, not per meal and not on top of daily carbohydrate intake. This is a guideline range, not a prescription. Trial tolerance and plan with a sports dietitian.</p>`:`<strong>Carboidrati: ${n(r.carbs[0])}–${n(r.carbs[1])} g ogni 24 ore</strong><p>Nelle 36–48 ore prima della gara, non per pasto e non in aggiunta ai carboidrati quotidiani. Intervallo da linee guida, non prescrizione. Tolleranza e applicazione da concordare con un nutrizionista sportivo.</p>`;
else{text=en?`<strong>Daily carbohydrates: ${n(r.carbs[0])}–${n(r.carbs[1])} g</strong><p>Protein at your chosen target: ${n(r.protein)} g/day. Reference range: ${n(r.proteinRange[0])}–${n(r.proteinRange[1])} g/day.</p>`:`<strong>Carboidrati giornalieri: ${n(r.carbs[0])}–${n(r.carbs[1])} g</strong><p>Proteine al valore scelto: ${n(r.protein)} g/giorno. Intervallo di riferimento: ${n(r.proteinRange[0])}–${n(r.proteinRange[1])} g/giorno.</p>`;
if(r.mode==='cycling')text+=en?'<p>Carb cycling here means choosing the range to match training demand on each day. It is not an alternating high/low-carb weight-loss protocol or an automatic train-low prescription.</p>':'<p>Qui carb cycling significa scegliere l’intervallo in base al carico di ogni giorno. Non è uno schema dimagrante a giorni alti/bassi né una prescrizione automatica train-low.</p>';
if(r.split){const s=r.split;text+=en?`<p>Arithmetic split: ${n(s.carbs)} g carbohydrate + ${n(s.protein)} g protein + ${n(s.fat)} g fat ≈ ${n(s.energy)} kcal. Fat: ${n(s.fatPercent)}% of energy. These are your inputs, not a dietary prescription.</p>`:`<p>Ripartizione aritmetica: ${n(s.carbs)} g carboidrati + ${n(s.protein)} g proteine + ${n(s.fat)} g grassi ≈ ${n(s.energy)} kcal. Grassi: ${n(s.fatPercent)}% dell’energia. Sono i tuoi dati, non una dieta prescritta.</p>`;
if(s.fatPercent<20)text+=en?'<p><strong>Unbalanced split for this tool: fat is below 20% of energy. The 2016 position stand discourages chronic fat restriction below this level; this is not an individual requirement. Have the whole diet checked.</strong></p>':'<p><strong>Ripartizione da rivedere: grassi sotto il 20% dell’energia. Il documento 2016 sconsiglia la restrizione cronica sotto questo livello: non è un fabbisogno individuale. Fai verificare la dieta completa.</strong></p>';}
else text+=en?'<p>Fat cannot be calculated without a suitable total energy target. No energy-needs estimate is made here.</p>':'<p>I grassi non si ricavano senza un obiettivo energetico adeguato. Qui non viene stimato il fabbisogno energetico.</p>';
}
out.innerHTML='<div class="macro-output">'+text+'</div>';
}catch(err){out.textContent='';const p=document.createElement('p');p.className='error';p.textContent=errors[err.message]||(en?'Check the inputs.':'Controlla i dati.');out.append(p)}});modeChange();
})(typeof window==='undefined'?globalThis:window);
