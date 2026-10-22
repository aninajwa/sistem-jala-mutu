import fs from 'node:fs';
import {STAGE3B_DOCX_CANDIDATES} from '../src/workflow/stage3bChecklistData.docx-candidate';
import {getStructuredChecklistTemplate} from '../src/workflow/structuredChecklistTemplates';
const templates:any[]=[];
for(const survey of ['IRI','PCI Manual','PCI AI','Lendutan','Jembatan','Lereng','Drainase','Lalu Lintas','RNI'] as const)for(const phase of ['preparation','calibration','production','periodic14','staged','audit'] as const){const template=getStructuredChecklistTemplate(survey,phase);if(template&&!templates.some(x=>x.id===template.id))templates.push(template);}
fs.writeFileSync('final-analysis/frontend-checklist-inventory.json',JSON.stringify({structured:templates,periodic:STAGE3B_DOCX_CANDIDATES},null,2));
