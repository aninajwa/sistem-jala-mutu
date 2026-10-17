import { useState } from 'react';
import { pairStatistics, repeatStatistics, parseNumbers, f1 } from './measurements';
import type { ProductionTest, SurveyType } from './model';

export function ProductionCalculator({type,pciManual=false,onApply}:{type:SurveyType;pciManual?:boolean;onApply:(patch:Partial<ProductionTest>)=>void}) {
  const [pairs,setPairs]=useState('');
  const [repeats,setRepeats]=useState('');
  const [before,setBefore]=useState(''),[after,setAfter]=useState(''),[ap,setAp]=useState('');
  const [notice,setNotice]=useState('');
  if(type!=='IRI'&&type!=='PCI')return null;
  const calculate=()=>{
    try{
      const pair=pairStatistics(pairs),repeatValues=parseNumbers(repeats),repeat=repeatStatistics(repeatValues);
      let patch:Partial<ProductionTest>=type==='IRI'?{coefficientA:pair.coefficientA,coefficientB:pair.coefficientB,rSquared:pair.rSquared,coefficientVariation:repeat.coefficientVariation}:{standardDeviation:repeat.standardDeviation,segmentsWithinFive:pair.segmentsWithinFive,segmentsAtLeastFifteen:pair.segmentsAtLeastFifteen};
      if(type==='PCI'&&!pciManual&&(before.trim()||after.trim()||ap.trim())){
        const counts=(text:string)=>{const n=text.trim().split(/[\s,;]+/).map(Number);if(n.length!==3)throw new Error('F1: isi TP, FP, FN.');return f1(n[0],n[1],n[2]);};
        const averages=parseNumbers(ap);if(averages.some(n=>n<0||n>1))throw new Error('AP per kelas harus 0–1.');
        patch={...patch,f1Before:counts(before),f1After:counts(after),meanAveragePrecision:averages.reduce((a,b)=>a+b,0)/averages.length};
      }
      onApply({...patch,repeats:repeatValues.length});setNotice('Hasil helper lokal diterapkan ke data simulasi Tahap 2. Gunakan hanya sebagai fallback/preview, bukan sumber authoritative.');
    }catch(error){setNotice(error instanceof Error?error.message:'Data pengamatan tidak valid.');}
  };
  return <section className="wf-panel" data-testid="production-calculator">
    <div className="wf-panel-head"><h3>Helper kalkulasi lokal (opsional) · {type}</h3></div>
    <div className="wf-body">
      <div className="wf-callout warn">Gunakan hanya bila hasil belum tersedia dari source/SMD atau evidence. Workflow utama Tahap 2 adalah membaca hasil sumber, membandingkan dengan rule QA/QC, menampilkan system-check, lalu meminta keputusan PIC Balai / Pengguna Jasa. Panel ini bukan system-of-record.</div>
      <div className="wf-fields">
        <label className="wf-field">Pasangan referensi, alat (satu pasangan per baris)<textarea data-testid="input-calculator-pairs" value={pairs} onChange={e=>setPairs(e.target.value)} placeholder={'1, 1.02\n2, 2.04\n3, 3.06'}/></label>
        <label className="wf-field">Pengamatan berulang untuk CV / SD<textarea data-testid="input-calculator-repeats" value={repeats} onChange={e=>setRepeats(e.target.value)} placeholder="2.1, 2.12, 2.09, 2.11, 2.1"/></label>
        {type==='PCI'&&!pciManual&&<><label className="wf-field">TP, FP, FN sebelum QA<input value={before} onChange={e=>setBefore(e.target.value)}/></label><label className="wf-field">TP, FP, FN sesudah QA<input value={after} onChange={e=>setAfter(e.target.value)}/></label><label className="wf-field">AP per kelas (0–1)<input value={ap} onChange={e=>setAp(e.target.value)}/></label></>}
      </div>
      <button className="wf-button primary" data-testid="button-calculate-production" onClick={calculate}>Hitung preview & terapkan ke simulasi</button>
      <div className="wf-note" role="status">{notice}</div>
    </div>
  </section>;
}
