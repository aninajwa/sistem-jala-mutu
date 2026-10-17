export function parseNumbers(text:string):number[] {
  const values=text.trim().split(/[\s,;]+/).filter(Boolean).map(Number);
  if(values.length<2||values.some(n=>!Number.isFinite(n)))throw new Error('Isi sedikitnya dua angka valid; desimal memakai titik.');
  return values;
}
export function repeatStatistics(values:number[]) {
  if(values.length<2||values.some(n=>!Number.isFinite(n)))throw new Error('Sedikitnya dua pengamatan valid diperlukan.');
  const mean=values.reduce((a,b)=>a+b,0)/values.length;
  const sd=Math.sqrt(values.reduce((sum,n)=>sum+(n-mean)**2,0)/(values.length-1));
  if(mean===0)throw new Error('Rata-rata nol: CV tidak dapat dihitung.');
  return {mean,standardDeviation:sd,coefficientVariation:Math.abs(sd/mean)*100};
}
export function pairStatistics(text:string) {
  const pairs=text.trim().split('\n').filter(line=>line.trim()).map(line=>line.trim().split(/[,;\s]+/).map(Number));
  if(pairs.length<2||pairs.some(row=>row.length!==2||row.some(n=>!Number.isFinite(n))))throw new Error('Isi minimal dua baris: nilai referensi, nilai alat.');
  const meanX=pairs.reduce((a,p)=>a+p[0],0)/pairs.length,meanY=pairs.reduce((a,p)=>a+p[1],0)/pairs.length;
  const xx=pairs.reduce((a,p)=>a+(p[0]-meanX)**2,0),yy=pairs.reduce((a,p)=>a+(p[1]-meanY)**2,0),xy=pairs.reduce((a,p)=>a+(p[0]-meanX)*(p[1]-meanY),0);
  if(!xx||!yy)throw new Error('Nilai referensi dan alat harus memiliki variasi untuk menghitung regresi/R².');
  const coefficientA=xy/xx,coefficientB=meanY-coefficientA*meanX;
  return {coefficientA,coefficientB,rSquared:Math.min(1,xy*xy/(xx*yy)),segmentsWithinFive:pairs.filter(p=>Math.abs(p[1]-p[0])<=5).length/pairs.length*100,segmentsAtLeastFifteen:pairs.filter(p=>Math.abs(p[1]-p[0])>=15).length/pairs.length*100};
}
export function f1(tp:number,fp:number,fn:number):number {
  if([tp,fp,fn].some(n=>!Number.isInteger(n)||n<0)||2*tp+fp+fn===0)throw new Error('TP/FP/FN harus bilangan bulat ≥0, bukan semuanya nol.');
  return 2*tp/(2*tp+fp+fn);
}
