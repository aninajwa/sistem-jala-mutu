import { useEffect, useState, type ReactNode } from "react";
import { SlidersHorizontal, RotateCcw } from "lucide-react";
import { useCompact } from "./useCompact";
export function FilterPanel({
  children,
  activeCount = 0,
  onReset,
  title = "Filter",
  initiallyOpen,
}: {
  children: ReactNode;
  activeCount?: number;
  onReset?: () => void;
  title?: string;
  initiallyOpen?: boolean;
}) {
  const compact = useCompact();
  const [open, setOpen] = useState(initiallyOpen ?? !compact);
  useEffect(() => setOpen(initiallyOpen ?? !compact), [compact, initiallyOpen]);
  return (
    <details
      className="b-filter-panel"
      data-filter-panel
      open={open}
      onToggle={(e) => setOpen(e.currentTarget.open)}
    >
      <summary>
        <SlidersHorizontal size={16} />
        <span>{title}</span>
        <b className={activeCount ? "is-active" : ""}>
          {activeCount ? `${activeCount} aktif` : "Semua data"}
        </b>
      </summary>
      <div className="b-filter-panel-content">
        {onReset && (
          <button className="b-text-action b-filter-reset" onClick={onReset}>
            <RotateCcw size={14} />
            Reset semua filter
          </button>
        )}
        {children}
      </div>
    </details>
  );
}
