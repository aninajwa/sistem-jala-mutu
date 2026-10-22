import { BookOpen, ClipboardCheck, RotateCcw, ShieldCheck } from "lucide-react";

import type { WorkflowStageProps } from "./stageSupport";
import { Badge, Panel } from "./stageSupport";
import { useWorkflowStage } from "./useWorkflowStage";

export function WorkflowCoverageWorkspace(props: WorkflowStageProps) {
  const { selection, state, onUpdate, setNotice, onNavigate } = props;
  const { heading } = useWorkflowStage(props);

  const coverage = [
    {
      diagram: "00 · Ringkasan alur QA/QC",
      source:
        "SPMK → Tahap 0–6 → termin & laporan akhir; cabang koreksi dari tahap gagal.",
      module:
        "Persiapan & SPMK · Kalibrasi & personel · Validasi produksi · Survei harian · Verval 14 hari · Gerbang RNI/LRS · Audit tingkat 1–3 · Penerimaan & termin · Koreksi berbukti",
      status: "Terpetakan",
    },
    {
      diagram: "01 · Persiapan, kalibrasi, validasi produksi",
      source:
        "Telaah sumber, rencana lapangan, koordinasi, dokumen, persetujuan laporan; kalibrasi referensi/relatif dan personel; delapan jenis uji dan keputusan ambang.",
      module: "Persiapan & SPMK · Kalibrasi & personel · Validasi produksi",
      status: "Terpetakan",
    },
    {
      diagram: "02 · Pengumpulan data & verval 14 hari",
      source:
        "Quality gate kondisi survei; metadata wajib, backup dan laporan; protokol per jenis, checklist, BA, hold tidak konsisten, jembatan dan validasi akhir.",
      module:
        "Survei harian · Verval 14 hari · Pengingat & eskalasi · Koreksi berbukti · Peran & backup",
      status: "Terpetakan",
    },
    {
      diagram: "03 · Penyiapan, upload, audit & penerimaan",
      source:
        "Checklist mutu, gerbang RNI/LRS, pemisahan raw/clean, audit internal, tujuan upload status VALID, audit 1–3, BA, penerimaan parsial dan termin.",
      module:
        "Gerbang RNI/LRS · Audit tingkat 1–3 · Penerimaan & termin · Koreksi berbukti",
      status: "Terpetakan",
    },
    {
      diagram: "04 · Tindakan perbaikan & koreksi data",
      source:
        "Sumber kasus, tahap tertahan, akar masalah, cabang validitas data lapangan, koreksi hanya dengan bukti, persetujuan, pelaksanaan, uji ulang, close dan kembali ke tahap.",
      module: "Koreksi berbukti · Audit trail pada Peran & backup",
      status: "Terpetakan",
    },
    {
      diagram: "05 · Modul monitoring mutu & aliran data",
      source:
        "Master, entry, kalibrasi, verval, audit, tindakan, dokumen, notifikasi, analisis kepatuhan, keamanan/audit trail dan tujuan sistem eksternal.",
      module:
        "Data Master · Entri Survei · Persiapan & SPMK · Kalibrasi & personel · Validasi produksi · Survei harian · Verval 14 hari · Gerbang RNI/LRS · Audit tingkat 1–3 · Koreksi berbukti · Penerimaan & termin · Dokumen Mutu · Pengingat & eskalasi · Analisis & Kepatuhan · Dashboard & Laporan · Keamanan & Audit",
      status: "Terpetakan",
    },
  ];
  return (
    <>
      {heading(
        "Penelusuran sumber · 6 diagram",
        "Matriks cakupan diagram",
        "Audit eksplisit sumber Mermaid terhadap layar kerja yang tersedia. Cakupan disajikan apa adanya; area keamanan dan sistem eksternal tetap simulasi, bukan integrasi.",
      )}
      <div className="wf-callout">
        Matriks memetakan enam diagram, bukan sertifikasi kepatuhan. Cross-check
        lanjutan menambahkan parameter berbasis pengamatan; benchmark PCI dan
        laporan jembatan; pemeriksaan PIC, validasi akhir; audit 100% sebelum
        upload; checklist audit; verifikasi dan penerapan koreksi; bukti siklus
        Semester II; jadwal snapshot; serta BA yang terhubung ke kontrol
        dokumen. Semuanya simulasi lokal.
      </div>
      <Panel
        title="Temuan yang ditutup dan batas yang tetap berlaku"
        icon={ClipboardCheck}
      >
        {[
          "01 / V2,H2,V4: 6 benchmark PCI, 5 ulangan, cabang manual dan Laporan Jembatan Bab I–IV",
          "02 / PGJ,VL,END1: pemeriksaan Pengguna Jasa, cakupan jembatan ≥10%, laporan dan lokasi akhir/alat tetap",
          "03 / B1→UP→SV→C1: audit internal sebelum upload, audit berikutnya hanya setelah VALID",
          "04 / KV,APP,EXE,CLOSE,BACK: Surveyor→Team Leader→Balai, revisi, terapkan cleaned, batalkan validasi lama, buka tahap kembali",
          "00 / SEM2 dan 03 / TD: kalibrasi/uji/survei IRI Semester II, upload/sanggah dan laporan sebagai syarat T4",
          "05 / M3a,M7,M10b: hitung parameter, referensi BA lintas modul dan snapshot terjadwal simulasi",
        ].map((item) => (
          <div className="wf-row" key={item}>
            <span>{item}</span>
            <Badge tone="good">Ditambahkan</Badge>
          </div>
        ))}
        <div className="wf-callout warn">
          Batas yang disengaja: tidak ada autentikasi/kunci akun nyata,
          integrasi DJBM atau backup file nyata. Sampling 5% berbasis panjang
          rekaman tetap estimasi karena interval STA per segmen belum tersimpan.
          Pengukuran GIS/sertifikat/formulir masih berupa referensi bukti
          simulasi, bukan verifikasi file asli.
        </div>
      </Panel>
      <Panel
        title="Cakupan keenam diagram sumber"
        icon={BookOpen}
        extra={<Badge tone="good">{coverage.length}/6 dipetakan</Badge>}
      >
        <div className="wf-table">
          <table data-testid="table-diagram-coverage">
            <thead>
              <tr>
                <th>Sumber Mermaid</th>
                <th>Alur yang ditelusuri</th>
                <th>Modul / tahap operasional</th>
                <th>Audit</th>
              </tr>
            </thead>
            <tbody>
              {coverage.map((r, i) => (
                <tr
                  key={r.diagram}
                  data-testid={`row-diagram-coverage-${i + 1}`}
                >
                  <td>
                    <strong>{r.diagram}</strong>
                    <div className="wf-code">
                      attached_assets/
                      {
                        [
                          "00_ringkasan_alur_qaqc_1791377623126.mermaid",
                          "01_persiapan_kalibrasi_validasi_produksi_1791377623126.mermaid",
                          "02_pengumpulan_data_verval_2mingguan_1791377623126.mermaid",
                          "03_penyerahan_upload_audit_berjenjang_1791377623126.mermaid",
                          "04_tindakan_perbaikan_koreksi_data_1791377623125.mermaid",
                          "05_modul_dashboard_monitoring_mutu_1791377623126.mermaid",
                        ][i]
                      }
                    </div>
                  </td>
                  <td>{r.source}</td>
                  <td>{r.module}</td>
                  <td>
                    <Badge tone="good">{r.status}</Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Panel>
      <div className="wf-grid equal" style={{ marginTop: 12 }}>
        <Panel title="Loop tertahan → koreksi → kembali" icon={RotateCcw}>
          <div className="wf-stage">
            <span className="wf-stage-num">!</span>
            <div>
              <strong>Ambang / konsistensi / LRS / audit gagal</strong>
              <small>Kasus berbukti menyimpan alasan dan tahap asal.</small>
            </div>
            <Badge tone="warn">Terhubung</Badge>
          </div>
          <div className="wf-stage">
            <span className="wf-stage-num">↺</span>
            <div>
              <strong>Uji ulang lulus</strong>
              <small>Status kembali ke tahap tertahan yang dicatat.</small>
            </div>
            <Badge tone="good">Return stage</Badge>
          </div>
        </Panel>
        <Panel title="Batas integrasi & demo" icon={ShieldCheck}>
          <div className="wf-callout warn">
            Pilihan tujuan sistem, media backup, status upload, peran dan BA
            hanya data simulasi. Tidak ada autentikasi, file nyata, integrasi
            DJBM, SMD Jalan, INVI-J, InSlope atau InDrain.
          </div>
        </Panel>
      </div>
    </>
  );
}
