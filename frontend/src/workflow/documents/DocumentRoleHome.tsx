import type { WorkflowRole } from "../model";
import type { listPackageDocuments } from "./documentCatalog";
import type { BaIdentity } from "../ba/documentRepository";

type Row = ReturnType<typeof listPackageDocuments>[number] & { packageName: string };
type Props = {
  role: WorkflowRole;
  rows: Row[];
  onOpen: (identity: BaIdentity) => void;
  onCatalog: () => void;
};

function TaskRow({ row, label, onOpen }: { row: Row; label: string; onOpen: () => void }) {
  return (
    <div className="dm-task-row" key={row.id}>
      <div className="dm-task-copy">
        <strong>{row.title}</strong>
        <span>{row.packageName} · {row.stage.label} · {row.identity.survey}</span>
        <small>{row.status}{row.missing ? ` · ${row.missing} isian perlu dilengkapi` : ""}</small>
      </div>
      <button type="button" className="dm-task-action" onClick={onOpen}>{label}</button>
    </div>
  );
}

export default function DocumentRoleHome({ role, rows, onOpen, onCatalog }: Props) {
  const incomplete = rows.filter(r => r.missing > 0);
  const submitted = rows.filter(r => r.localStatus === "submitted-local");
  const revision = rows.filter(r => ["revision-requested-local", "rejected-local"].includes(r.localStatus));
  const own = rows.filter(r => r.authors.includes(role));
  const incoming = rows.filter(r => r.reviewer === role && r.localStatus === "submitted-local");
  const audit3 = rows.filter(r => r.identity.kind === "audit" && r.identity.auditLevel === 3);
  const isProvider = role === "Penyedia Jasa / Ketua Tim";
  const isBalai = role === "PIC Balai / Pengguna Jasa";
  const isCentral = role === "Direktorat / Pusat";
  const tasks = isProvider ? own.filter(r => r.localStatus !== "reviewed-local")
    : isBalai ? incoming : isCentral ? audit3 : rows.filter(r => r.stale);
  const headings = isProvider ? {
    title: "Dokumen yang perlu Anda siapkan", description: "Lengkapi draft Anda, cek data yang terisi otomatis, lalu ajukan saat syarat terpenuhi.",
    queue: "Dokumen yang Anda kerjakan", action: "Lanjutkan draft", empty: "Belum ada draft tugas Anda. Pilih format dokumen untuk memulai dari paket yang sesuai.",
  } : isBalai ? {
    title: "Pemeriksaan dokumen Balai", description: "Dokumen Penyedia yang belum diajukan bukan tugas isian Balai. Periksa hanya dokumen yang sudah masuk dan menjadi kewenangan Anda.",
    queue: "Masuk untuk pemeriksaan Anda", action: "Periksa dokumen", empty: "Belum ada dokumen yang diajukan untuk pemeriksaan Balai. Tidak perlu mengisi formulir milik Penyedia.",
  } : isCentral ? {
    title: "Monitoring dan audit tingkat pusat", description: "Pantau kelengkapan lintas paket. Keputusan teknis hanya tersedia jika tingkat audit dan status memang menjadi kewenangan Pusat.",
    queue: "Dokumen Audit Tingkat 3", action: "Lihat audit", empty: "Belum ada dokumen Audit Tingkat 3 tersimpan pada paket dalam cakupan.",
  } : {
    title: "Monitoring administrasi dokumen", description: "Telusuri status, sumber, dan riwayat dokumen tanpa mengedit atau menyetujui isi teknis.",
    queue: "Dokumen yang perlu perhatian administrasi", action: "Lihat status", empty: "Tidak ada dokumen dengan perubahan sumber yang perlu ditinjau saat ini.",
  };
  const stats = isProvider ? [
    ["Draft/tugas saya", own.filter(r => r.localStatus === "local-draft").length],
    ["Menunggu pemeriksaan", own.filter(r => r.localStatus === "submitted-local").length],
    ["Perlu revisi", own.filter(r => ["revision-requested-local", "rejected-local"].includes(r.localStatus)).length],
  ] : isBalai ? [
    ["Masuk untuk diperiksa", incoming.length],
    ["Masih draft di Penyedia", rows.filter(r => r.authors.includes("Penyedia Jasa / Ketua Tim") && r.localStatus === "local-draft").length],
    ["Perlu revisi", revision.length],
  ] : isCentral ? [
    ["Dokumen Audit Tingkat 3", audit3.length],
    ["Dokumen belum lengkap", incomplete.length],
    ["Dokumen sedang diajukan", submitted.length],
  ] : [
    ["Dokumen tercatat", rows.length],
    ["Belum lengkap", incomplete.length],
    ["Data sumber berubah", rows.filter(r => r.stale).length],
  ];
  return (
    <section className="dm-role-home" aria-label="Ringkasan tugas Dokumen Mutu">
      <div className="dm-role-intro">
        <span className="dm-eyebrow">RUANG KERJA · {role}</span>
        <h2>{headings.title}</h2>
        <p>{headings.description}</p>
      </div>
      <div className="dm-role-stats">
        {stats.map(([label, value]) => <article key={String(label)}><span>{label}</span><strong>{value}</strong></article>)}
      </div>
      <div className="dm-task-section">
        <div className="dm-task-head"><h3>{headings.queue}</h3><span>{tasks.length} dokumen</span></div>
        {tasks.length ? tasks.slice(0, 5).map(row => (
          <TaskRow key={row.id} row={row} label={headings.action} onOpen={() => onOpen(row.identity)} />
        )) : <p className="dm-task-empty">{headings.empty}</p>}
      </div>
      <div className="dm-next-step">
        <strong>{isProvider ? "Belum punya draft?" : isBalai ? "Dokumen belum diajukan?" : isCentral ? "Butuh menelusuri dokumen lain?" : "Butuh melihat format dan sumber dokumen?"}</strong>
        <p>{isProvider ? "Buka katalog tujuh format, pilih paket dan jenis survei. Dokumen tidak otomatis tercipta sebelum ada isian atau penyimpanan." : isBalai ? "Buka katalog untuk melihat tujuan dokumen; untuk dokumen Penyedia yang masih draft, tunggu pengajuan sebelum memeriksa." : "Katalog menjelaskan kegunaan format; daftar rekaman menampilkan dokumen yang benar-benar sudah tersimpan."}</p>
        <button type="button" className="dm-task-action" onClick={onCatalog}>Lihat tujuh format dokumen</button>
      </div>
      {isProvider && <p className="dm-work-note">Isi BA tidak semuanya otomatis: identitas dan nilai teknis yang sudah tercatat dapat ditarik dari tahap sumber; bagian wajib yang masih kosong harus dilengkapi sesuai penanggung jawabnya.</p>}
      {isCentral && <p className="dm-work-note">Audit tingkat 1 dan 2 bukan keputusan Direktorat. Jangan memakai status draft lokal sebagai pengesahan resmi.</p>}
      {!isProvider && !isBalai && !isCentral && <p className="dm-work-note">Admin hanya memantau. Perubahan isi, keputusan pemeriksaan, dan TTE resmi tidak dilakukan dari halaman ini.</p>}
    </section>
  );
}
