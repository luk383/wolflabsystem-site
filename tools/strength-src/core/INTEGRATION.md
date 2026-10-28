# Strength core v2 integration contract

Pure ES module core.mjs, no dependencies, DOM, network or storage. Import named functions from the same module in App.tsx. Node tests: node --test core.test.mjs. Do not copy logic into a second engine. UI strings should map reason codes in IT/EN.

## State
- Existing localStorage keys and opt-in remain. Keep original envelope untouched as backup before first successful v2 write. Do not delete v1 keys on a failed migration. Envelope may become {schema:2,saved:epoch,data}; update shim to accept both. No automatic opt-in and no cross-language merge.
- migrateLegacy(data): new data.schemaVersion=2. Original untouched, legacyBackup retained. Export the complete backup before pruning. Existing history marked legacy/prescriptionUnavailable, never infer prescribed values. Empty old reps become null, not invented targets. kind recognises IT/EN warmup. Original strings remain in legacyBackup.
- New routine uses numeric kg|null, repsMin/repsMax|null, restSeconds|null; every set has globally unique id within routine. kind=warmup/work/ramp; optional side both/left/right/each, rir,rpe,tempo. Keep display fields and notes. `routineFromLegacy(r)` bridges current editor output. UI should eventually edit numeric v2 directly.
- Keep source template snapshot separately (immutable). diffTemplate(original,current) returns paths + before/after; array edits are shown as full array difference, not per-set smart diff yet. Overrides never mutate the method source. Customized routine must be labelled personalized.

## Live session / history
- startWorkout(r,id,ISOtimestamp): prescription is frozen independent snapshot; results keyed by stable setId. Persist active session and timer deadline if opt-in; restoration must not restart rest seconds. Keep prescribed vs actual visible separately. `recordSet` returns a fresh session, preserves prescription. All numeric actuals must be real numbers; blank -> null. A done set requires kg>=0 and integer reps>=0. Actual 0 reps records failure, not validation error.
- technique is unknown/valid/compromised, pain boolean. Ask user, never infer from reps. Progression remains held if technique is unknown or any required set missing.
- finishWorkout returns a frozen final log. Templates/edits cannot rewrite it. After parsing localStorage, freeze snapshot again or keep UI immutable. Do not expose edit controls on completed log.
- executionOrder returns setIds round-robin for groupId (superset/triset/circuit), otherwise straight. Different groupIds separate circuits. Group members must be consecutive in editor; show validation/error if not. All included warmup/ramp/work sets participate in given order, so let user place warmups outside circuit explicitly.

## Progression
- Digital WOLFLAB proposal, NOT Starr original rule. Configure rule {type:linear|double|manual,version,incrementKg,roundingKg,resetAfter?,resetPercent?}. No universal defaults silently applied. Use same per-exercise rule snapshot in log for audit. Rule source/version should be visible.
- proposeProgression(finishedWorkout,exerciseId,rule,previousConsecutiveFailures): ignores warmups; ramp and work required. Missing prescriptions, incomplete sets/unknown technique -> hold. Pain/compromised technique -> stop. Meets all lower reps (linear) / upper reps (double) at prescribed load or higher -> increase. Repeated misses may propose configurable reset. No automatic changes. `applyProposal` only after user accepts. It rejects stale prescription fingerprints. Never call twice for same accepted proposal; keep accepted proposal IDs in UI state.
- rounding uses total kg increment (not single plate). Plate pair conversion belongs equipment selector. Proposed loads rounded DOWN, never above requested increment. If step eats increment, hold. Reference is top set of 5 when source defines that, never 1RM.
- generateLinkedWeek(template,referenceLoads,week,step): explicit versionId and factor on EVERY set required. Never invent ramp factors. H/L/M factors are provided by chosen verified source version. Range sources require explicit user choice inside range, not silent midpoint. Loading fields preserve referenceKg.
- createProgram: 1-52 weeks, future loads provisional not automatic increases. Deload schedule/factor user-configured, not universal historical rule. acceptReferenceUpdate propagates accepted references only to future non-completed non-deload weeks; deload weeks retained for review, not silently changed. Program must track completed week state externally.

## Other
- enduranceConflicts(events,windowHours=24) is a configurable planning flag only. Not a scientifically universal spacing requirement or proof of injury risk. sport='strength',lowerBodyHeavy=true vs other sport intensity='hard'; dates ISO with zone. Let user reschedule, no silent movement.
- csvHistory includes prescribed and actual. Export CSV with BOM, JSON full backup with schema2. Print/PDF UI via window.print with print stylesheet; not a fake PDF download. validateImport checks structure, use non-destructive preview and merge decision; it is not an XSS sanitizer, React must render notes as text.
- Default no backend, collection or sync. Preserve current opt-in. Increase obsolete14KB cap only after storage quota handling; show quota failure and retain in-memory state, offer JSON export. Never claim data saved on failed storage write.

Not included in core: UI, method library editorial completeness, export print layout, accessibility/visual verification, production migration retry handling, notification/locked screen behavior. These remain integration/QA tasks, not completed functionality by module existence.

## v2.1 additions
- storage.mjs tested injected adapter: loadState/saveState/exportBackup/clearState/mergeImport. Read with opt-in per existing key; save only with optIn=true. `loadState` returns {data,activeSession,timerDeadline}, saved and migrated flags. Schema1 original remains unchanged until save. First write creates `.schema1-backup`, then v2; quota failure never claims success. Corrupt/future envelope cannot be overwritten. `clearState` requires confirmation and only removes this Strength key+backup, never legacy Android calculator preferences.
- diffTemplate now compares exercises and sets by stable id, fields individually, plus `$order` for reorder/add/remove. This gives actionable personalization changes rather than whole-array blobs.
- Exact proposal fingerprint prevents acceptance over a subsequently edited exercise. 29 domain/storage tests.

## v2.2 validation follow-up
Circuit membership must be consecutive and exercise ids unique. Program dates reject calendar overflow. Progression rejects negative failure counters/malformed proposal loads. Future reference updates must be chronological. Import validates actual result values as well as prescription. CSV guards spreadsheet formulas in user-controlled cells. 35 automated tests now pass (including 10500 rounding checks and 50 sequential accepted proposals without historical mutation). No API breaking changes.
