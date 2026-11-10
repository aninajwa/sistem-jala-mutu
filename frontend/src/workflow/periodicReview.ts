import type { SurveyType, VervalCycle } from "./model";
export function reviewSurvey(
  cycle: VervalCycle,
  type: SurveyType,
  patch: Partial<VervalCycle>,
  date: string,
  selectedTypes:SurveyType[]=cycle.selectedTypes,
): Partial<VervalCycle> {
  const previous = cycle.surveyReviews?.[type];
  const surveyReviews = {
    ...cycle.surveyReviews,
    [type]: {
      decision: patch.userReview ?? previous?.decision ?? "Belum Diperiksa",
      note: patch.userReviewNote ?? previous?.note ?? "",
      reviewedAt: patch.userReview ? date : previous?.reviewedAt ?? "",
    },
  };
  const decided = patch.userReview === "Sesuai" || patch.userReview === "Temuan";
  const reviewPendingTypes=(cycle.reviewPendingTypes??[]).filter(item=>!decided || item!==type);
  const decisions = selectedTypes.map(
    (type) => reviewPendingTypes.includes(type)?undefined:surveyReviews[type]?.decision,
  );
  const userReview =
    decisions.length && decisions.every((value) => value === "Sesuai")
      ? "Sesuai"
      : decisions.includes("Temuan")
        ? "Temuan"
        : "Belum Diperiksa";
  return {
    ...patch,
    surveyReviews,
    reviewPendingTypes,
    userReview,
    userReviewNote: surveyReviews[type]?.note ?? "",
  };
}

export function affectedReviewTypes(types:SurveyType[],before:VervalCycle,patch:Partial<VervalCycle>):SurveyType[]{
 const changed=Object.keys(patch).filter(key=>JSON.stringify(before[key as keyof VervalCycle])!==JSON.stringify(patch[key as keyof VervalCycle]));
 const affected=new Set<SurveyType>();
 for(const key of changed){if(key==='iriCoefficientVariation')affected.add('IRI');else if(key==='pciAiStandardDeviation'||key==='pciManualMaxDifferencePercent')affected.add('PCI');
 else if(key==='checkedProtocols'){for(const protocol of new Set([...Object.keys(before.checkedProtocols),...Object.keys(patch.checkedProtocols??{})]))if(before.checkedProtocols[protocol]!==patch.checkedProtocols?.[protocol]){const survey=types.find(type=>protocol.startsWith(type+' · '));if(survey)affected.add(survey);else types.forEach(type=>affected.add(type));}}
 else if(key==='selectedTypes'||key==='reRatingStatus')types.forEach(type=>affected.add(type));}
 return [...affected].filter(type=>types.includes(type));
}

/** Notes do not approve a survey, clear pending work, or invalidate unrelated audits. */
export function periodicNoteOnly(before:VervalCycle,patch:Partial<VervalCycle>):boolean {
 return Object.entries(patch).every(([key,value])=>{
  if(key==='userReviewNote')return true;
  if(key==='surveyReviews'){
   const next=patch.surveyReviews??{};
   return [...new Set([...Object.keys(before.surveyReviews??{}),...Object.keys(next)])].every(type=>{
    const old=before.surveyReviews?.[type as SurveyType],review=next[type as SurveyType];
    return (old?.decision??'Belum Diperiksa')===(review?.decision??'Belum Diperiksa')&&
      (old?.reviewedAt??'')===(review?.reviewedAt??'')&&JSON.stringify(old?.evidenceReferences)===JSON.stringify(review?.evidenceReferences);
   });
  }
  return JSON.stringify(before[key as keyof VervalCycle])===JSON.stringify(value);
 });
}
