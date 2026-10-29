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
 const S=D.STRENGTH;const old=get('STRENGTH','ENDURANCE STRENGTH');
 const methods=get('STRENGTH','METHODS').map(x=>[...x]);
 for(const x of methods){if(/#(?:allenamento|training)-4$/.test(x[2]))x[2]=tr+'#'+an+(/insieme|together/.test(x[0])?'-9':'-8')}
 const paths=en?['strength-for-running-methods','strength-for-cycling-methods','strength-for-swimming-methods']:['forza-corsa-metodi','forza-bici-metodi','forza-nuoto-metodi'];
 S.blocks=[['PROGRAMS',get('STRENGTH','PROGRAMS')],['EXERCISES',[]],['METHODS',methods.filter(x=>!paths.some(p=>x[2].includes(p)))],['ENDURANCE',['Run','Ride','Swim'].map((d,i)=>['Strength for '+d,en?'Methods, studied protocols and limits.':'Metodi, protocolli studiati e limiti.',base+(en?'/articles/':'/articoli/')+paths[i]+'/']).concat(old.filter(x=>!paths.some(p=>x[2].includes(p))))]];
 // Individual exercise names point into the real read-only catalogue.
 const methodRows=S.blocks[2][1];
 for(const label of ['Volume','Intensity','RIR'])methodRows.unshift([label,en?'Variables and evidence limits in resistance training.':'Variabili e limiti delle prove nell’allenamento con i pesi.',tr+'#'+an+'-8']);
 S.blocks[0][1].push(['Full Body',en?'Structure within Starting Strength: not a separate program.':'Struttura in Starting Strength: non un programma separato.',base+(en?'/articles/starting-strength-novice-progression/':'/articoli/starting-strength-progressione-novizi/')]);
 const catalogue=base+(en?'/train/strength/exercises/':'/train/strength/esercizi/');
 const groups=en?['Legs','Posterior chain','Glutes','Calves','Chest','Back','Shoulders','Biceps','Triceps','Core','Compound']:['Gambe','Catena posteriore','Glutei','Polpacci','Petto','Dorso','Spalle','Bicipiti','Tricipiti','Core','Multigruppo'];
 S.blocks[1][1]=groups.map((g,i)=>[g,en?'Browse exercises by muscle group.':'Esplora gli esercizi per gruppo muscolare.',catalogue+'#muscle-'+i]);
}
