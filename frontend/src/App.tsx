import { useEffect, useMemo, useState } from 'react';
import { Route, Router as WouterRouter, Switch, useLocation } from 'wouter';
import { CheckCircle2 } from 'lucide-react';

import { titleFor, workflowSubmodules } from './app/navigation';
import { AppSidebar } from './components/app/AppSidebar';
import { AppTopbar, MobileFilters } from './components/app/AppTopbar';
import { DataDialog } from './components/app/DataDialog';
import { RoleEntryScreen } from './components/app/RoleEntryScreen';
import { useDemoStore } from './hooks/useDemoStore';
import { exportDemoDataCsv } from './lib/csv';
import { DEMO_SESSION_KEY } from './lib/demoData';
import { isInPeriod } from './lib/periods';
import ActionsPage from './pages/ActionsPage';
import AuditPage from './pages/AuditPage';
import CompliancePage from './pages/CompliancePage';
import DashboardPage from './pages/DashboardPage';
import DocumentsPage from './pages/DocumentsPage';
import EntryPage from './pages/EntryPage';
import MasterPage from './pages/MasterPage';
import NotificationsPage from './pages/NotificationsPage';
import ReportsPage from './pages/ReportsPage';
import VerificationPage from './pages/VerificationPage';
import { SubmoduleWorkspace } from './SubmoduleWorkspace';
import type { PageProps } from './types';
import type { OperationalWorkflowState, WorkflowRole } from './workflow/model';
import { OperationalWorkflowWorkspace } from './workflow/OperationalWorkflowWorkspace';
import {
  PACKAGE_STORE_KEY,
  derivePackageStage,
  loadWorkflowPackageStore,
  type WorkflowPackageStore,
} from './workflow/packageStore';
import { PackageContextHeader, PackageOverview, PackagesPage } from './workflow/PackageHub';
import { buildCompleteExamplePackage, QA_EXAMPLE_PACKAGE_ID } from './workflow/qaCompleteExamplePackage';
import { buildRoleNavigation } from './workflow/roleNavigation';
import { canAccessRoute } from './workflow/workflowConfig';

function App() {
  const [packageStore, setPackageStore] = useState<WorkflowPackageStore>(() => {
    const loaded = loadWorkflowPackageStore();
    // Satu paket contoh terpisah: data dummy, mesin workflow yang sama.
    // Migrasi sekali dari fixture QA lama; dua paket operasional tidak diubah.
    const alreadySeeded = localStorage.getItem('jala-qa-full-example-v1') === 'yes';
    if (alreadySeeded && loaded.packages[QA_EXAMPLE_PACKAGE_ID]) return loaded;
    const completedExample = buildCompleteExamplePackage();
    completedExample.role = loaded.activeRole;
    localStorage.setItem('jala-qa-full-example-v1', 'yes');
    return {
      ...loaded,
      packages: { ...loaded.packages, [QA_EXAMPLE_PACKAGE_ID]: completedExample },
    };
  });

  const {
    store,
    modal,
    editing,
    initialForm,
    notice,
    setNotice,
    record,
    addOrEdit,
    updateStatus,
    saveReviewDraft,
    reviewSurvey,
    beginEdit,
    openNew,
    closeDialog,
  } = useDemoStore(packageStore.activeRole);

  const activePackageId = packageStore.activePackageId;
  const fallbackPackageId = Object.keys(packageStore.packages)[0] || 'PAKET-DEMO-001';
  const workflow = packageStore.packages[activePackageId || fallbackPackageId];

  const [balai, setBalai] = useState('Semua Balai');
  const [periode, setPeriode] = useState('Semester I 2027');
  const [jenis, setJenis] = useState('Semua');
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Semua');
  const [selectedSubmodule, setSelectedSubmodule] = useState(
    () => new URLSearchParams(window.location.search).get('submodule') || '',
  );
  const [location, setLocation] = useLocation();
  const [demoSession, setDemoSession] = useState(
    () => localStorage.getItem(DEMO_SESSION_KEY) === 'active',
  );

  const isPackageWorkspace =
    !!activePackageId &&
    (
      selectedSubmodule === '/packages:Ringkasan Paket' ||
      workflowSubmodules.has(selectedSubmodule)
    );

  const visibleNav = useMemo(
    () =>
      buildRoleNavigation(
        packageStore.activeRole,
        isPackageWorkspace,
        workflow
          ? derivePackageStage(workflow)
          : 'Tahap 0',
      ),
    [
      packageStore.activeRole,
      isPackageWorkspace,
      workflow,
    ],
  );

  useEffect(() => {
    localStorage.setItem(PACKAGE_STORE_KEY, JSON.stringify(packageStore));
  }, [packageStore]);

  useEffect(() => {
    setMobileOpen(false);
    setSearch('');
    setActiveTab('Semua');
    const selected = new URLSearchParams(window.location.search).get('submodule') || '';
    setSelectedSubmodule(selected.startsWith(`${location}:`) ? selected : '');
  }, [location]);

  const scoped = useMemo(
    () =>
      store.surveys.filter(
        s =>
          (balai === 'Semua Balai' || s.balai === balai) &&
          (jenis === 'Semua' || s.jenis === jenis) &&
          isInPeriod(s.tanggal, periode),
      ),
    [store.surveys, balai, jenis, periode],
  );

  const updateWorkflow = (
    update: (current: OperationalWorkflowState) => OperationalWorkflowState,
    _activity: string,
    _object: string,
  ) =>
    setPackageStore(current => {
      const id = current.activePackageId;
      if (!id || !current.packages[id]) return current;
      return {
        ...current,
        packages: { ...current.packages, [id]: update({ ...current.packages[id], role: current.activeRole }) },
      };
    });

  const enterAsRole = (role: WorkflowRole) => {
    setPackageStore(current => ({
      ...current,
      activeRole: role,
      packages: Object.fromEntries(
        Object.entries(current.packages).map(([id, state]) => [id, { ...state, role }]),
      ),
    }));
    localStorage.setItem(DEMO_SESSION_KEY, 'active');
    setDemoSession(true);
    setSelectedSubmodule('');
    setLocation('/');
    setNotice(`Peran aktif: ${role}`);
  };

  const switchRole = () => {
    localStorage.removeItem(DEMO_SESSION_KEY);
    setDemoSession(false);
    setSelectedSubmodule('');
    setMobileOpen(false);
  };

  const navigateSubmodule = (selection: string) => {
    const url = new URL(window.location.href);
    url.searchParams.set('submodule', selection);
    setSelectedSubmodule(selection);
    setLocation(`${selection.split(':')[0]}${url.search}${url.hash}`);
    setMobileOpen(false);
  };

  const clearSubmodule = () => {
    setSelectedSubmodule('');
    const url = new URL(window.location.href);
    url.searchParams.delete('submodule');
    window.history.replaceState(window.history.state, '', url);
  };

  const openPackage = (id: string) => {
    setPackageStore(current => ({
      ...current,
      activePackageId: id,
      packages: { ...current.packages, [id]: { ...current.packages[id], role: current.activeRole } },
    }));
    setSelectedSubmodule('/packages:Ringkasan Paket');
    setLocation('/packages?submodule=%2Fpackages%3ARingkasan%20Paket');
    setNotice('Workspace paket dibuka.');
  };

  const openPackageBA = (id: string, kind: string) => {
    try {
      localStorage.setItem('jala-ba-navigation-v2', JSON.stringify({ packageId: id, kind, period: 1 }));
      localStorage.setItem('jala-ba-return-to', '/packages:Ringkasan Paket');
    } catch { /* penyimpanan navigasi opsional */ }
    setPackageStore(current => ({
      ...current,
      activePackageId: id,
      packages: { ...current.packages, [id]: { ...current.packages[id], role: current.activeRole } },
    }));
    navigateSubmodule('/documents:BA & dokumen workflow');
  };

  const backToPackages = () => {
    setPackageStore(current => ({ ...current, activePackageId: null }));
    setSelectedSubmodule('');
    setLocation('/packages');
  };

  // Daftar paket sengaja tidak memuat panel kontrol skenario pengembang.
  const qaPackageList = (
    <PackagesPage
      packages={packageStore.packages}
      role={packageStore.activeRole}
      onOpen={openPackage}
    />
  );

  useEffect(() => {
    if (demoSession && !canAccessRoute(packageStore.activeRole, location)) {
      setSelectedSubmodule('');
      setLocation('/');
    }
  }, [demoSession, packageStore.activeRole, location, setLocation]);

  const pageProps: PageProps = {
    store,
    workflow,
    packages: packageStore.packages,
    openPackage,
    openPackageBA,
    balai,
    periode,
    jenis,
    scoped,
    search,
    setSearch,
    activeTab,
    setActiveTab,
    openNew,
    beginEdit,
    updateStatus,
    saveReviewDraft,
    reviewSurvey,
    record,
    setNotice,
  };

  if (!demoSession) {
    return <RoleEntryScreen currentRole={packageStore.activeRole} onEnter={enterAsRole} />;
  }

  return (
    <WouterRouter>
      <div
        className="app-shell"
        onClickCapture={e => {
          if ((e.target as HTMLElement).closest('[data-testid="button-export-report"]')) {
            exportDemoDataCsv(store);
          }
        }}
      >
        <AppSidebar
          mobileOpen={mobileOpen}
          navigation={visibleNav}
          location={location}
          activeTab={activeTab}
          selectedSubmodule={selectedSubmodule}
          activePackageId={activePackageId}
          isPackageWorkspace={isPackageWorkspace}
          onCloseMobile={() => setMobileOpen(false)}
          onClearSubmodule={clearSubmodule}
          onNavigateSubmodule={navigateSubmodule}
          onSetActiveTab={setActiveTab}
          onSetLocation={setLocation}
        />
        <main className="main-area">
          <AppTopbar
            isPackageWorkspace={isPackageWorkspace}
            packageName={workflow.project.packageName}
            location={location}
            navigation={visibleNav}
            balai={balai}
            setBalai={setBalai}
            periode={periode}
            setPeriode={setPeriode}
            jenis={jenis}
            setJenis={setJenis}
            activeRole={packageStore.activeRole}
            onSwitchRole={switchRole}
            onOpenMobile={() => setMobileOpen(true)}
          />
          <div className="content">
            {notice && (
              <div className="notice" role="status" data-testid="status-toast">
                <CheckCircle2 size={14} />{notice}
              </div>
            )}
            <MobileFilters
              balai={balai}
              setBalai={setBalai}
              periode={periode}
              setPeriode={setPeriode}
              jenis={jenis}
              setJenis={setJenis}
              showJenis={location === '/'}
            />
            {selectedSubmodule ? (
              workflowSubmodules.has(selectedSubmodule)
                ? activePackageId
                  ? (
                    <>
                      <PackageContextHeader state={workflow} onBack={backToPackages} onNavigate={navigateSubmodule} />
                      {selectedSubmodule === '/packages:Ringkasan Paket'
                        ? <PackageOverview state={workflow} onNavigate={navigateSubmodule} />
                        : (
                          <OperationalWorkflowWorkspace
                            selection={selectedSubmodule}
                            state={workflow}
                            onUpdate={updateWorkflow}
                            setNotice={setNotice}
                            onNavigate={navigateSubmodule}
                          />
                        )}
                    </>
                  )
                  : qaPackageList
                : (
                  <SubmoduleWorkspace
                    selection={selectedSubmodule}
                    {...pageProps}
                    onBack={() => { clearSubmodule(); setActiveTab('Semua'); }}
                  />
                )
            ) : (
              <Switch>
                <Route path="/"><DashboardPage {...pageProps} /></Route>
                <Route path="/data-master"><MasterPage {...pageProps} /></Route>
                <Route path="/packages">{qaPackageList}</Route>
                <Route path="/entry"><EntryPage {...pageProps} /></Route>
                <Route path="/verification"><VerificationPage {...pageProps} /></Route>
                <Route path="/actions"><ActionsPage {...pageProps} /></Route>
                <Route path="/compliance"><CompliancePage {...pageProps} /></Route>
                <Route path="/reports"><ReportsPage {...pageProps} /></Route>
                <Route path="/documents"><DocumentsPage {...pageProps} /></Route>
                <Route path="/notifications"><NotificationsPage {...pageProps} /></Route>
                <Route path="/audit"><AuditPage {...pageProps} /></Route>
                <Route><DashboardPage {...pageProps} /></Route>
              </Switch>
            )}
          </div>
        </main>
        {modal && (
          <DataDialog
            type={modal}
            editing={editing}
            initial={initialForm ?? undefined}
            store={store}
            onClose={closeDialog}
            onSave={addOrEdit}
          />
        )}
      </div>
    </WouterRouter>
  );
}

export default App;
