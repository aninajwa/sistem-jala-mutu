import { describeStageJourney } from './stageRoleJourneyModel';
import './stageRoleJourney.css';

export function StageRoleJourney(props: Parameters<typeof describeStageJourney>[0]) {
  const card = describeStageJourney(props);
  const target = props.stage === 0 ? 'stage0-role-work' : 'stage1-survey-work';
  return <section className={`stage-role-journey stage-role-journey--${card.tone}`} aria-label={`Panduan pekerjaan Tahap ${props.stage}`} data-testid={`role-journey-stage-${props.stage}`}>
    <div className="stage-role-journey__main">
      <span className="stage-role-journey__eyebrow">{card.eyebrow}</span>
      <h3>{card.title}</h3>
      <p>{card.description}</p>
      <a className="stage-role-journey__action" href={`#${target}`}>{card.action} <span aria-hidden="true">→</span></a>
    </div>
    <ol className="stage-role-journey__steps" aria-label="Urutan pekerjaan">{card.steps.map((step, i) => <li key={step}><span className="stage-role-journey__number">{i + 1}</span><span>{step}</span></li>)}</ol>
  </section>;
}
