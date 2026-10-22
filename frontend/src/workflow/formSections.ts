import type {SourceBlock,SourceQuestion} from './sourceDocumentModel';
export type FormSection={label:string;groups:{label:string;blocks:SourceBlock[]}[]};
/** Presentation grouping only: order, original block objects and answer IDs stay unchanged. */
export function formSections(blocks:readonly SourceBlock[]):FormSection[]{
 const sections:FormSection[]=[];
 for(const block of blocks){
  const chapter=block.chapter??'';
  if(!sections.length||sections.at(-1)!.label!==chapter)sections.push({label:chapter,groups:[]});
  const groups=sections.at(-1)!.groups;
  const label=block.heading??(block.kind==='heading'?block.text:'')??'';
  if(!groups.length||groups.at(-1)!.label!==label)groups.push({label,blocks:[]});
  groups.at(-1)!.blocks.push(block);
 }
 return sections;
}

/** Undefined paragraph IDs never identify a question: informational headings must not inherit totals. */
export function questionsInBlocks(questions:readonly SourceQuestion[],blocks:readonly SourceBlock[]):SourceQuestion[]{
 const tables=new Set(blocks.filter(block=>block.kind==='table'&&block.table!==undefined).map(block=>block.table));
 const paragraphs=new Set(blocks.filter(block=>block.kind==='paragraph'&&block.id!==undefined).map(block=>block.id));
 return questions.filter(question=>tables.has(question.table)||(question.paragraph!==undefined&&paragraphs.has(question.paragraph)));
}
