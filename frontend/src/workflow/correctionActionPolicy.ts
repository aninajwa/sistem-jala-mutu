import { isAdministrativeReminder } from './correctionSourcePolicy';
import { CORRECTION_ACTIONS, type CorrectionCase } from "./model";

const nonDataActions = ["Pelatihan ulang personel", "Kalibrasi ulang alat", "Penggantian komponen alat", "Penggantian personel"];
const delayAction = "Investigasi keterlambatan dan rencana tindak lanjut";
const processingAction = "Koreksi pemrosesan dengan bukti";
export function correctionAllowsNotApplicable(c: CorrectionCase): boolean {
  return !!c.calibrationFinding || nonDataActions.includes(c.actionType) || isAdministrativeReminder(c.source);
}
export function correctionCompatibleActions(c: CorrectionCase): string[] {
  if (c.calibrationFinding) return [...nonDataActions, "Ambil ulang foto/video"];
  if (isAdministrativeReminder(c.source)) return [delayAction];
  if (c.fieldDataValid === "Ya") return [processingAction];
  if (c.fieldDataValid === "Tidak Berlaku") return [...nonDataActions];
  return CORRECTION_ACTIONS.filter(a => a !== delayAction && (c.fieldDataValid !== "Tidak" || a !== processingAction));
}
export function correctionActionErrors(c: CorrectionCase): string[] {
  if (!["Ya", "Tidak", "Tidak Berlaku"].includes(c.fieldDataValid)) return ["Tentukan validitas data yang terdampak."];
  if (!correctionCompatibleActions(c).includes(c.actionType)) return ["Jenis tindakan tidak sesuai dengan objek atau validitas temuan."];
  if (c.fieldDataValid === "Tidak Berlaku" && !correctionAllowsNotApplicable(c)) return ["Validitas data tidak dapat diabaikan untuk tindakan ini."];
  if (nonDataActions.includes(c.actionType) && c.fieldDataValid === "Ya") return ["Untuk tindakan alat atau personel, pilih validitas data Tidak Berlaku atau Tidak jika data terdampak."];
  return [];
}

/** ERD 06: layered verification belongs to KOREKSI_DATA, not every action. */
export const requiresLayeredCorrectionVerification = (c: CorrectionCase) => c.actionType === processingAction;

/** Changing the action invalidates scenario evidence; the user must explicitly
 * review the requirements for the new action before submitting. */
export function correctionActionChange(c: CorrectionCase, actionType: string): Partial<CorrectionCase> {
  if (c.actionType === actionType) return {};
  return { actionType, ruleChecks: {}, ruleNumbers: {}, provinceUpdateBa: "",
    proposedValue: "" };
}
