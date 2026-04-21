'use client';

import { useState, useEffect, ReactNode } from 'react';
import { use } from 'react';
import { useFormCtx } from '@/context/FormContext';
import { useToast } from '@/context/ToastContext';
import { putFormConfig } from '@/lib/api';
import type { Field, FieldTracking, FormConfig, FormStyle, Step, TrackingConfig } from '@/lib/types';
import FieldModal from '@/components/FieldModal';
import FieldList from '@/components/FieldList';
import StepManager from '@/components/StepManager';

/* ─── Google Fonts catalogue ───────────────────────────────────────────────── */
const GOOGLE_FONTS = [
  { label: 'Inter',              family: "'Inter', sans-serif",                    url: 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap' },
  { label: 'Roboto',             family: "'Roboto', sans-serif",                   url: 'https://fonts.googleapis.com/css2?family=Roboto:wght@400;500;700&display=swap' },
  { label: 'Open Sans',          family: "'Open Sans', sans-serif",                url: 'https://fonts.googleapis.com/css2?family=Open+Sans:wght@400;600;700&display=swap' },
  { label: 'Lato',               family: "'Lato', sans-serif",                     url: 'https://fonts.googleapis.com/css2?family=Lato:wght@400;700&display=swap' },
  { label: 'Poppins',            family: "'Poppins', sans-serif",                  url: 'https://fonts.googleapis.com/css2?family=Poppins:wght@400;500;600;700&display=swap' },
  { label: 'Montserrat',         family: "'Montserrat', sans-serif",               url: 'https://fonts.googleapis.com/css2?family=Montserrat:wght@400;500;700&display=swap' },
  { label: 'Nunito',             family: "'Nunito', sans-serif",                   url: 'https://fonts.googleapis.com/css2?family=Nunito:wght@400;600;700&display=swap' },
  { label: 'DM Sans',            family: "'DM Sans', sans-serif",                  url: 'https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;700&display=swap' },
  { label: 'Plus Jakarta Sans',  family: "'Plus Jakarta Sans', sans-serif",        url: 'https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;700&display=swap' },
  { label: 'Raleway',            family: "'Raleway', sans-serif",                  url: 'https://fonts.googleapis.com/css2?family=Raleway:wght@400;500;700&display=swap' },
  { label: 'Playfair Display',   family: "'Playfair Display', serif",              url: 'https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700&display=swap' },
  { label: 'Merriweather',       family: "'Merriweather', serif",                  url: 'https://fonts.googleapis.com/css2?family=Merriweather:wght@400;700&display=swap' },
] as const;

/* ─── Toggle ───────────────────────────────────────────────────────────────── */
function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative w-[38px] h-[21px] cursor-pointer flex-shrink-0">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={e => onChange(e.target.checked)} />
      <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600" />
      <span className="absolute top-[3px] left-[3px] w-[15px] h-[15px] rounded-full bg-white shadow transition peer-checked:translate-x-[17px]" />
    </label>
  );
}

/* ─── Section (accordion) ──────────────────────────────────────────────────── */
function Section({
  title,
  defaultOpen = false,
  headerAction,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  headerAction?: ReactNode;
  children: ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
      {/* Header row – only title+chevron is the button; action sits outside */}
      <div className="flex items-center px-5 py-4 gap-3">
        <button
          type="button"
          onClick={() => setOpen(o => !o)}
          className="flex items-center gap-2 flex-1 text-left min-w-0"
        >
          <span className="text-xs font-bold uppercase tracking-wider text-slate-500 truncate">
            {title}
          </span>
          <svg
            viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
            className={`w-3.5 h-3.5 text-slate-400 flex-shrink-0 transition-transform duration-200 ${open ? 'rotate-180' : ''}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </button>
        {headerAction && <div className="flex-shrink-0">{headerAction}</div>}
      </div>

      {/* Collapsible body */}
      {open && (
        <div className="px-5 pt-2 pb-5 border-t border-slate-100">
          {children}
        </div>
      )}
    </div>
  );
}

/* ─── Page ─────────────────────────────────────────────────────────────────── */
export default function FormBuilderPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const { config, setConfig } = useFormCtx();
  const toast = useToast();

  const [draft, setDraft]                 = useState<FormConfig>({ fields: [] });
  const [fieldModalOpen, setFieldModalOpen] = useState(false);
  const [editFieldId, setEditFieldId]     = useState<string | null>(null);
  const [saving, setSaving]               = useState(false);

  useEffect(() => {
    if (config) setDraft(structuredClone(config));
  }, [config]);

  const sortedFields = [...draft.fields].sort((a, b) => a.order - b.order);
  const steps: Step[] = draft.steps || [];

  function set<K extends keyof FormConfig>(key: K, val: FormConfig[K]) {
    setDraft(d => ({ ...d, [key]: val }));
  }

  function setTracking<K extends keyof TrackingConfig>(key: K, val: TrackingConfig[K]) {
    setDraft(d => ({ ...d, tracking: { ...d.tracking, [key]: val || undefined } }));
  }

  function defaultFieldTracking(f: Field): FieldTracking {
    if (f.type === 'email')     return { plainKey: 'userEmail', hashedKey: 'hashedEmail' };
    if (f.type === 'tel')       return { hashedKey: 'hashedPhone' };
    if (f.type === 'comune')    return { hashedKey: 'hashedCity' };
    if (f.type === 'provincia') return { plainKey: 'formRegion' };
    return {};
  }

  function autoGtmKey(f: Field): string {
    return 'form' + f.name.charAt(0).toUpperCase() + f.name.slice(1);
  }

  function getFieldTracking(f: Field): FieldTracking {
    return draft.tracking?.fields?.[f.name] ?? defaultFieldTracking(f);
  }

  function setFieldTracking(fieldName: string, ft: FieldTracking) {
    const current = draft.tracking?.fields || {};
    setTracking('fields', { ...current, [fieldName]: ft });
  }

  function initFieldsIfNeeded() {
    if (draft.tracking?.fields) return;
    const map: Record<string, FieldTracking> = {};
    sortedFields.forEach(f => { map[f.name] = defaultFieldTracking(f); });
    setTracking('fields', map);
  }

  function setStyle<K extends keyof FormStyle>(key: K, val: string) {
    setDraft(d => ({ ...d, style: { ...d.style, [key]: val || undefined } }));
  }

  function setFont(family: string) {
    const gf = GOOGLE_FONTS.find(f => f.family === family);
    setDraft(d => ({
      ...d,
      style: { ...d.style, fontFamily: family || undefined, fontUrl: gf?.url || undefined },
    }));
  }

  function handleReorder(fields: Field[]) {
    setDraft(d => ({ ...d, fields }));
  }

  function handleSaveField(field: Field) {
    setDraft(d => {
      const exists = d.fields.find(f => f.id === field.id);
      if (exists) {
        return { ...d, fields: d.fields.map(f => f.id === field.id ? field : f) };
      }
      const maxOrder = d.fields.reduce((m, f) => Math.max(m, f.order), -1);
      return { ...d, fields: [...d.fields, { ...field, order: maxOrder + 1 }] };
    });
    setFieldModalOpen(false);
    setEditFieldId(null);
  }

  function handleDeleteField(id: string) {
    setDraft(d => ({ ...d, fields: d.fields.filter(f => f.id !== id) }));
  }

  function handleAddStep() {
    const newStep: Step = { id: crypto.randomUUID(), label: `Step ${steps.length + 1}` };
    setDraft(d => ({ ...d, steps: [...(d.steps || []), newStep] }));
  }

  function handleUpdateStep(id: string, label: string) {
    setDraft(d => ({ ...d, steps: (d.steps || []).map(s => s.id === id ? { ...s, label } : s) }));
  }

  function handleDeleteStep(id: string) {
    setDraft(d => ({
      ...d,
      steps: (d.steps || []).filter(s => s.id !== id),
      fields: d.fields.map(f => f.stepId === id ? { ...f, stepId: undefined } : f),
    }));
  }

  async function handleSave() {
    setSaving(true);
    const ok = await putFormConfig(slug, draft);
    setSaving(false);
    if (ok) {
      setConfig(draft);
      toast('Configurazione salvata!', 'ok');
    } else {
      toast('Errore nel salvataggio', 'err');
    }
  }

  const editField     = editFieldId ? draft.fields.find(f => f.id === editFieldId) ?? null : null;
  const existingNames = draft.fields.map(f => f.name).filter(n => n !== editField?.name);

  return (
    <div>
      <div className="mb-7">
        <h1 className="text-2xl font-bold tracking-tight">Form Builder</h1>
        <p className="text-sm text-slate-500 mt-1">
          Personalizza i campi e le impostazioni del form
        </p>
      </div>

      <div className="space-y-4">
        {/* ── General settings ── */}
        <Section title="Impostazioni generali">
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div className="fg">
              <label className="fgl">Titolo</label>
              <input
                value={draft.title || ""}
                onChange={(e) => set("title", e.target.value)}
                placeholder="Es. Contattaci"
                className="input"
              />
            </div>
            <div className="fg">
              <label className="fgl">Testo pulsante</label>
              <input
                value={draft.submitLabel || ""}
                onChange={(e) => set("submitLabel", e.target.value)}
                placeholder="Es. Invia richiesta"
                className="input"
              />
            </div>
            <div className="fg col-span-2">
              <label className="fgl">Descrizione</label>
              <textarea
                value={draft.description || ""}
                onChange={(e) => set("description", e.target.value)}
                placeholder="Breve descrizione visualizzata sopra il form"
                className="input"
              />
            </div>
            <div className="fg col-span-2">
              <label className="fgl">Messaggio di successo</label>
              <input
                value={draft.successMessage || ""}
                onChange={(e) => set("successMessage", e.target.value)}
                placeholder="Messaggio mostrato dopo l'invio"
                className="input"
              />
            </div>
            <div className="fg col-span-2">
              <label className="fgl">
                URL Thank You Page{" "}
                <span className="font-normal normal-case tracking-normal text-slate-400">
                  &mdash; opzionale
                </span>
              </label>
              <input
                type="url"
                value={draft.thankYouUrl || ""}
                onChange={(e) => set("thankYouUrl", e.target.value)}
                placeholder="https://tuosito.com/grazie"
                className="input"
                autoComplete="off"
              />
              <span className="text-xs text-slate-400">
                Se impostata, l&apos;utente viene reindirizzato a questa URL
                dopo l&apos;invio.
              </span>
            </div>

            {/* Multi-step toggle */}
            <div className="col-span-2 flex items-center justify-between pt-1">
              <div>
                <p className="text-sm font-semibold text-slate-800">
                  Modalità multi-step
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  Dividi il form in più passaggi con avanzamento progressivo
                </p>
              </div>
              <Toggle
                checked={draft.multiStep || false}
                onChange={(v) => set("multiStep", v)}
              />
            </div>

            {/* Stepper style – visible only when multi-step is on */}
            {draft.multiStep && (
              <div className="col-span-2 flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-slate-800">
                    Stile stepper
                  </p>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Scegli come mostrare l&apos;avanzamento tra gli step
                  </p>
                </div>
                <div className="flex rounded-lg border border-slate-200 overflow-hidden text-sm font-semibold">
                  <button
                    type="button"
                    onClick={() => set("stepperStyle", "dots")}
                    className={`px-3 py-1.5 transition-colors ${
                      !draft.stepperStyle || draft.stepperStyle === "dots"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Pallini
                  </button>
                  <button
                    type="button"
                    onClick={() => set("stepperStyle", "bar")}
                    className={`px-3 py-1.5 border-l border-slate-200 transition-colors ${
                      draft.stepperStyle === "bar"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    }`}
                  >
                    Barra %
                  </button>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ── Style panel ── */}
        <Section
          title="Stile"
          headerAction={
            draft.style && Object.keys(draft.style).length > 0 ? (
              <button
                type="button"
                onClick={() => setDraft((d) => ({ ...d, style: {} }))}
                className="text-xs text-slate-400 hover:text-red-500 transition-colors"
              >
                Ripristina default
              </button>
            ) : undefined
          }
        >
          <div className="grid grid-cols-2 gap-3 pt-3">
            {/* Primary colour */}
            <div className="fg col-span-2 sm:col-span-1">
              <label className="fgl">Colore principale</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={draft.style?.primaryColor || "#4f46e5"}
                  onChange={(e) => setStyle("primaryColor", e.target.value)}
                  className="w-10 h-[38px] rounded-md border border-slate-200 cursor-pointer p-0.5 flex-shrink-0"
                />
                <input
                  type="text"
                  value={draft.style?.primaryColor || ""}
                  onChange={(e) => setStyle("primaryColor", e.target.value)}
                  placeholder="#4f46e5"
                  className="input flex-1"
                />
              </div>
            </div>

            {/* Border radius */}
            <div className="fg col-span-2 sm:col-span-1">
              <label className="fgl">Arrotondamento</label>
              <input
                type="text"
                value={draft.style?.borderRadius || ""}
                onChange={(e) => setStyle("borderRadius", e.target.value)}
                placeholder="6px"
                className="input"
              />
            </div>

            {/* Font family */}
            <div className="fg col-span-2">
              <label className="fgl">Font</label>
              <select
                value={draft.style?.fontFamily || ""}
                onChange={(e) => setFont(e.target.value)}
                className="input"
              >
                <option value="">System UI (default)</option>
                <optgroup label="Web safe">
                  <option value="Arial, sans-serif">Arial</option>
                  <option value="'Helvetica Neue', Helvetica, sans-serif">Helvetica Neue</option>
                  <option value="Georgia, serif">Georgia</option>
                  <option value="'Times New Roman', serif">Times New Roman</option>
                  <option value="'Trebuchet MS', sans-serif">Trebuchet MS</option>
                  <option value="'Courier New', monospace">Courier New</option>
                </optgroup>
                <optgroup label="Google Fonts">
                  {GOOGLE_FONTS.map(f => (
                    <option key={f.family} value={f.family}>{f.label}</option>
                  ))}
                </optgroup>
              </select>
              {draft.style?.fontUrl && (
                <span className="text-xs text-indigo-500 mt-1 flex items-center gap-1">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 flex-shrink-0"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>
                  Font caricato da Google Fonts
                </span>
              )}
            </div>

            {/* Input border colour */}
            <div className="fg col-span-2 sm:col-span-1">
              <label className="fgl">Bordo input</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={draft.style?.inputBorderColor || "#d1d5db"}
                  onChange={(e) => setStyle("inputBorderColor", e.target.value)}
                  className="w-10 h-[38px] rounded-md border border-slate-200 cursor-pointer p-0.5 flex-shrink-0"
                />
                <input
                  type="text"
                  value={draft.style?.inputBorderColor || ""}
                  onChange={(e) => setStyle("inputBorderColor", e.target.value)}
                  placeholder="#d1d5db"
                  className="input flex-1"
                />
              </div>
            </div>

            {/* Label colour */}
            <div className="fg col-span-2 sm:col-span-1">
              <label className="fgl">Colore label</label>
              <div className="flex gap-2 items-center">
                <input
                  type="color"
                  value={draft.style?.labelColor || "#333333"}
                  onChange={(e) => setStyle("labelColor", e.target.value)}
                  className="w-10 h-[38px] rounded-md border border-slate-200 cursor-pointer p-0.5 flex-shrink-0"
                />
                <input
                  type="text"
                  value={draft.style?.labelColor || ""}
                  onChange={(e) => setStyle("labelColor", e.target.value)}
                  placeholder="#333333"
                  className="input flex-1"
                />
              </div>
            </div>
          </div>
        </Section>

        {/* ── Tracking GTM ── */}
        <Section title="Tracciamento GTM">
          <div className="space-y-5 pt-3">

            {/* Event name */}
            <div className="fg">
              <label className="fgl">Nome evento</label>
              <input
                value={draft.tracking?.eventName || ''}
                onChange={e => setTracking('eventName', e.target.value || undefined)}
                placeholder="submit_contact_form"
                className="input"
              />
              <span className="text-xs text-slate-400">
                Nome dell&apos;evento inviato al dataLayer GTM. Default:{' '}
                <code className="text-indigo-500">submit_contact_form</code>
              </span>
            </div>

            {/* Static params */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Parametri statici</p>
                <button
                  type="button"
                  onClick={() => {
                    const current = draft.tracking?.params || {};
                    const key = `param${Object.keys(current).length + 1}`;
                    setTracking('params', { ...current, [key]: '' });
                  }}
                  className="btn btn-secondary btn-sm"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
                  </svg>
                  Aggiungi
                </button>
              </div>
              <p className="text-xs text-slate-400 mb-3">
                Valori fissi aggiunti ad ogni evento GTM (es. <code className="text-indigo-500">formSector</code>, <code className="text-indigo-500">formProduct</code>).
              </p>
              {Object.keys(draft.tracking?.params || {}).length === 0 && (
                <p className="text-xs text-slate-400 italic">Nessun parametro statico configurato.</p>
              )}
              <div className="space-y-2">
                {Object.entries(draft.tracking?.params || {}).map(([k, v]) => (
                  <div key={k} className="flex items-center gap-2">
                    <input
                      value={k}
                      onChange={e => {
                        const newKey = e.target.value;
                        const current = { ...draft.tracking?.params };
                        delete current[k];
                        setTracking('params', { ...current, [newKey]: v });
                      }}
                      placeholder="chiave GTM"
                      className="input flex-1 font-mono text-sm"
                    />
                    <span className="text-slate-300 flex-shrink-0">→</span>
                    <input
                      value={v}
                      onChange={e => setTracking('params', { ...draft.tracking?.params, [k]: e.target.value })}
                      placeholder="valore"
                      className="input flex-1 text-sm"
                    />
                    <button
                      type="button"
                      onClick={() => {
                        const next = { ...draft.tracking?.params };
                        delete next[k];
                        setTracking('params', Object.keys(next).length ? next : undefined);
                      }}
                      className="text-slate-300 hover:text-red-400 transition-colors flex-shrink-0 p-1"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Dynamic fields */}
            {sortedFields.length > 0 && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Parametri dinamici</p>
                  {!draft.tracking?.fields && (
                    <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded">default</span>
                  )}
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Per ogni campo scegli le chiavi GTM per il valore in chiaro e/o hashato (SHA-256).
                </p>

                {/* header */}
                <div className="grid gap-2 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-t-lg border-b-0 text-[10px] font-semibold uppercase tracking-wider text-slate-400" style={{gridTemplateColumns:'38px 1fr 1fr 1fr'}}>
                  <span></span>
                  <span>Campo</span>
                  <span>Chiave plain</span>
                  <span>Chiave SHA-256</span>
                </div>

                <div className="border border-slate-200 rounded-b-lg overflow-hidden divide-y divide-slate-100">
                  {sortedFields.map(f => {
                    const ft = getFieldTracking(f);
                    const included = !!(ft.plainKey || ft.hashedKey);
                    return (
                      <div key={f.id} className={`grid items-center gap-2 px-3 py-2.5 hover:bg-slate-50 transition-colors ${!included ? 'opacity-50' : ''}`} style={{gridTemplateColumns:'38px 1fr 1fr 1fr'}}>
                        {/* include toggle */}
                        <Toggle
                          checked={included}
                          onChange={on => {
                            initFieldsIfNeeded();
                            const onValue: FieldTracking = on
                              ? (Object.keys(defaultFieldTracking(f)).length
                                  ? defaultFieldTracking(f)
                                  : { plainKey: autoGtmKey(f) })
                              : {};
                            setFieldTracking(f.name, onValue);
                          }}
                        />
                        {/* label */}
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px] flex-shrink-0">
                            {f.type}
                          </span>
                          <span className="text-xs text-slate-700 truncate">{f.label}</span>
                        </div>
                        {/* plain key */}
                        <input
                          value={ft.plainKey || ''}
                          disabled={!included}
                          onChange={e => { initFieldsIfNeeded(); setFieldTracking(f.name, { ...ft, plainKey: e.target.value || undefined }); }}
                          placeholder="— non inviare —"
                          className="input font-mono text-xs disabled:opacity-40 disabled:bg-slate-50"
                        />
                        {/* hashed key */}
                        <input
                          value={ft.hashedKey || ''}
                          disabled={!included || f.type === 'provincia'}
                          onChange={e => { initFieldsIfNeeded(); setFieldTracking(f.name, { ...ft, hashedKey: e.target.value || undefined }); }}
                          placeholder={f.type === 'provincia' ? '—' : '— non inviare —'}
                          className="input font-mono text-xs disabled:opacity-40 disabled:bg-slate-50"
                        />
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Payload preview */}
            {(sortedFields.length > 0 || Object.keys(draft.tracking?.params || {}).length > 0) && (
              <div>
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-2">Preview payload GTM</p>
                <div className="rounded-lg border border-slate-200 overflow-hidden text-sm">
                  <table className="w-full">
                    <thead>
                      <tr className="bg-slate-50 border-b border-slate-200">
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-1/2">Campo</th>
                        <th className="text-left px-3 py-2 text-xs font-semibold text-slate-500 w-1/2">Chiave GTM</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr className="bg-indigo-50/40">
                        <td className="px-3 py-2 text-xs text-slate-400 italic">—</td>
                        <td className="px-3 py-2 font-mono text-xs text-indigo-600">
                          event: &quot;{draft.tracking?.eventName || 'submit_contact_form'}&quot;
                        </td>
                      </tr>
                      {Object.entries(draft.tracking?.params || {}).map(([k, v]) => (
                        <tr key={'sp-' + k} className="bg-amber-50/40">
                          <td className="px-3 py-2 text-xs text-slate-500 flex items-center gap-1.5">
                            <span className="inline-block px-1.5 py-0.5 rounded bg-amber-100 text-amber-600 font-mono text-[10px]">statico</span>
                            {v || <span className="text-slate-300 italic">—</span>}
                          </td>
                          <td className="px-3 py-2 font-mono text-xs text-slate-700">{k || <span className="text-slate-300 italic">—</span>}</td>
                        </tr>
                      ))}
                      {sortedFields.map(f => {
                        const ft = getFieldTracking(f);
                        const rows: { key: string; note: string }[] = [];
                        if (ft.plainKey)  rows.push({ key: ft.plainKey,  note: 'plain' });
                        if (ft.hashedKey) rows.push({ key: ft.hashedKey, note: 'SHA-256' });
                        if (!rows.length) return null;
                        return rows.map((row, i) => (
                          <tr key={f.id + '-' + i} className="hover:bg-slate-50">
                            <td className="px-3 py-2 text-xs text-slate-600">
                              {i === 0 && (
                                <span className="flex items-center gap-1.5">
                                  <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-mono text-[10px]">{f.type}</span>
                                  {f.label}
                                </span>
                              )}
                            </td>
                            <td className="px-3 py-2 font-mono text-xs text-slate-700 flex items-center gap-1.5">
                              <code>{row.key}</code>
                              <span className={`text-[10px] px-1 py-0.5 rounded ${row.note === 'SHA-256' ? 'bg-violet-100 text-violet-600' : 'bg-slate-100 text-slate-400'}`}>{row.note}</span>
                            </td>
                          </tr>
                        ));
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </Section>

        {/* ── Step manager ── */}
        {draft.multiStep && (
          <Section
            title={`Steps (${steps.length})`}
            headerAction={
              <button
                onClick={handleAddStep}
                className="btn btn-secondary btn-sm"
              >
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  className="w-3 h-3"
                >
                  <line x1="12" y1="5" x2="12" y2="19" />
                  <line x1="5" y1="12" x2="19" y2="12" />
                </svg>
                Aggiungi step
              </button>
            }
          >
            <StepManager
              bare
              steps={steps}
              onAdd={handleAddStep}
              onUpdate={handleUpdateStep}
              onDelete={handleDeleteStep}
              onReorder={(s) => set("steps", s)}
            />
          </Section>
        )}

        {/* ── Field list ── */}
        <Section
          title={`Campi (${sortedFields.length})`}
          headerAction={
            <button
              onClick={() => {
                setEditFieldId(null);
                setFieldModalOpen(true);
              }}
              className="btn btn-primary btn-sm"
            >
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                className="w-3 h-3"
              >
                <line x1="12" y1="5" x2="12" y2="19" />
                <line x1="5" y1="12" x2="19" y2="12" />
              </svg>
              Aggiungi campo
            </button>
          }
        >
          <FieldList
            fields={sortedFields}
            steps={steps}
            multiStep={draft.multiStep || false}
            onReorder={handleReorder}
            onEdit={(id) => {
              setEditFieldId(id);
              setFieldModalOpen(true);
            }}
            onDelete={handleDeleteField}
          />
        </Section>
      </div>

      {/* ── Save bar ── */}
      <div className="flex justify-end mt-4">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary disabled:opacity-60"
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            className="w-4 h-4"
          >
            <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
            <polyline points="17 21 17 13 7 13 7 21" />
            <polyline points="7 3 7 8 15 8" />
          </svg>
          {saving ? "Salvataggio…" : "Salva configurazione"}
        </button>
      </div>

      {/* ── Field modal ── */}
      {fieldModalOpen && (
        <FieldModal
          field={editField}
          fields={sortedFields}
          steps={steps}
          multiStep={draft.multiStep || false}
          existingNames={existingNames}
          onSave={handleSaveField}
          onClose={() => {
            setFieldModalOpen(false);
            setEditFieldId(null);
          }}
        />
      )}
    </div>
  );
}
