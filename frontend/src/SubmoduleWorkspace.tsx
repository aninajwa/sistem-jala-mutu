import { useEffect, useState } from 'react';
import {
  Activity, AlertCircle, AlertTriangle, ArrowDownToLine, ArrowLeft, ArrowRight,
  BarChart3, Bell, BookOpen, Building2, CalendarDays, Check, CheckCircle2,
  ClipboardCheck, ClipboardList, Clock3, Database, FileCheck2, FileText, Gauge,
  Layers3, ListChecks, Plus, RotateCcw, Search, ShieldCheck, Target, TrendingUp,
  Users, Wrench
} from 'lucide-react';

type Survey = {
  id: string;
  balai: string;
  ruas: string;
  jenis: string;
  tanggal: string;
  alat: string;
  status: string;
  hasil: string;
  km: number;
};
type Finding = {
  id: string;
  ruas: string;
  jenis: string;
  prioritas: string;
  status: string;
  pic: string;
  due: string;
};
type Doc = { id: string; nama: string; kategori: string; versi: string; status: string };
type Log = { id: string; waktu: string; pengguna: string; aktivitas: string; objek: string; hasil: string };
type SubmoduleProps = {
  selection: string;
  onBack: () => void;
  store: { surveys: Survey[]; findings: Finding[]; docs: Doc[]; logs: Log[] };
  scoped: Survey[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  openNew: (type: 'survey' | 'finding' | 'doc' | 'master') => void;
  beginEdit: (type: 'survey' | 'finding' | 'doc' | 'master', id: string) => void;
  updateStatus: (type: 'survey' | 'finding' | 'doc', id: string, status: string) => void;
  record: (activity: string, object: string) => void;
  setNotice: (message: string) => void;
};

const balais = [
  'Balai Sumatera Utara', 'Balai Jawa Barat', 'Balai Kalimantan Timur',
  'Balai Sulawesi Selatan', 'Balai Nusa Tenggara'
];
const surveyTypes = ['IRI', 'PCI', 'Lendutan', 'Jembatan', 'Lereng', 'Drainase', 'Lalu Lintas', 'RNI'];
const tools = ['Profilometer Laser', 'Kamera Survei', 'FWD Dynatest', 'Video Log', 'Total Station', 'GPS Geodetik'];
const staff = ['D. Prasetyo', 'N. Anggraini', 'B. Santoso', 'R. Hidayat', 'S. Rahma'];
const auditUsers = [
  ['D. Prasetyo', 'Penyedia Jasa / Ketua Tim', 'Aktif'],
  ['N. Anggraini', 'PIC Balai / Pengguna Jasa', 'Aktif'],
  ['B. Santoso', 'Direktorat / Pusat', 'Aktif'],
  ['R. Hidayat', 'Admin', 'Aktif']
];
const reportPackages = [
  ['Ringkasan QA/QC', 'Juni 2027', 'Progres, validasi, temuan'],
  ['Kinerja balai', 'Triwulan II 2027', 'Perbandingan wilayah'],
  ['Kepatuhan per survei', 'Semester I 2027', '8 jenis survei'],
  ['Jejak verifikasi', 'Juni 2027', 'Alur dan keputusan']
];
const notifications = [
  { id: 'NTF-14', category: 'Peringatan mutu', message: 'Kalibrasi alat perlu diperbarui', road: 'Balai Sumatera Utara · Medan – Binjai', due: '16 Jun 2027' },
  { id: 'NTF-13', category: 'Jatuh tempo', message: 'Verifikasi berkala jatuh tempo', road: 'Balai Jawa Barat · Bandung – Cileunyi', due: '18 Jun 2027' },
  { id: 'NTF-12', category: 'Peringatan mutu', message: 'Dokumen audit belum ditindaklanjuti', road: 'Balai Kalimantan Timur · Samarinda', due: '20 Jun 2027' },
  { id: 'NTF-11', category: 'Informasi', message: 'Hasil verifikasi sudah tersedia', road: 'Balai Sulawesi Selatan · Makassar – Maros', due: 'Selesai' }
];

const processes: Record<string, { summary: string; steps: [string, string, string] }> = {
  '/:Dashboard utama': { summary: 'Pantau kondisi keseluruhan dan pilih pekerjaan yang perlu ditangani.', steps: ['Tinjau indikator', 'Periksa antrean', 'Buka tindak lanjut'] },
  '/:Kepatuhan per survei': { summary: 'Bandingkan hasil setiap jenis survei dengan ambang mutu yang berlaku.', steps: ['Pilih jenis survei', 'Bandingkan hasil', 'Tinjau ketidaksesuaian'] },
  '/:Tren mutu data': { summary: 'Tinjau perubahan mutu data dari waktu ke waktu dan catat hasil evaluasi.', steps: ['Tentukan periode', 'Baca tren mutu', 'Catat evaluasi'] },
  '/data-master:Balai & wilayah': { summary: 'Kelola referensi balai dan wilayah yang dipakai pada pencatatan survei.', steps: ['Tinjau daftar balai', 'Periksa sebaran ruas', 'Tambah referensi'] },
  '/data-master:Referensi survei': { summary: 'Tinjau dan lengkapi jenis survei yang tersedia untuk entri data.', steps: ['Pilih referensi', 'Periksa kelompok', 'Simpan perubahan'] },
  '/data-master:Alat & personel': { summary: 'Periksa kesiapan alat, status kalibrasi, dan personel yang bertugas.', steps: ['Tinjau alat', 'Periksa personel', 'Catat tindak lanjut'] },
  '/entry:Data kegiatan': { summary: 'Catat kegiatan survei baru sebelum data diteruskan ke pemeriksaan awal.', steps: ['Pilih balai dan ruas', 'Lengkapi survei', 'Simpan atau ajukan'] },
  '/entry:Hasil awal': { summary: 'Periksa hasil pengukuran awal dan tetapkan status pemeriksaan berikutnya.', steps: ['Pilih entri', 'Tinjau hasil ukur', 'Tentukan status'] },
  '/entry:Riwayat pengajuan': { summary: 'Cari pengajuan lama, tinjau statusnya, dan buka kembali data yang diperlukan.', steps: ['Filter pengajuan', 'Tinjau riwayat', 'Buka data'] },
  '/verification:Self-audit': { summary: 'Periksa kelengkapan internal sebelum data masuk ke tahap verifikasi berikutnya.', steps: ['Isi daftar periksa', 'Simpan hasil audit', 'Teruskan ke sampling'] },
  '/verification:Sampling berjenjang': { summary: 'Pilih tingkat pemeriksaan dan buat daftar sampel untuk diverifikasi.', steps: ['Pilih tingkat audit', 'Buat daftar sampel', 'Tinjau sampel'] },
  '/verification:Hasil verifikasi': { summary: 'Tinjau sampel yang menunggu keputusan, lalu setujui atau kembalikan.', steps: ['Buka sampel', 'Periksa bukti', 'Tetapkan keputusan'] },
  '/actions:Kasus & temuan': { summary: 'Kelola seluruh kasus mutu, penanggung jawab, tenggat, dan status tindakan.', steps: ['Pilih temuan', 'Atur penanggung jawab', 'Pantau penyelesaian'] },
  '/actions:Prioritas': { summary: 'Fokus pada temuan kritis dan tinggi yang memerlukan tindak lanjut cepat.', steps: ['Tinjau prioritas', 'Tetapkan tindak lanjut', 'Pantau tenggat'] },
  '/actions:Verifikasi ulang': { summary: 'Periksa bukti perbaikan dan putuskan apakah temuan dapat ditutup.', steps: ['Buka temuan ulang', 'Periksa bukti', 'Setujui atau kembalikan'] },
  '/compliance:Perhitungan mutu': { summary: 'Hitung persentase kelulusan dari data yang tersedia untuk setiap survei.', steps: ['Pilih cakupan data', 'Hitung kelulusan', 'Tinjau ambang mutu'] },
  '/compliance:Tren kepatuhan': { summary: 'Bandingkan indikator kepatuhan antarperiode untuk menemukan perubahan.', steps: ['Tentukan periode', 'Bandingkan indikator', 'Catat pola'] },
  '/compliance:Peringkat balai': { summary: 'Bandingkan tingkat kelulusan antarbalai dan identifikasi kebutuhan dukungan.', steps: ['Bandingkan balai', 'Tinjau nilai rendah', 'Tentukan tindak lanjut'] },
  '/reports:Ringkasan kinerja': { summary: 'Susun ringkasan capaian survei, validasi, dan tindakan untuk periode terpilih.', steps: ['Pilih periode', 'Tinjau capaian', 'Bagikan ringkasan'] },
  '/reports:Laporan periodik': { summary: 'Pilih paket laporan yang sesuai dengan siklus dan kebutuhan pelaporan.', steps: ['Pilih paket', 'Periksa periode', 'Unduh laporan'] },
  '/reports:Ekspor data': { summary: 'Pilih kelompok data dan unduh salinan CSV untuk analisis lanjutan.', steps: ['Pilih kelompok data', 'Periksa isi ekspor', 'Unduh CSV'] },
  '/documents:Kalibrasi': { summary: 'Tinjau masa berlaku sertifikat alat dan perbarui dokumen kalibrasi.', steps: ['Cari sertifikat', 'Periksa masa berlaku', 'Perbarui dokumen'] },
  '/documents:Validasi': { summary: 'Kelola dokumen hasil validasi dan status kelengkapannya.', steps: ['Cari hasil validasi', 'Tinjau versi', 'Perbarui status'] },
  '/documents:Bukti pendukung': { summary: 'Kelola foto, berita acara, dan bukti lain yang melengkapi paket survei.', steps: ['Pilih bukti', 'Tinjau kelengkapan', 'Tambah dokumen'] },
  '/notifications:Pengingat jatuh tempo': { summary: 'Tinjau pekerjaan yang segera jatuh tempo dan tandai tindak lanjutnya.', steps: ['Periksa tenggat', 'Buka pengingat', 'Tindak lanjuti'] },
  '/notifications:Peringatan mutu': { summary: 'Tinjau anomali mutu dan hubungkan peringatan dengan temuan terkait.', steps: ['Buka peringatan', 'Tinjau konteks', 'Catat tindak lanjut'] },
  '/notifications:Eskalasi': { summary: 'Ikuti jenjang eskalasi dari PIC Balai / Pengguna Jasa hingga Direktorat / Pusat.', steps: ['PIC Balai / Pengguna Jasa', 'Atasan terkait', 'Direktorat / Pusat'] },
  '/audit:Pengguna & peran': { summary: 'Tinjau daftar pengguna demo dan peran yang diberikan pada masing-masing akun.', steps: ['Pilih pengguna', 'Tinjau peran', 'Catat perubahan'] },
  '/audit:Hak akses': { summary: 'Bandingkan hak input, validasi, pelaporan, dan pengelolaan akses.', steps: ['Pilih peran', 'Bandingkan hak', 'Catat hasil tinjauan'] },
  '/audit:Jejak aktivitas': { summary: 'Cari aktivitas pengguna dan telusuri objek serta hasil perubahannya.', steps: ['Cari aktivitas', 'Tinjau detail', 'Ekspor bila perlu'] }
};

function Panel({ title, icon: Icon = Activity, extra, children }: { title: string; icon?: any; extra?: any; children: any }) {
  return <section className="panel"><div className="panel-head"><h3><Icon size={14}/>{title}</h3>{extra}</div>{children}</section>;
}

function Metric({ label, value, note, tone = 'blue' }: { label: string; value: string; note: string; tone?: string }) {
  return <div className="kpi"><div className={`kpi-icon ${tone}`}><Activity size={17}/></div><div><div className="kpi-label">{label}</div><div className="kpi-value">{value}</div><div className="kpi-note">{note}</div></div></div>;
}

function Badge({ value }: { value: string }) {
  const tone = /Lulus|Selesai|Lengkap|Berhasil|Aktif|Disetujui|Memenuhi/i.test(value) ? 's-good'
    : /Verifikasi|Menunggu|Review|Diusulkan|Sedang|Perlu Dilengkapi/i.test(value) ? 's-warn'
    : /Perbaikan|Kritis|Tinggi|Tolak|Lewat/i.test(value) ? 's-bad'
    : /Draft|Dilaksanakan/i.test(value) ? 's-info' : 's-neutral';
  return <span className={`status ${tone}`}>{value}</span>;
}

function SurveyRows({ rows }: { rows: Survey[] }) {
  return <div className="table-wrap"><table><thead><tr><th>ID / Tanggal</th><th>Balai</th><th>Ruas</th><th>Jenis</th><th>Hasil awal</th><th>Status</th></tr></thead><tbody>{rows.map(s=><tr key={s.id}><td><strong>{s.id}</strong><div className="subtle">{s.tanggal}</div></td><td>{s.balai.replace('Balai ','')}</td><td>{s.ruas}</td><td>{s.jenis}</td><td>{s.hasil}</td><td><Badge value={s.status}/></td></tr>)}</tbody></table>{rows.length===0&&<div className="empty"><Search size={20}/>Tidak ada data survei.</div>}</div>;
}

function FindingRows({ rows, onStatus }: { rows: Finding[]; onStatus: (id: string, status: string) => void }) {
  return <div className="table-wrap"><table><thead><tr><th>ID</th><th>Ruas / temuan</th><th>Prioritas</th><th>PIC</th><th>Tenggat</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{rows.map(f=><tr key={f.id}><td>{f.id}</td><td><strong>{f.ruas}</strong><div className="subtle">{f.jenis}</div></td><td><Badge value={f.prioritas}/></td><td>{f.pic}</td><td>{f.due}</td><td><Badge value={f.status}/></td><td><select aria-label={`Ubah status ${f.id}`} value={f.status} onChange={e=>onStatus(f.id,e.target.value)} style={{fontSize:9,border:'1px solid #d5e0e8',borderRadius:4,padding:4}}>{['Diusulkan','Disetujui','Dilaksanakan','Verifikasi Ulang','Selesai'].map(s=><option key={s}>{s}</option>)}</select></td></tr>)}</tbody></table>{rows.length===0&&<div className="empty"><AlertCircle size={20}/>Tidak ada temuan pada alur ini.</div>}</div>;
}

export function SubmoduleWorkspace(props: SubmoduleProps) {
  const { selection, onBack } = props;
  const separator = selection.indexOf(':');
  const path = selection.slice(0, separator);
  const label = selection.slice(separator + 1);
  const key = `${path}:${label}`;
  const process = processes[key] || { summary: 'Tinjau data dan lanjutkan proses yang relevan.', steps: ['Tinjau data', 'Periksa proses', 'Simpan hasil'] as [string, string, string] };
  const parentLabel: Record<string, string> = {
    '/': 'Ringkasan QA/QC', '/data-master': 'Data Master', '/entry': 'Entri Survei',
    '/verification': 'Verifikasi', '/actions': 'Tindakan Perbaikan',
    '/compliance': 'Analisis & Kepatuhan', '/reports': 'Dashboard & Laporan',
    '/documents': 'Dokumen Mutu', '/notifications': 'Notifikasi', '/audit': 'Keamanan & Audit'
  };
  const [completed, setCompleted] = useState(false);
  const [checked, setChecked] = useState<string[]>([]);
  const [sampleIds, setSampleIds] = useState<string[]>([]);
  const [selectedSurvey, setSelectedSurvey] = useState('');
  const [range, setRange] = useState('Semester I 2027');
  const [query, setQuery] = useState('');
  const [readIds, setReadIds] = useState<string[]>(()=>{try{return JSON.parse(localStorage.getItem('road-qaqc-notifications-read')||'[]') as string[]}catch{return[]}});
  useEffect(()=>{
    setCompleted(false);setChecked([]);setSampleIds([]);setSelectedSurvey('');setRange('Semester I 2027');setQuery('');
  },[selection]);
  useEffect(()=>{localStorage.setItem('road-qaqc-notifications-read',JSON.stringify(readIds));},[readIds]);

  const finish = (message: string, activity = label, object = label) => {
    setCompleted(true);props.record(activity,object);props.setNotice(message);window.setTimeout(()=>props.setNotice(''),2600);
  };
  const survey = props.scoped.find(s=>s.id===selectedSurvey)||props.scoped[0];
  const surveyTypeRows = surveyTypes.map(type=>{
    const rows=props.scoped.filter(s=>s.jenis===type);
    const passed=rows.filter(s=>s.status==='Lulus').length;
    return {type,total:rows.length,passed,rate:rows.length?Math.round(passed/rows.length*100):0};
  });
  const findingRows = props.store.findings.filter(f=>`${f.id} ${f.ruas} ${f.jenis} ${f.pic}`.toLowerCase().includes(query.toLowerCase()));
  const matchingDocs = (category:string) => props.store.docs.filter(d=>d.kategori===category&&`${d.nama} ${d.kategori} ${d.status}`.toLowerCase().includes(query.toLowerCase()));
  const saveDoc = (doc:Doc) => <tr key={doc.id}><td><strong>{doc.nama}</strong><div className="subtle">{doc.id}</div></td><td>{doc.kategori}</td><td>{doc.versi}</td><td><Badge value={doc.status}/></td><td><div className="toolbar"><button className="btn sm" onClick={()=>props.beginEdit('doc',doc.id)}>Edit</button><button className="btn sm" onClick={()=>props.updateStatus('doc',doc.id,doc.status==='Lengkap'?'Perlu Dilengkapi':'Lengkap')}>Ubah status</button></div></td></tr>;
  const renderDocs = (category:string) => {
    const docs=matchingDocs(category);
    return <Panel title={`Dokumen ${category}`} icon={BookOpen} extra={<button className="btn primary sm" onClick={()=>props.openNew('doc')}><Plus size={12}/>Tambah dokumen</button>}>
      <div className="panel-body"><div className="notice" style={{marginBottom:10}}><FileCheck2 size={14}/>{process.summary}</div><div className="table-wrap"><table><thead><tr><th>Dokumen</th><th>Kategori</th><th>Versi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{docs.map(saveDoc)}</tbody></table>{docs.length===0&&<div className="empty">Belum ada dokumen dalam kategori ini.</div>}</div></div>
    </Panel>;
  };
  const downloadCsv = (filename:string, rows:string[][]) => {
    const content='\uFEFF'+rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(';')).join('\r\n');
    const url=URL.createObjectURL(new Blob([content],{type:'text/csv;charset=utf-8'}));
    const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const exportData = () => {
    const rows:string[][]=[['Jenis','ID','Balai / PIC','Ruas / Nama','Jenis / Kategori','Status','Tanggal / Detail']];
    if(checked.includes('Survei'))rows.push(...props.store.surveys.map(s=>['Survei',s.id,s.balai,s.ruas,s.jenis,s.status,`${s.tanggal}; ${s.hasil}; ${s.km} km`]));
    if(checked.includes('Temuan'))rows.push(...props.store.findings.map(f=>['Temuan',f.id,f.pic,f.ruas,f.jenis,f.status,`Prioritas ${f.prioritas}; jatuh tempo ${f.due}`]));
    if(checked.includes('Dokumen'))rows.push(...props.store.docs.map(d=>['Dokumen',d.id,'',d.nama,d.kategori,d.status,`Versi ${d.versi}`]));
    if(rows.length===1){props.setNotice('Pilih minimal satu kelompok data untuk diekspor');return}
    downloadCsv(`data-qaqc-${new Date().toISOString().slice(0,10)}.csv`,rows);
    finish('CSV berhasil diunduh','Ekspor data QA/QC',`${rows.length-1} baris`);
  };

  const content = (() => {
    switch (key) {
      case '/:Dashboard utama':
        return <><div className="kpi-grid"><Metric label="Survei dalam cakupan" value={`${props.scoped.length}`} note="sesuai filter balai dan periode"/><Metric label="Lulus validasi" value={`${props.scoped.filter(s=>s.status==='Lulus').length}`} note="survei yang memenuhi" tone="green"/><Metric label="Temuan terbuka" value={`${props.store.findings.filter(f=>f.status!=='Selesai').length}`} note="perlu dipantau" tone="amber"/><Metric label="Dokumen" value={`${props.store.docs.length}`} note="dokumen di penyimpanan lokal"/></div><div className="grid-two"><Panel title="Survei terbaru" icon={FileCheck2}><SurveyRows rows={props.scoped.slice(0,5)}/></Panel><Panel title="Tindak lanjut yang terbuka" icon={AlertTriangle}><div className="panel-body"><FindingRows rows={findingRows.filter(f=>f.status!=='Selesai').slice(0,4)} onStatus={(id,status)=>props.updateStatus('finding',id,status)}/></div></Panel></div></>;
      case '/:Kepatuhan per survei':
      case '/compliance:Perhitungan mutu':
        return <Panel title="Perhitungan kepatuhan per jenis survei" icon={BarChart3}><div className="panel-body"><div className="notice" style={{marginBottom:10}}><Target size={14}/>Persentase dihitung dari survei berstatus Lulus dalam cakupan filter saat ini.</div><div className="table-wrap"><table><thead><tr><th>Jenis survei</th><th>Jumlah data</th><th>Lulus</th><th>Tingkat kepatuhan</th><th>Status</th></tr></thead><tbody>{surveyTypeRows.map(row=><tr key={row.type}><td><strong>{row.type}</strong></td><td>{row.total}</td><td>{row.passed}</td><td><div className="toolbar"><div className="bar-track" style={{width:110}}><div className="bar-fill teal" style={{width:`${row.rate}%`}}/></div><b>{row.rate}%</b></div></td><td><Badge value={row.rate>=85?'Memenuhi':'Perlu ditinjau'}/></td></tr>)}</tbody></table></div></div></Panel>;
      case '/:Tren mutu data':
      case '/compliance:Tren kepatuhan':
        return <><Panel title="Tren mutu data" icon={TrendingUp} extra={<select value={range} onChange={e=>setRange(e.target.value)} aria-label="Pilih periode tren" style={{fontSize:9,border:'1px solid #d5e0e8',padding:5,borderRadius:4}}>{['Triwulan II 2027','Semester I 2027','Tahun 2027'].map(x=><option key={x}>{x}</option>)}</select>}><div className="panel-body"><div className="kpi-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))'}}><Metric label="Periode" value={range} note="cakupan grafik"/><Metric label="Kelulusan saat ini" value={`${props.scoped.length?Math.round(props.scoped.filter(s=>s.status==='Lulus').length/props.scoped.length*100):0}%`} note="dari survei terfilter" tone="green"/><Metric label="Pemeriksaan" value={`${props.scoped.length}`} note="survei diproses"/></div><div className="bar-list" style={{marginTop:12}}>{['Jan','Feb','Mar','Apr','Mei','Jun','Jul'].map((month,i)=><div className="bar-row" key={month}><span>{month} 2027</span><div className="bar-track"><div className={`bar-fill ${i%2?'teal':''}`} style={{width:`${[62,68,72,77,81,88,91][i]}%`}}/></div><span className="bar-percent">{[62,68,72,77,81,88,91][i]}%</span></div>)}</div></div></Panel><Panel title="Catatan evaluasi tren" icon={ClipboardList}><div className="panel-body"><div className="field"><label>Catatan pemeriksaan</label><textarea placeholder="Catat perubahan mutu yang perlu ditinjau..." data-testid="input-submodule-trend-note"/></div><div className="form-actions"><button className="btn primary" onClick={()=>finish('Catatan tren mutu tersimpan pada jejak audit','Catat evaluasi tren',range)}><Check size={13}/>Simpan catatan</button></div></div></Panel></>;
      case '/data-master:Balai & wilayah':
        return <Panel title="Daftar balai dan wilayah" icon={Building2} extra={<button className="btn primary sm" onClick={()=>props.openNew('master')}><Plus size={12}/>Tambah balai</button>}><div className="panel-body"><div className="notice" style={{marginBottom:10}}><Database size={14}/>Pilih kelompok “Balai & wilayah” pada formulir agar referensi baru tercatat di kategori ini.</div><div className="table-wrap"><table><thead><tr><th>Kode</th><th>Balai</th><th>Survei tersimpan</th><th>Status</th></tr></thead><tbody>{balais.map((b,i)=><tr key={b}><td>BL-{String(i+1).padStart(2,'0')}</td><td><strong>{b}</strong></td><td>{props.store.surveys.filter(s=>s.balai===b).length}</td><td><Badge value="Aktif"/></td></tr>)}</tbody></table></div></div></Panel>;
      case '/data-master:Referensi survei':
        return <Panel title="Referensi jenis survei" icon={Database} extra={<button className="btn primary sm" onClick={()=>props.openNew('master')}><Plus size={12}/>Tambah jenis</button>}><div className="panel-body"><div className="table-wrap"><table><thead><tr><th>Kode</th><th>Nama jenis</th><th>Data terdaftar</th><th>Status</th></tr></thead><tbody>{surveyTypes.map((type,i)=><tr key={type}><td>REF-{String(i+1).padStart(2,'0')}</td><td><strong>{type}</strong></td><td>{props.store.surveys.filter(s=>s.jenis===type).length}</td><td><Badge value="Aktif"/></td></tr>)}</tbody></table></div></div></Panel>;
      case '/data-master:Alat & personel':
        return <><div className="grid-two"><Panel title="Daftar alat survei" icon={Wrench} extra={<button className="btn sm" onClick={()=>props.openNew('master')}><Plus size={12}/>Tambah alat</button>}><div className="panel-body"><div className="table-wrap"><table><thead><tr><th>Alat</th><th>Kalibrasi</th><th>Kesiapan</th></tr></thead><tbody>{tools.map((tool,i)=><tr key={tool}><td>{tool}</td><td>{i%2?'30 Jun 2027':'14 Agu 2027'}</td><td><Badge value={i===1?'Perlu diperbarui':'Siap'}/></td></tr>)}</tbody></table></div></div></Panel><Panel title="Personel survei" icon={Users} extra={<button className="btn sm" onClick={()=>props.openNew('master')}><Plus size={12}/>Tambah personel</button>}><div className="panel-body"><div className="table-wrap"><table><thead><tr><th>Nama</th><th>Penugasan</th><th>Status</th></tr></thead><tbody>{staff.map((person,i)=><tr key={person}><td>{person}</td><td>{balais[i%balais.length].replace('Balai ','')}</td><td><Badge value="Aktif"/></td></tr>)}</tbody></table></div></div></Panel></div><div className="notice"><ShieldCheck size={14}/>Gunakan tambah referensi, lalu pilih kelompok alat survei atau personel.</div></>;
      case '/entry:Data kegiatan':
        return <><div className="grid-two"><Panel title="Pencatatan kegiatan survei" icon={ClipboardList}><div className="panel-body"><p className="subtle">Buat rekaman kegiatan sebelum hasil awal masuk ke proses pemeriksaan.</p><div className="stage-row">{['Informasi balai dan ruas','Jenis survei dan alat','Tanggal dan panjang ruas'].map((step,i)=><div className="stage" key={step}><div className="stage-num">{i+1}</div><div className="stage-title">{step}</div></div>)}</div><div className="form-actions"><button className="btn primary" onClick={()=>props.openNew('survey')}><Plus size={13}/>Buka formulir kegiatan</button></div></div></Panel><Panel title="Kegiatan dalam cakupan" icon={Activity}><div className="panel-body"><Metric label="Pengajuan tampil" value={`${props.scoped.length}`} note="mengikuti filter di atas"/><div className="quality-check"><span>Siap diverifikasi</span><Badge value={`${props.scoped.filter(s=>s.status==='Lulus').length} lulus`}/></div><div className="quality-check"><span>Masih berupa draft</span><Badge value={`${props.scoped.filter(s=>s.status==='Draft').length} draft`}/></div></div></Panel></div><Panel title="Data kegiatan terbaru" icon={FileCheck2}><SurveyRows rows={props.scoped.slice(0,5)}/></Panel></>;
      case '/entry:Hasil awal':
        return <><Panel title="Pemeriksaan hasil uji awal" icon={Gauge} extra={<select value={survey?.id||''} onChange={e=>setSelectedSurvey(e.target.value)} aria-label="Pilih survei" style={{fontSize:9,border:'1px solid #d5e0e8',padding:5,borderRadius:4}}>{props.scoped.map(s=><option key={s.id} value={s.id}>{s.id} · {s.ruas}</option>)}</select>}><div className="panel-body">{survey?<><div className="kpi-grid" style={{gridTemplateColumns:'repeat(4,minmax(0,1fr))'}}><Metric label="Ruas" value={survey.ruas} note={survey.balai}/><Metric label="Jenis" value={survey.jenis} note={`Alat: ${survey.alat}`}/><Metric label="Hasil awal" value={survey.hasil} note={`${survey.km} km`}/><Metric label="Status" value={survey.status} note={survey.tanggal}/></div><div className="form-actions"><button className="btn" onClick={()=>props.updateStatus('survey',survey.id,'Verifikasi')}><ArrowRight size={13}/>Teruskan ke verifikasi</button><button className="btn danger" onClick={()=>props.updateStatus('survey',survey.id,'Perlu Perbaikan')}><AlertTriangle size={13}/>Minta perbaikan</button></div></>:<div className="empty">Tidak ada survei pada filter saat ini.</div>}</div></Panel><Panel title="Pemeriksaan parameter" icon={CheckCircle2}><div className="panel-body">{['Kelengkapan hasil','Kesesuaian metode','Rentang nilai','Konsistensi data'].map((x,i)=><div className="quality-check" key={x}><span>{x}</span><Badge value={i===2?'Perlu review':'Sesuai'}/></div>)}</div></Panel></>;
      case '/entry:Riwayat pengajuan':
        return <Panel title="Riwayat pengajuan survei" icon={Clock3} extra={<div className="toolbar"><select value={props.activeTab} onChange={e=>props.setActiveTab(e.target.value)} aria-label="Filter status pengajuan" style={{fontSize:9,border:'1px solid #d5e0e8',padding:5,borderRadius:4}}>{['Semua','Draft','Verifikasi','Lulus','Perlu Perbaikan','Diserahkan'].map(x=><option key={x}>{x}</option>)}</select><button className="btn sm" onClick={()=>{props.setActiveTab('Semua');props.openNew('survey')}}><Plus size={12}/>Entri baru</button></div>}><div className="panel-body"><div className="tabs">{['Semua','Draft','Verifikasi','Lulus','Perlu Perbaikan'].map(t=><button key={t} className={`tab ${props.activeTab===t?'active':''}`} onClick={()=>props.setActiveTab(t)}>{t}</button>)}</div><SurveyRows rows={props.scoped.filter(s=>props.activeTab==='Semua'||s.status===props.activeTab)}/></div></Panel>;
      case '/verification:Self-audit': {
        const checks=['Kelengkapan dokumen','Metode survei','Kalibrasi alat','Konsistensi hasil','Kelengkapan ruas','Kewajaran nilai'];
        return <><Panel title="Daftar periksa self-audit" icon={ClipboardCheck} extra={<Badge value={`${checked.length}/${checks.length} diperiksa`}/>}><div className="panel-body">{checks.map(item=><label className="quality-check" key={item} style={{cursor:'pointer'}}><span>{item}</span><input type="checkbox" checked={checked.includes(item)} onChange={e=>setChecked(old=>e.target.checked?[...old,item]:old.filter(x=>x!==item))}/></label>)}<div className="form-actions"><button className="btn primary" disabled={checked.length!==checks.length} onClick={()=>finish('Hasil self-audit tersimpan dan siap masuk sampling','Simpan self-audit',`${checked.length} aspek diperiksa`)}><Check size={13}/>Simpan hasil audit</button></div></div></Panel><Panel title="Tahap berikutnya" icon={ArrowRight}><div className="panel-body"><div className="stage-row">{['Self-audit','Sampling balai','Audit lanjutan'].map((x,i)=><div className="stage" key={x}><div className="stage-num">{i+1}</div><div className="stage-title">{x}</div><Badge value={i===0&&completed?'Selesai':i===0?'Berjalan':'Menunggu'}/></div>)}</div></div></Panel></>;
      }
      case '/verification:Sampling berjenjang':
        return <><Panel title="Pembuatan sampel verifikasi" icon={ListChecks} extra={<select value={range} onChange={e=>setRange(e.target.value)} aria-label="Pilih tingkat verifikasi" style={{fontSize:9,border:'1px solid #d5e0e8',padding:5,borderRadius:4}}>{['Tingkat 1 — Penyedia jasa','Tingkat 2 — Pengguna jasa','Tingkat 3 — Direktorat'].map(x=><option key={x}>{x}</option>)}</select>}><div className="panel-body"><p className="subtle">Pilih tingkat, lalu buat sampel dari survei pada filter saat ini.</p><div className="form-actions"><button className="btn primary" onClick={()=>{setSampleIds(props.scoped.slice(0,Math.min(3,props.scoped.length)).map(s=>s.id));finish('Sampel verifikasi berhasil dibuat','Buat sampel verifikasi',range)}}><ListChecks size={13}/>Buat sampel</button></div><SurveyRows rows={props.scoped.filter(s=>sampleIds.includes(s.id))}/></div></Panel><div className="stage-row">{['Penyedia jasa','Pengguna jasa','Direktorat'].map((x,i)=><div className="stage" key={x}><div className="stage-num">{i+1}</div><div className="stage-title">{x}<div className="subtle">{i===0?'Audit internal':i===1?'Sampling':'Audit lanjutan'}</div></div></div>)}</div></>;
      case '/verification:Hasil verifikasi': {
        const pending=props.scoped.filter(s=>s.status==='Verifikasi'||s.status==='Perlu Perbaikan');
        return <><Panel title="Keputusan verifikasi" icon={CheckCircle2}><div className="table-wrap"><table><thead><tr><th>ID / Ruas</th><th>Hasil awal</th><th>Status saat ini</th><th>Keputusan</th></tr></thead><tbody>{pending.map(s=><tr key={s.id}><td><strong>{s.id}</strong><div className="subtle">{s.ruas}</div></td><td>{s.hasil}</td><td><Badge value={s.status}/></td><td><div className="toolbar"><button className="btn sm primary" onClick={()=>props.updateStatus('survey',s.id,'Lulus')}><Check size={12}/>Setujui</button><button className="btn sm danger" onClick={()=>props.updateStatus('survey',s.id,'Perlu Perbaikan')}><ArrowRight size={12}/>Kembalikan</button></div></td></tr>)}</tbody></table>{pending.length===0&&<div className="empty">Tidak ada survei menunggu keputusan.</div>}</div></Panel><Panel title="Jejak keputusan" icon={ClipboardList}><div className="panel-body"><div className="notice"><ShieldCheck size={14}/>Setiap perubahan status tersimpan pada log aktivitas lokal.</div></div></Panel></>;
      }
      case '/actions:Kasus & temuan':
        return <Panel title="Daftar kasus dan temuan" icon={ClipboardList} extra={<button className="btn primary sm" onClick={()=>props.openNew('finding')}><Plus size={12}/>Tambah temuan</button>}><FindingRows rows={findingRows} onStatus={(id,status)=>props.updateStatus('finding',id,status)}/></Panel>;
      case '/actions:Prioritas':
        return <><div className="kpi-grid" style={{gridTemplateColumns:'repeat(3,minmax(0,1fr))'}}><Metric label="Kritis" value={`${findingRows.filter(f=>f.prioritas==='Kritis').length}`} note="tindak lanjut segera" tone="red"/><Metric label="Tinggi" value={`${findingRows.filter(f=>f.prioritas==='Tinggi').length}`} note="pantau tenggat" tone="amber"/><Metric label="Target tindak lanjut" value="7 hari" note="standar prioritas"/></div><Panel title="Temuan prioritas" icon={AlertTriangle} extra={<button className="btn primary sm" onClick={()=>props.openNew('finding')}><Plus size={12}/>Catat tindakan</button>}><FindingRows rows={findingRows.filter(f=>['Kritis','Tinggi'].includes(f.prioritas))} onStatus={(id,status)=>props.updateStatus('finding',id,status)}/></Panel></>;
      case '/actions:Verifikasi ulang':
        return <Panel title="Temuan menunggu verifikasi ulang" icon={RotateCcw} extra={<Badge value={`${findingRows.filter(f=>f.status==='Verifikasi Ulang').length} antrean`}/>}><div className="panel-body"><div className="notice" style={{marginBottom:10}}><FileCheck2 size={14}/>Periksa bukti perbaikan sebelum mengubah status temuan.</div><FindingRows rows={findingRows.filter(f=>f.status==='Verifikasi Ulang')} onStatus={(id,status)=>props.updateStatus('finding',id,status)}/></div></Panel>;
      case '/compliance:Peringkat balai': {
        const ranks=balais.map(b=>{const rows=props.store.surveys.filter(s=>s.balai===b);const passed=rows.filter(s=>s.status==='Lulus').length;return {name:b.replace('Balai ',''),count:rows.length,rate:rows.length?Math.round(passed/rows.length*100):0}}).sort((a,b)=>b.rate-a.rate);
        return <Panel title="Peringkat kepatuhan balai" icon={Building2}><div className="panel-body"><div className="table-wrap"><table><thead><tr><th>Peringkat</th><th>Balai</th><th>Survei</th><th>Kelulusan</th><th>Skor</th></tr></thead><tbody>{ranks.map((r,i)=><tr key={r.name}><td>#{i+1}</td><td><strong>{r.name}</strong></td><td>{r.count}</td><td><div className="bar-track" style={{width:130}}><div className="bar-fill teal" style={{width:`${r.rate}%`}}/></div></td><td>{r.rate}%</td></tr>)}</tbody></table></div></div></Panel>;
      }
      case '/reports:Ringkasan kinerja':
        return <><div className="toolbar" style={{marginBottom:10}}><label className="subtle">Periode laporan</label><select value={range} onChange={e=>setRange(e.target.value)} aria-label="Pilih periode laporan" style={{fontSize:9,border:'1px solid #d5e0e8',padding:5,borderRadius:4}}>{['Semester I 2027','Triwulan II 2027','Juni 2027','Tahun 2027'].map(x=><option key={x}>{x}</option>)}</select></div><div className="kpi-grid"><Metric label="Target survei" value="1.250 km" note={range}/><Metric label="Realisasi" value={`${props.scoped.reduce((sum,s)=>sum+s.km,0).toFixed(1)} km`} note={`${props.scoped.length} survei`} tone="green"/><Metric label="Kelulusan validasi" value={`${props.scoped.length?Math.round(props.scoped.filter(s=>s.status==='Lulus').length/props.scoped.length*100):0}%`} note="cakupan saat ini" tone="green"/><Metric label="Temuan aktif" value={`${props.store.findings.filter(f=>f.status!=='Selesai').length}`} note="belum ditutup" tone="amber"/></div><Panel title="Kinerja per balai" icon={TrendingUp}><div className="panel-body bar-list">{balais.map((b,i)=><div className="bar-row" key={b}><span>{b.replace('Balai ','')}</span><div className="bar-track"><div className="bar-fill" style={{width:`${[86,78,72,69,65][i]}%`}}/></div><span className="bar-percent">{[86,78,72,69,65][i]}%</span></div>)}</div></Panel></>;
      case '/reports:Laporan periodik':
        return <Panel title="Paket laporan periodik" icon={FileText}><div className="table-wrap"><table><thead><tr><th>Nama laporan</th><th>Periode</th><th>Isi</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{reportPackages.map((row,i)=><tr key={row[0]}><td><strong>{row[0]}</strong></td><td>{row[1]}</td><td>{row[2]}</td><td><Badge value="Siap"/></td><td><button className="btn sm" onClick={()=>{downloadCsv(`${row[0].toLowerCase().replaceAll(' ','-')}.csv`,[['Jenis','ID','Balai','Ruas','Survei','Status'],...props.store.surveys.map(s=>['Survei',s.id,s.balai,s.ruas,s.jenis,s.status])]);finish(`${row[0]} berhasil diunduh`,'Unduh laporan periodik',row[0])}}><ArrowDownToLine size={12}/>Unduh</button></td></tr>)}</tbody></table></div></Panel>;
      case '/reports:Ekspor data':
        return <><Panel title="Pilih kelompok data" icon={Database}><div className="panel-body">{['Survei','Temuan','Dokumen'].map((group,i)=><label className="quality-check" key={group} style={{cursor:'pointer'}}><span>{group}<div className="subtle">{[props.store.surveys.length,props.store.findings.length,props.store.docs.length][i]} rekaman</div></span><input type="checkbox" checked={checked.includes(group)} onChange={e=>setChecked(old=>e.target.checked?[...old,group]:old.filter(x=>x!==group))}/></label>)}<div className="form-actions"><button className="btn primary" onClick={exportData}><ArrowDownToLine size={13}/>Unduh CSV</button></div></div></Panel><Panel title="Isi berkas ekspor" icon={FileCheck2}><div className="panel-body"><div className="notice"><CheckCircle2 size={14}/>Kolom ekspor mencakup identitas, status, tanggal, hasil, dan detail terkait untuk setiap kelompok yang dipilih.</div></div></Panel></>;
      case '/documents:Kalibrasi':
        return renderDocs('Kalibrasi');
      case '/documents:Validasi':
        return renderDocs('Validasi');
      case '/documents:Bukti pendukung':
        return renderDocs('Bukti pendukung');
      case '/notifications:Pengingat jatuh tempo':
      case '/notifications:Peringatan mutu': {
        const category=label==='Pengingat jatuh tempo'?'Jatuh tempo':'Peringatan mutu';
        const rows=notifications.filter(n=>n.category===category);
        return <Panel title={label} icon={Bell} extra={<button className="btn sm" onClick={()=>setReadIds(notifications.map(n=>n.id))}><Check size={12}/>Tandai semua dibaca</button>}><div style={{padding:10,display:'grid',gap:8}}>{rows.map(n=><div key={n.id} style={{display:'flex',gap:9,alignItems:'center',border:'1px solid #e4ebf0',padding:10,borderRadius:5,background:readIds.includes(n.id)?'#fff':'#f8fbfd'}}><div className="kpi-icon amber"><AlertCircle size={16}/></div><div style={{flex:1}}><strong style={{fontSize:10}}>{n.message}</strong><div className="subtle">{n.road}</div><div className="subtle">Tenggat {n.due}</div></div><button className="btn sm" onClick={()=>setReadIds(old=>old.includes(n.id)?old:[...old,n.id])}>{readIds.includes(n.id)?'Dibaca':'Tandai dibaca'}</button><button className="btn sm primary" onClick={()=>finish('Peringatan ditandai untuk ditindaklanjuti','Tindak lanjuti notifikasi',n.id)}>Tindak</button></div>)}</div></Panel>;
      }
      case '/notifications:Eskalasi':
        return <><Panel title="Alur eskalasi notifikasi" icon={TrendingUp}><div className="panel-body"><div className="stage-row">{[['1','PIC Balai / Pengguna Jasa','Pengingat awal'],['2','Atasan terkait','Eskalasi keterlambatan'],['3','Direktorat / Pusat','Tindak lanjut tingkat pusat']].map(row=><div className="stage" key={row[0]}><div className="stage-num">{row[0]}</div><div className="stage-title">{row[1]}<div className="subtle">{row[2]}</div></div><Badge value={completed?'Selesai':row[0]==='1'?'Aktif':'Menunggu'}/></div>)}</div><div className="form-actions"><button className="btn primary" onClick={()=>finish('Eskalasi dicatat pada log aktivitas','Eskalasi notifikasi','PIC Balai → Atasan')}><ArrowRight size={13}/>Eskalasi ke atasan</button><button className="btn" onClick={()=>finish('Tindak lanjut eskalasi ditandai selesai','Selesaikan eskalasi','Notifikasi QA/QC')}><Check size={13}/>Tandai selesai</button></div></div></Panel></>;
      case '/audit:Pengguna & peran':
        return <Panel title="Pengguna dan peran" icon={Users}><div className="panel-body"><div className="notice" style={{marginBottom:10}}><ShieldCheck size={14}/>Daftar ini berisi akun contoh pada mode simulasi.</div><div className="table-wrap"><table><thead><tr><th>Pengguna</th><th>Peran</th><th>Status</th><th>Aksi</th></tr></thead><tbody>{auditUsers.map(([name,role,status])=><tr key={name}><td><strong>{name}</strong></td><td>{role}</td><td><Badge value={status}/></td><td><button className="btn sm" onClick={()=>finish(`Akun ${name} dipilih untuk peninjauan peran`,'Tinjau pengguna',name)}>Tinjau</button></td></tr>)}</tbody></table></div></div></Panel>;
      case '/audit:Hak akses':
        return <Panel title="Matriks hak akses per peran" icon={ShieldCheck}><div className="table-wrap"><table><thead><tr><th>Peran</th><th>Input data</th><th>Validasi</th><th>Laporan</th><th>Kelola akses</th></tr></thead><tbody>{[['Penyedia Jasa / Ketua Tim',1,0,1,0],['PIC Balai / Pengguna Jasa',0,1,1,0],['Direktorat / Pusat',0,1,1,0],['Admin',1,1,1,1]].map(row=><tr key={String(row[0])}><td><strong>{row[0]}</strong></td>{row.slice(1).map((value,i)=><td key={i} style={{textAlign:'center',color:value?'#16966e':'#d4514b'}}>{value?<CheckCircle2 size={15}/>:<span aria-label="Tidak diizinkan">—</span>}</td>)}</tr>)}</tbody></table></div><div className="panel-body"><div className="notice"><ClipboardCheck size={14}/>Periksa hak minimum yang diperlukan sebelum memberikan akses.</div><div className="form-actions"><button className="btn" onClick={()=>finish('Tinjauan matriks hak akses dicatat','Tinjau hak akses','Empat peran')}>Catat tinjauan</button></div></div></Panel>;
      case '/audit:Jejak aktivitas': {
        const logs=props.store.logs.filter(log=>`${log.id} ${log.pengguna} ${log.aktivitas} ${log.objek}`.toLowerCase().includes(query.toLowerCase()));
        return <Panel title="Jejak aktivitas pengguna" icon={ClipboardList} extra={<div className="search-box"><Search size={13}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Cari aktivitas..." aria-label="Cari aktivitas"/></div>}><div className="table-wrap"><table><thead><tr><th>Waktu</th><th>Pengguna</th><th>Aktivitas</th><th>Objek</th><th>Hasil</th></tr></thead><tbody>{logs.map(log=><tr key={log.id}><td>{log.waktu}</td><td>{log.pengguna}</td><td>{log.aktivitas}</td><td>{log.objek}</td><td><Badge value={log.hasil}/></td></tr>)}</tbody></table>{logs.length===0&&<div className="empty">Tidak ada aktivitas yang cocok.</div>}</div></Panel>;
      }
      default:
        return <Panel title={label} icon={Activity}><div className="panel-body"><p className="subtle">{process.summary}</p></div></Panel>;
    }
  })();

  const id=label.toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/(^-|-$)/g,'');
  return <div data-testid={`view-submodule-${id}`}>
    <div className="module-row"><div><div className="module-title"><Layers3 size={15}/>{label}</div><div className="subtle" style={{marginTop:4}}>{parentLabel[path]} · Ruang kerja sub-modul</div></div><button className="btn" onClick={onBack} data-testid="button-back-to-module"><ArrowLeft size={13}/>Kembali ke {parentLabel[path]}</button></div>
    <Panel title={`Proses kerja · ${label}`} icon={ListChecks} extra={<Badge value={completed?'Selesai':'Siap dikerjakan'}/>}><div className="panel-body"><div className="stage-row">{process.steps.map((step,i)=><div className="stage" key={step}><div className="stage-num">{i+1}</div><div className="stage-title">{step}</div></div>)}</div><div className="notice" style={{marginTop:10}}><FileCheck2 size={14}/>{process.summary}</div></div></Panel>
    {content}
  </div>;
}
