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
import {startNotificationScheduler,resolveNotification,targetAvailable} from './workflow/notifications/notificationService';
import type {Target} from './workflow/notifications/notificationEvents';
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
    principal,
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

  useEffect(startNotificationScheduler, []);
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
    let documentSearch='';
    if(location==='/documents'){try{documentSearch=JSON.parse(sessionStorage.getItem('jala-document-filters')??'{}').search??'';}catch{/* Optional list navigation context. */}}
    setSearch(documentSearch);
    setActiveTab(location==='/documents'?(new URLSearchParams(window.location.search).get('tab')||'Semua'):'Semua');

    const selected =
      normalizeWorkflowSelection(new URLSearchParams(
        window.location.search,
      ).get('submodule') || '');

    setSelectedSubmodule(
      selected.startsWith(`${location}:`) && !(location==='/documents'&&!workflowSubmodules.has(selected))
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
    if (selection.startsWith('/documents:') && !workflowSubmodules.has(selection)) {
      setSelectedSubmodule('');
      setActiveTab(selection.split(':')[1] || 'Semua');
      setLocation('/documents?tab='+encodeURIComponent(selection.split(':')[1] || 'Semua')+(isRoleTestMode()?'&testRoles=1':''));
      return;
    }
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

  const openCorrection = (packageId: string, correctionId: string) => {
  const target = scopedPackages[packageId];
  const correction = target?.corrections?.find(
    item => item.id === correctionId
  );

  if (!target || !correction) {
    setNotice("Kasus tidak ditemukan atau paket tidak dapat diakses.");
    return;
  }

  if (!selectPackage(packageId)) {
    setNotice("Anda tidak memiliki akses ke paket ini.");
    return;
  }

  try {
    localPersistence.setItem(
      `jala-correction-selection:${packageId}`,
      correctionId
    );
  } catch {
    setNotice("Pilihan kasus tidak dapat disimpan di sesi lokal.");
    return;
  }

  navigateSubmodule("/actions:Koreksi berbukti");
};

  const openNotificationTarget = (target:Target, notificationId?:string) => {
    const checked=notificationId?resolveNotification(notificationId,scopedPackages,principal).target:target;
    const state=scopedPackages[checked.packageId];
    if(!state||!principal.packageIds.includes(checked.packageId)||!targetAvailable(checked,state))throw new Error('Pekerjaan tidak tersedia atau tidak dapat diakses.');
    if(checked.module==='correction'){openCorrection(checked.packageId,checked.caseId);return;}
    if(checked.module==='document'){openPackageBA(checked.packageId,checked.identity.kind,{...checked.identity,returnTo:'/notifications'});return;}
    if(!selectPackage(checked.packageId))throw new Error('Penugasan paket tidak tersedia.');
    if(checked.period)sessionStorage.setItem(`jala-notification-period:${checked.packageId}`,String(checked.period));
    if(checked.auditLevel)sessionStorage.setItem(`jala-notification-audit:${checked.packageId}`,String(checked.auditLevel));
    navigateSubmodule(checked.selection);
  };

  const openPackageBA = (
    id: string,
    kind: string,
    context?: {survey?:string;period?:number;auditLevel?:number;returnTo?:string},
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
          period: context?.period ?? scopedPackages[id]?.activeCyclePeriod ?? 1,
          survey: context?.survey,
          auditLevel: context?.auditLevel,
        }),
      );

      localPersistence.setItem(
        'jala-ba-return-to',
        context?.returnTo ??
  (packageStore.activeRole === 'Penyedia Jasa / Ketua Tim'
    ? '/documents:Tugas Dokumen'
    : packageStore.activeRole === 'PIC Balai / Pengguna Jasa'
      ? '/documents:Dokumen Paket'
      : packageStore.activeRole === 'Direktorat / Pusat'
        ? '/documents:Audit & Dokumen Pusat'
        : '/documents:Monitoring Dokumen'),
      );
    } catch {
      // Preferensi navigasi lokal bersifat opsional.
    }

    navigateSubmodule(
      '/documents:BA & dokumen workflow',
    );
  };

  const returnToCorrections = () => {
  setSelectedSubmodule("");
  setActiveTab("Semua");
  setLocation(
    isRoleTestMode() ? "/actions?testRoles=1" : "/actions"
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
  isPackageWorkspace={
    isPackageWorkspace &&
    selectedSubmodule !== "/documents:BA & dokumen workflow"
  }
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

            {!isPackageWorkspace&&location!=="/packages"&&location!=="/notifications"&&location!=="/reports"&&<MobileFilters
              balai={balai}
              setBalai={setBalai}
              periode={periode}
              setPeriode={setPeriode}
              jenis={jenis}
              setJenis={setJenis}
              showJenis={location === '/'}
            />}

            {location === '/notifications' || selectedSubmodule.startsWith('/notifications:') ? (
              <NotificationsPage {...pageProps} principal={principal} onOpen={openNotificationTarget} />
            ) : selectedSubmodule.startsWith('/documents:') && !workflowSubmodules.has(selectedSubmodule) ? (
              <DocumentsPage {...pageProps} activeTab={selectedSubmodule.split(':')[1]} />
            ) : authenticatedRole && serverPackageId && workflowSubmodules.has(selectedSubmodule) ? (
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
                    onReturnToCorrections={returnToCorrections}
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
                  <DashboardPage {...pageProps} canCreatePackage={authenticatedRole === 'Penyedia Jasa / Ketua Tim'} />
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
  <ActionsPage
    {...pageProps}
    onOpenCorrection={openCorrection}
  />
</Route>

                <Route path="/compliance">
                  <CompliancePage {...pageProps} />
                </Route>

                <Route path="/reports">
                  <ReportsPage key={principal.id+principal.role} {...pageProps} principal={principal} />
                </Route>

                <Route path="/documents">
                  <DocumentsPage {...pageProps} />
                </Route>

                <Route path="/notifications">
                  <NotificationsPage {...pageProps} principal={principal} onOpen={openNotificationTarget}/>
                </Route>

                <Route path="/audit">
                  <AuditPage {...pageProps} />
                </Route>

                <Route>
                  <DashboardPage {...pageProps} canCreatePackage={authenticatedRole === 'Penyedia Jasa / Ketua Tim'} />
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
