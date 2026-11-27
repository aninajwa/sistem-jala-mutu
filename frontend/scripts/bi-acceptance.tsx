/** Isolated development-only fixture; not an operational entry or production route. */
import { createRoot } from 'react-dom/client';
import { useState } from 'react';
import DashboardPage from '../src/pages/DashboardPage';
import ReportsPage from '../src/pages/ReportsPage';
import { createBIDemoFixture } from '../src/pages/biDemoFixture';
import { WORKFLOW_ROLE_OPTIONS } from '../src/workflow/workflowConfig';
import type { PageProps } from '../src/types';
import '../src/index.css';
import '../src/workflow/operational.css';
import '../src/design/v2.css';
import '../src/design/paket-a.css';
import '../src/design/b/paket-b.css';
import '../src/design/c/paket-c.css';
const query = new URLSearchParams(location.search);
const role = WORKFLOW_ROLE_OPTIONS[Number(query.get('role'))] ?? WORKFLOW_ROLE_OPTIONS[0];
const f = createBIDemoFixture(role);
function Fixture(){
 const [activeTab,setActiveTab] = useState(query.get('tab') ?? 'Semua');
 const [search,setSearch] = useState('');
 const [opened,setOpened] = useState('');
 const p:PageProps={workflow:f.workflow,packages:f.packages,biVolumes:f.volumes,biGeography:f.geography,store:{surveys:[],findings:[],docs:[],logs:[]},openPackage:id=>setOpened(id),openPackageReview:(id,s)=>setOpened(id+' '+s),openPackageBA:(id,s)=>setOpened(id+' '+s),balai:'Semua Balai',periode:'Semua periode',jenis:'Semua',scoped:[],search,setSearch,activeTab,setActiveTab,openNew:()=>{},beginEdit:()=>{},updateStatus:()=>{},record:()=>{},setNotice:()=>{}};
 return <main style={{padding:24,minHeight:'100vh'}}><p>Data simulasi · pengujian terpisah</p><output data-testid="opened-record">{opened}</output>{query.get('page')==='reports'?<ReportsPage {...p} principal={{id:'BI-TEST-'+role,role,packageIds:Object.keys(f.packages),balaiIds:Object.values(f.packages).map(s=>s.project.balai),source:'local-test'}}/>:<DashboardPage {...p} onOpenCorrection={(id,c)=>setOpened(id+' '+c)}/>}</main>;
}
if(import.meta.env.DEV)createRoot(document.getElementById('root')!).render(<Fixture/>);
