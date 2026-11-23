# Admin Hak Akses sandbox identity setup

This procedure is for the isolated sandbox project `yehwlrlbtcxtlogenahw` only. Do not use production accounts, JWTs, keys, or project URLs. No accounts or database changes have been made as part of preparing this procedure.

## 1. Confirm the synthetic profile records

In the Supabase Dashboard, first verify the project reference in the URL is `yehwlrlbtcxtlogenahw`. Use the SQL Editor for this **read-only** inventory query and record the profile IDs, usernames, role names, and emails privately:

```sql
select p.pengguna_id, p.username, p.email, p.terkunci,
       coalesce(jsonb_agg(jsonb_build_object(
         'nama_peran', r.nama,
         'scope_balai_id', pp.scope_balai_id,
         'scope_paket_id', pp.scope_paket_id
       )) filter (where r.peran_id is not null), '[]'::jsonb) as penugasan
from public.pengguna p
left join public.pengguna_peran pp using (pengguna_id)
left join public.peran r using (peran_id)
group by p.pengguna_id
order by p.pengguna_id;
```

The verified sandbox rows for this QA run are:

- `pengguna_id=1001`: active `admin` actor.
- `pengguna_id=1002`: active `pic_balai` target, Balai `101`.
- `pengguna_id=1003`: active profile with no assigned role (negative authorization test).
- `pengguna_id=1004`: locked Admin; do not use.
- `pengguna_id=1005`: locked, no role; do not use.

Before proceeding, confirm the Dashboard is project `yehwlrlbtcxtlogenahw`, and use the read-only query above to obtain the exact existing `email` values for 1001–1003. Do not change profile emails or role assignments as part of this setup. The existing `auth_user_id` values on these three profiles are placeholders, not Auth identities; never use them as the new account UUIDs.

## 2. Create three sandbox Auth users in the Dashboard

1. In the Supabase Dashboard, select project `yehwlrlbtcxtlogenahw` (check the project reference in the URL), then open **Authentication → Users → Add user** (the label may appear as **Create new user**).
2. Create three separate users, one for each profile 1001, 1002, and 1003. For each user, enter the exact corresponding synthetic email read from `public.pengguna`. Do not use a production email or an email belonging to a real person. If those profile emails are not clearly synthetic/test-controlled, stop and ask the sandbox owner to approve safe test emails and a coordinated profile-email change; do not improvise or change emails yourself.
3. Generate a different high-entropy password for each account in the team password manager. Enter it only in the Dashboard and password manager. Never put passwords in commands, this repository, chat, browser automation, screenshots, or logs. Mark/confirm each email as confirmed using the Dashboard option if offered; do not enable production Auth providers or integrations.
4. In the same sandbox project's user list, verify all three users exist and their emails match the intended profiles. Ensure email confirmation is complete because the guarded link checks `email_confirmed_at`. Privately copy each newly-created user's Auth UUID. Do not use any UUID from the profile table as an Auth UUID. Immediately before creating the first account, run `select now() as created_after_timestamp;` in the sandbox SQL Editor and privately record the result; this is the creation-window lower bound for the guarded link below.

Do not use the Dashboard's service-role key or create users through an API/service-role call. This is an Auth-only setup step in the sandbox Dashboard.

## 3. Link only the three newly-created Auth identities

Re-check the Dashboard project reference. In SQL Editor, replace all uppercase placeholders below with the three actual UUIDs copied from the sandbox Auth user list, the exact matching synthetic profile emails, and the timestamp recorded before user creation. The block validates the UUID/email pairing, that each Auth user was created in that window and confirmed, that UUIDs are not any profile's existing placeholder, that profiles still have their expected unlocked/role/scope state, and that every guarded update affects exactly one row. It will abort on any mismatch. It only changes `public.pengguna.auth_user_id` for IDs 1001–1003:

```sql
begin;
do $$
declare
  changed integer;
  assignments_before bigint;
  audit_before bigint;
begin
  if '<ADMIN_AUTH_UUID>'::uuid = '<PIC_AUTH_UUID>'::uuid
     or '<ADMIN_AUTH_UUID>'::uuid = '<NOROLE_AUTH_UUID>'::uuid
     or '<PIC_AUTH_UUID>'::uuid = '<NOROLE_AUTH_UUID>'::uuid then
    raise exception 'Auth UUIDs must be three distinct newly-created users';
  end if;
  if exists (
    select 1 from public.pengguna
    where pengguna_id in (1001, 1002, 1003)
      and auth_user_id in ('<ADMIN_AUTH_UUID>'::uuid, '<PIC_AUTH_UUID>'::uuid, '<NOROLE_AUTH_UUID>'::uuid)
  ) then raise exception 'A supplied UUID is already a profile placeholder'; end if;
  if not exists (select 1 from auth.users where id = '<ADMIN_AUTH_UUID>'::uuid and lower(email) = lower('<ADMIN_PROFILE_EMAIL>') and email_confirmed_at is not null and created_at >= '<CREATED_AFTER_TIMESTAMP>'::timestamptz)
     or not exists (select 1 from auth.users where id = '<PIC_AUTH_UUID>'::uuid and lower(email) = lower('<PIC_PROFILE_EMAIL>') and email_confirmed_at is not null and created_at >= '<CREATED_AFTER_TIMESTAMP>'::timestamptz)
     or not exists (select 1 from auth.users where id = '<NOROLE_AUTH_UUID>'::uuid and lower(email) = lower('<NOROLE_PROFILE_EMAIL>') and email_confirmed_at is not null and created_at >= '<CREATED_AFTER_TIMESTAMP>'::timestamptz) then
    raise exception 'Auth user UUID/email/confirmation/creation-window validation failed';
  end if;
  if (select count(*) from public.pengguna_peran) <> 3
     or (select count(*) from public.audit_trail) <> 0 then
    raise exception 'Unexpected initial assignment or audit count; stop and investigate';
  end if;
  select count(*) into assignments_before from public.pengguna_peran;
  select count(*) into audit_before from public.audit_trail;

  update public.pengguna
  set auth_user_id = '<ADMIN_AUTH_UUID>'::uuid
  where pengguna_id = 1001
    and auth_user_id is not null
    and not exists (select 1 from auth.users old_auth where old_auth.id = public.pengguna.auth_user_id)
    and not coalesce(terkunci, false)
    and lower(email) = lower('<ADMIN_PROFILE_EMAIL>')
    and exists (select 1 from public.pengguna_peran pp join public.peran r using (peran_id) where pp.pengguna_id = 1001 and r.nama = 'admin');
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'Profile 1001 did not link exactly once'; end if;

  update public.pengguna
  set auth_user_id = '<PIC_AUTH_UUID>'::uuid
  where pengguna_id = 1002
    and auth_user_id is not null
    and not exists (select 1 from auth.users old_auth where old_auth.id = public.pengguna.auth_user_id)
    and not coalesce(terkunci, false)
    and lower(email) = lower('<PIC_PROFILE_EMAIL>')
    and exists (select 1 from public.pengguna_peran pp join public.peran r using (peran_id) where pp.pengguna_id = 1002 and r.nama = 'pic_balai' and pp.scope_balai_id = 101);
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'Profile 1002 did not link exactly once'; end if;

  update public.pengguna
  set auth_user_id = '<NOROLE_AUTH_UUID>'::uuid
  where pengguna_id = 1003
    and auth_user_id is not null
    and not exists (select 1 from auth.users old_auth where old_auth.id = public.pengguna.auth_user_id)
    and not coalesce(terkunci, false)
    and lower(email) = lower('<NOROLE_PROFILE_EMAIL>')
    and not exists (select 1 from public.pengguna_peran pp where pp.pengguna_id = 1003);
  get diagnostics changed = row_count;
  if changed <> 1 then raise exception 'Profile 1003 did not link exactly once'; end if;

  if (select count(*) from public.pengguna_peran) <> assignments_before
     or (select count(*) from public.audit_trail) <> audit_before then
    raise exception 'Assignment or audit count changed during Auth linking';
  end if;
end $$;

-- Commit only if the block completed successfully. On any error, rollback.
commit;
```

The guarded block aborts unless every test passes and each update affects exactly one row; if it reports an error, issue `rollback` and investigate. Commit only after a successful block. Afterwards, run this read-only verification query in the same sandbox project. It reports booleans rather than Auth UUIDs or email addresses:

```sql
select p.pengguna_id,
       exists (select 1 from auth.users u
               where u.id = p.auth_user_id
                 and lower(u.email) = lower(p.email)
                 and u.email_confirmed_at is not null) as linked_to_confirmed_matching_auth_user,
       not coalesce(p.terkunci, false) as profile_active,
       coalesce((select jsonb_agg(r.nama order by r.nama)
                 from public.pengguna_peran pp join public.peran r using (peran_id)
                 where pp.pengguna_id = p.pengguna_id), '[]'::jsonb) as roles
from public.pengguna p
where p.pengguna_id in (1001, 1002, 1003)
order by p.pengguna_id;

select (select count(*) from public.pengguna_peran) as assignment_count,
       (select count(*) from public.audit_trail) as audit_count;
```

Expected: all three `linked_to_confirmed_matching_auth_user=true` and `profile_active=true`; roles are `admin` for 1001, `pic_balai` for 1002, and `[]` for 1003; assignment count remains **3** and audit count remains **0**. Separately recheck 1004/1005 remain locked and unmodified. Linking creates no role assignment or audit event. Keep UUIDs and emails private; do not paste query output containing them into logs or chat.

## 3. Configure and launch only the sandbox pair

In the sandbox Dashboard only, open **Project Settings → API Keys** (or **Settings → API → API Keys**, depending on Dashboard layout) and copy the **publishable** key for project `yehwlrlbtcxtlogenahw` (`sb_publishable_…`; the legacy `anon` public key is also client-safe if the project exposes only that). Never copy `sb_secret_…`, `service_role`, or any secret key. Using a secure local editor, set that same sandbox publishable key in `SUPABASE_PUBLISHABLE_KEY` in `backend/.env.sandbox` and `VITE_SUPABASE_PUBLISHABLE_KEY` in `frontend/.env.sandbox`. Do not paste it into a command, chat, or repository file other than these ignored local env files. Both files are covered by `.env.*` in `.gitignore`.

From separate terminals:

```powershell
# Terminal 1 — backend, port 5501; reads only .env.sandbox
cd backend
npm run build
# Remove inherited overrides so Node loads the sandbox values from this file.
Remove-Item Env:SUPABASE_URL,Env:SUPABASE_PUBLISHABLE_KEY,Env:ADMIN_ROLE_READS_ENABLED,Env:ADMIN_ROLE_MANAGEMENT_ENABLED,Env:PORT,Env:FRONTEND_ORIGIN,Env:LOG_LEVEL,Env:NODE_ENV -ErrorAction SilentlyContinue
node --env-file=.env.sandbox --enable-source-maps dist/index.mjs
```

```powershell
# Terminal 2 — frontend, port 5188; Vite loads .env.sandbox for this mode
cd frontend
# Remove inherited Vite overrides; --mode sandbox loads frontend/.env.sandbox.
Remove-Item Env:VITE_SUPABASE_URL,Env:VITE_SUPABASE_PUBLISHABLE_KEY,Env:VITE_API_PROXY_TARGET,Env:VITE_API_BASE_URL,Env:VITE_ADMIN_ROLE_MUTATIONS_ENABLED,Env:PORT,Env:BASE_PATH -ErrorAction SilentlyContinue
npm run dev -- --mode sandbox --host 127.0.0.1
```

Open `http://127.0.0.1:5188`. Keep `ADMIN_ROLE_MANAGEMENT_ENABLED=false` and `VITE_ADMIN_ROLE_MUTATIONS_ENABLED=false` while configuring and checking login. Before launch, verify both sandbox env files name project `yehwlrlbtcxtlogenahw`, backend port 5501, frontend port 5188, and frontend proxy target `http://127.0.0.1:5501`; after launch, use browser developer tools to verify Auth/API requests have only the sandbox hostname and `/api` is proxied to the isolated local backend. Do not enable mutation flags until the targets and valid synthetic sessions for 1001 and 1002 are confirmed; profile 1003 should authenticate but fail role authorization. Stop both processes after use.

Ports 5501/5188 are deliberately separate from the default backend/frontend ports 5000/5173. Strict-port behavior means startup fails rather than silently selecting another port if occupied.
