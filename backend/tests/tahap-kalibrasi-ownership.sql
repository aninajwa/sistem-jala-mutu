-- Integration SQL: pemilikan pakej untuk app_private.assert_tahap_kalibrasi.
--
-- Keselamatan:
--   * Semua tulisan berlaku dalam transaksi dan di-rollback. Tiada Storage.
--   * TIADA akaun pengguna sebenar diubah (tiada kunci akaun, tiada peranan
--     sementara, tiada kemas kini pada public.pengguna).
--   * Akaun sebenar hanya DIBACA: satu akaun penyedia_jasa aktif sebagai
--     pelaku, dan satu pengguna_id lain sebagai nilai created_by pada pakej
--     fixture (tanpa mengubah baris pengguna itu).
--   * Semua pakej/pengisian yang diubah ialah fixture 2100000020/2100000021.
--
-- Liputan:
--   1. Pemilik pakej lulus semakan dan boleh mendaftar tim.
--   2. Pakej milik akaun lain ditolak dengan 42501 (helper dan RPC).
--   3. Pakej bukan DRAFT ditolak dengan 55000.
--   4. Persiapan belum DISETUJUI ditolak dengan 55000.
--   5. Pakej tidak wujud ditolak dengan P0002.
--   6. anon tiada EXECUTE.

begin;
do $$
declare
  provider_user integer;
  provider_auth uuid;
  other_user integer;
  owner_pid constant integer := 2100000020;
  foreign_pid constant integer := 2100000021;
  balai integer;
  org integer;
  kind integer;
  template integer;
  state jsonb;
  actor integer;
begin
  -- Baca akaun penyedia aktif. Tiada tulisan pada baris ini.
  select u.pengguna_id, u.auth_user_id
    into provider_user, provider_auth
  from public.pengguna u
  join public.pengguna_peran pp using (pengguna_id)
  join public.peran r using (peran_id)
  where r.nama = 'penyedia_jasa'
    and not coalesce(u.terkunci, false)
  order by u.pengguna_id
  limit 1;

  if provider_user is null then
    raise exception 'Need one active penyedia_jasa account';
  end if;

  -- Baca pengguna lain (tanpa menulis). Hanya pengguna_id digunakan sebagai
  -- nilai created_by pada pakej fixture; peranan akaun ini tidak disentuh.
  select min(u.pengguna_id)
    into other_user
  from public.pengguna u
  where u.pengguna_id <> provider_user;

  if other_user is null then
    raise exception 'Need a second existing account to represent a foreign package owner';
  end if;

  select p.balai_id into balai from public.paket_kontrak p order by p.paket_id limit 1;
  select p.penyedia_id into org from public.penyedia_jasa p order by p.penyedia_id limit 1;

  select jenis_survei_id into kind from public.jenis_survei where kode = 'IRI';
  select template_id into template
  from public.checklist_template
  where no_dokumen = 'JM-PERSIAPAN-TAHAP0' and revisi = 'DRAFT-01'
  limit 1;

  if balai is null or org is null or kind is null or template is null then
    raise exception 'Need balai, penyedia, survey type and preparation template fixtures';
  end if;

  -- Fixture: pakej milik pelaku, DRAFT, persiapan DISETUJUI.
  insert into public.paket_kontrak(paket_id, balai_id, penyedia_id, nama_paket, status, created_by)
  overriding system value
  values (owner_pid, balai, org, 'Ownership authorization owner fixture', 'DRAFT', provider_user);

  insert into public.checklist_pengisian(paket_id, template_id, status)
  values (owner_pid, template, 'DISETUJUI');

  -- Fixture: pakej milik akaun lain, DRAFT, persiapan DISETUJUI.
  insert into public.paket_kontrak(paket_id, balai_id, penyedia_id, nama_paket, status, created_by)
  overriding system value
  values (foreign_pid, balai, org, 'Ownership authorization foreign fixture', 'DRAFT', other_user);

  insert into public.checklist_pengisian(paket_id, template_id, status)
  values (foreign_pid, template, 'DISETUJUI');

  -- 1. Pemilik lulus.
  perform set_config('request.jwt.claim.sub', provider_auth::text, true);
  execute 'set local role authenticated';

  actor := app_private.assert_tahap_kalibrasi(owner_pid);
  if actor is distinct from provider_user then
    raise exception 'Owner was not returned by helper';
  end if;

  state := public.daftar_tim_survei(owner_pid, org, kind, 'Tim pemilik pakej');
  if state->>'nama_tim' <> 'Tim pemilik pakej' then
    raise exception 'Owner could not register team';
  end if;

  -- 2. Pakej milik akaun lain ditolak, walaupun pelaku penyedia_jasa aktif.
  begin
    perform app_private.assert_tahap_kalibrasi(foreign_pid);
    raise exception 'Foreign package passed the helper check';
  exception when insufficient_privilege then null;
  end;

  begin
    perform public.daftar_tim_survei(foreign_pid, org, kind, 'Tim bukan pemilik');
    raise exception 'Foreign package accepted a team';
  exception when insufficient_privilege then null;
  end;

  if exists (select 1 from public.tim_survei where paket_id = foreign_pid) then
    raise exception 'Foreign package left a team row';
  end if;

  -- 3. Pakej bukan DRAFT (fixture pemilik).
  execute 'reset role';
  update public.paket_kontrak set status = 'SELESAI' where paket_id = owner_pid;
  execute 'set local role authenticated';
  begin
    perform app_private.assert_tahap_kalibrasi(owner_pid);
    raise exception 'Non-DRAFT package passed';
  exception when object_not_in_prerequisite_state then null;
  end;
  execute 'reset role';
  update public.paket_kontrak set status = 'DRAFT' where paket_id = owner_pid;

  -- 4. Persiapan belum DISETUJUI (fixture pemilik).
  update public.checklist_pengisian set status = 'DRAFT' where paket_id = owner_pid;
  execute 'set local role authenticated';
  begin
    perform app_private.assert_tahap_kalibrasi(owner_pid);
    raise exception 'Unapproved preparation passed';
  exception when object_not_in_prerequisite_state then null;
  end;
  execute 'reset role';
  update public.checklist_pengisian set status = 'DISETUJUI' where paket_id = owner_pid;

  -- 5. Pakej tidak wujud.
  execute 'set local role authenticated';
  begin
    perform app_private.assert_tahap_kalibrasi(2147483647);
    raise exception 'Missing package passed';
  exception when no_data_found then null;
  end;

  -- 6. anon tidak boleh melaksanakan.
  execute 'reset role';
  if has_function_privilege('anon', 'app_private.assert_tahap_kalibrasi(integer)', 'EXECUTE') then
    raise exception 'Anon can execute helper';
  end if;
end $$;
rollback;

select 'PASS: package ownership enforced for assert_tahap_kalibrasi; owner allowed, foreign package denied (42501), non-DRAFT and unapproved preparation denied (55000), missing package denied (P0002), anon has no EXECUTE. No real user account was modified; fixtures rolled back.' as verification;
