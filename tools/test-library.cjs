const assert=require('node:assert/strict');const{calculate}=require('../assets/library.js');
let n=0;function ok(x,f){assert(f(calculate(x)));n++}function bad(x,k){assert.throws(()=>calculate(x),new RegExp(k));n++}
const base={weight:70,mode:'daily',load:'light',protein:1.6,energy:''};
ok(base,r=>r.carbs[0]===210&&r.carbs[1]===350&&r.protein===112);
for(const [load,a,b] of [['light',3,5],['moderate',5,7],['high',6,10],['very',8,12]])ok({...base,load},r=>r.carbs[0]===70*a&&r.carbs[1]===70*b);
for(const weight of ['',0,-1,34.9,250.1,'abc',Infinity,'70,5'])bad({...base,weight},'weight');
ok({...base,weight:'70.5'},r=>r.carbs[0]===211.5);
for(const weight of [35,250])ok({...base,weight},r=>r.carbs[0]===3*weight);
for(const protein of ['',0,1.19,2.01,'abc'])bad({...base,protein},'protein');
for(const duration of ['',90,0,-1,1441,'x'])bad({...base,mode:'loading',duration},'duration');
for(const duration of [91,180,1440])ok({...base,mode:'loading',duration},r=>r.carbs[0]===700&&r.carbs[1]===840&&!r.protein);
ok({...base,mode:'cycling',load:'high'},r=>r.carbs[0]===420);
ok({...base,energy:2500,carb:4},r=>Math.abs(4*r.split.carbs+4*r.split.protein+9*r.split.fat-2500)<1e-10);
for(const energy of [0,799,12001,'x'])bad({...base,energy,carb:4},'energy');
for(const carb of ['',0,2.9,5.1,'x'])bad({...base,energy:2500,carb},'carb');
bad({...base,energy:800,carb:5},'balance');bad({...base,mode:'bad'},'mode');bad({...base,load:'bad'},'load');
console.log(`${n} calculator assertions passed`);
