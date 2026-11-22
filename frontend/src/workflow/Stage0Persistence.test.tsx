// @vitest-environment jsdom
import { afterEach, expect, test } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { usePackageStore } from '../hooks/usePackageStore';
import { OperationalWorkflowWorkspace } from './OperationalWorkflowWorkspace';
import { PACKAGE_STORE_KEY, loadWorkflowPackageStore, type WorkflowPackageStore } from './packageStore';
import { PREPARATION_SOURCE_REVIEWS, type OperationalWorkflowState, type WorkflowRole } from './model';

const id = 'PAKET-DEMO-001';
const key = PREPARATION_SOURCE_REVIEWS[0];
const provider = 'Penyedia Jasa / Ketua Tim';

function Harness() {
  const store = usePackageStore();
  return <>
    {store.mutationError && <div role="alert">{store.mutationError}</div>}
    <button onClick={() => store.updateWorkflow(current => {
      const next = structuredClone(current);
      next.audits[1].status = 'Lulus';
      return next;
    }, 'Uji', id)}>Uji perubahan di luar kewenangan</button>
    <OperationalWorkflowWorkspace
      selection="/entry:Persiapan & SPMK"
      state={store.workflow}
      onUpdate={store.updateWorkflow}
      setNotice={() => {}}
      onNavigate={() => {}}
    />
  </>;
}

function seed(change: (state: OperationalWorkflowState) => void, role: WorkflowRole = provider) {
  localStorage.clear();
  const store = loadWorkflowPackageStore();
  const state = store.packages[id];
  store.activeRole = state.role = role;
  store.activePackageId = id;
  state.project.preparation.sourceReviews[key] = false;
  state.project.preparation.reportApproval = 'Draft';
  change(state);
  localStorage.setItem(PACKAGE_STORE_KEY, JSON.stringify(store));
}

function saved() {
  return (JSON.parse(localStorage.getItem(PACKAGE_STORE_KEY)!) as WorkflowPackageStore).packages[id];
}

const checkbox = () => screen.getAllByRole<HTMLInputElement>('checkbox', { hidden: true })[0];
afterEach(cleanup);

test('centang tersimpan sesudah React dimuat ulang; keputusan audit lama tetap terlihat sebagai riwayat', async () => {
  seed(state => {
    state.audits[1].status = state.audits[2].status = 'Lulus';
    state.acceptance.finalAcceptance = true;
    state.acceptance.acceptanceDecision = 'Diterima';
  });
  const view = render(<Harness />);
  await act(async () => { fireEvent.click(checkbox()); });
  const after = saved();
  expect(after.project.preparation.sourceReviews[key]).toBe(true);
  expect(after.audits[1]).toMatchObject({ status: 'Lulus', requiresReview: true });
  expect(after.audits[2].history?.at(-1)?.status).toBe('Lulus');
  expect(after.acceptance.finalAcceptance).toBe(false);
  expect(after.balaiDecisionHistory?.at(-1)?.previousDecision).toBe('Diterima');
  view.unmount();
  render(<Harness />);
  expect(checkbox().checked).toBe(true);
});

for (const status of ['Diajukan', 'Disetujui', 'Perlu Revisi', 'Ditolak'] as const) {
  test(`checklist Penyedia pada status ${status}`, async () => {
    seed(state => { state.project.preparation.reportApproval = status; });
    render(<Harness />);
    const locked = status === 'Diajukan' || status === 'Disetujui';
    expect(checkbox().disabled).toBe(locked);
    await act(async () => { fireEvent.click(checkbox()); });
    expect(saved().project.preparation.sourceReviews[key]).toBe(!locked);
    expect(saved().project.preparation.reportApproval).toBe(locked ? status : 'Draft');
  });
}

for (const role of ['PIC Balai / Pengguna Jasa', 'Direktorat / Pusat', 'Admin'] as const) {
  test(`${role} dapat melihat hasil checklist tanpa kontrol perubahan`, () => {
    seed(() => {}, role);
    const before = saved().project.preparation;
    render(<Harness />);
    const summary = screen.getByText(/^Rincian persiapan \(/);
    fireEvent.click(summary);
    expect(summary.parentElement?.querySelectorAll(".v2-checklist-results li").length).toBeGreaterThan(0);
    expect(screen.queryAllByRole('checkbox', { hidden: true })).toHaveLength(0);
    expect(saved().project.preparation).toEqual(before);
  });
}

test('penolakan guard muncul sebagai alert dan audit tetap sama', async () => {
  seed(state => { state.audits[1].status = 'Belum Dimulai'; });
  render(<Harness />);
  await act(async () => {
    fireEvent.click(screen.getByRole('button', { name: 'Uji perubahan di luar kewenangan' }));
  });
  expect(screen.getByRole('alert').textContent).toMatch(/Perubahan tidak disimpan.*tingkat 2/);
  expect(saved().audits[1].status).toBe('Belum Dimulai');
});
