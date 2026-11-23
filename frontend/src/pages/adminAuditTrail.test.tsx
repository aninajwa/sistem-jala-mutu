import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { AdminAuditTrailResults, type AdminAuditEvent } from './AdminAuditTrailPage';

describe('Admin audit trail safe read view', () => {
  it('renders safe event metadata but excludes raw before/after payloads and record identifiers', () => {
    const testEvent = {
      trail_id: '9007199254740993',
      waktu: '2026-11-13T09:30:00',
      pengguna_id: 7,
      tabel: 'paket_kontrak',
      aksi: 'UPDATE_DRAFT',
      ringkasan: 'Aksi UPDATE_DRAFT pada paket_kontrak',
      nilai_lama: { password: 'do-not-render' },
      nilai_baru: { token: 'do-not-render' },
      record_id: 'private-record-id',
    } as unknown as AdminAuditEvent;
    const html = renderToStaticMarkup(<AdminAuditTrailResults state="ready" events={[testEvent]} error="" />);
    expect(html).toContain('table-admin-audit-trail');
    expect(html).toContain('2026-11-13 09:30:00');
    expect(html).toContain('7');
    expect(html).toContain('paket_kontrak');
    expect(html).toContain('UPDATE_DRAFT');
    expect(html).toContain('Aksi UPDATE_DRAFT pada paket_kontrak');
    expect(html).not.toContain('do-not-render');
    expect(html).not.toContain('private-record-id');
  });

  it('renders loading, error, and empty states', () => {
    expect(renderToStaticMarkup(<AdminAuditTrailResults state="loading" events={[]} error="" />)).toContain('Memuat jejak aktivitas');
    expect(renderToStaticMarkup(<AdminAuditTrailResults state="error" events={[]} error="Audit read unavailable." />)).toContain('Audit read unavailable.');
    expect(renderToStaticMarkup(<AdminAuditTrailResults state="ready" events={[]} error="" />)).toContain('Tidak ada aktivitas yang cocok.');
  });

  it('does not invent an actor or event time when nullable database fields are null', () => {
    const html = renderToStaticMarkup(<AdminAuditTrailResults state="ready" events={[{
      trail_id: '9223372036854775807', waktu: null, pengguna_id: null, tabel: 'Data aplikasi lain', aksi: 'Aktivitas lain', ringkasan: 'Aktivitas lain pada data aplikasi lain',
    }]} error="" />);
    expect(html.match(/<td>—<\/td>/g)).toHaveLength(2);
  });
});
