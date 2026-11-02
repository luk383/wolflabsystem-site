/* WOLFLAB app — storage layer.
   Profilo atleta: chiave "wolf-my-v1", identica al sito (engine-ui.js): {t:ms, v:{campi form}}.
   Schede: chiave "wolf-workout-demo.v1", envelope {schema,saved,data,activeSession,timerDeadline}.
   Legge schema 1 e 2 (app 0.3.x/0.4.x) e 3 (questa app); scrive solo schema 3.
   Prima della prima scrittura conserva l'originale grezzo in "wolf-workout-demo.v1.pre-v3-backup".
   Import/export: legge "wolf-strength-backup" (schema 2, app precedente) e "wolflab-backup" (schema 1, questa app: profilo + schede). */
(function (root) {
  'use strict';
  var native=!!(root.Capacitor&&root.Capacitor.isNativePlatform&&root.Capacitor.isNativePlatform());
  var PROFILE_KEY = native ? 'wolf-my-v1' : 'wolf-web-profile.v1';
  var STATE_KEY = native ? 'wolf-workout-demo.v1' : 'wolf-web-state.v1';
  var LEGACY_RAW_BACKUP = STATE_KEY + '.pre-v3-backup';

  function safeParse(s) { try { return JSON.parse(s); } catch (e) { return null; } }

  // ---- profilo atleta (contratto sito) ----
  function readProfile(storage) {
    var o = safeParse(storage.getItem(PROFILE_KEY));
    if (!o || typeof o !== 'object' || o.v == null || typeof o.v !== 'object') return null;
    return { savedAt: typeof o.t === 'number' ? o.t : null, fields: o.v };
  }
  function writeProfile(storage, fields) {
    storage.setItem(PROFILE_KEY, JSON.stringify({ t: Date.now(), v: fields }));
  }

  // ---- conversione legacy -> modello v3 ----
  // schema 2 routine: {id,name,revision,exercises:[{id,name,muscle,equipment,notes,sets:[{id,kind,kg,repsMin,repsMax,restSeconds}]}]}
  // schema 1 routine: {id,name,exercises:[{name,sets:[{kg,reps,rest}]}]} (migrata da Is() dell'app precedente)
  function num(x) { var v = Number(x); return Number.isFinite(v) ? v : null; }
  function convSetGroup(ex) {
    var sets = Array.isArray(ex.sets) ? ex.sets : [];
    var work = sets.filter(function (s) { return (s.kind || 'work') === 'work'; });
    var warm = sets.length - work.length;
    var first = work[0] || {};
    var uniform = work.every(function (s) {
      return num(s.kg) === num(first.kg) && num(s.repsMin ?? s.reps) === num(first.repsMin ?? first.reps) &&
        num(s.repsMax ?? s.reps) === num(first.repsMax ?? first.reps) && num(s.restSeconds ?? s.rest) === num(first.restSeconds ?? first.rest);
    });
    var rMin = num(first.repsMin ?? first.reps), rMax = num(first.repsMax ?? first.reps);
    return {
      name: String(ex.name || 'Esercizio'), muscle: ex.muscle || null, equipment: ex.equipment || null,
      sets: work.length || (sets.length ? 0 : 1),
      reps: uniform ? rMin : rMin, repsMax: uniform && rMax !== rMin ? rMax : null,
      restSec: num(first.restSeconds ?? first.rest), kg: num(first.kg), durationSec: null,
      note: String(ex.notes || ex.note || ''), warmupSets: warm,
      partial: !uniform // serie non uniformi: valori del primo set, dettaglio perso (originale nel backup grezzo)
    };
  }
  function legacyToSchede(data) {
    var routines = Array.isArray(data && data.routines) ? data.routines : [];
    return routines.map(function (r) {
      return {
        id: String(r.id || ('r' + Math.random().toString(36).slice(2, 9))),
        name: String(r.name || 'Scheda'),
        sport: 'strength', source: 'import',
        exercises: (Array.isArray(r.exercises) ? r.exercises : []).map(convSetGroup),
        importedFrom: 'schema' + (r.schemaVersion === 2 ? '2' : '1')
      };
    });
  }

  // ---- envelope stato ----
  function emptyState() { return { schemaVersion: 3, schede: [], settings: { equipment: [], units: 'kg' } }; }
  function readState(storage) {
    var raw = storage.getItem(STATE_KEY);
    if (!raw) return { state: emptyState(), migrated: null };
    var env = safeParse(raw);
    if (!env || typeof env !== 'object' || ![1, 2, 3].includes(env.schema) || !env.data) {
      return { state: emptyState(), migrated: null, error: 'storage_schema_unsupported', raw: raw };
    }
    if (env.schema === 3 && env.data.schemaVersion === 3) return { state: env.data, migrated: null };
    // legacy 1 o 2: data contiene routines/history (schema1 convertito dall'app vecchia in forma routine simile)
    var schede = legacyToSchede(env.data);
    return { state: { schemaVersion: 3, schede: schede, settings: { equipment: [], units: 'kg' } }, migrated: env.schema, legacyRaw: raw };
  }
  function writeState(storage, state) {
    var existing = storage.getItem(STATE_KEY);
    if (existing && !storage.getItem(LEGACY_RAW_BACKUP)) storage.setItem(LEGACY_RAW_BACKUP, existing);
    storage.setItem(STATE_KEY, JSON.stringify({ schema: 3, saved: Date.now(), data: state, activeSession: null, timerDeadline: 0 }));
  }

  // ---- export / import ----
  // Nuovo export: profilo + schede. Import accetta anche "wolf-strength-backup" schema 2 (solo schede).
  function exportBackup(storage) {
    var st = readState(storage).state;
    return JSON.stringify({
      format: 'wolflab-backup', schema: 1, exportedAt: new Date().toISOString(),
      profile: readProfile(storage), state: { data: st }
    }, null, 2);
  }
  function importBackup(storage, text) {
    var o = safeParse(text);
    if (!o || typeof o !== 'object') return { ok: false, error: 'file_non_valido' };
    if (o.format === 'wolflab-backup' && o.state && o.state.data) {
      var d = o.state.data;
      if (d.planner && (!root.WolfPlanner || !root.WolfPlanner.check(d.planner))) return {ok:false,error:'piano_non_valido'};
      if (d.schemaVersion === 3 && !Array.isArray(d.schede)) return {ok:false,error:'schede_non_valide'};
      var schede = d.schemaVersion === 3 && Array.isArray(d.schede) ? d.schede : legacyToSchede(d);
      writeState(storage, { schemaVersion: 3, schede: schede, settings: (d.settings || { equipment: [], units: 'kg' }), history: Array.isArray(d.history)?d.history:[], planner: d.planner || null });
      var pv = o.profile && (o.profile.v || o.profile.fields);
      if (pv) writeProfile(storage, pv);
      return { ok: true, schede: schede.length, profile: !!pv };
    }
    if (o.format === 'wolf-strength-backup' && o.state && o.state.data) {
      var sc2 = legacyToSchede(o.state.data);
      writeState(storage, { schemaVersion: 3, schede: sc2, settings: { equipment: [], units: 'kg' } });
      return { ok: true, schede: sc2.length, profile: false };
    }
    // accetta anche il data nudo (routines)
    if (Array.isArray(o.routines)) {
      var sc3 = legacyToSchede(o);
      writeState(storage, { schemaVersion: 3, schede: sc3, settings: { equipment: [], units: 'kg' } });
      return { ok: true, schede: sc3.length, profile: false };
    }
    return { ok: false, error: 'formato_non_riconosciuto' };
  }

  var api = { PROFILE_KEY: PROFILE_KEY, STATE_KEY: STATE_KEY, LEGACY_RAW_BACKUP: LEGACY_RAW_BACKUP,
    readProfile: readProfile, writeProfile: writeProfile,
    readState: readState, writeState: writeState, emptyState: emptyState,
    exportBackup: exportBackup, importBackup: importBackup, legacyToSchede: legacyToSchede };
  if (typeof module !== 'undefined') module.exports = api;
  root.WolfStore = api;
})(typeof window !== 'undefined' ? window : globalThis);
