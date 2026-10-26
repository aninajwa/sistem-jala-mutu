import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import http from 'node:http';
import { createHash } from 'node:crypto';
import { spawn } from 'node:child_process';
import { setTimeout as delay } from 'node:timers/promises';
let mock, child, base, lastRpc;
const roleQueries = [];
const storageFiles = new Map();
let registeredDocument;
let cleanupCalls = 0;
let organisation = null;
const personnelRows = [];
const membershipRows = [];
const qualificationRows = [];
const calibrationRows = [];
let calibrationCertificate = null;
let qualificationEvidence = null;
const teamRows = [];
const equipmentRows = [];
const assignmentRows = [];
let preparationState = { paket_id: 3, pengisian_id: 2, status: 'DRAFT', versi: 3, pengajuan: null, review: null, aturan: { mode: 'SEMAKAN_MANUAL_PIC', validasi_kelengkapan_resmi_aktif: false } };
const profile = { pengguna_id: 3, auth_user_id: 'provider-id', username: 'penyedia.jasa', email: 'provider@example.test', terkunci: false };
async function request(path, token, body, method) {
  const r = await fetch(base + path, { method: method ?? (body === undefined ? 'GET' : 'POST'), headers: { ...(token ? { Authorization: `Bearer ${token}` } : {}), 'Content-Type': 'application/json' }, ...(body === undefined ? {} : { body: JSON.stringify(body) }) });
  return { status: r.status, body: await r.json() };
}
before(async () => {
  mock = http.createServer(async (req, res) => {
    const token = req.headers.authorization?.slice(7);
    assert.equal(req.headers.apikey, 'test-publishable-key');
    res.setHeader('Content-Type', 'application/json');
    const url = new URL(req.url, 'http://localhost');
    const send = (data, code = 200) => { res.statusCode = code; res.end(JSON.stringify(data)); };
    if (url.pathname === '/auth/v1/user') return token === 'expired' ? send({ error: 'expired' }, 401) : send({ id: token?.includes('reviewer') ? 'reviewer-id' : 'provider-id' });
    if (url.pathname === '/rest/v1/pengguna') return send(token === 'unlinked' ? [] : [{ ...profile, auth_user_id: token?.includes('reviewer') ? 'reviewer-id' : 'provider-id', terkunci: token === 'locked' }]);
    if (url.pathname === '/rest/v1/pengguna_peran') {
      roleQueries.push(url.search);
      return send([{ peran_id: token?.includes('reviewer') ? 1 : 3, scope_balai_id: null, scope_paket_id: null }]);
    }
    if (url.pathname === '/rest/v1/peran') {
      roleQueries.push(url.search);
      // The real catalog is readable by every authenticated user.
      return send([{ peran_id: 1, nama: 'pic_balai' }, { peran_id: 2, nama: 'admin' }, { peran_id: 3, nama: 'penyedia_jasa' }, { peran_id: 4, nama: 'direktorat' }]);
    }
    if (url.pathname === '/rest/v1/balai') return send([{ balai_id: 1, nama: 'Balai Ujian', aktif: true }]);
    if (url.pathname === '/rest/v1/anggota_tim') {
      if(token==='foreign-reviewer')return send([]);
      const rows=membershipRows.filter(a=>url.searchParams.get('tim_id')===`eq.${a.tim_id}` && (!url.searchParams.has('personel_id')||url.searchParams.get('personel_id')===`eq.${a.personel_id}`));
      const offset=Number(url.searchParams.get('offset')??0);
      return send(rows.slice(offset,offset+50).map(a=>({...a,personel:personnelRows.find(p=>p.personel_id===a.personel_id)})));
    }
    if (url.pathname === '/rest/v1/kualifikasi_personel') {
      if(token==='foreign-reviewer')return send([]);
      const offset=Number(url.searchParams.get('offset')??0);
      return send(qualificationRows.filter(q=>url.searchParams.get('personel_id')===`eq.${q.personel_id}` && (!url.searchParams.has('kualifikasi_id')||url.searchParams.get('kualifikasi_id')===`eq.${q.kualifikasi_id}`)).slice().reverse().slice(offset,offset+50));
    }
    if (['/rest/v1/rpc/daftar_personel_tim','/rest/v1/rpc/daftar_kualifikasi_personel'].includes(url.pathname)) {
      let raw='';for await(const chunk of req)raw+=chunk;lastRpc=JSON.parse(raw);
      if(lastRpc.p_paket_id===999)return send({code:'P0002'},404);
      if(lastRpc.p_paket_id!==3 || preparationState.status!=='DISETUJUI')return send({code:'55000',message:'Persiapan perlu disetujui'},400);
      if(!teamRows.some(t=>t.tim_id===lastRpc.p_tim_id&&t.paket_id===lastRpc.p_paket_id))return send({code:'P0002'},404);
      const d=lastRpc.p_data;
      if(url.pathname.endsWith('/daftar_personel_tim')) {
        let person;
        if(d.personel_id){person=personnelRows.find(p=>p.personel_id===d.personel_id);if(!person)return send({code:'22023'},400);}
        else {
          if(d.nik_internal && personnelRows.some(p=>p.nik_internal?.toLowerCase()===d.nik_internal.toLowerCase()))return send({code:'23505'},409);
          person={personel_id:91+personnelRows.length,penyedia_id:8,nama:d.nama,nik_internal:d.nik_internal??null,pendidikan:d.pendidikan??null,pengalaman_tahun:d.pengalaman_tahun??null};
        }
        if(membershipRows.some(a=>a.tim_id===lastRpc.p_tim_id&&a.personel_id===person.personel_id&&a.mulai===(d.mulai??null)&&a.selesai===(d.selesai??null)))return send({code:'23505'},409);
        if(!d.personel_id)personnelRows.push(person);
        const member={anggota_id:101+membershipRows.length,tim_id:lastRpc.p_tim_id,personel_id:person.personel_id,peran:d.peran,mulai:d.mulai??null,selesai:d.selesai??null,alasan_ganti:null};membershipRows.push(member);
        return send({personel:person,anggota:member,kelayakan_belum_dinilai:true});
      }
      if(!membershipRows.some(a=>a.tim_id===lastRpc.p_tim_id&&a.personel_id===lastRpc.p_personel_id))return send({code:'P0002'},404);
      if(qualificationRows.some(q=>q.personel_id===lastRpc.p_personel_id&&q.jenis===d.jenis&&q.nomor.toLowerCase()===d.nomor.toLowerCase()))return send({code:'23505'},409);
      const q={kualifikasi_id:111+qualificationRows.length,personel_id:lastRpc.p_personel_id,jenis:d.jenis,nomor:d.nomor,jenjang:d.jenjang??null,berlaku_sd:d.berlaku_sd??null,dokumen_id:null,versi:1};qualificationRows.push(q);
      return send({kualifikasi:q,kelayakan_belum_dinilai:true});
    }
    if(url.pathname === '/rest/v1/kalibrasi_alat') {
      if(token==='foreign-reviewer')return send([]);
      return send(calibrationRows.filter(k=>url.searchParams.get('paket_id')===`eq.${k.paket_id}` && (!url.searchParams.has('kalibrasi_id')||url.searchParams.get('kalibrasi_id')===`eq.${k.kalibrasi_id}`)).map(k=>({...k,dokumen:k.dokumen_id ? {dokumen_id:k.dokumen_id,versi_aktif:calibrationCertificate.versi_aktif}:null})));
    }
    if(url.pathname==='/rest/v1/dokumen' && url.searchParams.get('sumber_tipe')==='eq.KUALIFIKASI') {
      if(!qualificationEvidence || token==='bad-evidence-link' || url.searchParams.get('dokumen_id')!==`eq.${qualificationEvidence.dokumen_id}` || url.searchParams.get('sumber_id')!==`eq.${qualificationEvidence.sumber_id}`)return send([]);
      return send([qualificationEvidence]);
    }
    if(url.pathname.startsWith('/storage/v1/object/authenticated/dokumen-kualifikasi/')) {
      const path=decodeURIComponent(url.pathname.split('/dokumen-kualifikasi/')[1]);const bytes=storageFiles.get(path);if(!bytes)return send({message:'Object not found'},404);
      res.setHeader('Content-Type','application/pdf');return res.end(bytes);
    }
    if(url.pathname==='/storage/v1/object/dokumen-kualifikasi' && req.method==='DELETE') {
      let raw='';for await(const c of req)raw+=c;cleanupCalls++;for(const path of JSON.parse(raw).prefixes)storageFiles.delete(path);return send([]);
    }
    if(url.pathname.startsWith('/storage/v1/object/dokumen-kualifikasi/') && req.method==='POST') {
      if(token==='no-qualification-bucket')return send({message:'Bucket not found'},404);
      const chunks=[];for await(const c of req)chunks.push(c);const path=decodeURIComponent(url.pathname.split('/dokumen-kualifikasi/')[1]);
      assert.match(path,/^91\/111\/[0-9a-f-]{36}\.pdf$/);assert.equal(req.headers['x-upsert'],'false');storageFiles.set(path,Buffer.concat(chunks));return send({Key:path});
    }
    if(url.pathname==='/rest/v1/rpc/daftar_bukti_kualifikasi') {
      let raw='';for await(const c of req)raw+=c;lastRpc=JSON.parse(raw);
      assert.equal(lastRpc.p_personel_id,91);assert.equal(lastRpc.p_kualifikasi_id,111);assert.equal(lastRpc.p_tim_id,21);assert.equal(lastRpc.p_paket_id,3);
      if(token==='race-qualification')return send({code:'55000',message:'Rekod kualifikasi telah berubah. Baca semula'},409);
      if(token==='closed-qualification')return send({code:'55000',message:'Status paket belum disokong'},409);
      if(lastRpc.p_nama_file==='reject.pdf')return send({code:'22023',message:'Metadata rejected'},400);
      if(lastRpc.p_nama_file==='uncertain.pdf')return send({error:'Unknown upstream failure'},500);
      const q=qualificationRows.find(q=>q.kualifikasi_id===lastRpc.p_kualifikasi_id);
      if(q.versi!==lastRpc.p_expected_version)return send({code:'55000',message:'Rekod kualifikasi telah berubah. Baca semula'},409);
      const bytes=storageFiles.get(lastRpc.p_object_path);assert.equal(lastRpc.p_sha256,createHash('sha256').update(bytes).digest('hex'));assert.equal(lastRpc.p_ukuran,bytes.length);
      const v={dok_versi_id:301+(qualificationEvidence?.dokumen_versi.length??0),bucket_id:'dokumen-kualifikasi',object_path:lastRpc.p_object_path,nama_file:lastRpc.p_nama_file,hash_file:lastRpc.p_sha256,ukuran_byte:bytes.length,mime_type:'application/pdf',versi_ke:qualificationEvidence?qualificationEvidence.versi_aktif+1:1};
      qualificationEvidence={dokumen_id:88,paket_id:3,sumber_tipe:'KUALIFIKASI',sumber_id:q.kualifikasi_id,versi_aktif:v.versi_ke,dokumen_versi:[...(qualificationEvidence?.dokumen_versi??[]),v]};q.dokumen_id=88;q.versi++;
      return send({kualifikasi:q,dokumen:qualificationEvidence,versi:v,kelayakan_belum_dinilai:true});
    }
    if(url.pathname==='/rest/v1/dokumen_versi') {
      const document=qualificationEvidence && url.searchParams.get('dokumen_id')===`eq.${qualificationEvidence.dokumen_id}` ? qualificationEvidence : calibrationCertificate;
      const versions=document?.dokumen_versi.filter(v=>url.searchParams.get('dokumen_id')===`eq.${document.dokumen_id}`&&(!url.searchParams.has('versi_ke')||url.searchParams.get('versi_ke')===`eq.${v.versi_ke}`)).slice().reverse()??[];
      const offset=Number(url.searchParams.get('offset')??0),limit=Number(url.searchParams.get('limit')??50);
      const projected=versions.slice(offset,offset+limit).map(v=>{
        let row={...v};
        if(token==='bad-cert-hash'||token==='bad-evidence-hash')row.hash_file='bad';
        if(token==='bad-evidence-bucket')row.bucket_id='dokumen-persiapan';
        if(token==='bad-evidence-path')row.object_path='999/999/foreign.pdf';
        if(!url.searchParams.get('select').includes('object_path')){delete row.object_path;delete row.bucket_id;}
        return row;
      });return send(projected);
    }
    if(url.pathname==='/rest/v1/rpc/simpan_kalibrasi_alat') {
      let raw='';for await(const c of req)raw+=c;lastRpc=JSON.parse(raw);
      if(lastRpc.p_paket_id===999)return send({code:'P0002'},404);
      if(lastRpc.p_paket_id!==3)return send({code:'55000',message:'Persiapan perlu disetujui'},400);
      if(lastRpc.p_kalibrasi_id===null) {
        if(lastRpc.p_data.alat_id!==7)return send({code:'22023',message:'Alat belum ditugaskan'},400);
        const k={...lastRpc.p_data,kalibrasi_id:17+calibrationRows.length,paket_id:3,dokumen_id:null,versi:1,status:'DRAFT',created_by:3};calibrationRows.push(k);return send(k);
      }
      const k=calibrationRows.find(k=>k.kalibrasi_id===lastRpc.p_kalibrasi_id);if(!k)return send({code:'P0002'},404);
      if(k.versi!==lastRpc.p_expected_version)return send({code:'55000',message:'Rekod kalibrasi telah berubah. Baca semula'},409);
      const next={...k,...lastRpc.p_data};
      if(next.berlaku_sd && next.berlaku_sd<next.tgl_kalibrasi)return send({code:'22023',message:'Tarikh tamat tidak boleh lebih awal'},400);
      if(Object.keys(lastRpc.p_data).some(key=>k[key]!==lastRpc.p_data[key])){Object.assign(k,lastRpc.p_data);k.versi++;}return send(k);
    }
    if(url.pathname.startsWith('/storage/v1/object/authenticated/dokumen-kalibrasi/')) {
      const path=decodeURIComponent(url.pathname.split('/dokumen-kalibrasi/')[1]);const bytes=storageFiles.get(path);if(!bytes)return send({message:'Object not found'},404);
      res.setHeader('Content-Type','application/pdf');return res.end(bytes);
    }
    if(url.pathname==='/storage/v1/object/dokumen-kalibrasi' && req.method==='DELETE') {
      let raw='';for await(const c of req)raw+=c;cleanupCalls++;for(const path of JSON.parse(raw).prefixes)storageFiles.delete(path);return send([]);
    }
    if(url.pathname.startsWith('/storage/v1/object/dokumen-kalibrasi/') && req.method==='POST') {
      if(token==='no-calibration-bucket')return send({message:'Bucket not found'},404);
      const chunks=[];for await(const c of req)chunks.push(c);const path=decodeURIComponent(url.pathname.split('/dokumen-kalibrasi/')[1]);
      assert.match(path,/^3\/17\/[0-9a-f-]{36}\.pdf$/);assert.equal(req.headers['x-upsert'],'false');storageFiles.set(path,Buffer.concat(chunks));return send({Key:path});
    }
    if(url.pathname==='/rest/v1/rpc/daftar_sertifikat_kalibrasi') {
      let raw='';for await(const c of req)raw+=c;lastRpc=JSON.parse(raw);
      if(token==='race-calibration')return send({code:'55000',message:'Rekod kalibrasi telah berubah. Baca semula'},409);
      if(lastRpc.p_nama_file==='reject.pdf')return send({code:'22023',message:'Metadata rejected'},400);
      if(lastRpc.p_nama_file==='uncertain.pdf')return send({error:'Unknown upstream failure'},500);
      const k=calibrationRows.find(k=>k.kalibrasi_id===lastRpc.p_kalibrasi_id);
      if(k.versi!==lastRpc.p_expected_version)return send({code:'55000',message:'Rekod kalibrasi telah berubah. Baca semula'},409);
      const bytes=storageFiles.get(lastRpc.p_object_path);assert.equal(lastRpc.p_sha256,createHash('sha256').update(bytes).digest('hex'));assert.equal(lastRpc.p_ukuran,bytes.length);
      const v={bucket_id:'dokumen-kalibrasi',object_path:lastRpc.p_object_path,nama_file:lastRpc.p_nama_file,hash_file:lastRpc.p_sha256,ukuran_byte:bytes.length,versi_ke:calibrationCertificate?calibrationCertificate.versi_aktif+1:1};
      calibrationCertificate={dokumen_id:77,paket_id:3,sumber_tipe:'KALIBRASI',sumber_id:k.kalibrasi_id,versi_aktif:v.versi_ke,dokumen_versi:[...(calibrationCertificate?.dokumen_versi??[]),v]};k.dokumen_id=77;k.versi++;
      return send({kalibrasi:k,dokumen:calibrationCertificate,versi:v});
    }
    if (url.pathname === '/rest/v1/jenis_survei') return send(['IRI','PCI','LENDUTAN','JEMBATAN','LERENG','DRAINASE','LALU_LINTAS','RNI'].map((kode,i)=>({jenis_survei_id:i+1,kode,nama:kode,aktif:true})));
    if (url.pathname === '/rest/v1/penyedia_jasa') return send(organisation && token !== 'foreign-reviewer' ? [organisation] : []);
    if (url.pathname === '/rest/v1/tim_survei') {
      return send(token === 'foreign-reviewer' ? [] : teamRows.filter(t=>url.searchParams.get('paket_id') === `eq.${t.paket_id}` && (!url.searchParams.has('tim_id') || url.searchParams.get('tim_id') === `eq.${t.tim_id}`)));
    }
    if (url.pathname === '/rest/v1/penugasan_alat') return send(assignmentRows.filter(a=>url.searchParams.get('tim_id') === `eq.${a.tim_id}`).map(a=>({...a,alat_survei:equipmentRows.find(e=>e.alat_id===a.alat_id)})));
    if (['/rest/v1/rpc/daftar_penyedia_tunggal','/rest/v1/rpc/daftar_tim_survei','/rest/v1/rpc/daftar_alat_tim'].includes(url.pathname)) {
      let raw='';for await(const chunk of req) raw+=chunk;lastRpc=JSON.parse(raw);
      if (url.pathname.endsWith('/daftar_penyedia_tunggal')) {
        if (organisation) return send({code:'23505'},409);
        organisation={penyedia_id:8,nama:lastRpc.p_nama};return send(organisation);
      }
      if(lastRpc.p_paket_id===999) return send({code:'P0002'},404);
      if(lastRpc.p_paket_id!==3 || preparationState.status!=='DISETUJUI') return send({code:'55000',message:'Persiapan perlu disetujui'},400);
      if(url.pathname.endsWith('/daftar_tim_survei')) {
        if(lastRpc.p_penyedia_id!==8 || ![1,2].includes(lastRpc.p_jenis_survei_id)) return send({code:'22023'},400);
        if(teamRows.some(t=>t.nama_tim.toLowerCase()===lastRpc.p_nama_tim.toLowerCase() && t.jenis_survei_id===lastRpc.p_jenis_survei_id)) return send({code:'23505'},409);
        const t={tim_id:21+teamRows.length,paket_id:3,jenis_survei_id:lastRpc.p_jenis_survei_id,nama_tim:lastRpc.p_nama_tim};teamRows.push(t);return send(t);
      }
      const team=teamRows.find(t=>t.tim_id===lastRpc.p_tim_id && t.paket_id===lastRpc.p_paket_id);
      if(!team) return send({code:'P0002'},404);
      const d=lastRpc.p_data;let e;
      if(d.alat_id) { e=equipmentRows.find(e=>e.alat_id===d.alat_id && e.jenis_survei_id===team.jenis_survei_id);if(!e)return send({code:'22023'},400); }
      else {
        if(equipmentRows.some(e=>e.nomor_seri===d.nomor_seri))return send({code:'23505'},409);
        e={alat_id:7+equipmentRows.length,penyedia_id:8,jenis_survei_id:team.jenis_survei_id,nama_alat:d.nama_alat,nomor_seri:d.nomor_seri,kondisi:d.kondisi,milik_djbm:d.milik_djbm};equipmentRows.push(e);
      }
      if(assignmentRows.some(a=>a.tim_id===team.tim_id && a.alat_id===e.alat_id && a.mulai===(d.mulai??null) && a.selesai===(d.selesai??null))) return send({code:'23505'},409);
      const a={penugasan_id:31+assignmentRows.length,tim_id:team.tim_id,alat_id:e.alat_id,kendaraan:d.kendaraan??null,mulai:d.mulai??null,selesai:d.selesai??null};assignmentRows.push(a);
      return send({alat:e,penugasan:a,kalibrasi_belum_dinilai:true});
    }

    if (url.pathname === '/rest/v1/rpc/baca_pengajuan_persiapan' || url.pathname === '/rest/v1/rpc/ajukan_persiapan' || url.pathname === '/rest/v1/rpc/review_persiapan') {
      let raw = ''; for await (const chunk of req) raw += chunk; lastRpc = JSON.parse(raw);
      if (lastRpc.p_paket_id !== 3) return send({ code: 'P0002' }, 404);
      const isRead = url.pathname.endsWith('/baca_pengajuan_persiapan');
      if (token === 'foreign-reviewer') return send({ code: isRead ? 'P0002' : '42501' }, isRead ? 404 : 403);
      if (isRead) return send(preparationState);
      if (lastRpc.p_expected_version !== preparationState.versi) return send({ code: '40001' }, 409);
      if (url.pathname.endsWith('/ajukan_persiapan')) {
        if (!['DRAFT','PERLU_REVISI'].includes(preparationState.status)) return send({ code: '55000', message: 'Persiapan dikunci' }, 400);
        const snapshot = { laporan_dokumen_id: 51, laporan_dok_versi_id: registeredDocument.dokumen_versi.find(v => v.versi_ke === registeredDocument.versi_aktif).versi_ke, dokumen: structuredClone(registeredDocument.dokumen_versi), versi_saat_dikirim: preparationState.versi+1 };
        preparationState = { ...preparationState, status: 'DIAJUKAN', versi: preparationState.versi+1, pengajuan: { pengajuan_id: preparationState.versi, snapshot }, review: null };
      } else {
        if (preparationState.status !== 'DIAJUKAN') return send({ code: '55000', message: 'Persiapan sudah diputuskan' }, 400);
        preparationState = { ...preparationState, status: lastRpc.p_keputusan, versi: preparationState.versi+1, review: { keputusan: lastRpc.p_keputusan, catatan: lastRpc.p_catatan, dokumen_id: 51, dok_versi_id: preparationState.pengajuan.snapshot.laporan_dok_versi_id } };
      }
      return send(preparationState);
    }
    if (['DIAJUKAN','DISETUJUI'].includes(preparationState.status) && ['/rest/v1/rpc/ubah_paket_draft','/rest/v1/rpc/simpan_checklist_persiapan','/rest/v1/rpc/tautkan_bukti_persiapan','/rest/v1/rpc/daftar_dokumen_persiapan','/rest/v1/rpc/tambah_versi_dokumen_persiapan'].includes(url.pathname)) {
      for await (const chunk of req) {} return send({ code: '55000', message: 'Persiapan dikunci' }, 400);
    }

    if (url.pathname === '/rest/v1/paket_kontrak') {
      const filter = url.searchParams.get('paket_id');
      if (!filter) return send([]);
      return send(filter === 'eq.3' && token !== 'foreign-reviewer' ? [{ paket_id: 3, nama_paket: 'Paket Ujian', status: 'DRAFT', nama_ppk: null, tgl_spmk: null }] : []);
    }
    if (url.pathname === '/rest/v1/jenis_dokumen') return send([{ jenis_dokumen_id: 1, kode: 'LAPORAN_PENDAHULUAN', nama: 'Laporan Pendahuluan' }]);
    if (url.pathname === '/rest/v1/dokumen') {
      if(url.searchParams.get('sumber_tipe')==='eq.KALIBRASI') return send(calibrationCertificate ? [calibrationCertificate] : []);
      const id = url.searchParams.get('dokumen_id');
      if (id === 'eq.998') return send([]);
      if (id === 'eq.999' && registeredDocument) return send([{ ...registeredDocument, dokumen_versi: [{ ...registeredDocument.dokumen_versi[0], hash_file: 'bad' }] }]);
      return send(registeredDocument ? [registeredDocument] : []);
    }
    if (url.pathname.startsWith('/storage/v1/object/authenticated/dokumen-persiapan/')) {
      const path = decodeURIComponent(url.pathname.split('/dokumen-persiapan/')[1]);
      const data = storageFiles.get(path);
      if (!data) return send({ message: 'Object not found' }, 404);
      res.setHeader('Content-Type', 'application/pdf'); return res.end(data);
    }
    if (url.pathname === '/storage/v1/object/dokumen-persiapan' && req.method === 'DELETE') {
      let raw = ''; for await (const chunk of req) raw += chunk;
      cleanupCalls++; for (const path of JSON.parse(raw).prefixes) storageFiles.delete(path);
      return send([]);
    }
    if (url.pathname.startsWith('/storage/v1/object/dokumen-persiapan/') && req.method === 'POST') {
      if (token === 'no-bucket') return send({ message: 'Bucket not found' }, 404);
      assert.equal(req.headers['content-type'], 'application/pdf');
      assert.equal(req.headers['x-upsert'], 'false');
      const chunks = []; for await (const chunk of req) chunks.push(chunk);
      const path = decodeURIComponent(url.pathname.split('/dokumen-persiapan/')[1]);
      storageFiles.set(path, Buffer.concat(chunks)); return send({ Key: path });
    }
    if (url.pathname === '/rest/v1/rpc/baca_detail_dokumen_persiapan') {
      let raw = ''; for await (const chunk of req) raw += chunk; lastRpc = JSON.parse(raw);
      if (lastRpc.p_paket_id !== 3 || lastRpc.p_dokumen_id !== 51 || token === 'foreign-reviewer') return send({ code: 'P0002' }, 404);
      const history = [...registeredDocument.dokumen_versi].sort((a,b) => b.versi_ke-a.versi_ke).map(v => ({ ...v, aktif: v.versi_ke === registeredDocument.versi_aktif }));
      return send({ dokumen: { dokumen_id: 51, paket_id: 3, versi_aktif: registeredDocument.versi_aktif }, versi_aktif: history.find(v => v.aktif), riwayat_versi: history.slice((lastRpc.p_page-1)*50,lastRpc.p_page*50), pagination: { page: lastRpc.p_page, page_size: 50, total: history.length, total_pages: 1, has_next: false } });
    }
    if (url.pathname === '/rest/v1/rpc/tambah_versi_dokumen_persiapan') {
      let raw = ''; for await (const chunk of req) raw += chunk; lastRpc = JSON.parse(raw);
      if (token === 'reject-version') return send({ code: '22023' }, 400);
      if (token === 'uncertain-version') return send({ error: 'Unknown upstream failure' }, 500);
      if (token === 'submitted-version') return send({ code: '55000', message: 'Bukti checklist bukan DRAFT tidak boleh diganti' }, 400);
      if (token === 'racing-version' || lastRpc.p_expected_version !== registeredDocument.versi_aktif) return send({ code: '40001' }, 409);
      assert.equal(lastRpc.p_dokumen_id, registeredDocument.dokumen_id);
      assert.equal('p_jenis' in lastRpc, false);
      assert.equal('p_judul' in lastRpc, false);
      const bytes = storageFiles.get(lastRpc.p_object_path);
      assert.equal(lastRpc.p_ukuran, bytes.length);
      assert.equal(lastRpc.p_sha256, createHash('sha256').update(bytes).digest('hex'));
      const version = { bucket_id: 'dokumen-persiapan', object_path: lastRpc.p_object_path, nama_file: lastRpc.p_nama_file, ukuran_byte: bytes.length, hash_file: lastRpc.p_sha256, versi_ke: lastRpc.p_expected_version + 1 };
      registeredDocument = { ...registeredDocument, versi_aktif: version.versi_ke, dokumen_versi: [...registeredDocument.dokumen_versi, version] };
      return send({ dokumen: registeredDocument, versi: version, checklist_dikemas_kini: [{ pengisian_id: 2, versi: 3 }] });
    }
    if (url.pathname === '/rest/v1/rpc/daftar_dokumen_persiapan') {
      let raw = ''; for await (const chunk of req) raw += chunk; lastRpc = JSON.parse(raw);
      if (lastRpc.p_judul === 'REJECT') return send({ code: '22023', message: 'Metadata rejected' }, 400);
      if (lastRpc.p_judul === 'UNCERTAIN') return send({ error: 'Unknown upstream failure' }, 500);
      const data = storageFiles.get(lastRpc.p_object_path);
      assert.equal(lastRpc.p_ukuran, data.length);
      assert.equal(lastRpc.p_sha256, createHash('sha256').update(data).digest('hex'));
      const version = { bucket_id: 'dokumen-persiapan', object_path: lastRpc.p_object_path, nama_file: lastRpc.p_nama_file, ukuran_byte: data.length, hash_file: lastRpc.p_sha256, versi_ke: 1 };
      registeredDocument = { dokumen_id: 51, paket_id: 3, judul: lastRpc.p_judul, status: 'TERSEDIA', versi_aktif: 1, dokumen_versi: [version] };
      return send({ dokumen: registeredDocument, versi: version });
    }
    if (url.pathname === '/rest/v1/rpc/baca_ringkasan_persiapan') {
      let raw = ''; for await (const chunk of req) raw += chunk; lastRpc = JSON.parse(raw);
      if (lastRpc.p_paket_id === 999 || token === 'foreign-reviewer') return send({ code: 'P0002' }, 404);
      assert.equal(req.method, 'POST');
      assert.deepEqual(lastRpc, { p_paket_id: 3 });
      return send({ paket_id: 3, pengisian: { status: 'DRAFT', versi: 2 }, checklist: { jumlah_item: 25, jumlah_ya: 1, jumlah_tidak: 1, jumlah_terjawab: 2, jumlah_belum_dijawab: 23, persen_terisi: 8, jumlah_item_dengan_pautan_bukti: 1 }, dokumen: { jumlah_tersedia: 1 }, syarat_submit_aktif: false });
    }
    if (url.pathname === '/rest/v1/rpc/tautkan_bukti_persiapan') {
      let raw = ''; for await (const chunk of req) raw += chunk; lastRpc = JSON.parse(raw);
      if (lastRpc.p_paket_id === 999) return send({ code: 'P0002' }, 404);
      if (lastRpc.p_paket_id === 4) return send({ code: '55000', message: 'Checklist bukan berstatus DRAFT' }, 400);
      if (lastRpc.p_expected_version === 42) return send({ code: '40001' }, 409);
      if (lastRpc.p_item_id !== 15 || (lastRpc.p_dokumen_id !== null && lastRpc.p_dokumen_id !== 2)) return send({ code: '22023', message: 'Dokumen bukan paket yang sama atau jenis bukti tidak sepadan' }, 400);
      return send({ paket_id: lastRpc.p_paket_id, pengisian: { status: 'DRAFT', versi: lastRpc.p_expected_version + 1 }, ringkasan: { jumlah_terjawab: 2, persen_terisi: 8 }, items: [{ item_id: 15, jenis_bukti_kode: 'LAPORAN_PENDAHULUAN', jawaban: null, keterangan: null, bukti_dokumen_id: lastRpc.p_dokumen_id }] });
    }
    if (url.pathname === '/rest/v1/rpc/baca_checklist_persiapan' || url.pathname === '/rest/v1/rpc/simpan_checklist_persiapan') {
      let raw = ''; for await (const chunk of req) raw += chunk;
      lastRpc = JSON.parse(raw);
      if (lastRpc.p_paket_id === 999) return send({ code: 'P0002' }, 404);
      if (lastRpc.p_paket_id === 4 && url.pathname.includes('simpan')) return send({ code: '55000', message: 'Checklist bukan berstatus DRAFT' }, 400);
      if (lastRpc.p_expected_version === 42) return send({ code: '40001' }, 409);
      if (lastRpc.p_jawaban?.some(row => row.item_id === 999)) return send({ code: '22023', message: 'Item bukan milik template persiapan' }, 400);
      const saved = url.pathname.includes('simpan');
      return send({ paket_id: lastRpc.p_paket_id, template: { template_id: 1, revisi: 'DRAFT-01' }, pengisian: { pengisian_id: saved ? 1 : null, status: 'DRAFT', versi: saved ? lastRpc.p_expected_version + 1 : 0 }, ringkasan: { jumlah_item: 25, jumlah_terjawab: saved ? 1 : 0, syarat_submit_aktif: false }, items: Array.from({ length: 25 }, (_, i) => ({ item_id: i + 1, jawaban: saved && i === 0 ? lastRpc.p_jawaban[0].jawaban : null })) });
    }
    if (url.pathname === '/rest/v1/rpc/ubah_paket_draft') {
      let raw = ''; for await (const chunk of req) raw += chunk;
      lastRpc = JSON.parse(raw);
      if (lastRpc.p_paket_id === 999) return send({ code: 'P0002' }, 404);
      if (lastRpc.p_paket_id === 4) return send({ code: '55000' }, 400);
      if (lastRpc.p_patch.nomor_kontrak === 'DUPLICATE') return send({ code: '23505' }, 409);
      return send({ paket_id: lastRpc.p_paket_id, status: 'DRAFT', created_by: 3, ...lastRpc.p_patch });
    }
    if (url.pathname === '/rest/v1/rpc/buat_paket_draft') {
      let raw = ''; for await (const chunk of req) raw += chunk;
      lastRpc = JSON.parse(raw);
      if (lastRpc.p_nomor_kontrak === 'DUPLICATE') return send({ code: '23505' }, 409);
      return send({ paket_id: 1, nama_paket: lastRpc.p_nama_paket, status: 'DRAFT', created_by: 3 });
    }
    send({}, 404);
  });
  await new Promise(resolve => mock.listen(0, '127.0.0.1', resolve));
  const probe = http.createServer(); await new Promise(resolve => probe.listen(0, '127.0.0.1', resolve));
  const port = probe.address().port; await new Promise(resolve => probe.close(resolve));
  base = `http://127.0.0.1:${port}/api`;
  child = spawn(process.execPath, ['dist/index.mjs'], { env: { ...process.env, PORT: String(port), SUPABASE_URL: `http://127.0.0.1:${mock.address().port}`, SUPABASE_PUBLISHABLE_KEY: 'test-publishable-key', LOG_LEVEL: 'silent', NODE_ENV: 'production' }, stdio: 'ignore' });
  let ready = false;
  for (let i = 0; i < 60; i++) { try { if ((await fetch(base + '/healthz')).ok) { ready = true; break; } } catch {} await delay(50); }
  assert.ok(ready, 'server starts');
});
after(async () => { child?.kill(); if (mock) await new Promise(resolve => mock.close(resolve)); });
const draft = { nama_paket: ' Paket Ujian ', nomor_kontrak: 'K-001', tahun_anggaran: 2026, balai_id: 1 };
test('health remains public', async () => assert.equal((await request('/healthz')).status, 200));
test('login required', async () => assert.equal((await request('/me')).status, 401));
test('expired token rejected', async () => assert.equal((await request('/me', 'expired')).status, 401));
test('unlinked and locked profiles rejected', async () => { for (const token of ['unlinked', 'locked']) assert.equal((await request('/me', token)).status, 403); });
test('own profile and roles returned', async () => { const r = await request('/me', 'provider'); assert.equal(r.status, 200); assert.equal(r.body.data.peran[0].nama, 'penyedia_jasa'); });
test('assigned roles are filtered per caller and intersected with the catalog', async () => {
  const r = await request('/me', 'reviewer');
  assert.equal(r.status, 200);
  assert.deepEqual(r.body.data.peran.map(role => role.nama), ['pic_balai']);
  assert.ok(roleQueries.some(q => /[?&]pengguna_id=eq\.\d+/.test(q)), 'penugasan mesti ditapis ikut pengguna_id');
  assert.ok(roleQueries.some(q => /[?&]peran_id=in\.\(\d+\)/.test(q)), 'katalog peran mesti ditapis ikut peran_id');
});
test('catalog roles that are not assigned cannot authorize provider-only actions', async () => {
  const body = { nama_paket: 'Paket Ujian', nomor_kontrak: 'K-1', tahun_anggaran: 2026, balai_id: 1 };
  const r = await request('/paket', 'reviewer', body);
  assert.equal(r.status, 403);
});
test('Balai and package list available', async () => { assert.equal((await request('/balai', 'provider')).status, 200); assert.equal((await request('/paket', 'provider')).status, 200); });
test('invalid pagination rejected', async () => assert.equal((await request('/paket?page=-1', 'provider')).status, 400));
test('PIC cannot create', async () => assert.equal((await request('/paket', 'reviewer', draft)).status, 403));
test('status and creator spoofing rejected', async () => { for (const fields of [{ status: 'DISETUJUI' }, { created_by: 1 }, { nama_paket: ' ' }]) assert.equal((await request('/paket', 'provider', { ...draft, ...fields })).status, 400); });
test('valid draft uses caller token and validated fields', async () => { const r = await request('/paket', 'provider', draft); assert.equal(r.status, 201); assert.equal(r.body.data.status, 'DRAFT'); assert.deepEqual(lastRpc, { p_nama_paket: 'Paket Ujian', p_nomor_kontrak: 'K-001', p_tahun_anggaran: 2026, p_balai_id: 1 }); });
test('duplicate contract maps to 409', async () => assert.equal((await request('/paket', 'provider', { ...draft, nomor_kontrak: 'DUPLICATE' })).status, 409));

test('detail endpoint reads one package', async () => { const r = await request('/paket/3', 'provider'); assert.equal(r.status, 200); assert.equal(r.body.data.paket_id, 3); });
test('missing or invisible detail returns 404', async () => assert.equal((await request('/paket/999', 'provider')).status, 404));
test('invalid package identifiers rejected', async () => { for (const id of ['0', '-1', '3abc', '2147483648']) { assert.equal((await request('/paket/' + id, 'provider')).status, 400); assert.equal((await request('/paket/' + id, 'provider', { nama_ppk: 'PPK' }, 'PATCH')).status, 400); } });
test('PIC cannot edit draft', async () => assert.equal((await request('/paket/3', 'reviewer', { nama_ppk: 'PPK' }, 'PATCH')).status, 403));
test('empty and protected fields rejected on edit', async () => { for (const body of [{}, { status: 'DISETUJUI' }, { created_by: 1 }, { balai_id: 2 }, { nama_paket: null }, { tahun_anggaran: 2026.5 }]) assert.equal((await request('/paket/3', 'provider', body, 'PATCH')).status, 400); });
test('invalid calendar dates rejected', async () => { for (const value of ['2026-02-30', '2026-02-29', '2026-13-01', '17/10/2026', '0000-01-01']) assert.equal((await request('/paket/3', 'provider', { tgl_spmk: value }, 'PATCH')).status, 400); });
test('valid edit forwards only supplied fields', async () => { const r = await request('/paket/3', 'provider', { nama_ppk: ' PPK Ujian ', tgl_spmk: '2026-10-17' }, 'PATCH'); assert.equal(r.status, 200); assert.equal(r.body.data.nama_ppk, 'PPK Ujian'); assert.deepEqual(lastRpc, { p_paket_id: 3, p_patch: { nama_ppk: 'PPK Ujian', tgl_spmk: '2026-10-17' } }); });
test('optional fields can be cleared', async () => { const r = await request('/paket/3', 'provider', { nama_ppk: '', tgl_spmk: null }, 'PATCH'); assert.equal(r.status, 200); assert.equal(lastRpc.p_patch.nama_ppk, null); assert.equal(lastRpc.p_patch.tgl_spmk, null); });
test('non-draft and duplicate edit return 409', async () => { assert.equal((await request('/paket/4', 'provider', { nama_ppk: 'PPK' }, 'PATCH')).status, 409); assert.equal((await request('/paket/3', 'provider', { nomor_kontrak: 'DUPLICATE' }, 'PATCH')).status, 409); });
test('missing edit target returns 404', async () => assert.equal((await request('/paket/999', 'provider', { nama_ppk: 'PPK' }, 'PATCH')).status, 404));

const checklistPath = '/paket/3/checklist-persiapan';
const checklistBody = { expected_version: 0, jawaban: [{ item_id: 1, jawaban: 'Ya', keterangan: ' Catatan ujian ' }] };
test('checklist requires login', async () => assert.equal((await request(checklistPath)).status, 401));
test('checklist GET returns unsaved items without creating', async () => { const r = await request(checklistPath, 'provider'); assert.equal(r.status, 200); assert.equal(r.body.data.items.length, 25); assert.equal(r.body.data.pengisian.pengisian_id, null); assert.equal(r.body.data.pengisian.versi, 0); assert.equal(r.body.data.ringkasan.syarat_submit_aktif, false); });
test('PIC may read authorized checklist', async () => assert.equal((await request(checklistPath, 'reviewer')).status, 200));
test('invisible checklist returns 404', async () => assert.equal((await request('/paket/999/checklist-persiapan', 'reviewer')).status, 404));
test('PIC cannot save checklist', async () => assert.equal((await request(checklistPath, 'reviewer', checklistBody, 'PATCH')).status, 403));
test('checklist rejects protected and missing fields', async () => { for (const body of [{ ...checklistBody, status: 'DISETUJUI' }, { ...checklistBody, template_id: 1 }, { jawaban: checklistBody.jawaban }, { expected_version: -1, jawaban: checklistBody.jawaban }, { expected_version: 0, jawaban: [] }]) assert.equal((await request(checklistPath, 'provider', body, 'PATCH')).status, 400); });
test('checklist rejects invalid answers and duplicate IDs', async () => { for (const rows of [[{ item_id: 1, jawaban: 'N/A' }], [{ item_id: 1, jawaban: true }], [{ item_id: 1 }], [{ item_id: 0, jawaban: 'Ya' }], [{ item_id: 1, jawaban: 'Ya', bukti_dokumen_id: 1 }], [{ item_id: 1, jawaban: 'Ya', keterangan: 'x'.repeat(2001) }], [{ item_id: 1, jawaban: 'Ya' }, { item_id: 1, jawaban: 'Tidak' }]]) assert.equal((await request(checklistPath, 'provider', { expected_version: 0, jawaban: rows }, 'PATCH')).status, 400); });
test('checklist save sends only validated payload and version', async () => { const r = await request(checklistPath, 'provider', checklistBody, 'PATCH'); assert.equal(r.status, 200); assert.equal(r.body.data.pengisian.versi, 1); assert.deepEqual(lastRpc, { p_paket_id: 3, p_expected_version: 0, p_jawaban: [{ item_id: 1, jawaban: 'Ya', keterangan: 'Catatan ujian' }] }); });
test('checklist answer can be cleared with null', async () => { const r = await request(checklistPath, 'provider', { expected_version: 1, jawaban: [{ item_id: 1, jawaban: null }] }, 'PATCH'); assert.equal(r.status, 200); assert.equal(lastRpc.p_jawaban[0].jawaban, null); assert.equal('keterangan' in lastRpc.p_jawaban[0], false); });
test('stale checklist version returns 409', async () => assert.equal((await request(checklistPath, 'provider', { ...checklistBody, expected_version: 42 }, 'PATCH')).status, 409));
test('submitted checklist returns 409', async () => assert.equal((await request('/paket/4/checklist-persiapan', 'provider', checklistBody, 'PATCH')).status, 409));
test('foreign template item rejected by database response', async () => assert.equal((await request(checklistPath, 'provider', { expected_version: 0, jawaban: [{ item_id: 999, jawaban: 'Ya' }] }, 'PATCH')).status, 400));

const pdfBytes = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog >> endobj\n%%EOF\n');
function uploadForm({ file = pdfBytes, filename = 'ujian.pdf', type = 'application/pdf', judul = 'Laporan Ujian', extra = false, includeFile = true, double = false } = {}) {
  const form = new FormData(); form.set('judul', judul); form.set('jenis_dokumen', 'LAPORAN_PENDAHULUAN');
  if (includeFile) form.append('file', new Blob([file], { type }), filename);
  if (double) form.append('file', new Blob([file], { type }), 'kedua.pdf');
  if (extra) form.set('status', 'DISETUJUI');
  return form;
}
async function uploadDocument(form = uploadForm(), token = 'provider') {
  const r = await fetch(base + '/paket/3/dokumen', { method: 'POST', headers: { Authorization: `Bearer ${token}` }, body: form });
  return { status: r.status, body: await r.json() };
}
test('document types can be listed', async () => assert.equal((await request('/jenis-dokumen', 'provider')).status, 200));
test('document list respects invisible package', async () => assert.equal((await request('/paket/3/dokumen', 'foreign-reviewer')).status, 404));
test('PIC cannot upload documents', async () => assert.equal((await uploadDocument(uploadForm(), 'reviewer')).status, 403));
test('upload requires a file', async () => assert.equal((await uploadDocument(uploadForm({ includeFile: false }))).status, 400));
test('upload rejects wrong extension, MIME and PDF contents', async () => { for (const opts of [{ filename: 'ujian.txt' }, { type: 'text/plain' }, { file: Buffer.from('fake PDF content') }]) assert.equal((await uploadDocument(uploadForm(opts))).status, 400); });
test('upload rejects oversized PDF', async () => assert.equal((await uploadDocument(uploadForm({ file: Buffer.alloc(10 * 1024 * 1024 + 1) }))).status, 413));
test('upload rejects extra metadata and multiple files', async () => { assert.equal((await uploadDocument(uploadForm({ extra: true }))).status, 400); assert.equal((await uploadDocument(uploadForm({ double: true }))).status, 400); });
test('missing bucket gives actionable error', async () => { const r = await uploadDocument(uploadForm(), 'no-bucket'); assert.equal(r.status, 503); assert.match(r.body.error, /Bucket/); });
test('valid PDF uploaded and registered with server hash and size', async () => { const r = await uploadDocument(); assert.equal(r.status, 201); assert.equal(r.body.data.dokumen.dokumen_id, 51); assert.match(lastRpc.p_object_path, /^3\/[0-9a-f-]+\.pdf$/); });
test('registered document is listed', async () => { const r = await request('/paket/3/dokumen', 'provider'); assert.equal(r.status, 200); assert.equal(r.body.data[0].dokumen_id, 51); });
test('authorized document download returns exact PDF bytes', async () => { const r = await fetch(base + '/paket/3/dokumen/51/download', { headers: { Authorization: 'Bearer reviewer' } }); assert.equal(r.status, 200); assert.match(r.headers.get('content-type'), /application\/pdf/); assert.match(r.headers.get('content-disposition'), /attachment/); assert.equal(r.headers.get('cache-control'), 'private, no-store'); assert.deepEqual(Buffer.from(await r.arrayBuffer()), pdfBytes); });
test('foreign PIC cannot download', async () => assert.equal((await request('/paket/3/dokumen/51/download', 'foreign-reviewer')).status, 404));
test('missing document returns 404', async () => assert.equal((await request('/paket/3/dokumen/998/download', 'provider')).status, 404));
test('download integrity mismatch rejected', async () => assert.equal((await request('/paket/3/dokumen/999/download', 'provider')).status, 502));
test('definite registration failure attempts orphan cleanup', async () => { const before = cleanupCalls; const r = await uploadDocument(uploadForm({ judul: 'REJECT' })); assert.equal(r.status, 400); assert.equal(cleanupCalls, before + 1); });
test('uncertain registration failure does not delete possibly registered file', async () => { const before = cleanupCalls; const r = await uploadDocument(uploadForm({ judul: 'UNCERTAIN' })); assert.equal(r.status, 502); assert.equal(cleanupCalls, before); });

const evidencePath = '/paket/3/checklist-persiapan/bukti';
const evidenceBody = { expected_version: 1, item_id: 15, bukti_dokumen_id: 2 };
test('evidence linking requires login', async () => { const r = await fetch(base + evidencePath, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(evidenceBody) }); assert.equal(r.status, 401); });
test('PIC cannot link evidence', async () => assert.equal((await request(evidencePath, 'reviewer', evidenceBody, 'PATCH')).status, 403));
test('evidence validates IDs, required version and protected fields', async () => { for (const body of [{ item_id: 15, bukti_dokumen_id: 2 }, { ...evidenceBody, expected_version: -1 }, { ...evidenceBody, item_id: 0 }, { ...evidenceBody, bukti_dokumen_id: '2' }, { ...evidenceBody, bukti_dokumen_id: 0 }, { ...evidenceBody, status: 'DISETUJUI' }, { ...evidenceBody, jawaban: 'Ya' }]) assert.equal((await request(evidencePath, 'provider', body, 'PATCH')).status, 400); });
test('evidence linked without answering checklist automatically', async () => { const r = await request(evidencePath, 'provider', evidenceBody, 'PATCH'); assert.equal(r.status, 200); assert.equal(r.body.data.items[0].bukti_dokumen_id, 2); assert.equal(r.body.data.items[0].jawaban, null); assert.equal(r.body.data.ringkasan.jumlah_terjawab, 2); assert.deepEqual(lastRpc, { p_paket_id: 3, p_expected_version: 1, p_item_id: 15, p_dokumen_id: 2 }); });
test('evidence unlinked with null', async () => { const r = await request(evidencePath, 'provider', { ...evidenceBody, bukti_dokumen_id: null }, 'PATCH'); assert.equal(r.status, 200); assert.equal(lastRpc.p_dokumen_id, null); });
test('wrong-type or unavailable evidence rejected', async () => { assert.equal((await request(evidencePath, 'provider', { ...evidenceBody, item_id: 23 }, 'PATCH')).status, 400); assert.equal((await request(evidencePath, 'provider', { ...evidenceBody, bukti_dokumen_id: 999 }, 'PATCH')).status, 400); });
test('stale evidence version rejected', async () => assert.equal((await request(evidencePath, 'provider', { ...evidenceBody, expected_version: 42 }, 'PATCH')).status, 409));
test('submitted or missing evidence target rejected', async () => { assert.equal((await request('/paket/4/checklist-persiapan/bukti', 'provider', evidenceBody, 'PATCH')).status, 409); assert.equal((await request('/paket/999/checklist-persiapan/bukti', 'provider', evidenceBody, 'PATCH')).status, 404); });

const summaryPath = '/paket/3/ringkasan-persiapan';
test('preparation summary requires authentication', async () => {
  assert.equal((await request(summaryPath)).status, 401);
  assert.equal((await request(summaryPath, 'expired')).status, 401);
  assert.equal((await request(summaryPath, 'locked')).status, 403);
});
test('summary forwards caller context and returns separate answer, evidence and document counts', async () => {
  const r = await request(summaryPath, 'provider');
  assert.equal(r.status, 200);
  assert.equal(r.body.data.checklist.jumlah_belum_dijawab, 23);
  assert.equal(r.body.data.checklist.jumlah_tidak, 1);
  assert.equal(r.body.data.checklist.jumlah_item_dengan_pautan_bukti, 1);
  assert.equal(r.body.data.dokumen.jumlah_tersedia, 1);
  assert.equal(r.body.data.syarat_submit_aktif, false);
  const response = await fetch(base + summaryPath, { headers: { Authorization: 'Bearer provider' } });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  await response.arrayBuffer();
});
test('authorized PIC can read summary while other Balai and missing package return 404', async () => {
  assert.equal((await request(summaryPath, 'reviewer')).status, 200);
  assert.equal((await request(summaryPath, 'foreign-reviewer')).status, 404);
  assert.equal((await request('/paket/999/ringkasan-persiapan', 'provider')).status, 404);
});
test('summary rejects malformed package identifiers', async () => {
  for (const id of ['0', '-1', '3abc', '2147483648']) assert.equal((await request(`/paket/${id}/ringkasan-persiapan`, 'provider')).status, 400);
});

const versionPath = '/paket/3/dokumen/51/versi';
const revisedPdf = Buffer.from('%PDF-1.4\n1 0 obj << /Type /Catalog /Revision 2 >> endobj\n%%EOF\n');
function versionForm(expected = '1', bytes = revisedPdf, extra = {}) {
  const f = new FormData();
  if (expected !== null) f.set('expected_version', expected);
  if (bytes !== null) f.set('file', new Blob([bytes], { type: 'application/pdf' }), 'revisi.pdf');
  for (const [key, value] of Object.entries(extra)) f.set(key, value);
  return f;
}
async function uploadVersion(form = versionForm(), token = 'provider', path = versionPath) {
  const r = await fetch(base + path, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}` } : {}, body: form });
  return { status: r.status, body: await r.json() };
}
test('version upload requires login and rejects PIC before Storage upload', async () => {
  const n = storageFiles.size;
  assert.equal((await uploadVersion(versionForm(), null)).status, 401);
  assert.equal((await uploadVersion(versionForm(), 'reviewer')).status, 403);
  assert.equal(storageFiles.size, n);
});
test('version upload validates required version, file and forbids title/type changes', async () => {
  for (const v of [null, '0', '-1', '1.5', '1abc', '2147483647']) assert.equal((await uploadVersion(versionForm(v))).status, 400);
  assert.equal((await uploadVersion(versionForm('1', null))).status, 400);
  assert.equal((await uploadVersion(versionForm('1', Buffer.from('not PDF')))).status, 400);
  assert.equal((await uploadVersion(versionForm('1', revisedPdf, { judul: 'Spoof' }))).status, 400);
});
test('version upload rejects missing or foreign document before Storage write', async () => {
  const n = storageFiles.size;
  assert.equal((await uploadVersion(versionForm(), 'provider', '/paket/3/dokumen/998/versi')).status, 404);
  assert.equal((await uploadVersion(versionForm(), 'provider', '/paket/999/dokumen/51/versi')).status, 404);
  assert.equal(storageFiles.size, n);
});
test('version conflict or locked checklist after upload cleans up only new object', async () => {
  for (const token of ['racing-version', 'submitted-version', 'reject-version']) {
    const n = storageFiles.size; const cleanups = cleanupCalls;
    const r = await uploadVersion(versionForm(), token);
    assert.equal(r.status, token === 'reject-version' ? 400 : 409);
    if (token === 'racing-version') assert.match(r.body.error, /Versi dokumen/);
    assert.equal(storageFiles.size, n);
    assert.equal(cleanupCalls, cleanups + 1);
  }
});
test('uncertain version registration failure retains possibly registered object', async () => {
  const cleanups = cleanupCalls;
  assert.equal((await uploadVersion(versionForm(), 'uncertain-version')).status, 502);
  assert.equal(cleanupCalls, cleanups);
});
test('new version retains old file and document identity, active download uses new bytes', async () => {
  const old = registeredDocument.dokumen_versi[0];
  const r = await uploadVersion();
  assert.equal(r.status, 201);
  assert.equal(r.body.data.dokumen.dokumen_id, 51);
  assert.equal(r.body.data.dokumen.versi_aktif, 2);
  assert.equal(r.body.data.dokumen.dokumen_versi.length, 2);
  assert.equal(r.body.data.versi.versi_ke, 2);
  assert.deepEqual(r.body.data.checklist_dikemas_kini, [{ pengisian_id: 2, versi: 3 }]);
  assert.deepEqual(storageFiles.get(old.object_path), pdfBytes);
  const current = await fetch(base + '/paket/3/dokumen/51/download', { headers: { Authorization: 'Bearer reviewer' } });
  assert.equal(current.status, 200);
  assert.deepEqual(Buffer.from(await current.arrayBuffer()), revisedPdf);
  const previous = await fetch(base + '/paket/3/dokumen/51/versi/1/download', { headers: { Authorization: 'Bearer reviewer' } });
  assert.equal(previous.status, 200);
  assert.deepEqual(Buffer.from(await previous.arrayBuffer()), pdfBytes);
});
test('stale expected document version rejected without Storage write', async () => {
  const n = storageFiles.size;
  assert.equal((await uploadVersion()).status, 409);
  assert.equal(storageFiles.size, n);
});
test('historical download enforces scope and version validation', async () => {
  assert.equal((await request('/paket/3/dokumen/51/versi/1/download', 'foreign-reviewer')).status, 404);
  assert.equal((await request('/paket/3/dokumen/51/versi/999/download', 'provider')).status, 404);
  assert.equal((await request('/paket/3/dokumen/51/versi/0/download', 'provider')).status, 400);
});

const documentDetailPath = '/paket/3/dokumen/51';
test('document detail requires authentication and active profile', async () => {
  assert.equal((await request(documentDetailPath)).status, 401);
  assert.equal((await request(documentDetailPath, 'expired')).status, 401);
  assert.equal((await request(documentDetailPath, 'locked')).status, 403);
});
test('document detail returns current metadata and ordered history without changing versions', async () => {
  const r = await request(documentDetailPath, 'provider');
  assert.equal(r.status, 200);
  assert.equal(r.body.data.dokumen.versi_aktif, 2);
  assert.equal(r.body.data.versi_aktif.versi_ke, 2);
  assert.deepEqual(r.body.data.riwayat_versi.map(v => [v.versi_ke,v.aktif]), [[2,true],[1,false]]);
  assert.deepEqual(lastRpc, { p_paket_id: 3, p_dokumen_id: 51, p_page: 1 });
  assert.equal(r.body.data.pagination.total, 2);
  const response = await fetch(base + documentDetailPath, { headers: { Authorization: 'Bearer provider' } });
  assert.equal(response.headers.get('cache-control'), 'private, no-store');
  await response.arrayBuffer();
});
test('document detail allows scoped PIC and rejects foreign, missing and mismatched IDs', async () => {
  assert.equal((await request(documentDetailPath, 'reviewer')).status, 200);
  assert.equal((await request(documentDetailPath, 'foreign-reviewer')).status, 404);
  assert.equal((await request('/paket/3/dokumen/998', 'provider')).status, 404);
  assert.equal((await request('/paket/999/dokumen/51', 'provider')).status, 404);
});
test('document detail validates page and IDs', async () => {
  for (const query of ['page=0','page=-1','page=1.5','page=1abc','page=','page=1000001','page=1&page=2','page[x]=1']) assert.equal((await request(documentDetailPath+'?'+query,'provider')).status,400);
  for (const path of ['/paket/0/dokumen/51','/paket/3/dokumen/0','/paket/3/dokumen/51abc','/paket/3/dokumen/2147483648']) assert.equal((await request(path,'provider')).status,400);
});
test('document history page beyond end is empty while active version remains available', async () => {
  const r = await request(documentDetailPath+'?page=2','provider');
  assert.equal(r.status,200);
  assert.deepEqual(r.body.data.riwayat_versi,[]);
  assert.equal(r.body.data.versi_aktif.versi_ke,2);
  assert.equal(r.body.data.pagination.total,2);
  assert.equal(lastRpc.p_page,2);
});

const preparationPath = '/paket/3/pengajuan-persiapan';
test('submission state requires login and foreign PIC cannot read it', async () => {
  assert.equal((await request(preparationPath)).status,401);
  assert.equal((await request(preparationPath,'foreign-reviewer')).status,404);
  assert.equal((await request('/paket/999/pengajuan-persiapan','provider')).status,404);
  const r=await request(preparationPath,'provider');
  assert.equal(r.status,200);assert.equal(r.body.data.pengajuan,null);
});
test('submission rejects PIC and spoofed/missing fields', async () => {
  assert.equal((await request(preparationPath,'reviewer',{expected_version:3})).status,403);
  for(const body of [{},{expected_version:-1},{expected_version:'3'},{expected_version:3,status:'DISETUJUI'},{expected_version:3,dokumen_id:51}]) assert.equal((await request(preparationPath,'provider',body)).status,400);
  assert.equal((await request(preparationPath,'provider',{expected_version:2})).status,409);
});
test('provider submits manual review with a server-created evidence snapshot', async () => {
  const r=await request(preparationPath,'provider',{expected_version:3});
  assert.equal(r.status,201);assert.equal(r.body.data.status,'DIAJUKAN');assert.equal(r.body.data.versi,4);
  assert.equal(r.body.data.pengajuan.snapshot.laporan_dokumen_id,51);
  assert.equal(r.body.data.aturan.validasi_kelengkapan_resmi_aktif,false);
  assert.deepEqual(lastRpc,{p_paket_id:3,p_expected_version:3});
  assert.equal((await request(preparationPath,'provider',{expected_version:4})).status,409);
});
test('pending submission locks changes and rejects upload before Storage is touched', async () => {
  assert.equal((await request('/paket/3','provider',{nama_ppk:'Blocked'},'PATCH')).status,409);
  assert.equal((await request(checklistPath,'provider',{expected_version:4,jawaban:[{item_id:1,jawaban:'Ya'}]},'PATCH')).status,409);
  assert.equal((await request(evidencePath,'provider',{expected_version:4,item_id:15,bukti_dokumen_id:null},'PATCH')).status,409);
  const n=storageFiles.size;
  assert.equal((await uploadDocument()).status,409);
  assert.equal((await uploadVersion(versionForm('2'))).status,409);
  assert.equal(storageFiles.size,n);
});
test('review requires scoped PIC, valid decision and a revision note', async () => {
  const path=preparationPath+'/review';
  assert.equal((await request(path,'provider',{expected_version:4,keputusan:'DISETUJUI'})).status,403);
  assert.equal((await request(path,'foreign-reviewer',{expected_version:4,keputusan:'DISETUJUI'})).status,403);
  for(const body of [{expected_version:4,keputusan:'PERLU_REVISI'},{expected_version:4,keputusan:'PERLU_REVISI',catatan:' '},{expected_version:4,keputusan:'DITOLAK'},{expected_version:4,keputusan:'DISETUJUI',pengguna_id:1},{expected_version:4,keputusan:'PERLU_REVISI',catatan:'x'.repeat(2001)}]) assert.equal((await request(path,'reviewer',body)).status,400);
  assert.equal((await request(path,'reviewer',{expected_version:3,keputusan:'DISETUJUI'})).status,409);
});
test('revision keeps frozen snapshot and returns trimmed notes', async () => {
  const before=(await request(preparationPath,'reviewer')).body.data;
  const r=await request(preparationPath+'/review','reviewer',{expected_version:4,keputusan:'PERLU_REVISI',catatan:' Betulkan laporan '});
  assert.equal(r.status,200);assert.equal(r.body.data.status,'PERLU_REVISI');assert.equal(r.body.data.versi,5);
  assert.equal(r.body.data.review.catatan,'Betulkan laporan');
  assert.deepEqual(r.body.data.pengajuan,before.pengajuan);
});
test('resubmission clears current decision, approval binds submitted evidence and prevents another decision', async () => {
  const old=(await request(preparationPath,'provider')).body.data.pengajuan;
  const sent=await request(preparationPath,'provider',{expected_version:5});
  assert.equal(sent.status,201);assert.equal(sent.body.data.versi,6);assert.equal(sent.body.data.review,null);
  assert.notEqual(sent.body.data.pengajuan.pengajuan_id,old.pengajuan_id);
  const approved=await request(preparationPath+'/review','reviewer',{expected_version:6,keputusan:'DISETUJUI'});
  assert.equal(approved.status,200);assert.equal(approved.body.data.status,'DISETUJUI');assert.equal(approved.body.data.versi,7);
  assert.equal(approved.body.data.review.dok_versi_id,sent.body.data.pengajuan.snapshot.laporan_dok_versi_id);
  assert.equal((await request(preparationPath+'/review','reviewer',{expected_version:7,keputusan:'DISETUJUI'})).status,409);
  assert.equal((await request('/paket/3','provider',{nama_ppk:'Still blocked'},'PATCH')).status,409);
});

test('survey catalog and provider registry require login and expose only available metadata', async () => {
  assert.equal((await request('/jenis-survei')).status,401);
  const types=await request('/jenis-survei','provider');assert.equal(types.status,200);assert.equal(types.body.data.length,8);
  assert.deepEqual((await request('/penyedia','provider')).body.data,[]);
});
test('single organisation registration validates fields, role and duplicates', async () => {
  assert.equal((await request('/penyedia','reviewer',{nama:'Org'})).status,403);
  assert.equal((await request('/penyedia','provider',{nama:' ',pengguna_id:3})).status,400);
  const r=await request('/penyedia','provider',{nama:' UJIAN - Organisasi '});assert.equal(r.status,201);assert.equal(r.body.data.nama,'UJIAN - Organisasi');
  assert.deepEqual(lastRpc,{p_nama:'UJIAN - Organisasi'});
  assert.equal((await request('/penyedia','provider',{nama:'Second'})).status,409);
});
const teamBody={penyedia_id:8,jenis_survei_id:1,nama_tim:' Tim IRI Ujian '};
test('team registration enforces provider role, approved preparation and server-bound package', async () => {
  assert.equal((await request('/paket/3/tim','reviewer',teamBody)).status,403);
  assert.equal((await request('/paket/4/tim','provider',teamBody)).status,409);
  assert.equal((await request('/paket/3/tim','provider',{...teamBody,paket_id:99})).status,400);
  assert.equal((await request('/paket/3/tim','provider',{...teamBody,jenis_survei_id:999})).status,400);
  const r=await request('/paket/3/tim','provider',teamBody);assert.equal(r.status,201);assert.equal(r.body.data.tim_id,21);
  assert.deepEqual(lastRpc,{p_paket_id:3,p_penyedia_id:8,p_jenis_survei_id:1,p_nama_tim:'Tim IRI Ujian'});
  assert.equal((await request('/paket/3/tim','provider',teamBody)).status,409);
});
test('team reads enforce package visibility and pagination', async () => {
  assert.equal((await request('/paket/3/tim','reviewer')).status,200);
  assert.equal((await request('/paket/3/tim','foreign-reviewer')).status,404);
  assert.equal((await request('/paket/3/tim?page=-1','provider')).status,400);
  assert.equal((await request('/paket/0/tim','provider')).status,400);
  assert.equal((await request('/paket/3/tim/999/alat','provider')).status,404);
});
const equipmentPath='/paket/3/tim/21/alat';
const equipmentBody={nama_alat:' Alat IRI Ujian ',nomor_seri:'UJIAN-ALAT-001',kondisi:'Belum diperiksa',milik_djbm:false,mulai:'2026-10-18'};
test('equipment registration rejects PIC, spoofed decisions, invalid fields and dates', async () => {
  assert.equal((await request(equipmentPath,'reviewer',equipmentBody)).status,403);
  for(const extra of [{status:'LULUS'},{penyedia_id:8},{jenis_survei_id:1},{mulai:'2026-02-30'},{tahun_perolehan:2026.5},{milik_djbm:'false'},{selesai:'2026-10-01'},{alat_id:7}]) assert.equal((await request(equipmentPath,'provider',{...equipmentBody,...extra})).status,400);
  assert.equal((await request(equipmentPath,'provider',{nama_alat:'Missing serial'})).status,400);
});
test('equipment and assignment created together without claiming calibration success', async () => {
  const r=await request(equipmentPath,'provider',equipmentBody);assert.equal(r.status,201);
  assert.equal(r.body.data.alat.penyedia_id,8);assert.equal(r.body.data.alat.jenis_survei_id,1);
  assert.equal(r.body.data.alat.nama_alat,'Alat IRI Ujian');assert.equal(r.body.data.kalibrasi_belum_dinilai,true);
  assert.equal('status' in r.body.data.alat,false);
  assert.equal((await request(equipmentPath,'provider',equipmentBody)).status,409);
});
test('existing equipment can be assigned to another matching team, duplicate periods rejected', async () => {
  const team=await request('/paket/3/tim','provider',{...teamBody,nama_tim:'Tim IRI Kedua'});const path=`/paket/3/tim/${team.body.data.tim_id}/alat`;
  const r=await request(path,'provider',{alat_id:7});assert.equal(r.status,201);assert.equal(r.body.data.alat.alat_id,7);
  assert.equal((await request(path,'provider',{alat_id:7})).status,409);
  assert.equal((await request(path,'provider',{alat_id:999})).status,400);
});
test('equipment reads respect team and package scopes without exposing another Balai', async () => {
  const r=await request(equipmentPath,'reviewer');assert.equal(r.status,200);assert.equal(r.body.data[0].alat_survei.alat_id,7);
  assert.equal((await request(equipmentPath,'foreign-reviewer')).status,404);
  assert.equal((await request('/paket/999/tim/21/alat','provider')).status,404);
  assert.equal((await request(equipmentPath+'?page=0','provider')).status,400);
});

const calibrationPath='/paket/3/kalibrasi-alat';
const calibrationBody={alat_id:7,jenis:'RELATIF',standar:' UJIAN - standard sijil ',komponen:'Transduser jarak',tgl_kalibrasi:'2026-10-18',berlaku_sd:null,pelaksana:'UJIAN - pelaksana'};
test('calibration requires login and PIC cannot create or edit',async()=>{
 assert.equal((await request(calibrationPath)).status,401);
 assert.equal((await request(calibrationPath,'reviewer',calibrationBody)).status,403);
 assert.equal((await request(calibrationPath+'/17','reviewer',{expected_version:1,pelaksana:'Edit'},'PATCH')).status,403);
});
test('calibration input rejects result spoofing, invalid dates and identifiers',async()=>{
 for(const extra of [{status:'LULUS'},{paket_id:3},{dokumen_id:2},{jenis:'AUTO'},{tgl_kalibrasi:'2026-02-30'},{berlaku_sd:'2026-10-01'},{alat_id:'7'},{standar:' '}]) assert.equal((await request(calibrationPath,'provider',{...calibrationBody,...extra})).status,400);
 assert.equal((await request('/paket/4/kalibrasi-alat','provider',calibrationBody)).status,409);
 assert.equal((await request(calibrationPath,'provider',{...calibrationBody,alat_id:999})).status,400);
});
test('calibration creates draft with null expiry and no fabricated certificate',async()=>{
 const r=await request(calibrationPath,'provider',calibrationBody);assert.equal(r.status,201);assert.equal(r.body.data.status,'DRAFT');assert.equal(r.body.data.versi,1);assert.equal(r.body.data.berlaku_sd,null);assert.equal(r.body.data.dokumen_id,null);
 assert.equal(lastRpc.p_data.standar,'UJIAN - standard sijil');assert.equal(lastRpc.p_kalibrasi_id,null);
});
test('calibration list/detail enforces package scope and pagination',async()=>{
 assert.equal((await request(calibrationPath,'reviewer')).body.data.length,1);
 assert.equal((await request(calibrationPath+'/17','reviewer')).status,200);
 assert.equal((await request(calibrationPath,'foreign-reviewer')).status,404);
 assert.equal((await request(calibrationPath+'/17','foreign-reviewer')).status,404);
 assert.equal((await request(calibrationPath+'?page=-1','provider')).status,400);
});
test('calibration edit checks expected version, final dates and protected fields',async()=>{
 const path=calibrationPath+'/17';
 for(const body of [{expected_version:1},{expected_version:1,status:'LULUS'},{expected_version:1,alat_id:8},{expected_version:1,pelaksana:null}])assert.equal((await request(path,'provider',body,'PATCH')).status,400);
 assert.equal((await request(path,'provider',{expected_version:42,pelaksana:'Stale'},'PATCH')).status,409);
 assert.equal((await request(path,'provider',{expected_version:1,berlaku_sd:'2026-10-01'},'PATCH')).status,400);
 const r=await request(path,'provider',{expected_version:1,pelaksana:' UJIAN - pembetulan '},'PATCH');assert.equal(r.status,200);assert.equal(r.body.data.versi,2);assert.equal(r.body.data.pelaksana,'UJIAN - pembetulan');
 assert.equal((await request(path,'provider',{expected_version:2,pelaksana:'UJIAN - pembetulan'},'PATCH')).body.data.versi,2);
});
const certificatePath=calibrationPath+'/17/sertifikat';
function certificateForm(expected='2',filename='sertifikat.pdf',bytes=pdfBytes){const f=new FormData();f.set('expected_version',expected);if(bytes!==null)f.set('file',new Blob([bytes],{type:'application/pdf'}),filename);return f;}
async function uploadCertificate(form=certificateForm(),token='provider'){const r=await fetch(base+certificatePath,{method:'POST',headers:{Authorization:`Bearer ${token}`},body:form});return {status:r.status,body:await r.json()};}
test('certificate upload checks role, record version, file and missing bucket',async()=>{
 assert.equal((await uploadCertificate(certificateForm(),'reviewer')).status,403);
 assert.equal((await uploadCertificate(certificateForm('1'))).status,409);
 assert.equal((await uploadCertificate(certificateForm('2','bad.pdf',Buffer.from('Not PDF')))).status,400);
 assert.equal((await uploadCertificate(certificateForm('2','none.pdf',null))).status,400);
 const missing=await uploadCertificate(certificateForm(),'no-calibration-bucket');assert.equal(missing.status,503);assert.match(missing.body.error,/dokumen-kalibrasi/);
 assert.equal((await request(certificatePath+'/download','provider')).status,404);
});
test('certificate failure and concurrent record change clean up only definitively rejected objects',async()=>{
 for(const [token,name,code] of [['provider','reject.pdf',400],['race-calibration','sertifikat.pdf',409]]){
  const n=storageFiles.size,cleanups=cleanupCalls;const r=await uploadCertificate(certificateForm('2',name),token);assert.equal(r.status,code);assert.equal(storageFiles.size,n);assert.equal(cleanupCalls,cleanups+1);
  if(token==='race-calibration')assert.match(r.body.error,/kalibrasi/);
 }
 const n=cleanupCalls;assert.equal((await uploadCertificate(certificateForm('2','uncertain.pdf'))).status,502);assert.equal(cleanupCalls,n);
});
test('certificate first and replacement uploads retain old versions and keep calibration DRAFT',async()=>{
 const first=await uploadCertificate();assert.equal(first.status,201);assert.equal(first.body.data.kalibrasi.versi,3);assert.equal(first.body.data.kalibrasi.status,'DRAFT');assert.equal(first.body.data.versi.versi_ke,1);
 const oldPath=first.body.data.versi.object_path;
 const second=await uploadCertificate(certificateForm('3','sertifikat-revisi.pdf',revisedPdf));assert.equal(second.status,201);assert.equal(second.body.data.kalibrasi.versi,4);assert.equal(second.body.data.versi.versi_ke,2);assert.equal(second.body.data.dokumen.dokumen_id,first.body.data.dokumen.dokumen_id);
 assert.deepEqual(storageFiles.get(oldPath),pdfBytes);
});
test('certificate active/old downloads verify bytes, scope and integrity',async()=>{
 const current=await fetch(base+certificatePath+'/download',{headers:{Authorization:'Bearer reviewer'}});assert.equal(current.status,200);assert.deepEqual(Buffer.from(await current.arrayBuffer()),revisedPdf);
 const old=await fetch(base+certificatePath+'/versi/1/download',{headers:{Authorization:'Bearer reviewer'}});assert.equal(old.status,200);assert.deepEqual(Buffer.from(await old.arrayBuffer()),pdfBytes);
 assert.equal((await request(certificatePath+'/download','foreign-reviewer')).status,404);
 assert.equal((await request(certificatePath+'/download','bad-cert-hash')).status,502);
 assert.equal((await request(certificatePath+'/versi/99/download','provider')).status,404);
});

const personnelPath='/paket/3/tim/21/personel';
const personPayload={nama:' UJIAN - Operator ',nik_internal:' UJIAN-PERSON-001 ',pendidikan:null,pengalaman_tahun:0,peran:' Operator ',mulai:'2026-10-18',selesai:null};
const qualificationPath=personnelPath+'/91/kualifikasi';
test('personnel and qualifications require login and PIC writes are denied',async()=>{
  for(const path of [personnelPath,qualificationPath])assert.equal((await request(path)).status,401);
  assert.equal((await request(personnelPath,'reviewer',personPayload)).status,403);
  assert.equal((await request(qualificationPath,'reviewer',{jenis:'SKK',nomor:'UJIAN'})).status,403);
});
test('personnel validates input types, dates and rejects privilege/evidence spoofing',async()=>{
  for(const extra of [{penyedia_id:1},{status:'LULUS'},{created_by:9},{alasan_ganti:'fake'},{nama:''},{peran:null},{pengalaman_tahun:-1},{pengalaman_tahun:1.5},{mulai:'2026-02-30'},{mulai:null,selesai:'2026-10-18'},{mulai:'2026-10-19',selesai:'2026-10-18'},{personel_id:91}]) {
    assert.equal((await request(personnelPath,'valid',{...personPayload,...extra})).status,400,JSON.stringify(extra));
  }
  assert.equal((await request(personnelPath,'valid',{})).status,400);
});
test('personnel registration binds provider and team without creating account or approval',async()=>{
  const r=await request(personnelPath,'valid',personPayload);assert.equal(r.status,201);
  assert.equal(r.body.data.personel.nama,'UJIAN - Operator');assert.equal(r.body.data.personel.penyedia_id,8);
  assert.equal(r.body.data.anggota.tim_id,21);assert.equal(r.body.data.anggota.peran,'Operator');assert.equal(r.body.data.kelayakan_belum_dinilai,true);
  assert.equal(r.body.data.personel.auth_user_id,undefined);assert.equal(r.body.data.personel.pendidikan,null);
  assert.equal(lastRpc.p_paket_id,3);assert.equal(lastRpc.p_tim_id,21);assert.equal(lastRpc.p_data.penyedia_id,undefined);
});
test('personnel duplicate IDs and assignment periods return conflict',async()=>{
  assert.equal((await request(personnelPath,'valid',personPayload)).status,409);
  assert.equal((await request(personnelPath,'valid',{personel_id:91,peran:'Operator',mulai:'2026-10-18'})).status,409);
});
test('existing person may join another team without changing biodata',async()=>{
  const r=await request('/paket/3/tim/22/personel','valid',{personel_id:91,peran:'Ketua Tim'});
  assert.equal(r.status,201);assert.equal(r.body.data.personel.personel_id,91);assert.equal(r.body.data.anggota.tim_id,22);
  assert.equal(personnelRows.length,1);
  assert.equal((await request(personnelPath,'valid',{personel_id:999,peran:'Operator'})).status,400);
});
test('personnel writes enforce preparation gate and package/team binding',async()=>{
  assert.equal((await request('/paket/4/tim/21/personel','valid',personPayload)).status,409);
  assert.equal((await request('/paket/999/tim/21/personel','valid',personPayload)).status,404);
  assert.equal((await request('/paket/3/tim/999/personel','valid',personPayload)).status,404);
});
test('personnel reads allow scoped PIC, reject other Balai and paginate',async()=>{
  const r=await request(personnelPath,'reviewer');assert.equal(r.status,200);assert.equal(r.body.data[0].personel.personel_id,91);assert.equal(r.body.page_size,50);
  assert.equal((await request(personnelPath,'foreign-reviewer')).status,404);
  assert.equal((await request('/paket/4/tim/21/personel','valid')).status,404);
  assert.deepEqual((await request(personnelPath+'?page=2','valid')).body.data,[]);
  for(const query of ['?page=0','?page=1.5','?page=1&page=2'])assert.equal((await request(personnelPath+query,'valid')).status,400);
});
test('qualification metadata rejects forged proof, results, malformed type and date',async()=>{
  for(const extra of [{dokumen_id:4},{status:'LULUS'},{personel_id:92},{jenis:'BAD'},{nomor:null},{berlaku_sd:'2026-02-30'},{jenjang:12}])assert.equal((await request(qualificationPath,'valid',{jenis:'SKK',nomor:'UJIAN-SKK-001',...extra})).status,400);
});
test('qualification stores supplied metadata with no invented expiry, proof or acceptance',async()=>{
  const r=await request(qualificationPath,'valid',{jenis:'SKK',nomor:' UJIAN-SKK-001 ',jenjang:null,berlaku_sd:null});assert.equal(r.status,201);
  assert.equal(r.body.data.kualifikasi.nomor,'UJIAN-SKK-001');assert.equal(r.body.data.kualifikasi.dokumen_id,null);assert.equal(r.body.data.kualifikasi.berlaku_sd,null);assert.equal(r.body.data.kelayakan_belum_dinilai,true);
  assert.equal((await request(qualificationPath,'valid',{jenis:'SKK',nomor:'ujian-skk-001'})).status,409);
});
test('qualification writes require person to belong to specified team and package',async()=>{
  assert.equal((await request(personnelPath+'/999/kualifikasi','valid',{jenis:'SKK',nomor:'Unknown person'})).status,404);
  assert.equal((await request('/paket/3/tim/999/personel/91/kualifikasi','valid',{jenis:'SKK',nomor:'Unknown team'})).status,404);
  assert.equal((await request('/paket/4/tim/21/personel/91/kualifikasi','valid',{jenis:'SKK',nomor:'Unapproved package'})).status,409);
});
test('qualification reads enforce membership and scope before returning metadata',async()=>{
  const r=await request(qualificationPath,'reviewer');assert.equal(r.status,200);assert.equal(r.body.data[0].personel_id,91);assert.equal(r.body.kelayakan_belum_dinilai,true);
  assert.equal((await request(qualificationPath,'foreign-reviewer')).status,404);
  assert.equal((await request(personnelPath+'/999/kualifikasi','reviewer')).status,404);
  assert.deepEqual((await request(qualificationPath+'?page=2','valid')).body.data,[]);
  assert.equal((await request(qualificationPath+'?page=0','valid')).status,400);
});
test('personnel routes reject malformed and overflow identifiers',async()=>{
  for(const path of ['/paket/no/tim/21/personel','/paket/3/tim/0/personel','/paket/3/tim/2147483648/personel','/paket/3/tim/21/personel/no/kualifikasi'])assert.equal((await request(path,'valid')).status,400);
});

const qualificationEvidencePath=qualificationPath+'/111/bukti';
function evidenceForm(expected='1',filename='bukti-skk.pdf',bytes=pdfBytes) {return certificateForm(expected,filename,bytes);}
async function uploadEvidence(form=evidenceForm(),token='provider',path=qualificationEvidencePath) {
 const r=await fetch(base+path,{method:'POST',headers:token?{Authorization:`Bearer ${token}`}:{},body:form});return {status:r.status,body:await r.json()};
}
test('qualification evidence requires login and provider role before touching Storage',async()=>{
 assert.equal((await request(qualificationEvidencePath)).status,401);
 assert.equal((await uploadEvidence(evidenceForm(),null)).status,401);
 const n=storageFiles.size;
 assert.equal((await uploadEvidence(evidenceForm(),'reviewer')).status,403);
 assert.equal((await request(qualificationEvidencePath,'locked')).status,403);
 assert.equal(storageFiles.size,n);
});
test('empty qualification evidence detail returns version without inventing a document',async()=>{
 const r=await request(qualificationEvidencePath,'reviewer');assert.equal(r.status,200);assert.equal(r.body.data.kualifikasi.versi,1);
 assert.equal(r.body.data.dokumen,null);assert.deepEqual(r.body.data.riwayat_versi,[]);assert.equal(r.body.data.kelayakan_belum_dinilai,true);
 assert.equal((await request(qualificationEvidencePath+'/download','reviewer')).status,404);
});
test('qualification evidence checks package, team, person and qualification IDs',async()=>{
 for(const path of ['/paket/4/tim/21/personel/91/kualifikasi/111/bukti','/paket/3/tim/999/personel/91/kualifikasi/111/bukti','/paket/3/tim/21/personel/999/kualifikasi/111/bukti',qualificationPath+'/999/bukti'])assert.equal((await request(path,'provider')).status,404);
 for(const path of ['/paket/0/tim/21/personel/91/kualifikasi/111/bukti',qualificationPath+'/no/bukti',qualificationEvidencePath+'/versi/0/download'])assert.equal((await request(path,'provider')).status,path.endsWith('/versi/0/download')?404:400);
 assert.equal((await uploadEvidence(evidenceForm(),'provider',qualificationPath+'/999/bukti')).status,404);
});
test('qualification evidence validates version, PDF contents, limits and protected metadata',async()=>{
 for(const v of ['0','1.5','2147483647','not-number'])assert.equal((await uploadEvidence(evidenceForm(v))).status,400);
 for(const [name,bytes] of [['none.pdf',null],['fake.pdf',Buffer.from('Not PDF')],['file.txt',pdfBytes]])assert.equal((await uploadEvidence(evidenceForm('1',name,bytes))).status,400);
 assert.equal((await uploadEvidence(evidenceForm('1','big.pdf',Buffer.alloc(10*1024*1024+1)))).status,413);
 const f=evidenceForm();f.set('dokumen_id','4');assert.equal((await uploadEvidence(f)).status,400);
});
test('missing qualification bucket has the correct setup error',async()=>{
 const r=await uploadEvidence(evidenceForm(),'no-qualification-bucket');assert.equal(r.status,503);assert.match(r.body.error,/dokumen-kualifikasi/);
});
test('rejected qualification registration and raced gate clean up only the new object',async()=>{
 for(const [token,name,code] of [['provider','reject.pdf',400],['race-qualification','bukti.pdf',409],['closed-qualification','bukti.pdf',409]]){
  const n=storageFiles.size,cleanups=cleanupCalls;const r=await uploadEvidence(evidenceForm('1',name),token);assert.equal(r.status,code);assert.equal(storageFiles.size,n);assert.equal(cleanupCalls,cleanups+1);
 }
});
test('uncertain qualification registration retains object for reconciliation',async()=>{
 const n=cleanupCalls;assert.equal((await uploadEvidence(evidenceForm('1','uncertain.pdf'))).status,502);assert.equal(cleanupCalls,n);
});
test('first qualification evidence upload binds existing qualification and increments its version',async()=>{
 const r=await uploadEvidence();assert.equal(r.status,201);assert.equal(r.body.data.kualifikasi.kualifikasi_id,111);assert.equal(r.body.data.kualifikasi.versi,2);
 assert.equal(r.body.data.versi.versi_ke,1);assert.equal(r.body.data.kualifikasi.dokumen_id,88);assert.equal(r.body.data.kelayakan_belum_dinilai,true);
 assert.equal(r.body.data.kualifikasi.berlaku_sd,null);assert.equal(r.body.data.kualifikasi.status,undefined);
});
test('qualification replacement preserves document identity and old PDF',async()=>{
 const old=qualificationEvidence.dokumen_versi[0].object_path;
 const r=await uploadEvidence(evidenceForm('2','bukti-revisi.pdf',revisedPdf));assert.equal(r.status,201);assert.equal(r.body.data.kualifikasi.versi,3);
 assert.equal(r.body.data.versi.versi_ke,2);assert.equal(r.body.data.dokumen.dokumen_id,88);assert.deepEqual(storageFiles.get(old),pdfBytes);
});
test('qualification evidence history is ordered, paginated and restricted to scoped viewers',async()=>{
 const r=await request(qualificationEvidencePath,'reviewer');assert.equal(r.status,200);assert.equal(r.body.data.versi_aktif.versi_ke,2);
 assert.deepEqual(r.body.data.riwayat_versi.map(v=>v.versi_ke),[2,1]);assert.equal(r.body.data.riwayat_versi[0].object_path,undefined);
 const end=await request(qualificationEvidencePath+'?page=2','reviewer');assert.deepEqual(end.body.data.riwayat_versi,[]);assert.equal(end.body.data.versi_aktif.versi_ke,2);
 assert.equal((await request(qualificationEvidencePath+'?page=0','provider')).status,400);assert.equal((await request(qualificationEvidencePath,'foreign-reviewer')).status,404);
});
test('qualification evidence current and historical downloads return exact bytes',async()=>{
 for(const [path,bytes] of [[qualificationEvidencePath+'/download',revisedPdf],[qualificationEvidencePath+'/versi/1/download',pdfBytes]]) {
  const r=await fetch(base+path,{headers:{Authorization:'Bearer reviewer'}});assert.equal(r.status,200);assert.match(r.headers.get('content-type'),/application\/pdf/);
  assert.equal(r.headers.get('cache-control'),'private, no-store');assert.equal(r.headers.get('x-content-type-options'),'nosniff');assert.deepEqual(Buffer.from(await r.arrayBuffer()),bytes);
 }
});
test('qualification downloads reject wrong scope, tampered bytes and mismatched evidence',async()=>{
 for(const [token,status] of [['foreign-reviewer',404],['bad-evidence-link',404],['bad-evidence-hash',502],['bad-evidence-bucket',404],['bad-evidence-path',404]])assert.equal((await request(qualificationEvidencePath+'/download',token)).status,status);
 assert.equal((await request(qualificationEvidencePath+'/versi/99/download','provider')).status,404);
 assert.equal((await request(qualificationEvidencePath+'/versi/0/download','provider')).status,400);
});
test('stale qualification evidence upload is rejected before writing Storage',async()=>{
 const n=storageFiles.size;const r=await uploadEvidence(evidenceForm('2'));assert.equal(r.status,409);assert.match(r.body.error,/kualifikasi/);assert.equal(storageFiles.size,n);
 assert.equal(qualificationRows[0].versi,3);
});
