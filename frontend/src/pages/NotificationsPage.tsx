import {useEffect,useState} from 'react';
import type {PageProps} from '../types';
import type {Principal} from '../workflow/repository/contracts';
import type {Notification,Target} from '../workflow/notifications/notificationEvents';
import {markRead,readConfig,NOTIFICATION_CHANGED} from '../workflow/notifications/notificationRepository';
import {accessibleAgenda,notificationView,notificationError,NOTIFICATION_ERROR} from '../workflow/notifications/notificationService';
import {jakartaDay,days} from '../workflow/notifications/notificationSchedule';
import {viewerMember} from '../workflow/notifications/notificationRules';
import NotificationCalendar from '../workflow/notifications/NotificationCalendar';
import AdminNotificationSettings from './AdminNotificationSettings';
import NotificationRow,{type RowTone} from './NotificationRow';
import './notifications.css';

type Props=PageProps&{principal:Principal;onOpen:(target:Target,notificationId?:string)=>void};
type View='Semua'|'Tugas'|'Jadwal';
const Icon=({name}:{name:'bell'|'task'|'calendar'|'search'|'check'|'clock'|'inbox'|'filter'|'arrow'|'shield'})=>{
 const common={width:20,height:20,viewBox:'0 0 24 24',fill:'none',stroke:'currentColor',strokeWidth:1.8,strokeLinecap:'round' as const,strokeLinejoin:'round' as const,'aria-hidden':true as const};
 const paths={bell:<><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9"/><path d="M10 21h4"/></>,task:<><rect x="4" y="4" width="16" height="16" rx="3"/><path d="m8 12 3 3 5-6"/></>,calendar:<><rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4M17 3v4M3 10h18"/></>,search:<><circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 5 5"/></>,check:<><circle cx="12" cy="12" r="9"/><path d="m8 12 3 3 5-6"/></>,clock:<><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></>,inbox:<><path d="M4 4h16l2 12v4H2v-4L4 4Z"/><path d="M2 15h6l2 3h4l2-3h6"/></>,filter:<><path d="M4 7h16M7 12h10M10 17h4"/></>,arrow:<><path d="M5 12h14m-6-6 6 6-6 6"/></>,shield:<><path d="m12 2 8 4v6c0 5-3 8-8 10-5-2-8-5-8-10V6l8-4Z"/><path d="m9 12 2 2 4-4"/></>};
 return <svg {...common}>{paths[name]}</svg>;
};
export default function NotificationsPage(p:Props){
 const [,refresh]=useState(0),[query,setQuery]=useState(''),[pkg,setPkg]=useState(''),[unread,setUnread]=useState(false),[historical,setHistorical]=useState(false),[advanced,setAdvanced]=useState(false),[from,setFrom]=useState(''),[to,setTo]=useState(''),[error,setError]=useState('');
 useEffect(()=>{const update=()=>refresh(n=>n+1);window.addEventListener(NOTIFICATION_CHANGED,update);window.addEventListener(NOTIFICATION_ERROR,update);window.addEventListener('storage',update);return()=>{window.removeEventListener(NOTIFICATION_CHANGED,update);window.removeEventListener(NOTIFICATION_ERROR,update);window.removeEventListener('storage',update);};},[]);
 const packages=p.packages??{},role=p.principal.role,isAdmin=role==='Admin',isProvider=role==='Penyedia Jasa / Ketua Tim',isCentre=role==='Direktorat / Pusat';
 let storageError='';let config;try{config=readConfig().config;}catch(e){storageError=String(e);config={version:1 as const,members:[],bindings:{},confirmedDates:{},escalations:[]};}
 const member=viewerMember(config,p.principal);let all:Notification[]=[];try{all=notificationView(packages,p.principal);}catch(e){storageError=String(e);}
 const agenda=accessibleAgenda(packages,config,p.principal),menu:View=p.activeTab==='Jadwal'?'Jadwal':p.activeTab==='Tugas'?'Tugas':'Semua';
 const active=all.filter(n=>n.relevance==='active'),tasks=active.filter(n=>n.actionRequired),unreadCount=all.filter(n=>!n.readAt).length,agendaCount=agenda.filter(o=>!o.completed&&!o.cancelled).length;
 const list=all.filter(n=>(historical||n.relevance==='active')&&(menu!=='Tugas'||(!isAdmin&&n.actionRequired&&n.relevance==='active'))&&(menu!=='Jadwal'||!!n.obligationId)&&(!unread||!n.readAt)&&(!pkg||n.packageId===pkg)&&(!from||jakartaDay(new Date(n.occurredAt))>=from)&&(!to||jakartaDay(new Date(n.occurredAt))<=to)&&`${n.title} ${n.packageId} ${packages[n.packageId]?.project.packageName}`.toLowerCase().includes(query.toLowerCase()));
 const title=isAdmin?'Aktivitas administrasi':isProvider?'Pekerjaan dan informasi paket':isCentre?'Pemeriksaan tingkat Direktorat':'Pemeriksaan dan tindak lanjut Balai';
 const taskLabel=isAdmin?'Pengaturan Notifikasi':isProvider?'Perlu ditindaklanjuti':'Menunggu pemeriksaan';
 const actionCount=tasks.length;
 const reminderCount=active.filter(n=>!!n.obligationId).length;
 const today=jakartaDay();
 // KPI antrean: hanya kewajiban yang benar-benar dapat diakses, bukan notifikasi global.
 const taskObligations=agenda.filter(o=>!o.completed&&!o.cancelled&&tasks.some(n=>n.obligationId===o.id));
 const taskDueSoon=taskObligations.filter(o=>days(today,o.dueDate)>=0&&days(today,o.dueDate)<=7).length;
 const taskOverdue=taskObligations.filter(o=>days(today,o.dueDate)<0).length;
 function toneFor(n:Notification):RowTone{return n.relevance==='resolved'?'success':n.actionRequired?'action':n.obligationId?'warning':'info';}
 function run(fn:()=>void){try{fn();setError('');}catch(e){setError(e instanceof Error?e.message:String(e));}}
 function openNotification(n:Notification){run(()=>{p.onOpen(n.target,n.id);markRead([n.id],p.principal,packages);});}
 return <div className={`notif-page notif-view-${menu.toLowerCase()}`}>
  <div className="notif-intro"><div><h1>{menu==='Tugas'?taskLabel:menu==='Jadwal'?'Jadwal & Pengingat':'Aktivitas terbaru'}</h1><p>{menu==='Tugas'?(isAdmin?'Kelola penerima dan jadwal notifikasi.':'Pekerjaan yang membutuhkan perhatian Anda.'):menu==='Jadwal'?'Pantau agenda dan tenggat kegiatan berdasarkan jadwal yang sudah dikonfirmasi.':title}</p></div><div className="notif-intro-icon"><Icon name={menu==='Tugas'?'task':menu==='Jadwal'?'calendar':'bell'}/></div></div>
  {(error||storageError||notificationError())&&<div role="alert" className="notif-warning">Ada kendala saat memuat notifikasi. {error||storageError||notificationError()}</div>}

  {!(isAdmin&&menu==='Tugas')&&<div className="notif-summary" aria-label="Ringkasan notifikasi">
   {menu==='Tugas'?<>
    <div className="notif-stat notif-stat-blue"><span className="notif-stat-icon"><Icon name="task"/></span><div><span className="notif-stat-number">{actionCount}</span><span className="notif-stat-label">{isProvider?'Perlu ditindaklanjuti':'Antrean pemeriksaan'}</span></div></div>
    <div className="notif-stat notif-stat-amber"><span className="notif-stat-icon"><Icon name="clock"/></span><div><span className="notif-stat-number">{taskDueSoon}</span><span className="notif-stat-label">Tenggat â‰¤ 7 hari</span></div></div>
    <div className="notif-stat notif-stat-red"><span className="notif-stat-icon"><Icon name="shield"/></span><div><span className="notif-stat-number">{taskOverdue}</span><span className="notif-stat-label">Lewat tenggat</span></div></div>
   </>:menu==='Jadwal'?<>
    <div className="notif-stat notif-stat-blue"><span className="notif-stat-icon"><Icon name="calendar"/></span><div><span className="notif-stat-number">{agendaCount}</span><span className="notif-stat-label">Agenda aktif</span></div></div>
    <div className="notif-stat notif-stat-amber"><span className="notif-stat-icon"><Icon name="clock"/></span><div><span className="notif-stat-number">{agenda.filter(o=>!o.completed&&!o.cancelled&&days(jakartaDay(),o.dueDate)>=0&&days(jakartaDay(),o.dueDate)<=7).length}</span><span className="notif-stat-label">Mendekati tenggat</span></div></div>
    <div className="notif-stat notif-stat-teal"><span className="notif-stat-icon"><Icon name="bell"/></span><div><span className="notif-stat-number">{reminderCount}</span><span className="notif-stat-label">Pengingat aktif</span></div></div>
   </>:<>
    <div className="notif-stat notif-stat-blue"><span className="notif-stat-icon"><Icon name="bell"/></span><div><span className="notif-stat-number">{unreadCount}</span><span className="notif-stat-label">Belum dibaca</span></div></div>
    <div className="notif-stat notif-stat-amber"><span className="notif-stat-icon"><Icon name={isAdmin?'shield':'task'}/></span><div><span className="notif-stat-number">{isAdmin?config.members.filter(m=>m.active).length:actionCount}</span><span className="notif-stat-label">{isAdmin?'Penerima aktif':taskLabel}</span></div></div>
    <div className="notif-stat notif-stat-teal"><span className="notif-stat-icon"><Icon name="calendar"/></span><div><span className="notif-stat-number">{isAdmin?Object.keys(config.confirmedDates).length:agendaCount}</span><span className="notif-stat-label">{isAdmin?'Tanggal dikonfirmasi':'Agenda aktif'}</span></div></div>
   </>}
  </div>}
  {isAdmin&&menu==='Tugas'?<AdminNotificationSettings principal={p.principal} packages={packages} onSaved={p.setNotice}/>:menu==='Jadwal'?<div className="notif-schedule-layout"><div className="notif-schedule-main"><div className="notif-panel-title"><div><span className="notif-section-kicker">KALENDER KEGIATAN</span><h2>Agenda QA/QC</h2><p>Tanggal dan kegiatan yang tercatat untuk penugasan Anda.</p></div></div><NotificationCalendar agenda={agenda} onOpen={target=>run(()=>p.onOpen(target))}/></div><section className="notif-side-panel"><span className="notif-section-kicker">PENGINGAT</span><h2>Pengingat kegiatan</h2><p className="notif-muted">Informasi tenggat dari jadwal yang telah dikonfirmasi.</p>{list.length?list.slice(0,8).map(n=><article className="notif-mini-item" key={n.id}><span className="notif-tag">Pengingat</span><strong>{n.title}</strong><small>{packages[n.packageId]?.project.packageName||n.packageId}</small><button onClick={()=>openNotification(n)}>Lihat pengingat <Icon name="arrow"/></button></article>):<div className="notif-empty notif-empty-compact"><span className="notif-empty-icon"><Icon name="calendar"/></span><strong>Belum ada pengingat</strong><p>Agenda akan tampil saat jadwal kegiatan telah tersedia.</p></div>}</section></div>:
  <div className="notif-layout"><section className="notif-inbox"><div className="notif-panel-title"><div><span className="notif-section-kicker">{menu==='Tugas'?'ANTREAN PEKERJAAN':'KOTAK NOTIFIKASI'}</span><h2>{menu==='Tugas'?taskLabel:'Semua notifikasi'}</h2><p>{menu==='Tugas'?'Prioritaskan pekerjaan yang masih memerlukan tindakan.':'Pembaruan dan informasi terkait paket yang Anda tangani.'}</p></div>{menu==='Semua'&&<button className="notif-outline-btn" disabled={!unreadCount} onClick={()=>run(()=>markRead(all.map(n=>n.id),p.principal,packages))}><Icon name="check"/> Tandai semua dibaca</button>}</div>

   <div className="notif-toolbar"><label className="notif-search"><Icon name="search"/><input aria-label="Cari notifikasi" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari notifikasi atau paket..."/></label><select className="notif-package-select" aria-label="Pilih paket" value={pkg} onChange={e=>setPkg(e.target.value)}><option value="">Semua paket</option>{Object.values(packages).filter(s=>p.principal.packageIds.includes(s.project.id)).map(s=><option key={s.project.id} value={s.project.id}>{s.project.packageName}</option>)}</select><button className={`notif-filter-btn ${advanced?'is-active':''}`} aria-expanded={advanced} onClick={()=>setAdvanced(v=>!v)}><Icon name="filter"/> Filter {advanced?'âˆ’':'+'}</button></div>
   {advanced&&<div className="notif-advanced"><label><input type="checkbox" checked={unread} onChange={e=>setUnread(e.target.checked)}/> Belum dibaca</label><label><input type="checkbox" checked={historical} onChange={e=>setHistorical(e.target.checked)}/> Termasuk riwayat selesai</label><div className="notif-date-range"><label>Mulai <input type="date" value={from} onChange={e=>setFrom(e.target.value)}/></label><label>Hingga <input type="date" value={to} onChange={e=>setTo(e.target.value)}/></label></div><button className="notif-clear" onClick={()=>{setUnread(false);setHistorical(false);setFrom('');setTo('');setQuery('');setPkg('');}}>Reset filter</button></div>}
   <div className="notif-results"><span>{list.length} {menu==='Tugas'?'pekerjaan':'notifikasi'}</span>{!member&&<span className="notif-muted">Belum ada notifikasi untuk akun ini</span>}</div>
   {!list.length&&<div className="notif-empty"><span className="notif-empty-icon"><Icon name={menu==='Tugas'?'check':'inbox'}/></span><strong>{menu==='Tugas'?'Belum ada pekerjaan yang perlu ditindaklanjuti':'Belum ada notifikasi'}</strong><p>{menu==='Tugas'?'Pekerjaan yang membutuhkan tindakan akan ditampilkan di sini.':'Informasi terbaru mengenai paket Anda akan muncul di sini.'}</p></div>}
   <div className="notif-real-list">{list.map(n=><NotificationRow key={n.id} title={n.title} subtitle={packages[n.packageId]?.project.packageName||n.packageId} meta={`${new Date(n.occurredAt).toLocaleDateString('id-ID',{day:'numeric',month:'short',year:'numeric',timeZone:'Asia/Jakarta'})} Â· ${n.relevance==='resolved'?'Selesai / berubah':n.obligationId?'Pengingat jadwal':n.readAt?'Sudah dibaca':'Belum dibaca'}`} category={n.obligationId?'Pengingat':n.actionRequired?(isProvider?'Perlu tindakan':'Menunggu pemeriksaan'):'Informasi'} tone={toneFor(n)} unread={!n.readAt} onRead={()=>run(()=>markRead([n.id],p.principal,packages))} onView={n.relevance==='unavailable'?undefined:()=>openNotification(n)} onAct={n.relevance==='active'&&n.actionRequired?()=>openNotification(n):undefined} actionLabel={isProvider?'Tindak':isAdmin?'Buka':'Periksa'} details={<details className="notif-details"><summary>Dasar pemberitahuan</summary><p>{n.rule}</p></details>}/>)}</div>
  </section><aside className="notif-side-panel"><div className="notif-side-heading"><span className="notif-section-kicker">JADWAL</span><h2>Kalender kegiatan</h2><p>Agenda dan tenggat terdekat</p></div><NotificationCalendar agenda={agenda} onOpen={target=>run(()=>p.onOpen(target))}/></aside></div>}
 </div>;
}
