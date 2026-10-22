import fs from 'node:fs';
import {STAGE_POLICY,mayOperate,type StageOperation} from '../src/workflow/access/operationalPolicy';
import type {WorkflowRole} from '../src/workflow/model';
const roles:WorkflowRole[]=['Penyedia Jasa / Ketua Tim','PIC Balai / Pengguna Jasa','Direktorat / Pusat','Admin'];
const operations:StageOperation[]=['view','draft','submit','comment','approve','revise','reject','baDraft','recordDecision'];
const rows=[];
for(const [stage,policy] of Object.entries(STAGE_POLICY))for(const role of roles)for(const level of stage==='Tahap 5'?[1,2,3] as const:[1] as const){
 const allowed=Object.fromEntries(operations.map(operation=>[operation,mayOperate(role,stage as keyof typeof STAGE_POLICY,operation,level)]));
 rows.push({stage,role,auditLevel:stage==='Tahap 5'?level:'',...allowed,packageScope:'Lihat hanya penugasan principal; frontend lokal bukan otorisasi server',readOnlyReason:allowed.draft?'':`Data teknis diisi oleh ${policy.draft.join(' / ')}`,gate:'Hak akses terpisah dari evaluateStageGate dan validasi handler',next:policy.next,source:policy.source});
}
const output=process.argv[2]||'operational-role-matrix.json';fs.writeFileSync(output,JSON.stringify(rows,null,2));console.log(`${rows.length} operational rows exported to ${output}`);
