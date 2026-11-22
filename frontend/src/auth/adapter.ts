import type { WorkflowRole } from "../workflow/model";

/** Integration boundary only. No endpoint or client-side production identity is invented. */
export interface AuthSession {
  subject: string;
  role: WorkflowRole;
  entitlements: readonly string[];
}
export interface AuthAdapter {
  readonly available: boolean;
  signIn(credentials: {
    username: string;
    password: string;
  }): Promise<AuthSession>;
  signOut(): Promise<void>;
}
export const unavailableAuth: AuthAdapter = {
  available: false,
  async signIn() {
    throw new Error("Login belum tersedia pada lingkungan ini.");
  },
  async signOut() {
    /* No server session exists until a backend adapter is connected. */
  },
};
