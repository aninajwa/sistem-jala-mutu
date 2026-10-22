import test from 'node:test';import assert from 'node:assert/strict';
import {itemIsComplete,type StructuredChecklistItem} from './structuredChecklist';
test('tabel hasil kosong atau sebagian tidak otomatis dianggap lengkap',()=>{
 const item:StructuredChecklistItem={id:'hasil',label:'Hasil uji',responseType:'table',tableColumns:['No','Nilai awal','Nilai ulang','Catatan'],tableRows:[{'No':'1'}]};
 assert.equal(itemIsComplete(item),false);
 assert.equal(itemIsComplete(item,{value:JSON.stringify({'0:Nilai awal':'4'})}),false);
 assert.equal(itemIsComplete(item,{value:JSON.stringify({'0:Nilai awal':'4','0:Nilai ulang':'4.1'})}),true);
});
test('invalid saved options and whitespace cannot count as completed input',()=>{
 const option:StructuredChecklistItem={id:'source-option',label:'Kondisi sumber',responseType:'comply',options:['Memenuhi','Tidak Memenuhi']};
 assert.equal(itemIsComplete(option,{value:'Ya'}),false);assert.equal(itemIsComplete(option,{value:'Memenuhi'}),true);
 const number:StructuredChecklistItem={id:'source-number',label:'Nilai',responseType:'number'};assert.equal(itemIsComplete(number,{value:' '}),false);assert.equal(itemIsComplete(number,{value:'abc'}),false);assert.equal(itemIsComplete(number,{value:'0'}),true);
});
