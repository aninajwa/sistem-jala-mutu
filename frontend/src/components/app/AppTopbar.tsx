import {useEffect,useRef} from 'react';
import { useCompact } from "../../design/b/useCompact";
import { FilterPanel } from "../../design/b/FilterPanel";
import { isRoleTestMode } from "../../workflow/access/packageAccess";
import { Menu, Users, LogOut } from "lucide-react";

import { titleFor } from "../../app/navigation";
import { balais, periodeOptions, surveiTypes } from "../../lib/demoData";
import type { WorkflowRole } from "../../workflow/model";
import type { RoleNavItem } from "../../workflow/roleNavigation";

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
  const compact = useCompact();
  const accountRef=useRef<HTMLDetailsElement>(null);
  useEffect(()=>{const dismiss=(e:PointerEvent)=>{if(accountRef.current&&!accountRef.current.contains(e.target as Node))accountRef.current.open=false;};document.addEventListener('pointerdown',dismiss);return()=>document.removeEventListener('pointerdown',dismiss);},[]);
  const shortRole =
    activeRole === "Penyedia Jasa / Ketua Tim"
      ? "Penyedia"
      : activeRole === "PIC Balai / Pengguna Jasa"
        ? "Balai"
        : activeRole === "Direktorat / Pusat"
          ? "Direktorat"
          : "Admin";
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
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 9,
              flexWrap: "wrap",
            }}
          >
            <div className="page-title">
              {isPackageWorkspace
                ? shortRole === "Balai" ? "Pemeriksaan paket" : shortRole === "Direktorat" ? "Pengawasan paket" : shortRole === "Admin" ? "Monitoring paket" : "Pekerjaan paket"
                : location === "/verification"
                  ? activeRole === "Admin"
                    ? "Monitoring Workflow"
                    : activeRole === "Direktorat / Pusat"
                      ? "Audit & Assurance"
                      : "Verifikasi & Review Balai"
                  : location === "/audit"
                    ? "Administrasi & Akses"
                    : location === "/"
                      ? {
                          Penyedia: "Pelaksanaan survei",
                          Balai: "Pemeriksaan Balai",
                          Direktorat: "Pengawasan lintas Balai",
                          Admin: "Administrasi sistem",
                        }[shortRole]
                      : titleFor[location] || "Monitoring QA/QC"}
            </div>
          </div>
          <div className="crumb">
            QA/QC Survei Kondisi Jalan{" "}
            <span style={{ margin: "0 5px" }}>›</span>{" "}
            {isPackageWorkspace
              ? "Workspace Paket"
              : navigation.find((item) => item.path === location)?.label ||
                "Ringkasan"}
          </div>
        </div>
      </div>
      <div className="global-filters">
        {!isPackageWorkspace &&
          location !== "/" &&
          location !== "/packages" &&
          location !== "/notifications" &&
          location !== "/reports" &&
          location !== "/verification" &&
          location !== "/compliance" &&
          location !== "/data-master" &&
          location !== "/audit" &&
          location !== "/actions" && (
            <>
              <div className="filter-wrap">
                <label>Balai:</label>
                <select
                  value={balai}
                  onChange={(e) => setBalai(e.target.value)}
                  data-testid="select-global-balai"
                >
                  <option>Semua Balai</option>
                  {balais.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
              <div className="filter-wrap">
                <label>Periode:</label>
                <select
                  value={periode}
                  onChange={(e) => setPeriode(e.target.value)}
                  data-testid="select-global-periode"
                >
                  <option>Semua periode</option>
                  {periodeOptions.map((x) => (
                    <option key={x}>{x}</option>
                  ))}
                </select>
              </div>
            </>
          )}
        <div className="filter-wrap jm-account">
          <span className="b-role-chip" title={activeRole}>
            {shortRole}
          </span>
          <details
            className="b-account-menu"
            ref={accountRef}
            open={false}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                e.currentTarget.open = false;
                e.currentTarget.querySelector<HTMLElement>("summary")?.focus();
              }
            }}
          >
            <summary aria-label="Menu akun">
              <Users size={17} />
              <span>Akun</span>
            </summary>
            <div className="b-account-actions">
              {import.meta.env.DEV && (
                <small
                  className="c-development"
                  data-testid="development-session"
                >
                  Lingkungan pengujian · data contoh
                </small>
              )}
              <label>Peran sesi uji</label>
              {isRoleTestMode() ? (
                <button
                  className="btn sm"
                  onClick={onSwitchRole}
                  data-testid="button-switch-role"
                  title="Keluar dari sesi uji peran"
                >
                  <Users size={12} />
                  Ganti peran
                </button>
              ) : (
                <strong className="active-role-label">{activeRole}</strong>
              )}
              <button
                type="button"
                className="btn sm jm-logout"
                onClick={onSwitchRole}
                data-testid="button-logout"
              >
                <LogOut size={15} />
                Keluar
              </button>
            </div>
          </details>
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
    <div className="b-mobile-only-filter">
      <FilterPanel
        title="Filter cakupan"
        activeCount={
          Number(balai !== "Semua Balai") +
          Number(periode !== "Semua periode") +
          Number(jenis !== "Semua")
        }
        onReset={() => {
          setBalai("Semua Balai");
          setPeriode("Semua periode");
          setJenis("Semua");
        }}
      >
        <div
          className="mobile-filters"
          style={{ gap: 7, marginBottom: 11, flexWrap: "wrap" }}
          data-testid="mobile-global-filters"
        >
          <div className="filter-wrap" style={{ flex: 1, minWidth: 135 }}>
            <label>Balai</label>
            <select
              value={balai}
              onChange={(e) => setBalai(e.target.value)}
              data-testid="select-mobile-balai"
            >
              <option>Semua Balai</option>
              {balais.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          <div className="filter-wrap" style={{ flex: 1, minWidth: 135 }}>
            <label>Periode</label>
            <select
              value={periode}
              onChange={(e) => setPeriode(e.target.value)}
              data-testid="select-mobile-periode"
            >
              <option>Semua periode</option>
              {periodeOptions.map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </div>
          {showJenis && (
            <div className="filter-wrap" style={{ flex: 1, minWidth: 135 }}>
              <label>Jenis survei</label>
              <select
                value={jenis}
                onChange={(e) => setJenis(e.target.value)}
                data-testid="select-mobile-survey-type"
              >
                <option>Semua</option>
                {surveiTypes.map((x) => (
                  <option key={x}>{x}</option>
                ))}
              </select>
            </div>
          )}
        </div>
      </FilterPanel>
    </div>
  );
}
