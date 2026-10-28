import React, { useEffect, useState, useCallback } from 'react';
export const FileCard = ({ children }: any) => <>{children}</>;
export const Header = (_: any) => null;
export const Closing = ({ children }: any) => <p className="pk-note">{children}</p>;
export const Group = ({ children }: any) => <>{children}</>;
export const Callout = ({ children }: any) => <p className="notice">{children}</p>;
export const TextLink = ({ href, children }: any) => <a href={href} rel="noopener">{children}</a>;
const SCHEMA = 1;
// Salvataggio locale: solo su richiesta dell'utente (opt-in), solo in questo browser.
export function useLocalState<T>(key: string, initial: T): [T, (v: T | null) => boolean, { ready: boolean; message: string }] {
  const [value, setValue] = useState<T>(initial);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState('');
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(key);
      if (raw) {
        const o = JSON.parse(raw);
        if (o && o.schema === SCHEMA && o.data) setValue(o.data);
        else setMessage('Dati salvati in un formato non riconosciuto: non caricati.');
      }
    } catch {
      setMessage('Il browser non permette di leggere il salvataggio locale: le prove restano solo in questa sessione.');
    }
    setReady(true);
  }, [key]);
  const set = useCallback((v: T | null) => {
    try {
      if (v === null) window.localStorage.removeItem(key);
      else window.localStorage.setItem(key, JSON.stringify({ schema: SCHEMA, saved: Date.now(), data: v }));
      setValue(v as T);
      setMessage('');
      return true;
    } catch {
      setMessage('Salvataggio non riuscito (spazio pieno o bloccato dal browser): la scheda resta solo in questa sessione.');
      return false;
    }
  }, [key]);
  return [value, set, { ready, message }];
}
