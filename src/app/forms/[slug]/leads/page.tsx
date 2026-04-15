'use client';

import { use, useState } from 'react';
import { useFormCtx } from '@/context/FormContext';
import { useToast } from '@/context/ToastContext';
import { deleteFormLead } from '@/lib/api';
import { fmtDate } from '@/lib/utils';
import type { Field } from '@/lib/types';

function sortedFields(fields: Field[]) {
  return [...fields].sort((a, b) => a.order - b.order);
}

export default function FormLeadsPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { config, leads, setLeads, reload } = useFormCtx();
  const toast = useToast();

  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);

  const fields   = sortedFields(config?.fields || []);
  const q        = search.toLowerCase();
  const filtered = q
    ? leads.filter(l => Object.values(l).some(v => String(v).toLowerCase().includes(q)))
    : leads;

  async function handleRefresh() {
    setLoading(true);
    await reload();
    setLoading(false);
  }

  async function handleDelete(id: string) {
    if (!confirm('Eliminare questa lead?')) return;
    await deleteFormLead(slug, id);
    setLeads(leads.filter(l => l.id !== id));
    toast('Lead eliminata', 'ok');
  }

  function exportCSV() {
    const header = ['Data', ...fields.map(f => f.label), 'Source URL'];
    const rows   = leads.map(l => [
      l.createdAt as string,
      ...fields.map(f => String(l[f.name] ?? '')),
      String(l._sourceUrl ?? ''),
    ]);
    const csv = [header, ...rows]
      .map(r => r.map(v => '"' + String(v).replace(/"/g, '""') + '"').join(','))
      .join('\n');
    const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), {
      href: url,
      download: 'leads_' + slug + '_' + new Date().toISOString().slice(0, 10) + '.csv',
    }).click();
    URL.revokeObjectURL(url);
    toast('CSV esportato', 'ok');
  }

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight">Lead</h1>
        <p className="text-sm text-slate-500 mt-1">Tutte le richieste ricevute tramite il form</p>
      </div>

      <div className="bg-white border border-slate-200 rounded-xl p-5">
        {/* Toolbar */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <input
            className="input max-w-[280px] flex-1 min-w-[180px]"
            placeholder="Cerca…"
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
          <span className="text-xs text-slate-500">{filtered.length} lead</span>
          <button onClick={handleRefresh} disabled={loading} className="btn btn-secondary btn-sm disabled:opacity-60">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className={`w-3 h-3 ${loading ? 'animate-spin' : ''}`}>
              <polyline points="1 4 1 10 7 10" /><path d="M3.51 15a9 9 0 1 0 .49-3.51" />
            </svg>
            Aggiorna
          </button>
          <button onClick={exportCSV} className="btn btn-secondary btn-sm">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" />
            </svg>
            Esporta CSV
          </button>
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center py-12 text-slate-400">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-10 h-10 opacity-30 mb-3">
              <path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">
              {search ? `Nessun risultato per "${search}"` : 'Nessuna lead ancora'}
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm border-collapse whitespace-nowrap">
              <thead>
                <tr>
                  <th className="text-left px-4 py-2.5 text-[.72rem] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">Data</th>
                  {fields.map(f => (
                    <th key={f.id} className="text-left px-4 py-2.5 text-[.72rem] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">{f.label}</th>
                  ))}
                  <th className="text-left px-4 py-2.5 text-[.72rem] font-bold uppercase tracking-wider text-slate-500 bg-slate-50 border-b border-slate-200">Source</th>
                  <th className="bg-slate-50 border-b border-slate-200 w-10" />
                </tr>
              </thead>
              <tbody>
                {filtered.map(l => (
                  <tr key={l.id as string} className="hover:bg-slate-50">
                    <td className="px-4 py-2.5 border-b border-slate-100 text-slate-400 text-xs">{fmtDate(l.createdAt as string)}</td>
                    {fields.map(f => (
                      <td key={f.id} className="px-4 py-2.5 border-b border-slate-100 max-w-[200px] overflow-hidden text-ellipsis">
                        {String(l[f.name] ?? '—')}
                      </td>
                    ))}
                    <td className="px-4 py-2.5 border-b border-slate-100 max-w-[180px]">
                      {l._sourceUrl ? (
                        <a
                          href={String(l._sourceUrl)}
                          target="_blank"
                          rel="noopener noreferrer"
                          title={String(l._sourceUrl)}
                          className="text-xs text-indigo-600 hover:underline block overflow-hidden text-ellipsis whitespace-nowrap"
                        >
                          {String(l._sourceUrl).replace(/^https?:\/\//, '')}
                        </a>
                      ) : (
                        <span className="text-slate-300">—</span>
                      )}
                    </td>
                    <td className="px-2 py-2.5 border-b border-slate-100">
                      <button
                        onClick={() => handleDelete(l.id as string)}
                        title="Elimina"
                        className="p-1.5 rounded text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                          <polyline points="3 6 5 6 21 6" />
                          <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                        </svg>
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
