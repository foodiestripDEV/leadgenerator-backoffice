import { NextRequest, NextResponse } from 'next/server';
import { COOKIE_NAME } from '@/lib/auth';

export async function POST(req: NextRequest) {
  const { email, password } = await req.json();

  if (!email || !password) {
    return NextResponse.json({ error: 'Email e password richiesti' }, { status: 400 });
  }

  const backendUrl = (
    process.env.NEXT_PUBLIC_BACKEND_URL ?? "http://localhost:3000"
  ).replace(/\/$/, "");

  let backendRes: Response;
  try {
    backendRes = await fetch(`${backendUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      signal: AbortSignal.timeout(8000),
    });
  } catch {
    return NextResponse.json({ error: 'Backend non raggiungibile' }, { status: 502 });
  }

  const data = await backendRes.json() as { token?: string; user?: unknown; error?: string };

  if (!backendRes.ok || !data.token) {
    return NextResponse.json(
      { error: data.error ?? 'Credenziali non valide' },
      { status: backendRes.status },
    );
  }

  // Store the backend JWT in an httpOnly cookie so Next.js middleware can
  // check authentication without exposing the token to client-side scripts.
  const res = NextResponse.json({ ok: true, token: data.token, user: data.user });
  res.cookies.set(COOKIE_NAME, data.token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 3600,
    path: '/',
  });
  return res;
}
