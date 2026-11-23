const ADMIN_SANDBOX_PROJECT_REF = 'yehwlrlbtcxtlogenahw';

/**
 * In the explicitly opted-in Admin QA mode, pin Supabase to the isolated
 * Admin Sandbox. Other deployments continue to use their configured URL.
 */
export function validateSupabaseConfiguration(env: NodeJS.ProcessEnv = process.env): void {
  const qaMode = env.ADMIN_SANDBOX_QA;
  if (qaMode !== undefined && qaMode !== 'true' && qaMode !== 'false') {
    throw new Error('ADMIN_SANDBOX_QA must be either "true" or "false"');
  }
  if (qaMode !== 'true') return;

  const configuredUrl = env.SUPABASE_URL;
  if (!configuredUrl) {
    throw new Error('Admin Sandbox QA requires SUPABASE_URL for project yehwlrlbtcxtlogenahw');
  }

  let parsed: URL;
  try {
    parsed = new URL(configuredUrl);
  } catch {
    throw new Error('Admin Sandbox QA requires the exact Jala-Mutu-Admin-Sandbox Supabase URL');
  }

  const expectedHost = `${ADMIN_SANDBOX_PROJECT_REF}.supabase.co`;
  if (parsed.protocol !== 'https:' || parsed.hostname !== expectedHost || parsed.port || parsed.pathname !== '/' || parsed.username || parsed.password || parsed.search || parsed.hash) {
    throw new Error('Admin Sandbox QA only allows the Jala-Mutu-Admin-Sandbox Supabase project');
  }
}
