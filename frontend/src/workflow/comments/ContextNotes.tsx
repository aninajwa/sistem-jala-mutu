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
  editedAt?: string;
  withdrawnAt?: string;
  withdrawnReason?: string;
  history?: Array<{ action: "edit" | "withdraw"; at: string; priorText: string; reason?: string }>;
};

export function ContextNotes({ state, principal, recipient, context = "audit2" }: {
  state: OperationalWorkflowState;
  principal: Principal;
  recipient: Principal;
  context?: "audit2" | "stage0" | "stage1" | "stage3a" | "stage3a-field" | "stage3b";
}) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [draft, setDraft] = useState("");
  const [objectRef, setObjectRef] = useState(
    context === "stage1" ? "Bukti kalibrasi" :
    context === "stage0" ? "Bukti persiapan" :
    context === "stage3a" || context === "stage3a-field" ? (state.dailyRecords[0]?.id ?? "") : ""
  );
  const selectedRef = (context === "stage3a" || context === "stage3a-field") &&
    !state.dailyRecords.some(record => record.id === objectRef)
      ? (state.dailyRecords[0]?.id ?? "") : objectRef;
  const [error, setError] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const dialog = useRef<HTMLDialogElement>(null);
  const textId = useId();
  const titleId = useId();
  const key = context === "stage3b"
    ? `jala-context-note-v1:${encodeURIComponent(state.project.id)}:stage:3b:${state.activeCyclePeriod ?? 1}`
    : context === "stage0" || context === "stage1" || context === "stage3a" || context === "stage3a-field"
    ? `jala-context-note-v1:${encodeURIComponent(state.project.id)}:stage:${context === "stage0" ? "0" : context === "stage1" ? "1" : context === "stage3a" ? "3a" : "3a-field"}`
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
    : context === "stage3a" || context === "stage3a-field" ? state.dailyRecords.length > 0
    : context === "stage3b" ? state.cycle.periodCompleted
    : ["Lulus", "Ditolak", "Klarifikasi"].includes(state.audits[1].status);
  const authorAllowed = context === "stage3a-field" ? balai : directorate;
  const canWrite = eligible && authorAllowed && hasResult
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
  const visible = notes.filter((note) =>
    balai || (context === "stage3a-field" && directorate) ||
    note.authorId === principal.id || note.recipientId === principal.id
  );
  // Akses baca tetap tersedia meskipun catatan pengawasan belum ada.
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

  function canManage(note: Note) {
    return eligible && authorAllowed && !note.withdrawnAt && note.authorId === principal.id &&
      note.authorLabel === principal.role;
  }

  function saveEdit(note: Note) {
    const value = editingText.trim();
    if (!canManage(note) || value.length < 3 || value.length > 2000) {
      setError("Isi catatan 3–2.000 karakter.");
      return;
    }
    if (value === note.text) { setEditingId(null); return; }
    if (persist(current => current.map(entry =>
      entry.id === note.id && entry.authorId === principal.id && !entry.withdrawnAt
        ? { ...entry, text: value, readAt: undefined, editedAt: new Date().toISOString(), history: [
            ...(entry.history ?? []), { action: "edit" as const, at: new Date().toISOString(), priorText: entry.text }
          ] }
        : entry
    ))) setEditingId(null);
  }

  function withdraw(note: Note) {
    if (!canManage(note)) return;
    const reason = window.prompt("Alasan menarik catatan:");
    if (reason === null) return;
    if (!reason.trim()) { setError("Alasan penarikan wajib diisi."); return; }
    if (!window.confirm("Tarik catatan ini? Riwayatnya tetap tersimpan.")) return;
    persist(current => current.map(entry =>
      entry.id === note.id && entry.authorId === principal.id && !entry.withdrawnAt
        ? { ...entry, withdrawnAt: new Date().toISOString(), withdrawnReason: reason.trim(), history: [
            ...(entry.history ?? []), { action: "withdraw" as const, at: new Date().toISOString(), priorText: entry.text, reason: reason.trim() }
          ] }
        : entry
    ));
  }

  function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const value = draft.trim();
    if (!canWrite || !value || value.length > 2000 ||
      ((context === "stage3a" || context === "stage3a-field") && !state.dailyRecords.some(r => r.id === selectedRef))) return;
    if (persist((current) => [...current, {
      id: crypto.randomUUID(),
      authorId: principal.id,
      authorLabel: principal.role,
      recipientId: recipient.id,
      recordedAt: new Date().toISOString(),
      text: value,
      ...(context === "stage0" || context === "stage1" || context === "stage3a" || context === "stage3a-field" ? { objectRef: selectedRef } : {}),
    }])) setDraft("");
  }

  return (
    <section className="v2-note-entry" aria-label={context === "stage3a-field" ? "Catatan pengawasan lapangan Balai" : "Catatan Direktorat"}>
      <button type="button" className="wf-button" onClick={() => dialog.current?.showModal()}>
        <MessageSquare size={16} aria-hidden="true" />
        {context === "stage3a-field" ? "Catatan Pengawasan Lapangan" : "Catatan Direktorat"}{unread ? ` · ${unread}` : ""}
      </button>
      <dialog ref={dialog} className="v2-notes" aria-labelledby={titleId}>
        <div className="v2-notes-header">
          <h2 id={titleId}>{context === "stage3a-field" ? "Catatan Pengawasan Lapangan" : "Catatan Direktorat"}</h2>
          <button type="button" className="wf-button" onClick={() => dialog.current?.close()}>Tutup</button>
        </div>
        <p>{state.project.packageName} · {context === "stage0" ? "Tahap 0" : context === "stage1" ? "Tahap 1" : context === "stage3a" || context === "stage3a-field" ? "Tahap 3A" : context === "stage3b" ? `Tahap 3B · Periode ${state.activeCyclePeriod ?? 1}` : "Tahap 5"}</p>
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
              {note.withdrawnAt ? <p>Catatan ditarik oleh penulis.</p> : editingId === note.id ? (
                <div>
                  <label>Ubah catatan<textarea rows={3} maxLength={2000} value={editingText} onChange={event => setEditingText(event.target.value)} /></label>
                  <div className="wf-toolbar">
                    <button type="button" className="wf-button primary" onClick={() => saveEdit(note)}>Simpan perubahan</button>
                    <button type="button" className="wf-button" onClick={() => setEditingId(null)}>Batal</button>
                  </div>
                </div>
              ) : <p>{note.text}{note.editedAt ? <small> · Diedit</small> : null}</p>}
              {canManage(note) && editingId !== note.id && <div className="wf-toolbar">
                <button type="button" className="wf-button" onClick={() => { setEditingId(note.id); setEditingText(note.text); }}>Edit</button>
                <button type="button" className="wf-button" onClick={() => withdraw(note)}>Tarik catatan</button>
              </div>}
              {!!note.history?.length && note.authorId === principal.id && note.authorLabel === principal.role && <details><summary>Riwayat perubahan ({note.history.length})</summary>
                {note.history.map((item, index) => <p key={index}><time dateTime={item.at}>{new Date(item.at).toLocaleString("id-ID")}</time> · {item.action === "edit" ? "Sebelum diedit" : "Penarikan"}: {item.priorText}</p>)}
              </details>}
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
          {(context === "stage0" || context === "stage1" || context === "stage3a" || context === "stage3a-field") && <label>{context === "stage3a" || context === "stage3a-field" ? "Kegiatan yang dikomentari" : "Bagian yang dikomentari"}
            <select value={selectedRef} onChange={(event) => setObjectRef(event.target.value)}>
              {context === "stage3a" || context === "stage3a-field" ? state.dailyRecords.map(record =>
                <option key={record.id} value={record.id}>{record.date} · {record.surveyType} · {record.road}</option>
              ) : context === "stage1" ? <>
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
          <label htmlFor={textId}>{context === "stage3a-field" ? "Hasil pengawasan (bukan keputusan formal)" : "Catatan untuk Penyedia"}</label>
          <textarea id={textId} required rows={4} maxLength={2000} value={draft} onChange={(event) => setDraft(event.target.value)} />
          <button type="submit" className="wf-button primary" disabled={!draft.trim()}>Simpan catatan</button>
        </form>}
      </dialog>
    </section>
  );
}
