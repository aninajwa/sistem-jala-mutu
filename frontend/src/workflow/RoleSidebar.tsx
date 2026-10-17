import { useEffect, useState } from 'react';
import { Link } from 'wouter';
import type { RoleNavItem } from './roleNavigation';

type Props = {
  navigation: RoleNavItem[];
  location: string;
  activeTab: string;
  selectedSubmodule: string;
  activePackageId: string | null;
  isPackageWorkspace: boolean;
  onClearSubmodule: () => void;
  onNavigateSubmodule: (selection: string) => void;
  onSetActiveTab: (tab: string) => void;
  onSetLocation: (path: string) => void;
  onCloseMobile: () => void;
};

export function RoleSidebar({
  navigation,
  location,
  activeTab,
  selectedSubmodule,
  activePackageId,
  isPackageWorkspace,
  onClearSubmodule,
  onNavigateSubmodule,
  onSetActiveTab,
  onSetLocation,
  onCloseMobile,
}: Props) {
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const activeItem = navigation.find(item => {
      if (item.path === '/packages') {
        return location === '/packages' || (!!activePackageId && isPackageWorkspace);
      }

      return item.path === location;
    });

    if (!activeItem) return;

    setExpanded(current => ({
      ...current,
      [activeItem.path]: true,
    }));
  }, [location, activePackageId, isPackageWorkspace, navigation]);

  const toggleModule = (item: RoleNavItem) => {
    const isOpen = !!expanded[item.path];

    setExpanded(current => ({
      ...current,
      [item.path]: !isOpen,
    }));

    if (isOpen) return;

    if (item.path !== location) {
      onClearSubmodule();
      onSetActiveTab('Semua');
      onSetLocation(item.path);
    }
  };

  return (
    <nav className="side-nav" aria-label="Navigasi modul">
      {navigation.map(item => {
        const Icon = item.icon;

        const packageActive =
          item.path === '/packages' &&
          !!activePackageId &&
          isPackageWorkspace;

        const active =
          location === item.path ||
          packageActive;

        const open = !!expanded[item.path];

        return (
          <div key={item.path} className="nav-group">
            <button
              type="button"
              className={`nav-link nav-module-button ${active ? 'active' : ''}`}
              onClick={() => toggleModule(item)}
            >
              <Icon size={16} />
              <span>{item.label}</span>
            </button>

            {open && item.children.length > 0 && (
              <div className="nav-children">
                {item.children.map(child => {
                  const selected = child.selection
                    ? selectedSubmodule === child.selection
                    : !!child.href &&
                      location === child.href &&
                      child.tab === activeTab;

                  return (
                    <button
                      key={`${item.path}-${child.label}`}
                      type="button"
                      disabled={child.locked}
                      className={[
                        'nav-child',
                        selected ? 'selected' : '',
                        child.locked ? 'locked' : '',
                      ]
                        .filter(Boolean)
                        .join(' ')}
                      title={child.hint || child.label}
                      onClick={() => {
                        if (child.locked) return;

                        if (child.selection) {
                          onNavigateSubmodule(child.selection);
                          onCloseMobile();
                          return;
                        }

                        onClearSubmodule();
                        onSetActiveTab(child.tab || 'Semua');
                        onSetLocation(child.href || item.path);
                        onCloseMobile();
                      }}
                    >
                      <span>{child.label}</span>

                      {child.locked && (
                        <span className="nav-child-lock" aria-label="Terkunci">
                          •
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </nav>
  );
}