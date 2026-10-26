import { normalizeWorkflowSelection } from './workflow/legacySelection';
import { isRoleTestMode } from './workflow/access/packageAccess';
import { localPersistence } from './workflow/repository/localPersistence';

import { useEffect, useMemo, useState } from 'react';
import {
  Route,
  Router as WouterRouter,
  Switch,
  useLocation,
  useSearch,
} from 'wouter';
import { CheckCircle2 } from 'lucide-react';

import { workflowSubmodules } from './app/navigation';

import { AppSidebar } from './components/app/AppSidebar';
import {
  AppTopbar,
  MobileFilters,
} from './components/app/AppTopbar';
import { DataDialog } from './components/app/DataDialog';
import { RoleEntryScreen } from './components/app/RoleEntryScreen';

import { useDemoStore } from './hooks/useDemoStore';
import { usePackageStore } from './hooks/usePackageStore';

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
import PackageDetailPage, { ServerPackageWorkspace } from './pages/PackageDetailPage';
import PackagesPage from './pages/PackagesPage';
import ReportsPage from './pages/ReportsPage';
import VerificationPage from './pages/VerificationPage';

import { SubmoduleWorkspace } from './SubmoduleWorkspace';
import type { PageProps } from './types';

import type { WorkflowRole } from './workflow/model';
import { derivePackageStage } from './workflow/packageStore';
import { buildRoleNavigation } from './workflow/roleNavigation';
import { canAccessRoute } from './workflow/workflowConfig';

function App({ authenticatedRole, userLabel, onSignOut }: { authenticatedRole?: WorkflowRole; userLabel?: string; onSignOut?: () => void } = {}) {
  const {
    packageStore,
    scopedPackages,
    activePackageId,
    activePackage,
    workflow,
    openPackage: selectPackage,
    closePackage,
    setRole,
    updateWorkflow,
  } = usePackageStore(authenticatedRole);

  const {
    store,
    modal,
    editing,
    notice,
    setNotice,
    record,
    addOrEdit,
    updateStatus,
    beginEdit,
    openNew,
    closeDialog,
  } = useDemoStore(packageStore.activeRole);

  const [location, setLocation] = useLocation();
  const query = useSearch();
  const requestedPackageId = new URLSearchParams(query).get('paket');
  const serverPackageId = authenticatedRole && requestedPackageId && /^[1-9]\d*$/.test(requestedPackageId)
    ? requestedPackageId : null;

  const [balai, setBalai] = useState('Semua Balai');
  const [periode, setPeriode] = useState('Semester I 2027');
  const [jenis, setJenis] = useState('Semua');

  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [activeTab, setActiveTab] = useState('Semua');

  const [selectedSubmodule, setSelectedSubmodule] =
    useState(
      () =>
        normalizeWorkflowSelection(new URLSearchParams(
          window.location.search,
        ).get('submodule') || ''),
    );

  const [sessionActive, setSessionActive] =
    useState(
      () =>
        !!authenticatedRole || localPersistence.getItem(DEMO_SESSION_KEY) ===
        'active',
    );

  const isPackageWorkspace =
    Boolean(serverPackageId || (!authenticatedRole && activePackageId && activePackage)) &&
    (
      selectedSubmodule ===
      '/packages:Ringkasan Paket' ||
      workflowSubmodules.has(selectedSubmodule)
    );

  const visibleNav = useMemo(
    () =>
      buildRoleNavigation(
        packageStore.activeRole,
        isPackageWorkspace,
        !authenticatedRole && workflow
          ? derivePackageStage(workflow)
          : 'Tahap 0',
      ),
    [
      packageStore.activeRole,
      isPackageWorkspace,
      workflow,
      authenticatedRole,
    ],
  );

  useEffect(() => {
    setMobileOpen(false);
    setSearch('');
    setActiveTab('Semua');

    const selected =
      normalizeWorkflowSelection(new URLSearchParams(
        window.location.search,
      ).get('submodule') || '');

    setSelectedSubmodule(
      selected.startsWith(`${location}:`)
        ? selected
        : '',
    );
  }, [location, query]);

  const scoped = useMemo(
    () =>
      store.surveys.filter(
        survey =>
          (
            balai === 'Semua Balai' ||
            survey.balai === balai
          ) &&
          (
            jenis === 'Semua' ||
            survey.jenis === jenis
          ) &&
          isInPeriod(survey.tanggal, periode),
      ),
    [store.surveys, balai, jenis, periode],
  );

  const enterAsRole = (role: WorkflowRole) => {
    setRole(role);

    localPersistence.setItem(
      DEMO_SESSION_KEY,
      'active',
    );

    setSessionActive(true);
    setSelectedSubmodule('');
    setLocation(isRoleTestMode() ? '/?testRoles=1' : '/');
    setNotice(`Peran aktif: ${role}`);
  };

  const switchRole = () => {
    if (onSignOut) { onSignOut(); return; }
    localPersistence.removeItem(DEMO_SESSION_KEY);
    setSessionActive(false);
    setSelectedSubmodule('');
    setMobileOpen(false);
  };

  const navigateSubmodule = (selection: string) => {
    const url = new URL(window.location.href);

    url.searchParams.set(
      'submodule',
      selection,
    );

    setSelectedSubmodule(selection);

    setLocation(
      `${selection.split(':')[0]}${url.search}${url.hash}`,
    );

    setMobileOpen(false);
  };

  const clearSubmodule = () => {
    setSelectedSubmodule('');

    const url = new URL(window.location.href);

    url.searchParams.delete('submodule');

    window.history.replaceState(
      window.history.state,
      '',
      url,
    );
  };

  const openPackage = (id: string) => {
    if (authenticatedRole) {
      if (!/^[1-9]\d*$/.test(id)) { setNotice('Pilih paket server melalui menu Paket.'); return; }
      setSelectedSubmodule('/packages:Ringkasan Paket');
      setLocation(`/packages?paket=${encodeURIComponent(id)}&submodule=${encodeURIComponent('/packages:Ringkasan Paket')}`);
      setNotice('');
      return;
    }
    if (!selectPackage(id)) {
      setNotice('Paket tidak ditemukan.');
      return;
    }

    setSelectedSubmodule(
      '/packages:Ringkasan Paket',
    );

    setLocation(
      '/packages?submodule=%2Fpackages%3ARingkasan%20Paket' + (isRoleTestMode() ? '&testRoles=1' : ''),
    );

    setNotice('Workspace paket dibuka.');
  };

  const openPackageBA = (
    id: string,
    kind: string,
  ) => {
    if (authenticatedRole) { setNotice('Dokumen & BA paket server belum terhubung. Buka paket dari menu Paket.'); return; }
    if (!selectPackage(id)) {
      setNotice('Paket tidak ditemukan.');
      return;
    }

    try {
      localPersistence.setItem(
        'jala-ba-navigation-v2',
        JSON.stringify({
          packageId: id,
          kind,
          period: 1,
        }),
      );

      localPersistence.setItem(
        'jala-ba-return-to',
        '/packages:Ringkasan Paket',
      );
    } catch {
      // Preferensi navigasi lokal bersifat opsional.
    }

    navigateSubmodule(
      '/documents:BA & dokumen workflow',
    );
  };

  const backToPackages = () => {
    closePackage();
    setSelectedSubmodule('');
    setLocation('/packages');
  };

  useEffect(() => {
    if (
      sessionActive &&
      !canAccessRoute(
        packageStore.activeRole,
        location,
      )
    ) {
      setSelectedSubmodule('');
      setLocation(isRoleTestMode() ? '/?testRoles=1' : '/');
    }
  }, [
    sessionActive,
    packageStore.activeRole,
    location,
    setLocation,
  ]);

  const pageProps: PageProps = {
    store,
    workflow,
    packages: scopedPackages,
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
    record,
    setNotice,
  };

  const packageList = (
    <PackagesPage
      packages={scopedPackages}
      role={packageStore.activeRole}
      onOpen={openPackage}
    />
  );

  if (!sessionActive) {
    return (
      <RoleEntryScreen
        currentRole={packageStore.activeRole}
        onEnter={enterAsRole}
      />
    );
  }

  return (
    <WouterRouter>
      <div
        className="app-shell"
        onClickCapture={event => {
          const target =
            event.target as HTMLElement;

          if (
            target.closest(
              '[data-testid="button-export-report"]',
            )
          ) {
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
          activePackageId={serverPackageId || (!authenticatedRole ? activePackageId : null)}
          isPackageWorkspace={isPackageWorkspace}
          onCloseMobile={() => setMobileOpen(false)}
          onClearSubmodule={clearSubmodule}
          onNavigateSubmodule={navigateSubmodule}
          onSetActiveTab={setActiveTab}
          onSetLocation={setLocation}
        />

        <main className="main-area">
          {authenticatedRole && <div className="auth-local-notice">Masuk sebagai {userLabel}. Login, daftar paket, dan identitas paket terhubung ke server. Perhatikan status koneksi di setiap modul; dashboard umum masih pratinjau lokal.</div>}
          <AppTopbar
            isPackageWorkspace={isPackageWorkspace}
            packageName={
              serverPackageId ? `Paket #${serverPackageId}` : activePackage?.project.packageName
            }
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
              <div
                className="notice"
                role="status"
                data-testid="status-toast"
              >
                <CheckCircle2 size={14} />
                {notice}
              </div>
            )}

            {!isPackageWorkspace && location !== "/packages" && <MobileFilters
              balai={balai}
              setBalai={setBalai}
              periode={periode}
              setPeriode={setPeriode}
              jenis={jenis}
              setJenis={setJenis}
              showJenis={location === '/'}
            />}

            {authenticatedRole && serverPackageId && workflowSubmodules.has(selectedSubmodule) ? (
              <ServerPackageWorkspace
                key={`${serverPackageId}:${authenticatedRole}`}
                packageId={serverPackageId}
                role={authenticatedRole}
                selection={selectedSubmodule}
                onBack={backToPackages}
                onNavigate={navigateSubmodule}
              />
            ) : selectedSubmodule ? (
              workflowSubmodules.has(
                selectedSubmodule,
              ) ? (
                !authenticatedRole && activePackageId && activePackage ? (
                  <PackageDetailPage
                    packageId={activePackageId}
                    workflow={activePackage}
                    selection={selectedSubmodule}
                    onBack={backToPackages}
                    onNavigate={navigateSubmodule}
                    onUpdate={updateWorkflow}
                    setNotice={setNotice}
                  />
                ) : (
                  packageList
                )
              ) : (
                <SubmoduleWorkspace
                  selection={selectedSubmodule}
                  {...pageProps}
                  onBack={() => {
                    clearSubmodule();
                    setActiveTab('Semua');
                  }}
                />
              )
            ) : (
              <Switch>
                <Route path="/">
                  <DashboardPage {...pageProps} />
                </Route>

                <Route path="/data-master">
                  <MasterPage {...pageProps} />
                </Route>

                <Route path="/packages">
                  {packageList}
                </Route>

                <Route path="/entry">
                  <EntryPage {...pageProps} />
                </Route>

                <Route path="/verification">
                  <VerificationPage {...pageProps} />
                </Route>

                <Route path="/actions">
                  <ActionsPage {...pageProps} />
                </Route>

                <Route path="/compliance">
                  <CompliancePage {...pageProps} />
                </Route>

                <Route path="/reports">
                  <ReportsPage {...pageProps} />
                </Route>

                <Route path="/documents">
                  <DocumentsPage {...pageProps} />
                </Route>

                <Route path="/notifications">
                  <NotificationsPage {...pageProps} />
                </Route>

                <Route path="/audit">
                  <AuditPage {...pageProps} />
                </Route>

                <Route>
                  <DashboardPage {...pageProps} />
                </Route>
              </Switch>
            )}
          </div>
        </main>

        {modal && (
          <DataDialog
            type={modal}
            editing={editing}
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
