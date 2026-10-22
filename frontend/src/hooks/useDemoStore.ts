import { localPersistence } from '../workflow/repository/localPersistence';
import { useEffect, useState } from 'react';

import { DEMO_STORE_KEY, balais, loadDemoStore, surveiTypes } from '../lib/demoData';
import type { DemoStore, Doc, Finding, RecordType, Survey } from '../types';
import type { WorkflowRole } from '../workflow/model';

/**
 * Menyimpan seluruh state demo lokal beserta aksi CRUD dan state dialog.
 * Pakai satu hook agar App hanya mengurus shell, filter, dan routing.
 */
export function useDemoStore(activeRole: WorkflowRole) {
  const [store, setStore] = useState<DemoStore>(loadDemoStore);
  const [modal, setModal] = useState<RecordType | null>(null);
  const [editing, setEditing] = useState<string | null>(null);
  const [notice, setNotice] = useState('');

  useEffect(() => {
    localPersistence.setItem(DEMO_STORE_KEY, JSON.stringify(store));
  }, [store]);

  const record = (activity: string, object: string) =>
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
          pengguna: 'Anda · ' + activeRole,
          aktivitas: activity,
          objek: object,
          hasil: 'Berhasil',
        },
        ...prev.logs,
      ],
    }));

  const addOrEdit = (type: RecordType, form: Record<string, string>) => {
    const id =
      editing ||
      `${type === 'survey' ? 'SRV' : type === 'finding' ? 'TP-027' : type === 'doc' ? 'DOC' : 'REF'}-${Date.now().toString().slice(-5)}`;

    if (type === 'survey') {
      const row: Survey = {
        id,
        balai: form.balai || balais[0],
        ruas: form.ruas || 'Ruas baru',
        jenis: form.jenis || 'IRI',
        tanggal: form.tanggal || '2027-06-15',
        alat: form.alat || 'Profilometer Laser',
        status: form.status || 'Draft',
        hasil: form.hasil || 'Menunggu hasil',
        km: Number(form.km) || 0,
      };
      setStore(p => ({
        ...p,
        surveys: editing ? p.surveys.map(x => (x.id === editing ? row : x)) : [row, ...p.surveys],
      }));
      record(editing ? 'Ubah data survei' : 'Tambah data survei', `${id} · ${row.ruas}`);
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
      record(editing ? 'Ubah temuan' : 'Tambah temuan', `${id} · ${row.ruas}`);
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
    setNotice(
      editing
        ? 'Perubahan tersimpan di perangkat ini'
        : 'Data berhasil ditambahkan dan tersimpan lokal',
    );
    window.setTimeout(() => setNotice(''), 2600);
  };

  const updateStatus = (type: 'survey' | 'finding' | 'doc', id: string, status: string) => {
    setStore(p =>
      type === 'survey'
        ? { ...p, surveys: p.surveys.map(x => (x.id === id ? { ...x, status } : x)) }
        : type === 'finding'
          ? { ...p, findings: p.findings.map(x => (x.id === id ? { ...x, status } : x)) }
          : { ...p, docs: p.docs.map(x => (x.id === id ? { ...x, status } : x)) },
    );
    record(`Ubah status menjadi ${status}`, id);
    setNotice(`Status ${id} diperbarui`);
    window.setTimeout(() => setNotice(''), 2200);
  };

  const beginEdit = (type: RecordType, id: string) => {
    setEditing(id);
    setModal(type);
  };

  const openNew = (type: RecordType) => {
    setEditing(null);
    setModal(type);
  };

  const closeDialog = () => {
    setModal(null);
    setEditing(null);
  };

  return {
    store,
    modal,
    editing,
    notice,
    setNotice,
    record,
    addOrEdit,
    updateStatus,
    beginEdit,
    openNew,
    closeDialog,
  };
}
