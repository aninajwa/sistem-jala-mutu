
import type { OperationalWorkflowState } from "../../../workflow/model";

type Props = {
  packages: Record<string, OperationalWorkflowState>;
};

export default function Audit3PackageSummary({ packages }: Props) {
  const audits = Object.entries(packages)
    .map(([packageId, state]) => {
      const audit = state.audits?.find((item) => item.level === 3);

      if (!audit) return null;

      const relatedCorrections = (state.corrections ?? []).filter(
        (item) =>
          /audit tingkat 3|audit 3/i.test(
            `${item.blockedStage} ${item.source} ${item.returnStage}`
          )
      );

      return {
        packageId,
        packageName: state.project.packageName || packageId,
        balai: state.project.balai || "Belum ditentukan",
        status: audit.status,
        requiresReview: audit.requiresReview ?? false,
        baNumber: audit.baNumber || "",
        relatedCorrections: relatedCorrections.length,
        openCorrections: relatedCorrections.filter(
          (item) => item.status !== "Ditutup"
        ).length,
      };
    })
    .filter((item): item is NonNullable<typeof item> => item !== null);

  const started = audits.filter(
    (item) => item.status !== "Belum Dimulai"
  );

  const passed = started.filter(
    (item) => item.status === "Lulus" && !item.requiresReview
  ).length;

  const needReview = started.filter(
    (item) => item.requiresReview || item.status !== "Lulus"
  ).length;

  return (
    <section className="corr-panel">
      <h3>Monitoring Audit Tingkat 3 per Paket</h3>

      <div className="corr-audit-summary">
        <article>
          <small>Audit sudah dimulai</small>
          <strong>{started.length}</strong>
        </article>
        <article>
          <small>Audit lulus</small>
          <strong>{passed}</strong>
        </article>
        <article>
          <small>Belum lulus / perlu pemeriksaan</small>
          <strong>{needReview}</strong>
        </article>
      </div>

      <div className="corr-table-scroll">
        <table>
          <thead>
            <tr>
              <th>Paket</th>
              <th>Balai</th>
              <th>Status Audit 3</th>
              <th>BA</th>
              <th>Kasus terkait</th>
              <th>Masih terbuka</th>
            </tr>
          </thead>
          <tbody>
            {audits.map((item) => (
              <tr key={item.packageId}>
                <td><strong>{item.packageName}</strong></td>
                <td>{item.balai}</td>
                <td>
                  {item.status}
                  {item.requiresReview ? " — Perlu pemeriksaan ulang" : ""}
                </td>
                <td>{item.baNumber || "Belum tersedia"}</td>
                <td>{item.relatedCorrections}</td>
                <td>{item.openCorrections}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {audits.length === 0 && (
        <p>Belum ada informasi Audit Tingkat 3 pada paket yang tersedia.</p>
      )}
    </section>
  );
}
