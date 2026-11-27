const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const ts = require('typescript');
function load(file){ const js=ts.transpileModule(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText; const m={exports:{}}; new Function('module','exports',js)(m,m.exports); return m.exports; }
const {projectBI}=load('src/pages/biProjection.ts');
const {buildReportHtml}=load('src/reports/reportHtml.ts');
const {CONTRACT_REPORTS}=load('src/reports/contractReportCatalog.ts');
const row=(id,surveyType,date,lengthKm,state='Tercatat')=>({id,surveyType,date,lengthKm,state});
const pack=(name,dailyRecords,corrections=[])=>({project:{packageName:name},dailyRecords,corrections});
const data={a:pack('A',[row('1','IRI','2026-01-01',10),row('2','IRI','2026-02-01',5),row('3','PCI','2026-01-01',8),row('4','IRI','2026-01-01',100,'Draft'),row('dup','IRI','2026-01-01',9),row('dup','IRI','2026-01-01',99)],[{id:'c1',surveyType:'IRI',status:'Terbuka'},{id:'c2',surveyType:'PCI',status:'Ditutup'}]),b:pack('B',[row('1','IRI','2026-01-01',2)])};
const tests=[
 ['scope, date, survey, duplicate identities',()=>{const r=projectBI(data,'IRI','Bulan 2026-01');assert.equal(r.sessions.length,2);assert.deepEqual(r.distance,[{name:'2026-01-01',value:12}]);assert.equal(r.cases.length,1)}],
 ['no cross-survey distance aggregate',()=>assert.deepEqual(projectBI(data).distance,[])],
 ['empty scope',()=>assert.deepEqual(projectBI({}),{sessions:[],cases:[],distance:[]})],
 ['negative and nonfinite lengths excluded',()=>assert.deepEqual(projectBI({a:pack('A',[row('1','IRI','2026-01-01',-2),row('2','IRI','2026-01-01',NaN)])},'IRI').distance,[])],
 ['report HTML escaping and draft designation',()=>{const html=buildReportHtml({name:'<script>',packageName:'A & B',start:'2026-01-01',end:'2026-01-07',sections:['x'],content:['<img>'],attachments:['x.pdf']});assert.ok(html.includes('&lt;script&gt;'));assert.ok(!html.includes('<img>'));assert.ok(html.includes('BELUM DISAHKAN'))}],
 ['contract catalog is separate and complete for chapters 19–21',()=>{assert.equal(CONTRACT_REPORTS.length,4);assert.ok(CONTRACT_REPORTS.some(x=>x.name.includes('Semester II')));assert.ok(CONTRACT_REPORTS.some(x=>x.items.includes('Grafik panjang survei harian')))}]
];
for(const [name,fn] of tests){fn(); console.log('PASS',name)} console.log(`${tests.length}/${tests.length} PASS`);
