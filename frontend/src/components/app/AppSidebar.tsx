import { useEffect, useRef } from "react";
import { X } from "lucide-react";
import type { RoleNavItem } from "../../workflow/roleNavigation";
import { RoleSidebar } from "../../workflow/RoleSidebar";

type AppSidebarProps = {
  mobileOpen: boolean;
  navigation: RoleNavItem[];
  location: string;
  activeTab: string;
  selectedSubmodule: string;
  activePackageId: string | null;
  isPackageWorkspace: boolean;
  onCloseMobile: () => void;
  onClearSubmodule: () => void;
  onNavigateSubmodule: (selection: string) => void;
  onSetActiveTab: (tab: string) => void;
  onSetLocation: (path: string) => void;
};

export function AppSidebar({
  mobileOpen,
  navigation,
  location,
  activeTab,
  selectedSubmodule,
  activePackageId,
  isPackageWorkspace,
  onCloseMobile,
  onClearSubmodule,
  onNavigateSubmodule,
  onSetActiveTab,
  onSetLocation,
}: AppSidebarProps) {
  const panel = useRef<HTMLElement>(null);
  useEffect(() => {
    if (!mobileOpen) return;
    const previous = document.activeElement as HTMLElement | null;
    const oldOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    panel.current?.querySelector<HTMLElement>("button")?.focus();
    const key = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onCloseMobile();
        return;
      }
      if (e.key !== "Tab") return;
      const items = Array.from(
        panel.current?.querySelectorAll<HTMLElement>(
          "button:not(:disabled),a[href]",
        ) ?? [],
      ).filter((el) => el.offsetParent !== null);
      const first = items[0],
        last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last?.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", key);
    return () => {
      document.body.style.overflow = oldOverflow;
      document.removeEventListener("keydown", key);
      previous?.focus();
    };
  }, [mobileOpen, onCloseMobile]);
  return (
    <>
      <div
        className={`mobile-scrim ${mobileOpen ? "show" : ""}`}
        onClick={onCloseMobile}
      />
      <aside
        ref={panel}
        aria-label="Menu utama"
        role={mobileOpen ? "dialog" : undefined}
        aria-modal={mobileOpen || undefined}
        className={`sidebar ${mobileOpen ? "open" : ""}`}
      >
        <button
          type="button"
          className="jm-close-nav"
          aria-label="Tutup navigasi"
          onClick={onCloseMobile}
        >
          <X size={20} />
        </button>
        <div className="brand">
          <img
            className="brand-mark-image"
            src={`${import.meta.env.BASE_URL}jala-mutu-mark.png`}
            alt="Simbol JALA MUTU"
          />
          <div className="brand-copy">
            <div className="brand-name">
              <span>JALA</span>
              <span className="brand-name-accent">MUTU</span>
            </div>
            <div className="brand-tagline">
              Jaminan &amp; Pengendalian
              <br />
              Mutu Survei Jalan
            </div>
          </div>
        </div>
        <RoleSidebar
          mobileOpen={mobileOpen}
          navigation={navigation}
          location={location}
          activeTab={activeTab}
          selectedSubmodule={selectedSubmodule}
          activePackageId={activePackageId}
          isPackageWorkspace={isPackageWorkspace}
          onClearSubmodule={onClearSubmodule}
          onNavigateSubmodule={onNavigateSubmodule}
          onSetActiveTab={onSetActiveTab}
          onSetLocation={onSetLocation}
          onCloseMobile={onCloseMobile}
        />
        <div className="side-foot">
          QA/QC Survei Kondisi Jalan
          <br />
          <span style={{ color: "#75bde7" }}>Ruang kerja QA/QC</span>
        </div>
      </aside>
    </>
  );
}
