import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { MessageSquare } from "lucide-react";
import { readLocal, writeLocal } from "../repository/localPersistence";
import type { Principal } from "../repository/contracts";
import type { OperationalWorkflowState } from "../model";

type Note = {
  id: string;
  authorId: string;
  authorLabel: string;
  recipientId: string;
  recordedAt: string;
  text: string;
  objectRef?: string;
  readAt?: string;
};

export function ContextNotes({ state, principal, recipient, context = "audit2" }: {
  state: OperationalWorkflowState;
  principal: Principal;
  recipient: Principal;
  context?: "audit2" | "stage0" | "stage1";
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [objectRef, setObjectRef] = useState(context === "stage1" ? "Bukti kalibrasi" : "Bukti persiapan");
  const [error, setError] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const textId = useId();
  const titleId = useId();
  const key = context === "stage0" || context === "stage1"
    ? `jala-context-note-v1:${encodeURIComponent(state.project.id)}:stage:${context === "stage0" ? "0" : "1"}`
    : `jala-context-note-v1:${encodeURIComponent(state.project.id)}:audit:2`;
  const directorate = principal.role === "Direktorat / Pusat";
  const provider = principal.role === "Penyedia Jasa / Ketua Tim";
  const balai = principal.role === "PIC Balai / Pengguna Jasa";
  const eligible = principal.source === "local-test"
    && principal.packageIds.includes(state.project.id)
    && (directorate || provider || balai);
  const hasResult = context === "stage0"
    ? state.project.preparation.reportApproval !== "Draft"
    : context === "stage1" ? state.calibrations.length > 0
    : ["Lulus", "Ditolak", "Klarifikasi"].includes(state.audits[1].status);
  const canWrite = eligible && directorate && hasResult
    && recipient.source === "local-test" && recipient.packageIds.includes(state.project.id);

  useEffect(() => {
    if (!eligible) return;
    const refresh = () => setNotes(readLocal<Note[]>(key, []));
    const onStorage = (event: StorageEvent) => {
      if (event.key === key || event.key === null) refresh();
    };
    refresh();
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, [eligible, key]);

  if (!eligible) return null;
  // Balai can inspect contextual notes but cannot author or edit them.
  const visible = notes.filter((note) => balai || note.authorId === principal.id || note.recipientId === principal.id);
  const unread = visible.filter((note) => note.recipientId === principal.id && !note.readAt).length;
  // Keep the comment entry visible to users with access, even before there is a note.
  // Submission controls remain governed by canWrite; this does not grant permission.

  function persist(update: (current: Note[]) => Note[]) {
    try {
      const next = update(readLocal<Note[]>(key, []));
      writeLocal(key, next);
      setNotes(next);
      setError("");
      return true;
    } catch {
      setError("Catatan gagal disimpan. Coba lagi.");
      return false;
    }
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!canWrite || !value || value.length > 2000) return;
    if (persist((current) => [...current, {
      id: crypto.randomUUID(),
      authorId: principal.id,
      authorLabel: principal.role,
      recipientId: recipient.id,
      recordedAt: new Date().toISOString(),
      text: value,
      ...(context === "stage0" || context === "stage1" ? { objectRef } : {}),
    }])) setDraft("");
  }

  return (
    <section className="v2-note-entry" aria-label={context === "stage0" ? "Catatan persiapan Direktorat" : context === "stage1" ? "Catatan kalibrasi Direktorat" : "Catatan hasil audit Balai"}>
      <button type="button" className="wf-button" onClick={() => dialog.current?.showModal()}>
        <MessageSquare size={16} aria-hidden="true" />
        {visible.length ? `Catatan${unread ? ` · ${unread} belum dibaca` : ""}` : "Catatan tahap"}
      </button>
      <dialog ref={dialog} className="v2-notes" aria-labelledby={titleId}>
        <div className="v2-notes-header">
          <h2 id={titleId}>{context === "stage0" ? "Catatan persiapan" : context === "stage1" ? "Catatan kalibrasi" : "Catatan audit tingkat 2"}</h2>
          <button type="button" className="wf-button" onClick={() => dialog.current?.close()}>Tutup</button>
        </div>
        <p>{state.project.packageName} · {context === "stage0" ? "Tahap 0" : context === "stage1" ? "Tahap 1" : "Tahap 5"}</p>
        <small>Catatan tambahan tidak mengubah hasil pemeriksaan.</small>
        {context === "stage0" && directorate && !!state.project.preparation.reviewerNote?.trim() && (
          <section className="v2-note-empty" aria-label="Catatan pemeriksaan Balai">
            <strong>Catatan pemeriksaan Balai</strong>
            <p>{state.project.preparation.reviewerNote}</p>
          </section>
        )}

        {error && <p role="alert">{error}</p>}
        {visible.length === 0 && <p className="v2-note-empty">Belum ada catatan tambahan pada tahap ini.</p>}
        {!canWrite && directorate && (context === "stage0" || context === "stage1") && (
          <p className="v2-note-empty">{hasResult ? "Catatan belum dapat dikirim untuk paket ini." : "Catatan dapat diberikan setelah hasil tahap tersedia."}</p>
        )}
        {visible.length > 0 && <ul>
          {visible.map((note) => (
            <li key={note.id}>
              <strong>{note.authorLabel}</strong>{" · "}
              <time dateTime={note.recordedAt}>{new Date(note.recordedAt).toLocaleString("id-ID")}</time>
              {note.objectRef && <small>Objek: {note.objectRef}</small>}
              <p>{note.text}</p>
              {note.recipientId === principal.id && !note.readAt && (
                <button type="button" className="wf-button" onClick={() => persist((current) => current.map((entry) =>
                  entry.id === note.id && entry.recipientId === principal.id && !entry.readAt
                    ? { ...entry, readAt: new Date().toISOString() }
                    : entry
                ))}>Tandai dibaca</button>
              )}
            </li>
          ))}
        </ul>}
        {canWrite && <form onSubmit={submit}>
          {(context === "stage0" || context === "stage1") && <label>Bagian yang dikomentari
            <select value={objectRef} onChange={(event) => setObjectRef(event.target.value)}>
              {context === "stage1" ? <>
                <option value="Bukti kalibrasi">Bukti kalibrasi</option>
                <option value="Penugasan alat dan personel">Penugasan alat dan personel</option>
                <option value="Checklist kalibrasi">Checklist kalibrasi</option>
              </> : <>
                <option value="Bukti persiapan">Bukti persiapan</option>
                <option value="Checklist persiapan">Checklist persiapan</option>
                <option value="Hasil pemeriksaan Balai">Hasil pemeriksaan Balai</option>
              </>}
            </select>
          </label>}
          <label htmlFor={textId}>Catatan untuk Penyedia</label>
          <textarea id={textId} required rows={4} maxLength={2000} value={draft} onChange={(event) => setDraft(event.target.value)} />
          <button type="submit" className="wf-button primary" disabled={!draft.trim()}>Simpan catatan</button>
        </form>}
      </dialog>
    </section>
  );
}
