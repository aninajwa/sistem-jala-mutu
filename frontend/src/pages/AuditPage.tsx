import { useEffect, useMemo, useState } from 'react';
import { ArrowDownToLine, ClipboardList, Plus, Search, ShieldCheck, Trash2, Users } from 'lucide-react';
import { PageHeading, Section } from '../components/app/AppComponents';
import { balais, surveiTypes, demoStoreSeed } from '../lib/demoData';
import { MASTER_REGISTRY_KEY, parseRegistry, registryRows } from '../admin/masterRegistry';
import { describePermission } from '../admin/accessPolicy';
import type { PageProps } from '../types';
import {
  accessAreas, adminAccessRoles, filterTrail, operationsFor, trailCsv,
  type AdminAccessRole,
} from '../admin/accessPolicy';
import {
  ACCOUNT_DRAFT_KEY, createAccountDraft, parseAccountDrafts, roleAssignmentLabel,
  scopeForRole, scopeLabels, type AccountDraft, type ProposedAssignment,
} from '../admin/accountDrafts';

const subpages = [
  { id: 'Pengguna', label: 'Pengguna & Peran' },
  { id: 'Hak akses', label: 'Hak Akses' },
  { id: 'Jejak aktivitas', label: 'Jejak Aktivitas' },
] as const;
const nameOf = (op: string) => ({ lihat: 'Lihat', tulis: 'Isi/Ubah', setujui: 'Putuskan', kelola: 'Kelola' } as Record<string,string>)[op] ?? op;

export default function AuditPage(p: PageProps) {
  const selected = subpages.find(tab => tab.id === p.activeTab)?.id ?? 'Pengguna';
  const [selectedRole, setSelectedRole] = useState<AdminAccessRole>('Admin');
  const [trailQuery, setTrailQuery] = useState('');
  const [selectedLogId, setSelectedLogId] = useState<string | null>(null);
  const [drafts, setDrafts] = useState<AccountDraft[]>(() => {
    try { return parseAccountDrafts(sessionStorage.getItem(ACCOUNT_DRAFT_KEY)); } catch { return []; }
  });
  const [showProposalForm, setShowProposalForm] = useState(false);
  const [proposalName, setProposalName] = useState('');
  const [proposalEmail, setProposalEmail] = useState('');
  const [proposalOrganization, setProposalOrganization] = useState('');
  const [proposalRole, setProposalRole] = useState<AdminAccessRole>('Penyedia Jasa / Ketua Tim');
  const [proposalScopeType, setProposalScopeType] = useState<ProposedAssignment['scopeType']>('paket');
  const [proposalScopeRef, setProposalScopeRef] = useState('');
  const [proposalAssignments, setProposalAssignments] = useState<ProposedAssignment[]>([]);
  const [proposalError, setProposalError] = useState('');
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  // Berkas pilihan hanya berasal dari data master dan daftar paket aplikasi.
  const balaiRefs = useMemo(() => {
    let entries: ReturnType<typeof parseRegistry> = [];
    try { entries = parseRegistry(localStorage.getItem(MASTER_REGISTRY_KEY)); } catch { /* Data master belum tersedia. */ }
    return registryRows(balais, surveiTypes, p.store.docs, entries)
      .filter(row => row.category === 'Balai & wilayah')
      .map(row => ({id:row.id,name:row.name}));
  }, [p.store.docs]);
  const packageRefs = useMemo(() => Object.entries(p.packages).map(([id, state]) => ({id,name:state.project.packageName || id})), [p.packages]);
  const scopeOptions = proposalScopeType === 'balai' ? balaiRefs : proposalScopeType === 'paket' ? packageRefs : [];
  const assignmentDisplay = (a: ProposedAssignment) => {
    if (a.scopeType === 'balai') return `${a.role} · Balai: ${balaiRefs.find(x=>x.id===a.scopeRef)?.name ?? a.scopeRef}`;
    if (a.scopeType === 'paket') return `${a.role} · Paket: ${packageRefs.find(x=>x.id===a.scopeRef)?.name ?? a.scopeRef}`;
    return roleAssignmentLabel(a);
  };
  const persistDrafts = (next: AccountDraft[]) => {
    try { sessionStorage.setItem(ACCOUNT_DRAFT_KEY, JSON.stringify(next)); }
    catch { setProposalError('Penyimpanan usulan tidak tersedia pada sesi ini.'); return; }
    setDrafts(next);
  };
  const appendAssignment = () => {
    const next = {role:proposalRole,scopeType:proposalScopeType,scopeRef:proposalScopeRef.trim()};
    if ((next.scopeType === 'paket' || next.scopeType === 'balai') && !next.scopeRef) {
      setProposalError('Pilih Balai atau paket penugasan.'); return;
    }
    if ((next.scopeType === 'balai' || next.scopeType === 'paket') && !scopeOptions.some(x=>x.id===next.scopeRef)) { setProposalError('Pilih penugasan dari daftar yang tersedia.'); return; }
    if (proposalAssignments.some(a=>a.role===next.role&&a.scopeType===next.scopeType&&a.scopeRef.toLowerCase()===next.scopeRef.toLowerCase())) {
      setProposalError('Penugasan yang sama sudah tercatat.'); return;
    }
    setProposalAssignments([...proposalAssignments,next]);setProposalScopeRef('');setProposalError('');
  };
  const saveProposal = () => {
    try {
      const candidate = createAccountDraft({username:proposalName,email:proposalEmail,organization:proposalOrganization,assignments:proposalAssignments},drafts,crypto.randomUUID(),new Date().toISOString());
      persistDrafts([...drafts,candidate]);setProposalName('');setProposalEmail('');setProposalOrganization('');
      setProposalAssignments([]);setProposalError('');setShowProposalForm(false);setSelectedDraftId(null);
      p.setNotice('Usulan tersimpan. Akun belum aktif.');
    } catch(error) { setProposalError(error instanceof Error ? error.message : 'Usulan belum dapat disimpan.'); }
  };
  const selectedDraft = drafts.find(d => d.id === selectedDraftId) ?? null;
  const exampleIds = useMemo(() => new Set(demoStoreSeed.logs.map(log => log.id)), []);
  const rows = useMemo(() => filterTrail(p.store.logs.filter(log => !exampleIds.has(log.id)), trailQuery), [p.store.logs, trailQuery, exampleIds]);
  const detail = rows.find(log => log.id === selectedLogId) ?? null;
  const closeDetail = () => {setSelectedDraftId(null);setSelectedLogId(null);};
  useEffect(() => {
    if (!selectedDraftId && !selectedLogId) return;
    const onEscape = (event:KeyboardEvent) => {if(event.key==='Escape')closeDetail();};
    window.addEventListener('keydown',onEscape);
    return () => window.removeEventListener('keydown',onEscape);
  }, [selectedDraftId, selectedLogId]);
  const exportVisible = () => {
    const blob = new Blob([trailCsv(rows)], { type: 'text/csv;charset=utf-8' });
    const uri = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = uri;
    link.download = `jejak-aktivitas-${new Date().toISOString().slice(0,10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(uri);
    p.setNotice('CSV jejak aktivitas berhasil diunduh.');
  };

  return <div data-testid="admin-access-workspace">
    <PageHeading label="Administrasi & Akses" detail="Pengguna, kewenangan peran, dan riwayat aktivitas" />
    <div className="toolbar" role="tablist" aria-label="Bagian Administrasi dan Akses" style={{ marginBottom: 16, flexWrap: 'wrap' }}>
      {subpages.map(tab => <button key={tab.id} type="button" role="tab" aria-selected={selected===tab.id}
        className={`btn ${selected===tab.id ? 'primary' : ''}`} onClick={() => p.setActiveTab(tab.id)}>
        {tab.label}
      </button>)}
    </div>

    {selected === 'Pengguna' && <>
      <div className="kpi-grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(180px,1fr))'}}>
        <div className="kpi"><div className="kpi-icon blue"><ShieldCheck size={18}/></div><div><div className="kpi-label">Peran sistem</div><div className="kpi-value">{adminAccessRoles.length}</div><div className="kpi-note">Peran tersedia</div></div></div>
        <div className="kpi"><div className="kpi-icon blue"><Users size={18}/></div><div><div className="kpi-label">Akun terhubung</div><div className="kpi-value">—</div><div className="kpi-note">Belum tersedia</div></div></div>
        <div className="kpi"><div className="kpi-icon blue"><Users size={18}/></div><div><div className="kpi-label">Usulan akun</div><div className="kpi-value" data-testid="admin-proposal-count">{drafts.length}</div><div className="kpi-note">Akun belum aktif</div></div></div>
      </div>
      <Section title="Usulan akun dan penugasan" icon={Users} extra={<button className="btn primary" type="button" onClick={()=>{setShowProposalForm(v=>!v);setProposalError('');}} data-testid="admin-add-proposal"><Plus size={13}/>Tambah usulan akun</button>}>
        <div className="panel-body">
          <p className="subtle">Usulan tersimpan sebagai persiapan akun. Akun belum aktif.</p>
          {showProposalForm && <div data-testid="admin-account-proposal-form" style={{border:'1px solid #d6e0e9',padding:16,borderRadius:8,margin:'14px 0'}}>
            <h3 style={{marginBottom:12}}>Tambah usulan akun</h3>
            <div className="grid-two">
              <div className="field"><label htmlFor="proposed-username">Username *</label><input id="proposed-username" value={proposalName} onChange={e=>setProposalName(e.target.value)} placeholder="Username pengguna" /></div>
              <div className="field"><label htmlFor="proposed-email">Email *</label><input id="proposed-email" type="email" value={proposalEmail} onChange={e=>setProposalEmail(e.target.value)} placeholder="nama@instansi.go.id" /></div>
              <div className="field"><label htmlFor="proposed-organization">Instansi/organisasi *</label><input id="proposed-organization" value={proposalOrganization} onChange={e=>setProposalOrganization(e.target.value)} placeholder="Nama instansi" /></div>
            </div>
            <h3 style={{margin:'14px 0 8px'}}>Usulan penugasan peran</h3>
            <div className="grid-two">
              <div className="field"><label htmlFor="proposed-role">Peran</label><select id="proposed-role" value={proposalRole} onChange={e=>{
                const role=e.target.value as AdminAccessRole;setProposalRole(role);setProposalScopeType(scopeForRole[role][0]);setProposalScopeRef('');
              }}>{adminAccessRoles.map(role=><option key={role} value={role}>{role}</option>)}</select></div>
              <div className="field"><label htmlFor="proposed-scope">Cakupan penugasan</label><select id="proposed-scope" value={proposalScopeType} onChange={e=>{setProposalScopeType(e.target.value as ProposedAssignment['scopeType']);setProposalScopeRef('');}}>{scopeForRole[proposalRole].map(t=><option key={t} value={t}>{scopeLabels[t]}</option>)}</select></div>
              {(proposalScopeType==='paket'||proposalScopeType==='balai')&&<div className="field"><label htmlFor="proposed-scope-ref">{proposalScopeType === 'balai' ? 'Balai penugasan *' : 'Paket penugasan *'}</label>
                <select id="proposed-scope-ref" value={proposalScopeRef} onChange={e=>setProposalScopeRef(e.target.value)} disabled={scopeOptions.length===0}>
                  <option value="">{scopeOptions.length ? 'Pilih dari daftar' : 'Belum ada referensi tersedia'}</option>
                  {scopeOptions.map(option=><option key={option.id} value={option.id}>{option.name}</option>)}
                </select>
              </div>}
            </div>
            <div className="toolbar"><button type="button" className="btn" onClick={appendAssignment} data-testid="admin-add-assignment"><Plus size={13}/>Tambahkan penugasan</button></div>
            {proposalAssignments.length>0 && <div className="table-wrap" style={{marginTop:12}}><table data-testid="admin-proposal-assignments"><thead><tr><th>Penugasan yang disiapkan</th><th>Aksi</th></tr></thead><tbody>{proposalAssignments.map((a,i)=><tr key={`${a.role}-${a.scopeType}-${a.scopeRef}`}><td>{assignmentDisplay(a)}</td><td><button type="button" className="btn sm" onClick={()=>setProposalAssignments(v=>v.filter((_,j)=>j!==i))}>Hapus</button></td></tr>)}</tbody></table></div>}
            {proposalError&&<div className="notice" role="alert" style={{marginTop:10}}>{proposalError}</div>}
            <div className="toolbar" style={{justifyContent:'flex-end',marginTop:12}}><button type="button" className="btn" onClick={()=>{setShowProposalForm(false);setProposalError('');}}>Batal</button><button type="button" className="btn primary" data-testid="admin-save-proposal" onClick={saveProposal}>Simpan usulan</button></div>
          </div>}
          {drafts.length===0?<div className="empty" data-testid="admin-users-empty"><Users size={22}/><strong>Belum ada usulan akun</strong><span>Tambahkan usulan akun untuk menyiapkan identitas dan penugasan pengguna.</span></div>:
          <div className="table-wrap"><table data-testid="admin-proposals-table"><thead><tr><th>Username</th><th>Organisasi</th><th>Penugasan</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{drafts.map(d=><tr key={d.id}><td><strong>{d.username}</strong><div className="subtle">{d.email}</div></td><td>{d.organization}</td><td>{d.assignments.length} peran/cakupan</td><td>Belum aktif</td><td><div className="toolbar"><button className="btn sm" type="button" onClick={()=>setSelectedDraftId(d.id)}>Detail</button><button className="btn sm" type="button" onClick={()=>{persistDrafts(drafts.filter(x=>x.id!==d.id));if(selectedDraftId===d.id)setSelectedDraftId(null);}} aria-label={`Hapus usulan ${d.username}`}><Trash2 size={12}/>Hapus</button></div></td></tr>)}</tbody></table></div>}

        </div>
      </Section>
      <Section title="Peran yang dikenali sistem" icon={ShieldCheck}>
        <div className="table-wrap"><table data-testid="admin-roles-table"><thead><tr><th>Peran</th><th>Fungsi utama</th></tr></thead><tbody>
          {adminAccessRoles.map(role => <tr key={role}><td><strong>{role}</strong></td><td>{role === 'Admin' ? 'Mengelola referensi, peran, dan konfigurasi; bukan pengesah QA/QC' : role === 'Direktorat / Pusat' ? 'Audit tingkat pusat sesuai penugasan' : role === 'PIC Balai / Pengguna Jasa' ? 'Pemeriksaan dan keputusan Balai sesuai penugasan' : 'Pencatatan, pengajuan, dan perbaikan data survei'}</td></tr>)}
        </tbody></table></div>
      </Section>
    </>}

    {selected === 'Hak akses' && <>
      <Section title="Kewenangan berdasarkan peran" icon={ShieldCheck}>
        <div className="panel-body">
          <div className="field" style={{maxWidth:400}}><label htmlFor="admin-role-policy">Pilih peran</label>
            <select id="admin-role-policy" aria-label="Pilih peran untuk hak akses" value={selectedRole} onChange={e => setSelectedRole(e.target.value as AdminAccessRole)}>
              {adminAccessRoles.map(role => <option key={role} value={role}>{role}</option>)}
            </select>
          </div>
          <div className="table-wrap"><table data-testid="admin-permission-table"><thead><tr><th>Area</th><th>Hak peran</th><th>Cakupan dan ketentuan</th></tr></thead><tbody>
            {accessAreas.map(area => <tr key={area.id}><td><strong>{area.label}</strong><div className="subtle">{area.detail}</div></td><td>{operationsFor(selectedRole,area.id).map(nameOf).join(', ') || 'Tidak diberikan'}</td><td>{describePermission(selectedRole,area.id)}</td></tr>)}
          </tbody></table></div>

        </div>
      </Section>
    </>}

    {selected === 'Jejak aktivitas' && <>
      <Section title="Jejak Aktivitas" icon={ClipboardList} extra={<button className="btn" type="button" onClick={exportVisible} data-testid="admin-export-trail"><ArrowDownToLine size={13}/>Ekspor CSV</button>}>
        <div className="panel-body">
          <div className="field" style={{maxWidth:460}}>
          <label htmlFor="admin-trail-search">Cari aktivitas</label>
          <div style={{display:'flex',alignItems:'center',gap:8}}><Search size={14}/><input id="admin-trail-search" value={trailQuery} onChange={e => setTrailQuery(e.target.value)} placeholder="Pengguna, tindakan, objek, atau hasil" /></div>
        </div></div>
        <div className="table-wrap"><table data-testid="admin-trail-table"><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aktivitas</th><th>Objek</th><th>Hasil</th><th>Aksi</th></tr></thead><tbody>
          {rows.map(log => <tr key={log.id}><td>{log.waktu}</td><td>{log.pengguna}</td><td>{log.aktivitas}</td><td>{log.objek}</td><td>{log.hasil}</td><td><button className="btn sm" type="button" onClick={() => setSelectedLogId(log.id)}>Detail</button></td></tr>)}
        </tbody></table>{rows.length === 0 && <div className="empty">Tidak ada aktivitas yang cocok.</div>}</div>
      </Section>


    </>}
    {selectedDraft && <div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)closeDetail();}}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={`Detail usulan ${selectedDraft.username}`} data-testid="admin-proposal-detail" style={{width:'min(560px,calc(100vw - 28px))',maxHeight:'85vh',overflowY:'auto'}}>
        <div className="panel-head"><h3>Detail Usulan Akun</h3><button className="btn sm" type="button" onClick={closeDetail} aria-label="Tutup Detail Usulan">✕</button></div>
        <div className="panel-body">
          <h3 style={{margin:'0 0 4px'}}>{selectedDraft.username}</h3>
          <p className="subtle" style={{margin:'0 0 14px'}}>Akun belum aktif</p>
          <h4>Identitas pengguna</h4>
          <div className="quality-check"><span>Email</span><strong>{selectedDraft.email}</strong></div>
          <div className="quality-check"><span>Instansi/organisasi</span><strong>{selectedDraft.organization}</strong></div>
          <div className="quality-check"><span>Dibuat pada</span><strong>{new Date(selectedDraft.createdAt).toLocaleString('id-ID')}</strong></div>
          <h4 style={{margin:'15px 0 6px'}}>Penugasan yang diusulkan</h4>
          {selectedDraft.assignments.map((a,i)=><div className="quality-check" key={i}><span>Penugasan {i+1}</span><strong>{assignmentDisplay(a)}</strong></div>)}
          <div className="toolbar" style={{justifyContent:'flex-end',marginTop:14}}><button type="button" className="btn" onClick={closeDetail}>Tutup</button></div>
        </div>
      </div>
    </div>}
    {detail && <div className="overlay" role="presentation" onMouseDown={e=>{if(e.target===e.currentTarget)closeDetail();}}>
      <div className="dialog" role="dialog" aria-modal="true" aria-label={`Detail aktivitas ${detail.id}`} data-testid="admin-trail-detail" style={{width:'min(560px,calc(100vw - 28px))',maxHeight:'85vh',overflowY:'auto'}}>
        <div className="panel-head"><h3>Detail Aktivitas</h3><button className="btn sm" type="button" onClick={closeDetail} aria-label="Tutup Detail Aktivitas">✕</button></div>
        <div className="panel-body">
          <h3 style={{margin:'0 0 4px'}}>{detail.aktivitas}</h3>
          <p className="subtle" style={{margin:'0 0 14px'}}>Rekaman aktivitas aplikasi</p>
          <h4>Informasi tindakan</h4>
          {([['Pengguna',detail.pengguna],['Waktu',detail.waktu],['Objek terkait',detail.objek],['Hasil',detail.hasil]] as const).map(([label,value]) => <div key={label} className="quality-check"><span>{label}</span><strong>{value}</strong></div>)}
          <h4 style={{margin:'15px 0 6px'}}>Identitas rekaman</h4>
          <div className="quality-check"><span>ID aktivitas</span><strong>{detail.id}</strong></div>
          <div className="toolbar" style={{justifyContent:'flex-end',marginTop:14}}><button type="button" className="btn" onClick={closeDetail}>Tutup</button></div>
        </div>
      </div>
    </div>}
  </div>;
}
