import { Router, type RequestHandler } from 'express';
import { ApiError, supabaseRequest } from '../services/supabase';
import { upload, storeAndRegister, readPdfBytes, type StoredPdf } from '../services/pdf-storage';
import { paketIdSchema } from '../schemas/paket';
import { qualificationEvidenceUploadSchema } from '../schemas/personel';
import { visibleMember, providerOnly } from './personel';
const router = Router();
const BUCKET = 'dokumen-kualifikasi';
const ROOT = '/paket/:id/tim/:timId/personel/:personelId/kualifikasi/:kualifikasiId/bukti';
const columns = 'kualifikasi_id,personel_id,jenis,nomor,jenjang,berlaku_sd,dokumen_id,versi,updated_at';
const versionColumns = 'dok_versi_id,versi_ke,nama_file,mime_type,ukuran_byte,hash_file,dibuat_pada';
interface Qualification { kualifikasi_id: number; personel_id: number; dokumen_id: number | null; versi: number }
interface EvidenceDocument { dokumen_id: number; judul: string; paket_id: number; versi_aktif: number }
function id(value: unknown) { const r = paketIdSchema.safeParse(value);if (!r.success) throw new ApiError(400,'ID tidak valid');return r.data; }
async function context(params: Record<string,unknown>, token: string) {
  const packageId=id(params.id), teamId=id(params.timId), personId=id(params.personelId), qualificationId=id(params.kualifikasiId);
  await visibleMember(packageId,teamId,personId,token);
  const rows=await supabaseRequest<Qualification[]>(`/rest/v1/kualifikasi_personel?select=${columns}&personel_id=eq.${personId}&kualifikasi_id=eq.${qualificationId}&limit=1`,token);
  if (!rows[0]) throw new ApiError(404,'Kualifikasi tidak ditemukan atau tidak boleh diakses');
  return { packageId,teamId,personId,qualificationId,qualification: rows[0] };
}
async function evidence(q: Qualification, token: string) {
  if (!q.dokumen_id) return null;
  const rows=await supabaseRequest<EvidenceDocument[]>(`/rest/v1/dokumen?select=dokumen_id,judul,paket_id,versi_aktif&dokumen_id=eq.${q.dokumen_id}&sumber_tipe=eq.KUALIFIKASI&sumber_id=eq.${q.kualifikasi_id}&status=eq.TERSEDIA&limit=1`,token);
  if (!rows[0]) throw new ApiError(404,'Bukti tidak ditemukan atau tidak boleh diakses');
  return rows[0];
}
router.use((_req,res,next) => {res.setHeader('Cache-Control','private, no-store');next();});
router.get(ROOT,async(req,res) => {
  const token=res.locals.identity.token, c=await context(req.params,token), raw=req.query.page??'1';
  if (typeof raw!=='string' || !/^[1-9]\d*$/.test(raw) || Number(raw)>1000000) throw new ApiError(400,'page tidak valid');
  const page=Number(raw), d=await evidence(c.qualification,token);
  if (!d) {res.json({data:{kualifikasi:c.qualification,dokumen:null,versi_aktif:null,riwayat_versi:[],pagination:{page,page_size:50,has_next:false},kelayakan_belum_dinilai:true}});return;}
  const [history,active]=await Promise.all([
    supabaseRequest<Array<{versi_ke:number}>>(`/rest/v1/dokumen_versi?select=${versionColumns}&dokumen_id=eq.${d.dokumen_id}&order=versi_ke.desc&limit=51&offset=${(page-1)*50}`,token),
    supabaseRequest<unknown[]>(`/rest/v1/dokumen_versi?select=${versionColumns}&dokumen_id=eq.${d.dokumen_id}&versi_ke=eq.${d.versi_aktif}&limit=1`,token),
  ]);
  if (!active[0]) throw new ApiError(404,'Versi bukti aktif tidak ditemukan');
  res.json({data:{kualifikasi:c.qualification,dokumen:d,versi_aktif:active[0],riwayat_versi:history.slice(0,50),pagination:{page,page_size:50,has_next:history.length>50},kelayakan_belum_dinilai:true}});
});
const loadContext: RequestHandler = async(req,res,next) => {res.locals.qualificationContext=await context(req.params,res.locals.identity.token);next();};
router.post(ROOT,providerOnly,loadContext,upload,async(req,res) => {
  const parsed=qualificationEvidenceUploadSchema.safeParse(req.body);
  if (!parsed.success) {res.status(400).json({error:'Versi kualifikasi tidak valid',details:parsed.error.flatten()});return;}
  const c=res.locals.qualificationContext as Awaited<ReturnType<typeof context>>;
  if (c.qualification.versi!==parsed.data.expected_version) throw new ApiError(409,'Rekod kualifikasi telah berubah. Baca semula');
  const data=await storeAndRegister(req,res.locals.identity.token,c.packageId,'/rest/v1/rpc/daftar_bukti_kualifikasi',{p_tim_id:c.teamId,p_personel_id:c.personId,p_kualifikasi_id:c.qualificationId,p_expected_version:parsed.data.expected_version},BUCKET,`${c.personId}/${c.qualificationId}`);
  res.status(201).json({data});
});
const download: RequestHandler = async(req,res) => {
  const token=res.locals.identity.token, c=await context(req.params,token), d=await evidence(c.qualification,token);
  if (!d) throw new ApiError(404,'Bukti belum diupload');
  const version=req.params.versi===undefined ? d.versi_aktif : id(req.params.versi);
  const rows=await supabaseRequest<StoredPdf[]>(`/rest/v1/dokumen_versi?select=bucket_id,object_path,nama_file,ukuran_byte,hash_file&dokumen_id=eq.${d.dokumen_id}&versi_ke=eq.${version}&limit=1`,token);
  const file=rows[0];
  if (!file || file.bucket_id!==BUCKET || !file.object_path.startsWith(`${c.personId}/${c.qualificationId}/`)) throw new ApiError(404,'Versi bukti tidak ditemukan');
  const bytes=await readPdfBytes(file,token);
  res.setHeader('X-Content-Type-Options','nosniff');res.attachment(file.nama_file.replace(/[\x00-\x1f\x7f/\\]/g,'_'));res.type('application/pdf').send(bytes);
};
router.get(ROOT+'/download',download);
router.get(ROOT+'/versi/:versi/download',download);
export default router;
