import { ServerAdminMonitoringPage, ServerMasterPage } from "./pages/ServerAdminPages";
import ServerNotificationsPage from "./pages/ServerNotificationsPage";
import { ServerCompliancePage, ServerReportsPage } from "./pages/ServerSummaryPages";
import { ServerDirectorateAuditPage } from "./pages/audit/ServerDirectorateAuditPage";
import ProviderWorkHome from "./pages/ProviderWorkHome";
import { localPrincipal } from "./workflow/access/packageAccess";
import "./design/v2.css";
import { useResponsiveTables } from "./design/b/useResponsiveTables";
import { LoadingState, Feedback } from "./design/Feedback";
import "./design/paket-a.css";
import "./design/b/paket-b.css";
import "./design/c/paket-c.css";
import { normalizeWorkflowSelection } from "./workflow/legacySelection";
import { isRoleTestMode } from "./workflow/access/packageAccess";
import { localPersistence } from "./workflow/repository/localPersistence";

import { lazy, Suspense, useEffect, useMemo, useState } from "react";
import { Route, Router as WouterRouter, Switch, useLocation, useSearch } from "wouter";
import { CheckCircle2, CircleAlert } from "lucide-react";

import { workflowSubmodules } from "./app/navigation";
import "./app/admin-ui.css";

import { AppSidebar } from "./components/app/AppSidebar";
import { AppTopbar, MobileFilters } from "./components/app/AppTopbar";
import { DataDialog } from "./components/app/DataDialog";
import { RoleEntryScreen } from "./components/app/RoleEntryScreen";

import { useDemoStore } from "./hooks/useDemoStore";
import { usePackageStore } from "./hooks/usePackageStore";

import { DEMO_SESSION_KEY } from "./lib/demoData";
import { isInPeriod } from "./lib/periods";

import ActionsPage from "./pages/ActionsPage";
import AuditPage from "./pages/AuditPage";
import AdminUsersPage from "./pages/AdminUsersPage";
import AdminAccessPage from "./pages/AdminAccessPage";
import AdminAuditTrailPage from "./pages/AdminAuditTrailPage";
import { canViewAdminAccess } from "./pages/adminAccessModel";
import CompliancePage from "./pages/CompliancePage";
const DashboardPage = lazy(() => import("./pages/DashboardPage"));
import DocumentsPage from "./pages/DocumentsPage";
import EntryPage from "./pages/EntryPage";
import MasterPage from "./pages/MasterPage";
import NotificationsPage from "./pages/NotificationsPage";
import {
  startNotificationScheduler,
  resolveNotification,
  targetAvailable,
} from "./workflow/notifications/notificationService";
import type { Target } from "./workflow/notifications/notificationEvents";
import PackageDetailPage, { ServerPackageWorkspace } from "./pages/PackageDetailPage";
import PackagesPage from "./pages/PackagesPage";
import ReportsPage from "./pages/ReportsPage";
import VerificationPage from "./pages/VerificationPage";
import DirectorateAuditPage from "./pages/DirectorateAuditPage";
import AdminWorkflowMonitoringPage from "./pages/AdminWorkflowMonitoringPage";

import { SubmoduleWorkspace } from "./SubmoduleWorkspace";
import type { PageProps } from "./types";
import { documentsPageUrl } from "./pages/serverPicDocumentsData";
import { useServerReviewQueue } from "./pages/serverReviewQueue";

import type { WorkflowRole } from "./workflow/model";
import { derivePackageStage } from "./workflow/packageStore";
import { buildRoleNavigation } from "./workflow/roleNavigation";
import { ROLE_ROUTE_ACCESS, canAccessRoute } from "./workflow/workflowConfig";

type AppProps = {
  /** Set by AuthGate after /api/me; absent only in the dev-only role test mode. */
  authenticatedRole?: WorkflowRole;
  userLabel?: string;
  onSignOut?: () => void;
};

export default function App({ authenticatedRole, userLabel, onSignOut }: AppProps = {}) {
  useResponsiveTables();
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
    mutationError,
  } = usePackageStore(authenticatedRole);

  const {
    store,
    modal,
    editing,
    notice,
    setNotice: setDemoNotice,
    record,
    addOrEdit,
    updateStatus,
    beginEdit,
    openNew,
    closeDialog,
  } = useDemoStore(packageStore.activeRole, !authenticatedRole);

  const [noticeTone, setNoticeTone] = useState<"error" | undefined>();
  const setNotice = (message: string, tone?: "error") => {
    setNoticeTone(tone);
    setDemoNotice(message);
  };

  // Local reminder scheduler only runs on demo data.
  useEffect(() => {
    if (authenticatedRole) return;
    return startNotificationScheduler();
  }, [authenticatedRole]);
  const [location, setLocation] = useLocation();
  const query = useSearch();
  const requestedPackageId = new URLSearchParams(query).get("paket");
  const serverPackageId =
    authenticatedRole && requestedPackageId && /^[1-9]\d*$/.test(requestedPackageId)
      ? requestedPackageId
      : null;
  // Reviewer roles read the queue from the server; providers never see the Balai queue UI.
  const serverReviewQueue = useServerReviewQueue(
    !!authenticatedRole && authenticatedRole !== "Penyedia Jasa / Ketua Tim",
  );

  const [balai, setBalai] = useState("Semua Balai");
  const [periode, setPeriode] = useState("Semester I 2027");
  const [jenis, setJenis] = useState("Semua");

  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState("Semua");

  const [selectedSubmodule, setSelectedSubmodule] = useState(() =>
    normalizeWorkflowSelection(
      new URLSearchParams(window.location.search).get("submodule") || "",
    ),
  );

  const [sessionActive, setSessionActive] = useState(
    () =>
      !!authenticatedRole ||
      (isRoleTestMode() &&
        localPersistence.getItem(DEMO_SESSION_KEY) === "active"),
  );

  const routeAllowed =
    canAccessRoute(packageStore.activeRole, location) &&
    (!selectedSubmodule ||
      canAccessRoute(packageStore.activeRole, selectedSubmodule.split(":")[0]));
  const isPackageWorkspace =
    routeAllowed &&
    Boolean(serverPackageId || (!authenticatedRole && activePackageId && activePackage)) &&
    (selectedSubmodule === "/packages:Ringkasan Paket" ||
      workflowSubmodules.has(selectedSubmodule));

  const visibleNav = useMemo(
    () =>
      buildRoleNavigation(
        packageStore.activeRole,
        isPackageWorkspace,
        !authenticatedRole && workflow ? derivePackageStage(workflow) : "Tahap 0",
      ),
    [packageStore.activeRole, isPackageWorkspace, workflow, authenticatedRole],
  );

  useEffect(() => {
    setMobileOpen(false);
    let documentSearch = "";
    if (location === "/documents") {
      try {
        documentSearch =
          JSON.parse(sessionStorage.getItem("jala-document-filters") ?? "{}")
            .search ?? "";
      } catch {
        /* Optional list navigation context. */
      }
    }
    setSearch(documentSearch);
    setActiveTab(
      location === "/documents"
        ? new URLSearchParams(window.location.search).get("tab") || "Semua"
        : "Semua",
    );

    const requestedTab = new URLSearchParams(window.location.search).get("tab");
    if (
      requestedTab &&
      visibleNav
        .find((item) => item.path === location)
        ?.children.some((child) => child.tab === requestedTab)
    )
      setActiveTab(requestedTab);
    const selected = normalizeWorkflowSelection(
      new URLSearchParams(window.location.search).get("submodule") || "",
    );

    setSelectedSubmodule(
      selected.startsWith(`${location}:`) &&
        !(location === "/documents" && !workflowSubmodules.has(selected))
        ? selected
        : "",
    );
  }, [location, query]);

  const scoped = useMemo(
    () =>
      store.surveys.filter(
        (survey) =>
          (balai === "Semua Balai" || survey.balai === balai) &&
          (jenis === "Semua" || survey.jenis === jenis) &&
          isInPeriod(survey.tanggal, periode),
      ),
    [store.surveys, balai, jenis, periode],
  );

  const enterAsRole = (role: WorkflowRole) => {
    if (!isRoleTestMode()) return;
    setRole(role);

    localPersistence.setItem(DEMO_SESSION_KEY, "active");

    setSessionActive(true);
    setSelectedSubmodule("");
    setLocation(isRoleTestMode() ? "/?testRoles=1" : "/");
  };

  const switchRole = () => {
    if (onSignOut) {
      onSignOut();
      return;
    }
    localPersistence.removeItem(DEMO_SESSION_KEY);
    setSessionActive(false);
    setSelectedSubmodule("");
    setMobileOpen(false);
    setLocation("/");
  };

  const navigateSubmodule = (selection: string) => {
    // Admin next action opens the administration page, not a package workflow.
    if (selection === "/audit:Pengguna") {
      setSelectedSubmodule("");
      setActiveTab("Pengguna");
      setLocation("/audit");
      setMobileOpen(false);
      return;
    }
    if (selection === "/verification:Antrian Balai") {
      setSelectedSubmodule("");
      setActiveTab("Semua");
      setLocation("/verification" + (isRoleTestMode() ? "?testRoles=1" : ""));
      setMobileOpen(false);
      return;
    }
    if (
      selection.startsWith("/documents:") &&
      !workflowSubmodules.has(selection)
    ) {
      setSelectedSubmodule("");
      setActiveTab(selection.split(":")[1] || "Semua");
      setLocation(documentsPageUrl(window.location.href, selection.split(":")[1] || "Semua"));
      return;
    }
    const url = new URL(window.location.href);

    url.searchParams.set("submodule", selection);

    setSelectedSubmodule(selection);

    setLocation(`${selection.split(":")[0]}${url.search}${url.hash}`);

    setMobileOpen(false);
  };

  const clearSubmodule = () => {
    setSelectedSubmodule("");

    const url = new URL(window.location.href);

    url.searchParams.delete("submodule");

    window.history.replaceState(window.history.state, "", url);
  };

  const openPackage = (id: string) => {
    if (authenticatedRole) {
      // Server packages are addressed by numeric paket_id in the URL.
      if (!/^[1-9]\d*$/.test(id)) {
        setNotice("Pilih paket server melalui menu Paket.");
        return;
      }
      setSelectedSubmodule("/packages:Ringkasan Paket");
      setLocation(`/packages?paket=${encodeURIComponent(id)}&submodule=${encodeURIComponent("/packages:Ringkasan Paket")}`);
      setNotice("");
      return;
    }
    if (!selectPackage(id)) {
      setNotice("Paket tidak ditemukan.");
      return;
    }

    setSelectedSubmodule("/packages:Ringkasan Paket");

    setLocation(
      "/packages?submodule=%2Fpackages%3ARingkasan%20Paket" +
        (isRoleTestMode() ? "&testRoles=1" : ""),
    );

    setNotice("Workspace paket dibuka.");
  };

  const openPackageReview: PageProps["openPackageReview"] = (
    id,
    selection,
    context,
  ) => {
    if (authenticatedRole) {
      if (!/^[1-9]\d*$/.test(id)) {
        setNotice("Pilih paket server melalui menu Paket.");
        return;
      }
      setSelectedSubmodule(selection);
      setLocation(`${selection.split(":")[0]}?paket=${encodeURIComponent(id)}&submodule=${encodeURIComponent(selection)}`);
      return;
    }
    if (!scopedPackages[id] || !selectPackage(id)) {
      setNotice("Paket tidak tersedia dalam akses Anda.");
      return;
    }
    if (context?.period)
      sessionStorage.setItem(
        `jala-notification-period:${id}`,
        String(context.period),
      );
    if (context?.auditLevel)
      sessionStorage.setItem(
        `jala-notification-audit:${id}`,
        String(context.auditLevel),
      );
    navigateSubmodule(selection);
  };

  const openCorrection = (packageId: string, correctionId: string) => {
    if (authenticatedRole) {
      // Server cases live in the package workspace, addressed by paket + koreksi in the URL.
      const selection = "/actions:Koreksi berbukti";
      setSelectedSubmodule(selection);
      setLocation(`/actions?paket=${encodeURIComponent(packageId)}&koreksi=${encodeURIComponent(correctionId)}&submodule=${encodeURIComponent(selection)}`);
      return;
    }
    const target = scopedPackages[packageId];
    const correction = target?.corrections?.find(
      (item) => item.id === correctionId,
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
        correctionId,
      );
    } catch {
      setNotice("Pilihan kasus tidak dapat disimpan di sesi lokal.");
      return;
    }

    navigateSubmodule("/actions:Koreksi berbukti");
  };

  const openNotificationTarget = (target: Target, notificationId?: string) => {
    const checked = notificationId
      ? resolveNotification(notificationId, scopedPackages, principal).target
      : target;
    const state = scopedPackages[checked.packageId];
    if (
      !state ||
      !principal.packageIds.includes(checked.packageId) ||
      !targetAvailable(checked, state)
    )
      throw new Error("Pekerjaan tidak tersedia atau tidak dapat diakses.");
    if (checked.module === "correction") {
      openCorrection(checked.packageId, checked.caseId);
      return;
    }
    if (checked.module === "document") {
      openPackageBA(checked.packageId, checked.identity.kind, {
        ...checked.identity,
        returnTo: "/notifications",
      });
      return;
    }
    if (!selectPackage(checked.packageId))
      throw new Error("Penugasan paket tidak tersedia.");
    if (checked.period)
      sessionStorage.setItem(
        `jala-notification-period:${checked.packageId}`,
        String(checked.period),
      );
    if (checked.auditLevel)
      sessionStorage.setItem(
        `jala-notification-audit:${checked.packageId}`,
        String(checked.auditLevel),
      );
    navigateSubmodule(checked.selection);
  };

  const openPackageBA = (
    id: string,
    kind: string,
    context?: {
      survey?: string;
      period?: number;
      auditLevel?: number;
      returnTo?: string;
    },
  ) => {
    if (authenticatedRole) {
      setSelectedSubmodule("");
      setActiveTab("Semua");
      setLocation(`/documents?tab=Semua&paket=${encodeURIComponent(id)}`);
      setNotice("");
      return;
    }
    if (!selectPackage(id)) {
      setNotice("Paket tidak ditemukan.");
      return;
    }

    try {
      localPersistence.setItem(
        "jala-ba-navigation-v2",
        JSON.stringify({
          packageId: id,
          kind,
          period: context?.period ?? scopedPackages[id]?.activeCyclePeriod ?? 1,
          survey: context?.survey,
          auditLevel: context?.auditLevel,
        }),
      );

      localPersistence.setItem(
        "jala-ba-return-to",
        context?.returnTo ??
          (packageStore.activeRole === "Penyedia Jasa / Ketua Tim"
            ? "/documents:Tugas Dokumen"
            : packageStore.activeRole === "PIC Balai / Pengguna Jasa"
              ? "/documents:Dokumen Paket"
              : packageStore.activeRole === "Direktorat / Pusat"
                ? "/documents:Audit & Dokumen Pusat"
                : "/documents:Monitoring Dokumen"),
      );
    } catch {
      // Preferensi navigasi lokal bersifat opsional.
    }

    navigateSubmodule("/documents:BA & dokumen workflow");
  };

  const returnToCorrections = () => {
    setSelectedSubmodule("");
    setActiveTab("Semua");
    setLocation(isRoleTestMode() ? "/actions?testRoles=1" : "/actions");
  };

  const backToPackages = () => {
    closePackage();
    setSelectedSubmodule("");
    setLocation("/packages");
  };

  const pageProps: PageProps = {
    store,
    workflow,
    packages: scopedPackages,
    openPackage,
    openPackageReview,
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
    serverReviewQueue,
  };

  const roleVerificationPage =
    packageStore.activeRole === "Admin" ? (
      authenticatedRole ? <ServerAdminMonitoringPage {...pageProps} /> : <AdminWorkflowMonitoringPage {...pageProps} />
    ) : packageStore.activeRole === "Direktorat / Pusat" ? (
      authenticatedRole ? <ServerDirectorateAuditPage {...pageProps} /> : <DirectorateAuditPage {...pageProps} />
    ) : packageStore.activeRole === "PIC Balai / Pengguna Jasa" ? (
      <VerificationPage {...pageProps} />
    ) : (
      <Feedback
        kind="empty"
        title="Pemeriksaan berada di dalam paket"
        description="Buka paket untuk melihat hasil sumber dan audit internal. Review Balai serta Audit Tingkat 3 berada pada peran berwenang."
        actionLabel="Buka Paket Saya"
        onBack={() => setLocation("/packages")}
      />
    );

  const packageList = (
    <PackagesPage
      packages={scopedPackages}
      role={packageStore.activeRole}
      onOpen={openPackage}
      onOpenReview={openPackageReview}
      serverReviewQueue={serverReviewQueue}
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
      <div className={`app-shell jm-shell b-shell v2-shell ${principal.role === "Penyedia Jasa / Ketua Tim" ? "v2-provider" : ""}${authenticatedRole === "Admin" ? " admin-shell" : ""}`}>
        <a className="jm-skip" href="#main-content">
          Lewati ke konten
        </a>
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
          {authenticatedRole && !isPackageWorkspace && (
            <div className="auth-local-notice">
              Masuk sebagai {userLabel}. Semua data paket, tahap 0–6, koreksi, notifikasi, laporan dan dokumen dibaca dari server Supabase.
            </div>
          )}
          <AppTopbar
            isPackageWorkspace={
              isPackageWorkspace &&
              selectedSubmodule !== "/documents:BA & dokumen workflow"
            }
            packageName={serverPackageId ? `Paket #${serverPackageId}` : activePackage?.project.packageName}
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

          <div className="content" id="main-content" tabIndex={-1}>
            <Suspense fallback={<LoadingState />}>
              {mutationError ? (
                <div
                  className="notice notice-error"
                  role="alert"
                  data-testid="mutation-error"
                >
                  <CircleAlert size={14} aria-hidden="true" />
                  {mutationError}
                </div>
              ) : (
                notice && (
                  <div
                    className={
                      noticeTone === "error" ? "notice notice-error" : "notice"
                    }
                    role={noticeTone === "error" ? "alert" : "status"}
                    data-testid={
                      noticeTone === "error" ? "mutation-error" : "status-toast"
                    }
                  >
                    {noticeTone === "error" ? (
                      <CircleAlert size={14} />
                    ) : (
                      <CheckCircle2 size={14} />
                    )}
                    {notice}
                  </div>
                )
              )}

              {!isPackageWorkspace && location === "/entry" && (
                <MobileFilters
                  balai={balai}
                  setBalai={setBalai}
                  periode={periode}
                  setPeriode={setPeriode}
                  jenis={jenis}
                  setJenis={setJenis}
                  showJenis={true}
                />
              )}

              {!routeAllowed ? (
                <Feedback
                  kind={
                    Object.values(ROLE_ROUTE_ACCESS).flat().includes(location)
                      ? "forbidden"
                      : "not-found"
                  }
                  title={
                    Object.values(ROLE_ROUTE_ACCESS).flat().includes(location)
                      ? "Halaman ini di luar kewenangan Anda"
                      : "Halaman tidak ditemukan"
                  }
                  description={
                    Object.values(ROLE_ROUTE_ACCESS).flat().includes(location)
                      ? `Peran ${packageStore.activeRole} tidak memiliki akses ke halaman ini. Gunakan menu sesuai penugasan Anda.`
                      : "Alamat mungkin berubah atau tidak tersedia. Kembali ke beranda untuk melanjutkan pekerjaan."
                  }
                  onBack={() => {
                    clearSubmodule();
                    setLocation("/");
                  }}
                />
              ) : location === "/notifications" ||
                selectedSubmodule.startsWith("/notifications:") ? (
                authenticatedRole ? <ServerNotificationsPage {...pageProps} /> : <NotificationsPage
                  {...pageProps}
                  principal={principal}
                  onOpen={openNotificationTarget}
                />
              ) : location === "/verification" &&
                !workflowSubmodules.has(selectedSubmodule) ? (
                roleVerificationPage
              ) : selectedSubmodule.startsWith("/documents:") &&
                !workflowSubmodules.has(selectedSubmodule) ? (
                <DocumentsPage
                  {...pageProps}
                  activeTab={selectedSubmodule.split(":")[1]}
                  authenticatedRole={authenticatedRole}
                  packageId={serverPackageId}
                />
              ) : authenticatedRole && serverPackageId && workflowSubmodules.has(selectedSubmodule) ? (
                <ServerPackageWorkspace
                  key={`${serverPackageId}:${authenticatedRole}`}
                  packageId={serverPackageId}
                  role={authenticatedRole}
                  selection={selectedSubmodule}
                  onBack={backToPackages}
                  onNavigate={navigateSubmodule}
                  dirahShell
                />
              ) : selectedSubmodule ? (
                workflowSubmodules.has(selectedSubmodule) ? (
                  !authenticatedRole && activePackageId && activePackage ? (
                    <PackageDetailPage
                      packageId={activePackageId}
                      workflow={activePackage}
                      principal={principal}
                      notesRecipient={localPrincipal("Penyedia Jasa / Ketua Tim", packageStore.packages)}
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
                      setActiveTab("Semua");
                    }}
                  />
                )
              ) : (
                <Switch>
                  <Route path="/">
                    {!authenticatedRole && principal.role === "Penyedia Jasa / Ketua Tim" && activeTab === "Semua"
                      ? <ProviderWorkHome {...pageProps} onOpenCorrection={openCorrection} />
                      : <DashboardPage {...pageProps} dashboardAuthenticated={Boolean(authenticatedRole)} canCreatePackage={authenticatedRole === "Penyedia Jasa / Ketua Tim"} />}
                  </Route>

                  <Route path="/data-master">
                    {authenticatedRole ? <ServerMasterPage /> : <MasterPage {...pageProps} />}
                  </Route>

                  <Route path="/packages">{packageList}</Route>

                  <Route path="/entry">
                    <EntryPage {...pageProps} />
                  </Route>

                  <Route path="/verification">{roleVerificationPage}</Route>

                  <Route path="/actions">
                    <ActionsPage
                      {...pageProps}
                      authenticatedRole={authenticatedRole}
                      onOpenCorrection={openCorrection}
                    />
                  </Route>

                  <Route path="/compliance">
                    {authenticatedRole ? <ServerCompliancePage {...pageProps} /> : <CompliancePage {...pageProps} />}
                  </Route>

                  <Route path="/reports">
                    {authenticatedRole ? <ServerReportsPage {...pageProps} principal={principal} /> : <ReportsPage
                      key={principal.id + principal.role}
                      {...pageProps}
                      principal={principal}
                    />}
                  </Route>

                  <Route path="/documents">
                    <DocumentsPage {...pageProps} authenticatedRole={authenticatedRole} packageId={serverPackageId} />
                  </Route>

                  <Route path="/notifications">
                    {authenticatedRole ? <ServerNotificationsPage {...pageProps} /> : <NotificationsPage
                      {...pageProps}
                      principal={principal}
                      onOpen={openNotificationTarget}
                    />}
                  </Route>

                  <Route path="/audit">
                    {authenticatedRole && canViewAdminAccess(pageProps.workflow.role)
                      ? pageProps.activeTab === "Hak akses" ? <AdminAccessPage />
                        : pageProps.activeTab === "Jejak aktivitas" ? <AdminAuditTrailPage />
                          : <AdminUsersPage />
                      : <AuditPage {...pageProps} />}
                  </Route>

                  <Route>
                    <Feedback
                      kind="not-found"
                      title="Halaman tidak ditemukan"
                      description="Gunakan navigasi untuk membuka halaman yang tersedia."
                      onBack={() => setLocation("/")}
                    />
                  </Route>
                </Switch>
              )}
            </Suspense>
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
