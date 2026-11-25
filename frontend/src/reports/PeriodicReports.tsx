import { createLocalId } from "./localId";
import { readDraftHistory, appendDraft } from "./draftStorage";
import { useRef, useState } from "react";
import type { PageProps } from "../types";
import type { Principal } from "../workflow/repository/contracts";
import { CATALOG, canEdit, validateDraft, type Draft } from "./periodic";
import { readLocalReports } from "./adapter";
import { filterReport } from "./query";
import { EMPTY_FILTER } from "./model";
export default function PeriodicReports(
  p: PageProps & { principal: Principal },
) {
  const [version, setVersion] = useState(1);
  const [kind, setKind] = useState("weekly"),
    [packageId, setPackage] = useState(""),
    [start, setStart] = useState(""),
    [end, setEnd] = useState(""),
    [content, setContent] = useState(["", "", "", ""]),
    [attachments, setAttachments] = useState<Draft["attachments"]>([]),
    [id, setId] = useState(""),
    [message, setMessage] = useState(""),
    [preview, setPreview] = useState(false);
  const [initialStore] = useState(() => {
    try {
      return {
        history: readDraftHistory(localStorage, p.principal),
        error: "",
      };
    } catch (e) {
      return {
        history: [] as Draft[],
        error:
          e instanceof Error ? e.message : "Penyimpanan draf tidak tersedia.",
      };
    }
  });
  const [history, setHistory] = useState<Draft[]>(() =>
    initialStore.history.filter((d) => canEdit(p.principal, d)),
  );
  const [catalogOpen, setCatalogOpen] = useState(
    () =>
      typeof window !== "undefined" &&
      window.matchMedia("(min-width: 761px)").matches,
  );
  const [readingAttachments, setReadingAttachments] = useState(false);
  const attachmentRead = useRef(0);
  const cancelAttachmentRead = () => {
    attachmentRead.current++;
    setReadingAttachments(false);
  };
  const catalog = CATALOG.find((c) => c.id === kind)!;
  const snapshot = readLocalReports(p.packages, p.principal);
  const editable = p.principal.role === "Penyedia Jasa / Ketua Tim";
  const draft: Draft = {
    id,
    owner: p.principal.id,
    packageId,
    kind,
    start,
    end,
    content,
    attachments,
    updated: new Date().toISOString(),
    version,
  };
  const support = Object.entries(snapshot.rows)
    .map(
      ([k, rs]) =>
        `${k === "activities" ? "Aktivitas" : k === "reviews" ? "Pemeriksaan" : "Tindakan"}: ${filterReport(rs, { ...EMPTY_FILTER, packageId, start, end }).length}`,
    )
    .join(" · ");
  const visibleHistory=history.filter(d=>canEdit(p.principal,d)&&!!snapshot.packages[d.packageId]);
  const save = () => {
    const error = validateDraft(draft);
    if (
      readingAttachments ||
      error ||
      !canEdit(p.principal, draft) ||
      !snapshot.packages[packageId]
    ) {
      setMessage(
        readingAttachments
          ? "Tunggu hingga lampiran selesai dibaca."
          : error || "Paket di luar penugasan.",
      );
      return;
    }
    try {
      const all = appendDraft(localStorage, p.principal, {
        ...draft,
        id: draft.id || createLocalId(),
      });
      const next = all[all.length - 1];
      setHistory(all.filter((d) => canEdit(p.principal, d)));
      setId(next.id);
      setVersion(next.version);
      setMessage(`Draf lokal versi ${next.version} tersimpan.`);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? `Draf gagal disimpan: ${e.message}`
          : "Draf gagal disimpan.",
      );
    }
  };
  if (packageId && !snapshot.packages[packageId])
    return (
      <div className="notice" role="alert">
        Paket draf tidak lagi berada dalam penugasan Anda. Isi draf tidak
        ditampilkan.
        <button
          className="btn"
          onClick={() => {
            cancelAttachmentRead();
            setPackage("");
            setId("");
            setContent(["", "", "", ""]);
            setAttachments([]);
            setPreview(false);
            setVersion(1);
          }}
        >
          Pilih paket lain
        </button>
      </div>
    );
  return (
    <>
      <div className="rv-periodic">
        <div className="notice">
          Draf tersimpan pada browser ini. Belum terkirim, diterima, atau
          disahkan. Layanan laporan multiuser belum terhubung.
        </div>
        {initialStore.error && (
          <p role="alert" className="rv-storage-error">
            {initialStore.error} Data lama tidak ditimpa.
          </p>
        )}
        <p className="subtle">
          Struktur kerja sementara, bukan format laporan resmi final.
        </p>
        <details
          className="rv-report-catalog"
          open={catalogOpen}
          onToggle={(e) => setCatalogOpen(e.currentTarget.open)}
        >
          <summary>Katalog jenis laporan · 4 struktur draf</summary>
          <div className="rv-charts" style={{ marginTop: 16 }}>
            {CATALOG.map((c) => (
              <section className="rv-card" key={c.id}>
                <h3>{c.name}</h3>
                <p>
                  {c.period} · Pemilik: Penyedia · Pemeriksa yang direncanakan:{" "}
                  {c.reviewers.join(", ")}
                </p>
                <p className="subtle">
                  Format draf terstruktur tersedia. Pemeriksaan lanjutan
                  Direktorat mengikuti konfigurasi jenis laporan; belum
                  diaktifkan.
                </p>
                <button
                  className="btn"
                  onClick={() => {
                    setKind(c.id);
                    cancelAttachmentRead();
                    setId("");
                    setVersion(1);
                    setContent(["", "", "", ""]);
                    setAttachments([]);
                    setPreview(false);
                  }}
                >
                  {editable ? "Susun draf" : "Lihat struktur"} · {c.name}
                </button>
              </section>
            ))}
          </div>
        </details>
        <section className="rv-card">
          <h3>{catalog.name}</h3>
          <p className="subtle">
            Laporan QA/QC berbeda dari laporan hasil survei semester dan laporan
            akhir pekerjaan. BA tetap dikelola melalui Dokumen Mutu.
          </p>
          <div className="rv-form">
            <label>
              Paket laporan
              <select
                aria-label="Paket laporan"
                value={packageId}
                onChange={(e) => {
                  cancelAttachmentRead();
                  setPackage(e.target.value);
                  setId("");
                  setVersion(1);
                }}
              >
                <option value="">Pilih paket</option>
                {Object.entries(snapshot.packages).map(([k, s]) => (
                  <option key={k} value={k}>
                    {s.project.packageName}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Jenis laporan
              <select
                aria-label="Jenis laporan"
                value={kind}
                onChange={(e) => {
                  setKind(e.target.value);
                  cancelAttachmentRead();
                  setId("");
                  setVersion(1);
                  setContent(["", "", "", ""]);
                  setAttachments([]);
                }}
              >
                {CATALOG.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Awal periode
              <input
                type="date"
                value={start}
                onChange={(e) => setStart(e.target.value)}
              />
            </label>
            <label>
              Akhir periode
              <input
                type="date"
                value={end}
                onChange={(e) => setEnd(e.target.value)}
              />
            </label>
            {catalog.sections.map((s, i) => (
              <label key={s}>
                {s}
                <textarea
                  aria-label={s}
                  disabled={!editable}
                  maxLength={20000}
                  value={content[i]}
                  onChange={(e) =>
                    setContent((v) =>
                      v.map((x, j) => (j === i ? e.target.value : x)),
                    )
                  }
                />
              </label>
            ))}
          </div>
          <p>
            Data pendukung{" "}
            {packageId && start && end ? support : ": pilih paket dan periode."}
          </p>
          {editable && (
            <label>
              Lampiran draf (PDF/gambar, maksimal total 2 MB)
              <input
                type="file"
                accept="application/pdf,image/png,image/jpeg"
                multiple
                onChange={async (e) => {
                  const readId = ++attachmentRead.current;
                  setReadingAttachments(false);
                  const files = Array.from(e.target.files || []);
                  if (
                    files.some(
                      (f) =>
                        ![
                          "application/pdf",
                          "image/png",
                          "image/jpeg",
                        ].includes(f.type),
                    ) ||
                    files.reduce((s, f) => s + f.size, 0) > 2 * 1024 * 1024
                  ) {
                    setMessage(
                      "Lampiran ditolak: gunakan PDF/PNG/JPEG dengan total maksimal 2 MB.",
                    );
                    return;
                  }
                  setReadingAttachments(true);
                  try {
                    const a = await Promise.all(
                      files.map(
                        (f) =>
                          new Promise<Draft["attachments"][number]>(
                            (resolve, reject) => {
                              const r = new FileReader();
                              r.onerror = () => reject(Error());
                              r.onload = () =>
                                resolve({
                                  name: f.name,
                                  type: f.type,
                                  data: String(r.result),
                                });
                              r.readAsDataURL(f);
                            },
                          ),
                      ),
                    );
                    if (readId !== attachmentRead.current) return;
                    setAttachments(a);
                    setMessage("Lampiran siap disimpan bersama versi draf.");
                  } catch {
                    if (readId === attachmentRead.current)
                      setMessage("Lampiran gagal dibaca.");
                  } finally {
                    if (readId === attachmentRead.current)
                      setReadingAttachments(false);
                  }
                }}
              />
            </label>
          )}
          <ul>
            {attachments.map((a, i) => (
              <li key={i}>
                <a href={a.data} download={a.name}>
                  {a.name}
                </a>
                {editable && (
                  <button
                    className="btn sm"
                    onClick={() =>
                      setAttachments((v) => v.filter((_, j) => j !== i))
                    }
                  >
                    Hapus lampiran
                  </button>
                )}
              </li>
            ))}
          </ul>
          <div className="rv-nav">
            {editable && (
              <button
                className="btn primary"
                onClick={save}
                disabled={readingAttachments}
              >
                Simpan versi draf
              </button>
            )}
            <button className="btn" onClick={() => setPreview((v) => !v)}>
              Pratinjau draf
            </button>
            <button
              className="btn"
              disabled={
                readingAttachments ||
                !!validateDraft(draft) ||
                !canEdit(p.principal, draft)
              }
              onClick={() => {
                try {
                  const exportDraft = {
                    ...draft,
                    id: draft.id || createLocalId(),
                  };
                  setId(exportDraft.id);
                  const url = URL.createObjectURL(
                    new Blob(
                      [
                        JSON.stringify(
                          {
                            sifat: "DRAF LOKAL, BELUM DISAHKAN",
                            ...exportDraft,
                          },
                          null,
                          2,
                        ),
                      ],
                      { type: "application/json" },
                    ),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "jala-draf-lokal.json";
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch (e) {
                  setMessage(
                    e instanceof Error ? e.message : "Ekspor draf gagal.",
                  );
                }
              }}
            >
              Unduh draf JSON
            </button>
            <button
              className="btn"
              disabled
              title="Memerlukan layanan backend dan konfigurasi kewenangan"
            >
              Ajukan · belum tersedia
            </button>
            <a className="btn" href="/documents">
              Buka Dokumen Mutu
            </a>
          </div>
          <p role="status">{message}</p>
          {preview && (
            <article className="rv-preview">
              <h3>DRAF LOKAL — {catalog.name}</h3>
              <p>
                {snapshot.packages[packageId]?.project.packageName ||
                  "Paket belum dipilih"}{" "}
                · {start} — {end}
              </p>
              {catalog.sections.map((s, i) => (
                <div key={s}>
                  <h4>{s}</h4>
                  {content[i] || "Belum diisi"}
                </div>
              ))}
              <p>
                Lampiran:{" "}
                {attachments.map((a) => a.name).join(", ") || "Belum tersedia"}
              </p>
            </article>
          )}
        </section>
        <section className="rv-card" style={{ marginTop: 16 }}>
          <h3>Riwayat versi pada perangkat ini</h3>
          {!editable ? (
            <p>
              Riwayat draf milik Penyedia belum dapat dibagikan lintas pengguna.
              Pemeriksaan laporan menunggu integrasi backend.
            </p>
          ) : !visibleHistory.length ? (
            <p>Belum ada versi tersimpan.</p>
          ) : (
            visibleHistory
              .slice()
              .reverse()
              .map((d) => (
                <div className="rv-nav" key={d.id + d.version}>
                  <span>
                    {CATALOG.find((c) => c.id === d.kind)?.name} ·{" "}
                    {snapshot.packages[d.packageId]?.project.packageName} ·{" "}
                    {d.start}–{d.end} · v{d.version} ·{" "}
                    {new Date(d.updated).toLocaleString("id-ID")}
                  </span>
                  <button
                    className="btn sm"
                    onClick={() => {
                      cancelAttachmentRead();
                      setKind(d.kind);
                      setPackage(d.packageId);
                      setStart(d.start);
                      setEnd(d.end);
                      setContent(d.content);
                      setAttachments(d.attachments);
                      setId(d.id);
                      setVersion(d.version);
                      setMessage(`Menampilkan draf lokal versi ${d.version}.`);
                      setPreview(true);
                    }}
                  >
                    Buka versi {d.version}
                  </button>
                </div>
              ))
          )}
        </section>
      </div>
    </>
  );
}
