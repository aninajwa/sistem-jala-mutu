import type { RequestHandler } from 'express';
import { ApiError } from '../services/supabase';
import type { Identity } from './auth';

/** Admin is read-only on workflow mutations, even when other roles are assigned. */
export function assertWorkflowWriteAllowed(identity: Pick<Identity, 'roles'>) {
  if (identity.roles.some(role => role.nama === 'admin')) {
    throw new ApiError(403, 'Admin hanya boleh membaca workflow');
  }
}

const READ_METHODS = new Set(['GET', 'HEAD', 'OPTIONS']);

/** Apply before route-specific role checks, body processing, upload, or RPC calls.
 * Reads pass through: sub-routers mount this with `router.use` and without a path, so it sees every
 * request that enters them, including GETs meant for later routers. Each read RPC checks access itself. */
export const denyAdminWorkflowWrites: RequestHandler = (req, res, next) => {
  if (READ_METHODS.has(req.method)) { next(); return; }
  try {
    assertWorkflowWriteAllowed(res.locals.identity);
    next();
  } catch (error) {
    next(error);
  }
};
