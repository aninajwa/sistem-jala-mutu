import { useEffect, useState } from "react";
import { Layers3, ChevronDown } from "lucide-react";
import { useCompact } from "./useCompact";
import { PACKAGE_WORKFLOW_ITEMS } from "../../workflow/roleNavigation";
export function StageNavigator({
  selection,
  process,
  onNavigate,
}: {
  selection?: string;
  process: string;
  onNavigate?: (selection: string) => void;
}) {
  const compact = useCompact(),
    [open, setOpen] = useState(!compact);
  useEffect(() => setOpen(!compact), [compact]);
  const active = PACKAGE_WORKFLOW_ITEMS.find(
    (item) => item.selection === selection,
  );
  return (
    <details
      className="b-stage-menu"
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        <Layers3 size={16} />
        <span>
          {active
            ? `${active.code} · ${active.selection.split(":")[1]}`
            : "Pilih tahap paket"}
        </span>
        <ChevronDown size={16} />
      </summary>
      <nav className="jm-stage-stepper" aria-label="Tahapan paket">
        {PACKAGE_WORKFLOW_ITEMS.map((item) => (
          <button
            type="button"
            key={item.code}
            aria-current={item.selection === selection ? "step" : undefined}
            title={item.actorHint}
            onClick={() => onNavigate?.(item.selection)}
            data-testid={`stage-nav-${item.code.replace("Tahap ", "")}`}
          >
            <span>{item.code.replace("Tahap ", "")}</span>
            <strong>{item.selection.split(":")[1]}</strong>
            {item.code === process && <small>Posisi saat ini</small>}
          </button>
        ))}
      </nav>
    </details>
  );
}
