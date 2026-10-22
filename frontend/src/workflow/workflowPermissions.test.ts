
import { describe, expect, it } from 'vitest';

import {
  canPerformAction,
} from './workflowPermissions';

describe('Workflow role permissions', () => {
  it('Penyedia boleh mencatat harian', () => {
    expect(
      canPerformAction(
        'Penyedia Jasa / Ketua Tim',
        'daily.record',
      ),
    ).toBe(true);
  });

  it('Penyedia tidak boleh mereview produksi', () => {
    expect(
      canPerformAction(
        'Penyedia Jasa / Ketua Tim',
        'production.review',
      ),
    ).toBe(false);
  });

  it('Balai boleh mereview produksi', () => {
    expect(
      canPerformAction(
        'PIC Balai / Pengguna Jasa',
        'production.review',
      ),
    ).toBe(true);
  });

  it('Penyedia bisa memeriksa internal 3B', () => {
    expect(
      canPerformAction(
        'Penyedia Jasa / Ketua Tim',
        'periodic.internal',
      ),
    ).toBe(true);
  });

  it('Admin tidak otomatis menjadi reviewer', () => {
    expect(
      canPerformAction(
        'Admin',
        'production.review',
      ),
    ).toBe(false);
  });

  it('Audit memiliki pemilik kewenangan', () => {
    expect(
      canPerformAction(
        'Penyedia Jasa / Ketua Tim',
        'audit.internal',
      ),
    ).toBe(true);

    expect(
      canPerformAction(
        'PIC Balai / Pengguna Jasa',
        'audit.directorate',
      ),
    ).toBe(false);
  });
});
