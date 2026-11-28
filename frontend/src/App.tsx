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
import { Route, Router as WouterRouter, Switch, useLocation } from "wouter";
import { CheckCircle2, CircleAlert } from "lucide-react";

import { workflowSubmodules } from "./app/navigation";

import { AppSidebar } from "./components/app/AppSidebar";
import { AppTopbar, MobileFilters } from "./components/app/AppTopbar";
import { DataDialog } from "./components/app/DataDialog";
import { RoleEntryScreen } from "./components/app/RoleEntryScreen";

import { useDemoStore } from "./hooks/useDemoStore";
import { usePackageStore } from "./hooks/usePackageStore";

import { DEMO_SESSION_KEY } from "./lib/demoData";
import { isInPeriod } from "./lib/periods";

import ActionsPage from "./pages/ActionsPage";
import { collectCorrections, correctionReturnTab, ROLE_TABS } from "./pages/corrections/correctionViewModel";
import AuditPage from "./pages/AuditPage";
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
import PackageDetailPage from "./pages/PackageDetailPage";
import PackagesPage from "./pages/PackagesPage";
import ReportsPage from "./pages/ReportsPage";
import VerificationPage from "./pages/VerificationPage";
import DirectorateAuditPage from "./pages/DirectorateAuditPage";
import AdminWorkflowMonitoringPage from "./pages/AdminWorkflowMonitoringPage";

import { SubmoduleWorkspace } from "./SubmoduleWorkspace";
import type { PageProps } from "./types";

import type { WorkflowRole } from "./workflow/model";
import { derivePackageStage } from "./workflow/packageStore";
import { buildRoleNavigation } from "./workflow/roleNavigation";
import { ROLE_ROUTE_ACCESS, canAccessRoute } from "./workflow/workflowConfig";

function App() {
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
  } = usePackageStore();

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
  } = useDemoStore(packageStore.activeRole);

  const [noticeTone, setNoticeTone] = useState<"error" | undefined>();
  const setNotice = (message: string, tone?: "error") => {
    setNoticeTone(tone);
    setDemoNotice(message);
  };

  useEffect(startNotificationScheduler, []);
  const [location, setLocation] = useLocation();

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
      isRoleTestMode() &&
      localPersistence.getItem(DEMO_SESSION_KEY) === "active",
  );

  const routeAllowed =
    canAccessRoute(packageStore.activeRole, location) &&
    (!selectedSubmodule ||
      canAccessRoute(packageStore.activeRole, selectedSubmodule.split(":")[0]));
  const isPackageWorkspace =
    routeAllowed &&
    Boolean(activePackageId && activePackage) &&
    (selectedSubmodule === "/packages:Ringkasan Paket" ||
      workflowSubmodules.has(selectedSubmodule));

  const visibleNav = useMemo(
    () =>
      buildRoleNavigation(
        packageStore.activeRole,
        isPackageWorkspace,
        workflow ? derivePackageStage(workflow) : "Tahap 0",
      ),
    [packageStore.activeRole, isPackageWorkspace, workflow],
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

    const rawTab = new URLSearchParams(window.location.search).get("tab");
    const requestedTab = location === "/actions" && rawTab === "Audit Tingkat 3" ? "Tindak Lanjut Audit 3" : rawTab;
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
  }, [location]);

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
      setLocation(
        "/documents?tab=" +
          encodeURIComponent(selection.split(":")[1] || "Semua") +
          (isRoleTestMode() ? "&testRoles=1" : ""),
      );
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
    if (selection === "/entry:Gerbang RNI/LRS" && context?.survey && scopedPackages[id].project.surveyTypes.some(type => type === context.survey))
      sessionStorage.setItem(`jala-stage4-review-survey:${id}`, context.survey);
    navigateSubmodule(selection);
  };

  const openCorrection = (packageId: string, correctionId: string) => {
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

    // Carry only queue context, not query parameters from unrelated modules.
    const params = new URLSearchParams();
    params.set("submodule", "/actions:Koreksi berbukti");
    if (location === "/actions" && !selectedSubmodule) {
      if (ROLE_TABS[principal.role].includes(activeTab)) params.set("tab", activeTab);
      const filter = new URLSearchParams(window.location.search).get("package");
      if (filter === packageId) params.set("package", filter);
    }
    if (isRoleTestMode()) params.set("testRoles", "1");
    setSelectedSubmodule("/actions:Koreksi berbukti");
    setLocation(`/actions?${params}`);
    setMobileOpen(false);
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
    const params = new URLSearchParams();
    const fromCase = selectedSubmodule === "/actions:Koreksi berbukti";
    const origin = new URLSearchParams(window.location.search);
    let item;
    if (fromCase && activePackageId && scopedPackages[activePackageId]) {
      try {
        const id = localPersistence.getItem(`jala-correction-selection:${activePackageId}`);
        item = collectCorrections({ [activePackageId]: scopedPackages[activePackageId] }).find(row => row.id === id);
      } catch { /* Queue navigation remains available without local selection. */ }
    }
    const tab = correctionReturnTab(principal.role, fromCase ? origin.get("tab") ?? "" : "", item);
    params.set("tab", tab);
    const filter = origin.get("package");
    if (fromCase && filter && filter === activePackageId && Object.hasOwn(scopedPackages, filter)) params.set("package", filter);
    if (isRoleTestMode()) params.set("testRoles", "1");
    setSelectedSubmodule("");
    setActiveTab(tab);
    setLocation(`/actions?${params}`);
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
    openCorrection,
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
  };

  const roleVerificationPage =
    packageStore.activeRole === "Admin" ? (
      <AdminWorkflowMonitoringPage {...pageProps} />
    ) : packageStore.activeRole === "Direktorat / Pusat" ? (
      <DirectorateAuditPage {...pageProps} />
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
      <div className={`app-shell jm-shell b-shell v2-shell ${principal.role === "Penyedia Jasa / Ketua Tim" ? "v2-provider" : ""}`}>
        <a className="jm-skip" href="#main-content">
          Lewati ke konten
        </a>
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
            isPackageWorkspace={
              isPackageWorkspace &&
              selectedSubmodule !== "/documents:BA & dokumen workflow" &&
              selectedSubmodule !== "/actions:Koreksi berbukti"
            }
            packageName={activePackage?.project.packageName}
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
                notice && !(location === "/actions" && notice === "Workspace paket dibuka.") && (
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
                <NotificationsPage
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
                />
              ) : selectedSubmodule ? (
                workflowSubmodules.has(selectedSubmodule) ? (
                  activePackageId && activePackage ? (
                    <PackageDetailPage
                      // Every stage/role transition owns a fresh view tree. Prevent stale note toolbars
                      // from carrying over into another stage while preserving persisted audit state.
                      key={`${activePackageId}:${selectedSubmodule}:${activePackage.role}`}
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
                    <DashboardPage {...pageProps} onOpenCorrection={openCorrection} />
                  </Route>

                  <Route path="/data-master">
                    <MasterPage {...pageProps} />
                  </Route>

                  <Route path="/packages">{packageList}</Route>

                  <Route path="/entry">
                    <EntryPage {...pageProps} />
                  </Route>

                  <Route path="/verification">{roleVerificationPage}</Route>

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
                    <ReportsPage
                      key={principal.id + principal.role}
                      {...pageProps}
                      principal={principal}
                    />
                  </Route>

                  <Route path="/documents">
                    <DocumentsPage {...pageProps} />
                  </Route>

                  <Route path="/notifications">
                    <NotificationsPage
                      {...pageProps}
                      principal={principal}
                      onOpen={openNotificationTarget}
                    />
                  </Route>

                  <Route path="/audit">
                    <AuditPage {...pageProps} />
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

export default function ApplicationEntry() {
  // Production cannot initialize local stores or reuse forged simulation markers.
  return isRoleTestMode() ? (
    <App />
  ) : (
    <RoleEntryScreen
      currentRole="Penyedia Jasa / Ketua Tim"
      onEnter={() => {}}
    />
  );
}
