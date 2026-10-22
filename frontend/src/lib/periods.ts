export function isInPeriod(date:string,period:string){
 const year=date.slice(0,4),month=Number(date.slice(5,7));
 if(period==='Tahun 2027')return year==='2027';
 if(period==='Semester I 2027')return year==='2027'&&month>=1&&month<=6;
 if(period==='Triwulan II 2027')return year==='2027'&&month>=4&&month<=6;
 if(period==='Juni 2027')return year==='2027'&&month===6;
 if(period==='Mei 2027')return year==='2027'&&month===5;
 return true;
}
