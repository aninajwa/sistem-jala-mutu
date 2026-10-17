import { Router, type RequestHandler } from 'express';
import { ApiError, supabaseRequest } from '../services/supabase';
import { paketIdSchema } from '../schemas/paket';
import { providerSchema, teamSchema, teamEquipmentSchema } from '../schemas/kalibrasi-asas';
const router = Router(); // Mounted under paket router's requireAuth.
function id(value: unknown) { const result = paketIdSchema.safeParse(value); if (!result.success) throw new ApiError(400, 'ID tidak valid'); return result.data; }
function page(value: unknown) { if (value === undefined) return 1; if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || Number(value)>1000000) throw new ApiError(400,'page tidak valid'); return Number(value); }
const providerOnly: RequestHandler = (_req,res,next) => {
  if (!res.locals.identity.roles.some(role=>role.nama==='penyedia_jasa')) throw new ApiError(403,'Hanya Penyedia Jasa boleh mengurus tim dan alat');
  next();
};
async function visiblePackage(packageId: number,token: string) {
  const rows=await supabaseRequest<unknown[]>(`/rest/v1/paket_kontrak?select=paket_id&paket_id=eq.${packageId}&limit=1`,token);
  if (!rows.length) throw new ApiError(404,'Paket tidak ditemukan atau tidak boleh diakses');
}
router.use((_req,res,next)=>{res.setHeader('Cache-Control','private, no-store');next();});
router.get('/jenis-survei',async (_req,res)=>{
  const data=await supabaseRequest('/rest/v1/jenis_survei?select=jenis_survei_id,kode,nama,aktif&aktif=eq.true&order=kode',res.locals.identity.token);
  res.json({data});
});
router.get('/penyedia',async (_req,res)=>{
  const data=await supabaseRequest('/rest/v1/penyedia_jasa?select=penyedia_id,nama&order=penyedia_id',res.locals.identity.token);
  res.json({data});
});
router.post('/penyedia',providerOnly,async(req,res)=>{
  const result=providerSchema.safeParse(req.body);
  if (!result.success) {res.status(400).json({error:'Data penyedia tidak valid',details:result.error.flatten()});return;}
  const data=await supabaseRequest('/rest/v1/rpc/daftar_penyedia_tunggal',res.locals.identity.token,{method:'POST',body:JSON.stringify({p_nama:result.data.nama})});
  res.status(201).json({data});
});
router.get('/paket/:id/tim',async(req,res)=>{
  const packageId=id(req.params.id);const currentPage=page(req.query.page);const token=res.locals.identity.token;
  await visiblePackage(packageId,token);
  const data=await supabaseRequest(`/rest/v1/tim_survei?select=tim_id,paket_id,jenis_survei_id,nama_tim,jenis_survei(kode,nama)&paket_id=eq.${packageId}&order=tim_id&limit=50&offset=${(currentPage-1)*50}`,token);
  res.json({data,page:currentPage,page_size:50});
});
router.post('/paket/:id/tim',providerOnly,async(req,res)=>{
  const packageId=id(req.params.id);const result=teamSchema.safeParse(req.body);
  if (!result.success) {res.status(400).json({error:'Data tim tidak valid',details:result.error.flatten()});return;}
  const d=result.data;
  const data=await supabaseRequest('/rest/v1/rpc/daftar_tim_survei',res.locals.identity.token,{method:'POST',body:JSON.stringify({p_paket_id:packageId,p_penyedia_id:d.penyedia_id,p_jenis_survei_id:d.jenis_survei_id,p_nama_tim:d.nama_tim})});
  res.status(201).json({data});
});
router.get('/paket/:id/tim/:timId/alat',async(req,res)=>{
  const packageId=id(req.params.id);const teamId=id(req.params.timId);const currentPage=page(req.query.page);const token=res.locals.identity.token;
  await visiblePackage(packageId,token);
  const teams=await supabaseRequest<unknown[]>(`/rest/v1/tim_survei?select=tim_id&paket_id=eq.${packageId}&tim_id=eq.${teamId}&limit=1`,token);
  if (!teams.length) throw new ApiError(404,'Tim tidak ditemukan atau tidak boleh diakses');
  const data=await supabaseRequest(`/rest/v1/penugasan_alat?select=penugasan_id,tim_id,alat_id,kendaraan,mulai,selesai,alat_survei(alat_id,penyedia_id,jenis_survei_id,nama_alat,merek_tipe,nomor_seri,kelas,tahun_perolehan,kondisi,milik_djbm)&tim_id=eq.${teamId}&order=penugasan_id&limit=50&offset=${(currentPage-1)*50}`,token);
  res.json({data,page:currentPage,page_size:50});
});
router.post('/paket/:id/tim/:timId/alat',providerOnly,async(req,res)=>{
  const packageId=id(req.params.id);const teamId=id(req.params.timId);const result=teamEquipmentSchema.safeParse(req.body);
  if (!result.success) {res.status(400).json({error:'Data alat/penugasan tidak valid',details:result.error.flatten()});return;}
  const data=await supabaseRequest('/rest/v1/rpc/daftar_alat_tim',res.locals.identity.token,{method:'POST',body:JSON.stringify({p_paket_id:packageId,p_tim_id:teamId,p_data:result.data})});
  res.status(201).json({data});
});
export default router;
