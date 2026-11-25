import { PACKAGE_WORKFLOW_ITEMS } from '../../workflow/roleNavigation';

/**
 * Whether a stage tile shows as completed. Server mode passes the stages the
 * server reports complete; otherwise stages before the current local position count.
 */
export function stageDone(code: string, process: string, completed?: ReadonlySet<string>): boolean {
  if (completed) return completed.has(code);
  if (process === 'Selesai') return true;
  const index = PACKAGE_WORKFLOW_ITEMS.findIndex(item => item.code === code);
  const current = PACKAGE_WORKFLOW_ITEMS.findIndex(item => item.code === process);
  return index >= 0 && current >= 0 && index < current;
}
