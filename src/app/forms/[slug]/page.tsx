'use client';

import Link from 'next/link';
import { use } from 'react';
import { useFormCtx } from '@/context/FormContext';
import { useFormsCtx } from '@/context/FormsContext';
import { useToast } from '@/context/ToastContext';
import { getApiBase, renameForm } from '@/lib/api';
import { fmtDate } from '@/lib/utils';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { Field } from '@/lib/types';

function sortedFields(fields: Field[]) {
  return [...fields].sort((a, b) => a.order - b.order);
}

export default function FormDashboardPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { config, leads } = useFormCtx();
  const { forms, deleteForm, reloadForms } = useFormsCtx();
  const toast  = useToast();
  const router = useRouter();

  const [apiBase, setApiBase]           = useState('');
  const [copied, setCopied]             = useState(false);
  const [copiedHealth, setCopiedHealth] = useState(false);
  const [snippetTab, setSnippetTab]     = useState<'script' | 'iframe'>('script');
  const [copiedIframe, setCopiedIframe] = useState(false);
  const [renaming, setRenaming]         = useState(false);
  const [newName, setNewName]           = useState('');
  const [savingName, setSavingName]     = useState(false);
  const [healthState, setHealthState]   = useState<'idle' | 'checking' | 'ok' | 'err'>('idle');
  const [healthMsg, setHealthMsg]       = useState('');

  useEffect(() => { setApiBase(getApiBase()); }, []);

  const form = forms.find(f => f.slug === slug);
  const today        = new Date().toISOString().slice(0, 10);
  const todayCount   = leads.filter(l => (l.createdAt as string).startsWith(today)).length;
  const fields       = sortedFields(config?.fields || []).slice(0, 3);
  const recentLeads  = leads.slice(0, 6);

  const snippet = `<div id="leadform-container" data-form="${slug}"></div>\n<script src="${apiBase}/embed/form.js"><\/script>`;

  // iframe snippet: auto-resize version (JS on host) + fixed-height fallback
  const iframeSnippet =
`<!-- Auto-ridimensionamento (richiede JS nella pagina host) -->
<iframe id="lf-${slug}" src="${apiBase}/embed/${slug}"
  width="100%" style="border:none;display:block;overflow:hidden" height="0">
</iframe>
<script>
window.addEventListener('message', function(e) {
  if (e.data && e.data.type === 'lf-resize' && e.data.slug === '${slug}')
    document.getElementById('lf-${slug}').style.height = e.data.height + 'px';
});
<\/script>

<!-- Altezza fissa (nessun JS richiesto nella pagina host) -->
<iframe src="${apiBase}/embed/${slug}"
  width="100%" height="600" style="border:none;display:block">
</iframe>`;

  function copySnippet() {
    navigator.clipboard.writeText(snippet).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  function copyIframeSnippet() {
    navigator.clipboard.writeText(iframeSnippet).then(() => {
      setCopiedIframe(true);
      setTimeout(() => setCopiedIframe(false), 2000);
    });
  }

  async function checkHealth() {
    setHealthState('checking');
    setHealthMsg('');
    try {
      const r = await fetch(apiBase + '/api/health', { signal: AbortSignal.timeout(5000) });
      if (!r.ok) throw new Error('HTTP ' + r.status);
      const d = await r.json();
      setHealthState('ok');
      setHealthMsg(`${d.forms} form · ${d.totalLeads} lead totali · uptime ${Math.floor(d.uptime / 60)}m`);
    } catch (e) {
      setHealthState('err');
      setHealthMsg(e instanceof Error ? e.message : 'Errore');
    }
  }

  function copyHealthUrl() {
    navigator.clipboard.writeText(apiBase + '/api/health').then(() => {
      setCopiedHealth(true);
      setTimeout(() => setCopiedHealth(false), 2000);
    });
  }

  async function handleRename() {
    const name = newName.trim();
    if (!name || !form) return;
    setSavingName(true);
    const ok = await renameForm(slug, name);
    setSavingName(false);
    if (ok) {
      await reloadForms();
      setRenaming(false);
      toast('Nome aggiornato', 'ok');
    } else {
      toast('Errore nel rinomina', 'err');
    }
  }

  async function handleDelete() {
    if (!confirm(`Eliminare il form "${form?.name}"? Le lead salvate resteranno sul server.`)) return;
    const ok = await deleteForm(slug);
    if (ok) {
      toast('Form eliminato', 'ok');
      router.push('/');
    } else {
      toast('Errore nell\'eliminazione', 'err');
    }
  }

  return (
    <div>
      {/* Header */}
      <div className="mb-7 flex items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h1 className="text-2xl font-bold tracking-tight truncate">{form?.name ?? slug}</h1>
            <button
              onClick={() => { setNewName(form?.name ?? ''); setRenaming(true); }}
              title="Rinomina"
              className="p-1 rounded text-slate-400 hover:text-indigo-500 hover:bg-indigo-50 transition-colors flex-shrink-0"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
              </svg>
            </button>
          </div>
          <p className="text-xs font-mono text-slate-400">slug: {slug}</p>
        </div>
        <div className="flex items-center gap-2 flex-shrink-0">
          <Link href={`/forms/${slug}/builder`} className="btn btn-secondary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
            </svg>
            Builder
          </Link>
          <Link href={`/forms/${slug}/leads`} className="btn btn-secondary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
            </svg>
            Lead
          </Link>
          <button onClick={handleDelete} className="btn btn-danger btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            </svg>
            Elimina
          </button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(150px,1fr))] gap-3 mb-4">
        {[
          { val: leads.length,             lbl: 'Lead totali' },
          { val: todayCount,               lbl: 'Oggi' },
          { val: config?.fields?.length ?? 0, lbl: 'Campi' },
          ...(config?.multiStep ? [{ val: config.steps?.length ?? 0, lbl: 'Step' }] : []),
        ].map(({ val, lbl }) => (
          <div key={lbl} className="bg-white border border-slate-200 rounded-xl px-5 py-4">
            <div className="text-[2rem] font-extrabold leading-none tracking-tight">{val}</div>
            <div className="text-xs text-slate-500 mt-1">{lbl}</div>
          </div>
        ))}
      </div>

      {/* Recent leads */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mb-4">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Ultime lead</p>
          {leads.length > 0 && (
            <Link href={`/forms/${slug}/leads`} className="text-xs text-indigo-600 hover:underline">
              Vedi tutte →
            </Link>
          )}
        </div>
        {recentLeads.length === 0 ? (
          <p className="text-sm text-slate-400">Nessuna lead ancora.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse whitespace-nowrap">
              <thead>
                <tr>
                  <th className="text-left px-4 py-2 text-[.72rem] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">Data</th>
                  {fields.map(f => (
                    <th key={f.id} className="text-left px-4 py-2 text-[.72rem] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">{f.label}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentLeads.map(l => (
                  <tr key={l.id as string} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 border-b border-slate-100 text-slate-500 text-xs">{fmtDate(l.createdAt as string)}</td>
                    {fields.map(f => (
                      <td key={f.id} className="px-4 py-2.5 border-b border-slate-100 max-w-[200px] overflow-hidden text-ellipsis">
                        {String(l[f.name] ?? '—')}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Snippet */}
      <div className="bg-white border border-slate-200 rounded-xl p-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold uppercase tracking-wider text-slate-500">Snippet di integrazione</p>
          {/* Tab toggle */}
          <div className="flex rounded-lg border border-slate-200 overflow-hidden text-xs font-semibold">
            <button
              onClick={() => setSnippetTab('script')}
              className={`px-3 py-1.5 transition-colors ${snippetTab === 'script' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              Script
            </button>
            <button
              onClick={() => setSnippetTab('iframe')}
              className={`px-3 py-1.5 transition-colors border-l border-slate-200 ${snippetTab === 'iframe' ? 'bg-indigo-600 text-white' : 'text-slate-500 hover:bg-slate-50'}`}
            >
              iframe
            </button>
          </div>
        </div>

        {snippetTab === 'script' ? (
          <>
            <p className="text-sm text-slate-500 mb-3 leading-relaxed">
              Opzione standard. Richiede che la pagina host esegua JavaScript.
            </p>
            <pre className="bg-slate-900 text-slate-200 rounded-lg px-5 py-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre">
              {`<div id="leadform-container" data-form="${slug}"></div>\n<script src="${apiBase}/embed/form.js"></script>`}
            </pre>
            <button onClick={copySnippet} className="btn btn-secondary btn-sm mt-3">
              <svg viewBox="0 0 24 24" width="13" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
              </svg>
              {copied ? 'Copiato!' : 'Copia snippet'}
            </button>
          </>
        ) : (
          <>
            <p className="text-sm text-slate-500 mb-1 leading-relaxed">
              Il form gira in un contesto isolato. <strong className="text-slate-700">La pagina host non ha bisogno di JavaScript</strong> — basta usare la versione ad altezza fissa.
            </p>
            <p className="text-xs text-slate-400 mb-3">
              La versione con auto-ridimensionamento richiede un piccolo listener JS sulla pagina host.
            </p>
            <pre className="bg-slate-900 text-slate-200 rounded-lg px-5 py-4 text-xs font-mono leading-relaxed overflow-x-auto whitespace-pre">
              {iframeSnippet}
            </pre>
            <div className="flex items-center gap-3 mt-3 flex-wrap">
              <button onClick={copyIframeSnippet} className="btn btn-secondary btn-sm">
                <svg viewBox="0 0 24 24" width="13" fill="none" stroke="currentColor" strokeWidth="2">
                  <rect x="9" y="9" width="13" height="13" rx="2" /><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
                </svg>
                {copiedIframe ? 'Copiato!' : 'Copia snippet iframe'}
              </button>
              <a
                href={apiBase ? `${apiBase}/embed/${slug}` : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                Anteprima iframe ↗
              </a>
            </div>
          </>
        )}
      </div>

      {/* ── Stato & Verifica ── */}
      <div className="bg-white border border-slate-200 rounded-xl p-5 mt-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500 mb-4">Stato &amp; Verifica</p>

        <div className="grid grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-4">

          {/* Ultima lead */}
          <div className="flex flex-col gap-1">
            <p className="text-[.72rem] font-semibold text-slate-400 uppercase tracking-wider">Ultima lead ricevuta</p>
            <p className="text-sm font-semibold text-slate-800">
              {leads.length > 0 ? fmtDate(leads[0].createdAt as string) : '—'}
            </p>
            <p className="text-xs text-slate-400">
              {leads.length > 0 ? 'Il form sta ricevendo submission' : 'Nessuna lead ancora'}
            </p>
          </div>

          {/* Health endpoint */}
          <div className="flex flex-col gap-1">
            <p className="text-[.72rem] font-semibold text-slate-400 uppercase tracking-wider">Health endpoint</p>
            <code className="text-xs text-indigo-600 bg-slate-50 border border-slate-200 rounded px-2 py-1 font-mono break-all">
              {apiBase}/api/health
            </code>
            <div className="flex items-center gap-2 mt-1">
              <button onClick={copyHealthUrl} className="btn btn-secondary btn-sm">
                {copiedHealth ? 'Copiato!' : 'Copia URL'}
              </button>
              <a
                href={apiBase ? apiBase + '/api/health' : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                Apri ↗
              </a>
            </div>
          </div>

          {/* Test live */}
          <div className="flex flex-col gap-1">
            <p className="text-[.72rem] font-semibold text-slate-400 uppercase tracking-wider">Test live</p>
            <div className="flex items-center gap-2 flex-wrap">
              <button
                onClick={checkHealth}
                disabled={healthState === 'checking'}
                className="btn btn-secondary btn-sm disabled:opacity-60"
              >
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`w-3 h-3 ${healthState === 'checking' ? 'animate-spin' : ''}`}>
                  <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
                </svg>
                {healthState === 'checking' ? 'Controllo…' : 'Verifica backend'}
              </button>
              <a
                href={apiBase ? apiBase + '/example.html' : '#'}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary btn-sm"
              >
                Pagina di test ↗
              </a>
            </div>
            {healthState !== 'idle' && healthState !== 'checking' && (
              <div className={`flex items-center gap-1.5 text-xs mt-1 ${healthState === 'ok' ? 'text-green-700' : 'text-red-600'}`}>
                <span className={`w-2 h-2 rounded-full flex-shrink-0 ${healthState === 'ok' ? 'bg-green-500' : 'bg-red-500'}`} />
                {healthState === 'ok' ? healthMsg : `Errore: ${healthMsg}`}
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Rename modal */}
      {renaming && (
        <div
          className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100]"
          onClick={e => { if (e.target === e.currentTarget) setRenaming(false); }}
        >
          <div className="bg-white rounded-xl p-6 w-[340px] max-w-[calc(100vw-2rem)] shadow-2xl">
            <p className="text-[1.05rem] font-bold mb-4">Rinomina form</p>
            <div className="fg mb-5">
              <label className="fgl">Nuovo nome</label>
              <input
                autoFocus
                className="input"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRename();
                  if (e.key === 'Escape') setRenaming(false);
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <button onClick={() => setRenaming(false)} className="btn btn-secondary">Annulla</button>
              <button
                onClick={handleRename}
                disabled={savingName || !newName.trim()}
                className="btn btn-primary disabled:opacity-60"
              >
                {savingName ? 'Salvataggio…' : 'Salva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
