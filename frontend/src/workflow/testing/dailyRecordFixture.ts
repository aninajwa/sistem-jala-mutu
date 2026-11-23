import type { DailySurveyRecord } from '../model';
import { dailyChecks, evaluateDailySurvey } from '../surveyStandards';

/** Complete the synthetic IRI/RNI/Lendutan metadata required by the Tahap 3A entry form. */
export function withCompleteDailyRecord(record: DailySurveyRecord): DailySurveyRecord {
  const fields = {
    IRI: {
      iriClass: 'Kelas 1', crew: '3', recorder: 'Pencatat uji',
      targetSpeed: '40', actualSpeed: '40', longWarmup: 'Tidak', warmup: '5',
    },
    RNI: {
      fromSta: '0', toSta: String(record.lengthKm * 100), laneCode: 'L1', surfaceType: 'ASPAL',
      surfaceYear: '2026', laneWidth: '3.5', surfaceWidth: '7', inventoryForm: 'FORM-RNI-UJI-42',
    },
    Lendutan: {
      method: 'FWD', station: '1', temperature: '27', drops: '3', load: '40',
      slope: '2', sensors: '7', geophones: '0 200 300 450 600 900 1200',
    },
  };
  const type = record.surveyType;
  if (type !== 'IRI' && type !== 'RNI' && type !== 'Lendutan') {
    throw new Error(`Fixture rekaman harian belum disediakan untuk ${type}.`);
  }
  const completed = {
    ...record,
    tool: type === 'Lendutan' ? 'FWD Dynatest' : record.tool,
    technicalData: { ...record.technicalData, ...fields[type] },
  };
  completed.dailyToolCheck = Object.fromEntries(dailyChecks(completed).map(label => [label, true]));
  const errors = evaluateDailySurvey(completed);
  if (errors.length) throw new Error(`Fixture harian ${record.id}: ${errors.join('; ')}`);
  return completed;
}
