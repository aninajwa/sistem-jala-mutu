import type { RequestHandler } from 'express';
import { ApiError } from '../services/supabase';
import type { Identity } from './auth';

/** Admin is read-only on workflow mutations, even when other roles are assigned. */
export function assertWorkflowWriteAllowed(identity: Pick<Identity, 'roles'>) {
  if (identity.roles.some(role => role.nama === 'admin')) {
    throw new ApiError(403, 'Admin hanya boleh membaca workflow');
  }
}

/** Apply before route-specific role checks, body processing, upload, or RPC calls. */
export const denyAdminWorkflowWrites: RequestHandler = (_req, res, next) => {
  try {
    assertWorkflowWriteAllowed(res.locals.identity);
    next();
  } catch (error) {
    next(error);
  }
};
