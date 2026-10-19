import type { DemoStore } from '../types';

export function downloadCsv(filename:string,rows:string[][]){
  const csv='\uFEFF'+rows.map(row=>row.map(value=>`"${String(value).replaceAll('"','""')}"`).join(';')).join('\r\n');
  const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8'}));
  const link=document.createElement('a');link.href=url;link.download=filename;document.body.appendChild(link);link.click();link.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}

export function exportDemoDataCsv(store: DemoStore) {
  const rows: string[][] = [
    ['Jenis rekaman','ID','Balai / PIC','Ruas / Nama','Jenis / Kategori','Status','Tanggal / Detail'],
    ...store.surveys.map(s => ['Survei',s.id,s.balai,s.ruas,s.jenis,s.status,`${s.tanggal}; ${s.hasil}; ${s.km} km`]),
    ...store.findings.map(f => ['Temuan',f.id,f.pic,f.ruas,f.jenis,f.status,`Prioritas ${f.prioritas}; jatuh tempo ${f.due}`]),
    ...store.docs.map(d => ['Dokumen',d.id,'',d.nama,d.kategori,d.status,`Versi ${d.versi}`]),
  ];
  downloadCsv(`data-qaqc-${new Date().toISOString().slice(0,10)}.csv`, rows);
}
