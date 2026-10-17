import { Router, type RequestHandler } from 'express';
import { ApiError, supabaseRequest } from '../services/supabase';
import { upload, storeAndRegister, readPdfBytes, type StoredPdf } from '../services/pdf-storage';
import { paketIdSchema } from '../schemas/paket';
import { calibrationCreateSchema, calibrationPatchSchema, certificateUploadSchema } from '../schemas/kalibrasi';
const router=Router();
const BUCKET='dokumen-kalibrasi';
const columns='kalibrasi_id,paket_id,alat_id,jenis,standar,komponen,tgl_kalibrasi,berlaku_sd,pelaksana,dokumen_id,status,created_by,versi,updated_at,dokumen(dokumen_id,judul,versi_aktif)';
interface Calibration { kalibrasi_id:number; paket_id:number; dokumen_id:number|null; versi:number; status:string }
function id(value:unknown) { const r=paketIdSchema.safeParse(value);if(!r.success)throw new ApiError(400,'ID tidak valid');return r.data; }
async function visiblePackage(packageId:number,token:string) {
  const r=await supabaseRequest<unknown[]>(`/rest/v1/paket_kontrak?select=paket_id&paket_id=eq.${packageId}&limit=1`,token);
  if(!r.length)throw new ApiError(404,'Paket tidak ditemukan atau tidak boleh diakses');
}
async function calibration(packageId:number,calibrationId:number,token:string) {
  const rows=await supabaseRequest<Calibration[]>(`/rest/v1/kalibrasi_alat?select=${columns}&paket_id=eq.${packageId}&kalibrasi_id=eq.${calibrationId}&limit=1`,token);
  if(!rows.length)throw new ApiError(404,'Rekod kalibrasi tidak ditemukan atau tidak boleh diakses');
  return rows[0];
}
const providerOnly:RequestHandler=(_req,res,next)=>{if(!res.locals.identity.roles.some(r=>r.nama==='penyedia_jasa'))throw new ApiError(403,'Hanya Penyedia Jasa boleh mengisi kalibrasi');next();};
router.use((_req,res,next)=>{res.setHeader('Cache-Control','private, no-store');next();});
router.get('/paket/:id/kalibrasi-alat',async(req,res)=>{
  const packageId=id(req.params.id);const token=res.locals.identity.token;const raw=req.query.page??'1';
  if(typeof raw!=='string'||!/^[1-9]\d*$/.test(raw)||Number(raw)>1000000)throw new ApiError(400,'page tidak valid');
  const page=Number(raw);await visiblePackage(packageId,token);
  const data=await supabaseRequest(`/rest/v1/kalibrasi_alat?select=${columns}&paket_id=eq.${packageId}&order=kalibrasi_id.desc&limit=50&offset=${(page-1)*50}`,token);
  res.json({data,page,page_size:50});
});
router.get('/paket/:id/kalibrasi-alat/:kalibrasiId',async(req,res)=>{res.json({data:await calibration(id(req.params.id),id(req.params.kalibrasiId),res.locals.identity.token)});});
router.post('/paket/:id/kalibrasi-alat',providerOnly,async(req,res)=>{
  const packageId=id(req.params.id);const parsed=calibrationCreateSchema.safeParse(req.body);
  if(!parsed.success){res.status(400).json({error:'Data kalibrasi tidak valid',details:parsed.error.flatten()});return;}
  const data=await supabaseRequest('/rest/v1/rpc/simpan_kalibrasi_alat',res.locals.identity.token,{method:'POST',body:JSON.stringify({p_paket_id:packageId,p_kalibrasi_id:null,p_expected_version:null,p_data:parsed.data})});
  res.status(201).json({data});
});
router.patch('/paket/:id/kalibrasi-alat/:kalibrasiId',providerOnly,async(req,res)=>{
  const packageId=id(req.params.id);const calibrationId=id(req.params.kalibrasiId);const parsed=calibrationPatchSchema.safeParse(req.body);
  if(!parsed.success){res.status(400).json({error:'Perubahan kalibrasi tidak valid',details:parsed.error.flatten()});return;}
  const {expected_version,...patch}=parsed.data;
  const data=await supabaseRequest('/rest/v1/rpc/simpan_kalibrasi_alat',res.locals.identity.token,{method:'POST',body:JSON.stringify({p_paket_id:packageId,p_kalibrasi_id:calibrationId,p_expected_version:expected_version,p_data:patch})});
  res.json({data});
});
const uploadDraft:RequestHandler=async(req,res,next)=>{
  const k=await calibration(id(req.params.id),id(req.params.kalibrasiId),res.locals.identity.token);
  if(k.status!=='DRAFT')throw new ApiError(409,'Sijil hanya boleh diupload ketika kalibrasi DRAFT');
  res.locals.calibration=k;next();
};
router.post('/paket/:id/kalibrasi-alat/:kalibrasiId/sertifikat',providerOnly,uploadDraft,upload,async(req,res)=>{
  const parsed=certificateUploadSchema.safeParse(req.body);
  if(!parsed.success){res.status(400).json({error:'Versi kalibrasi tidak valid',details:parsed.error.flatten()});return;}
  const packageId=id(req.params.id);const calibrationId=id(req.params.kalibrasiId);const k=res.locals.calibration as Calibration;
  if(k.versi!==parsed.data.expected_version)throw new ApiError(409,'Rekod kalibrasi telah berubah. Baca semula');
  const data=await storeAndRegister(req,res.locals.identity.token,packageId,'/rest/v1/rpc/daftar_sertifikat_kalibrasi',{p_kalibrasi_id:calibrationId,p_expected_version:parsed.data.expected_version},BUCKET,`${packageId}/${calibrationId}`);
  res.status(201).json({data});
});
const download:RequestHandler=async(req,res)=>{
  const packageId=id(req.params.id);const calibrationId=id(req.params.kalibrasiId);const token=res.locals.identity.token;const k=await calibration(packageId,calibrationId,token);
  if(!k.dokumen_id)throw new ApiError(404,'Sijil belum diupload');
  const docs=await supabaseRequest<Array<{dokumen_id:number;versi_aktif:number}>>(`/rest/v1/dokumen?select=dokumen_id,versi_aktif&dokumen_id=eq.${k.dokumen_id}&paket_id=eq.${packageId}&sumber_tipe=eq.KALIBRASI&sumber_id=eq.${calibrationId}&status=eq.TERSEDIA&limit=1`,token);
  if(!docs[0])throw new ApiError(404,'Sijil tidak ditemukan atau tidak boleh diakses');
  const version=req.params.versi===undefined?docs[0].versi_aktif:id(req.params.versi);
  const versions=await supabaseRequest<StoredPdf[]>(`/rest/v1/dokumen_versi?select=bucket_id,object_path,nama_file,ukuran_byte,hash_file&dokumen_id=eq.${k.dokumen_id}&versi_ke=eq.${version}&limit=1`,token);
  const file=versions[0];if(!file||file.bucket_id!==BUCKET||!file.object_path.startsWith(`${packageId}/${calibrationId}/`))throw new ApiError(404,'Versi sijil tidak ditemukan');
  const bytes=await readPdfBytes(file,token);res.setHeader('X-Content-Type-Options','nosniff');res.attachment(file.nama_file.replace(/[\x00-\x1f\x7f/\\]/g,'_'));res.type('application/pdf').send(bytes);
};
router.get('/paket/:id/kalibrasi-alat/:kalibrasiId/sertifikat/download',download);
router.get('/paket/:id/kalibrasi-alat/:kalibrasiId/sertifikat/versi/:versi/download',download);
export default router;
