import { useEffect, useState, type FormEvent } from 'react';
import {
  Activity,
  ArrowLeft,
  ArrowRight,
  BookOpen,
  CheckCircle2,
  ClipboardList,
  FileCheck2,
  FileText,
  MapPinned,
  Pencil,
  RefreshCw,
  RotateCcw,
  Save,
  Send,
  ShieldCheck,
} from 'lucide-react';

import { ApiError, apiRequest } from '../auth/client';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../components/ui/alert-dialog';
import type { WorkflowRole } from '../workflow/model';
import {preparationStageFact, stage1ConfirmationFact, stage2PackageFact, type ServerStageFacts} from '../workflow/serverPackageStatus';
import { getStage2PackageCompletion, type Stage2PackageCompletion } from './serverStage2Data';
import { getPackageSurveyProgress, packageSurveyProgressLabel, type PackageSurveyProgress } from './serverStage3Data';
import { PACKAGE_WORKFLOW_ITEMS } from '../workflow/roleNavigation';
import { parsePackageSurveyScopeBatch } from '../workflow/packageSurveyScope';
import { parseDeclaredPackageSurveyScope, type DeclaredPackageSurveyScope, type SurveyCatalogOption } from '../workflow/declaredPackageSurveyScope';
import { saveDeclaredPackageSurveyScope } from '../workflow/declaredPackageSurveyScope';
import { ChecklistPanel } from '../workflow/WorkflowComponents';
import { ServerCalibrationWorkspace } from './ServerCalibrationWorkspace';
import { ServerStage1DirahWorkspace } from './ServerStage1DirahWorkspace';
import { ServerStage2Workspace } from './ServerStage2Workspace';
import { SERVER_STAGE3A, SERVER_STAGE3B } from './serverPackageStageRouting';
import { ServerStage3DailyWorkspace } from './ServerStage3DailyWorkspace';
import { ServerVervalWorkspace } from './ServerVervalWorkspace';
import { ServerStage4Workspace } from './ServerStage4Workspace';
import { ServerAuditWorkspace } from './audit/ServerAuditWorkspace';
import { ServerAcceptanceWorkspace } from './audit/ServerAcceptanceWorkspace';
import { ServerCorrectionWorkspace } from './corrections/ServerCorrectionWorkspace';
import { PackageRoadMembershipPanel } from './PackageRoadMembershipPanel';
import {
  buildChecklistPayload,
  buildContractPatch,
  buildPreparationReviewPayload,
  canEditPackagePreparation,
  canReviewPreparation,
  canSubmitPreparation,
  checklistDraft,
  contractDraft,
  groupChecklistItems,
  mapPreparationChecklist,
  patchChecklistThenRefetch,
  verifyChecklistReadback,
  verifyPreparationTransitionReadback,
  type ChecklistDraft,
  type ContractDraft,
  type ServerChecklist,
  type ServerContract,
  type ServerPreparationDocument,
  type ServerPreparationSubmission,
  type PreparationReviewDecision,
  validatePreparationPdf,
} from './serverPreparation';
import { linkPreparationDocument, uploadPreparationDocument, verifyPreparationDocumentLinkReadback } from './serverPreparationDocuments';
import '../workflow/workflow.css';
import '../workflow/ui09.css';
import { PackageContextHeader, PackageOverview } from '../workflow/PackageHub';
import { OperationalWorkflowWorkspace } from '../workflow/OperationalWorkflowWorkspace';
import { serverDetailToDirahState, type ServerBalaiRow } from './serverPackageView';
import { getStage1Confirmation, type Stage1Confirmation } from './stage1ConfirmationData';
import { PackageScopeAmendmentPanel } from './PackageScopeAmendmentPanel';

const OVERVIEW = '/packages:Ringkasan Paket';
const PREPARATION = '/entry:Persiapan & SPMK';
const CALIBRATION = '/documents:Kalibrasi & personel';
const STAGE2 = '/entry:Validasi produksi';
const CORRECTIONS = '/actions:Koreksi berbukti';
const AUDIT = '/verification:Audit tingkat 1–3';
const ACCEPTANCE = '/reports:Penerimaan & termin';

function display(value: unknown): string {
  return value === null || value === undefined || value === '' ? 'Belum diisi' : String(value);
}

function date(value: string | null): string {
  if (!value) return 'Belum diisi';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC',
      }).format(parsed);
}

function dateTime(value: string | null | undefined): string {
  if (!value) return 'Belum tersedia';
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime())
    ? value
    : new Intl.DateTimeFormat('id-ID', {
        day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit',
      }).format(parsed);
}

function errorMessage(error: unknown, fallback: string): string {
  if (error instanceof ApiError && error.status === 409) {
    return `${error.message} Data mungkin telah berubah. Muat ulang sebelum mencoba lagi.`;
  }
  return error instanceof Error ? error.message : fallback;
}

export function ServerPackageWorkspace({
  packageId,
  role,
  selection,
  onBack,
  onNavigate,
  dirahShell = false,
}: {
  packageId: string;
  role: WorkflowRole;
  selection: string;
  onBack: () => void;
  onNavigate: (selection: string) => void;
  /** Saat aktif, kerangka dan ringkasan memakai komponen asli Dirah; panel tahap tetap data server. */
  dirahShell?: boolean;
}) {
  const [contract, setContract] = useState<ServerContract | null>(null);
  const [contractForm, setContractForm] = useState<ContractDraft | null>(null);
  const [editingContract, setEditingContract] = useState(false);
  const [contractBusy, setContractBusy] = useState(false);
  const [contractMessage, setContractMessage] = useState('');
  const [contractError, setContractError] = useState('');
  const [declaredSurveyScope, setDeclaredSurveyScope] = useState<DeclaredPackageSurveyScope | null>(null);
  const [scopeCatalog, setScopeCatalog] = useState<SurveyCatalogOption[]>([]);
  const [scopeDraftIds, setScopeDraftIds] = useState<number[]>([]);
  const [scopeBusy, setScopeBusy] = useState(false);
  const [scopeError, setScopeError] = useState('');
  const [scopeMessage, setScopeMessage] = useState('');
  const [balaiNames, setBalaiNames] = useState<Record<string, string>>({});
  const [balaiRows, setBalaiRows] = useState<ServerBalaiRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [revision, setRevision] = useState(0);

  const [checklist, setChecklist] = useState<ServerChecklist | null>(null);
  const [answers, setAnswers] = useState<ChecklistDraft>({});
  const [checkLoading, setCheckLoading] = useState(false);
  const [checkBusy, setCheckBusy] = useState(false);
  const [checkError, setCheckError] = useState('');
  const [checkMessage, setCheckMessage] = useState('');
  const [checkRevision, setCheckRevision] = useState(0);
  const [documents, setDocuments] = useState<ServerPreparationDocument[]>([]);
  const [documentLoading, setDocumentLoading] = useState(false);
  const [documentBusy, setDocumentBusy] = useState(false);
  const [documentError, setDocumentError] = useState('');
  const [documentMessage, setDocumentMessage] = useState('');
  const [documentRevision, setDocumentRevision] = useState(0);
  const [reportTitle, setReportTitle] = useState('Laporan Pendahuluan');
  const [reportFile, setReportFile] = useState<File | null>(null);
  const [selectedReportId, setSelectedReportId] = useState('');
  const [submission, setSubmission] = useState<ServerPreparationSubmission | null>(null);
  const [submissionLoading, setSubmissionLoading] = useState(false);
  const [submissionBusy, setSubmissionBusy] = useState(false);
  const [submissionError, setSubmissionError] = useState('');
  const [submissionMessage, setSubmissionMessage] = useState('');
  const [submissionRevision, setSubmissionRevision] = useState(0);
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [reviewDecision, setReviewDecision] = useState<PreparationReviewDecision | null>(null);
  const [reviewNote, setReviewNote] = useState('');
  const [reviewBusy, setReviewBusy] = useState(false);
  const [stage1Confirmation, setStage1Confirmation] = useState<Stage1Confirmation | null>(null);
  const [stage1ConfirmationLoading, setStage1ConfirmationLoading] = useState(false);
  const [stage1ConfirmationError, setStage1ConfirmationError] = useState(false);
  const [stage2Completion, setStage2Completion] = useState<Stage2PackageCompletion | null>(null);
  const [stage2CompletionLoading, setStage2CompletionLoading] = useState(false);
  const [stage2CompletionError, setStage2CompletionError] = useState(false);
  const [serverStageFactsRevision, setServerStageFactsRevision] = useState(0);
  const [stage3aProgress, setStage3aProgress] = useState<PackageSurveyProgress | null>(null);
  const [stage3aProgressLoading, setStage3aProgressLoading] = useState(true);
  const [stage3aProgressError, setStage3aProgressError] = useState(false);

  async function readPreparationState() {
    const [checkResult, submissionResult] = await Promise.all([
      apiRequest<{ data: ServerChecklist }>(`/paket/${encodeURIComponent(packageId)}/checklist-persiapan`),
      apiRequest<{ data: ServerPreparationSubmission }>(`/paket/${encodeURIComponent(packageId)}/pengajuan-persiapan`),
    ]);
    if (String(checkResult.data?.paket_id) !== packageId || String(submissionResult.data?.paket_id) !== packageId || !Array.isArray(checkResult.data.items)) {
      throw new Error('Refetch persiapan tidak sepadan dengan paket aktif.');
    }
    return { checklist: checkResult.data, submission: submissionResult.data };
  }

  async function refetchPreparationState() {
    const state = await readPreparationState();
    const { checklist: latestChecklist, submission: latestSubmission } = state;
    setChecklist(latestChecklist);
    setAnswers(checklistDraft(latestChecklist.items));
    setSubmission(latestSubmission);
    return state;
  }

  useEffect(() => {
    const controller = new AbortController();
    setContract(null);
    setSubmission(null);
    setSubmissionLoading(true);
    setSubmissionError('');
    setLoading(true);
    setError('');
    apiRequest<{ data: ServerContract }>(`/paket/${encodeURIComponent(packageId)}`, {
      signal: controller.signal,
    })
      .then(result => {
        if (controller.signal.aborted) return;
        if (!result.data || String(result.data.paket_id) !== packageId) {
          throw new Error('Identitas paket tidak sesuai dengan permintaan.');
        }
        setContract(result.data);
        setContractForm(contractDraft(result.data));
        apiRequest<{ data: unknown }>(
          `/paket/survey-scope?paket_ids=${encodeURIComponent(packageId)}`,
          { signal: controller.signal },
        ).then(scopeResult => {
          if (controller.signal.aborted) return;
          const scope = parsePackageSurveyScopeBatch(scopeResult.data, [Number(packageId)]).get(Number(packageId));
          if (!scope) throw new Error('Respons scope survei paket tidak lengkap.');
          setContract(current => current && current.paket_id === result.data.paket_id
            ? { ...current, survey_scope: scope, survey_scope_read_status: 'defined' }
            : current);
        }).catch(() => {
          if (!controller.signal.aborted) {
            setContract(current => current && current.paket_id === result.data.paket_id
              ? { ...current, survey_scope: undefined, survey_scope_read_status: 'error' }
              : current);
          }
        });
      })
      .catch(cause => {
        if (!controller.signal.aborted) setError(errorMessage(cause, 'Gagal memuat paket.'));
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });
    return () => controller.abort();
  }, [packageId]);

  useEffect(() => {
    const controller = new AbortController();
    setDeclaredSurveyScope(null);
    setScopeCatalog([]);
    setScopeError('');
    Promise.all([
      apiRequest<{ data: unknown }>(`/paket/${encodeURIComponent(packageId)}/declared-survey-scope`, { signal: controller.signal, cache: 'no-store' }),
      apiRequest<{ data: SurveyCatalogOption[] }>('/jenis-survei', { signal: controller.signal }),
    ]).then(([scopeResponse, catalogResponse]) => {
      if (controller.signal.aborted) return;
      const scope = parseDeclaredPackageSurveyScope(scopeResponse.data, Number(packageId));
      if (!Array.isArray(catalogResponse.data)) throw new Error('Katalog jenis survei tidak sesuai format.');
      setDeclaredSurveyScope(scope);
      setScopeDraftIds(scope.surveys.map(survey => survey.jenis_survei_id));
      setScopeCatalog(catalogResponse.data.filter(survey => survey.aktif === true)
        .sort((a, b) => (a.kode ?? '').localeCompare(b.kode ?? '') || a.jenis_survei_id - b.jenis_survei_id));
    }).catch(cause => {
      if (!controller.signal.aborted) setScopeError(errorMessage(cause, 'Gagal membaca scope kontrak.'));
    });
    return () => controller.abort();
  }, [packageId, revision]);

  useEffect(() => {
    const controller = new AbortController();
    apiRequest<{ data: Array<{ balai_id: number; nama: string; kode: string }> }>('/balai', {
      signal: controller.signal,
    })
      .then(result => {
        if (!controller.signal.aborted) {
          setBalaiRows(result.data);
          setBalaiNames(Object.fromEntries(result.data.map(item => [
            String(item.balai_id), item.nama || item.kode,
          ])));
        }
      })
      .catch(() => {
        // Nama referensi tidak boleh menghalang pembukaan paket yang sah.
      });
    return () => controller.abort();
  }, [packageId, revision]);

  useEffect(() => {
    if (!contract) return;
    const controller = new AbortController();
    setCheckLoading(true);
    setCheckError('');
    setChecklist(null);
    apiRequest<{ data: ServerChecklist }>(
      `/paket/${encodeURIComponent(packageId)}/checklist-persiapan`,
      { signal: controller.signal },
    )
      .then(result => {
        if (controller.signal.aborted) return;
        if (!result.data || String(result.data.paket_id) !== packageId || !Array.isArray(result.data.items)) {
          throw new Error('Respons checklist tidak sesuai.');
        }
        setChecklist(result.data);
        setAnswers(checklistDraft(result.data.items));
      })
      .catch(cause => {
        if (!controller.signal.aborted) {
          setCheckError(errorMessage(cause, 'Checklist belum dapat dimuat.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setCheckLoading(false);
      });
    return () => controller.abort();
  }, [contract, packageId, checkRevision]);

  useEffect(() => {
    if (!contract) return;
    const controller = new AbortController();
    setDocumentLoading(true);
    setDocumentError('');
    apiRequest<{ data: ServerPreparationDocument[] }>(
      `/paket/${encodeURIComponent(packageId)}/dokumen`,
      { signal: controller.signal },
    )
      .then(result => {
        if (controller.signal.aborted) return;
        const rows = Array.isArray(result.data) ? result.data : [];
        setDocuments(rows);
        const reports = rows.filter(item => item.jenis_dokumen?.kode === 'LAPORAN_PENDAHULUAN');
        setSelectedReportId(current => reports.some(item => String(item.dokumen_id) === current)
          ? current
          : reports[0] ? String(reports[0].dokumen_id) : '');
      })
      .catch(cause => {
        if (!controller.signal.aborted) {
          setDocumentError(errorMessage(cause, 'Senarai dokumen belum dapat dimuat.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setDocumentLoading(false);
      });
    return () => controller.abort();
  }, [contract, packageId, documentRevision]);

  useEffect(() => {
    if (!contract) return;
    const controller = new AbortController();
    setSubmissionLoading(true);
    setSubmissionError('');
    apiRequest<{ data: ServerPreparationSubmission }>(
      `/paket/${encodeURIComponent(packageId)}/pengajuan-persiapan`,
      { signal: controller.signal },
    )
      .then(result => {
        if (controller.signal.aborted) return;
        if (!result.data || String(result.data.paket_id) !== packageId) {
          throw new Error('Respons status pengajuan tidak sesuai.');
        }
        setSubmission(result.data);
      })
      .catch(cause => {
        if (!controller.signal.aborted) {
          setSubmissionError(errorMessage(cause, 'Status pengajuan belum dapat dimuat.'));
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) setSubmissionLoading(false);
      });
    return () => controller.abort();
  }, [contract, packageId, submissionRevision]);

  useEffect(() => {
    const handler = (e: Event) => {
      const custom = e as CustomEvent<string>;
      if (custom.detail) onNavigate(custom.detail);
    };
    window.addEventListener('jalamutu:navigate', handler);
    return () => window.removeEventListener('jalamutu:navigate', handler);
  }, [onNavigate]);

  useEffect(() => {
    const controller = new AbortController();
    setStage1Confirmation(null);
    setStage1ConfirmationLoading(true);
    setStage1ConfirmationError(false);
    getStage1Confirmation(packageId, apiRequest, controller.signal)
      .then(value => { if (!controller.signal.aborted) setStage1Confirmation(value); })
      .catch(() => { if (!controller.signal.aborted) setStage1ConfirmationError(true); })
      .finally(() => { if (!controller.signal.aborted) setStage1ConfirmationLoading(false); });
    return () => controller.abort();
  }, [packageId, serverStageFactsRevision]);

  useEffect(() => {
    const controller = new AbortController();
    setStage3aProgress(null);
    setStage3aProgressLoading(true);
    setStage3aProgressError(false);
    getPackageSurveyProgress(packageId, apiRequest, controller.signal)
      .then(progress => {
        if (!controller.signal.aborted) setStage3aProgress(progress);
      })
      .catch(() => {
        if (!controller.signal.aborted) setStage3aProgressError(true);
      })
      .finally(() => {
        if (!controller.signal.aborted) setStage3aProgressLoading(false);
      });
    return () => controller.abort();
  }, [packageId, serverStageFactsRevision]);

  useEffect(() => {
    const controller = new AbortController();
    setStage2Completion(null);
    setStage2CompletionLoading(true);
    setStage2CompletionError(false);
    getStage2PackageCompletion(packageId, apiRequest, controller.signal).then(result => {
      if (!controller.signal.aborted) setStage2Completion(result);
    }).catch(() => {
      if (!controller.signal.aborted) setStage2CompletionError(true);
    }).finally(() => {
      if (!controller.signal.aborted) setStage2CompletionLoading(false);
    });
    return () => controller.abort();
  }, [packageId, serverStageFactsRevision]);

  useEffect(() => {
    const handler = (event: Event) => {
      const detail = (event as CustomEvent<{ packageId?: string }>).detail;
      if (detail?.packageId === packageId) setServerStageFactsRevision(value => value + 1);
    };
    window.addEventListener('jalamutu:package-stage-facts-refresh', handler);
    return () => window.removeEventListener('jalamutu:package-stage-facts-refresh', handler);
  }, [packageId]);

  const editable = contract
    ? canEditPackagePreparation(
      role,
      contract.status,
      submission?.status,
      !!submission && !submissionLoading && !submissionError,
    )
    : false;
  const preparationMapping = checklist ? mapPreparationChecklist(checklist.items) : { mapped: [], gaps: [] };

  async function saveContract(event: FormEvent) {
    event.preventDefault();
    if (!contract || !contractForm || !editable || contractBusy) return;
    setContractError('');
    setContractMessage('');
    let patch: Record<string, string | number | null>;
    try {
      patch = buildContractPatch(contract, contractForm);
    } catch (cause) {
      setContractError(errorMessage(cause, 'Data kontrak tidak valid.'));
      return;
    }
    if (!Object.keys(patch).length) {
      setContractMessage('Tiada perubahan kontrak untuk disimpan.');
      return;
    }
    setContractBusy(true);
    try {
      await apiRequest(`/paket/${encodeURIComponent(packageId)}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      });
      setContractMessage('Perubahan kontrak berjaya disimpan ke server.');
      setEditingContract(false);
      setRevision(value => value + 1);
    } catch (cause) {
      setContractError(errorMessage(cause, 'Gagal menyimpan perubahan kontrak.'));
    } finally {
      setContractBusy(false);
    }
  }

  async function saveSurveyScope() {
    if (!declaredSurveyScope || !editable || scopeBusy) return;
    setScopeError('');
    setScopeMessage('');
    if (!scopeDraftIds.length) {
      setScopeError('Pilih sedikitnya satu jenis survei. Pilihan yang belum disimpan tetap tersedia.');
      return;
    }
    setScopeBusy(true);
    try {
      const saved = await saveDeclaredPackageSurveyScope(
        Number(packageId),
        declaredSurveyScope.version ?? 0,
        scopeDraftIds,
        apiRequest,
      );
      setDeclaredSurveyScope(saved);
      setScopeDraftIds(saved.surveys.map(survey => survey.jenis_survei_id));
      setScopeMessage(`Scope kontrak tersimpan dan dibaca ulang (versi ${saved.version}).`);
      setEditingContract(false);
    } catch (cause) {
      // Preserve checked state after conflicts, dependency refusal, and readback failures.
      setScopeError(errorMessage(cause, 'Gagal menyimpan scope kontrak.'));
    } finally {
      setScopeBusy(false);
    }
  }

  async function saveChecklist() {
    if (!checklist || !editable || checkBusy) return;
    setCheckError('');
    setCheckMessage('');
    setCheckBusy(true);
    try {
      const expectedVersion = checklist.pengisian.versi;
      const payload = buildChecklistPayload(checklist.items, answers);
      const refreshed = await patchChecklistThenRefetch(
        () => apiRequest(`/paket/${encodeURIComponent(packageId)}/checklist-persiapan`, {
          method: 'PATCH',
          body: JSON.stringify({ expected_version: expectedVersion, jawaban: payload }),
        }),
        readPreparationState,
        state => verifyChecklistReadback(state.checklist, expectedVersion, payload),
      );
      setChecklist(refreshed.checklist);
      setAnswers(checklistDraft(refreshed.checklist.items));
      setSubmission(refreshed.submission);
      setCheckMessage('Checklist persiapan berjaya disimpan ke server.');
    } catch (cause) {
      setAnswers(checklistDraft(checklist.items));
      setCheckError(errorMessage(cause, 'Gagal menyimpan checklist persiapan.'));
    } finally {
      setCheckBusy(false);
    }
  }

  async function linkReport(documentId: number, expectedVersion: number) {
    if (!checklist) throw new Error('Checklist belum tersedia.');
    const reportItem = checklist.items.find(item => item.kode === 'DOK-01');
    if (!reportItem) throw new Error('Item Laporan Pendahuluan tidak ditemukan dalam checklist.');
    await apiRequest(`/paket/${encodeURIComponent(packageId)}/checklist-persiapan/bukti`, {
      method: 'PATCH',
      body: JSON.stringify({
        expected_version: expectedVersion,
        item_id: reportItem.item_id,
        bukti_dokumen_id: documentId,
      }),
    });
  }

  async function uploadReport(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!checklist || !editable || documentBusy) return;
    setDocumentError('');
    setDocumentMessage('');
    if (!reportFile) {
      setDocumentError('Pilih satu fail PDF Laporan Pendahuluan.');
      return;
    }
    try {
      validatePreparationPdf(reportFile);
      if (!reportTitle.trim()) throw new Error('Judul dokumen wajib diisi.');
    } catch (cause) {
      setDocumentError(errorMessage(cause, 'Fail tidak valid.'));
      return;
    }
    const form = event.currentTarget;
    const payload = new FormData();
    payload.append('judul', reportTitle.trim());
    payload.append('jenis_dokumen', 'LAPORAN_PENDAHULUAN');
    payload.append('file', reportFile);
    setDocumentBusy(true);
    try {
      const created = await apiRequest<{ data: { dokumen?: { dokumen_id?: number } } }>(
        `/paket/${encodeURIComponent(packageId)}/dokumen`,
        { method: 'POST', body: payload },
      );
      const documentId = Number(created.data?.dokumen?.dokumen_id);
      if (!Number.isSafeInteger(documentId) || documentId < 1) {
        throw new Error('Upload selesai tetapi ID dokumen tidak diterima. Muat ulang senarai dokumen.');
      }
      await linkReport(documentId, checklist.pengisian.versi);
      setDocumentMessage(`Laporan Pendahuluan berjaya di-upload dan ditautkan sebagai Dokumen #${documentId}.`);
      setSelectedReportId(String(documentId));
      setReportFile(null);
      form.reset();
      setCheckRevision(value => value + 1);
      setDocumentRevision(value => value + 1);
    } catch (cause) {
      setDocumentError(errorMessage(cause, 'Gagal upload atau menautkan Laporan Pendahuluan.'));
      setDocumentRevision(value => value + 1);
    } finally {
      setDocumentBusy(false);
    }
  }

  async function linkSelectedReport() {
    if (!checklist || !editable || documentBusy) return;
    const documentId = Number(selectedReportId);
    if (!Number.isSafeInteger(documentId) || documentId < 1) {
      setDocumentError('Pilih Laporan Pendahuluan yang hendak ditautkan.');
      return;
    }
    setDocumentBusy(true);
    setDocumentError('');
    setDocumentMessage('');
    try {
      await linkReport(documentId, checklist.pengisian.versi);
      setDocumentMessage(`Dokumen #${documentId} berjaya ditautkan kepada Laporan Pendahuluan.`);
      setCheckRevision(value => value + 1);
    } catch (cause) {
      setDocumentError(errorMessage(cause, 'Gagal menautkan Laporan Pendahuluan.'));
    } finally {
      setDocumentBusy(false);
    }
  }

  async function submitPreparation() {
    if (!checklist || !contract || submissionBusy) return;
    const reportItem = checklist.items.find(item => item.kode === 'DOK-01');
    if (!canSubmitPreparation(role, contract.status, checklist.pengisian.status, Boolean(reportItem?.bukti_dokumen_id))) {
      setSubmissionError('Pengajuan memerlukan draft Penyedia Jasa dan PDF Laporan Pendahuluan yang sudah ditautkan.');
      setSubmissionDialogOpen(false);
      return;
    }
    setSubmissionBusy(true);
    setSubmissionError('');
    setSubmissionMessage('');
    const expectedVersion = checklist.pengisian.versi;
    try {
      await apiRequest<{ data: ServerPreparationSubmission }>(
        `/paket/${encodeURIComponent(packageId)}/pengajuan-persiapan`,
        {
          method: 'POST',
          body: JSON.stringify({ expected_version: expectedVersion }),
        },
      );
      const refreshed = await readPreparationState();
      verifyPreparationTransitionReadback(refreshed.checklist, refreshed.submission, expectedVersion, 'DIAJUKAN');
      setChecklist(refreshed.checklist);
      setAnswers(checklistDraft(refreshed.checklist.items));
      setSubmission(refreshed.submission);
      setSubmissionMessage(`Persiapan berjaya diajukan kepada PIC Balai. Status disahkan ${refreshed.submission.status} · Versi ${refreshed.submission.versi}.`);
      setSubmissionDialogOpen(false);
      setCheckRevision(value => value + 1);
      setSubmissionRevision(value => value + 1);
    } catch (cause) {
      setSubmissionError(errorMessage(cause, 'Pengajuan gagal atau belum dapat disahkan. Muat ulang status server.'));
      setSubmissionDialogOpen(false);
      try { await refetchPreparationState(); } catch { /* retain the operation/readback error */ }
      setCheckRevision(value => value + 1);
      setSubmissionRevision(value => value + 1);
    } finally {
      setSubmissionBusy(false);
    }
  }

  async function reviewPreparation() {
    if (!submission || !contract || !reviewDecision || reviewBusy) return;
    if (!canReviewPreparation(role, contract.status, submission.status)) {
      setSubmissionError('Semakan hanya tersedia kepada PIC Balai ketika status persiapan DIAJUKAN.');
      setReviewDecision(null);
      return;
    }
    let payload: ReturnType<typeof buildPreparationReviewPayload>;
    try {
      payload = buildPreparationReviewPayload(submission.versi, reviewDecision, reviewNote);
    } catch (cause) {
      setSubmissionError(errorMessage(cause, 'Keputusan semakan tidak valid.'));
      setReviewDecision(null);
      return;
    }
    setReviewBusy(true);
    setSubmissionError('');
    setSubmissionMessage('');
    const expectedVersion = submission.versi;
    try {
      await apiRequest<{ data: ServerPreparationSubmission }>(
        `/paket/${encodeURIComponent(packageId)}/pengajuan-persiapan/review`,
        { method: 'POST', body: JSON.stringify(payload) },
      );
      const refreshed = await readPreparationState();
      verifyPreparationTransitionReadback(refreshed.checklist, refreshed.submission, expectedVersion, reviewDecision, reviewDecision);
      setChecklist(refreshed.checklist);
      setAnswers(checklistDraft(refreshed.checklist.items));
      setSubmission(refreshed.submission);
      setSubmissionMessage(reviewDecision === 'DISETUJUI'
        ? `Persiapan berjaya disetujui. Keputusan disahkan server · Versi ${refreshed.submission.versi}.`
        : `Persiapan dikembalikan kepada Penyedia Jasa. Keputusan revisi disahkan server · Versi ${refreshed.submission.versi}.`);
      setReviewDecision(null);
      setReviewNote('');
      setCheckRevision(value => value + 1);
      setSubmissionRevision(value => value + 1);
    } catch (cause) {
      setSubmissionError(errorMessage(cause, 'Keputusan PIC gagal atau belum dapat disahkan. Muat ulang status server.'));
      setReviewDecision(null);
      try { await refetchPreparationState(); } catch { /* retain the operation/readback error */ }
      setCheckRevision(value => value + 1);
      setSubmissionRevision(value => value + 1);
    } finally {
      setReviewBusy(false);
    }
  }

  async function reviewPreparationFromDirah(decision: PreparationReviewDecision) {
    if (!submission || !contract || reviewBusy || !canReviewPreparation(role, contract.status, submission.status)) return;
    setReviewBusy(true); setSubmissionError(''); setSubmissionMessage('');
    try {
      const expectedVersion = submission.versi;
      const payload = buildPreparationReviewPayload(submission.versi, decision, reviewNote);
      await apiRequest(`/paket/${encodeURIComponent(packageId)}/pengajuan-persiapan/review`, {
        method: 'POST', body: JSON.stringify(payload),
      });
      const refreshed = await refetchPreparationState();
      verifyPreparationTransitionReadback(refreshed.checklist, refreshed.submission, expectedVersion, decision, decision);
      setSubmissionMessage(decision === 'DISETUJUI'
        ? `Persiapan berjaya disetujui · keputusan disahkan semula (${refreshed.submission.status}).`
        : `Persiapan dikembalikan untuk revisi · keputusan disahkan semula (${refreshed.submission.status}).`);
    } catch (cause) {
      setSubmissionError(errorMessage(cause, 'Keputusan PIC gagal atau belum dapat disahkan. Muat ulang status.'));
      try { await refetchPreparationState(); } catch { /* retain original operation/refetch error */ }
    } finally { setReviewBusy(false); }
  }

  const back = (
    <button type="button" className="wf-button" onClick={onBack}>
      <ArrowLeft size={14} /> Daftar paket
    </button>
  );
  if (loading) {
    return (
      <div className="package-detail-page" data-testid="server-package-loading">
        <div style={{ marginBottom: 16 }}>{back}</div>
        <div className="wf-panel" style={{ padding: '32px 24px', textAlign: 'center' }}>
          <RefreshCw className="animate-spin" size={24} style={{ margin: '0 auto 12px', color: '#0284c7' }} />
          <p role="status" style={{ margin: 0, fontWeight: 500 }}>Memuat workspace paket…</p>
        </div>
      </div>
    );
  }
  if (error || !contract) {
    return (
      <div className="package-detail-page" data-testid="server-package-error">
        <div style={{ marginBottom: 16 }}>{back}</div>
        <div role="alert" className="wf-callout danger" style={{ padding: '16px 20px' }}>
          <p style={{ margin: '0 0 12px' }}>{error || 'Paket tidak tersedia atau Anda tidak memiliki akses.'}</p>
          <button type="button" className="wf-button primary" onClick={() => setRevision(value => value + 1)}>
            <RefreshCw size={13} /> Coba lagi
          </button>
        </div>
      </div>
    );
  }

  const balai = contract.balai_id === null
    ? 'Balai belum ditetapkan'
    : balaiNames[String(contract.balai_id)] || `Balai #${contract.balai_id}`;
  const stageItem = PACKAGE_WORKFLOW_ITEMS.find(item => item.selection === selection);
  const connected = selection === OVERVIEW || selection === PREPARATION || selection === CALIBRATION;
  const checklistGroups = checklist ? groupChecklistItems(checklist.items) : [];
  const checklistIcons = [BookOpen, MapPinned, Activity, FileCheck2];
  const reportItem = checklist?.items.find(item => item.kode === 'DOK-01');
  const reportDocuments = documents.filter(item => item.jenis_dokumen?.kode === 'LAPORAN_PENDAHULUAN');
  const linkedReport = reportDocuments.find(item => item.dokumen_id === reportItem?.bukti_dokumen_id);
  const canSubmit = canSubmitPreparation(
    role,
    contract.status,
    checklist?.pengisian.status,
    Boolean(reportItem?.bukti_dokumen_id),
  );
  const canReview = canReviewPreparation(role, contract.status, submission?.status);
  const serverStageStatuses: ServerStageFacts = {
    'Tahap 0': preparationStageFact({
      submissionStatus: submission?.status,
      checklistStatus: checklist?.pengisian.status,
      loading: checkLoading || submissionLoading,
      error: Boolean(checkError || submissionError),
    }),
    'Tahap 1': stage1ConfirmationFact({
      active: stage1Confirmation?.aktif,
      status: stage1Confirmation?.status,
      snapshotMatches: stage1Confirmation?.snapshot_sesuai,
      stage2Allowed: stage1Confirmation?.stage2_allowed,
      loading: stage1ConfirmationLoading,
      error: stage1ConfirmationError,
    }),
    'Tahap 2': stage2PackageFact({
      completion: stage2Completion,
      loading: stage2CompletionLoading,
      error: stage2CompletionError,
    }),
    'Tahap 3A': {
      state: stage3aProgressLoading || stage3aProgressError || !stage3aProgress
        ? 'unknown'
        : stage3aProgress.sessionCount > 0 ? 'pending' : 'unknown',
      label: packageSurveyProgressLabel(stage3aProgress, stage3aProgressLoading, stage3aProgressError),
    },
  };
  const stageStatus = (code: string) => code === 'Tahap 0'
    ? checklist
      ? `${checklist.pengisian.status} · ${checklist.ringkasan.jumlah_terjawab}/${checklist.ringkasan.jumlah_item} terjawab`
      : checkLoading ? 'Memuat checklist' : 'Checklist belum tersedia'
    : code === 'Tahap 1'
      ? serverStageStatuses['Tahap 1']?.label ?? 'Belum diverifikasi'
      : code === 'Tahap 2'
        ? serverStageStatuses['Tahap 2']?.label ?? 'Status selesai Tahap 2 belum tersedia'
        : 'Data tahap belum terhubung';
  const dirahPackageState = serverDetailToDirahState(
    contract,
    balaiRows,
    role,
    declaredSurveyScope ?? undefined,
    declaredSurveyScope ? undefined : scopeError ? 'error' : 'loading',
  );
  const info: Array<[string, string]> = [
    ['Nomor kontrak', display(contract.nomor_kontrak)],
    ['Balai', balai],
    ['Tahun anggaran', display(contract.tahun_anggaran)],
    ['Nama PPK', display(contract.nama_ppk)],
    ['Tanggal SPMK', date(contract.tgl_spmk)],
    ['Tanggal selesai', date(contract.tgl_selesai)],
    ['Nilai kontrak', contract.nilai_kontrak === null
      ? 'Belum diisi'
      : Number.isFinite(Number(contract.nilai_kontrak))
        ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR' }).format(Number(contract.nilai_kontrak))
        : display(contract.nilai_kontrak)],
    ['Batas laporan pendahuluan', date(contract.batas_lap_pendahuluan)],
    ['ID penyedia', display(contract.penyedia_id)],
    ['Jenis survei kontrak', declaredSurveyScope?.state === 'defined'
      ? declaredSurveyScope.surveys.map(survey => survey.kode || survey.nama || `Survei #${survey.jenis_survei_id}`).join(', ')
      : declaredSurveyScope?.state === 'unset' ? 'Belum ditetapkan' : scopeError ? 'Tidak dapat dibaca' : 'Memuat'],
  ];
  const scopeOptions = [...new Map([
    ...scopeCatalog,
    ...(declaredSurveyScope?.surveys ?? []),
  ].map(item => [item.jenis_survei_id, item])).values()]
    .sort((a, b) => (a.kode ?? '').localeCompare(b.kode ?? '') || a.jenis_survei_id - b.jenis_survei_id);
  const contractPanel = (
    <section className="wf-panel">
      <div className="wf-panel-head">
        <h3><FileText size={14} /> Informasi paket dan kontrak</h3>
        {editable && !editingContract && <button type="button" className="wf-button" onClick={() => { setContractError(''); setContractMessage(''); setScopeError(''); setScopeMessage(''); setScopeDraftIds(declaredSurveyScope?.surveys.map(survey => survey.jenis_survei_id) ?? []); setEditingContract(true); }}><Pencil size={13} /> Edit kontrak & scope survei</button>}
      </div>
      <div className="wf-body package-context-grid">
        {info.map(([label, value]) => <div key={label} style={{ minWidth: 0, overflowWrap: 'anywhere' }}><small>{label}</small><strong>{value}</strong></div>)}
      </div>
      {scopeMessage && <p role="status" className="wf-callout">{scopeMessage}</p>}
      <PackageScopeAmendmentPanel
        packageId={packageId}
        role={role}
        preparationStatus={submission?.status}
        catalog={scopeCatalog}
      />
    </section>
  );
  const contractEditor = editingContract && contractForm && (
    <section className="wf-panel">
      <div className="wf-panel-head"><h3><Pencil size={14} /> Edit paket dan jenis survei kontrak</h3><span className="wf-note">Pilihan scope terpisah dari lokasi dan tim</span></div>
      <form className="wf-body" onSubmit={saveContract}>
        <div className="wf-fields">
          <div className="wf-field full"><label htmlFor="server-package-name">Nama paket</label><input id="server-package-name" required maxLength={255} value={contractForm.nama_paket} onChange={event => setContractForm({ ...contractForm, nama_paket: event.target.value })} /></div>
          <div className="wf-field"><label htmlFor="server-contract-number">Nomor kontrak</label><input id="server-contract-number" required maxLength={100} value={contractForm.nomor_kontrak} onChange={event => setContractForm({ ...contractForm, nomor_kontrak: event.target.value })} /></div>
          <div className="wf-field"><label htmlFor="server-budget-year">Tahun anggaran</label><input id="server-budget-year" type="number" min="2000" max="2100" required value={contractForm.tahun_anggaran} onChange={event => setContractForm({ ...contractForm, tahun_anggaran: event.target.value })} /></div>
          <div className="wf-field"><label htmlFor="server-ppk">Nama PPK</label><input id="server-ppk" maxLength={255} value={contractForm.nama_ppk} onChange={event => setContractForm({ ...contractForm, nama_ppk: event.target.value })} /></div>
          <div className="wf-field"><label htmlFor="server-spmk-date">Tanggal SPMK</label><input id="server-spmk-date" type="date" value={contractForm.tgl_spmk} onChange={event => setContractForm({ ...contractForm, tgl_spmk: event.target.value })} /></div>
        </div>
        {contractError && <p role="alert" className="wf-callout danger">{contractError}</p>}
        <div className="wf-toolbar" style={{ marginTop: 12 }}>
          <button type="submit" className="wf-button primary" disabled={contractBusy}><Save size={13} /> {contractBusy ? 'Menyimpan…' : 'Simpan kontrak'}</button>
          <button type="button" className="wf-button" disabled={contractBusy || scopeBusy} onClick={() => { setContractForm(contractDraft(contract)); setScopeDraftIds(declaredSurveyScope?.surveys.map(survey => survey.jenis_survei_id) ?? []); setEditingContract(false); setContractError(''); setScopeError(''); }}>Batal</button>
        </div>
        <fieldset className="scope-editor">
          <legend>Jenis survei dalam paket</legend>
          <p className="wf-note">Jenis survei yang dinyatakan dalam kontrak. Tidak disimpulkan dari ruas, lokasi, tim, atau kalibrasi.</p>
          {scopeError && <p role="alert" className="wf-callout danger">{scopeError}</p>}
          {declaredSurveyScope && <div className="survey-selection-options">
            {scopeOptions.map(item => <label key={item.jenis_survei_id} className="survey-selection-option">
              <input type="checkbox" checked={scopeDraftIds.includes(item.jenis_survei_id)}
                disabled={scopeBusy || (item.aktif === false && !scopeDraftIds.includes(item.jenis_survei_id))}
                onChange={event => setScopeDraftIds(current => event.target.checked
                  ? [...new Set([...current, item.jenis_survei_id])].sort((a, b) => a - b)
                  : current.filter(id => id !== item.jenis_survei_id))} />
              <span><strong>{item.kode || `Survei #${item.jenis_survei_id}`}</strong>{item.nama && <small>{item.nama}{item.aktif === false ? ' · nonaktif (pilihan lama)' : ''}</small>}</span>
            </label>)}
          </div>}
          {!declaredSurveyScope && <p role="status">{scopeError || 'Memuat scope kontrak dari server…'}</p>}
          {declaredSurveyScope?.state === 'unset' && <p className="wf-note">Scope lama belum ditetapkan. Pilihan baru hanya disimpan setelah Anda memilih dan menekan Simpan scope.</p>}
          <div className="wf-toolbar" style={{ marginTop: 10 }}>
            <button type="button" className="wf-button primary" disabled={!editable || scopeBusy || !declaredSurveyScope || !scopeDraftIds.length || !scopeOptions.length} onClick={() => void saveSurveyScope()}>
              <Save size={13} /> {scopeBusy ? 'Menyimpan dan membaca ulang…' : 'Simpan scope'}
            </button>
          </div>
        </fieldset>
      </form>
    </section>
  );

  const shell = (
    <section className="package-context compact-context">
      <div className="package-context-top">{back}<span className="wf-status info">{contract.status}</span><span className="wf-note">{role} · Paket #{contract.paket_id}</span></div>
      <div className="package-identity"><div style={{ minWidth: 0, overflowWrap: 'anywhere' }}><div className="eyebrow">{contract.nomor_kontrak || `Paket #${contract.paket_id}`}</div><h1>{contract.nama_paket}</h1><p>{balai} · Tahun {display(contract.tahun_anggaran)} · SPMK {date(contract.tgl_spmk)}</p></div>
        <div className="package-context-actions"><button className="wf-button" onClick={() => onNavigate(OVERVIEW)}>Ringkasan</button><button className="wf-button" onClick={() => onNavigate('/documents:BA & dokumen workflow')}><FileText size={14} /> Dokumen & BA</button><button className="wf-button" onClick={() => onNavigate('/actions:Koreksi berbukti')}><ShieldCheck size={14} /> Tindak lanjut</button></div>
      </div>
      <details className="package-identity-detail"><summary>Identitas kontrak dan lingkup</summary><div className="package-context-grid">{info.map(([label, value]) => <div key={label}><small>{label}</small><strong>{value}</strong></div>)}</div><p className="wf-note">Nama penyedia, satker, ruas, dan jenis survei belum tersedia dari sambungan ini.</p></details>
      <label className="package-stage-picker">Tahap yang dibuka<select aria-label="Tahap paket yang dibuka" value={stageItem ? selection : ''} onChange={event => { if (event.target.value) onNavigate(event.target.value); }}><option value="">{selection === OVERVIEW ? 'Ringkasan paket' : 'Dokumen dan kegiatan pendukung'}</option>{PACKAGE_WORKFLOW_ITEMS.map(item => <option key={item.code} value={item.selection}>{item.code} · {item.shortLabel}</option>)}</select></label>
    </section>
  );

  const preparationDialogs = (
    <>
      <AlertDialog open={submissionDialogOpen} onOpenChange={setSubmissionDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Ajukan persiapan kepada PIC Balai?</AlertDialogTitle>
            <AlertDialogDescription>
              Checklist versi {checklist?.pengisian.versi ?? '-'} dan Laporan Pendahuluan akan disimpan sebagai snapshot. Selepas dihantar, isian dikunci sehingga PIC memberikan keputusan.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submissionBusy}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={submissionBusy} onClick={event => { event.preventDefault(); void submitPreparation(); }}>
              {submissionBusy ? 'Mengajukan…' : 'Ya, ajukan sekarang'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      <AlertDialog open={reviewDecision !== null} onOpenChange={open => { if (!open && !reviewBusy) setReviewDecision(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{reviewDecision === 'DISETUJUI' ? 'Setujui persiapan ini?' : 'Kembalikan untuk revisi?'}</AlertDialogTitle>
            <AlertDialogDescription>
              Keputusan akan disimpan untuk pengajuan #{submission?.pengajuan?.pengajuan_id ?? '-'} menggunakan versi {submission?.versi ?? '-'}. {reviewDecision === 'DISETUJUI'
                ? 'Persiapan akan dikunci sebagai DISETUJUI.'
                : 'Penyedia Jasa akan dapat mengubah checklist dan menghantar semula selepas revisi.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {reviewNote.trim() && <div className="wf-callout"><strong>Catatan PIC</strong><div>{reviewNote.trim()}</div></div>}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={reviewBusy}>Batal</AlertDialogCancel>
            <AlertDialogAction disabled={reviewBusy} onClick={event => { event.preventDefault(); void reviewPreparation(); }}>
              {reviewBusy ? 'Menyimpan…' : reviewDecision === 'DISETUJUI' ? 'Ya, setujui' : 'Ya, minta revisi'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );

  const preparationNextAction = submissionLoading
    ? { title: 'Memeriksa status persiapan', detail: 'Status terbaru sedang dibaca dari server.', label: 'Buka persiapan', selection: PREPARATION }
    : submissionError
    ? { title: 'Status persiapan belum dapat dimuat', detail: 'Buka persiapan untuk memuat ulang status dan melihat detail.', label: 'Buka persiapan', selection: PREPARATION }
      : submission?.status === 'DISETUJUI'
        ? { title: 'Persiapan disetujui', detail: 'Lanjutkan ke data personel, peralatan dan kalibrasi.', label: 'Lanjut ke Tahap 1', selection: CALIBRATION }
        : submission?.status === 'DIAJUKAN'
          ? { title: 'Menunggu pemeriksaan PIC Balai', detail: 'Pemeriksaan sedang berjalan. Buka pengajuan untuk melihat status dan keputusan.', label: 'Lihat pengajuan', selection: PREPARATION }
          : submission?.status === 'PERLU_REVISI'
            ? { title: 'Persiapan perlu diperbaiki', detail: 'Buka checklist, perbaiki catatan yang diminta, lalu ajukan kembali.', label: 'Buka revisi', selection: PREPARATION }
            : { title: 'Lengkapi persiapan paket', detail: 'Isi dan simpan checklist persiapan pada server.', label: 'Buka persiapan', selection: PREPARATION };

  const content = (
    <>
    {!dirahShell && selection !== STAGE2 && selection !== CALIBRATION && <div className="wf-callout">Tahap 0 dan bacaan data Tahap 1 menggunakan server. Borang pengurusan Tahap 1 serta tahap berikutnya akan disambungkan secara bertahap.</div>}
    {contractMessage && <p role="status" className="wf-callout">{contractMessage}</p>}

    {selection === OVERVIEW ? <div className="package-overview">
      <section className="package-next-action"><div className="package-next-icon"><ArrowRight size={18} /></div><div className="package-next-copy"><small>WORKSPACE PAKET</small><strong>{preparationNextAction.title}</strong><span>{preparationNextAction.detail}</span></div><button type="button" className="wf-button primary" disabled={submissionLoading} onClick={() => onNavigate(preparationNextAction.selection)}>{preparationNextAction.label} <ArrowRight size={13} /></button></section>
      <div className="wf-kpis">{[
        ['Status paket', contract.status],
        ['Checklist terjawab', checklist ? `${checklist.ringkasan.jumlah_terjawab}/${checklist.ringkasan.jumlah_item}` : checkLoading ? 'Memuat…' : 'Belum tersedia'],
        ['Keterisian checklist', checklist?.ringkasan.persen_terisi === undefined ? 'Belum tersedia' : `${checklist.ringkasan.persen_terisi}%`],
        ['Progres keseluruhan', 'Belum terhubung'],
      ].map(([label, value]) => <div className="wf-kpi" key={label}><div className="wf-kpi-label">{label}</div><div className="wf-kpi-value" style={{ fontSize: 16 }}>{value}</div></div>)}</div>
      <section className="wf-panel"><div className="wf-panel-head"><h3><ClipboardList size={14} /> Progres QA/QC Paket</h3></div><div className="wf-body"><div className="package-flow-list">{PACKAGE_WORKFLOW_ITEMS.map(item => <button type="button" className="package-flow-row" key={item.code} aria-label={item.label} onClick={() => onNavigate(item.selection)}><div className="package-flow-icon"><span>{item.code.replace('Tahap ', '')}</span></div><div className="package-flow-copy"><small>{item.code}</small><strong>{item.label}</strong><span>{item.actorHint}</span></div><div className="package-flow-status">{stageStatus(item.code)}</div></button>)}</div></div></section>
       {contractPanel}
       <PackageRoadMembershipPanel packageId={packageId} role={role} />
       {contractEditor}
    </div> : selection === PREPARATION ? <div className="wf" data-testid="server-preparation-workspace">
      <div className="wf-title"><h2>Survei Pendahuluan & Persiapan QA/QC</h2><p>Identitas kontrak dan checklist persiapan paket.</p></div>
      {contractPanel}
      {contractEditor}
      {checkLoading && <p role="status">Memuat checklist persiapan…</p>}
      {checklist && !checkLoading && <section className="wf-panel">
        <div className="wf-panel-head"><h3><ClipboardList size={14} /> Checklist persiapan</h3><span>{checklist.pengisian.status} · Versi {checklist.pengisian.versi}</span></div>
        <div className="wf-body">
          <p>{checklist.items.filter(item => item.jawaban === 'Ya').length} dari {checklist.ringkasan.jumlah_item} item siap. Centang item yang sudah lengkap, kemudian tekan <strong>Simpan checklist</strong>.</p>
          {!editable && <div className="stage-readonly-note">Mode baca sahaja untuk role atau status semasa ini. Backend tetap menjadi pengawal akses terakhir.</div>}
          {!checklist.items.length ? <p>Belum ada item checklist.</p> : <div className="wf-grid equal" style={{ marginTop: 12 }}>
            {checklistGroups.map((group, groupIndex) => <ChecklistPanel
              key={group.title}
              title={group.title}
              icon={checklistIcons[groupIndex] ?? FileCheck2}
              items={group.items.map((item, itemIndex) => {
                const draft = answers[item.item_id] ?? { jawaban: item.jawaban, keterangan: item.keterangan ?? '' };
                return {
                  id: `server-preparation-${item.kode || item.item_id}`,
                  label: item.uraian || `Item checklist #${itemIndex + 1}`,
                  checked: draft.jawaban === 'Ya',
                  disabled: !editable || checkBusy,
                };
              })}
              onChange={(controlId, checked) => {
                const item = group.items.find(candidate => `server-preparation-${candidate.kode || candidate.item_id}` === controlId);
                if (!item || !editable || checkBusy) return;
                setAnswers(current => {
                  const draft = current[item.item_id] ?? { jawaban: item.jawaban, keterangan: item.keterangan ?? '' };
                  return { ...current, [item.item_id]: { ...draft, jawaban: checked ? 'Ya' : null } };
                });
              }}
            />)}
          </div>}
          {checkError && <div role="alert" className="wf-callout danger" style={{ marginTop: 12 }}>{checkError}</div>}
          {checkMessage && <div role="status" className="wf-callout" style={{ marginTop: 12 }}>{checkMessage}</div>}
          <div className="wf-toolbar" style={{ marginTop: 12 }}>
            {editable && <button type="button" className="wf-button primary" disabled={checkBusy || !checklist.items.length} onClick={() => void saveChecklist()}><Save size={13} /> {checkBusy ? 'Menyimpan…' : 'Simpan checklist'}</button>}
            <button type="button" className="wf-button" disabled={checkBusy || checkLoading} onClick={() => { setCheckMessage(''); setCheckError(''); setCheckRevision(value => value + 1); }}><RefreshCw size={13} /> Muat ulang</button>
          </div>
        </div>
      </section>}
      {checklist && !checkLoading && <section className="wf-panel">
        <div className="wf-panel-head">
          <h3><FileText size={14} /> Laporan Pendahuluan</h3>
          <span className={`wf-status ${reportItem?.bukti_dokumen_id ? 'ok' : 'warn'}`}>
            {reportItem?.bukti_dokumen_id ? 'Sudah ditautkan' : 'Belum ditautkan'}
          </span>
        </div>
        <div className="wf-body">
          <p className="wf-note">PDF Laporan Pendahuluan wajib di-upload dan ditautkan sebelum persiapan boleh diajukan kepada PIC Balai. Maksimum 10 MB.</p>
          {documentLoading && <p role="status">Memuat senarai dokumen…</p>}
          {reportItem?.bukti_dokumen_id && <div className="wf-callout">
            <strong>{linkedReport?.judul || `Dokumen #${reportItem.bukti_dokumen_id}`}</strong>
            <div>{linkedReport
              ? `Dokumen #${linkedReport.dokumen_id} · Versi ${linkedReport.versi_aktif}${linkedReport.dokumen_versi?.[0]?.nama_file ? ` · ${linkedReport.dokumen_versi[0].nama_file}` : ''}`
              : `Dokumen #${reportItem.bukti_dokumen_id} sedang dimuat atau tidak ditemukan dalam senarai.`}</div>
          </div>}
          {editable && <form onSubmit={uploadReport}>
            <div className="wf-fields">
              <div className="wf-field">
                <label htmlFor="server-report-title">Judul dokumen</label>
                <input id="server-report-title" maxLength={255} required disabled={documentBusy} value={reportTitle} onChange={event => setReportTitle(event.target.value)} />
              </div>
              <div className="wf-field">
                <label htmlFor="server-report-file">Fail PDF</label>
                <input id="server-report-file" type="file" accept="application/pdf,.pdf" required disabled={documentBusy} onChange={event => setReportFile(event.target.files?.[0] ?? null)} />
              </div>
            </div>
            <div className="wf-toolbar" style={{ marginTop: 12 }}>
              <button type="submit" className="wf-button primary" disabled={documentBusy || !reportFile}>{documentBusy ? 'Meng-upload…' : 'Upload & tautkan PDF'}</button>
            </div>
          </form>}
          {editable && reportDocuments.length > 0 && <div className="wf-toolbar" style={{ marginTop: 12 }}>
            <label className="wf-field" style={{ minWidth: 260, flex: 1 }}>
              <span>Atau tautkan Laporan Pendahuluan yang sudah di-upload</span>
              <select disabled={documentBusy} value={selectedReportId} onChange={event => setSelectedReportId(event.target.value)}>
                {reportDocuments.map(item => <option key={item.dokumen_id} value={item.dokumen_id}>Dokumen #{item.dokumen_id} · {item.judul} · Versi {item.versi_aktif}</option>)}
              </select>
            </label>
            <button type="button" className="wf-button" disabled={documentBusy || !selectedReportId || Number(selectedReportId) === reportItem?.bukti_dokumen_id} onClick={() => void linkSelectedReport()}>Tautkan pilihan</button>
          </div>}
          {documentError && <div role="alert" className="wf-callout danger" style={{ marginTop: 12 }}>{documentError}</div>}
          {documentMessage && <div role="status" className="wf-callout" style={{ marginTop: 12 }}>{documentMessage}</div>}
        </div>
      </section>}
      {checklist && !checkLoading && <section className="wf-panel">
        <div className="wf-panel-head">
          <h3><Send size={14} /> Pengajuan kepada PIC Balai</h3>
          <span className={`wf-status ${submission?.status === 'DISETUJUI' ? 'ok' : submission?.status === 'DIAJUKAN' ? 'info' : submission?.status === 'PERLU_REVISI' ? 'warn' : ''}`}>
            {submissionLoading ? 'Memuat…' : submission?.status || checklist.pengisian.status}
          </span>
        </div>
        <div className="wf-body">
          <p>Pengajuan akan menyimpan snapshot checklist dan dokumen, kemudian mengunci persiapan sementara menunggu semakan PIC Balai.</p>
          <div className="wf-callout">
            <strong>Semakan manual PIC</strong>
            <div>Backend mewajibkan Laporan Pendahuluan yang sah. Kelengkapan semua checkbox belum divalidasi secara automatik pada tahap ini.</div>
          </div>
          {submission?.pengajuan && <div className="package-context-grid" style={{ marginTop: 12 }}>
            <div><small>ID pengajuan</small><strong>#{submission.pengajuan.pengajuan_id}</strong></div>
            <div><small>Diajukan pada</small><strong>{dateTime(submission.pengajuan.diajukan_pada)}</strong></div>
            <div><small>Versi semasa</small><strong>{submission.versi}</strong></div>
          </div>}
          {submission?.review && <div className="wf-callout" style={{ marginTop: 12 }}>
            <strong>Keputusan PIC: {submission.review.keputusan}</strong>
            <div>{submission.review.catatan || 'Tiada catatan semakan.'}</div>
            <div className="wf-note">Disemak pada {dateTime(submission.review.waktu)} · Pengguna #{submission.review.pengguna_id}</div>
          </div>}
          {canReview && <div style={{ marginTop: 12 }}>
            <label className="wf-field">
              <span>Catatan PIC Balai {reviewNote.length}/2000</span>
              <textarea
                rows={4}
                maxLength={2000}
                disabled={reviewBusy}
                placeholder="Wajib untuk Minta Revisi; opsional untuk Setujui."
                value={reviewNote}
                onChange={event => setReviewNote(event.target.value)}
              />
            </label>
          </div>}
          {submissionError && <div role="alert" className="wf-callout danger" style={{ marginTop: 12 }}>{submissionError}</div>}
          {submissionMessage && <div role="status" className="wf-callout" style={{ marginTop: 12 }}>{submissionMessage}</div>}
          <div className="wf-toolbar" style={{ marginTop: 12 }}>
            {canSubmit && <button type="button" className="wf-button primary" disabled={submissionBusy || submissionLoading} onClick={() => setSubmissionDialogOpen(true)}><Send size={13} /> {submissionBusy ? 'Mengajukan…' : 'Ajukan kepada PIC Balai'}</button>}
            {canReview && <button type="button" className="wf-button primary" disabled={reviewBusy || submissionLoading} onClick={() => { setSubmissionError(''); setReviewDecision('DISETUJUI'); }}><CheckCircle2 size={13} /> Setujui persiapan</button>}
            {canReview && <button type="button" className="wf-button" disabled={reviewBusy || submissionLoading || !reviewNote.trim()} onClick={() => { setSubmissionError(''); setReviewDecision('PERLU_REVISI'); }}><RotateCcw size={13} /> Minta revisi</button>}
            {!canSubmit && !submissionLoading && checklist.pengisian.status === 'DRAFT' && !reportItem?.bukti_dokumen_id && <span className="wf-note">Tautkan PDF Laporan Pendahuluan untuk mengaktifkan tombol pengajuan.</span>}
            <button type="button" className="wf-button" disabled={submissionBusy || submissionLoading} onClick={() => { setSubmissionError(''); setSubmissionMessage(''); setSubmissionRevision(value => value + 1); }}><RefreshCw size={13} /> Muat ulang status</button>
          </div>
        </div>
      </section>}
      {preparationDialogs}
    </div> : selection === CALIBRATION ? <ServerStage1DirahWorkspace
      packageId={packageId}
      role={role}
      state={dirahPackageState}
      onNavigate={onNavigate}
      preparationStatus={submission?.status ?? null}
      /> : selection === STAGE2 ? <ServerStage2Workspace packageId={packageId} role={role} onNavigate={onNavigate} /> : selection === SERVER_STAGE3A ? <section aria-label="Pelaksanaan Survei Tahap 3A" data-testid="server-stage3a-workspace"><ServerStage3DailyWorkspace packageId={packageId} role={role} onNavigate={onNavigate} /></section> : selection === SERVER_STAGE3B ? <ServerVervalWorkspace packageId={packageId} role={role} onNavigate={onNavigate} /> : selection === '/entry:Gerbang RNI/LRS' ? <ServerStage4Workspace packageId={packageId} role={role} /> : selection === AUDIT ? <ServerAuditWorkspace packageId={packageId} role={role} onNavigate={onNavigate} /> : selection === ACCEPTANCE ? <ServerAcceptanceWorkspace packageId={packageId} role={role} onNavigate={onNavigate} /> : selection === CORRECTIONS ? <ServerCorrectionWorkspace packageId={packageId} role={role} correctionId={new URLSearchParams(window.location.search).get('koreksi')} onBack={() => window.location.assign('/actions')} /> : <section className="wf-panel"><div className="wf-panel-head"><h3>{stageItem?.label || selection.split(':')[1] || 'Workspace paket'}</h3></div><div className="wf-body"><p>{stageItem?.actorHint}</p><p>Data dan formulir bagian ini belum terhubung ke server. Status dan isian paket belum dapat ditampilkan di sini.</p><button className="wf-button" onClick={() => onNavigate(OVERVIEW)}>Kembali ke ringkasan</button></div></section>}
    {connected && checkError && !checklist && <div role="alert" className="wf-callout"><p>Checklist persiapan: {checkError}</p><button className="wf-button" onClick={() => setCheckRevision(value => value + 1)}>Coba muat checklist lagi</button></div>}
    </>
  );

  // Shell Dirah: kerangka dan ringkasan memakai komponen asli Dirah.
  // Panel tahap tetap sumber integrasi server yang sudah berjalan (task 7).
  if (dirahShell) {
    const dirahState = dirahPackageState;
    const onCorrections = () => onNavigate('/actions:Koreksi berbukti');
    const stageOne = selection === CALIBRATION || selection === STAGE2 || selection === SERVER_STAGE3A || selection === SERVER_STAGE3B;
    const preparationStatus = checklist
      ? `Tahap 0 menggunakan jawaban checklist server (${checklist.pengisian.status}, versi ${checklist.pengisian.versi}).`
      : checkLoading ? 'Memuat status checklist persiapan dari server…' : 'Status checklist server belum tersedia.';
    const readOnlyNote = selection === PREPARATION
      ? `${preparationStatus} Jawapan disimpan melalui API server oleh Penyedia apabila paket dan checklist masih terbuka.`
      : 'Belum terhubung ke server. Data/status tahap belum dimuat; nilai neutral yang dipaparkan bukan rekod server. Paparan baca sahaja; simpan, submit, approve dan upload dinyahaktifkan.';
    return (
      <div className="package-detail-page ui09-workspace" data-testid="dirah-server-package-detail" data-presentation="dirah">
        <PackageContextHeader
          state={dirahState}
          selection={selection}
          onBack={onBack}
          onNavigate={onNavigate}
          onCorrections={onCorrections}
          serverReadOnly
          serverStageStatuses={serverStageStatuses}
        />
        {selection === OVERVIEW ? (
          <>
            <PackageOverview
              state={dirahState}
              onNavigate={onNavigate}
              onCorrections={onCorrections}
              serverReadOnly
              serverStageStatuses={serverStageStatuses}
            />
            {contractPanel}
            <PackageRoadMembershipPanel packageId={packageId} role={role} />
            {contractEditor}
          </>
        ) : stageOne || selection === '/entry:Gerbang RNI/LRS' || selection === CORRECTIONS || selection === AUDIT || selection === ACCEPTANCE ? content : (
          <>
            {selection === PREPARATION && canSubmit && (
              <div className="wf-panel" style={{ marginBottom: 16, border: '1px solid #bfdbfe', background: '#eff6ff' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 16px', gap: 12 }}>
                  <div>
                    <strong style={{ display: 'block', color: '#1e40af' }}>Checklist & Dokumen Lengkap</strong>
                    <span className="wf-note">Laporan Pendahuluan telah ditautkan ke checklist server. Ajukan sekarang untuk review PIC Balai.</span>
                  </div>
                  <button
                    type="button"
                    className="wf-button primary"
                    disabled={submissionBusy || submissionLoading}
                    onClick={() => setSubmissionDialogOpen(true)}
                  >
                    <Send size={13} /> {submissionBusy ? 'Mengajukan…' : 'Ajukan kepada PIC Balai'}
                  </button>
                </div>
              </div>
            )}
            <OperationalWorkflowWorkspace
              key={`${packageId}:${selection}`}
              selection={selection}
              state={dirahState}
              onUpdate={() => { /* Fasa 1: tiada local workflow mutation untuk data server. */ }}
              setNotice={() => { /* Read-only action tidak boleh mengaku berjaya. */ }}
              onNavigate={onNavigate}
              serverReadOnly
              serverStatusNote={readOnlyNote}
              serverPreparation={selection === PREPARATION ? {
                checklist,
                answers,
                mappedItems: preparationMapping.mapped,
                mappingGaps: preparationMapping.gaps,
                submission,
                loading: checkLoading || submissionLoading,
                error: [checkError, submissionError].filter(Boolean).join(' · '),
                saving: checkBusy || reviewBusy || submissionBusy,
                editable,
                message: [checkMessage, submissionMessage].filter(Boolean).join(' · '),
                reviewNote,
                onReviewNote: setReviewNote,
                onAnswer: (itemId, jawaban, keterangan) => setAnswers(current => ({ ...current, [itemId]: { jawaban, keterangan } })),
                onSave: () => void saveChecklist(),
                onReload: () => { setCheckError(''); setCheckMessage(''); setCheckRevision(value => value + 1); setSubmissionRevision(value => value + 1); },
                onReview: decision => void reviewPreparationFromDirah(decision),
                canSubmit,
                onSubmit: () => setSubmissionDialogOpen(true),
                documents,
                documentLoading,
                documentError,
                documentBusy,
                onDocumentUpload: async (category, file) => {
                  if (!checklist || !editable || documentBusy) throw new Error('Upload hanya tersedia untuk Penyedia pada persiapan yang masih terbuka.');
                  setDocumentBusy(true); setDocumentError(''); setDocumentMessage('');
                  try {
                    const documentId = await uploadPreparationDocument(packageId, checklist, category, file);
                    const refreshed = await refetchPreparationState();
                    verifyPreparationDocumentLinkReadback(refreshed.checklist, category, documentId);
                    setDocumentMessage('Dokumen berjaya diunggah, ditautkan dan disahkan melalui server.');
                  } catch (cause) {
                    setDocumentRevision(value => value + 1);
                    try { await refetchPreparationState(); } catch { /* retain upload/link error */ }
                    throw cause;
                  } finally { setDocumentBusy(false); }
                },
                onDocumentReuse: async (category, documentId) => {
                  if (!checklist || !editable || documentBusy) throw new Error('Pautan dokumen hanya tersedia untuk Penyedia pada persiapan yang masih terbuka.');
                  setDocumentBusy(true); setDocumentError(''); setDocumentMessage('');
                  try {
                    await linkPreparationDocument(packageId, checklist, documentId, category);
                    const refreshed = await refetchPreparationState();
                    verifyPreparationDocumentLinkReadback(refreshed.checklist, category, documentId);
                    setDocumentMessage('Dokumen tersimpan berjaya ditautkan dan disahkan melalui server.');
                  } finally { setDocumentBusy(false); }
                },
                onDocumentsChanged: () => setDocumentRevision(value => value + 1),
              } : undefined}
            />
            {selection === '/verification:Audit tingkat 1–3' && (
              <div className="wf-toolbar" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="wf-button"
                  onClick={() => onNavigate('/entry:Gerbang RNI/LRS')}
                >
                  <ArrowLeft size={13} /> Kembali ke Tahap 4 (Validasi LRS)
                </button>
                <button
                  type="button"
                  className="wf-button primary"
                  onClick={() => onNavigate('/reports:Penerimaan & termin')}
                >
                  Lanjut ke Tahap 6 (Penerimaan Data) <ArrowRight size={13} />
                </button>
              </div>
            )}
            {selection === '/reports:Penerimaan & termin' && (
              <div className="wf-toolbar" style={{ marginTop: 24, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <button
                  type="button"
                  className="wf-button"
                  onClick={() => onNavigate('/verification:Audit tingkat 1–3')}
                >
                  <ArrowLeft size={13} /> Kembali ke Tahap 5 (Audit Data)
                </button>
                <button
                  type="button"
                  className="wf-button primary"
                  onClick={() => onNavigate(OVERVIEW)}
                >
                  ✓ Selesai & Kembali ke Ringkasan Paket
                </button>
              </div>
            )}
          </>
        )}
        {preparationDialogs}
      </div>
    );
  }

  return <div className="package-detail-page" data-testid="server-package-workspace">{shell}{content}</div>;
}
