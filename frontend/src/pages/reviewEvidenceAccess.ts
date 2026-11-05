/** Defense in depth for dashboard drill-down. The caller must pass package IDs
 * already scoped by the application session; this does not replace server authorization. */
export function isReviewPackageInScope(packageId:string,allowedPackageIds:ReadonlySet<string>):boolean {
 return typeof packageId==='string' && packageId.length>0 && allowedPackageIds.has(packageId);
}
