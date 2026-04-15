'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useFormsCtx } from '@/context/FormsContext';
import { useUI } from '@/context/UIContext';
import { useToast } from '@/context/ToastContext';
import { useRouter } from 'next/navigation';
import { fmtDate } from '@/lib/utils';

export default function FormsListPage() {
  const { forms, connected, createForm } = useFormsCtx();
  const { openApiModal } = useUI();
  const toast  = useToast();
  const router = useRouter();

  const [showNew, setShowNew]   = useState(false);
  const [newName, setNewName]   = useState('');
  const [creating, setCreating] = useState(false);

  async function handleCreate() {
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    const entry = await createForm(name);
    setCreating(false);
    if (entry) {
      setShowNew(false);
      setNewName('');
      toast('Form creato!', 'ok');
      router.push('/forms/' + entry.slug);
    } else {
      toast('Errore nella creazione', 'err');
    }
  }

  return (
    <div>
      <div className="mb-7 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">I miei form</h1>
          <p className="text-sm text-slate-500 mt-1">Gestisci i tuoi form di raccolta lead</p>
        </div>
        <button
          onClick={() => setShowNew(true)}
          className="btn btn-primary"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuovo form
        </button>
      </div>

      {/* Connection error */}
      {connected === false && (
        <div className="flex items-center gap-3 bg-red-50 border border-red-200 rounded-lg px-4 py-3 text-sm text-red-800 mb-5">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 flex-shrink-0">
            <circle cx="12" cy="12" r="10" /><line x1="12" y1="8" x2="12" y2="12" /><line x1="12" y1="16" x2="12.01" y2="16" />
          </svg>
          <span>
            Impossibile connettersi al backend.{' '}
            <button onClick={openApiModal} className="font-bold underline">Configura l&apos;URL</button>{' '}
            nella barra laterale.
          </span>
        </div>
      )}

      {/* Forms grid */}
      {forms.length === 0 && connected !== false ? (
        <div className="flex flex-col items-center py-16 text-slate-400">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-12 h-12 opacity-30 mb-3">
            <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="text-sm">Nessun form ancora. Creane uno!</p>
        </div>
      ) : (
        <div className="grid grid-cols-[repeat(auto-fill,minmax(260px,1fr))] gap-4">
          {forms.map(form => (
            <Link
              key={form.slug}
              href={'/forms/' + form.slug}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:border-indigo-300 hover:shadow-sm transition-all group"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 font-bold text-sm flex-shrink-0">
                  {form.name.charAt(0).toUpperCase()}
                </div>
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className="w-4 h-4 text-slate-300 group-hover:text-indigo-400 transition-colors">
                  <path d="M9 18l6-6-6-6" />
                </svg>
              </div>
              <h2 className="font-semibold text-slate-900 text-sm truncate mb-1">{form.name}</h2>
              <p className="text-[.72rem] text-slate-400 font-mono mb-3">{form.slug}</p>
              <div className="flex items-center gap-3 text-xs text-slate-500">
                <span className="flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                  </svg>
                  {form.leadCount} lead
                </span>
                <span className="text-slate-300">·</span>
                <span>{fmtDate(form.createdAt).split(',')[0]}</span>
              </div>
            </Link>
          ))}
        </div>
      )}

      {/* New Form Modal */}
      {showNew && (
        <div
          className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100]"
          onClick={e => { if (e.target === e.currentTarget) setShowNew(false); }}
        >
          <div className="bg-white rounded-xl p-6 w-[340px] max-w-[calc(100vw-2rem)] shadow-2xl">
            <p className="text-[1.05rem] font-bold mb-4">Nuovo form</p>
            <div className="fg mb-5">
              <label className="fgl">Nome del form</label>
              <input
                autoFocus
                className="input"
                placeholder="Es. Contatti, Newsletter…"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleCreate();
                  if (e.key === 'Escape') setShowNew(false);
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setShowNew(false)} className="btn btn-secondary">Annulla</button>
              <button
                onClick={handleCreate}
                disabled={creating || !newName.trim()}
                className="btn btn-primary disabled:opacity-60"
              >
                {creating ? 'Creazione…' : 'Crea form'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
