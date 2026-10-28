import React, { useEffect, useState, useCallback, useRef } from 'react';
import { loadState, saveState, clearState, exportBackup } from './core/storage.mjs';
import { toStore, fromStore } from './lab';
export const FileCard = ({ children }: any) => <>{children}</>;
export const Header = (_: any) => null;
export const Closing = ({ children }: any) => <p className="pk-note">{children}</p>;
export const Group = ({ children }: any) => <>{children}</>;
export const Callout = ({ children }: any) => <p className="notice">{children}</p>;
export const TextLink = ({ href, children }: any) => <a href={href} rel="noopener">{children}</a>;
export const KEY = 'wolf-workout-demo.v1';
const ERR: any = {
  storage_corrupt: 'Dati salvati non leggibili: non sono stati toccati né sovrascritti.',
  storage_schema_unsupported: 'Dati salvati con un formato più recente o sconosciuto: non caricati e non sovrascritti.',
  storage_write_failed: 'Salvataggio non riuscito (spazio pieno o bloccato dal browser): la modifica resta solo in questa sessione.',
  storage_verification_failed: 'Salvataggio non verificato: la modifica resta solo in questa sessione.',
};
// Salvataggio locale: solo su richiesta dell'utente (opt-in), solo in questo browser. Logica di lettura/scrittura nel nucleo (storage.mjs).
export function useStrengthState(): [any, (v: any | null) => boolean, { ready: boolean; message: string; activeSession: any; timerDeadline: number; extra: any; backup: (d: any) => string }] {
  const [value, setValue] = useState<any>(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  const [boot, setBoot] = useState<any>({ activeSession: null, timerDeadline: 0 });
  const extra = useRef<any>({ activeSession: null, timerDeadline: 0 });
  useEffect(() => {
    try {
      const r: any = loadState(window.localStorage, KEY);
      if (r.data) { setValue(fromStore(r.data)); setBoot({ activeSession: r.activeSession, timerDeadline: r.timerDeadline }); }
    } catch (e: any) {
      setMessage(ERR[e && e.message] || 'Il browser non permette di leggere il salvataggio locale: le prove restano solo in questa sessione.');
    }
    setReady(true);
  }, []);
  const set = useCallback((v: any | null) => {
    try {
      if (v === null) { clearState(window.localStorage, KEY, true); setValue(null); setMessage(''); return true; }
      const r: any = saveState(window.localStorage, KEY, { data: toStore(v), activeSession: extra.current.activeSession, timerDeadline: extra.current.timerDeadline }, true);
      if (!r.saved) return false;
      setValue(v); setMessage(''); return true;
    } catch (e: any) { setMessage(ERR[e && e.message] || 'Salvataggio non riuscito: la modifica resta solo in questa sessione.'); return false; }
  }, []);
  const backup = useCallback((d: any) => exportBackup(window.localStorage, KEY, { data: toStore(d), activeSession: extra.current.activeSession, timerDeadline: extra.current.timerDeadline }), []);
  return [value, set, { ready, message, activeSession: boot.activeSession, timerDeadline: boot.timerDeadline, extra, backup }];
}
