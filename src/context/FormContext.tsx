'use client';

import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  type ReactNode,
} from 'react';
import type { FormConfig, Lead } from '@/lib/types';
import { fetchFormConfig, fetchFormLeads } from '@/lib/api';

interface FormContextValue {
  slug: string;
  config: FormConfig | null;
  leads: Lead[];
  reload: () => Promise<void>;
  setConfig: (cfg: FormConfig) => void;
  setLeads: (leads: Lead[]) => void;
}

const FormContext = createContext<FormContextValue | null>(null);

export function FormProvider({ slug, children }: { slug: string; children: ReactNode }) {
  const [config, setConfig] = useState<FormConfig | null>(null);
  const [leads, setLeads]   = useState<Lead[]>([]);

  const reload = useCallback(async () => {
    try {
      const [cfg, leds] = await Promise.all([
        fetchFormConfig(slug),
        fetchFormLeads(slug),
      ]);
      setConfig(cfg);
      setLeads(leds);
    } catch {
      // silently ignore – FormsContext.connected tracks overall backend status
    }
  }, [slug]);

  // Load (or reload) whenever slug changes
  useEffect(() => {
    setConfig(null);
    setLeads([]);
    reload();
  }, [reload]);   // reload identity changes whenever slug changes

  return (
    <FormContext.Provider value={{ slug, config, leads, reload, setConfig, setLeads }}>
      {children}
    </FormContext.Provider>
  );
}

export function useFormCtx() {
  const ctx = useContext(FormContext);
  if (!ctx) throw new Error('useFormCtx must be inside FormProvider');
  return ctx;
}
