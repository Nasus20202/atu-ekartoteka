import type { ConfirmOptions } from '@/components/providers/confirm-dialog';

/** Asks every question in turn; each appears only after the previous yes. */
export async function confirmSteps(
  confirm: (options: ConfirmOptions) => Promise<boolean>,
  steps: ConfirmOptions[]
): Promise<boolean> {
  for (const step of steps) {
    if (!(await confirm(step))) return false;
  }
  return true;
}
