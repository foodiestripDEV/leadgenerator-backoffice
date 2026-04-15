'use client';

import { createContext, useContext, useState, type ReactNode } from 'react';

interface UIContextValue {
  apiModalOpen: boolean;
  openApiModal: () => void;
  closeApiModal: () => void;
}

const UIContext = createContext<UIContextValue | null>(null);

export function UIProvider({ children }: { children: ReactNode }) {
  const [apiModalOpen, setApiModalOpen] = useState(false);

  return (
    <UIContext.Provider
      value={{
        apiModalOpen,
        openApiModal: () => setApiModalOpen(true),
        closeApiModal: () => setApiModalOpen(false),
      }}
    >
      {children}
    </UIContext.Provider>
  );
}

export function useUI() {
  const ctx = useContext(UIContext);
  if (!ctx) throw new Error('useUI must be inside UIProvider');
  return ctx;
}
