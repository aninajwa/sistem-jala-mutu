export const ACCEPTANCE_CRITERIA = [
  'Format data sesuai dengan ketentuan',
  'Data lengkap untuk semua parameter yang disyaratkan',
  'Ketelitian data memenuhi standar',
  'Hasil verifikasi dan validasi menunjukkan kesesuaian',
  'Dokumentasi QA/QC lengkap dan sesuai',
] as const;

export type AcceptanceCriterion = (typeof ACCEPTANCE_CRITERIA)[number];

export function AcceptanceCriteriaPanel({
  values,
  readOnly,
  onChange,
}: {
  values: Record<string, boolean>;
  readOnly: boolean;
  onChange: (criterion: AcceptanceCriterion, checked: boolean) => void;
}) {
  const completed = ACCEPTANCE_CRITERIA.filter(item => !!values[item]).length;
  return <div>
    <div className="wf-callout" style={{marginBottom:10}}>
      Kriteria penerimaan mengikuti Draft Petunjuk Pelaksanaan QA/QC. PIC Balai / Pengguna Jasa menilai tiap butir sebelum BA penerimaan diterbitkan.
    </div>
    <div className="wf-note" style={{marginBottom:8}}>{completed}/{ACCEPTANCE_CRITERIA.length} kriteria terpenuhi</div>
    {ACCEPTANCE_CRITERIA.map(criterion => <label className="wf-row" key={criterion} style={{cursor:readOnly?'default':'pointer'}}>
      <input
        type="checkbox"
        checked={!!values[criterion]}
        disabled={readOnly}
        onChange={event => onChange(criterion,event.target.checked)}
      />
      <span style={{flex:1}}>{criterion}</span>
      <strong>{values[criterion]?'Memenuhi':'Belum memenuhi'}</strong>
    </label>)}
  </div>;
}
