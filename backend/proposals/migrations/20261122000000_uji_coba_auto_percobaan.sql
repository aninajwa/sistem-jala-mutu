-- REVIEW-ONLY LOCAL MIGRATION PROPOSAL.
-- Do not apply to Supabase or production until reviewed and tested locally.
--
-- Basis: the catalog definition of app_private.simpan_uji_coba inspected for
-- the Jala-Mutu project. That SECURITY DEFINER function validates access and
-- payload/team/equipment/road, then inserts public.uji_coba and audits/returns
-- the inserted row. This proposal leaves its signature, checks, audit and
-- response untouched. The BEFORE INSERT trigger assigns percobaan_ke after
-- those RPC checks and also covers permitted service_role direct inserts.
--
-- Existing rows are not updated or renumbered. In particular, historical
-- rows (including uji_coba_id 1 and 7) retain their current values. Since
-- historical duplicates remain, this proposal intentionally adds no unique
-- index on the legacy rows. A separate allocator row is updated for each new
-- insert: READ COMMITTED serializes it, and REPEATABLE READ either sees a
-- distinct increment or raises serialization failure 40001 for retry.

BEGIN;

-- This is coordination state, not a rewrite of the historical Uji Coba rows.
CREATE TABLE app_private.uji_coba_percobaan_allocator (
  paket_id integer NOT NULL,
  jenis_survei_id integer NOT NULL,
  last_percobaan_ke integer NOT NULL CHECK (last_percobaan_ke > 0),
  PRIMARY KEY (paket_id, jenis_survei_id)
);

-- Start each pair immediately above its existing maximum. Duplicate legacy
-- values (including the pair represented by Uji Coba #1 and #7) are retained.
INSERT INTO app_private.uji_coba_percobaan_allocator
  (paket_id, jenis_survei_id, last_percobaan_ke)
SELECT paket_id, jenis_survei_id, MAX(percobaan_ke)
FROM public.uji_coba
WHERE paket_id IS NOT NULL
  AND jenis_survei_id IS NOT NULL
  AND percobaan_ke IS NOT NULL
GROUP BY paket_id, jenis_survei_id
ON CONFLICT (paket_id, jenis_survei_id) DO NOTHING;

REVOKE ALL ON TABLE app_private.uji_coba_percobaan_allocator
  FROM PUBLIC, anon, authenticated;

CREATE OR REPLACE FUNCTION app_private.set_nomor_percobaan_uji_coba()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $function$
BEGIN
  -- Keep incomplete legacy-style inserts nullable; the existing
  -- simpan_uji_coba RPC validates both identifiers before inserting.
  IF NEW.paket_id IS NULL OR NEW.jenis_survei_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Retain the pair lock for a stable lock order across every INSERT path.
  -- Unlike MAX() alone, updating the allocator row also detects a stale
  -- REPEATABLE READ snapshot: PostgreSQL raises SQLSTATE 40001 if another
  -- transaction updated that row after this transaction's snapshot.
  PERFORM pg_catalog.pg_advisory_xact_lock(NEW.paket_id, NEW.jenis_survei_id);

  UPDATE app_private.uji_coba_percobaan_allocator
     SET last_percobaan_ke = last_percobaan_ke + 1
   WHERE paket_id = NEW.paket_id
     AND jenis_survei_id = NEW.jenis_survei_id
  RETURNING last_percobaan_ke INTO NEW.percobaan_ke;

  IF NOT FOUND THEN
    -- First-ever allocation for this pair. If a row was inserted concurrently
    -- but is invisible to this transaction's REPEATABLE READ snapshot, DO
    -- NOTHING returns no row; explicitly abort so the caller retries rather
    -- than inserting a duplicate number.
    INSERT INTO app_private.uji_coba_percobaan_allocator
      (paket_id, jenis_survei_id, last_percobaan_ke)
    VALUES (NEW.paket_id, NEW.jenis_survei_id, 1)
    ON CONFLICT (paket_id, jenis_survei_id) DO NOTHING
    RETURNING last_percobaan_ke INTO NEW.percobaan_ke;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'Percubaan Uji Coba berubah serentak; cuba semula transaksi'
        USING ERRCODE = '40001';
    END IF;
  END IF;

  RETURN NEW;
END;
$function$;

REVOKE ALL ON FUNCTION app_private.set_nomor_percobaan_uji_coba()
  FROM PUBLIC, anon, authenticated;

DROP TRIGGER IF EXISTS uji_coba_auto_percobaan_before_insert
  ON public.uji_coba;

CREATE TRIGGER uji_coba_auto_percobaan_before_insert
BEFORE INSERT ON public.uji_coba
FOR EACH ROW
EXECUTE FUNCTION app_private.set_nomor_percobaan_uji_coba();

COMMIT;
