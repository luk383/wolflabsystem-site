// NON usato dall'interfaccia: elenco di ricerca fonti e lacune. Nessuna configurazione Madcow e offerta.
// Dati statici del brief: method_versions, method_sources, method_rules.
// Nessun valore e attribuito a una fonte primaria: le fonti sono secondarie e discordanti, ognuna resta separata.
export const METHOD_SOURCES:any={
 vz:{id:'vz',label:'Violent Zen, MadCow 5x5 lineare per intermedi',url:'https://violentzen.com/MadCow/5x5_Program/Linear_5x5.htm',kind:'secondaria',verified:false,says:'Lunedi: serie a rampa con top set di 5 pari al triplo pesante del venerdi precedente. Mercoledi: 4x5, la 4a serie ripete la 3a. Progressione settimanale lineare.'},
 sl:{id:'sl',label:'StrongLifts, Madcow 5x5 spreadsheet',url:'https://stronglifts.com/spreadsheet/madcow-5x5/',kind:'secondaria',verified:false,says:'Incremento settimanale per alzata, 4 settimane di avvicinamento, il peso si ripete se le ripetizioni falliscono.'},
 sp:{id:'sp',label:'SpreadLift, Madcow 5x5',url:'https://spreadlift.com/programs/madcow-5x5/',kind:'secondaria',verified:false,says:'Venerdi: triplo pesante un po sopra il top set del lunedi, poi serie da 8. Top set circa +2,5% a settimana.'},
 ward:{id:'ward',label:'Patrick Ward, Bill Starr and the 5x5 Training Template (2015)',url:'https://optimumsportsperformance.com/blog/bill-starr-and-the-5x5-training-template/',kind:'secondaria',verified:false,says:'Struttura Pesante / Leggera / Media per Starr originale. Il libro del 1976 non e stato verificato direttamente.'}
};
export const METHOD_VERSIONS:any={
 'madcow-not-implemented':{id:'madcow-not-implemented',name:'Madcow 5×5, struttura da fonti secondarie',historicalStatus:'GAP: struttura a rampa/triplo/back-off NON implementata nel Programma; solo fonti secondarie discordanti raccolte',sources:['vz','sl','sp'],rules:'Struttura Lunedi / Mercoledi / Venerdi. Le fonti non concordano su incrementi e percentuali: nessun valore e proposto, li scegli tu. La progressione settimanale non e automatica: usa Aggiorna riferimento.'},
 'hlm-80-90-unverified':{id:'hlm-80-90-unverified',name:'HLM 80 / 90',historicalStatus:'non verificato su fonte originale',sources:['ward'],rules:'Pesante 100%, Leggera 80%, Media 90%.'},
 'bill-starr-intermediate':{id:'bill-starr-intermediate',name:'Bill Starr 5x5 per intermedi',historicalStatus:'GAP: nessuna fonte che lo distingua dal Madcow, nessuna configurazione separata',sources:[],rules:''}
};
