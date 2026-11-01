import { cache } from 'react';

import { auth } from '@/auth';
import { isApprovedAccount } from '@/lib/auth/account-access';
import {
  formatAdminApartmentTitle,
  formatChargesTitle,
  formatPaymentsYearTitle,
  PAGE_TITLES,
} from '@/lib/metadata/document-title';
import {
  findApartmentWithHoaName,
  findOwnedApartmentLabel,
} from '@/lib/queries/apartments/find-apartment-label';
import { findHoaName } from '@/lib/queries/hoa/find-hoa-name';
import { findUserByIdCached } from '@/lib/queries/users/find-user-by-id';
import { UserRole } from '@/lib/types';
import { formatApartmentLabel } from '@/lib/utils/apartment-label';

/** One session lookup per request, shared by the layout and page metadata. */
const getSession = cache(() => auth());

async function isAdminSession(): Promise<boolean> {
  const session = await getSession();
  return session?.user?.role === UserRole.ADMIN;
}

/** Address label of the apartment, only for its approved owner; null otherwise. */
async function getOwnedApartmentLabel(
  apartmentId: string
): Promise<string | null> {
  const session = await getSession();
  if (!session) return null;

  const user = await findUserByIdCached(session.user.id);
  if (!isApprovedAccount(user)) return null;

  const apartment = await findOwnedApartmentLabel(apartmentId, session.user.id);
  return apartment ? formatApartmentLabel(apartment) : null;
}

/** Admin HOA page title: the HOA name for admins, a generic title otherwise. */
export async function getHoaApartmentsTitle(hoaId: string): Promise<string> {
  if (!(await isAdminSession())) return PAGE_TITLES.hoaApartmentsFallback;

  const hoa = await findHoaName(hoaId);
  return hoa?.name ?? PAGE_TITLES.hoaApartmentsFallback;
}

/** Admin apartment page title: the number and HOA name for admins only. */
export async function getApartmentTitle(apartmentId: string): Promise<string> {
  if (!(await isAdminSession())) return PAGE_TITLES.apartment;

  const apartment = await findApartmentWithHoaName(apartmentId);
  if (!apartment) return PAGE_TITLES.apartment;

  return formatAdminApartmentTitle(
    apartment.number,
    apartment.homeownersAssociation.name
  );
}

/** Tenant charges page title, with the address only for the owner. */
export async function getChargesTitle(apartmentId: string): Promise<string> {
  return formatChargesTitle(await getOwnedApartmentLabel(apartmentId));
}

/** Tenant payment year page title; year is null when it did not parse. */
export async function getPaymentsYearTitle(
  apartmentId: string,
  year: number | null
): Promise<string> {
  return formatPaymentsYearTitle(
    year,
    await getOwnedApartmentLabel(apartmentId)
  );
}
