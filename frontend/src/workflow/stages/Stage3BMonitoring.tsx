import type { ReactNode } from 'react';
import type { OperationalWorkflowState, SurveyType } from '../model';

export function Stage3BMonitoring({ state, surveys, notes, attachments, history }: {
  state: OperationalWorkflowState;
  surveys: SurveyType[];
  notes?: ReactNode;
  attachments: ReactNode;
  history: ReactNode;
}) {
  const directorate = state.role === 'Direktorat / Pusat';
  return (
    <section className="stage3b-monitor" aria-label={directorate ? 'Pemantauan pemeriksaan' : 'Status administrasi'}>
      <h2>{directorate ? 'Pemantauan pemeriksaan' : 'Status administrasi'}</h2>
      <dl className="stage3b-facts">
        <div><dt>Lingkup survei</dt><dd>{surveys.join(', ') || 'Belum ditetapkan'}</dd></div>
        <div><dt>BA V&amp;V 2-Mingguan</dt><dd>{state.cycle.certificateId || 'Belum tercatat'}</dd></div>
      </dl>
      {directorate && <>
        <details className="stage3b-disclosure">
          <summary>Hasil per survei</summary>
          {surveys.length ? <dl className="stage3b-facts">{surveys.map(survey => {
            const review = state.cycle.surveyReviews?.[survey];
            return <div key={survey}><dt>{survey}</dt><dd>
              {state.cycle.reviewPendingTypes?.includes(survey) ? 'Perlu diperiksa ulang' : review?.decision || 'Belum diperiksa'}
              {review?.note && <small>{review.note}</small>}
            </dd></div>;
          })}</dl> : <p>Lingkup survei belum ditetapkan.</p>}
        </details>
        {history}
        {notes}
      </>}
      <details className="stage3b-disclosure">
        <summary>Dokumen periode</summary>
        {attachments}
      </details>
    </section>
  );
}
