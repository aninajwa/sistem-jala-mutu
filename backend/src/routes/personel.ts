import { Router, type RequestHandler } from 'express';
import { ApiError, supabaseRequest } from '../services/supabase';
import { paketIdSchema } from '../schemas/paket';
import { personnelSchema, qualificationSchema } from '../schemas/personel';
const router = Router(); // Mounted under requireAuth in paket.ts.
function id(value: unknown) {
  const parsed = paketIdSchema.safeParse(value);
  if (!parsed.success) throw new ApiError(400, 'ID tidak valid');
  return parsed.data;
}
function page(value: unknown) {
  if (value === undefined) return 1;
  if (typeof value !== 'string' || !/^[1-9]\d*$/.test(value) || Number(value) > 1000000) throw new ApiError(400, 'page tidak valid');
  return Number(value);
}
export const providerOnly: RequestHandler = (_req,res,next) => {
  if (!res.locals.identity.roles.some(role => role.nama === 'penyedia_jasa')) throw new ApiError(403, 'Hanya Penyedia Jasa boleh mengurus personel');
  next();
};
async function visibleTeam(packageId: number, teamId: number, token: string) {
  const rows = await supabaseRequest<unknown[]>(`/rest/v1/tim_survei?select=tim_id&paket_id=eq.${packageId}&tim_id=eq.${teamId}&limit=1`,token);
  if (!rows.length) throw new ApiError(404, 'Tim tidak ditemukan atau tidak boleh diakses');
}
export async function visibleMember(packageId: number, teamId: number, personId: number, token: string) {
  await visibleTeam(packageId,teamId,token);
  const rows = await supabaseRequest<unknown[]>(`/rest/v1/anggota_tim?select=anggota_id&tim_id=eq.${teamId}&personel_id=eq.${personId}&limit=1`,token);
  if (!rows.length) throw new ApiError(404, 'Personel tidak ditemukan dalam tim atau tidak boleh diakses');
}
router.use((_req,res,next) => { res.setHeader('Cache-Control','private, no-store');next(); });
router.get('/paket/:id/tim/:timId/personel',async(req,res) => {
  const packageId=id(req.params.id), teamId=id(req.params.timId), currentPage=page(req.query.page), token=res.locals.identity.token;
  await visibleTeam(packageId,teamId,token);
  const data=await supabaseRequest(`/rest/v1/anggota_tim?select=anggota_id,tim_id,personel_id,peran,mulai,selesai,alasan_ganti,personel(personel_id,penyedia_id,nama,nik_internal,pendidikan,pengalaman_tahun)&tim_id=eq.${teamId}&order=anggota_id&limit=50&offset=${(currentPage-1)*50}`,token);
  res.json({data,page:currentPage,page_size:50});
});
router.post('/paket/:id/tim/:timId/personel',providerOnly,async(req,res) => {
  const packageId=id(req.params.id), teamId=id(req.params.timId), parsed=personnelSchema.safeParse(req.body);
  if (!parsed.success) {res.status(400).json({error:'Data personel tidak valid',details:parsed.error.flatten()});return;}
  const data=await supabaseRequest('/rest/v1/rpc/daftar_personel_tim',res.locals.identity.token,{method:'POST',body:JSON.stringify({p_paket_id:packageId,p_tim_id:teamId,p_data:parsed.data})});
  res.status(201).json({data});
});
router.get('/paket/:id/tim/:timId/personel/:personelId/kualifikasi',async(req,res) => {
  const packageId=id(req.params.id), teamId=id(req.params.timId), personId=id(req.params.personelId), currentPage=page(req.query.page), token=res.locals.identity.token;
  await visibleMember(packageId,teamId,personId,token);
  const data=await supabaseRequest(`/rest/v1/kualifikasi_personel?select=kualifikasi_id,personel_id,jenis,nomor,jenjang,berlaku_sd,dokumen_id,versi,updated_at&personel_id=eq.${personId}&order=kualifikasi_id.desc&limit=50&offset=${(currentPage-1)*50}`,token);
  res.json({data,page:currentPage,page_size:50,kelayakan_belum_dinilai:true});
});
router.post('/paket/:id/tim/:timId/personel/:personelId/kualifikasi',providerOnly,async(req,res) => {
  const packageId=id(req.params.id), teamId=id(req.params.timId), personId=id(req.params.personelId), parsed=qualificationSchema.safeParse(req.body);
  if (!parsed.success) {res.status(400).json({error:'Data kualifikasi tidak valid',details:parsed.error.flatten()});return;}
  const data=await supabaseRequest('/rest/v1/rpc/daftar_kualifikasi_personel',res.locals.identity.token,{method:'POST',body:JSON.stringify({p_paket_id:packageId,p_tim_id:teamId,p_personel_id:personId,p_data:parsed.data})});
  res.status(201).json({data});
});
export default router;
