'use server';

import {
  type ActionResult,
  fromUseCaseResult,
  invalid,
  readInput,
} from '@/actions/action-result';
import { requireAdminAction } from '@/lib/framework/auth/require-action';
import {
  bulkAssignAccounts,
  type BulkAssignSummary,
  bulkCreateAccounts,
  type BulkCreateSummary,
} from '@/lib/users/use-cases/bulk-accounts';

const NO_APARTMENTS_MESSAGE = 'Wybierz co najmniej jedno mieszkanie';

function readApartmentIds(input: unknown): string[] | null {
  const { apartmentIds } = readInput(input);

  return Array.isArray(apartmentIds) &&
    apartmentIds.length > 0 &&
    apartmentIds.every((id) => typeof id === 'string')
    ? apartmentIds
    : null;
}

export async function bulkCreateAccountsAction(
  input: unknown
): Promise<ActionResult<BulkCreateSummary>> {
  const { denied } = await requireAdminAction('Unauthorized bulk create');
  if (denied) return denied;

  const apartmentIds = readApartmentIds(input);
  if (!apartmentIds) return invalid(NO_APARTMENTS_MESSAGE);

  return fromUseCaseResult(await bulkCreateAccounts(apartmentIds));
}

export async function bulkAssignAccountsAction(
  input: unknown
): Promise<ActionResult<BulkAssignSummary>> {
  const { denied } = await requireAdminAction('Unauthorized bulk assign');
  if (denied) return denied;

  const apartmentIds = readApartmentIds(input);
  if (!apartmentIds) return invalid(NO_APARTMENTS_MESSAGE);

  return fromUseCaseResult(await bulkAssignAccounts(apartmentIds));
}
