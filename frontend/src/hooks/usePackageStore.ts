import {INITIAL_WORKFLOW} from '../workflow/model';
import {workflowMutationError} from '../workflow/access/workflowMutationGuard';
import {packageRepository} from '../workflow/repository/packageRepository';
import {localPrincipal,canViewPackage,visiblePackages,isRoleTestMode} from '../workflow/access/packageAccess';
import {resolveEditablePackageId} from '../workflow/access/resolveEditablePackageId';
import { localPersistence } from '../workflow/repository/localPersistence';
import { addCorrectionDemoPackages } from "../workflow/testing/correctionDemoPackages";

import { useEffect,useState } from 'react';

import type {
OperationalWorkflowState,
WorkflowRole,
} from '../workflow/model';

import {
createInitialPackageStore,
  PACKAGE_STORE_KEY,
loadWorkflowPackageStore,
type WorkflowPackageStore,
} from '../workflow/packageStore';


export function usePackageStore(authenticatedRole?: WorkflowRole) {
  const [mutationError, setMutationError] = useState("");
  const [packageStore, setPackageStore] =
    useState<WorkflowPackageStore>(() => {
      const saved = authenticatedRole
        ? { ...createInitialPackageStore(), activeRole: authenticatedRole, activePackageId: null, packages: {} }
        : packageRepository.load();
      const store = !authenticatedRole && import.meta.env.DEV
        ? addCorrectionDemoPackages(saved)
        : saved;

      return authenticatedRole
        ? {
            ...store,
            activeRole: authenticatedRole,
            activePackageId: null,
            packages: Object.fromEntries(
              Object.entries(store.packages).map(([id, state]) => [
                id,
                { ...state, role: authenticatedRole },
              ]),
            ),
          }
        : store;
    });

  // Penyimpanan sementara sebelum integrasi API.
  useEffect(() => {
    if (authenticatedRole) return;
    try {
      packageRepository.save(packageStore);
    } catch (error) {
      console.error('Gagal menyimpan paket:', error);
      setMutationError("Penyimpanan paket gagal. Perubahan mungkin hilang saat halaman dimuat ulang.");
    }
  }, [packageStore, authenticatedRole]);

  const principal=authenticatedRole
    ? { id:`authenticated:${authenticatedRole}`, role:authenticatedRole, packageIds:[], balaiIds:[], source:'server' as const }
    : localPrincipal(packageStore.activeRole,packageStore.packages);
  const scopedPackages=visiblePackages(packageStore.packages,principal);
  const activePackageId = packageStore.activePackageId&&scopedPackages[packageStore.activePackageId]?packageStore.activePackageId:null;

  const activePackage = activePackageId
    ? packageStore.packages[activePackageId]
    : undefined;

  // Dipakai halaman umum yang masih memerlukan
  // struktur workflow, bukan sebagai paket aktif.
  const workflow =
    activePackage ??
    Object.values(scopedPackages)[0] ?? { ...INITIAL_WORKFLOW, role: packageStore.activeRole, project: { ...INITIAL_WORKFLOW.project, id: '__NO_ASSIGNED_PACKAGE__', packageName: 'Tidak ada paket dalam penugasan', contractor: '', contractNumber: '', routes: [], surveyTypes: [] } };

  const openPackage = (id: string): boolean => {
    if (!packageStore.packages[id]||!canViewPackage(principal,packageStore.packages[id])) {
      return false;
    }

    setPackageStore(current => ({
      ...current,
      activePackageId: id,
    }));

    return true;
  };

  const closePackage = () => {
    setPackageStore(current => ({
      ...current,
      activePackageId: null,
    }));
  };

  const setRole = (role: WorkflowRole) => {
    if(authenticatedRole || (!isRoleTestMode()&&role!==packageStore.activeRole))return;
    setPackageStore(current => ({
      ...current,
      activeRole: role,
      packages: Object.fromEntries(
        Object.entries(current.packages).map(
          ([id, state]) => [
            id,
            { ...state, role },
          ],
        ),
      ),
    }));
  };

  const updateWorkflow = (
    update: (
      current: OperationalWorkflowState,
    ) => OperationalWorkflowState,
    _activity: string,
    _object: string,
  ) => {
    setMutationError("");
    setPackageStore(current => {
      // The stage workspace renders the first role-visible package when a
      // direct URL has no active selection. Persist the same package when
      // the user first edits, rather than silently discarding the update.
      const visible = visiblePackages(
        current.packages,
        localPrincipal(current.activeRole, current.packages),
      );
      const id = resolveEditablePackageId(current.activePackageId, Object.keys(visible));
      if (!id || id !== workflow.project.id || current.activeRole !== packageStore.activeRole) {
        queueMicrotask(() => setMutationError("Perubahan tidak disimpan. Buka paket yang tersedia dari Paket Saya."));
        return current;
      }
      const previous = visible[id];

      const proposed=update({...previous,role:current.activeRole});
      const violation=workflowMutationError({...previous,role:current.activeRole},proposed,current.activeRole);
      if (violation) {
        queueMicrotask(() => setMutationError("Perubahan tidak disimpan. " + violation));
        return current;
      }
      return {...current,activePackageId:id,packages:{...current.packages,[id]:proposed}};
    });
  };

  return {
    packageStore,
    scopedPackages,
    principal,
    activePackageId,
    activePackage,
    workflow,
    openPackage,
    closePackage,
    setRole,
    updateWorkflow,
    mutationError,
  };
}
