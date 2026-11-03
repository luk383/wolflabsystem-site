(function(){
// Carico = minuti effettivi x sforzo percepito (0-10) della seduta.
// Metodo session-RPE (Foster et al. 2001; review: frontiersin.org 10.3389/fnins.2017.00612).
// Solo valori inseriti dall'utente dopo la seduta: nessun peso, nessuna convenzione
// aritmetica, nessuna stima in assenza di registrazione. Non misura fitness o forma.
function sessionLoad(s){if(!s||!Number.isFinite(s.actualMinutes)||!Number.isFinite(s.rpe))return null;return Math.round(s.actualMinutes*s.rpe);}
function weekTotals(w){const out={plannedMin:0,actualMin:0,load:null,recorded:0,total:0};if(!w||!Array.isArray(w.sessions))return out;for(const s of w.sessions){out.total++;if(Number.isFinite(s.minutes))out.plannedMin+=s.minutes;if(Number.isFinite(s.actualMinutes))out.actualMin+=s.actualMinutes;const l=sessionLoad(s);if(l!==null){out.load=(out.load||0)+l;out.recorded++;}}return out;}
const api={sessionLoad,weekTotals};
if(typeof module!=='undefined')module.exports=api;
if(typeof window!=='undefined')window.WolfLoad=api;
})();
