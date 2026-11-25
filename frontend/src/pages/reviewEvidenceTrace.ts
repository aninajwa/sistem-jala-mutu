/** Review evidence is only traceable when the review itself stores an explicit reference.
 * A document elsewhere in the package must never be matched by name or date. */
export type ReviewEvidenceTrace = {status:'referensi-tercatat'|'belum-tertaut'; references:string[]};
export function traceReviewEvidence(review: {evidenceReferences?: unknown} | null | undefined): ReviewEvidenceTrace {
  const raw=review?.evidenceReferences;
  const references=Array.isArray(raw)?[...new Set(raw.filter((value):value is string=>typeof value==='string').map(value=>value.trim()).filter(Boolean))]:[];
  return {status:references.length?'referensi-tercatat':'belum-tertaut',references};
}
