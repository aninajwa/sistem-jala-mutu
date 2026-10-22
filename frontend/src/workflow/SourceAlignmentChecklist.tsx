import {SourceDocumentChecklist} from './SourceDocumentChecklist';
type Props=Parameters<typeof SourceDocumentChecklist>[0]&{title?:string};
/** Compatibility entry point for existing stage callers. The original-form renderer owns the UI. */
export function SourceAlignmentChecklist({title:_title,...props}:Props){return <SourceDocumentChecklist {...props}/>;}
