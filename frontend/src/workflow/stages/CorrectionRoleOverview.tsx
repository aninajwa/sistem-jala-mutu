import type { CorrectionCase, WorkflowRole } from "../model";
import "./correctionRoleOverview.css";
type Props = { correction: CorrectionCase; role: WorkflowRole };
const show = (value: string | undefined | null) => value?.trim() || "Belum tercatat";
export function CorrectionRoleOverview({ correction: c, role }: Props) {
  const provider = role === "Penyedia Jasa / Ketua Tim";
  const balai = role === "PIC Balai / Pengguna Jasa";
  const directorate = role === "Direktorat / Pusat";
  const audit3 = /^Audit tingkat 3$/i.test(c.blockedStage);
  const heading = provider
    ? c.status === "Ditutup" ? "Hasil tindakan & arsip Penyedia" : c.status === "Menunggu Persetujuan" ? "Usulan menunggu keputusan Balai" : "Pekerjaan koreksi Penyedia"
    : balai ? c.status === "Menunggu Persetujuan" ? "Periksa usulan Penyedia" : "Pemeriksaan & perkembangan kasus Balai"
    : directorate ? audit3 ? "Temuan terkait Audit Tingkat 3" : "Pemantauan temuan lintas Balai"
    : "Monitoring administratif kasus";
  const guidance = provider
    ? "Lihat asal temuan dan statusnya. Isian usulan dan bukti hanya dapat diubah pada tahap yang sesuai; keputusan pemeriksaan bukan kewenangan Penyedia."
    : balai ? "Periksa usulan dan bukti sebelum memutuskan. Hasil pelaksanaan dan pemeriksaan ulang harus mengacu pada tahap sumber."
    : directorate ? audit3
      ? "Keterkaitan Audit Tingkat 3 ditampilkan untuk pemeriksaan sesuai kewenangan. Persetujuan usulan Penyedia tetap pada Balai."
      : "Pemantauan lintas Balai: informasi kasus dan keputusan saja, tanpa editor teknis Penyedia atau Balai."
    : "Admin memantau penanggung jawab, tenggat, dan status. Tidak dapat menyetujui usulan ataupun menutup kasus teknis.";
  return (
    <section className="corr-role-overview" aria-label="Konteks dan kewenangan detail koreksi">
      <div className="corr-role-overview__heading">
        <div><span className="corr-role-overview__eyebrow">TINDAKAN PERBAIKAN · {role}</span><h2>{heading}</h2></div>
        <span className="corr-role-overview__status">{c.status}</span>
      </div>
      <details className="corr-role-help"><summary>Panduan kewenangan</summary><p className="corr-role-overview__guidance">{guidance}</p></details>
      <details className="ui09-finding-context"><summary>Konteks temuan & penugasan</summary><div className="corr-role-overview__grid">
        <div><small>Nomor kasus</small><strong>{c.id}</strong></div>
        <div><small>Jenis survei</small><strong>{c.surveyType}</strong></div>
        <div><small>Ruas / STA</small><strong>{show(c.road)} · {show(c.stationing)}</strong></div>
        <div><small>Tahap sumber yang tertahan</small><strong>{show(c.blockedStage)}</strong></div>
        <div><small>Prioritas</small><strong>{c.severity}</strong></div>
        <div><small>PIC kasus</small><strong>{show(c.owner)}</strong></div><div><small>Tenggat sesuai penugasan</small><strong>{c.dueDate||'Belum ditetapkan'}</strong></div>
      </div>
      </details><div className="ui09-case-statuses"><span>Usulan: <strong>{c.approval}</strong></span><span>Uji ulang: <strong>{c.retest}</strong></span></div>
      <details className="corr-role-extra"><summary>Detail pemeriksaan dan riwayat keputusan</summary><div className="corr-role-overview__grid"><div><small>Keputusan usulan</small><strong>{c.approval}</strong></div><div><small>Hasil uji ulang</small><strong>{c.retest}</strong></div></div><div className="corr-role-overview__notes">
        {c.retestFailureReason&&<div><small>Alasan pemeriksaan ulang gagal</small><p>{c.retestFailureReason}</p></div>}<div><small>Temuan dari pemeriksaan sumber</small><p>{show(c.rejectionReason)}</p></div>
        {!provider && <div><small>Tindakan yang diusulkan</small><p>{show(c.actionType)} · {show(c.rootCause)}</p></div>}
        {(directorate || !provider) && <div><small>Catatan keputusan</small><p>{show(c.reviewNote)}</p></div>}
        {(directorate || role === "Admin") && <div><small>Referensi pelaksanaan & uji ulang</small><p>{show(c.executionReference)} · {show(c.retestReference)}</p></div>}
      </div></details>
    </section>
  );
}