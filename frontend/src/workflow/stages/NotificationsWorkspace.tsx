import type {WorkflowStageProps} from './stageSupport';
/** Legacy workflow links lead to the single operational inbox; this component creates no events or cases. */
export function NotificationsWorkspace({onNavigate}:WorkflowStageProps){return <section><h2>Notifikasi & Pengingat</h2><p>Pemberitahuan dan jadwal berada dalam satu kotak masuk sesuai penugasan Anda.</p><button className="btn primary" onClick={()=>onNavigate('/notifications:Semua notifikasi')}>Buka notifikasi</button></section>;}
