import type {ReactNode} from 'react';
export type RowTone='action'|'warning'|'info'|'success';
type Props={title:string;subtitle:string;meta:string;category:string;tone:RowTone;unread?:boolean;preview?:boolean;onView?:()=>void;onAct?:()=>void;onRead?:()=>void;actionLabel?:string;details?:ReactNode};
export default function NotificationRow({title,subtitle,meta,category,tone,unread,preview,onView,onAct,onRead,details,actionLabel="Tindak"}:Props){
 return <article className={`notif-row notif-row-${tone} ${unread?'notif-row-unread':''}`}>
  <span className="notif-row-symbol" aria-hidden="true">{tone==='warning'?'!':tone==='action'?'✓':tone==='success'?'✓':'i'}</span>
  <div className="notif-row-body"><div className="notif-row-heading"><strong>{title}</strong><span className={`notif-row-pill notif-row-pill-${tone}`}>{category}</span>{unread&&<span className="notif-row-dot" title="Belum dibaca"/>}</div><p>{subtitle}</p><small>{meta}</small>{details}</div>
  <div className="notif-row-actions"><button type="button" className="notif-outline-btn" disabled={preview||!onView} onClick={onView}>Lihat</button>{onAct&&<button type="button" className="notif-primary-btn" disabled={preview} onClick={onAct}>{actionLabel}</button>}{unread&&!preview&&onRead&&<button type="button" className="notif-row-read" onClick={onRead}>Tandai dibaca</button>}</div>
 </article>;
}
