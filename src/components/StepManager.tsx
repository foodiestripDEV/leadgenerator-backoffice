'use client';

import { useRef, useState } from 'react';
import type { Step } from '@/lib/types';

interface Props {
  steps: Step[];
  onAdd: () => void;
  onUpdate: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  onReorder: (steps: Step[]) => void;
  /** When true, renders only the step list content (no card wrapper / no header). */
  bare?: boolean;
}

export default function StepManager({ steps, onAdd, onUpdate, onDelete, onReorder, bare }: Props) {
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [overIdx, setOverIdx] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);

  function handleDragStart(idx: number) {
    dragItem.current = idx;
    setDragIdx(idx);
  }

  function handleDrop(toIdx: number) {
    if (dragItem.current === null || dragItem.current === toIdx) return;
    const reordered = [...steps];
    const [moved] = reordered.splice(dragItem.current, 1);
    reordered.splice(toIdx, 0, moved);
    onReorder(reordered);
    setDragIdx(null);
    setOverIdx(null);
    dragItem.current = null;
  }

  const inner = (
    <>
      {steps.length === 0 && (
        <p className="text-center py-6 text-sm text-slate-400">
          Nessuno step. Aggiungine uno con il pulsante qui sopra.
        </p>
      )}

      <div className="flex flex-col gap-2">
        {steps.map((step, idx) => (
          <div
            key={step.id}
            draggable
            onDragStart={() => handleDragStart(idx)}
            onDragEnd={() => { setDragIdx(null); setOverIdx(null); }}
            onDragOver={e => { e.preventDefault(); setOverIdx(idx); }}
            onDragLeave={() => setOverIdx(null)}
            onDrop={() => handleDrop(idx)}
            className={`flex items-center gap-3 px-3 py-2.5 border-[1.5px] rounded-lg transition-all ${
              dragIdx === idx
                ? 'opacity-40 border-indigo-400'
                : overIdx === idx
                ? 'border-indigo-400 bg-violet-50 shadow-sm'
                : 'border-slate-200 bg-white hover:border-indigo-200'
            }`}
          >
            {/* step number badge */}
            <span className="w-6 h-6 flex items-center justify-center rounded-full bg-indigo-100 text-indigo-600 text-xs font-bold flex-shrink-0">
              {idx + 1}
            </span>

            {/* drag handle */}
            <span className="cursor-grab text-slate-400 flex-shrink-0" title="Trascina per riordinare">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <line x1="8" y1="6" x2="16" y2="6" /><line x1="8" y1="12" x2="16" y2="12" /><line x1="8" y1="18" x2="16" y2="18" />
              </svg>
            </span>

            {/* label input */}
            <input
              value={step.label}
              onChange={e => onUpdate(step.id, e.target.value)}
              className="flex-1 text-sm font-medium bg-transparent border-none outline-none focus:ring-0 placeholder:text-slate-400"
              placeholder="Nome dello step…"
            />

            {/* delete */}
            <button
              onClick={() => {
                if (!confirm(`Eliminare lo step "${step.label}"? I campi assegnati a questo step non saranno eliminati.`)) return;
                onDelete(step.id);
              }}
              className="p-1 rounded text-slate-400 hover:bg-red-50 hover:text-red-500 transition-colors flex-shrink-0"
              title="Elimina step"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                <polyline points="3 6 5 6 21 6" />
                <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                <path d="M10 11v6M14 11v6" />
                <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </>
  );

  if (bare) return inner;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-5 mt-4">
      <div className="flex items-center justify-between mb-4">
        <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
          Steps ({steps.length})
        </p>
        <button onClick={onAdd} className="btn btn-secondary btn-sm">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Aggiungi step
        </button>
      </div>
      {inner}
    </div>
  );
}
