import type { FormConfig, FormMeta, Lead, User, ExportTemplate } from './types';
import { LS_JWT_KEY } from './auth';

export const LS_KEY      = 'lf_api_base';
export const DEFAULT_API = 'http://localhost:3000';

export function getApiBase(): string {
  if (typeof window === 'undefined') return DEFAULT_API;
  return (localStorage.getItem(LS_KEY) || DEFAULT_API).replace(/\/$/, '');
}

export function setApiBase(url: string): void {
  localStorage.setItem(LS_KEY, url.replace(/\/$/, ''));
}

// ── Auth token helpers ─────────────────────────────────────────────────────────

function getToken(): string {
  if (typeof window === 'undefined') return '';
  return localStorage.getItem(LS_JWT_KEY) ?? '';
}

function authHeader(): Record<string, string> {
  const token = getToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Central fetch wrapper: attaches the JWT, merges Content-Type when needed,
 * and redirects to /login on 401 (expired or invalid token).
 */
async function apiFetch(url: string, init: RequestInit = {}): Promise<Response> {
  const res = await fetch(url, {
    ...init,
    headers: {
      ...authHeader(),
      ...(init.headers as Record<string, string> | undefined ?? {}),
    },
  });

  if (res.status === 401 && typeof window !== 'undefined') {
    localStorage.removeItem(LS_JWT_KEY);
    window.location.href = '/login';
  }

  return res;
}

// ── Forms registry ─────────────────────────────────────────────────────────────

export async function fetchForms(): Promise<FormMeta[]> {
  const r = await apiFetch(getApiBase() + '/api/forms');
  if (!r.ok) throw new Error('forms fetch failed');
  return r.json() as Promise<FormMeta[]>;
}

export async function createForm(name: string): Promise<FormMeta> {
  const r = await apiFetch(getApiBase() + '/api/forms', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  if (!r.ok) throw new Error('create form failed');
  return r.json() as Promise<FormMeta>;
}

export async function renameForm(slug: string, name: string): Promise<boolean> {
  const r = await apiFetch(getApiBase() + '/api/forms/' + slug, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name }),
  });
  return r.ok;
}

export async function deleteForm(slug: string): Promise<boolean> {
  const r = await apiFetch(getApiBase() + '/api/forms/' + slug, { method: 'DELETE' });
  return r.ok;
}

// ── Per-form config ────────────────────────────────────────────────────────────

export async function fetchFormConfig(slug: string): Promise<FormConfig> {
  const r = await apiFetch(getApiBase() + '/api/forms/' + slug + '/config');
  if (!r.ok) throw new Error('config fetch failed');
  return r.json() as Promise<FormConfig>;
}

export async function putFormConfig(slug: string, cfg: FormConfig): Promise<boolean> {
  const r = await apiFetch(getApiBase() + '/api/forms/' + slug + '/config', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(cfg),
  });
  return r.ok;
}

// ── Per-form leads ─────────────────────────────────────────────────────────────

export async function fetchFormLeads(slug: string): Promise<Lead[]> {
  const r = await apiFetch(getApiBase() + '/api/forms/' + slug + '/leads');
  if (!r.ok) throw new Error('leads fetch failed');
  return r.json() as Promise<Lead[]>;
}

export async function deleteFormLead(slug: string, id: string): Promise<boolean> {
  const r = await apiFetch(getApiBase() + '/api/forms/' + slug + '/leads/' + id, { method: 'DELETE' });
  return r.ok;
}

// ── Users (admin only) ────────────────────────────────────────────────────────

export async function fetchUsers(): Promise<User[]> {
  const r = await apiFetch(getApiBase() + '/api/users');
  if (!r.ok) throw new Error('users fetch failed');
  return r.json() as Promise<User[]>;
}

export async function createUser(data: { email: string; password: string; name?: string; role?: string }): Promise<User> {
  const r = await apiFetch(getApiBase() + '/api/users', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const err = await r.json() as { error?: string };
    throw new Error(err.error ?? 'create user failed');
  }
  return r.json() as Promise<User>;
}

export async function updateUser(id: string, data: { name?: string; role?: string; password?: string }): Promise<User> {
  const r = await apiFetch(getApiBase() + '/api/users/' + id, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  if (!r.ok) {
    const err = await r.json() as { error?: string };
    throw new Error(err.error ?? 'update user failed');
  }
  return r.json() as Promise<User>;
}

export async function deleteUser(id: string): Promise<boolean> {
  const r = await apiFetch(getApiBase() + '/api/users/' + id, { method: 'DELETE' });
  return r.ok;
}

// ── Export template ────────────────────────────────────────────────────────────

export async function fetchExportTemplate(): Promise<ExportTemplate> {
  const r = await apiFetch(getApiBase() + '/api/export/template');
  if (!r.ok) throw new Error('export template fetch failed');
  return r.json() as Promise<ExportTemplate>;
}

export async function putExportTemplate(tmpl: ExportTemplate): Promise<boolean> {
  const r = await apiFetch(getApiBase() + '/api/export/template', {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(tmpl),
  });
  return r.ok;
}

export async function downloadExport(from?: string, to?: string): Promise<Blob> {
  const params = new URLSearchParams();
  if (from) params.set('from', from);
  if (to)   params.set('to', to);
  const r = await apiFetch(getApiBase() + '/api/export?' + params.toString());
  if (!r.ok) {
    const err = await r.json().catch(() => ({})) as { error?: string };
    throw new Error(err.error ?? 'export failed');
  }
  return r.blob();
}

// ── Legacy (kept for ApiModal test-connection) ─────────────────────────────────

export async function fetchConfig(): Promise<FormConfig> {
  const r = await apiFetch(getApiBase() + '/api/forms/default/config');
  if (!r.ok) throw new Error('config fetch failed');
  return r.json() as Promise<FormConfig>;
}
