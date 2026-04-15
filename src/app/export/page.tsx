'use client';

import { useState, useEffect, useCallback } from 'react';
import { useFormsCtx } from '@/context/FormsContext';
import { useToast }    from '@/context/ToastContext';
import {
  fetchExportTemplate,
  putExportTemplate,
  downloadExport,
  fetchFormConfig,
} from '@/lib/api';
import type {
  ExportTemplate,
  ExportSchemaColumn,
  FormExportMapping,
  FormConfig,
} from '@/lib/types';

// ── helpers ───────────────────────────────────────────────────────────────────

function newColId() {
  return crypto.randomUUID();
}

/** Special source keys always available regardless of form fields */
const SYSTEM_SOURCES = [
  { key: '_createdAt', label: 'Data creazione' },
  { key: '_formName',  label: 'Nome form' },
  { key: '_formSlug',  label: 'Slug form' },
  { key: '_sourceUrl', label: 'Source URL' },
];

/** Build a default (empty) mapping for a form */
function defaultMapping(slug: string): FormExportMapping {
  return { slug, enabled: false, map: {} };
}

/**
 * Merge saved template with current form list:
 * - keep existing mappings for known slugs
 * - add default mapping for new slugs
 */
function syncMappings(
  saved: FormExportMapping[],
  currentSlugs: string[],
): FormExportMapping[] {
  const bySlug = Object.fromEntries(saved.map(m => [m.slug, m]));
  return currentSlugs.map(slug => bySlug[slug] ?? defaultMapping(slug));
}

// ── icons ─────────────────────────────────────────────────────────────────────

const IconTrash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
    <polyline points="3 6 5 6 21 6" />
    <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);
const IconUp = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
    <polyline points="18 15 12 9 6 15" />
  </svg>
);
const IconDown = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3">
    <polyline points="6 9 12 15 18 9" />
  </svg>
);
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconDownload = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);
const IconSave = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
    <polyline points="17 21 17 13 7 13 7 21" />
    <polyline points="7 3 7 8 15 8" />
  </svg>
);

// ── main component ────────────────────────────────────────────────────────────

export default function ExportPage() {
  const { forms } = useFormsCtx();
  const toast     = useToast();

  const [columns,      setColumns]      = useState<ExportSchemaColumn[]>([]);
  const [mappings,     setMappings]     = useState<FormExportMapping[]>([]);
  const [formConfigs,  setFormConfigs]  = useState<Record<string, FormConfig>>({});
  const [dateFrom,     setDateFrom]     = useState('');
  const [dateTo,       setDateTo]       = useState('');
  const [loading,      setLoading]      = useState(true);
  const [saving,       setSaving]       = useState(false);
  const [exporting,    setExporting]    = useState(false);
  const [dirty,        setDirty]        = useState(false);

  // ── load template + form configs ──────────────────────────────────────────

  const loadAll = useCallback(async () => {
    setLoading(true);
    try {
      const [tmpl, ...configs] = await Promise.all([
        fetchExportTemplate(),
        ...forms.map(f => fetchFormConfig(f.slug).catch(() => null)),
      ]);

      const cfgMap: Record<string, FormConfig> = {};
      forms.forEach((f, i) => { if (configs[i]) cfgMap[f.slug] = configs[i] as FormConfig; });
      setFormConfigs(cfgMap);

      setColumns(tmpl.columns ?? []);
      setMappings(syncMappings(tmpl.formMappings ?? [], forms.map(f => f.slug)));
    } catch {
      toast('Errore nel caricamento del template', 'err');
    } finally {
      setLoading(false);
    }
  }, [forms, toast]);

  useEffect(() => { loadAll(); }, [loadAll]);

  // ── save ──────────────────────────────────────────────────────────────────

  async function handleSave() {
    setSaving(true);
    const ok = await putExportTemplate({ columns, formMappings: mappings });
    setSaving(false);
    if (ok) { setDirty(false); toast('Template salvato', 'ok'); }
    else      toast('Errore nel salvataggio', 'err');
  }

  // ── export ────────────────────────────────────────────────────────────────

  async function handleExport() {
    setExporting(true);
    try {
      const blob = await downloadExport(dateFrom || undefined, dateTo || undefined);
      const url  = URL.createObjectURL(blob);
      Object.assign(document.createElement('a'), {
        href: url,
        download: `leads_export_${new Date().toISOString().slice(0, 10)}.csv`,
      }).click();
      URL.revokeObjectURL(url);
      toast('CSV esportato', 'ok');
    } catch (e: unknown) {
      toast((e instanceof Error ? e.message : 'Errore nell\'export'), 'err');
    } finally {
      setExporting(false);
    }
  }

  // ── column helpers ────────────────────────────────────────────────────────

  function addColumn() {
    setColumns(prev => [...prev, { id: newColId(), label: 'Nuova colonna' }]);
    setDirty(true);
  }

  function updateColumnLabel(id: string, label: string) {
    setColumns(prev => prev.map(c => c.id === id ? { ...c, label } : c));
    setDirty(true);
  }

  function removeColumn(id: string) {
    setColumns(prev => prev.filter(c => c.id !== id));
    setMappings(prev => prev.map(m => {
      const map = { ...m.map };
      delete map[id];
      return { ...m, map };
    }));
    setDirty(true);
  }

  function moveColumn(idx: number, dir: -1 | 1) {
    const next = [...columns];
    const target = idx + dir;
    if (target < 0 || target >= next.length) return;
    [next[idx], next[target]] = [next[target], next[idx]];
    setColumns(next);
    setDirty(true);
  }

  // ── mapping helpers ───────────────────────────────────────────────────────

  function toggleForm(slug: string, enabled: boolean) {
    setMappings(prev => prev.map(m => m.slug === slug ? { ...m, enabled } : m));
    setDirty(true);
  }

  function setFieldMap(slug: string, colId: string, srcKey: string) {
    setMappings(prev => prev.map(m =>
      m.slug === slug ? { ...m, map: { ...m.map, [colId]: srcKey } } : m,
    ));
    setDirty(true);
  }

  // ── source options for a form ─────────────────────────────────────────────

  function sourceOptions(slug: string) {
    const cfg    = formConfigs[slug];
    const fields = cfg ? [...cfg.fields].sort((a, b) => a.order - b.order) : [];
    return [
      { key: '', label: '— non mappato —' },
      ...SYSTEM_SOURCES,
      ...fields.map(f => ({ key: f.name, label: `${f.label} (${f.name})` })),
    ];
  }

  // ── render ────────────────────────────────────────────────────────────────

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64 text-slate-400 text-sm">
        Caricamento…
      </div>
    );
  }

  const enabledCount = mappings.filter(m => m.enabled).length;

  return (
    <div className="max-w-[1100px]">

      {/* ── Page header ──────────────────────────────────────────────────── */}
      <div className="mb-7 flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Export template</h1>
          <p className="text-sm text-slate-500 mt-1">
            Definisci lo schema di output e mappa i campi di ciascun form.
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving || !dirty}
          className="btn btn-primary disabled:opacity-50 flex items-center gap-2"
        >
          <IconSave />
          {saving ? 'Salvataggio…' : 'Salva template'}
        </button>
      </div>

      <div className="grid grid-cols-[280px_1fr] gap-5 items-start">

        {/* ── Left: Schema colonne ─────────────────────────────────────── */}
        <div className="bg-white border border-slate-200 rounded-xl p-4 sticky top-6">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-slate-700">Schema colonne</span>
            <button
              onClick={addColumn}
              className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800 font-medium"
            >
              <IconPlus />Aggiungi
            </button>
          </div>

          {columns.length === 0 ? (
            <p className="text-xs text-slate-400 py-4 text-center">
              Nessuna colonna. Aggiungine una.
            </p>
          ) : (
            <ul className="space-y-1.5">
              {columns.map((col, idx) => (
                <li key={col.id} className="flex items-center gap-1">
                  {/* reorder */}
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveColumn(idx, -1)}
                      disabled={idx === 0}
                      className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20"
                    >
                      <IconUp />
                    </button>
                    <button
                      onClick={() => moveColumn(idx, 1)}
                      disabled={idx === columns.length - 1}
                      className="p-0.5 text-slate-300 hover:text-slate-600 disabled:opacity-20"
                    >
                      <IconDown />
                    </button>
                  </div>

                  {/* label */}
                  <input
                    className="input input-sm flex-1 text-xs py-1"
                    value={col.label}
                    onChange={e => updateColumnLabel(col.id, e.target.value)}
                  />

                  {/* delete */}
                  <button
                    onClick={() => removeColumn(col.id)}
                    className="p-1 text-slate-300 hover:text-red-500 transition-colors"
                  >
                    <IconTrash />
                  </button>
                </li>
              ))}
            </ul>
          )}

          {columns.length > 0 && (
            <p className="text-[.68rem] text-slate-400 mt-3 leading-snug">
              {columns.length} colonna{columns.length !== 1 ? 'e' : ''}
            </p>
          )}
        </div>

        {/* ── Right: mapping + export ──────────────────────────────────── */}
        <div className="space-y-4">

          {/* Mapping per form */}
          {forms.length === 0 ? (
            <div className="bg-white border border-slate-200 rounded-xl p-8 text-center text-sm text-slate-400">
              Nessun form disponibile.
            </div>
          ) : (
            forms.map(form => {
              const mapping = mappings.find(m => m.slug === form.slug);
              if (!mapping) return null;
              const opts = sourceOptions(form.slug);

              return (
                <div
                  key={form.slug}
                  className={`bg-white border rounded-xl overflow-hidden transition-all ${
                    mapping.enabled ? 'border-indigo-200' : 'border-slate-200 opacity-70'
                  }`}
                >
                  {/* Form header */}
                  <div className={`flex items-center gap-3 px-4 py-3 border-b ${
                    mapping.enabled ? 'border-indigo-100 bg-indigo-50/40' : 'border-slate-100 bg-slate-50'
                  }`}>
                    <label className="flex items-center gap-2 cursor-pointer select-none">
                      <input
                        type="checkbox"
                        checked={mapping.enabled}
                        onChange={e => toggleForm(form.slug, e.target.checked)}
                        className="w-4 h-4 rounded accent-indigo-600"
                      />
                      <span className="font-semibold text-sm text-slate-800">{form.name}</span>
                    </label>
                    <span className="text-xs text-slate-400 font-mono">{form.slug}</span>
                    <span className="ml-auto text-xs text-slate-400">
                      {form.leadCount} lead
                    </span>
                  </div>

                  {/* Column mapping table */}
                  {mapping.enabled && (
                    <div className="p-4">
                      {columns.length === 0 ? (
                        <p className="text-xs text-slate-400">
                          Aggiungi colonne nello schema per configurare il mapping.
                        </p>
                      ) : (
                        <table className="w-full text-sm">
                          <thead>
                            <tr>
                              <th className="text-left text-[.7rem] font-bold uppercase tracking-wider text-slate-400 pb-2 w-[45%]">
                                Colonna output
                              </th>
                              <th className="text-left text-[.7rem] font-bold uppercase tracking-wider text-slate-400 pb-2">
                                Campo sorgente
                              </th>
                            </tr>
                          </thead>
                          <tbody>
                            {columns.map(col => (
                              <tr key={col.id} className="border-t border-slate-100">
                                <td className="py-2 pr-4 text-slate-700 font-medium text-xs">
                                  {col.label}
                                </td>
                                <td className="py-1.5">
                                  <select
                                    className="input input-sm text-xs py-1 w-full"
                                    value={mapping.map[col.id] ?? ''}
                                    onChange={e => setFieldMap(form.slug, col.id, e.target.value)}
                                  >
                                    {opts.map(o => (
                                      <option key={o.key} value={o.key}>{o.label}</option>
                                    ))}
                                  </select>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              );
            })
          )}

          {/* ── Export section ─────────────────────────────────────────── */}
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-sm font-semibold text-slate-700 mb-3">Esporta CSV</p>

            <div className="flex flex-wrap items-end gap-3">
              <div className="fg mb-0">
                <label className="fgl text-xs">Da</label>
                <input
                  type="date"
                  className="input input-sm text-xs"
                  value={dateFrom}
                  onChange={e => setDateFrom(e.target.value)}
                />
              </div>
              <div className="fg mb-0">
                <label className="fgl text-xs">A</label>
                <input
                  type="date"
                  className="input input-sm text-xs"
                  value={dateTo}
                  onChange={e => setDateTo(e.target.value)}
                />
              </div>

              <button
                onClick={handleExport}
                disabled={exporting || columns.length === 0 || enabledCount === 0}
                className="btn btn-primary flex items-center gap-2 disabled:opacity-50"
              >
                <IconDownload />
                {exporting ? 'Esportazione…' : `Esporta CSV (${enabledCount} form)`}
              </button>
            </div>

            {dirty && (
              <p className="text-xs text-amber-600 mt-3">
                Hai modifiche non salvate. Salva il template prima di esportare.
              </p>
            )}
            {columns.length === 0 && (
              <p className="text-xs text-slate-400 mt-2">Aggiungi almeno una colonna per esportare.</p>
            )}
            {columns.length > 0 && enabledCount === 0 && (
              <p className="text-xs text-slate-400 mt-2">Abilita almeno un form per esportare.</p>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
