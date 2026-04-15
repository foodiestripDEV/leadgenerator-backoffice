'use client';

import { useState, useRef } from 'react';
import type { Field, Step } from '@/lib/types';

interface Props {
  fields: Field[];
  steps: Step[];
  multiStep: boolean;
  onReorder: (fields: Field[]) => void;
  onEdit: (id: string) => void;
  onDelete: (id: string) => void;
}

function FieldItem({
  field,
  idx,
  steps,
  multiStep,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragging,
  isOver,
}: {
  field: Field;
  idx: number;
  steps: Step[];
  multiStep: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onDragStart: () => void;
  onDragOver: (e: React.DragEvent) => void;
  onDrop: () => void;
  onDragEnd: () => void;
  isDragging: boolean;
  isOver: boolean;
}) {
  const stepLabel = multiStep && field.stepId
    ? steps.find(s => s.id === field.stepId)?.label
    : null;

  return (
    <div
      draggable
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragOver={onDragOver}
      onDrop={onDrop}
      className={`flex items-center gap-3 px-4 py-3 border-[1.5px] rounded-lg transition-all ${
        isDragging
          ? 'opacity-40 border-indigo-400'
          : isOver
          ? 'border-indigo-400 bg-violet-50 shadow-sm'
          : 'border-slate-200 bg-white hover:border-indigo-200'
      }`}
    >
      {/* drag handle */}
      <span className="cursor-grab text-slate-400 flex-shrink-0" title="Trascina per riordinare">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
          <line x1="8" y1="6" x2="16" y2="6" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="8" y1="18" x2="16" y2="18" />
        </svg>
      </span>

      {/* info */}
      <div className="flex-1 min-w-0 overflow-hidden">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="inline-block px-1.5 py-0.5 rounded bg-violet-100 text-indigo-600 text-[.68rem] font-bold uppercase tracking-wider">
            {field.type}
          </span>
          {field.required && (
            <span className="inline-block px-1.5 py-0.5 rounded bg-red-50 text-red-500 text-[.68rem] font-bold uppercase tracking-wider">
              obbligatorio
            </span>
          )}
          {stepLabel && (
            <span className="inline-block px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 text-[.68rem] font-bold uppercase tracking-wider">
              {stepLabel}
            </span>
          )}
          <span className="text-sm font-semibold text-slate-900 truncate">{field.label}</span>
        </div>
        <div className="text-xs text-slate-500 mt-0.5 truncate">
          name: <code>{field.name}</code>
          {field.placeholder && ` · "${field.placeholder}"`}
          {field.type === 'tel' && ` · prefisso: ${field.defaultPrefix || '+39'}`}
          {field.type === 'select' && field.options?.length ? ` · ${field.options.length} opzioni` : ''}
        </div>
      </div>

      {/* actions */}
      <div className="flex gap-1 flex-shrink-0">
        <button
          onClick={onEdit}
          title="Modifica"
          className="p-1.5 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" />
          </svg>
        </button>
        <button
          onClick={onDelete}
          title="Elimina"
          className="p-1.5 rounded text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]">
            <polyline points="3 6 5 6 21 6" />
            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
            <path d="M10 11v6M14 11v6" />
            <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
          </svg>
        </button>
      </div>
    </div>
  );
}

export default function FieldList({ fields, steps, multiStep, onReorder, onEdit, onDelete }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragRef = useRef<number | null>(null);

  function handleDrop(toIdx: number) {
    if (dragRef.current === null || dragRef.current === toIdx) return;
    const reordered = [...fields];
    const [moved] = reordered.splice(dragRef.current, 1);
    reordered.splice(toIdx, 0, moved);
    onReorder(reordered.map((f, i) => ({ ...f, order: i })));
    setDragIdx(null);
    setOverIdx(null);
    dragRef.current = null;
  }

  if (!fields.length) {
    return (
      <div className="text-center py-8 text-sm text-slate-400">
        Nessun campo. Aggiungine uno con il pulsante qui sopra.
      </div>
    );
  }

  // When multiStep, render fields grouped by step
  if (multiStep && steps.length > 0) {
    return (
      <div className="flex flex-col gap-4">
        {steps.map(step => {
          const stepFields = fields.filter(f => f.stepId === step.id);
          const unassigned = fields.filter(f => !f.stepId);
          const globalIdx = (f: Field) => fields.indexOf(f);
          return (
            <div key={step.id}>
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
                {step.label}
              </p>
              <div className="flex flex-col gap-2">
                {stepFields.length === 0 && (
                  <p className="text-xs text-slate-300 px-4 py-2 border border-dashed border-slate-200 rounded-lg">
                    Nessun campo assegnato a questo step
                  </p>
                )}
                {stepFields.map(field => {
                  const idx = globalIdx(field);
                  return (
                    <FieldItem
                      key={field.id}
                      field={field}
                      idx={idx}
                      steps={steps}
                      multiStep={multiStep}
                      onEdit={() => onEdit(field.id)}
                      onDelete={() => { if (confirm('Eliminare questo campo?')) onDelete(field.id); }}
                      onDragStart={() => { dragRef.current = idx; setDragIdx(idx); }}
                      onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                      onDragOver={e => { e.preventDefault(); setOverIdx(idx); }}
                      onDrop={() => handleDrop(idx)}
                      isDragging={dragIdx === idx}
                      isOver={overIdx === idx}
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
        {/* Unassigned fields */}
        {fields.filter(f => !f.stepId).length > 0 && (
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 px-1">
              Senza step
            </p>
            <div className="flex flex-col gap-2">
              {fields.filter(f => !f.stepId).map(field => {
                const idx = fields.indexOf(field);
                return (
                  <FieldItem
                    key={field.id}
                    field={field}
                    idx={idx}
                    steps={steps}
                    multiStep={multiStep}
                    onEdit={() => onEdit(field.id)}
                    onDelete={() => { if (confirm('Eliminare questo campo?')) onDelete(field.id); }}
                    onDragStart={() => { dragRef.current = idx; setDragIdx(idx); }}
                    onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
                    onDragOver={e => { e.preventDefault(); setOverIdx(idx); }}
                    onDrop={() => handleDrop(idx)}
                    isDragging={dragIdx === idx}
                    isOver={overIdx === idx}
                  />
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Flat list (no multiStep)
  return (
    <div className="flex flex-col gap-2">
      {fields.map((field, idx) => (
        <FieldItem
          key={field.id}
          field={field}
          idx={idx}
          steps={steps}
          multiStep={multiStep}
          onEdit={() => onEdit(field.id)}
          onDelete={() => { if (confirm('Eliminare questo campo?')) onDelete(field.id); }}
          onDragStart={() => { dragRef.current = idx; setDragIdx(idx); }}
          onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
          onDragOver={e => { e.preventDefault(); setOverIdx(idx); }}
          onDrop={() => handleDrop(idx)}
          isDragging={dragIdx === idx}
          isOver={overIdx === idx}
        />
      ))}
    </div>
  );
}
