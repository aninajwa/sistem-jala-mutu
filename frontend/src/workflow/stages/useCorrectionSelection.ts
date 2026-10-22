import { localPersistence } from '../repository/localPersistence';
import { useState } from "react";
export function useCorrectionSelection(packageId: string) {
  const key = `jala-correction-selection:${packageId}`;
  const [selected, setSelected] = useState(() => {
    try {
      return localPersistence.getItem(key) ?? "";
    } catch {
      return "";
    }
  });
  const select = (id: string) => {
    setSelected(id);
    try {
      localPersistence.setItem(key, id);
    } catch {
      /* selection still works */
    }
  };
  return [selected, select] as const;
}
