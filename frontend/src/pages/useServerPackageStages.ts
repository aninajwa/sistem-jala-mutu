import { useEffect, useState } from 'react';
import { apiRequest } from '../auth/client';

export type ServerPackageStage = { paket_id: number; status_paket: string | null; tahap: string; keterangan: string };

/** Active stage of every package the caller may read (one call: GET /paket-tahap). Null until loaded or when unavailable. */
export function useServerPackageStages(enabled = true) {
  const [stages, setStages] = useState<Record<string, ServerPackageStage> | null>(null);
  useEffect(() => {
    if (!enabled) return;
    const controller = new AbortController();
    apiRequest<{ data: ServerPackageStage[] }>('/paket-tahap', { signal: controller.signal })
      .then(result => {
        if (controller.signal.aborted || !Array.isArray(result.data)) return;
        setStages(Object.fromEntries(result.data.map(row => [String(row.paket_id), row])));
      })
      .catch(() => { if (!controller.signal.aborted) setStages(null); });
    return () => controller.abort();
  }, [enabled]);
  return stages;
}

/** "Tahap 3B · Verval 14 hari", or "Selesai" once the final acceptance is recorded. */
export function serverStageText(stage: ServerPackageStage | undefined) {
  if (!stage) return 'Memuat tahap…';
  return stage.tahap === 'Selesai' ? 'Selesai' : `${stage.tahap} · ${stage.keterangan}`;
}
