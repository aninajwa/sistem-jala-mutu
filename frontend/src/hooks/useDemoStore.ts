import { useEffect, useState } from 'react';

import { DEMO_STORE_KEY, loadDemoStore } from '../lib/demoData';
import { canSetSurveyStatus, type SurveyDecision } from '../lib/statusTransitions';
import { prepareSurveyEntry } from '../lib/surveyEntry';
import type { DemoStore, Doc, Finding, RecordType } from '../types';
import { canRole } from '../workflow/workflowConfig';
import type { WorkflowRole } from '../workflow/model';

/**
 * Menyimpan seluruh state demo lokal beserta aksi CRUD dan state dialog.
 * Pakai satu hook agar App hanya mengurus shell, filter, dan routing.
 */
export function useDemoStore(activeRole: WorkflowRole) {
  const [store, setStore] = useState<DemoStore>(loadDemoStore);
  const [modal, setModal] = useState<RecordType | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [initialForm, setInitialForm] = useState<Record<string, string> | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    localStorage.setItem(DEMO_STORE_KEY, JSON.stringify(store));
  }, [store]);

  const record = (activity: string, object: string, result = 'Berhasil') =>
    setStore(prev => ({
      ...prev,
      logs: [
        {
          id: `LOG-${Date.now()}`,
          waktu: new Date().toLocaleString('id-ID', {
            day: '2-digit',
            month: 'short',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          }),
          pengguna: 'Anda Â· ' + activeRole,
          aktivitas: activity,
          objek: object,
          hasil: result,
        },
        ...prev.logs,
      ],
    }));

  const addOrEdit = (type: RecordType, form: Record<string, string>) => {
    const id =
      editing ||
      `${type === 'survey' ? 'SRV' : type === 'finding' ? 'TP-027' : type === 'doc' ? 'DOC' : 'REF'}-${Date.now().toString().slice(-5)}`;

    if (type === 'survey') {
      const existing = editing ? store.surveys.find(x => x.id === editing) : undefined;
      const prepared = prepareSurveyEntry(id, form, existing);
      if (!prepared.survey) {
        setNotice(prepared.error ?? 'Data penyerahan tidak valid.');
        return;
      }
      const row = prepared.survey;
      setStore(p => ({
        ...p,
        surveys: editing ? p.surveys.map(x => (x.id === editing ? row : x)) : [row, ...p.surveys],
      }));
      record(editing ? 'Ubah data survei' : 'Tambah data survei', `${id} Â· ${row.ruas}`);
      setNotice(row.status === 'Diserahkan' ? 'Data survei berhasil diserahkan.' : 'Draft survei tersimpan di perangkat ini.');
    } else if (type === 'finding') {
      const row: Finding = {
        id,
        ruas: form.ruas || 'Ruas baru',
        jenis: form.jenis || 'Kelengkapan dokumen',
        prioritas: form.prioritas || 'Sedang',
        status: form.status || 'Diusulkan',
        pic: form.pic || 'Belum ditetapkan',
        due: form.due || '2027-06-30',
      };
      setStore(p => ({
        ...p,
        findings: editing ? p.findings.map(x => (x.id === editing ? row : x)) : [row, ...p.findings],
      }));
      record(editing ? 'Ubah temuan' : 'Tambah temuan', `${id} Â· ${row.ruas}`);
    } else if (type === 'doc') {
      const row: Doc = {
        id,
        nama: form.nama || 'Dokumen baru',
        kategori: form.kategori || 'Validasi',
        versi: form.versi || 'v1.0',
        status: form.status || 'Lengkap',
      };
      setStore(p => ({
        ...p,
        docs: editing ? p.docs.map(x => (x.id === editing ? row : x)) : [row, ...p.docs],
      }));
      record(editing ? 'Perbarui dokumen' : 'Tambah dokumen', row.nama);
    } else {
      setStore(p => ({
        ...p,
        docs: [
          {
            id,
            nama: form.nama || 'Referensi baru',
            kategori: form.kategori || 'Jenis survei',
            versi: 'v1.0',
            status: 'Aktif',
          },
          ...p.docs,
        ],
      }));
      record('Tambah referensi master', form.nama || 'Referensi baru');
    }

    setModal(null);
    setEditing(null);
    setInitialForm(null);
    if (type !== 'survey') {
      setNotice(editing ? 'Perubahan tersimpan di perangkat ini' : 'Data berhasil ditambahkan dan tersimpan lokal');
    }
    window.setTimeout(() => setNotice(''), 2600);
  };

  const updateStatus = (type: 'survey' | 'finding' | 'doc', id: string, status: string) => {
    if (type === 'survey') {
      const current = store.surveys.find(x => x.id === id);
      if (!current) {
        record('Transisi status ditolak', `${id} Â· sampel tidak ditemukan`, 'Ditolak');
        return;
      }
      if (!canSetSurveyStatus(activeRole, current.status, status)) {
        record(
          `Transisi ditolak: ${current.status} → ${status}`,
          `${id} Â· peran ${activeRole}`,
          'Ditolak',
        );
        setNotice(
          `Transisi ${current.status} → ${status} tidak diizinkan untuk peran ${activeRole}.`,
        );
        window.setTimeout(() => setNotice(''), 3200);
        return;
      }
      setStore(p => ({
        ...p,
        surveys: p.surveys.map(x => (x.id === id ? { ...x, status } : x)),
      }));
      record(`Ubah status ${current.status} → ${status}`, id);
      setNotice(`Status ${id} diperbarui`);
      window.setTimeout(() => setNotice(''), 2200);
      return;
    }

    setStore(p =>
      type === 'finding'
        ? { ...p, findings: p.findings.map(x => (x.id === id ? { ...x, status } : x)) }
        : { ...p, docs: p.docs.map(x => (x.id === id ? { ...x, status } : x)) },
    );
    record(`Ubah status menjadi ${status}`, id);
    setNotice(`Status ${id} diperbarui`);
    window.setTimeout(() => setNotice(''), 2200);
  };

  /**
   * Keputusan review hanya untuk Verifikasi → Lulus / Perlu Perbaikan.
   * Catatan disimpan pada rekaman agar tidak hilang saat halaman ditutup.
   */
  const reviewSurvey = (id: string, decision: SurveyDecision, note: string) => {
    if (!canRole(activeRole, 'reviewValidation')) {
      record('Keputusan review ditolak', `${id} Â· peran ${activeRole}`, 'Ditolak');
      setNotice(`Peran ${activeRole} tidak berwenang memberi keputusan review.`);
      window.setTimeout(() => setNotice(''), 3200);
      return false;
    }

    const current = store.surveys.find(x => x.id === id);
    if (!current) {
      record('Keputusan review ditolak', `${id} Â· sampel tidak ditemukan`, 'Ditolak');
      setNotice('Sampel tidak ditemukan. Muat ulang daftar verifikasi.');
      return false;
    }
    if (!canSetSurveyStatus(activeRole, current.status, decision)) {
      record(
        `Keputusan review ditolak: ${current.status} → ${decision}`,
        `${id} Â· peran ${activeRole}`,
        'Ditolak',
      );
      setNotice(`Sampel ${id} berstatus ${current.status}; keputusan ${decision} tidak dapat dicatat.`);
      window.setTimeout(() => setNotice(''), 3400);
      return false;
    }

    const reviewNote = note.trim();
    if (decision === 'Perlu Perbaikan' && !reviewNote) {
      record('Keputusan review ditolak', `${id} Â· catatan wajib kosong`, 'Ditolak');
      setNotice('Catatan pemeriksa wajib diisi untuk mengembalikan sampel.');
      window.setTimeout(() => setNotice(''), 3200);
      return false;
    }

    setStore(p => ({
      ...p,
      surveys: p.surveys.map(x =>
        x.id === id ? { ...x, status: decision, reviewNote, verificationNoteDraft: undefined } : x,
      ),
    }));
    record(
      `Keputusan review: ${decision}`,
      `${id} · ${reviewNote || 'tanpa catatan'}`,
    );
    setNotice(`Keputusan ${decision} untuk ${id} tersimpan`);
    window.setTimeout(() => setNotice(''), 2600);
    return true;
  };

  const saveReviewDraft = (id: string, note: string) => {
    if (!canRole(activeRole, 'reviewValidation')) return false;
    const current = store.surveys.find(x => x.id === id);
    if (!current || current.status !== 'Verifikasi') return false;

    setStore(p => ({
      ...p,
      surveys: p.surveys.map(x =>
        x.id === id ? { ...x, verificationNoteDraft: note } : x,
      ),
    }));
    return true;
  };

  const beginEdit = (type: RecordType, id: string) => {
    setInitialForm(null);
    setEditing(id);
    setModal(type);
  };

  const openNew = (type: RecordType, initial?: Record<string, string>) => {
    setEditing(null);
    setInitialForm(initial ? { ...initial } : null);
    setModal(type);
  };

  const closeDialog = () => {
    setModal(null);
    setEditing(null);
    setInitialForm(null);
  };

  return {
    store,
    modal,
    editing,
    initialForm,
    notice,
    setNotice,
    record,
    addOrEdit,
    updateStatus,
    saveReviewDraft,
    reviewSurvey,
    beginEdit,
    openNew,
    closeDialog,
  };
}
