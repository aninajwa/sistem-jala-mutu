import type { CalibrationRecord, SurveyType } from '../workflow/model';
import { SURVEY_TYPES } from '../workflow/model';

export type Stage1SurveyType = { jenis_survei_id: number; kode: string; nama: string; aktif?: boolean };
export type Stage1Team = { tim_id: number; paket_id: number; jenis_survei_id: number; nama_tim: string; jenis_survei?: Stage1SurveyType | null };
export type Stage1Assignment = { penugasan_id: number; tim_id: number; alat_id: number; alat_survei?: { alat_id: number; jenis_survei_id: number; nama_alat: string; nomor_seri: string; tahun_perolehan: number | null; kondisi: string } | null };
export type Stage1Member = { anggota_id: number; tim_id: number; personel_id: number; peran: string; personel?: { personel_id: number; nama: string } | null };
export type Stage1Qualification = { kualifikasi_id: number; personel_id: number; berlaku_sd: string | null; jenis: string; nomor: string };
export type Stage1Calibration = { kalibrasi_id: number; paket_id: number; alat_id: number; jenis: string; standar: string; komponen: string; tgl_kalibrasi: string; berlaku_sd: string | null; pelaksana: string; dokumen_id: number | null; status: string; dokumen?: { dokumen_id: number; judul: string; versi_aktif: number } | null };
export type Stage1ServerData = { surveyTypes: Stage1SurveyType[]; teams: Stage1Team[]; assignments: Stage1Assignment[]; members: Stage1Member[]; qualifications: Stage1Qualification[]; calibrations: Stage1Calibration[] };

const normalized = (value: string) => value.normalize('NFKD').replace(/[\u0300-\u036f]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
const surveyAliases: Record<string, SurveyType> = {
  IRI: 'IRI', PCI: 'PCI', LENDUTAN: 'Lendutan', LENDUT: 'Lendutan', DEFLECTION: 'Lendutan',
  JEMBATAN: 'Jembatan', BRIDGE: 'Jembatan', LERENG: 'Lereng', SLOPE: 'Lereng',
  DRAINASE: 'Drainase', DRAINAGE: 'Drainase', 'LALU LINTAS': 'Lalu Lintas', LALULINTAS: 'Lalu Lintas', TRAFFIC: 'Lalu Lintas', RNI: 'RNI',
};
export function mapServerSurveyType(type: Pick<Stage1SurveyType, 'kode' | 'nama'>): SurveyType | null {
  return surveyAliases[normalized(type.kode)] ?? surveyAliases[normalized(type.nama)] ?? null;
}

export function mapStage1ServerData(data: Stage1ServerData, packageId: string): { surveyTypes: SurveyType[]; calibrations: CalibrationRecord[]; assignments: NonNullable<import('../workflow/stages/stageSupport').WorkflowStageProps['serverAssignments']> } {
  const typeById = new Map(data.surveyTypes.map(item => [item.jenis_survei_id, mapServerSurveyType(item)]));
  const scopedTeams = data.teams.filter(team => String(team.paket_id) === packageId);
  const scopedTypeIds = new Set(scopedTeams.map(team => team.jenis_survei_id));
  const surveyTypes = SURVEY_TYPES.filter(type => [...scopedTypeIds].some(id => typeById.get(id) === type));
  const assignments = new Map<number, Stage1Assignment[]>();
  for (const assignment of data.assignments) assignments.set(assignment.alat_id, [...(assignments.get(assignment.alat_id) ?? []), assignment]);
  const membersByTeam = new Map<number, Stage1Member[]>();
  for (const member of data.members) membersByTeam.set(member.tim_id, [...(membersByTeam.get(member.tim_id) ?? []), member]);
  const calibrations = data.calibrations.filter(item => String(item.paket_id) === packageId).flatMap((item): CalibrationRecord[] => {
    const assignmentCandidates = assignments.get(item.alat_id) ?? [];
    // The calibration contract references the equipment, not the team assignment.
    // If the same equipment is assigned to multiple teams, do not guess the team.
    const assignment = assignmentCandidates.length === 1 ? assignmentCandidates[0] : undefined;
    const team = assignment && scopedTeams.find(candidate => candidate.tim_id === assignment.tim_id);
    const equipment = assignment?.alat_survei;
    const surveyType = team ? typeById.get(team.jenis_survei_id) : null;
    if (!assignment || !team || !equipment || !surveyType) return [];
    const member = (membersByTeam.get(team.tim_id) ?? []).find(candidate => candidate.peran.toLowerCase().includes('ketua'))
      ?? (membersByTeam.get(team.tim_id) ?? [])[0];
    const quals = data.qualifications.filter(qualification => member && qualification.personel_id === member.personel_id);
    return [{
      id: `server-calibration-${item.kalibrasi_id}`,
      equipment: equipment.nama_alat,
      serialNumber: equipment.nomor_seri,
      year: equipment.tahun_perolehan ?? 0,
      condition: equipment.kondisi,
      calibrationKind: item.jenis === 'RELATIF' ? 'Relatif berkala' : 'Referensi tahunan',
      lastCalibrated: item.tgl_kalibrasi,
      dueDate: item.berlaku_sd ?? '',
      personInCharge: member?.personel?.nama ?? item.pelaksana,
      // The API explicitly says qualification eligibility has not been evaluated.
      qualificationValid: false,
      trainingVerified: false,
      standardReference: item.standar,
      certificateReference: item.dokumen ? `${item.dokumen.judul} (dokumen #${item.dokumen.dokumen_id}, v${item.dokumen.versi_aktif})` : item.dokumen_id ? `Dokumen #${item.dokumen_id}` : '',
      surveyType,
      serverIds: { calibrationId: item.kalibrasi_id, equipmentId: item.alat_id, teamId: team.tim_id, personId: member?.personel_id ?? null, qualificationIds: quals.map(qualification => qualification.kualifikasi_id), documentId: item.dokumen_id },
    }];
  });
  const assignmentViews = data.assignments.flatMap((assignment) => {
    const team = scopedTeams.find(candidate => candidate.tim_id === assignment.tim_id);
    const equipment = assignment.alat_survei;
    const surveyType = team ? typeById.get(team.jenis_survei_id) : null;
    if (!team || !equipment || !surveyType) return [];
    const member = (membersByTeam.get(team.tim_id) ?? []).find(candidate => candidate.peran.toLowerCase().includes('ketua'))
      ?? (membersByTeam.get(team.tim_id) ?? [])[0];
    const teamMembers = membersByTeam.get(team.tim_id) ?? [];
    const membersForView = teamMembers.length ? teamMembers : [undefined];
    return membersForView.map(person => ({ assignmentId: `${assignment.penugasan_id}-${person?.personel_id ?? 'no-person'}`, teamId: team.tim_id, equipmentId: assignment.alat_id, personId: person?.personel_id ?? null,
      qualificationIds: data.qualifications.filter(qualification => person && qualification.personel_id === person.personel_id).map(item => item.kualifikasi_id),
      surveyType, teamName: team.nama_tim, equipment: equipment.nama_alat, serialNumber: equipment.nomor_seri, personName: person?.personel?.nama ?? 'Personel belum ditetapkan' }));
  });
  return { surveyTypes, calibrations, assignments: assignmentViews };
}
