import {captureWorkflowCommit} from '../notifications/notificationService';
import {loadWorkflowPackageStore,PACKAGE_STORE_KEY,type WorkflowPackageStore} from '../packageStore';
import {readLocal,writeLocal} from './localPersistence';
/** Synchronous local adapter retained for offline UI. HTTP adapter is opt-in, never silently used. */
export const packageRepository={load:loadWorkflowPackageStore,save:(value:WorkflowPackageStore)=>{const before=readLocal<WorkflowPackageStore|undefined>(PACKAGE_STORE_KEY,undefined);writeLocal(PACKAGE_STORE_KEY,value);captureWorkflowCommit(before,value);}};
