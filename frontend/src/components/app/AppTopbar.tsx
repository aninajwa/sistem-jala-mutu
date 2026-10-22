import {isRoleTestMode} from '../../workflow/access/packageAccess';
import { Menu, Users } from 'lucide-react';

import { titleFor } from '../../app/navigation';
import { balais, periodeOptions, surveiTypes } from '../../lib/demoData';
import type { WorkflowRole } from '../../workflow/model';
import type { RoleNavItem } from '../../workflow/roleNavigation';

type FilterProps = {
  balai: string;
  setBalai: (value: string) => void;
  periode: string;
  setPeriode: (value: string) => void;
  jenis: string;
  setJenis: (value: string) => void;
};

type MobileFiltersProps = FilterProps & {
  showJenis: boolean;
};

type AppTopbarProps = FilterProps & {
  isPackageWorkspace: boolean;
  packageName?: string;
  location: string;
  navigation: RoleNavItem[];
  activeRole: WorkflowRole;
  onSwitchRole: () => void;
  onOpenMobile: () => void;
};

export function AppTopbar({
  isPackageWorkspace,
  packageName,
  location,
  navigation,
  balai,
  setBalai,
  periode,
  setPeriode,
  jenis,
  setJenis,
  activeRole,
  onSwitchRole,
  onOpenMobile,
}: AppTopbarProps) {
  return (
    <header className="topbar">
      <div className="top-left">
        <button
          className="mobile-toggle"
          onClick={onOpenMobile}
          aria-label="Buka navigasi"
          data-testid="button-open-navigation"
        >
          <Menu size={18} />
        </button>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 9, flexWrap: 'wrap' }}>
            <div className="page-title">
              {isPackageWorkspace ? 'Detail paket QA/QC' : (titleFor[location] || 'Monitoring QA/QC')}
            </div>
          </div>
          <div className="crumb">
            QA/QC Survei Kondisi Jalan <span style={{ margin: '0 5px' }}>›</span>{' '}
            {isPackageWorkspace
              ? 'Workspace Paket'
              : (navigation.find(item => item.path === location)?.label || 'Ringkasan')}
          </div>
        </div>
      </div>
      <div className="global-filters">
        {!isPackageWorkspace&&location!=="/packages"&&<><div className="filter-wrap">
          <label>Balai:</label>
          <select value={balai} onChange={e => setBalai(e.target.value)} data-testid="select-global-balai">
            <option>Semua Balai</option>
            {balais.map(x => <option key={x}>{x}</option>)}
          </select>
        </div>
        <div className="filter-wrap">
          <label>Periode:</label>
          <select value={periode} onChange={e => setPeriode(e.target.value)} data-testid="select-global-periode">
            {periodeOptions.map(x => <option key={x}>{x}</option>)}
          </select>
        </div>
        </>}
        {location === '/' && (
          <div className="filter-wrap">
            <label>Jenis survei:</label>
            <select value={jenis} onChange={e => setJenis(e.target.value)} data-testid="select-survey-type">
              <option>Semua</option>
              {surveiTypes.map(x => <option key={x}>{x}</option>)}
            </select>
          </div>
        )}
        <div className="filter-wrap">
          <label>Peran aktif:</label>
          {isRoleTestMode()?<button
            className="btn sm"
            onClick={onSwitchRole}
            data-testid="button-switch-role"
            title="Keluar dari sesi uji peran"
          >
            <Users size={12} />Uji peran: {activeRole}
          </button>:<strong className="active-role-label">{activeRole}</strong>}
        </div>
      </div>
    </header>
  );
}

export function MobileFilters({
  balai,
  setBalai,
  periode,
  setPeriode,
  jenis,
  setJenis,
  showJenis,
}: MobileFiltersProps) {
  return (
    <div
      className="mobile-filters"
      style={{ gap: 7, marginBottom: 11, flexWrap: 'wrap' }}
      data-testid="mobile-global-filters"
    >
      <div className="filter-wrap" style={{ flex: 1, minWidth: 135 }}>
        <label>Balai</label>
        <select value={balai} onChange={e => setBalai(e.target.value)} data-testid="select-mobile-balai">
          <option>Semua Balai</option>
          {balais.map(x => <option key={x}>{x}</option>)}
        </select>
      </div>
      <div className="filter-wrap" style={{ flex: 1, minWidth: 135 }}>
        <label>Periode</label>
        <select value={periode} onChange={e => setPeriode(e.target.value)} data-testid="select-mobile-periode">
          {periodeOptions.map(x => <option key={x}>{x}</option>)}
        </select>
      </div>
      {showJenis && (
        <div className="filter-wrap" style={{ flex: 1, minWidth: 135 }}>
          <label>Jenis survei</label>
          <select value={jenis} onChange={e => setJenis(e.target.value)} data-testid="select-mobile-survey-type">
            <option>Semua</option>
            {surveiTypes.map(x => <option key={x}>{x}</option>)}
          </select>
        </div>
      )}
    </div>
  );
}
