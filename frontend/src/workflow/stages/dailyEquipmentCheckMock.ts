export type DailyEquipmentCheckMock = {
  id: string;
  packageId: number;
  equipmentId: number;
  equipmentName: string;
  date: string;
  item: 'GPS' | 'BATERAI' | 'PENYIMPANAN' | 'BOUNCE_TEST_KELAS_I';
  result: 'OK' | 'BERMASALAH' | 'TIDAK_DILAKUKAN';
  note: string;
  recordedBy: string;
};

// Synthetic display fixture only. Never use as a production or persisted record.
export const DAILY_EQUIPMENT_CHECK_MOCK: readonly DailyEquipmentCheckMock[] = [
  { id: 'QA-001', packageId: 301, equipmentId: 801, equipmentName: 'GPS Geodetik · ALAT-801', date: '2026-05-20', item: 'GPS', result: 'OK', note: 'Sinyal dan waktu satelit terdeteksi (fixture sintetik).', recordedBy: 'Pengguna QA' },
  { id: 'QA-002', packageId: 301, equipmentId: 801, equipmentName: 'GPS Geodetik · ALAT-801', date: '2026-05-20', item: 'BATERAI', result: 'BERMASALAH', note: 'Contoh catatan baterai perlu diganti; bukan temuan sebenar.', recordedBy: 'Pengguna QA' },
  { id: 'QA-003', packageId: 301, equipmentId: 802, equipmentName: 'Perangkat survei · ALAT-802', date: '2026-05-19', item: 'PENYIMPANAN', result: 'OK', note: 'Ruang penyimpanan cukup (contoh TEST/QA).', recordedBy: 'Pengguna QA' },
  { id: 'QA-004', packageId: 301, equipmentId: 803, equipmentName: 'Alat uji kelas I · ALAT-803', date: '2026-05-19', item: 'BOUNCE_TEST_KELAS_I', result: 'TIDAK_DILAKUKAN', note: 'Contoh item; penerapan menunggu pengesahan KAK.', recordedBy: 'Pengguna QA' },
];

export function getDailyEquipmentCheckMock(packageId: number) {
  return DAILY_EQUIPMENT_CHECK_MOCK.filter((record) => record.packageId === packageId);
}
