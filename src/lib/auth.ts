// Edge-compatible auth utilities (no Node.js-only APIs)

export const COOKIE_NAME = 'lf_session';
export const LS_JWT_KEY  = 'lf_jwt';

/**
 * Decodes the payload of a JWT without verifying the signature.
 * Safe to use in the middleware because:
 *  1. The cookie is httpOnly – it cannot be modified from the browser.
 *  2. The real auth check happens on the backend for every API call.
 */
export function decodeJwt(token: string): Record<string, unknown> | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    // base64url → base64
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = b64 + '='.repeat((4 - (b64.length % 4)) % 4);
    return JSON.parse(atob(padded)) as Record<string, unknown>;
  } catch {
    return null;
  }
}

/** Returns true when the token is well-formed and not yet expired. */
export function isJwtValid(token: string): boolean {
  const payload = decodeJwt(token);
  if (!payload) return false;
  const exp = payload['exp'];
  if (typeof exp !== 'number') return false;
  return exp > Math.floor(Date.now() / 1000);
}

export interface JwtUser {
  sub: string;
  role?: 'admin' | 'user';
  email?: string;
}

/**
 * Reads the JWT from localStorage and returns the decoded user payload.
 * Returns null when not logged in or on the server (SSR).
 */
export function getCurrentUser(): JwtUser | null {
  if (typeof window === 'undefined') return null;
  const token = localStorage.getItem(LS_JWT_KEY);
  if (!token || !isJwtValid(token)) return null;
  const payload = decodeJwt(token);
  if (!payload || typeof payload['sub'] !== 'string') return null;
  return payload as unknown as JwtUser;
}
