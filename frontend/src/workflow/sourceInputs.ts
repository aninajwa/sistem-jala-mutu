/** Placeholders printed by the original forms, including units and two-ended ranges. */
export function sourceCellEditable(value:string){
 const text=value.trim();
 return !text||/^(\[.*\]|\.{3,}|_{3,}|—|-|:|%)$/.test(text)||/_{3,}/.test(text)||/^(Lat(?:itude)?|Lintang):\s*(Long(?:itude)?|Bujur):\s*$/i.test(text);
}
export const sourceCellKey=(table:number,row:number,column:number)=>`value:t${table}:r${row}:c${column}`;
