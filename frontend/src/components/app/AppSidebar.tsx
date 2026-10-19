import type { RoleNavItem } from '../../workflow/roleNavigation';
import { RoleSidebar } from '../../workflow/RoleSidebar';

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
  return (
    <>
      <div className={`mobile-scrim ${mobileOpen ? 'show' : ''}`} onClick={onCloseMobile} />
      <aside className={`sidebar ${mobileOpen ? 'open' : ''}`}>
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
              Jaminan &amp; Pengendalian<br />Mutu Survei Jalan
            </div>
          </div>
        </div>
        <RoleSidebar
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
          QA/QC Survei Kondisi Jalan<br />
          <span style={{ color: '#75bde7' }}>Versi operasional 1.0</span>
        </div>
      </aside>
    </>
  );
}
