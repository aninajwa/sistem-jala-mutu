import {INITIAL_WORKFLOW} from '../workflow/model';
import {packageRepository} from '../workflow/repository/packageRepository';
import {localPrincipal,canViewPackage,visiblePackages,isRoleTestMode} from '../workflow/access/packageAccess';
import { localPersistence } from '../workflow/repository/localPersistence';

import { useEffect,useState } from 'react';

import type {
OperationalWorkflowState,
WorkflowRole,
} from '../workflow/model';

import {
PACKAGE_STORE_KEY,
loadWorkflowPackageStore,
type WorkflowPackageStore,
} from '../workflow/packageStore';


export function usePackageStore(authenticatedRole?: WorkflowRole) {
  const [packageStore, setPackageStore] =
    useState<WorkflowPackageStore>(() => {
      const store = packageRepository.load();
      return authenticatedRole ? { ...store, activeRole: authenticatedRole, activePackageId: null, packages: Object.fromEntries(Object.entries(store.packages).map(([id, state]) => [id, { ...state, role: authenticatedRole }])) } : store;
    });

  // Penyimpanan sementara sebelum integrasi API.
  useEffect(() => {
    try {
      packageRepository.save(packageStore);
    } catch (error) {
      console.error('Gagal menyimpan paket:', error);
    }
  }, [packageStore]);

  const principal=localPrincipal(packageStore.activeRole,packageStore.packages);
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
    setPackageStore(current => {
      const id = current.activePackageId;

      if (!id || !current.packages[id]) {
        return current;
      }

      const previous = current.packages[id];
      if(!canViewPackage(localPrincipal(current.activeRole,current.packages),previous))return current;

      return {
        ...current,
        packages: {
          ...current.packages,
          [id]: update({
            ...previous,
            role: current.activeRole,
          }),
        },
      };
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
  };
}
