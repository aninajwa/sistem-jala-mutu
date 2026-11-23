import type { RequestHandler } from 'express';
import { ApiError, supabaseRequest } from '../services/supabase';

export interface Identity {
  token: string;
  profile: { pengguna_id: number; auth_user_id: string; username: string; email: string; terkunci: boolean | null };
  assignments: Array<{ peran_id: number; scope_balai_id: number | null; scope_paket_id: number | null }>;
  roles: Array<{ peran_id: number; nama: string }>;
}

interface SelfIdentityRecord {
  pengguna_id: number;
  auth_user_id: string;
  username: string;
  terkunci: boolean | null;
  penugasan: Identity['assignments'];
  peran: Identity['roles'];
}

declare global { namespace Express { interface Locals { identity: Identity; } } }

/**
 * Short-lived per-token identity cache. One page load fires ~10 parallel API calls;
 * resolving identity for each cost two Supabase round trips and made pages slow.
 * Only accepted identities are cached, so a rejected token is re-checked every time.
 * Role or lock changes therefore take effect within IDENTITY_CACHE_MS.
 */
const IDENTITY_CACHE_MS = 15_000;
const IDENTITY_CACHE_MAX = 500;
const identityCache = new Map<string, { identity: Identity; expiresAt: number }>();

function cachedIdentity(token: string): Identity | undefined {
  const entry = identityCache.get(token);
  if (!entry) return undefined;
  if (entry.expiresAt <= Date.now()) { identityCache.delete(token); return undefined; }
  return entry.identity;
}

function rememberIdentity(identity: Identity) {
  if (identityCache.size >= IDENTITY_CACHE_MAX) identityCache.delete(identityCache.keys().next().value!);
  identityCache.set(identity.token, { identity, expiresAt: Date.now() + IDENTITY_CACHE_MS });
}

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? '');
    if (!match) throw new ApiError(401, 'Login diperlukan');
    const token = match[1];
    const cached = cachedIdentity(token);
    if (cached) { res.locals.identity = cached; next(); return; }
    // Both lookups only need the token; run them together.
    const [user, records] = await Promise.all([
      supabaseRequest<{ id: string; email?: string | null }>('/auth/v1/user', token),
      supabaseRequest<SelfIdentityRecord[]>(
        '/rest/v1/rpc/authenticated_identity_self', token, { method: 'POST', body: '{}' }),
    ]);
    const record = Array.isArray(records) ? records[0] : undefined;
    if (!record || record.terkunci || record.auth_user_id !== user.id) throw new ApiError(403, 'Profil belum ditautkan atau akaun terkunci');
    const profile: Identity['profile'] = {
      pengguna_id: record.pengguna_id,
      auth_user_id: record.auth_user_id,
      username: record.username,
      terkunci: record.terkunci,
      // Email remains owned and validated by Supabase Auth.
      email: user.email ?? '',
    };
    if (!Number.isSafeInteger(profile.pengguna_id) || profile.pengguna_id <= 0) throw new ApiError(403, 'Profil pengguna tidak sah');
    const assignments = Array.isArray(record.penugasan) ? record.penugasan : [];
    const roles = Array.isArray(record.peran) ? record.peran : [];
    if (!assignments.length || !roles.length) throw new ApiError(403, 'Peran belum ditetapkan');
    res.locals.identity = { token, profile, assignments, roles };
    rememberIdentity(res.locals.identity);
    next();
  } catch (error) { next(error); }
};
