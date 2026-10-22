import {loadWorkflowPackageStore,PACKAGE_STORE_KEY,type WorkflowPackageStore} from '../packageStore';
import {writeLocal} from './localPersistence';
/** Synchronous local adapter retained for offline UI. HTTP adapter is opt-in, never silently used. */
export const packageRepository={load:loadWorkflowPackageStore,save:(value:WorkflowPackageStore)=>writeLocal(PACKAGE_STORE_KEY,value)};
