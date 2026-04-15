'use client';

import { useState, useEffect, useRef } from 'react';
import { useUI } from '@/context/UIContext';
import { useFormsCtx } from '@/context/FormsContext';
import { useToast } from '@/context/ToastContext';
import { getApiBase, setApiBase } from '@/lib/api';

export default function ApiModal() {
  const { apiModalOpen, closeApiModal } = useUI();
  const { reloadForms } = useFormsCtx();
  const toast = useToast();

  const [url, setUrl]           = useState('');
  const [dotState, setDotState] = useState<'idle' | 'ok' | 'err'>('idle');
  const [testMsg, setTestMsg]   = useState('—');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (apiModalOpen) {
      setUrl(getApiBase());
      setDotState('idle');
      setTestMsg('—');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [apiModalOpen]);

  async function handleTest() {
    const base = url.trim().replace(/\/$/, '');
    setDotState('idle');
    setTestMsg('Test in corso…');
    try {
      const r = await fetch(base + '/api/forms', {
        signal: AbortSignal.timeout(4000),
      });
      if (r.ok) {
        setDotState('ok');
        setTestMsg('Connessione riuscita!');
      } else {
        throw new Error('HTTP ' + r.status);
      }
    } catch (e) {
      setDotState('err');
      setTestMsg('Connessione fallita: ' + (e instanceof Error ? e.message : 'errore'));
    }
  }

  async function handleSave() {
    const trimmed = url.trim().replace(/\/$/, '');
    if (!trimmed) { toast('Inserisci un URL valido', 'err'); return; }
    setApiBase(trimmed);
    closeApiModal();
    await reloadForms();
    toast('URL backend aggiornato', 'ok');
  }

  if (!apiModalOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100]"
      onClick={e => { if (e.target === e.currentTarget) closeApiModal(); }}
    >
      <div className="bg-white rounded-xl p-6 w-[380px] max-w-[calc(100vw-2rem)] shadow-2xl">
        <p className="text-[1.05rem] font-bold mb-5">Configurazione backend</p>

        <div className="flex flex-col gap-1.5 mb-4">
          <label className="text-[.75rem] font-bold uppercase tracking-wider text-slate-500">
            URL del backend
          </label>
          <input
            ref={inputRef}
            value={url}
            onChange={e => setUrl(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') handleSave(); }}
            placeholder="http://localhost:3000"
            className="input"
            autoComplete="off"
            spellCheck={false}
          />
          <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
            <span className={`w-2 h-2 rounded-full flex-shrink-0 ${
              dotState === 'ok'  ? 'bg-green-600' :
              dotState === 'err' ? 'bg-red-500'   : 'bg-slate-300'
            }`} />
            <span>{testMsg}</span>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-5 border-t border-slate-200">
          <button onClick={handleTest} className="btn btn-secondary btn-sm">
            Testa connessione
          </button>
          <button onClick={closeApiModal} className="btn btn-secondary">Annulla</button>
          <button onClick={handleSave} className="btn btn-primary">Salva</button>
        </div>
      </div>
    </div>
  );
}
