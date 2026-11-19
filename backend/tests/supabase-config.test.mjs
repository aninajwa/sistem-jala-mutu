import test from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { once } from 'node:events';
import { fileURLToPath } from 'node:url';

const sandbox = 'https://yehwlrlbtcxtlogenahw.supabase.co';
const backendEntry = fileURLToPath(new URL('../dist/index.mjs', import.meta.url));

function launchBackend(extraEnv) {
  const env = { ...process.env, ...extraEnv, PORT: String(40000 + Math.floor(Math.random() * 20000)), LOG_LEVEL: 'info', NODE_ENV: 'production' };
  for (const [key, value] of Object.entries(env)) if (value === undefined) delete env[key];
  const child = spawn(process.execPath, [backendEntry], {
    cwd: fileURLToPath(new URL('..', import.meta.url)),
    env,
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.setEncoding('utf8').on('data', chunk => { output += chunk; });
  child.stderr.setEncoding('utf8').on('data', chunk => { output += chunk; });
  return { child, output: () => output };
}

async function expectStartupFailure(extraEnv, message, mustNotLog) {
  const { child, output } = launchBackend(extraEnv);
  const [code] = await once(child, 'exit');
  assert.equal(code, 1);
  assert.match(output(), message);
  assert.doesNotMatch(output(), /Server listening/);
  if (mustNotLog) assert.doesNotMatch(output(), new RegExp(mustNotLog));
}

async function expectStartupSuccess(extraEnv) {
  const { child, output } = launchBackend(extraEnv);
  try {
    const ready = await Promise.race([
      new Promise(resolve => {
        if (output().includes('Server listening')) { resolve(true); return; }
        const check = chunk => {
          if ((output() + chunk).includes('Server listening')) resolve(true);
        };
        child.stdout.on('data', check);
        child.stderr.on('data', check);
      }),
      once(child, 'exit').then(() => false),
      new Promise(resolve => {
        const timer = setTimeout(() => resolve(false), 5000);
        timer.unref();
      }),
    ]);
    assert.equal(ready, true, output());
  } finally {
    if (child.exitCode === null) {
      const exited = once(child, 'exit');
      child.kill();
      await exited.catch(() => {});
    }
  }
}

test('Admin Sandbox QA accepts the sandbox and rejects non-sandbox targets before listening', async () => {
  await expectStartupSuccess({ ADMIN_SANDBOX_QA: 'true', SUPABASE_URL: sandbox });
  for (const SUPABASE_URL of [
    'https://vnvknmwcidberkjwtqjx.supabase.co',
    'http://yehwlrlbtcxtlogenahw.supabase.co',
    `${sandbox}/rest/v1`,
    `${sandbox}/?redirect=elsewhere`,
    'https://user:password@yehwlrlbtcxtlogenahw.supabase.co',
  ]) {
    await expectStartupFailure(
      { ADMIN_SANDBOX_QA: 'true', SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY: 'test-key-must-not-appear-in-logs' },
      /only allows the Jala-Mutu-Admin-Sandbox Supabase project/,
      'test-key-must-not-appear-in-logs',
    );
  }
});

test('Admin Sandbox QA fails closed for missing URL or malformed mode', async () => {
  await expectStartupFailure({ ADMIN_SANDBOX_QA: 'true', SUPABASE_URL: '' }, /requires SUPABASE_URL/);
  await expectStartupFailure({ ADMIN_SANDBOX_QA: 'true', SUPABASE_URL: 'not a URL' }, /requires the exact/);
  await expectStartupFailure({ ADMIN_SANDBOX_QA: 'yes', SUPABASE_URL: sandbox }, /must be either/);
  await expectStartupFailure({ ADMIN_SANDBOX_QA: '', SUPABASE_URL: sandbox }, /must be either/);
});

test('production and other non-QA deployments retain their independent Supabase URL', async () => {
  await expectStartupSuccess({ ADMIN_SANDBOX_QA: undefined, SUPABASE_URL: 'https://production-project.supabase.co' });
  await expectStartupSuccess({ ADMIN_SANDBOX_QA: 'false', SUPABASE_URL: 'https://production-project.supabase.co' });
});
