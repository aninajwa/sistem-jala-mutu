import type {
  SurveyType,
  WorkflowRole,
} from './model';

export type ChecklistResponseType =
'check'
  | 'yes-no'
  | 'comply'
  | 'availability'
  | 'text'
  | 'number'
  | 'readonly'
  | 'table';

export type ChecklistChoice = string;

export type StructuredChecklistTableRow =
  Record<string, string | number | null | undefined>;

export type StructuredChecklistItem = {
  id: string;
  number?: string;
  label: string;

  responseType: ChecklistResponseType;

  options?: ChecklistChoice[];
  description?: string;

  noteAllowed?: boolean;
  noteRequired?: boolean;

  evidenceAllowed?: boolean;
  evidenceRequired?: boolean;

  tableColumns?: string[];
  tableRows?: StructuredChecklistTableRow[];

  dataOrigin?:
    | 'package'
    | 'source-system'
    | 'provider'
    | 'reviewer'
    | 'system';

  editableRoles?: WorkflowRole[];
};

export type StructuredChecklistSection = {
  id: string;
  number?: string;
  title: string;
  description?: string;

  mode?: 'auto' | 'form' | 'table';

  items: StructuredChecklistItem[];
};

export type StructuredChecklistTemplate = {
  id: string;

  survey:
    | SurveyType
    | 'PCI Manual'
    | 'PCI AI';

  phase:
    | 'preparation'
    | 'calibration'
    | 'production'
    | 'periodic14'
    | 'staged'
    | 'audit';

  title: string;

  sections: StructuredChecklistSection[];
};

export type StructuredChecklistAnswer = {
  value?: string;
  note?: string;
  evidenceReference?: string;
};

export type StructuredChecklistAnswers =
  Record<string, StructuredChecklistAnswer>;

export function itemIsComplete(
  item: StructuredChecklistItem,
  answer?: StructuredChecklistAnswer,
) {
  if (
    item.responseType === 'readonly'
  ) {
    return true;
  }

  if(item.responseType==='table'){
    if(item.dataOrigin==='package'||item.dataOrigin==='system'||item.dataOrigin==='source-system')return true;
    if(/tanda tangan|penandatangan|petugas validasi/i.test(item.label))return true; // identity block, not official signing
    try{
      const value=JSON.parse(answer?.value||'{}') as Record<string,string>;
      const cells=(item.tableRows?.length?item.tableRows:[{}]).flatMap((row,i)=>(item.tableColumns??[]).filter(column=>!/(catatan|keterangan|tanda tangan|foto)/i.test(column)&&!(row[column]!==undefined&&String(row[column]).trim()&&!/^(—|-|\[.*\])$/.test(String(row[column])))).map(column=>`${i}:${column}`));
      return cells.length>0&&cells.every(key=>!!value[key]?.trim());
    }catch{return false;}
  }
  const hasValue =
    answer?.value !== undefined &&
    answer.value.trim() !== '';

  if (!hasValue) {
    return false;
  }
  if(item.responseType==='check'&&answer?.value!=='checked')return false;
  if(item.options?.length&&!item.options.includes(answer!.value!))return false;
  if(item.responseType==='number'&&!Number.isFinite(Number(answer?.value)))return false;

  if (
    item.noteRequired &&
    !answer?.note?.trim()
  ) {
    return false;
  }

  if (
    item.evidenceRequired &&
    !answer?.evidenceReference?.trim()
  ) {
    return false;
  }

  return true;
}

export function checklistProgress(
  template: StructuredChecklistTemplate,
  answers: StructuredChecklistAnswers,
) {
  const editableItems =
    template.sections.flatMap(section =>
      section.items.filter(
        item =>
          item.responseType !== 'readonly' &&
          !(item.responseType==='table'&&(/tanda tangan|penandatangan|petugas validasi/i.test(item.label)||['package','system','source-system'].includes(item.dataOrigin??''))),
      ),
    );

  const completed =
    editableItems.filter(item =>
      itemIsComplete(
        item,
        answers[item.id],
      ),
    ).length;

  return {
    completed,
    total: editableItems.length,
    complete:
      editableItems.length > 0 &&
      completed === editableItems.length,
  };
}