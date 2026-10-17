import type { RequestHandler } from 'express';
import { ApiError, supabaseRequest } from '../services/supabase';

export interface Identity {
  token: string;
  profile: { pengguna_id: number; auth_user_id: string; username: string; email: string; terkunci: boolean | null };
  assignments: Array<{ peran_id: number; scope_balai_id: number | null; scope_paket_id: number | null }>;
  roles: Array<{ peran_id: number; nama: string }>;
}

declare global { namespace Express { interface Locals { identity: Identity; } } }

export const requireAuth: RequestHandler = async (req, res, next) => {
  try {
    const match = /^Bearer ([^\s]+)$/i.exec(req.headers.authorization ?? '');
    if (!match) throw new ApiError(401, 'Login diperlukan');
    const token = match[1];
    const user = await supabaseRequest<{ id: string }>('/auth/v1/user', token);
    const profiles = await supabaseRequest<Identity['profile'][]>(
      `/rest/v1/pengguna?select=pengguna_id,auth_user_id,username,email,terkunci&auth_user_id=eq.${encodeURIComponent(user.id)}`, token);
    const profile = profiles[0];
    if (!profile || profile.terkunci || profile.auth_user_id !== user.id) throw new ApiError(403, 'Profil belum ditautkan atau akaun terkunci');
    const [assignments, roles] = await Promise.all([
      supabaseRequest<Identity['assignments']>('/rest/v1/pengguna_peran?select=peran_id,scope_balai_id,scope_paket_id', token),
      supabaseRequest<Identity['roles']>('/rest/v1/peran?select=peran_id,nama', token),
    ]);
    if (!roles.length) throw new ApiError(403, 'Peran belum ditetapkan');
    res.locals.identity = { token, profile, assignments, roles };
    next();
  } catch (error) { next(error); }
};
