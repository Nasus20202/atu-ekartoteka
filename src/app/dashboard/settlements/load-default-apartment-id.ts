import { findUserApartmentOptions } from '@/lib/apartments/queries/find-user-apartment-options';
import { requireApprovedTenant } from '@/lib/framework/auth/require-approved-tenant';

export async function loadDefaultApartmentId() {
  const { userId } = await requireApprovedTenant();
  const [first] = await findUserApartmentOptions(userId);
  return first?.id ?? null;
}
