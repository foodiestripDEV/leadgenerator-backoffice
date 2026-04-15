'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useFormsCtx } from '@/context/FormsContext';
import { useUI } from '@/context/UIContext';
import { useToast } from '@/context/ToastContext';
import { getApiBase } from '@/lib/api';
import { getCurrentUser } from '@/lib/auth';
import { useEffect, useState, useCallback } from 'react';

/* ── icons ─────────────────────────────────────────────────────────────────── */
const IconGrid = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[17px] h-[17px]">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);
const IconEdit = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]">
    <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
  </svg>
);
const IconUsers = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]">
    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
  </svg>
);
const IconDash = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]">
    <rect x="3" y="3" width="18" height="4" rx="1" />
    <rect x="3" y="10" width="8" height="11" rx="1" />
    <rect x="14" y="10" width="7" height="11" rx="1" />
  </svg>
);
const IconPlus = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3.5 h-3.5">
    <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
  </svg>
);
const IconLogout = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[14px] h-[14px]">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <polyline points="16 17 21 12 16 7" />
    <line x1="21" y1="12" x2="9" y2="12" />
  </svg>
);
const IconExport = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[15px] h-[15px]">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
    <polyline points="7 10 12 15 17 10" />
    <line x1="12" y1="15" x2="12" y2="3" />
  </svg>
);

/* ── New Form Modal ─────────────────────────────────────────────────────────── */
function NewFormModal({ onClose }: { onClose: () => void }) {
  const { createForm } = useFormsCtx();
  const toast  = useToast();
  const router = useRouter();
  const [name, setName] = useState('');
  const [busy, setBusy] = useState(false);

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed) return;
    setBusy(true);
    const entry = await createForm(trimmed);
    setBusy(false);
    if (entry) {
      toast('Form creato!', 'ok');
      onClose();
      router.push('/forms/' + entry.slug);
    } else {
      toast('Errore nella creazione', 'err');
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[200]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl p-6 w-[340px] max-w-[calc(100vw-2rem)] shadow-2xl">
        <p className="text-[1.05rem] font-bold mb-4">Nuovo form</p>
        <div className="fg mb-5">
          <label className="fgl">Nome del form</label>
          <input
            autoFocus
            className="input"
            placeholder="Es. Contatti, Newsletter…"
            value={name}
            onChange={e => setName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') handleCreate();
              if (e.key === 'Escape') onClose();
            }}
          />
        </div>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary">Annulla</button>
          <button
            onClick={handleCreate}
            disabled={busy || !name.trim()}
            className="btn btn-primary disabled:opacity-60"
          >
            {busy ? 'Creazione…' : 'Crea form'}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Sidebar ────────────────────────────────────────────────────────────────── */
export default function Sidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { forms, connected } = useFormsCtx();
  const { openApiModal } = useUI();
  const [apiBase, setApiBase]         = useState('');
  const [newFormOpen, setNewFormOpen] = useState(false);
  const [loggingOut, setLoggingOut]   = useState(false);
  const [isAdmin, setIsAdmin]         = useState(false);

  useEffect(() => {
    setApiBase(getApiBase());
    setIsAdmin(getCurrentUser()?.role === 'admin');
  }, []);

  const handleLogout = useCallback(async () => {
    setLoggingOut(true);
    await fetch('/api/auth/logout', { method: 'POST' });
    router.push('/login');
  }, [router]);

  // Active slug extracted from /forms/[slug]/...
  const slugMatch  = pathname.match(/^\/forms\/([^/]+)/);
  const activeSlug = slugMatch ? slugMatch[1] : null;

  const dotColor =
    connected === true  ? 'bg-green-600' :
    connected === false ? 'bg-red-500'   : 'bg-slate-300';

  const rootLinkCls = (active: boolean) =>
    `flex items-center gap-2.5 px-4 py-2.5 text-sm font-medium transition-all ${
      active
        ? 'bg-violet-100 text-indigo-600 font-semibold'
        : 'text-slate-500 hover:bg-slate-100 hover:text-slate-900'
    }`;

  const subLinkCls = (active: boolean) =>
    `flex items-center gap-2 pl-9 pr-4 py-1.5 text-[.8rem] font-medium transition-all ${
      active
        ? 'text-indigo-600 font-semibold'
        : 'text-slate-400 hover:text-slate-700'
    }`;

  return (
    <>
      <nav className="w-[230px] bg-white border-r border-slate-200 flex flex-col fixed top-0 left-0 h-screen z-10">
        {/* Logo */}
        <div className="px-4 py-5 border-b border-slate-200 flex-shrink-0">
          <div className="text-[1.1rem] font-extrabold text-indigo-600 tracking-tight">LeadForm</div>
          <div className="text-xs text-slate-500 mt-0.5">Backoffice</div>
        </div>

        {/* Nav body */}
        <div className="flex-1 overflow-y-auto py-2">

          {/* Home: forms list */}
          <Link href="/" className={rootLinkCls(pathname === '/')}>
            <IconGrid />
            I miei form
          </Link>

          {/* Export template */}
          <Link href="/export" className={rootLinkCls(pathname === '/export')}>
            <IconExport />
            Export
          </Link>

          {/* Users (admin only) */}
          {isAdmin && (
            <Link href="/users" className={rootLinkCls(pathname === '/users')}>
              <IconUsers />
              Utenti
            </Link>
          )}

          {/* Per-form section */}
          {forms.length > 0 && (
            <div className="px-4 pt-3 pb-1">
              <span className="text-[.68rem] font-bold uppercase tracking-wider text-slate-400">Form</span>
            </div>
          )}

          {forms.map(form => {
            const isActive = activeSlug === form.slug;
            const base = '/forms/' + form.slug;
            return (
              <div key={form.slug}>
                {/* Form name link */}
                <Link
                  href={base}
                  className={`flex items-center gap-2.5 px-4 py-2 text-sm transition-all ${
                    isActive
                      ? 'text-indigo-600 font-semibold bg-violet-50'
                      : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 flex-shrink-0" />
                  <span className="truncate flex-1">{form.name}</span>
                </Link>

                {/* Sub-links shown only for the active form */}
                {isActive && (
                  <div className="mb-1">
                    <Link href={base} className={subLinkCls(pathname === base)}>
                      <IconDash />Panoramica
                    </Link>
                    <Link href={`${base}/builder`} className={subLinkCls(pathname === `${base}/builder`)}>
                      <IconEdit />Builder
                    </Link>
                    <Link href={`${base}/leads`} className={subLinkCls(pathname === `${base}/leads`)}>
                      <IconUsers />Lead
                      {form.leadCount > 0 && (
                        <span className="ml-auto text-[.68rem] bg-indigo-100 text-indigo-700 rounded-full px-1.5 py-0.5 font-bold">
                          {form.leadCount}
                        </span>
                      )}
                    </Link>
                  </div>
                )}
              </div>
            );
          })}

          {/* New form button */}
          <div className="px-3 pt-2">
            <button
              onClick={() => setNewFormOpen(true)}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-semibold text-slate-500 border border-dashed border-slate-300 rounded-lg hover:border-indigo-400 hover:text-indigo-600 transition-colors"
            >
              <IconPlus />
              Nuovo form
            </button>
          </div>
        </div>

        {/* Bottom: Logout */}
        <div className="px-3 py-2 border-t border-slate-200 flex-shrink-0">
          <button
            onClick={handleLogout}
            disabled={loggingOut}
            className="w-full flex items-center gap-2 px-3 py-1.5 text-xs font-medium text-slate-500 rounded-md hover:bg-slate-100 hover:text-red-600 transition-colors disabled:opacity-50"
          >
            <IconLogout />
            {loggingOut ? 'Uscita…' : 'Esci'}
          </button>
        </div>

        {/* Bottom: API status */}
        <div className="px-3 py-3 border-t border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <span className={`w-[7px] h-[7px] rounded-full flex-shrink-0 transition-colors ${dotColor}`} />
            <span
              className="text-[.72rem] text-slate-500 flex-1 overflow-hidden text-ellipsis whitespace-nowrap"
              title={apiBase}
            >
              {apiBase.replace(/^https?:\/\//, '')}
            </span>
            <button
              onClick={openApiModal}
              title="Configura URL backend"
              className="p-1 rounded text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
            >
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-[14px] h-[14px]">
                <circle cx="12" cy="12" r="3" />
                <path d="M19.07 4.93a10 10 0 0 1 0 14.14M4.93 4.93a10 10 0 0 0 0 14.14" />
                <path d="M12 2v2M12 20v2M2 12h2M20 12h2" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {newFormOpen && <NewFormModal onClose={() => setNewFormOpen(false)} />}
    </>
  );
}
