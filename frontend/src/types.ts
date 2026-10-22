import type { OperationalWorkflowState } from './workflow/model';

export type Survey = { id:string; balai:string; ruas:string; jenis:string; tanggal:string; alat:string; status:string; hasil:string; km:number };
export type Finding = { id:string; ruas:string; jenis:string; prioritas:string; status:string; pic:string; due:string };
export type Doc = { id:string; nama:string; kategori:string; versi:string; status:string };
export type Log = { id:string; waktu:string; pengguna:string; aktivitas:string; objek:string; hasil:string };
export type Store = { surveys:Survey[]; findings:Finding[]; docs:Doc[]; logs:Log[] };

export type DemoStore = Store;
export type RecordType = 'survey' | 'finding' | 'doc' | 'master';
export type StatusRecordType = 'survey' | 'finding' | 'doc';

export type PageProps = {
  store: DemoStore;
  workflow: OperationalWorkflowState;
  packages: Record<string, OperationalWorkflowState>;
  openPackage: (id: string) => void;
  openPackageBA: (id: string, kind: string) => void;
  balai: string;
  periode: string;
  jenis: string;
  scoped: Survey[];
  search: string;
  setSearch: (s: string) => void;
  activeTab: string;
  setActiveTab: (s: string) => void;
  openNew: (t: RecordType) => void;
  beginEdit: (t: RecordType, id: string) => void;
  updateStatus: (t: StatusRecordType, id: string, status: string) => void;
  record: (a: string, o: string) => void;
  setNotice: (s: string) => void;
};
