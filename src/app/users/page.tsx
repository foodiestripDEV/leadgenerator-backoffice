'use client';

import { useState, useEffect, useCallback, FormEvent } from 'react';
import { useToast } from '@/context/ToastContext';
import { fetchUsers, createUser, updateUser, deleteUser } from '@/lib/api';
import { fmtDate } from '@/lib/utils';
import type { User } from '@/lib/types';

// ── Role badge ────────────────────────────────────────────────────────────────
function RoleBadge({ role }: { role: User['role'] }) {
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[.7rem] font-bold ${
      role === 'admin'
        ? 'bg-violet-100 text-violet-700'
        : 'bg-slate-100 text-slate-600'
    }`}>
      {role}
    </span>
  );
}

// ── User form used by both Create and Edit modals ─────────────────────────────
interface UserFormState {
  email: string;
  name: string;
  role: 'admin' | 'user';
  password: string;
}

// ── Create modal ──────────────────────────────────────────────────────────────
function CreateModal({ onClose, onCreated }: { onClose: () => void; onCreated: (u: User) => void }) {
  const toast = useToast();
  const [form, setForm]   = useState<UserFormState>({ email: '', name: '', role: 'user', password: '' });
  const [busy, setBusy]   = useState(false);
  const [error, setError] = useState('');

  const set = (k: keyof UserFormState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setForm(prev => ({ ...prev, [k]: e.target.value }));

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const user = await createUser({ email: form.email, password: form.password, name: form.name, role: form.role });
      toast('Utente creato!', 'ok');
      onCreated(user);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[200]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl p-6 w-[400px] max-w-[calc(100vw-2rem)] shadow-2xl">
        <p className="text-[1.05rem] font-bold mb-5">Nuovo utente</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="fg">
            <label className="fgl">Email *</label>
            <input className="input" type="email" value={form.email} onChange={set('email')} required autoFocus />
          </div>
          <div className="fg">
            <label className="fgl">Nome</label>
            <input className="input" type="text" value={form.name} onChange={set('name')} />
          </div>
          <div className="fg">
            <label className="fgl">Password *</label>
            <input className="input" type="password" value={form.password} onChange={set('password')} required minLength={8} />
            <span className="text-[.72rem] text-slate-400">Minimo 8 caratteri</span>
          </div>
          <div className="fg">
            <label className="fgl">Ruolo</label>
            <select className="input" value={form.role} onChange={set('role')}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-secondary">Annulla</button>
            <button type="submit" disabled={busy} className="btn btn-primary disabled:opacity-60">
              {busy ? 'Creazione…' : 'Crea utente'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Edit modal ────────────────────────────────────────────────────────────────
function EditModal({ user, onClose, onUpdated }: { user: User; onClose: () => void; onUpdated: (u: User) => void }) {
  const toast = useToast();
  const [name, setName]       = useState(user.name);
  const [role, setRole]       = useState<'admin' | 'user'>(user.role);
  const [password, setPassword] = useState('');
  const [busy, setBusy]       = useState(false);
  const [error, setError]     = useState('');

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      const payload: { name: string; role: string; password?: string } = { name, role };
      if (password) payload.password = password;
      const updated = await updateUser(user.id, payload);
      toast('Utente aggiornato!', 'ok');
      onUpdated(updated);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Errore sconosciuto');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[200]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl p-6 w-[400px] max-w-[calc(100vw-2rem)] shadow-2xl">
        <p className="text-[1.05rem] font-bold mb-1">Modifica utente</p>
        <p className="text-xs text-slate-400 mb-5">{user.email}</p>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="fg">
            <label className="fgl">Nome</label>
            <input className="input" type="text" value={name} onChange={e => setName(e.target.value)} autoFocus />
          </div>
          <div className="fg">
            <label className="fgl">Ruolo</label>
            <select className="input" value={role} onChange={e => setRole(e.target.value as 'admin' | 'user')}>
              <option value="user">user</option>
              <option value="admin">admin</option>
            </select>
          </div>
          <div className="fg">
            <label className="fgl">Nuova password</label>
            <input
              className="input"
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Lascia vuoto per non cambiare"
              minLength={8}
            />
            {password && password.length < 8 && (
              <span className="text-[.72rem] text-red-500">Minimo 8 caratteri</span>
            )}
          </div>
          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded px-3 py-2">{error}</p>
          )}
          <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
            <button type="button" onClick={onClose} className="btn btn-secondary">Annulla</button>
            <button
              type="submit"
              disabled={busy || (!!password && password.length < 8)}
              className="btn btn-primary disabled:opacity-60"
            >
              {busy ? 'Salvataggio…' : 'Salva'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Delete confirm modal ──────────────────────────────────────────────────────
function DeleteModal({ user, onClose, onDeleted }: { user: User; onClose: () => void; onDeleted: () => void }) {
  const toast = useToast();
  const [busy, setBusy] = useState(false);

  async function handleDelete() {
    setBusy(true);
    const ok = await deleteUser(user.id);
    setBusy(false);
    if (ok) { toast('Utente eliminato', 'ok'); onDeleted(); }
    else    { toast('Errore nella eliminazione', 'err'); onClose(); }
  }

  return (
    <div
      className="fixed inset-0 bg-black/45 flex items-center justify-center z-[200]"
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-xl p-6 w-[360px] max-w-[calc(100vw-2rem)] shadow-2xl">
        <p className="text-[1.05rem] font-bold mb-2">Elimina utente</p>
        <p className="text-sm text-slate-600 mb-6">
          Sei sicuro di voler eliminare <span className="font-semibold">{user.email}</span>?
          Questa azione è irreversibile.
        </p>
        <div className="flex justify-end gap-2">
          <button onClick={onClose} className="btn btn-secondary">Annulla</button>
          <button onClick={handleDelete} disabled={busy} className="btn btn-danger disabled:opacity-60">
            {busy ? 'Eliminazione…' : 'Elimina'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers]   = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal]   = useState<
    | { type: 'create' }
    | { type: 'edit';   user: User }
    | { type: 'delete'; user: User }
    | null
  >(null);

  const reload = useCallback(async () => {
    setLoading(true);
    try {
      setUsers(await fetchUsers());
    } catch {
      toast('Errore nel caricamento utenti', 'err');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { void reload(); }, [reload]);

  return (
    <div>
      {/* Header */}
      <div className="mb-7 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Utenti</h1>
          <p className="text-sm text-slate-500 mt-1">Gestisci gli account con accesso al backoffice</p>
        </div>
        <button onClick={() => setModal({ type: 'create' })} className="btn btn-primary">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
            <line x1="12" y1="5" x2="12" y2="19" /><line x1="5" y1="12" x2="19" y2="12" />
          </svg>
          Nuovo utente
        </button>
      </div>

      {/* Table */}
      <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
        {loading ? (
          <div className="py-16 text-center text-slate-400 text-sm">Caricamento…</div>
        ) : users.length === 0 ? (
          <div className="py-16 text-center text-slate-400 text-sm">Nessun utente trovato</div>
        ) : (
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-slate-100 bg-slate-50 text-left">
                <th className="px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Nome</th>
                <th className="px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Email</th>
                <th className="px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Ruolo</th>
                <th className="px-5 py-3 font-semibold text-slate-600 text-xs uppercase tracking-wide">Creato</th>
                <th className="px-5 py-3" />
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-full bg-indigo-100 text-indigo-700 flex items-center justify-center text-xs font-bold flex-shrink-0">
                        {(user.name || user.email).charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium text-slate-900">{user.name || '—'}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5 text-slate-600">{user.email}</td>
                  <td className="px-5 py-3.5">
                    <RoleBadge role={user.role} />
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 text-xs">{fmtDate(user.createdAt).split(',')[0]}</td>
                  <td className="px-5 py-3.5">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => setModal({ type: 'edit', user })}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                        title="Modifica"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <path d="M12 20h9" /><path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => setModal({ type: 'delete', user })}
                        className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                        title="Elimina"
                      >
                        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                          <polyline points="3 6 5 6 21 6" /><path d="M19 6l-1 14H6L5 6" />
                          <path d="M10 11v6M14 11v6" /><path d="M9 6V4h6v2" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Modals */}
      {modal?.type === 'create' && (
        <CreateModal
          onClose={() => setModal(null)}
          onCreated={user => { setUsers(prev => [...prev, user]); setModal(null); }}
        />
      )}
      {modal?.type === 'edit' && (
        <EditModal
          user={modal.user}
          onClose={() => setModal(null)}
          onUpdated={updated => { setUsers(prev => prev.map(u => u.id === updated.id ? updated : u)); setModal(null); }}
        />
      )}
      {modal?.type === 'delete' && (
        <DeleteModal
          user={modal.user}
          onClose={() => setModal(null)}
          onDeleted={() => { setUsers(prev => prev.filter(u => u.id !== modal.user.id)); setModal(null); }}
        />
      )}
    </div>
  );
}
