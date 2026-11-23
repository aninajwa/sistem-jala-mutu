import type { DailySurveyRecord } from '../model';

export function Stage3BRecordTable({ records, status }: {
  records: DailySurveyRecord[];
  status: (record: DailySurveyRecord) => string;
}) {
  if (!records.length) return <p>Belum ada rekaman untuk pilihan ini.</p>;

  return (
    <table className="stage3b-record-table" aria-label="Rekaman survei harian">
      <thead><tr><th scope="col">Tanggal</th><th scope="col">Survei dan lokasi</th><th scope="col">Status</th></tr></thead>
      <tbody>
        {records.map(record => (
          <tr key={record.id}>
            <td><time dateTime={record.date}>{record.date}</time></td>
            <td>
              <strong>{record.surveyType} · {record.road}</strong>
              {record.lane && <small>{record.lane}</small>}
              {record.technicalData?.evidence && <small>Bukti · {record.technicalData.evidence}</small>}
            </td>
            <td>{status(record)}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
