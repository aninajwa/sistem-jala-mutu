import { dailyLengthEvidence, lengthEvidenceText } from "./reportEvidence";
import { CONTRACT_REPORTS } from "./contractReportCatalog";
import { buildReportHtml } from "./reportHtml";
import { createLocalId } from "./localId";
import { readDraftHistory, appendDraft } from "./draftStorage";
import { useRef, useState } from "react";
import type { PageProps } from "../types";
import type { Principal } from "../workflow/repository/contracts";
import { CATALOG, ALL_REPORT_TYPES, CONTRACT_DRAFTS, reportSections, canEdit, validateDraft, type Draft } from "./periodic";
import { readLocalReports } from "./adapter";
import { filterReport, filterError } from "./query";
import { EMPTY_FILTER, REPORT_NAMES } from "./model";
const REPORT_GUIDANCE: Record<string,string[]> = {
  weekly:["Persiapan, sumber daya, jadwal, proses dan hasil survei minggu ini.","Hambatan terhadap persyaratan kontrak.","Upaya penyelesaian dan rencana pekerjaan berikutnya.","Referensi data hasil dan bukti pelaksanaan."],
  monthly:["Daftar alat dan personel, kalibrasi, pemeliharaan, perubahan jadwal/metode dan alasannya.","Catatan harian operator, prosedur, pengendalian mutu, verifikasi lapangan, V&V dan penilaian antarpetugas.","Ketidaksesuaian, tindakan dan status penyelesaian.","Referensi BA, korespondensi, bukti pemeriksaan dan penerimaan pekerjaan jika tersedia."],
  semester:["Konsolidasi bulanan: alat, personel, kalibrasi, pemeliharaan, jadwal dan perubahan metode.","Konsolidasi catatan operator, pengendalian mutu, verifikasi lapangan, penilaian antarpetugas, V&V dan audit.","Pola permasalahan dan temuan yang masih terbuka.","Evaluasi, rekomendasi, referensi BA, penerimaan dan korespondensi semester."],
  final:["Pelaksanaan QA/QC sepanjang kontrak: alat, personel, kalibrasi, pemeliharaan, jadwal dan perubahan metode beserta alasan.","Hasil kalibrasi, catatan operator, pengendalian mutu, verifikasi lapangan, penilaian antarpetugas, V&V, audit dan penerimaan.","Tindakan perbaikan, verifikasi efektivitas dan temuan tersisa.","Kesimpulan, rekomendasi, daftar bukti, BA dan korespondensi terkait."]
};
export default function PeriodicReports(
  p: PageProps & { principal: Principal; onOpenRecap?: (packageId:string,start:string,end:string,balai?:string)=>void },
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
  const [catalogOpen, setCatalogOpen] = useState(false);
  const [monitorBalai,setMonitorBalai] = useState("");
  const [monitorKind,setMonitorKind] = useState("");
  const [readingAttachments, setReadingAttachments] = useState(false);
  const attachmentRead = useRef(0);
  const cancelAttachmentRead = () => {
    attachmentRead.current++;
    setReadingAttachments(false);
  };
  const catalog = ALL_REPORT_TYPES.find((c) => c.id === kind)!;
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
        `${REPORT_NAMES[k as keyof typeof REPORT_NAMES]}: ${filterReport(rs, { ...EMPTY_FILTER, packageId, start, end }).length}`,
    )
    .join(" · ");
  const lengthRows = dailyLengthEvidence(snapshot.packages[packageId],start,end);
  const validScope = !!snapshot.packages[packageId] && !!start && !!end && !filterError({...EMPTY_FILTER,start,end});
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
      setMessage(`Draf versi ${next.version} tersimpan pada perangkat ini.`);
    } catch (e) {
      setMessage(
        e instanceof Error
          ? `Draf gagal disimpan: ${e.message}`
          : "Draf gagal disimpan.",
      );
    }
  };
  if (!editable) {
    const monitorPackages = Object.entries(snapshot.packages).filter(([,state])=>!monitorBalai||state.project.balai===monitorBalai);
    const monitorFilter = {...EMPTY_FILTER,packageId,balai:monitorBalai,start,end};
    const monitorError = filterError(monitorFilter);
    return <div className="rv-periodic"><section className="rv-card"><h3>{p.principal.role === "Direktorat / Pusat" ? "Monitoring laporan lintas Balai" : "Monitoring laporan paket"}</h3>
      <div className="rv-form">
        {p.principal.role === "Direktorat / Pusat" && <label>Balai<select value={monitorBalai} onChange={e=>{setMonitorBalai(e.target.value);setPackage("");}}><option value="">Semua Balai</option>{Array.from(new Set(Object.values(snapshot.packages).map(s=>s.project.balai))).sort().map(b=><option key={b}>{b}</option>)}</select></label>}
        <label>Paket<select value={packageId} onChange={e=>setPackage(e.target.value)}><option value="">Semua paket dalam penugasan</option>{monitorPackages.map(([id,state])=><option key={id} value={id}>{state.project.packageName}</option>)}</select></label>
        <label>Jenis laporan<select value={monitorKind} onChange={e=>setMonitorKind(e.target.value)}><option value="">Semua jenis</option>{ALL_REPORT_TYPES.map(c=><option key={c.id} value={c.id}>{c.name}</option>)}</select></label>
        <label>Tanggal awal<input type="date" value={start} onChange={e=>setStart(e.target.value)}/></label><label>Tanggal akhir<input type="date" value={end} onChange={e=>setEnd(e.target.value)}/></label>
      </div>{monitorError && <p role="alert">{monitorError}</p>}
      <div className="bi-report-empty"><h4>Daftar laporan diterima</h4><p>Data penerimaan laporan belum tersedia.</p></div>
      <details className="rv-report-catalog"><summary>Referensi jenis laporan</summary><div className="table-wrap"><table><thead><tr><th>Jenis laporan</th><th>Periode</th></tr></thead><tbody>{ALL_REPORT_TYPES.filter(c=>!monitorKind||c.id===monitorKind).map(c=><tr key={c.id}><td>{c.name}</td><td>{c.period}</td></tr>)}</tbody></table></div></details>
    </section><section className="rv-card"><h3>Data pendukung pemantauan</h3><p className="subtle">Jumlah rekaman pekerjaan sesuai cakupan paket dan periode, bukan jumlah laporan diterima.</p><div className="bi-monitor-grid">{Object.entries(snapshot.rows).map(([k,rs])=><div key={k}><small>{REPORT_NAMES[k as keyof typeof REPORT_NAMES]}</small><strong>{monitorError?'—':filterReport(rs,monitorFilter).length}</strong></div>)}</div><button className="btn" disabled={!!monitorError} onClick={()=>p.onOpenRecap ? p.onOpenRecap(packageId,start,end,monitorBalai) : p.setActiveTab("Rekap & Ekspor")}>Buka rekap</button></section></div>;
  }
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
            setContent(reportSections(kind).map(()=>""));
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
        <details className="rv-report-catalog"><summary>Keluaran laporan kontrak</summary><div className="rv-charts" style={{marginTop:12}}>{CONTRACT_REPORTS.map((r,index)=><section className="rv-card" key={r.name}><h3>{r.name}</h3><small>{r.source}</small><ul>{r.items.map(item=><li key={item}>{item}</li>)}</ul><button className="btn" onClick={()=>{const next=CONTRACT_DRAFTS[index].id;cancelAttachmentRead();setKind(next);setContent(reportSections(next).map(()=>""));setAttachments([]);setId("");setVersion(1);setPreview(false);}}>Susun draf</button></section>)}</div><p className="subtle">Gunakan dokumen dan bukti pekerjaan terkait untuk melengkapi keluaran kontrak.</p></details>

        {initialStore.error && (
          <p role="alert" className="rv-storage-error">
            {initialStore.error} Data lama tidak ditimpa.
          </p>
        )}

        <details
          className="rv-report-catalog"
          open={catalogOpen}
          onToggle={(e) => setCatalogOpen(e.currentTarget.open)}
        >
          <summary>Jenis laporan periodik</summary>
          <div className="rv-charts" style={{ marginTop: 16 }}>
            {CATALOG.map((c) => (
              <section className="rv-card" key={c.id}>
                <h3>{c.name}</h3>
                <p>
                  {c.period} · Penyedia Jasa
                </p>

                <button
                  className="btn"
                  onClick={() => {
                    setKind(c.id);
                    cancelAttachmentRead();
                    setId("");
                    setVersion(1);
                    setContent(reportSections(c.id).map(()=>""));
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
            Lengkapi laporan sesuai lingkup kontrak. Untuk bagian yang tidak berlaku, cantumkan alasannya. BA tetap dikelola melalui Dokumen Mutu.
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
                  setContent(reportSections(kind).map(()=>""));
                  setAttachments([]);
                  setPreview(false);
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
                  setContent(reportSections(e.target.value).map(()=>""));
                  setAttachments([]);
                }}
              >
                {ALL_REPORT_TYPES.map((c) => (
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
                <small className="subtle">{REPORT_GUIDANCE[kind]?.[i]}</small>
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
            Data pendukung (tindakan berdasarkan tenggat){" "}
            {packageId && start && end ? support : ": pilih paket dan periode."}
          </p>
          {validScope && <section className="rv-card" style={{marginTop:12}}>
            <h4>Data pekerjaan pada periode laporan</h4>
            <p>{support}</p>
            {kind === "contract-final" && <><h4>Statistik panjang sesi survei harian</h4><p className="subtle">Panjang sesi tercatat, bukan cakupan ruas unik atau volume tervalidasi.</p>
            {Array.from(new Set(lengthRows.map(r=>r.survey))).map(survey=>{const rows=lengthRows.filter(r=>r.survey===survey);const max=Math.max(...rows.map(r=>r.km));return <div key={survey}><strong>{survey}</strong>{rows.map(r=><div key={r.date} style={{display:"grid",gridTemplateColumns:"100px 1fr 85px",gap:8,alignItems:"center",margin:"6px 0"}}><small>{r.date}</small><div style={{height:12,background:"#e1ebef",borderRadius:3}}><div style={{height:"100%",width:`${r.km/max*100}%`,background:"#147b83",borderRadius:3}}/></div><small>{r.km} km</small></div>)}</div>})}
            {!lengthRows.length && <p>Belum ada panjang sesi tercatat.</p>}
            <button className="btn" disabled={!lengthRows.length} onClick={()=>setContent(v=>v.map((x,i)=>i===4?(x.includes(lengthEvidenceText(lengthRows))?x:[x,lengthEvidenceText(lengthRows)].filter(Boolean).join("\n\n")):x))}>Tambahkan statistik ke isi draf</button></>}
            {kind !== "contract-final" && <button className="btn" onClick={()=>setContent(v=>v.map((x,i)=>i===0?[x,`Ringkasan rekaman periode ${start} – ${end}: ${support}. Tindakan dihitung berdasarkan tenggat.`].filter(Boolean).join("\n\n"):x))}>Tambahkan ringkasan ke isi draf</button>}
          </section>}
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
                      [buildReportHtml({name:catalog.name,packageName:snapshot.packages[packageId]?.project.packageName ?? packageId,start,end,sections:catalog.sections,content,attachments:attachments.map(a=>a.name)})],
                      { type: "text/html;charset=utf-8" },
                    ),
                  );
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `jala-draf-${kind}-${start}.html`;
                  a.click();
                  setTimeout(() => URL.revokeObjectURL(url), 1000);
                } catch (e) {
                  setMessage(
                    e instanceof Error ? e.message : "Ekspor draf gagal.",
                  );
                }
              }}
            >
              Unduh draf (cetak/PDF)
            </button>

            <a className="btn" href="/documents">
              Buka Dokumen Mutu
            </a>
          </div>
          <p role="status">{message}</p>
          {preview && (
            <article className="rv-preview">
              <h3>DRAF — {catalog.name}</h3>
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
          <h3>Riwayat draf</h3>
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
                    {ALL_REPORT_TYPES.find((c) => c.id === d.kind)?.name} ·{" "}
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
                      setMessage(`Menampilkan draf versi ${d.version}.`);
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
