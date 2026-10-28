export type AuthSessionLike = { user: { id: string } };

/**
 * A token refresh creates a new Session object for the same signed-in user.
 * Keep the existing React state reference so AuthGate does not unmount the app
 * and discard unsaved UI state merely because the browser regained focus.
 */
export function preserveSessionForSameUser<T extends AuthSessionLike>(current: T | null, next: T | null): T | null {
  if (!current || !next) return next;
  return current.user.id === next.user.id ? current : next;
}
