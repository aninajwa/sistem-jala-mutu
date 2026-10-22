import type {AuditSampleUnit,DailySurveyRecord,SurveyType} from './model';

export type AuditPopulation={units:AuditSampleUnit[];issues:string[]};
type ExplicitUnit={id?:string;key?:string;unitKey?:string;type?:AuditSampleUnit['unitType'];unitType?:AuditSampleUnit['unitType'];lengthKm?:number;sourceReference?:string;evidenceReference?:string;groupKey?:string};
const safeKey=(value:string)=>value.trim().replace(/\s+/g,' ');
const unitId=(record:DailySurveyRecord,type:AuditSampleUnit['unitType'],key:string)=>`${record.id}::${type}:${safeKey(key)}`;
const splitList=(value?:string)=>value?.split(/[;,\n]+/).map(safeKey).filter(Boolean)??[];

function explicitUnits(record:DailySurveyRecord):ExplicitUnit[]|undefined{
 const raw=record.technicalData?.auditUnits?.trim();if(!raw)return undefined;
 try{
  const parsed=JSON.parse(raw) as unknown;if(!Array.isArray(parsed))return undefined;
  const units:ExplicitUnit[]=[];
  for(const item of parsed){
   if(typeof item==='string'){units.push({key:item});continue;}
   if(!item||typeof item!=='object'||Array.isArray(item))continue;
   const value=item as Record<string,unknown>;const length=typeof value.lengthKm==='number'?value.lengthKm:typeof value.lengthKm==='string'?Number(value.lengthKm):undefined;
   units.push({id:typeof value.id==='string'?value.id:undefined,key:typeof value.key==='string'?value.key:undefined,unitKey:typeof value.unitKey==='string'?value.unitKey:undefined,type:typeof value.type==='string'?value.type as AuditSampleUnit['unitType']:undefined,unitType:typeof value.unitType==='string'?value.unitType as AuditSampleUnit['unitType']:undefined,lengthKm:Number.isFinite(length)?length:undefined,sourceReference:typeof value.sourceReference==='string'?value.sourceReference:undefined,evidenceReference:typeof value.evidenceReference==='string'?value.evidenceReference:undefined,groupKey:typeof value.groupKey==='string'?value.groupKey:undefined});
  }
  return units;
 }catch{return undefined;}
}

function defaultKind(type:SurveyType):AuditSampleUnit['unitType']{
 if(type==='Lendutan')return 'point';
 if(type==='Jembatan'||type==='Lereng')return 'object';
 if(type==='Lalu Lintas')return 'time-window';
 return 'segment';
}

function singleSourceKey(record:DailySurveyRecord):string|undefined{
 const d=record.technicalData??{};
 if(record.surveyType==='Lendutan')return d.station||d.pointId||d.assetId;
 if(record.surveyType==='PCI')return d.sampleUnit||d.segmentId||d.assetId;
 if(record.surveyType==='RNI')return d.segmentId||(d.fromSta&&d.toSta?`${d.fromSta}-${d.toSta}`:undefined)||d.assetId;
 return d.segmentId||d.objectId||d.pointId||d.assetId;
}

function trafficUnits(record:DailySurveyRecord):AuditSampleUnit[]{
 if(record.trafficDurationMinutes<10)return [];
 const count=Math.floor(record.trafficDurationMinutes/10),base=record.time||'00:00',sourceReference=record.technicalData?.evidence;
 return Array.from({length:count},(_,index)=>{const key=`${record.date}:${base}+${index*10}-${(index+1)*10}m`;return {id:unitId(record,'time-window',key),sourceRecordId:record.id,surveyType:record.surveyType,road:record.road,unitType:'time-window',unitKey:key,date:record.date,sourceReference,reviewStatus:'Belum Diperiksa'};});
}

export function expandAuditUnits(record:DailySurveyRecord):AuditPopulation{
 if(record.state!=='Tercatat')return {units:[],issues:[]};
 if(record.surveyType==='Lalu Lintas'){
  const units=trafficUnits(record);return {units,issues:units.length?[]:[`${record.id}: durasi lalu lintas belum menyediakan unit 10 menit.`]};
 }
 const explicit=explicitUnits(record);const kind=defaultKind(record.surveyType),sourceReference=record.technicalData?.evidence;
 if(explicit?.length){
  const units=explicit.flatMap((item,index)=>{const key=safeKey(item.unitKey??item.key??item.id??'');if(!key)return [];
   const unitType=item.unitType??item.type??kind;return [{id:item.id?.trim()||unitId(record,unitType,key),sourceRecordId:record.id,surveyType:record.surveyType,road:record.road,unitType,unitKey:key,lengthKm:item.lengthKm,date:record.date,groupKey:item.groupKey??record.slopeFailureType,sourceReference:item.sourceReference??item.evidenceReference??sourceReference,reviewStatus:'Belum Diperiksa' as const}];});
  const ids=new Set<string>(),issues:string[]=[];for(const unit of units){if(ids.has(unit.id))issues.push(`${record.id}: ID unit ${unit.id} ganda.`);ids.add(unit.id);if(unit.lengthKm!==undefined&&(!Number.isFinite(unit.lengthKm)||unit.lengthKm<0))issues.push(`${unit.id}: panjang unit tidak valid.`);}
  return {units,issues};
 }
 // Also accept stable lists produced by a source adapter without forcing the daily UI to invent units.
 const d=record.technicalData??{};const listed=[['point',splitList(d.pointIds)],['segment',splitList(d.segmentIds)],['object',splitList(d.objectIds)]] as const;
 for(const [unitType,keys] of listed)if(keys.length){
  if(record.lengthKm>0&&keys.length>1)return {units:keys.map(key=>({id:unitId(record,unitType,key),sourceRecordId:record.id,surveyType:record.surveyType,road:record.road,unitType,unitKey:key,date:record.date,groupKey:record.slopeFailureType,sourceReference,reviewStatus:'Belum Diperiksa'})),issues:[`${record.id}: daftar unit tersedia tetapi panjang per unit belum tersedia; sampling berbasis panjang belum boleh diinferensikan.`]};
  return {units:keys.map(key=>({id:unitId(record,unitType,key),sourceRecordId:record.id,surveyType:record.surveyType,road:record.road,unitType,unitKey:key,lengthKm:keys.length===1&&record.lengthKm>0?record.lengthKm:undefined,date:record.date,groupKey:record.slopeFailureType,sourceReference,reviewStatus:'Belum Diperiksa'})),issues:[]};
 }
 const key=singleSourceKey(record);
 if(!key)return {units:[],issues:[`${record.id}: identitas titik/segmen/objek sampling belum tersedia.`]};
 return {units:[{id:unitId(record,kind,key),sourceRecordId:record.id,surveyType:record.surveyType,road:record.road,unitType:kind,unitKey:key,lengthKm:record.lengthKm>0?record.lengthKm:undefined,date:record.date,groupKey:record.slopeFailureType,sourceReference,reviewStatus:'Belum Diperiksa'}],issues:[]};
}

export function buildAuditPopulation(records:readonly DailySurveyRecord[],surveyTypes:readonly SurveyType[],routes:readonly string[]):AuditPopulation{
 const units:AuditSampleUnit[]=[],issues:string[]=[];
 for(const record of records){if(!surveyTypes.includes(record.surveyType)||!routes.includes(record.road)||record.state!=='Tercatat')continue;const expanded=expandAuditUnits(record);units.push(...expanded.units);issues.push(...expanded.issues);}
 const seen=new Set<string>();for(const unit of units)if(seen.has(unit.id))issues.push(`ID unit audit ganda: ${unit.id}.`);else seen.add(unit.id);
 return {units,issues};
}
