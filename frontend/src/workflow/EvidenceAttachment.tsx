import { useEffect, useState, useSyncExternalStore } from 'react';
import {
  FileText,
  Paperclip,
  Trash2,
} from 'lucide-react';
import { hasEvidenceRecord, missingEvidenceFromStore } from './evidenceGate';

const STORAGE_KEY = 'jala-mutu-evidence-v1';

let evidenceRevision = 0;
const evidenceListeners = new Set<() => void>();

function notifyEvidenceChanged() {
  evidenceRevision += 1;
  for (const listener of evidenceListeners) listener();
}

/** Memicu render ulang gate setelah evidence ditambah/dihapus. */
export function useEvidenceRevision() {
  return useSyncExternalStore(
    listener => {
      evidenceListeners.add(listener);
      return () => {
        evidenceListeners.delete(listener);
      };
    },
    () => evidenceRevision,
    () => 0,
  );
}

export function evidenceAvailable(packageId: string, evidenceId: string) {
  const record = loadStore()[`${packageId}:${evidenceId}`];
  return hasEvidenceRecord(record);
}

export function missingEvidence(
  packageId: string,
  requirements: Array<{ id: string; label: string }>,
) {
  return missingEvidenceFromStore(packageId, requirements, loadStore());
}

type EvidenceRecord = {
  fileName: string;
  reference: string;
  updatedAt: string;
};

type EvidenceStore = Record<string, EvidenceRecord>;

function loadStore(): EvidenceStore {
  if (typeof window === 'undefined') return {};

  try {
    return JSON.parse(
      window.localStorage.getItem(STORAGE_KEY) || '{}',
    ) as EvidenceStore;
  } catch {
    return {};
  }
}

function saveStore(store: EvidenceStore) {
  if (typeof window === 'undefined') return;

  window.localStorage.setItem(
    STORAGE_KEY,
    JSON.stringify(store),
  );
}

export function EvidenceAttachment({
  packageId,
  evidenceId,
  label,
  description,
  editable,
  required = false,
  compact = false,
}: {
  packageId: string;
  evidenceId: string;
  label: string;
  description?: string;
  editable: boolean;
  required?: boolean;
  compact?: boolean;
}) {
  const storageId = `${packageId}:${evidenceId}`;

  const [record, setRecord] =
    useState<EvidenceRecord>(() => {
      const store = loadStore();

      return (
        store[storageId] || {
          fileName: '',
          reference: '',
          updatedAt: '',
        }
      );
    });

  useEffect(() => {
    const store = loadStore();

    setRecord(
      store[storageId] || {
        fileName: '',
        reference: '',
        updatedAt: '',
      },
    );
  }, [storageId]);

  const persist = (
    patch: Partial<EvidenceRecord>,
  ) => {
    const next: EvidenceRecord = {
      ...record,
      ...patch,
      updatedAt: new Date().toISOString(),
    };

    const store = loadStore();

    store[storageId] = next;

    saveStore(store);
    setRecord(next);
    notifyEvidenceChanged();
  };

  const remove = () => {
    const store = loadStore();

    delete store[storageId];

    saveStore(store);

    setRecord({
      fileName: '',
      reference: '',
      updatedAt: '',
    });
    notifyEvidenceChanged();
  };

  const hasEvidence = hasEvidenceRecord(record);

  return (
    <div
      className={`evidence-attachment ${
        compact ? 'compact' : ''
      }`}
    >
      <div className="evidence-heading">
        <div>
          <strong>
            {label}
            {required && (
              <span className="evidence-required">
                {' '}*
              </span>
            )}
          </strong>

          {description && (
            <span>{description}</span>
          )}
        </div>

        <span
          className={`wf-status ${
            hasEvidence ? 'good' : 'warn'
          }`}
        >
          {hasEvidence
            ? 'Referensi dicatat (demo)'
            : 'Belum ada bukti'}
        </span>
      </div>

      {hasEvidence && (
        <div className="evidence-current">
          <FileText size={14} />

          <div>
            {record.fileName && (
              <strong>{record.fileName}</strong>
            )}

            {record.reference && (
              <span>{record.reference}</span>
            )}
          </div>
        </div>
      )}

      {editable ? (
        <div className="evidence-actions">
          <label className="wf-button evidence-file-button">
            <Paperclip size={13} />

            {record.fileName
              ? 'Ganti file'
              : 'Pilih file'}

            <input
              type="file"
              hidden
              onChange={event => {
                const file =
                  event.target.files?.[0];

                if (!file) return;

                persist({
                  fileName: file.name,
                });

                event.target.value = '';
              }}
            />
          </label>

          <input
            className="evidence-reference-input"
            value={record.reference}
            placeholder="Nomor dokumen / BA / referensi"
            onChange={event =>
              persist({
                reference:
                  event.target.value,
              })
            }
          />

          {hasEvidence && (
            <button
              type="button"
              className="wf-button"
              onClick={remove}
            >
              <Trash2 size={12} />
              Hapus
            </button>
          )}
        </div>
      ) : (
        !hasEvidence && (
          <div className="wf-note">
            Belum ada bukti yang dilampirkan
            Penyedia.
          </div>
        )
      )}
    </div>
  );
}