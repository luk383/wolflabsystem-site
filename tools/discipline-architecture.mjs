// 29 October: explicit five-part endurance grammar and four-part strength grammar.
// Existing editorial pages only. Missing categories do not imply published guides.
export function organize(D,en){
 const base=en?'/en':'',tr=en?'/en/training/':'/allenamento/',an=en?'training':'allenamento';
 const get=(d,b)=>D[d].blocks.find(x=>x[0]===b)?.[1]||[];
 const add=(d,b,row)=>{const x=D[d].blocks.find(x=>x[0]===b);if(x&&!x[1].some(y=>y[2]===row[2]&&y[0]===row[0]))x[1].push(row)};
 for(const d of ['RUN','RIDE','SWIM']){
  D[d].blocks=['TRAINING','PERFORMANCE','FUEL & RECOVERY','GEAR'].map(b=>[b,get(d,b)]);
  // Remove stale home-specific lead from the discipline index.
  delete D[d].leadHtml;
 }
 add('RIDE','PERFORMANCE',[en?'FTP test':'Test FTP',en?'Testing protocols and their limits.':'Protocolli di test e loro limiti.',base+(en?'/articles/ftp-and-power-zones/':'/articoli/ftp-e-zone-di-potenza/')]);
 add('SWIM','PERFORMANCE',['CSS',en?'Critical speed and limits of the test.':'Velocità critica e limiti del test.',base+(en?'/articles/swim-critical-speed/':'/articoli/nuoto-css-velocita-critica/')]);
 // General recovery applies across disciplines; marathon fuel advice stays RUN-specific.
 for(const d of ['RIDE','SWIM'])add(d,'FUEL & RECOVERY',[en?'Caffeine and performance':'Caffeina e prestazione',en?'Studied doses and safety references.':'Dosaggi studiati e riferimenti di sicurezza.',base+(en?'/articles/caffeine-and-performance/':'/articoli/caffeina-e-prestazione/')]);
 add('SWIM','GEAR',[en?'Wetsuits and open water':'Muta e acque libere',en?'Safety context, not a product comparison.':'Contesto di sicurezza, non confronto prodotti.',base+(en?'/articles/open-water-swimming-safety/':'/articoli/nuoto-acque-libere-sicurezza/')]);

 const guide=(d,b,it,enTitle,itSlug,enSlug)=>add(d,b,[en?enTitle:it,'',base+(en?'/articles/':'/articoli/')+(en?enSlug:itSlug)+'/']);
 guide('RIDE','GEAR','Bici, ruote e coperture','Bikes, wheels and tyres','bici-ruote-coperture-compatibilita','bike-wheels-tyres-compatibility');
 guide('RIDE','GEAR','Misuratori di potenza','Power meters','potenza-bici-misuratori-dati','cycling-power-meters-data');
 guide('RIDE','PERFORMANCE','Leggere potenza e frequenza cardiaca','Reading power and heart rate','potenza-bici-misuratori-dati','cycling-power-meters-data');
 guide('RIDE','FUEL & RECOVERY','Carboidrati e liquidi in bici','Carbohydrate and fluid on the bike','carboidrati-idratazione-bici','cycling-carbohydrate-hydration');
 guide('SWIM','GEAR','Muta, occhialini e boa','Wetsuits, goggles and tow floats','nuoto-attrezzatura-muta-occhialini','swimming-equipment-wetsuit-goggles');
 guide('SWIM','GEAR','Orologio: vasche e GPS','Watch: lengths and GPS','orologio-nuoto-vasche-gps','swimming-watch-lengths-gps');
 guide('SWIM','PERFORMANCE','Come leggere i dati del nuoto','Reading swimming data','orologio-nuoto-vasche-gps','swimming-watch-lengths-gps');
 guide('SWIM','FUEL & RECOVERY','Alimentazione e recupero nel nuoto','Swimming fuel and recovery','nuoto-alimentazione-recupero','swimming-fuelling-recovery');
 const S=D.STRENGTH;const old=get('STRENGTH','ENDURANCE STRENGTH');
 const methods=get('STRENGTH','METHODS').map(x=>[...x]);
 for(const x of methods){if(/#(?:allenamento|training)-4$/.test(x[2]))x[2]=tr+'#'+an+(/insieme|together/.test(x[0])?'-9':'-8')}
 const paths=en?['strength-for-running-methods','strength-for-cycling-methods','strength-for-swimming-methods']:['forza-corsa-metodi','forza-bici-metodi','forza-nuoto-metodi'];
 S.blocks=[['PROGRAMS',get('STRENGTH','PROGRAMS')],['EXERCISES',[]],['METHODS',methods.filter(x=>!paths.some(p=>x[2].includes(p)))],['ENDURANCE',['Run','Ride','Swim'].map((d,i)=>['Strength for '+d,en?'Methods, studied protocols and limits.':'Metodi, protocolli studiati e limiti.',base+(en?'/articles/':'/articoli/')+paths[i]+'/']).concat(old.filter(x=>!paths.some(p=>x[2].includes(p))))]];
 guide('STRENGTH','ENDURANCE','Collocare le sedute e gestire la fatica','Session placement and fatigue','forza-endurance-collocare-sedute','strength-endurance-session-placement');
 // Individual exercise names point into the real read-only catalogue.
 const methodRows=S.blocks[2][1];
 const vars=base+(en?'/articles/strength-volume-intensity-rir/':'/articoli/forza-volume-intensita-rir/');
 methodRows.unshift([en?'Volume, intensity and RIR':'Volume, intensità e RIR','',vars],[en?'Progression and deload':'Progressione e deload','',base+(en?'/articles/strength-progression-deload/':'/articoli/forza-progressione-deload/')]);
 S.blocks[0][1].push(['Full Body',en?'Structure within Starting Strength: not a separate program.':'Struttura in Starting Strength: non un programma separato.',base+(en?'/articles/starting-strength-novice-progression/':'/articoli/starting-strength-progressione-novizi/')]);
 methodRows.push(['Bill Starr 5×5','',base+(en?'/train/strength/starr-5x5/':'/train/strength/starr-5x5/')],['5/3/1','',base+(en?'/articles/531-wendler-beginners/':'/articoli/531-wendler-principianti/')]);
 S.blocks[0][1]=S.blocks[0][1].filter(x=>x[0]!=='Full Body'&&!/#protocol/.test(x[2]));
 S.blocks[2][1]=S.blocks[2][1].filter(x=>!/starr-5x5|531-wendler/.test(x[2])&&!/#(?:allenamento|training)-9$/.test(x[2]));
 S.blocks[3][1]=S.blocks[3][1].filter(x=>!/sonno-e-recupero|sleep/.test(x[2]));
 const catalogue=base+(en?'/train/strength/exercises/':'/train/strength/esercizi/');
 const groups=en?['Legs','Posterior chain','Glutes','Calves','Chest','Back','Shoulders','Biceps','Triceps','Core','Compound']:['Gambe','Catena posteriore','Glutei','Polpacci','Petto','Dorso','Spalle','Bicipiti','Tricipiti','Core','Multigruppo'];
 S.blocks[1][1]=groups.map((g,i)=>[g,en?'Browse exercises by muscle group.':'Esplora gli esercizi per gruppo muscolare.',catalogue+'#muscle-'+i]);
}
