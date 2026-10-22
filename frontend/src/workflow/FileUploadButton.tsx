import {useRef} from 'react';
/** A keyboard-accessible action; the browser file input stays available to automation. */
export function FileUploadButton({onFiles,disabled=false,label='Tambah berkas',inputLabel='Tambah dokumen dan lampiran'}:{onFiles:(files:File[])=>void;disabled?:boolean;label?:string;inputLabel?:string}){
 const input=useRef<HTMLInputElement>(null);
 return <><button type="button" className="wf-button file-upload-action" disabled={disabled} onClick={()=>input.current?.click()}>{disabled?'Menyimpan…':label}</button><input ref={input} type="file" multiple hidden tabIndex={-1} aria-label={inputLabel} disabled={disabled} onChange={event=>{const files=Array.from(event.target.files??[]);event.target.value='';if(files.length)onFiles(files);}}/></>;
}
