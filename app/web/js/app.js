/* WOLFLAB app 0.5.0-alpha (build 7) — Home, Workout Builder, Engine, Guide, Profilo.
   Vanilla JS, nessuna rete (CSP connect-src 'none'). Dati locali via WolfStore. */
(function () {
'use strict';
var Store = window.WolfStore, Engine = window.WolfEngine;
var EX = window.WolfExercises, CHIPS = window.WolfEquipChips, GOALS = window.WolfGoals, GUIDES = window.WolfGuides;
var VERSION = window.WOLF_PLANNER_ENABLED ? '0.6.0-preview · build 13' : '0.5.4-web · strumenti';

// ---------- helpers ----------
function el(id) { return document.getElementById(id); }
function esc(s) { return String(s == null ? '' : s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/"/g, '&quot;'); }
function uid(p) { return (p || 'x') + Math.random().toString(36).slice(2, 9); }
function mmss(sec) { sec = Math.round(sec); return Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0'); }
function restLabel(sec) { return sec ? mmss(sec) : '—'; }
function nEx(n) { return n + (n === 1 ? ' ESERCIZIO' : ' ESERCIZI'); }
function srLabel(e) {
  if (e.durationSec) return e.sets + '×' + e.durationSec + '"';
  return e.sets + '×' + (e.reps == null ? '—' : e.reps) + (e.repsMax ? '–' + e.repsMax : '');
}
function today() { return new Date().toISOString().slice(0, 10); }

// ---------- stato ----------
var storageFallback=false;
var storage; try { storage = window.localStorage; storage.getItem('wolf-test'); } catch(e) { storageFallback=true; var fallback={}; storage={getItem:function(k){return fallback[k]||null;},setItem:function(k,v){fallback[k]=String(v);},removeItem:function(k){delete fallback[k];}}; }
var boot = Store.readState(storage);
var S = {
  state: boot.state,
  migrated: boot.migrated,
  storageError: boot.error || null,
  profile: Store.readProfile(storage),
  builder: { equipment: ['bil', 'man', 'cl'], minutes: 45, goal: 'Ipertrofia', experience: 'intermedio', draft: null, name: '' },
  edit: null, // {schedaId, exIdx} oppure {schedaId, add:true}
  pickerQ: '', pickerMuscle: '',
  engineMsg: '', profileMsg: '', storageOk: true
};
// sonda storage (come 0.4.x): scrive, rilegge, cancella
try {
  storage.setItem('wolf-diag-probe', 'p');
  if (storage.getItem('wolf-diag-probe') !== 'p') throw new Error('mismatch');
  storage.removeItem('wolf-diag-probe');
} catch (e) { S.storageOk = false; }
if(storageFallback)S.storageOk=false;
if (boot.legacyRaw) {
  try { if (!storage.getItem(Store.LEGACY_RAW_BACKUP)) storage.setItem(Store.LEGACY_RAW_BACKUP, boot.legacyRaw); } catch (e) {}
}
function save() { Store.writeState(storage, S.state); }

// ---------- router ----------
function route() { return (location.hash || '#/home').replace(/^#\//, ''); }
function go(r) { location.hash = '#/' + r; }
window.addEventListener('hashchange', render);

var TABS = [['home', 'Home']].concat(window.WOLF_PLANNER_ENABLED?[['planner','Planner']]:[]).concat([['builder', 'Builder'], ['engine', 'Engine'], ['profilo', 'Profilo']]);
function tabsHtml(active) {
  return '<div class="tabs">' + TABS.map(function (t) {
    return '<button data-go="' + t[0] + '"' + (active === t[0] ? ' class="on"' : '') + '>' + t[1] + '</button>';
  }).join('') + '</div>';
}
function hdrLogo() {
  return '<div class="hdr"><img class="brand-logo" src="assets/brand/logo-on-light.svg" alt="WOLFLAB - Endurance. Engineered."><span class="kicker">' + esc(VERSION.split(' · ')[0]) + '</span></div>';
}
function hdrBack(label, dest, extra) {
  return '<div class="hdr"><button class="back" data-go="' + dest + '">← ' + esc(label) + '</button>' + (extra || '') + '</div>';
}

// ---------- HOME ----------
function vHome() {
  var schede = S.state.schede;
  var h = hdrLogo();
  h += '<div class="kicker">' + new Date().toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' }) + '</div>';
  h += '<h1>Allenati.</h1><div class="sub">Il tuo motore endurance, in tasca.</div>';
  if (S.migrated) h += '<div class="okmsg">Benvenuto nella nuova app: ho importato ' + S.state.schede.length + ' schede dalla versione precedente. L\'originale resta salvato sul dispositivo.</div>';
  if (!S.storageOk) h += '<div class="errmsg">Il salvataggio locale non funziona su questo dispositivo: le modifiche restano solo in questa sessione.</div>';
  if(window.WOLF_PLANNER_ENABLED) h += '<button class="cta" data-go="planner"><b>Wolf Planner</b><span>IL PERCORSO →</span></button>';
  h += '<button class="cta" data-go="builder"><b>Workout Builder</b><span>GENERA →</span></button>';
  h += '<div class="tiles">' +
    '<button class="tile t-run" data-go="'+(window.WOLF_PLANNER_ENABLED?'planner/run':'engine/run')+'"><b>Run</b><span>Ritmi e strumenti</span></button>' +
    '<button class="tile t-ride" data-go="'+(window.WOLF_PLANNER_ENABLED?'planner/ride':'engine/ride')+'"><b>Ride</b><span>Zone e strumenti</span></button>' +
    '<button class="tile t-swim" data-go="'+(window.WOLF_PLANNER_ENABLED?'planner/swim':'guida/swim')+'"><b>Swim</b><span>Guida e nuoto</span></button>' +
    '<button class="tile t-str" data-go="guida/weights"><b>Strength</b><span>Schede e forza</span></button></div>';
  h += '<div class="sh"><h2>Le mie schede</h2>' + (schede.length ? '<button data-go="schede">tutte →</button>' : '') + '</div>';
  if (!schede.length) h += '<div class="empty">Nessuna scheda ancora. Apri il Workout Builder: scegli attrezzatura e tempo, la scheda la prepara lui.</div>';
  schede.slice(0, 4).forEach(function (sc) {
    h += '<button class="card" data-go="scheda/' + sc.id + '"><div class="row"><div><b class="nm">' + esc(sc.name) + '</b><div class="meta">' +
      nEx(sc.exercises.length) + (sc.updatedAt ? ' · ' + sc.updatedAt : '') + '</div></div><span class="tag tag-str">STRENGTH</span></div></button>';
  });
  return { body: h, tab: 'home' };
}

// ---------- BUILDER ----------
var MUSCLE_ORDER = ['Gambe', 'Petto', 'Dorso', 'Catena posteriore', 'Spalle', 'Core', 'Glutei', 'Bicipiti', 'Tricipiti', 'Polpacci', 'Multigruppo'];
var SCHEMES = {
  'Forza massimale': { sets: 5, reps: 4, restSec: 180 },
  'Ipertrofia': { sets: 4, reps: 9, restSec: 105 },
  'Potenza': { sets: 5, reps: 3, restSec: 150 },
  'Endurance': { sets: 3, reps: 14, restSec: 60 },
  'Ibrido / HYROX': { sets: 4, reps: 7, restSec: 120 }
};
var EXPERIENCE_SETS = { 'base': -1, 'intermedio': 0, 'avanzato': 0 };
var ISO_SEC = { 'base': 30, 'intermedio': 40, 'avanzato': 50 };

function builderPool(equipment) {
  return EX.filter(function (e) {
    if (equipment.indexOf(e.eqCode) < 0) return false;
    return (e.req || []).every(function (r) { return equipment.indexOf(r) >= 0; });
  });
}
function generateDraft(b, seedOffset) {
  var pool = builderPool(b.equipment);
  var n = b.minutes <= 30 ? 4 : (b.minutes <= 45 ? 5 : 6);
  var scheme = SCHEMES[b.goal] || SCHEMES['Ipertrofia'];
  var dSets = EXPERIENCE_SETS[b.experience] || 0;
  var used = {}, out = [];
  var seed = (seedOffset || 0);
  for (var mi = 0; mi < MUSCLE_ORDER.length && out.length < n; mi++) {
    var muscle = MUSCLE_ORDER[mi];
    var cands = pool.filter(function (e) { return e.muscle === muscle && !used[e.name]; });
    if (!cands.length) continue;
    var pick = cands[seed % cands.length];
    used[pick.name] = true;
    out.push(mkEx(pick, scheme, dSets, b.experience));
  }
  // se mancano esercizi (attrezzatura scarsa), completa con qualsiasi muscolo non ancora usato
  if (out.length < n) {
    var rest = pool.filter(function (e) { return !used[e.name]; });
    for (var k = 0; k < rest.length && out.length < n; k++) { used[rest[k].name] = true; out.push(mkEx(rest[k], scheme, dSets, b.experience)); }
  }
  // coerenza col tempo scelto: se la durata stimata supera i minuti, togli gli esercizi in coda (priorita' piu' bassa), minimo 2
  var full = out.length;
  while (out.length > 2 && estMinList(out) > b.minutes) out.pop();
  b.trimmed = full - out.length;
  return out;
}
function estExSec(e) {
  var work = e.durationSec ? e.durationSec : (e.reps || 0) * 3;
  var warm = (e.warmupSets || 0) * (work + 60); // riscaldamento: stesso tempo della serie + 60" recupero
  return e.sets * work + Math.max(0, e.sets - 1) * (e.restSec || 0) + warm;
}
function estMinList(list) {
  var t = 0; list.forEach(function (e) { t += estExSec(e) + 30; }); // 30" cambio/attrezzaggio per esercizio
  return Math.round(t / 60);
}
function mkEx(pick, scheme, dSets, experience) {
  var e = { id: uid('e'), name: pick.name, muscle: pick.muscle, equipment: pick.eq,
    sets: Math.max(2, scheme.sets + dSets), reps: scheme.reps, repsMax: null,
    restSec: scheme.restSec, kg: null, durationSec: null, note: '', warmupSets: 0 };
  if (pick.iso) { e.reps = null; e.sets = 3; e.durationSec = ISO_SEC[experience] || 40; e.restSec = 60; }
  return e;
}
function replaceDraft(idx) {
  var b = S.builder, d = b.draft;
  var pool = builderPool(b.equipment).filter(function (e) { return e.muscle === d[idx].muscle && !d.some(function (x) { return x.name === e.name; }); });
  if (!pool.length) pool = builderPool(b.equipment).filter(function (e) { return !d.some(function (x) { return x.name === e.name; }); });
  if (!pool.length) return;
  var cur = pool[(pool.indexOf(pool.find(function (e) { return e.name === d[idx].name; })) + 1 + pool.length) % pool.length] || pool[0];
  d[idx] = mkEx(cur, SCHEMES[b.goal], EXPERIENCE_SETS[b.experience] || 0, b.experience);
}
function vBuilder() {
  var b = S.builder;
  if (b.draft) return vBuilderDraft();
  var h = hdrBack('Home', 'home', '<span class="kicker">1 / 2</span>');
  h += '<h1 class="sm">Cosa alleniamo?</h1><div class="sub">Il builder prepara la scheda. Tu la aggiusti.</div>';
  if (S.profile && S.profile.fields && (S.profile.fields.age || S.profile.fields.weight)) {
    h += '<div class="note">Profilo Wolf trovato su questo dispositivo: lo uso come contesto. Lo modifichi in Engine.</div>';
  }
  h += '<div class="kicker">Attrezzatura che hai</div><div class="opts">' + CHIPS.map(function (c) {
    return '<button class="opt' + (b.equipment.indexOf(c[0]) >= 0 ? ' sel' : '') + '" data-eq="' + c[0] + '">' + c[1] + '</button>';
  }).join('') + '</div>';
  h += '<div class="kicker">Tempo</div><div class="opts">' + [30, 45, 60].map(function (m) {
    return '<button class="opt' + (b.minutes === m ? ' sel' : '') + '" data-min="' + m + '">' + m + ' min</button>';
  }).join('') + '</div>';
  h += '<div class="kicker">Obiettivo</div><div class="opts">' + GOALS.map(function (g) {
    return '<button class="opt' + (b.goal === g ? ' lime sel' : '') + '" data-goal="' + esc(g) + '">' + esc(g) + '</button>';
  }).join('') + '</div>';
  h += '<div class="kicker">Esperienza</div><div class="opts">' + ['base', 'intermedio', 'avanzato'].map(function (x) {
    return '<button class="opt' + (b.experience === x ? ' sel' : '') + '" data-exp="' + x + '">' + x + '</button>';
  }).join('') + '</div>';
  h += '<div id="builder-err"></div>';
  return { body: h, tab: 'builder', bar: '<button class="cta" data-act="gen"><b>Genera il workout</b><span>→</span></button>' };
}
function vBuilderDraft() {
  var b = S.builder;
  var h = '<div class="hdr"><button class="back" data-act="discard-draft">← Modifica</button><span class="kicker">2 / 2</span></div>';
  h += '<h1 class="sm">' + esc(b.name || ('Scheda ' + b.goal.toLowerCase())) + '</h1>';
  var est = estMinList(b.draft);
  h += '<div class="note">Generata dal builder · ' + b.minutes + ' min · ' + b.goal.toLowerCase() + ' · durata stimata ~' + est + ' min (recuperi e cambi esercizio inclusi) · ' +
    CHIPS.filter(function (c) { return b.equipment.indexOf(c[0]) >= 0; }).map(function (c) { return c[1].toLowerCase(); }).join(', ') + '</div>';
  if (b.trimmed) h += '<div class="note">Ridotta a ' + b.draft.length + ' esercizi per rientrare nel tempo: i gruppi in fondo alla lista sono rimasti fuori. Aumenta il tempo o riduci i recuperi per includerli.</div>';
  if (est > b.minutes) h += '<div class="errmsg">La durata stimata (~' + est + ' min) supera il tempo scelto: riduci serie o recuperi, oppure elimina un esercizio.</div>';
  h += '<div class="note">↑↓ riordinano, tocca un esercizio per serie, ripetizioni e recupero, ↻ lo sostituisce con un\'alternativa, ✕ lo elimina.</div>';
  if (S.moveMsg) { h += '<div class="okmsg">' + esc(S.moveMsg) + '</div>'; S.moveMsg = null; }
  b.draft.forEach(function (e, i) {
    h += '<div class="ex"><button class="exmain" data-bedit="' + i + '"><span class="no">' + (i + 1) + '</span><div class="inf"><b>' + esc(e.name) + '</b><div class="meta">' +
      esc((e.muscle || '').toUpperCase()) + ' · ' + esc((e.equipment || '').toUpperCase()) + ' · REC ' + restLabel(e.restSec) + '</div></div>' +
      '<div class="sr">' + srLabel(e) + '<small>' + (e.durationSec ? 'SERIE×DURATA' : 'SERIE×REP') + '</small></div></button>' +
      '<span class="mvg"><button class="rw" data-bmv="' + i + '|-1"' + (i === 0 ? ' disabled' : '') + ' title="Sposta su">↑</button>' +
      '<button class="rw" data-bmv="' + i + '|1"' + (i === b.draft.length - 1 ? ' disabled' : '') + ' title="Sposta giù">↓</button></span>' +
      '<button class="rw" data-rw="' + i + '" title="Sostituisci con un\'alternativa">↻</button>' +
      '<button class="rw del" data-dex="' + i + '" title="Elimina">✕</button></div>';
  });
  if (!b.draft.length) h += '<div class="empty">Bozza vuota: aggiungi almeno un esercizio per salvare la scheda.</div>';
  h += '<button class="card addex" data-act="addex">+ Aggiungi esercizio</button>';
  h += '<div id="draft-err"></div>';
  h += '<div class="fld fld-mt"><label>Nome scheda</label><input id="draft-name" value="' + esc(b.name || '') + '" placeholder="Es. Full body A"></div>';
  return { body: h, tab: 'builder', bar: '<button class="cta" data-act="save-draft"><b>Salva scheda</b><span>✓</span></button>' };
}

// ---------- SCHEDE (lista) ----------
function vSchede() {
  var h = hdrBack('Home', 'home');
  h += '<h1 class="sm">Le mie schede</h1><div class="sub">Crea, modifica, duplica.</div>';
  if (!S.state.schede.length) h += '<div class="empty">Nessuna scheda. Generane una con il Workout Builder.</div>';
  S.state.schede.forEach(function (sc) {
    h += '<button class="card" data-go="scheda/' + sc.id + '"><div class="row"><div><b class="nm">' + esc(sc.name) + '</b><div class="meta">' +
      nEx(sc.exercises.length) + (sc.updatedAt ? ' · ' + sc.updatedAt : '') + '</div></div><span class="tag tag-str">STRENGTH</span></div></button>';
  });
  h += '<button class="card addex" data-act="new-manual">+ Nuova scheda da zero</button>';
  return { body: h, tab: 'home' };
}

// ---------- SCHEDA (dettaglio) ----------
function findScheda(id) { return S.state.schede.find(function (s) { return s.id === id; }); }
function vScheda(id) {
  var sc = findScheda(id);
  if (!sc) return { body: hdrBack('Schede', 'schede') + '<div class="empty">Scheda non trovata.</div>', tab: 'home' };
  var h = hdrBack('Schede', 'schede');
  h += '<h1 class="sm">' + esc(sc.name) + '</h1>';
  h += '<div class="note">' + sc.exercises.length + (sc.exercises.length === 1 ? ' esercizio' : ' esercizi') + (sc.exercises.length ? ' · durata stimata ~' + estMinList(sc.exercises) + ' min' : '') + (sc.updatedAt ? ' · aggiornata ' + sc.updatedAt : '') + (sc.source === 'builder' ? ' · dal builder' : '') + '</div>';
  if (S.moveMsg) { h += '<div class="okmsg">' + esc(S.moveMsg) + '</div>'; S.moveMsg = null; }
  sc.exercises.forEach(function (e, i) {
    h += '<div class="ex"><button class="exmain" data-edit="' + i + '"><span class="no">' + (i + 1) + '</span><div class="inf"><b>' + esc(e.name) + '</b><div class="meta">' +
      esc((e.muscle || '').toUpperCase()) + (e.equipment ? ' · ' + esc(e.equipment.toUpperCase()) : '') + ' · REC ' + restLabel(e.restSec) +
      (e.kg ? ' · ' + e.kg + ' KG' : '') + (e.warmupSets ? ' · +' + e.warmupSets + ' RISC.' : '') + '</div></div>' +
      '<div class="sr">' + srLabel(e) + '<small>' + (e.durationSec ? 'SERIE×DURATA' : 'SERIE×REP') + '</small></div></button>' +
      '<span class="mvg"><button class="rw" data-smv="' + i + '|-1"' + (i === 0 ? ' disabled' : '') + ' title="Sposta su">↑</button>' +
      '<button class="rw" data-smv="' + i + '|1"' + (i === sc.exercises.length - 1 ? ' disabled' : '') + ' title="Sposta giù">↓</button></span></div>';
  });
  h += '<button class="card addex" data-act="addex-scheda">+ Aggiungi esercizio</button>';
  h += '<div class="btnrow">' +
    '<button class="btn" data-act="dup-scheda">Duplica</button>' +
    '<button class="btn ghost" data-act="rename-scheda">Rinomina</button>' +
    '<button class="btn danger" data-act="del-scheda">Elimina</button></div>';
  var hist = (S.state.history || []).filter(function (x) { return x.schedaId === sc.id; });
  if (hist.length) h += '<div class="note">Completata ' + hist.length + ' volt' + (hist.length === 1 ? 'a' : 'e') + ', ultima: ' + hist[hist.length - 1].at + '.</div>';
  return { body: h, tab: 'home', bar: '<button class="cta" data-act="done-scheda"><b>Segna completata</b><span>✓</span></button>' };
}

// ---------- EDITOR ESERCIZIO ----------
function vEditor(schedaId, exIdx) {
  var isBuilder = schedaId === 'b';
  var sc = isBuilder ? null : findScheda(schedaId);
  if (!isBuilder && !sc) return { body: hdrBack('Schede', 'schede') + '<div class="empty">Scheda non trovata.</div>', tab: 'home' };
  var exs = isBuilder ? (S.builder.draft || []) : sc.exercises;
  var backRoute = isBuilder ? 'builder' : 'scheda/' + schedaId;
  var backLabel = isBuilder ? (S.builder.name || 'Bozza') : sc.name;
  var adding = exIdx === 'new';
  var sameCtx = S.edit && !!S.edit.builder === isBuilder && (isBuilder || S.edit.schedaId === schedaId) &&
    String(S.edit.exIdx) === String(adding ? 'new' : Number(exIdx));
  var e = sameCtx ? S.edit.draft
    : (adding ? { id: uid('e'), name: '', muscle: null, equipment: null, sets: 3, reps: 8, repsMax: null, restSec: 90, kg: null, durationSec: null, note: '', warmupSets: 0 } : exs[exIdx]);
  if (!e) return { body: hdrBack(backLabel, backRoute) + '<div class="empty">Esercizio non trovato.</div>', tab: 'home' };
  if (!sameCtx) { e = JSON.parse(JSON.stringify(e)); }
  S.edit = { builder: isBuilder, schedaId: isBuilder ? null : schedaId, exIdx: adding ? 'new' : Number(exIdx), draft: e };
  var h = hdrBack(backLabel, backRoute, '<span class="kicker">' + (adding ? 'NUOVO' : 'ESERCIZIO ' + (Number(exIdx) + 1) + ' / ' + exs.length) + '</span>');
  if (S.moveMsg) { h += '<div class="okmsg">' + esc(S.moveMsg) + '</div>'; S.moveMsg = null; }
  if (e.name) h += '<h1 class="sm">' + esc(e.name) + '</h1><div class="sub">' + esc([e.muscle, e.equipment].filter(Boolean).join(' · ')) + '</div>';
  h += '<button class="card card-left" data-act="pick"><div class="row"><div><b class="nm nm-sm">' + (e.name ? 'Cambia esercizio' : 'Scegli esercizio') + '</b><div class="meta">' + EX.length + ' IN LIBRERIA</div></div><span>→</span></div></button>';
  h += '<div class="bigsets">' +
    '<div class="step"><div class="k">SERIE</div><div class="v" id="ed-sets">' + e.sets + '</div><div class="pm"><button data-st="sets|-1">−</button><button data-st="sets|1">+</button></div></div>';
  if (e.durationSec) {
    h += '<div class="step"><div class="k">DURATA (SEC)</div><div class="v" id="ed-dur">' + e.durationSec + '"</div><div class="pm"><button data-st="durationSec|-10">−</button><button data-st="durationSec|10">+</button></div></div>';
  } else {
    h += '<div class="step"><div class="k">RIPETIZIONI</div><div class="v" id="ed-reps">' + (e.reps == null ? '—' : e.reps) + '</div><div class="pm"><button data-st="reps|-1">−</button><button data-st="reps|1">+</button></div></div>';
  }
  h += '</div>';
  if (!adding && exs.length > 1) h += '<div class="kicker">Ordine nella scheda</div><div class="btnrow">' +
    '<button class="btn ghost" data-act="move-up"' + (Number(exIdx) === 0 ? ' disabled' : '') + '>↑ Sposta su</button>' +
    '<button class="btn ghost" data-act="move-down"' + (Number(exIdx) === exs.length - 1 ? ' disabled' : '') + '>↓ Sposta giù</button></div>';
  var isoKnown = EX.find(function (x) { return x.name === e.name && x.iso; });
  h += '<div class="opts"><button class="opt' + (e.durationSec ? ' sel' : '') + '" data-act="toggle-iso">Isometria (durata in secondi)</button>' +
    (isoKnown && !e.durationSec ? '<span class="note" style="align-self:center">consigliata per questo esercizio</span>' : '') + '</div>';
  h += '<div class="kicker">Recupero</div><div class="opts">' + [60, 90, 120, 150, 180].map(function (r) {
    return '<button class="opt' + (e.restSec === r ? ' lime sel' : '') + '" data-rest="' + r + '">' + mmss(r) + '</button>';
  }).join('') + '</div>';
  h += '<div class="frow"><div class="fld"><label>Carico kg (opz.)</label><input id="ed-kg" inputmode="decimal" value="' + (e.kg == null ? '' : e.kg) + '" placeholder="—"></div>' +
    '<div class="fld"><label>Serie riscaldamento</label><input id="ed-warm" inputmode="numeric" value="' + (e.warmupSets || 0) + '"></div></div>';
  h += '<div class="fld"><label>Nota</label><input id="ed-note" value="' + esc(e.note || '') + '" placeholder="Tecnica, accorgimenti…"></div>';
  if (!adding) h += '<div class="btnrow"><button class="btn danger" data-act="del-ex">Elimina esercizio</button></div>';
  return { body: h, tab: 'home', bar: '<button class="cta" data-act="save-ex"><b>Conferma</b><span>✓</span></button>' };
}

// ---------- PICKER ----------
function vPicker() {
  var q = S.pickerQ.toLowerCase(), mf = S.pickerMuscle;
  var muscles = []; EX.forEach(function (e) { if (muscles.indexOf(e.muscle) < 0) muscles.push(e.muscle); });
  var list = EX.filter(function (e) {
    return (!q || e.name.toLowerCase().indexOf(q) >= 0) && (!mf || e.muscle === mf);
  });
  var h = hdrBack('Editor', 'back');
  h += '<h1 class="sm">Libreria esercizi</h1>';
  h += '<div class="fld"><input id="picker-q" placeholder="Cerca (es. stacco rumeno)" value="' + esc(S.pickerQ) + '"></div>';
  h += '<div class="opts"><button class="opt' + (!mf ? ' sel' : '') + '" data-mus="">Tutti</button>' + muscles.map(function (m) {
    return '<button class="opt' + (mf === m ? ' sel' : '') + '" data-mus="' + esc(m) + '">' + esc(m) + '</button>';
  }).join('') + '</div>';
  if (!list.length) h += '<div class="empty">Nessun esercizio trovato. Prova un altro nome o muscolo.</div>';
  list.forEach(function (e) {
    h += '<button class="ex" data-pick="' + esc(e.name) + '"><div class="inf"><b>' + esc(e.name) + '</b><div class="meta">' + esc(e.muscle.toUpperCase()) + ' · ' + esc(e.eq.toUpperCase()) + '</div></div></button>';
  });
  return { body: h, tab: 'home' };
}

// ---------- ENGINE ----------
var ENG_FIELDS = [
  ['age', 'Età', 'num'], ['weight', 'Peso kg', 'num'],
  ['t5k', '5 km (mm:ss)', 'time'], ['t10k', '10 km (mm:ss)', 'time'],
  ['thm', 'Mezza (h:mm:ss)', 'time'], ['tm', 'Maratona (h:mm:ss)', 'time'],
  ['ftp', 'FTP watt', 'num'], ['lthr', 'FC soglia LTHR', 'num'], ['hrmax', 'FC max', 'num'],
  ['s200', 'Nuoto 200 m (mm:ss)', 'time'], ['s400', 'Nuoto 400 m (mm:ss)', 'time'],
  ['sweat', 'Sudore L/h (opz.)', 'num']
];
function engInput() {
  var f = S.profile && S.profile.fields ? S.profile.fields : {};
  function num(n) { var elx = el('eng-' + n); var v = elx ? elx.value : (f[n] || ''); v = parseFloat(String(v).replace(',', '.')); return v > 0 ? v : 0; }
  function tim(n) { var elx = el('eng-' + n); var v = elx ? elx.value : (f[n] || ''); try { return v ? Engine.parseTime(v) : 0; } catch (e) { return 0; } }
  function chk(n) { var elx = el('eng-' + n); return elx ? elx.checked : !!f[n]; }
  return {
    age: num('age'), weight: num('weight'), ftp: num('ftp'),
    t5k: tim('t5k'), t10k: tim('t10k'), thm: tim('thm'), tm: tim('tm'),
    hrmax: num('hrmax'), lthr: num('lthr'),
    hours: num('hours'), days: num('days'),
    sports: { run: chk('sport-run'), bike: chk('sport-bike'), strength: chk('sport-strength') },
    s200: tim('s200'), s400: tim('s400'),
    goal: (el('eng-goal') ? el('eng-goal').value : f.goal) || 'm',
    target: tim('target'), duration: tim('duration'), sweat: num('sweat')
  };
}
function engResults(i) {
  var r = Engine.compute(i), h = '';
  var km = function (s) { return Engine.mmss(s) + '/km'; };
  var w = Math.round;
  if (r.run) {
    var p = r.run.paces;
    h += '<div class="eng-block"><h3>RUN</h3><div class="big-figures"><div><strong>' + r.run.vdot.toFixed(1) + '</strong><span>VDOT (da ' + ({ '5K': '5 km', '10K': '10 km', HM: 'mezza', M: 'maratona' })[r.run.from] + ')</span></div>' +
      '<div><strong>' + km(p.threshold) + '</strong><span>ritmo soglia (stima)</span></div>' +
      '<div><strong>' + Engine.hms(r.run.equivalents.M) + '</strong><span>maratona equivalente</span></div></div>' +
      '<div class="eng-table"><table><thead><tr><th>Allenamento</th><th>Ritmo</th></tr></thead><tbody>' +
      '<tr><td>Facile / lungo</td><td>' + km(p.easyFast) + ' – ' + km(p.easySlow) + '</td></tr>' +
      '<tr><td>Maratona</td><td>' + km(p.marathon) + '</td></tr>' +
      '<tr><td>Soglia</td><td>' + km(p.threshold) + '</td></tr>' +
      '<tr><td>Intervalli</td><td>' + km(p.interval) + '</td></tr></tbody></table></div>' +
      '<p class="eng-note">Modello: Daniels e Gilbert. Punto di partenza, non una prescrizione.</p></div>';
  }
  if (r.hr) {
    var fz = function (z) { return z[2] == null ? '≥' + w(z[1]) : (z[1] ? w(z[1]) + '–' + w(z[2]) : '≤' + w(z[2])); };
    h += '<div class="eng-block"><h3>Zone cardio (LTHR ' + w(i.lthr) + ')</h3><div class="eng-table"><table><thead><tr><th>Zona</th><th>Corsa</th><th>Bici</th></tr></thead><tbody>' +
      r.hr.run.map(function (z, k) { return '<tr><td>' + z[0] + '</td><td>' + fz(z) + '</td><td>' + fz(r.hr.bike[k]) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
  }
  if (r.ride) {
    h += '<div class="eng-block"><h3>RIDE</h3><div class="big-figures"><div><strong>' + w(r.ride.ftp) + ' W</strong><span>FTP</span></div>' +
      (r.ride.wkg ? '<div><strong>' + r.ride.wkg.toFixed(2) + '</strong><span>W/kg</span></div>' : '') +
      '<div><strong>' + w(r.ride.endurance[0]) + '–' + w(r.ride.endurance[1]) + ' W</strong><span>endurance (zona 2)</span></div></div>' +
      '<div class="eng-table"><table><thead><tr><th>Zona</th><th>W</th><th>% FTP</th></tr></thead><tbody>' +
      r.ride.zones.map(function (z) {
        var wt = z[2] == null ? '≥' + w(z[1]) : (z[1] ? w(z[1]) + '–' + w(z[2]) : '≤' + w(z[2]));
        var pc = z[4] == null ? '>' + w(z[3] * 100) : (z[3] ? w(z[3] * 100) + '–' + w(z[4] * 100) : '<' + w(z[4] * 100));
        return '<tr><td>' + z[0] + '</td><td>' + wt + '</td><td>' + pc + '</td></tr>';
      }).join('') + '</tbody></table></div><p class="eng-note">Zone di Coggan.</p></div>';
  }
  if (i.s200 > 0 && i.s400 > 0) {
    var cs = 200 / (i.s400 - i.s200);
    var okCss = i.s400 > i.s200 && cs < 200 / i.s200 && cs < 400 / i.s400;
    h += '<div class="eng-block"><h3>SWIM</h3>' + (okCss ?
      '<div class="big-figures"><div><strong>' + cs.toFixed(3) + ' m/s</strong><span>CSS</span></div><div><strong>' + Engine.mmss(100 / cs) + ' /100 m</strong><span>ritmo alla CSS (stima)</span></div></div>' :
      '<p class="eng-empty">I due tempi non sono coerenti: la 400 m deve essere più lenta della 200 m e la CSS più bassa della velocità media di entrambe. Nessun risultato calcolato.</p>') +
      '<p class="eng-note">Metodo a due punti (Wakayoshi 1992): stima orientativa, non zone di allenamento.</p></div>';
  }
  if (r.fuel) {
    var F = r.fuel;
    h += '<div class="eng-block"><h3>FUEL</h3><div class="big-figures"><div><strong>' + (F.carbs[1] ? F.carbs[0] + '–' + F.carbs[1] : '0') + ' g/h</strong><span>carboidrati</span></div>' +
      '<div><strong>' + F.fluid[0] + '–' + F.fluid[1] + ' ml/h</strong><span>fluidi (punto di partenza)</span></div></div>' +
      '<p class="eng-note">Jeukendrup 2014, ACSM. Da provare nei lunghi.</p></div>';
  }
  if (r.race) {
    var R = r.race, lab = { '42195': 'Maratona', '21097.5': 'Mezza', '10000': '10K' }[String(R.dist)];
    h += '<div class="eng-block"><h3>' + lab + ': passaggi</h3><div class="big-figures"><div><strong>' + Engine.hms(R.target) + '</strong><span>' + (R.fromTarget ? 'obiettivo inserito' : 'proiezione dal VDOT') + '</span></div>' +
      '<div><strong>' + km(R.target / (R.dist / 1000)) + '</strong><span>ritmo medio</span></div></div>' +
      '<div class="eng-table"><table><thead><tr><th>Passaggio</th><th>Costante</th><th>Negative 2%</th></tr></thead><tbody>' +
      R.even.rows.map(function (row, k) { return '<tr><td>' + (row[0] === R.dist ? 'Arrivo' : row[0] / 1000 + ' km') + '</td><td>' + Engine.hms(row[1]) + '</td><td>' + Engine.hms(R.negative.rows[k][1]) + '</td></tr>'; }).join('') +
      '</tbody></table></div></div>';
  }
  if (!h) h = '<div class="empty">Inserisci almeno un dato: un tempo di gara, la FTP o le prove di nuoto. Il resto compare man mano.</div>';
  return h;
}
function vEngine(section) {
  var f = (S.profile && S.profile.fields) || {};
  var gv = function (n) { return esc(f[n] == null ? '' : f[n]); };
  var h = hdrBack('Home', 'home');
  h += '<h1 class="sm">Wolf Engine</h1><div class="sub">Calcoli sul tuo profilo. Tutto resta sul dispositivo.</div>';
  if (S.engineMsg) h += '<div class="okmsg">' + esc(S.engineMsg) + '</div>';
  h += '<div class="frow">' + ENG_FIELDS.slice(0, 2).map(fldHtml).join('') + '</div>';
  h += '<div class="kicker">Tempi di gara recenti</div><div class="frow">' + ENG_FIELDS.slice(2, 6).map(fldHtml).join('') + '</div>';
  h += '<div class="kicker">Bici e cuore</div><div class="frow3">' + ENG_FIELDS.slice(6, 9).map(fldHtml).join('') + '</div>';
  h += '<div class="kicker">Nuoto</div><div class="frow">' + ENG_FIELDS.slice(9, 11).map(fldHtml).join('') + '</div>';
  h += '<div class="frow"><div class="fld"><label>Settimana: ore</label><input id="eng-hours" inputmode="numeric" value="' + gv('hours') + '" placeholder="es. 6"></div>' +
    '<div class="fld"><label>Giorni</label><input id="eng-days" inputmode="numeric" value="' + gv('days') + '" placeholder="es. 4"></div></div>';
  h += '<div class="chk">' + [['sport-run', 'Corsa'], ['sport-bike', 'Bici'], ['sport-strength', 'Forza']].map(function (c) {
    return '<label><input type="checkbox" id="eng-' + c[0] + '"' + (f[c[0]] ? ' checked' : '') + '> ' + c[1] + '</label>';
  }).join('') + '</div>';
  h += '<div class="frow"><div class="fld"><label>Obiettivo</label><select id="eng-goal">' +
    [['m', 'Maratona'], ['hm', 'Mezza maratona'], ['10k', '10K'], ['bike', 'Bici'], ['hybrid', 'Ibrido']].map(function (g) {
      return '<option value="' + g[0] + '"' + (f.goal === g[0] ? ' selected' : '') + '>' + g[1] + '</option>';
    }).join('') + '</select></div>' +
    '<div class="fld"><label>Tempo obiettivo (opz.)</label><input id="eng-target" placeholder="h:mm:ss" value="' + gv('target') + '"></div></div>';
  h += '<div class="fld"><label>' + ENG_FIELDS[11][1] + '</label><input id="eng-sweat" inputmode="decimal" value="' + gv('sweat') + '" placeholder="es. 1.2"></div>';
  function fldHtml(fd) { return '<div class="fld"><label>' + fd[1] + '</label><input id="eng-' + fd[0] + '" value="' + gv(fd[0]) + '" placeholder="—"' + (fd[2] === 'num' ? ' inputmode="decimal"' : '') + '></div>'; }
  h += '<div id="engine-out">' + engResults(engInput()) + '</div>';
  h += '<div class="btnrow"><button class="btn" data-act="eng-save">Salva profilo</button></div>';
  return { body: h, tab: 'engine' };
}

// ---------- GUIDA ----------
function vGuida(key) {
  var g = GUIDES[key];
  if (!g) return { body: hdrBack('Home', 'home') + '<div class="empty">Guida non trovata.</div>', tab: 'home' };
  var h = hdrBack('Home', 'home');
  h += '<h1 class="sm">' + esc(g.title) + '</h1><div class="sub">' + esc(g.intro) + '</div>';
  g.cards.forEach(function (c) { h += '<div class="gcard"><b>' + esc(c[0]) + '</b><p>' + esc(c[1]) + '</p></div>'; });
  if (key === 'weights') h += '<button class="cta" data-go="builder"><b>Apri il Workout Builder</b><span>→</span></button>';
  if (key === 'swim') h += '<button class="cta" data-go="engine"><b>Calcola la tua CSS in Engine</b><span>→</span></button>';
  return { body: h, tab: 'home' };
}

// ---------- PROFILO ----------
function vProfilo() {
  var p = S.profile, f = (p && p.fields) || {};
  var h = hdrLogo();
  h += '<h1 class="sm">Profilo</h1><div class="sub">Dati tuoi, solo su questo dispositivo.</div>';
  if (S.profileMsg) h += '<div class="okmsg">' + esc(S.profileMsg) + '</div>';
  if (!S.storageOk) h += '<div class="errmsg">Salvataggio locale non disponibile: export consigliato dopo ogni modifica.</div>';
  h += '<div class="card"><div class="row"><div><b class="nm">Atleta</b><div class="meta">' +
    (f.age ? f.age + ' ANNI' : 'ETÀ —') + ' · ' + (f.weight ? f.weight + ' KG' : 'PESO —') +
    ' · ' + (p ? 'SALVATO ' + new Date(p.savedAt).toLocaleDateString('it-IT') : 'MAI SALVATO') + '</div></div>' +
    '<button class="btn ghost" data-go="engine">Modifica →</button></div></div>';
  h += '<div class="sh"><h2>Dati e backup</h2></div>';
  h += '<div class="card"><b class="nm nm-sm">Export</b><div class="meta">SCHEDE + PROFILO + EVENTUALE PIANO IN JSON</div>' +
    '<div class="btnrow"><button class="btn" data-act="export">Scarica backup</button></div></div>';
  h += '<div class="card"><b class="nm nm-sm">Import</b><div class="meta">RIPRISTINA DA FILE (ANCHE BACKUP DELLE VERSIONI 0.x)</div>' +
    '<div class="btnrow"><button class="btn" data-act="import">Scegli file…</button></div><input type="file" id="import-file" accept=".json,application/json" class="hidden"></div>';
  h += '<div class="sh"><h2>Zona di rischio</h2></div>';
  h += '<div class="btnrow"><button class="btn danger" data-act="wipe-schede">Cancella schede</button>' +
    '<button class="btn danger" data-act="wipe-profile">Cancella profilo</button></div>';
  h += '<div class="note">Le cancellazioni chiedono conferma e non toccano il file di export.</div>';
  h += '<div class="ver">WOLFLAB ' + esc(VERSION) + ' · dati locali, nessun account</div>';
  return { body: h, tab: 'profilo' };
}

// ---------- render ----------
function render() {
  var r = route(), parts = r.split('/'), v;
  if (r === 'home' || r === '') v = vHome();
  else if (r === 'schede') v = vSchede();
  else if (parts[0] === 'scheda') v = vScheda(parts[1]);
  else if (parts[0] === 'editor') v = vEditor(parts[1], parts[2]);
  else if (r === 'picker') v = vPicker();
  else if (r === 'builder') v = vBuilder();
  else if (parts[0] === 'engine') v = vEngine(parts[1]);
  else if (parts[0] === 'guida') v = vGuida(parts[1]);
  else if (parts[0] === 'planner' && window.WOLF_PLANNER_ENABLED) v = window.WolfPlannerUI.render(parts[1]);
  else if (r === 'profilo') v = vProfilo();
  else v = vHome();
  var app = el('app');
  app.innerHTML = '<div class="scr">' + v.body + '</div>' + (v.bar ? '<div class="bbar">' + v.bar + '</div>' : '') + tabsHtml(v.tab);
  app.querySelector('.scr').scrollTop = 0;
  wireEngineLive();
}
function wireEngineLive() {
  var out = el('engine-out');
  if (!out) return;
  var upd = function () { out.innerHTML = engResults(engInput()); };
  document.querySelectorAll('[id^="eng-"]').forEach(function (x) {
    x.addEventListener('input', upd); x.addEventListener('change', upd);
  });
}

// ---------- azioni ----------
function collectEditorInputs() {
  if (!S.edit) return;
  var d = S.edit.draft, g = function (id) { var x = el(id); return x ? x.value : ''; };
  var kg = String(g('ed-kg')).replace(',', '.').trim();
  d.kg = kg === '' ? null : Number(kg);
  if (d.kg != null && !(d.kg >= 0 && d.kg <= 2000)) d.kg = null;
  var wu = parseInt(g('ed-warm'), 10);
  d.warmupSets = Number.isInteger(wu) && wu >= 0 && wu <= 10 ? wu : 0;
  d.note = g('ed-note');
}
function saveEditor() {
  collectEditorInputs();
  var ctx = S.edit, d = ctx.draft;
  if (!d.name) { window.alert('Scegli prima un esercizio dalla libreria.'); return; }
  if (ctx.builder) {
    if (!S.builder.draft) S.builder.draft = [];
    if (ctx.exIdx === 'new') S.builder.draft.push(d); else S.builder.draft[ctx.exIdx] = d;
    S.edit = null; go('builder'); return;
  }
  var sc = findScheda(ctx.schedaId);
  if (!sc) return;
  if (ctx.exIdx === 'new') sc.exercises.push(d); else sc.exercises[ctx.exIdx] = d;
  sc.updatedAt = today();
  save(); S.edit = null; go('scheda/' + sc.id);
}
function doExport() {
  var text = Store.exportBackup(storage);
  var fname = 'wolflab-backup-' + today() + '.json';
  if (window.WolfNative && window.WolfNative.exportText) {
    window.WolfNative.exportText({ text: text, filename: fname, mime: 'application/json' })
      .then(function () { S.profileMsg = 'Backup salvato nei Documenti.'; render(); })
      .catch(function () { S.profileMsg = 'Export non riuscito su questo dispositivo.'; render(); });
    return;
  }
  var blob = new Blob([text], { type: 'application/json' });
  var a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = fname;
  document.body.appendChild(a); a.click(); a.remove();
  S.profileMsg = 'Backup scaricato (' + fname + ').';
}
function doImport(file) {
  var rd = new FileReader();
  rd.onload = function () {
    var r = Store.importBackup(storage, String(rd.result || ''));
    if (r.ok) {
      S.state = Store.readState(storage).state;
      S.profile = Store.readProfile(storage);
      S.profileMsg = 'Import completato: ' + r.schede + ' schede' + (r.profile ? ' + profilo atleta' : '') + '.';
    } else S.profileMsg = '';
    if (!r.ok) window.alert(r.error === 'piano_non_valido' ? 'Questo backup contiene un piano creato con una versione di prova non ancora pubblica: questa versione web non può ripristinarlo. Nessun dato è stato modificato.' : 'File non valido o non riconosciuto. Usa un backup WOLFLAB (anche delle versioni 0.x).');
    render();
  };
  rd.readAsText(file);
}
function engSave() {
  var fields = {};
  document.querySelectorAll('[id^="eng-"]').forEach(function (x) {
    var k = x.id.slice(4);
    fields[k] = x.type === 'checkbox' ? x.checked : x.value;
  });
  try {
    Store.writeProfile(storage, fields);
    S.profile = Store.readProfile(storage);
    S.engineMsg = 'Profilo salvato su questo dispositivo.';
  } catch (e) { S.engineMsg = ''; window.alert('Il browser non permette il salvataggio.'); }
  render();
}

document.addEventListener('click', function (ev) {
  var t = ev.target.closest('[data-go],[data-act],[data-eq],[data-min],[data-goal],[data-exp],[data-rw],[data-st],[data-rest],[data-edit],[data-pick],[data-mus],[data-bedit],[data-dex],[data-bmv],[data-smv]');
  if (!t) return;
  var a;
  if ((a = t.getAttribute('data-go'))) { if (a === 'back') history.back(); else go(a); return; }
  if (t.hasAttribute('data-eq')) { var c = t.getAttribute('data-eq'), i = S.builder.equipment.indexOf(c);
    if (i >= 0) S.builder.equipment.splice(i, 1); else S.builder.equipment.push(c); render(); return; }
  if (t.hasAttribute('data-min')) { S.builder.minutes = Number(t.getAttribute('data-min')); render(); return; }
  if (t.hasAttribute('data-goal')) { S.builder.goal = t.getAttribute('data-goal'); render(); return; }
  if (t.hasAttribute('data-exp')) { S.builder.experience = t.getAttribute('data-exp'); render(); return; }
  if (t.hasAttribute('data-rw')) { replaceDraft(Number(t.getAttribute('data-rw'))); render(); return; }
  if (t.hasAttribute('data-bedit')) { go('editor/b/' + t.getAttribute('data-bedit')); return; }
  if (t.hasAttribute('data-dex')) {
    var di = Number(t.getAttribute('data-dex')), dxe = S.builder.draft && S.builder.draft[di];
    if (dxe && window.confirm('Eliminare «' + dxe.name + '» dalla bozza?')) { S.builder.draft.splice(di, 1); render(); }
    return;
  }
  if (t.hasAttribute('data-bmv')) {
    var bmv = t.getAttribute('data-bmv').split('|'), bi = Number(bmv[0]), bj = bi + Number(bmv[1]), barr = S.builder.draft;
    if (barr && bj >= 0 && bj < barr.length) { var btp = barr[bi]; barr[bi] = barr[bj]; barr[bj] = btp;
      S.moveMsg = '«' + barr[bj].name + '» spostato in posizione ' + (bj + 1) + ' di ' + barr.length + '.'; render(); }
    return;
  }
  if (t.hasAttribute('data-smv')) {
    var smv = t.getAttribute('data-smv').split('|'), si = Number(smv[0]), sj = si + Number(smv[1]);
    var ssc = findScheda(route().split('/')[1]);
    if (ssc && sj >= 0 && sj < ssc.exercises.length) { var stp = ssc.exercises[si]; ssc.exercises[si] = ssc.exercises[sj]; ssc.exercises[sj] = stp;
      ssc.updatedAt = today(); save();
      S.moveMsg = '«' + ssc.exercises[sj].name + '» spostato in posizione ' + (sj + 1) + ' di ' + ssc.exercises.length + '.'; render(); }
    return;
  }
  if (t.hasAttribute('data-mus')) { S.pickerMuscle = t.getAttribute('data-mus'); render(); return; }
  if (t.hasAttribute('data-pick')) {
    var ex = EX.find(function (x) { return x.name === t.getAttribute('data-pick'); });
    if (S.edit && ex) {
      var keep = S.edit.draft;
      S.edit.draft = { id: keep.id, name: ex.name, muscle: ex.muscle, equipment: ex.eq,
        sets: keep.sets || 3, reps: ex.iso ? null : (keep.reps == null ? 8 : keep.reps), repsMax: keep.repsMax || null,
        restSec: keep.restSec || 90, kg: keep.kg, durationSec: ex.iso ? (keep.durationSec || 40) : null, note: keep.note || '', warmupSets: keep.warmupSets || 0 };
    }
    S.pickerQ = ''; S.pickerMuscle = '';
    if (S.edit && S.edit.builder) go('editor/b/' + S.edit.exIdx); else if (S.edit) go('editor/' + S.edit.schedaId + '/' + S.edit.exIdx);
    return;
  }
  if (t.hasAttribute('data-st')) {
    collectEditorInputs();
    var fp = t.getAttribute('data-st').split('|'), f = fp[0], d = Number(fp[1]);
    var cur = S.edit.draft[f] == null ? 0 : S.edit.draft[f];
    var next = cur + d;
    if (f === 'sets') next = Math.min(10, Math.max(1, next));
    if (f === 'reps') next = Math.min(50, Math.max(1, next));
    if (f === 'durationSec') next = Math.min(300, Math.max(10, next));
    S.edit.draft[f] = next;
    render(); return;
  }
  if (t.hasAttribute('data-rest')) { collectEditorInputs(); S.edit.draft.restSec = Number(t.getAttribute('data-rest')); render(); return; }
  if (t.hasAttribute('data-edit')) { go('editor/' + route().split('/')[1] + '/' + t.getAttribute('data-edit')); return; }
  var act = t.getAttribute('data-act');
  if (!act) return;
  if (act === 'gen') {
    if (!S.builder.equipment.length) { el('builder-err').innerHTML = '<div class="errmsg">Seleziona almeno un\'attrezzatura.</div>'; return; }
    var pool = builderPool(S.builder.equipment);
    if (pool.length < 3) { el('builder-err').innerHTML = '<div class="errmsg">Con questa attrezzatura ho solo ' + pool.length + ' esercizi: troppo pochi per una scheda. Aggiungi attrezzatura.</div>'; return; }
    S.builder.draft = generateDraft(S.builder, 0);
    S.builder.name = S.builder.name || ('Scheda ' + S.builder.goal.toLowerCase());
    render(); return;
  }
  if (act === 'save-draft') {
    if (!S.builder.draft || !S.builder.draft.length) { el('draft-err').innerHTML = '<div class="errmsg">La scheda è vuota: aggiungi almeno un esercizio.</div>'; return; }
    var nm = (el('draft-name') ? el('draft-name').value.trim() : '') || 'Scheda senza nome';
    var sc = { id: uid('s'), name: nm, sport: 'strength', source: 'builder',
      exercises: S.builder.draft, createdAt: today(), updatedAt: today() };
    S.state.schede.unshift(sc); save();
    S.builder.draft = null; S.builder.name = '';
    go('scheda/' + sc.id); return;
  }
  if (act === 'addex') { S.edit = { builder: true, schedaId: null, exIdx: 'new', draft: { id: uid('e'), name: '', sets: 3, reps: 8, repsMax: null, restSec: 90, kg: null, durationSec: null, note: '', warmupSets: 0 } }; go('picker'); return; }
  if (act === 'addex-scheda') { go('editor/' + route().split('/')[1] + '/new'); return; }
  if (act === 'pick') { collectEditorInputs(); go('picker'); return; }
  if (act === 'toggle-iso') { collectEditorInputs(); var dd = S.edit.draft;
    if (dd.durationSec) { dd.durationSec = null; dd.reps = 8; } else { dd.durationSec = dd.durationSec || 40; dd.reps = null; }
    render(); return; }
  if (act === 'save-ex') { saveEditor(); return; }
  if (act === 'new-manual') {
    var sc2 = { id: uid('s'), name: 'Nuova scheda', sport: 'strength', source: 'manual', exercises: [], createdAt: today(), updatedAt: today() };
    S.state.schede.unshift(sc2); save(); go('scheda/' + sc2.id); return;
  }
  if (act === 'dup-scheda') {
    var src = findScheda(route().split('/')[1]); if (!src) return;
    var cp = JSON.parse(JSON.stringify(src)); cp.id = uid('s'); cp.name = src.name + ' (copia)'; cp.updatedAt = today();
    S.state.schede.unshift(cp); save(); go('scheda/' + cp.id); return;
  }
  if (act === 'rename-scheda') {
    var rn = findScheda(route().split('/')[1]); if (!rn) return;
    var nn = window.prompt('Nome scheda', rn.name);
    if (nn && nn.trim()) { rn.name = nn.trim(); rn.updatedAt = today(); save(); render(); } return;
  }
  if (act === 'del-scheda') {
    var dl = findScheda(route().split('/')[1]); if (!dl) return;
    if (window.confirm('Eliminare «' + dl.name + '»? L\'operazione non si annulla.')) {
      S.state.schede = S.state.schede.filter(function (x) { return x.id !== dl.id; }); save(); go('schede');
    } return;
  }
  if (act === 'done-scheda') {
    var dn = findScheda(route().split('/')[1]); if (!dn) return;
    S.state.history = S.state.history || [];
    S.state.history.push({ schedaId: dn.id, name: dn.name, at: today() });
    save(); render(); return;
  }
  if (act === 'discard-draft') {
    if (window.confirm('Tornare ai parametri? La bozza generata va persa.')) { S.builder.draft = null; S.builder.name = ''; S.edit = null; render(); }
    return;
  }
  if (act === 'move-up' || act === 'move-down') {
    var mv = S.edit; if (!mv || mv.exIdx === 'new') return;
    collectEditorInputs();
    var marr = mv.builder ? S.builder.draft : (findScheda(mv.schedaId) || {}).exercises;
    if (!marr) return;
    var mi = mv.exIdx, mj = act === 'move-up' ? mi - 1 : mi + 1;
    if (mj < 0 || mj >= marr.length) return;
    var tmp = marr[mi]; marr[mi] = marr[mj]; marr[mj] = tmp;
    if (!mv.builder) { var msc = findScheda(mv.schedaId); msc.updatedAt = today(); save(); }
    S.edit = { builder: mv.builder, schedaId: mv.schedaId, exIdx: mj, draft: marr[mj] };
    S.moveMsg = 'Spostato in posizione ' + (mj + 1) + ' di ' + marr.length + '. Torna alla scheda per vedere il nuovo ordine.';
    go('editor/' + (mv.builder ? 'b' : mv.schedaId) + '/' + mj); return;
  }
  if (act === 'del-ex') {
    var cx = S.edit; if (!cx || cx.exIdx === 'new') return;
    if (!window.confirm('Eliminare «' + (cx.draft.name || 'questo esercizio') + '»?')) return;
    if (cx.builder) {
      if (S.builder.draft) S.builder.draft.splice(cx.exIdx, 1);
      S.edit = null; go('builder'); return;
    }
    var ds = findScheda(cx.schedaId); if (!ds) return;
    ds.exercises.splice(cx.exIdx, 1);
    ds.updatedAt = today(); save(); S.edit = null; go('scheda/' + ds.id); return;
  }
  if (act === 'eng-save') { engSave(); return; }
  if (act === 'export') { doExport(); return; }
  if (act === 'import') {
    if (!window.confirm('Il ripristino sostituisce schede, profilo e piano presenti con quelli del file. Esporta prima un backup. Continuare?')) return;
    if (window.WolfNative && window.WolfNative.importText) {
      window.WolfNative.importText().then(function (r) {
        var res = Store.importBackup(storage, String((r && r.text) || ''));
        if (res.ok) { S.state = Store.readState(storage).state; S.profile = Store.readProfile(storage);
          S.profileMsg = 'Import completato: ' + res.schede + ' schede' + (res.profile ? ' + profilo atleta' : '') + '.'; }
        else window.alert(res.error === 'piano_non_valido' ? 'Questo backup contiene un piano creato con una versione di prova non ancora pubblica: questa versione web non può ripristinarlo. Nessun dato è stato modificato.' : 'File non valido o non riconosciuto. Usa un backup WOLFLAB (anche delle versioni 0.x).');
        render();
      }).catch(function () {});
      return;
    }
    var fi = el('import-file'); if (fi) fi.click(); return;
  }
  if (act === 'wipe-schede') {
    if (window.confirm('Cancellare TUTTE le schede? Esporta prima un backup se serve.')) {
      S.state.schede = []; S.state.history = []; save(); S.profileMsg = 'Schede cancellate.'; render();
    } return;
  }
  if (act === 'wipe-profile') {
    if (window.confirm('Cancellare il profilo atleta salvato?')) {
      try { storage.removeItem(Store.PROFILE_KEY); } catch (e) {}
      S.profile = null; S.profileMsg = 'Profilo cancellato.'; render();
    } return;
  }
});
document.addEventListener('change', function (ev) {
  if (ev.target && ev.target.id === 'import-file' && ev.target.files && ev.target.files[0]) doImport(ev.target.files[0]);
});
document.addEventListener('input', function (ev) {
  if (ev.target && ev.target.id === 'picker-q') {
    S.pickerQ = ev.target.value;
    var q = S.pickerQ.toLowerCase();
    document.querySelectorAll('.ex[data-pick]').forEach(function (b) {
      b.style.display = (!q || b.getAttribute('data-pick').toLowerCase().indexOf(q) >= 0) ? '' : 'none';
    });
  }
  if (ev.target && ev.target.id === 'draft-name') { S.builder.name = ev.target.value; }
});

// ---------- boot ----------
if (!S.state.history) S.state.history = [];
try { // hook QA: seed draft builder da chiave locale, solo per test
  if (storage.getItem('wolf-qa-draft')) { storage.removeItem('wolf-qa-draft'); S.builder.draft = generateDraft(S.builder, 0); S.builder.name = 'Full body A'; }
} catch (e) {}
window.WolfApp = { S: S, render: render, storage: storage };
render();
})();
