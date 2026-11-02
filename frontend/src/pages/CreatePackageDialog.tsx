import { useEffect, useState, type FormEvent } from 'react';
import { Check, RefreshCw, X } from 'lucide-react';

import { ApiError, apiRequest } from '../auth/client';

type Balai = { balai_id: number; nama: string; kode: string };
type CreatedPackage = { paket_id: number; nama_paket: string; status: string };

function errorText(error: unknown) {
  if (error instanceof ApiError) return error.message;
  return error instanceof Error ? error.message : 'Paket belum dapat dibuat.';
}

export function CreatePackageDialog({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: (item: CreatedPackage) => void;
}) {
  const [balais, setBalais] = useState<Balai[]>([]);
  const [balaiLoading, setBalaiLoading] = useState(true);
  const [balaiError, setBalaiError] = useState('');
  const [balaiRevision, setBalaiRevision] = useState(0);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({ nama_paket: '', nomor_kontrak: '', tahun_anggaran: String(new Date().getFullYear()), balai_id: '' });

  useEffect(() => {
    const controller = new AbortController();
    setBalaiError('');
    apiRequest<{ data: Balai[] }>('/balai', { signal: controller.signal })
      .then(result => {
        if (controller.signal.aborted) return;
        if (!Array.isArray(result.data)) throw new Error('Daftar Balai dari server tidak sesuai format.');
        setBalais(result.data);
        setForm(current => ({ ...current, balai_id: current.balai_id || (result.data[0] ? String(result.data[0].balai_id) : '') }));
      })
      .catch(cause => { if (!controller.signal.aborted) setBalaiError(errorText(cause)); })
      .finally(() => { if (!controller.signal.aborted) setBalaiLoading(false); });
    return () => controller.abort();
  }, [balaiRevision]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (saving) return;
    const namaPaket = form.nama_paket.trim();
    const nomorKontrak = form.nomor_kontrak.trim();
    const tahunAnggaran = Number(form.tahun_anggaran);
    const balaiId = Number(form.balai_id);
    if (!namaPaket || namaPaket.length > 255) { setError('Nama paket wajib diisi (maksimal 255 karakter).'); return; }
    if (!nomorKontrak || nomorKontrak.length > 100) { setError('Nomor kontrak wajib diisi (maksimal 100 karakter).'); return; }
    if (!Number.isInteger(tahunAnggaran) || tahunAnggaran < 2000 || tahunAnggaran > 2100) { setError('Tahun anggaran harus berupa bilangan bulat 2000–2100.'); return; }
    if (!Number.isInteger(balaiId) || !balais.some(item => item.balai_id === balaiId)) { setError('Pilih Balai aktif dari daftar server.'); return; }

    setSaving(true);
    setError('');
    try {
      const result = await apiRequest<{ data: CreatedPackage }>('/paket', {
        method: 'POST',
        body: JSON.stringify({ nama_paket: namaPaket, nomor_kontrak: nomorKontrak, tahun_anggaran: tahunAnggaran, balai_id: balaiId }),
      });
      if (!result.data || !Number.isInteger(result.data.paket_id)) throw new Error('Respons pembuatan paket tidak memuat ID paket.');
      onCreated(result.data);
    } catch (cause) {
      setError(errorText(cause));
    } finally {
      setSaving(false);
    }
  }

  return <div className="overlay" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose(); }}>
    <div className="dialog" role="dialog" aria-modal="true" aria-labelledby="create-package-title">
      <div className="dialog-head">
        <h2 id="create-package-title">Buat Paket</h2>
        <button type="button" className="btn sm" onClick={onClose} disabled={saving} aria-label="Tutup dialog"><X size={15} /></button>
      </div>
      <form className="dialog-content" onSubmit={submit}>
        <p className="subtle">Paket baru akan disimpan ke server dengan status DRAFT dan terikat pada akun Penyedia Jasa yang sedang masuk.</p>
        {error && <p role="alert" className="notice">{error}</p>}
        {balaiError && <p role="alert" className="notice">{balaiError} <button type="button" className="btn sm" onClick={() => { setBalaiLoading(true); setBalaiRevision(value => value + 1); }}><RefreshCw size={12} /> Muat ulang</button></p>}
        <div className="form-grid">
          <div className="field"><label htmlFor="create-package-name">Nama paket</label><input id="create-package-name" required maxLength={255} value={form.nama_paket} onChange={event => setForm(current => ({ ...current, nama_paket: event.target.value }))} disabled={saving} /></div>
          <div className="field"><label htmlFor="create-package-contract">Nomor kontrak</label><input id="create-package-contract" required maxLength={100} value={form.nomor_kontrak} onChange={event => setForm(current => ({ ...current, nomor_kontrak: event.target.value }))} disabled={saving} /></div>
          <div className="field"><label htmlFor="create-package-year">Tahun anggaran</label><input id="create-package-year" type="number" min={2000} max={2100} step={1} required value={form.tahun_anggaran} onChange={event => setForm(current => ({ ...current, tahun_anggaran: event.target.value }))} disabled={saving} /></div>
          <div className="field"><label htmlFor="create-package-balai">Balai</label><select id="create-package-balai" required value={form.balai_id} onChange={event => setForm(current => ({ ...current, balai_id: event.target.value }))} disabled={saving || balaiLoading || !!balaiError || !balais.length}><option value="">{balaiLoading ? 'Memuat Balai…' : 'Pilih Balai'}</option>{balais.map(item => <option key={item.balai_id} value={item.balai_id}>{item.nama || item.kode}</option>)}</select></div>
        </div>
        {!balaiLoading && !balaiError && !balais.length && <p role="status">Tidak ada Balai aktif yang dapat dipilih.</p>}
        <div className="form-actions"><button type="button" className="btn" onClick={onClose} disabled={saving}>Batal</button><button type="submit" className="btn primary" disabled={saving || balaiLoading || !!balaiError || !balais.length}><Check size={13} />{saving ? 'Menyimpan…' : 'Simpan Paket DRAFT'}</button></div>
      </form>
    </div>
  </div>;
}
