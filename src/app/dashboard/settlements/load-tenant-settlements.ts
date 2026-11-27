import { notFound } from 'next/navigation';

import {
  readSelection,
  type SettlementSearchParams,
} from '@/components/settlements/settlement-search-params';
import { findUserApartmentOptions } from '@/lib/apartments/queries/find-user-apartment-options';
import { requireApprovedTenant } from '@/lib/framework/auth/require-approved-tenant';
import { getTenantHistoryStartYear } from '@/lib/framework/tenant-history';
import { findTenantSettlements } from '@/lib/settlements/queries/find-tenant-settlements';

/** An apartment of the signed-in tenant and its settlements. */
export async function loadTenantSettlements(
  apartmentId: string,
  params: SettlementSearchParams
) {
  const { userId } = await requireApprovedTenant();
  const apartments = await findUserApartmentOptions(userId);
  const apartment = apartments.find((own) => own.id === apartmentId);

  // An apartment of someone else is not found, and nothing of it is read
  if (!apartment) notFound();

  const data = await findTenantSettlements(
    userId,
    apartment.id,
    await getTenantHistoryStartYear(),
    readSelection(params)
  );
  if (!data) notFound();

  return { apartments, apartment, data };
}
