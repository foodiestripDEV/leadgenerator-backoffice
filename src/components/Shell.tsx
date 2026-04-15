'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { FormsProvider, useFormsCtx } from '@/context/FormsContext';
import { ToastProvider } from '@/context/ToastContext';
import { UIProvider } from '@/context/UIContext';
import Sidebar from '@/components/Sidebar';
import ApiModal from '@/components/ApiModal';

function FormsInit({ children }: { children: React.ReactNode }) {
  const { reloadForms } = useFormsCtx();
  useEffect(() => {
    reloadForms();
  }, [reloadForms]);
  return <>{children}</>;
}

export default function Shell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  if (pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <FormsProvider>
      <ToastProvider>
        <UIProvider>
          <FormsInit>
            <div className="flex min-h-screen bg-slate-100 text-slate-900 font-sans">
              <Sidebar />
              <main className="ml-[230px] flex-1 p-8 min-h-screen">
                {children}
              </main>
            </div>
            <ApiModal />
          </FormsInit>
        </UIProvider>
      </ToastProvider>
    </FormsProvider>
  );
}
