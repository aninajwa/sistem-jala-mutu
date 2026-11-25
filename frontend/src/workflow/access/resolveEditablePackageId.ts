/** Match the package rendered by the workspace with the package being edited.
 * The fallback is only allowed when no package has been selected; an
 * explicit but inaccessible selection must not silently switch packages. */
export function resolveEditablePackageId(
  activePackageId: string | null,
  visiblePackageIds: readonly string[],
): string | null {
  if (activePackageId !== null) {
    return visiblePackageIds.includes(activePackageId) ? activePackageId : null;
  }
  return visiblePackageIds[0] ?? null;
}
