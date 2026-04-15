'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { LS_JWT_KEY } from '@/lib/auth';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [busy, setBusy]         = useState(false);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json() as { ok?: boolean; token?: string; error?: string };
      if (res.ok && data.token) {
        // Persist the JWT for client-side API calls (Authorization: Bearer)
        localStorage.setItem(LS_JWT_KEY, data.token);
        router.push('/');
        router.refresh();
      } else {
        setError(data.error ?? 'Errore di autenticazione');
      }
    } catch {
      setError('Impossibile contattare il server');
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8">
        {/* Logo */}
        <div className="mb-8 text-center">
          <div className="text-2xl font-extrabold text-indigo-600 tracking-tight">LeadForm</div>
          <div className="text-sm text-slate-500 mt-1">Accedi al backoffice</div>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="fg">
            <label className="fgl">Email</label>
            <input
              className="input"
              type="email"
              autoComplete="email"
              autoFocus
              value={email}
              onChange={e => setEmail(e.target.value)}
              disabled={busy}
              required
            />
          </div>

          <div className="fg">
            <label className="fgl">Password</label>
            <input
              className="input"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              disabled={busy}
              required
            />
          </div>

          {error && (
            <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={busy || !email || !password}
            className="btn btn-primary w-full justify-center mt-2 disabled:opacity-60"
          >
            {busy ? 'Accesso in corso…' : 'Accedi'}
          </button>
        </form>
      </div>
    </div>
  );
}
