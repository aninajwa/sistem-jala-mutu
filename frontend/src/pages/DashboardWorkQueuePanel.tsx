import {Link} from 'wouter';
import {ClipboardCheck} from 'lucide-react';
import type {OperationalWorkflowState, WorkflowRole} from '../workflow/model';
import {dashboardWorkQueue} from './dashboardWorkQueue';
import './dashboardWorkQueue.css';

type Props = {
  packages: Record<string, OperationalWorkflowState>;
  role: WorkflowRole;
  onOpenPackage: (id: string) => void;
};

export function DashboardWorkQueue({packages, role, onOpenPackage}: Props) {
  const items = dashboardWorkQueue(packages, role);
  const urgent = items.filter(item => item.priority === 'action').length;
  const waiting = items.filter(item => item.priority === 'waiting').length;
  const monitor = items.filter(item => item.priority === 'monitor').length;
  const roleTitle = role === 'Admin' ? 'Paket dalam pemantauan administrasi' : role === 'Direktorat / Pusat' ? 'Prioritas pengawasan dan audit pusat' : role === 'PIC Balai / Pengguna Jasa' ? 'Antrean dan pemantauan Balai' : 'Pekerjaan paket saya';
  return <section className="ds-work-queue" aria-label={roleTitle} data-testid="dashboard-work-queue">
    <div className="ds-work-queue-head">
      <div><div className="ds-work-queue-kicker"><ClipboardCheck size={16}/> RINGKASAN PEKERJAAN</div><h2>{roleTitle}</h2><p>Status ringkas berdasarkan paket dalam akses Anda. Buka paket untuk melihat persyaratan, bukti, dan keputusan selengkapnya.</p></div>
      <Link className="btn sm" href={role === 'Admin' ? '/audit' : role === 'Direktorat / Pusat' || role === 'PIC Balai / Pengguna Jasa' ? '/verification' : '/packages'}>{role === 'Admin' ? 'Administrasi & Akses' : role === 'Direktorat / Pusat' ? 'Audit & Assurance' : role === 'PIC Balai / Pengguna Jasa' ? 'Antrean review' : 'Semua paket'}</Link>
    </div>
    <div className="ds-work-queue-summary" aria-label="Jumlah paket menurut kategori pekerjaan">
      <span><strong>{urgent}</strong> perlu tindakan</span>
      <span><strong>{waiting}</strong> menunggu pihak lain</span>
      <span><strong>{monitor}</strong> pemantauan</span>
    </div>
    {items.length === 0 ? <div className="ds-work-queue-empty">Belum ada paket dalam cakupan yang dipilih. Periksa penugasan atau filter paket.</div> :
      <div className="ds-work-queue-rows">{items.slice(0, 5).map(item => <div className="ds-work-queue-row" key={item.id}>
        <div className="ds-work-queue-main"><span className={`ds-work-queue-status is-${item.priority}`}>{item.label}</span><strong>{item.name}</strong><small>{item.balai}</small><p>{item.description}</p></div>
        <button type="button" className="btn sm" onClick={() => onOpenPackage(item.id)} aria-label={`Buka rincian paket ${item.name}`}>Lihat paket</button>
      </div>)}</div>}
    {items.length > 5 && <p className="ds-work-queue-more">Menampilkan 5 dari {items.length} paket; buka daftar paket untuk melihat semuanya.</p>}
  </section>;
}
