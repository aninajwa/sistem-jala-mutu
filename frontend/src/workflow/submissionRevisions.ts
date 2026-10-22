import type {SubmissionState} from './model';
/** A status confirmation or identical configured destination is not a source-data edit. */
export function submissionInputChanged(current:SubmissionState,patch:Partial<SubmissionState>){return Object.entries(patch).some(([key,value])=>key!=='validationStatus'&&key!=='validationMessage'&&JSON.stringify(current[key as keyof SubmissionState])!==JSON.stringify(value));}
