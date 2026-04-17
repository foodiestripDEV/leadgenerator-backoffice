'use client';

import { useState, useEffect, useRef } from 'react';
import type { Field, FieldType, Step } from '@/lib/types';
import { PREFIXES } from '@/lib/prefixes';
import { slugify } from '@/lib/utils';
import { useToast } from '@/context/ToastContext';

interface Props {
  field: Field | null;
  fields: Field[];
  steps: Step[];
  multiStep: boolean;
  existingNames: string[];
  onSave: (field: Field) => void;
  onClose: () => void;
}

const FIELD_TYPES: { value: FieldType; label: string }[] = [
  { value: 'text',      label: 'Testo breve (text)' },
  { value: 'email',     label: 'Email' },
  { value: 'tel',       label: 'Telefono (tel)' },
  { value: 'number',    label: 'Numero' },
  { value: 'textarea',  label: 'Testo lungo (textarea)' },
  { value: 'select',    label: 'Menu a tendina (select)' },
  { value: 'checkbox',  label: 'Casella di spunta (checkbox)' },
  { value: 'provincia', label: 'Provincia italiana' },
  { value: 'comune',    label: 'Comune italiano (collegato a Provincia)' },
];

const WITH_PLACEHOLDER: FieldType[] = ['text', 'email', 'tel', 'number', 'textarea'];

export default function FieldModal({ field, fields, steps, multiStep, existingNames, onSave, onClose }: Props) {
  const toast = useToast();
  const labelRef = useRef<HTMLInputElement>(null);

  const isEdit = !!field;
  const [type, setType]               = useState<FieldType>(field?.type || 'text');
  const [label, setLabel]             = useState(field?.label || '');
  const [name, setName]               = useState(field?.name || '');
  const [placeholder, setPlaceholder] = useState(field?.placeholder || '');
  const [required, setRequired]       = useState(field?.required || false);
  const [options, setOptions]         = useState((field?.options || []).join('\n'));
  const [defaultPrefix, setDefaultPrefix] = useState(field?.defaultPrefix || '+39');
  const [noPrefix, setNoPrefix]           = useState(field?.noPrefix || false);
  const [stepId, setStepId]               = useState(field?.stepId || '');
  const [linkedProvincia, setLinkedProvincia] = useState(field?.linkedProvincia || '');
  const [autoName, setAutoName]           = useState(!isEdit);

  useEffect(() => {
    setTimeout(() => labelRef.current?.focus(), 50);
  }, []);

  function handleLabelChange(val: string) {
    setLabel(val);
    if (autoName) setName(slugify(val));
  }

  function handleNameChange(val: string) {
    setName(val);
    setAutoName(false);
  }

  function handleSave() {
    if (!label.trim()) { toast('Inserisci un\'etichetta', 'err'); return; }
    if (!name.trim())  { toast('Inserisci un nome campo', 'err'); return; }
    if (!/^[a-z0-9_]+$/.test(name)) {
      toast('Il nome deve contenere solo lettere minuscole, numeri e _', 'err');
      return;
    }
    if (existingNames.includes(name)) {
      toast('Esiste già un campo con questo nome', 'err');
      return;
    }

    if (type === 'comune' && !linkedProvincia) {
      toast('Seleziona il campo Provincia collegato', 'err');
      return;
    }

    const saved: Field = {
      id: field?.id || crypto.randomUUID(),
      type,
      label: label.trim(),
      name: name.trim(),
      placeholder: placeholder.trim(),
      required,
      options: type === 'select' ? options.split('\n').map(s => s.trim()).filter(Boolean) : [],
      order: field?.order ?? 999,
    };
    if (type === 'tel') {
      saved.defaultPrefix = defaultPrefix;
      if (noPrefix) saved.noPrefix = true;
    }
    if (type === 'comune') saved.linkedProvincia = linkedProvincia;
    if (multiStep && stepId) saved.stepId = stepId;

    onSave(saved);
  }

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[100]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl p-6 w-[500px] max-w-[calc(100vw-2rem)] max-h-[90vh] overflow-y-auto shadow-2xl">
        <p className="text-[1.05rem] font-bold mb-5">{isEdit ? 'Modifica campo' : 'Nuovo campo'}</p>

        <div className="flex flex-col gap-4">
          {/* Type */}
          <div className="fg">
            <label className="fgl">Tipo campo</label>
            <select value={type} onChange={e => setType(e.target.value as FieldType)} className="input">
              {FIELD_TYPES.map(ft => (
                <option key={ft.value} value={ft.value}>{ft.label}</option>
              ))}
            </select>
          </div>

          {/* Label + Name */}
          <div className="grid grid-cols-2 gap-3">
            <div className="fg">
              <label className="fgl">Etichetta <span className="text-red-500 font-normal normal-case tracking-normal">*</span></label>
              <input
                ref={labelRef}
                value={label}
                onChange={e => handleLabelChange(e.target.value)}
                placeholder="Es. Nome completo"
                className="input"
              />
            </div>
            <div className="fg">
              <label className="fgl">Nome campo (name) <span className="text-red-500 font-normal normal-case tracking-normal">*</span></label>
              <input
                value={name}
                onChange={e => handleNameChange(e.target.value)}
                placeholder="Es. nome_completo"
                className="input"
              />
            </div>
          </div>

          {/* Placeholder */}
          {WITH_PLACEHOLDER.includes(type) && (
            <div className="fg">
              <label className="fgl">Placeholder</label>
              <input
                value={placeholder}
                onChange={e => setPlaceholder(e.target.value)}
                placeholder="Es. Inserisci il tuo nome"
                className="input"
              />
            </div>
          )}

          {/* Tel options */}
          {type === 'tel' && (
            <>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-slate-800">Nascondi prefisso internazionale</span>
                <label className="relative w-[38px] h-[21px] cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={noPrefix}
                    onChange={e => setNoPrefix(e.target.checked)}
                  />
                  <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600" />
                  <span className="absolute top-[3px] left-[3px] w-[15px] h-[15px] rounded-full bg-white shadow transition peer-checked:translate-x-[17px]" />
                </label>
              </div>
              {!noPrefix && (
                <div className="fg">
                  <label className="fgl">Prefisso di default</label>
                  <select
                    value={defaultPrefix}
                    onChange={e => setDefaultPrefix(e.target.value)}
                    className="input"
                  >
                    {PREFIXES.map(([code, flag, country]) => (
                      <option key={code + country} value={code}>
                        {flag}\u00a0{code}\u00a0–\u00a0{country}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </>
          )}

          {/* Options (select only) */}
          {type === 'select' && (
            <div className="fg">
              <label className="fgl">Opzioni (una per riga)</label>
              <textarea
                value={options}
                onChange={e => setOptions(e.target.value)}
                placeholder={'Opzione 1\nOpzione 2\nLabel visibile|valore_salvato'}
                className="input resize-y min-h-[90px]"
              />
              <span className="text-xs text-slate-400 mt-1">
                Formato <code>Label|valore</code> per separare testo visualizzato e valore salvato. Senza <code>|</code> label e valore coincidono.
              </span>
            </div>
          )}

          {/* Linked provincia field (comune only) */}
          {type === 'comune' && (
            <div className="fg">
              <label className="fgl">
                Campo Provincia collegato <span className="text-red-500 font-normal normal-case tracking-normal">*</span>
              </label>
              {fields.filter(f => f.type === 'provincia' && f.id !== field?.id).length === 0 ? (
                <p className="text-xs text-amber-600 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                  Aggiungi prima un campo di tipo <strong>Provincia italiana</strong> al form.
                </p>
              ) : (
                <select
                  value={linkedProvincia}
                  onChange={e => setLinkedProvincia(e.target.value)}
                  className="input"
                >
                  <option value="">— Seleziona il campo provincia —</option>
                  {fields
                    .filter(f => f.type === 'provincia' && f.id !== field?.id)
                    .map(f => (
                      <option key={f.id} value={f.name}>{f.label} ({f.name})</option>
                    ))
                  }
                </select>
              )}
              <span className="text-xs text-slate-400 mt-1">
                Il menu comuni si aggiornerà automaticamente in base alla provincia selezionata.
              </span>
            </div>
          )}

          {/* Step assignment (multiStep only) */}
          {multiStep && steps.length > 0 && (
            <div className="fg">
              <label className="fgl">Step</label>
              <select
                value={stepId}
                onChange={e => setStepId(e.target.value)}
                className="input"
              >
                <option value="">— Nessuno step —</option>
                {steps.map(s => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
          )}

          <hr className="border-slate-200" />

          {/* Required toggle */}
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-slate-800">Campo obbligatorio</span>
            <label className="relative w-[38px] h-[21px] cursor-pointer flex-shrink-0">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={required}
                onChange={e => setRequired(e.target.checked)}
              />
              <span className="absolute inset-0 rounded-full bg-slate-300 transition peer-checked:bg-indigo-600" />
              <span className="absolute top-[3px] left-[3px] w-[15px] h-[15px] rounded-full bg-white shadow transition peer-checked:translate-x-[17px]" />
            </label>
          </div>
        </div>

        <div className="flex justify-end gap-2 pt-5 mt-5 border-t border-slate-200">
          <button onClick={onClose} className="btn btn-secondary">Annulla</button>
          <button onClick={handleSave} className="btn btn-primary">Salva campo</button>
        </div>
      </div>
    </div>
  );
}
