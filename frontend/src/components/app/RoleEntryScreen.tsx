import { ArrowRight, BarChart3, ClipboardCheck, FileText, Settings } from 'lucide-react';

import type { WorkflowRole } from '../../workflow/model';
import { ROLE_DEMO_USERS, WORKFLOW_ROLE_OPTIONS, WORKFLOW_ROLE_SCOPE } from '../../workflow/workflowConfig';

export function RoleEntryScreen({currentRole,onEnter}:{currentRole:WorkflowRole;onEnter:(role:WorkflowRole)=>void}){
 const roleIcon=(role:WorkflowRole)=>role==='Penyedia Jasa / Ketua Tim'?FileText:role==='PIC Balai / Pengguna Jasa'?ClipboardCheck:role==='Direktorat / Pusat'?BarChart3:Settings;
 return <div style={{minHeight:'100vh',background:'linear-gradient(135deg,#edf6fb 0%,#f7fafc 48%,#eef7f4 100%)',display:'grid',placeItems:'center',padding:24}}>
  <div style={{width:'min(1040px,100%)'}}>
   <div style={{textAlign:'center',marginBottom:22}}>
    <img src={`${import.meta.env.BASE_URL}jala-mutu-mark.png`} alt="Simbol JALA MUTU" style={{width:54,height:54,objectFit:'contain'}}/>
    <div style={{fontSize:26,fontWeight:800,letterSpacing:.2,color:'#17344b',marginTop:8}}>JALA <span style={{color:'#1689c9'}}>MUTU</span></div>
    <div style={{fontSize:12,color:'#60778b',marginTop:5}}>Pratinjau peran frontend Â· autentikasi nyata akan mengikuti backend</div>
   </div>
   <div style={{background:'#fff',border:'1px solid #dce7ee',borderRadius:12,padding:18,boxShadow:'0 18px 55px rgba(40,78,105,.10)'}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,alignItems:'center',flexWrap:'wrap',marginBottom:14}}>
     <div><strong style={{fontSize:15,color:'#233f54'}}>Masuk sesuai peran</strong><div style={{fontSize:10,color:'#6d8293',marginTop:3}}>Pilih actor untuk melihat menu dan aksi yang relevan. Pemilihan ini mengatur pengalaman UI sementara; kontrol akses backend akan diintegrasikan kemudian.</div></div>
     
    </div>
    <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(210px,1fr))',gap:12}}>
     {WORKFLOW_ROLE_OPTIONS.map(role=>{const Icon=roleIcon(role);const user=ROLE_DEMO_USERS.find(([,r])=>r===role)?.[0]||'Pengguna';return <button key={role} type="button" onClick={()=>onEnter(role)} data-testid={`button-enter-role-${role.toLowerCase().replace(/[^a-z0-9]+/g,'-')}`} style={{textAlign:'left',background:role===currentRole?'#f2f8fc':'#fff',border:role===currentRole?'1px solid #4ca3d4':'1px solid #dce6ed',borderRadius:9,padding:14,cursor:'pointer',minHeight:150}}>
      <div style={{width:34,height:34,borderRadius:8,display:'grid',placeItems:'center',background:'#e9f4fa',color:'#167db7',marginBottom:11}}><Icon size={18}/></div>
      <div style={{fontWeight:800,fontSize:11,color:'#244257'}}>{role}</div>
      <div style={{fontSize:9,color:'#748797',marginTop:3}}>Akun pratinjau: {user}</div>
      <div style={{fontSize:9.5,lineHeight:1.55,color:'#566d7f',marginTop:9}}>{WORKFLOW_ROLE_SCOPE[role]}</div>
      <div style={{display:'flex',alignItems:'center',gap:5,color:'#167db7',fontSize:9,fontWeight:700,marginTop:11}}>Masuk ke workspace <ArrowRight size={11}/></div>
     </button>})}
    </div>
   </div>
  </div>
 </div>;
}
