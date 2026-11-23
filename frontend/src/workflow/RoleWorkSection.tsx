import type {ReactNode} from 'react';
export function RoleWorkSection({primary,title,children,open=false}:{primary:boolean;title:string;children:ReactNode;open?:boolean}){
 return primary?<section aria-label="Pekerjaan saya">{children}</section>:<details open={open} className="wf-panel role-work-details"><summary className="wf-panel-head">Detail &amp; Riwayat · {title}</summary><div className="role-work-body">{children}</div></details>;
}
