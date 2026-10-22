import type {ReactNode} from 'react';
export function RoleWorkSection({primary,title,children}:{primary:boolean;title:string;children:ReactNode}){
 return primary?<section aria-label="Pekerjaan saya">{children}</section>:<details className="wf-panel role-work-details"><summary className="wf-panel-head">Detail &amp; Riwayat · {title}</summary><div className="role-work-body">{children}</div></details>;
}
