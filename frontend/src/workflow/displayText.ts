/** Display-only repair; persisted values are not migrated. */
export const displayText=(value:string)=>value.replaceAll('\u00c2\u00b7','·').replaceAll('\u00e2\u20ac\u201c','–').replaceAll('\u00e2\u20ac\u201d','—').replaceAll('\u00e2\u2030\u00a4','≤').replaceAll('\u00e2\u2030\u00a5','≥').replaceAll('\u00c2\u00b5','µ').replaceAll('\u00e2\u20ac\u00ba','›').replaceAll('\u00e2\u2020\u2019','→');
