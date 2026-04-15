'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  type ReactNode,
} from 'react';
import type { FormMeta } from '@/lib/types';
import {
  fetchForms,
  createForm as apiCreateForm,
  renameForm as apiRenameForm,
  deleteForm as apiDeleteForm,
} from '@/lib/api';

interface FormsContextValue {
  forms: FormMeta[];
  connected: boolean | null;
  reloadForms: () => Promise<void>;
  createForm: (name: string) => Promise<FormMeta | null>;
  renameForm: (slug: string, name: string) => Promise<boolean>;
  deleteForm: (slug: string) => Promise<boolean>;
}

const FormsContext = createContext<FormsContextValue | null>(null);

export function FormsProvider({ children }: { children: ReactNode }) {
  const [forms, setForms]         = useState<FormMeta[]>([]);
  const [connected, setConnected] = useState<boolean | null>(null);

  const reloadForms = useCallback(async () => {
    try {
      const data = await fetchForms();
      setForms(data);
      setConnected(true);
    } catch {
      setConnected(false);
    }
  }, []);

  const createForm = useCallback(async (name: string): Promise<FormMeta | null> => {
    try {
      const entry = await apiCreateForm(name);
      setForms(prev => [...prev, entry]);
      return entry;
    } catch {
      return null;
    }
  }, []);

  const renameForm = useCallback(async (slug: string, name: string): Promise<boolean> => {
    const ok = await apiRenameForm(slug, name);
    if (ok) setForms(prev => prev.map(f => f.slug === slug ? { ...f, name } : f));
    return ok;
  }, []);

  const deleteForm = useCallback(async (slug: string): Promise<boolean> => {
    const ok = await apiDeleteForm(slug);
    if (ok) setForms(prev => prev.filter(f => f.slug !== slug));
    return ok;
  }, []);

  return (
    <FormsContext.Provider value={{ forms, connected, reloadForms, createForm, renameForm, deleteForm }}>
      {children}
    </FormsContext.Provider>
  );
}

export function useFormsCtx() {
  const ctx = useContext(FormsContext);
  if (!ctx) throw new Error('useFormsCtx must be inside FormsProvider');
  return ctx;
}
