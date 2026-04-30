import type {
  Apartment,
  ChargeNotification,
  HomeownersAssociation,
  User,
} from '@/lib/types';
import type { ChargePeriodItemDto } from '@/lib/types/dto/charge-dto';
import type { PaymentPdfDto } from '@/lib/types/dto/payment-dto';
import { type DecimalLike, toDecimal } from '@/lib/utils/decimal';

type ApartmentSummaryKey =
  | 'id'
  | 'externalOwnerId'
  | 'externalApartmentId'
  | 'owner'
  | 'email'
  | 'address'
  | 'building'
  | 'number'
  | 'postalCode'
  | 'city'
  | 'shareNumerator'
  | 'shareDenominator'
  | 'isActive';

type ChargeNotificationAmountKey = 'quantity' | 'unitPrice' | 'totalAmount';
type ChargeNotificationDateKey = 'createdAt' | 'updatedAt';

export type ApartmentSummaryDtoSource = Pick<Apartment, ApartmentSummaryKey>;

export type ApartmentSummaryDto = ApartmentSummaryDtoSource;

export type HomeownersAssociationSummaryDtoSource = Pick<
  HomeownersAssociation,
  'id' | 'externalId' | 'name'
>;

export type HomeownersAssociationSummaryDto =
  HomeownersAssociationSummaryDtoSource;

export type ApartmentAssignedUserDtoSource = Pick<
  User,
  'id' | 'name' | 'email'
>;

export type ApartmentAssignedUserDto = ApartmentAssignedUserDtoSource;

type ChargeNotificationBaseFields = Pick<
  ChargeNotification,
  'id' | 'lineNo' | 'description' | 'unit'
>;

export type ChargeNotificationDtoSource = ChargeNotificationBaseFields &
  Record<ChargeNotificationAmountKey, DecimalLike> &
  Record<ChargeNotificationDateKey, Date | string>;

export type ChargeNotificationDto = ChargeNotificationBaseFields &
  Record<ChargeNotificationAmountKey, string> &
  Record<ChargeNotificationDateKey, string>;

export type ApartmentDetailDtoSource = ApartmentSummaryDtoSource & {
  homeownersAssociation: HomeownersAssociationSummaryDtoSource;
  user: ApartmentAssignedUserDtoSource | null;
  charges: ChargePeriodItemDto[];
  chargeNotifications: ChargeNotificationDtoSource[];
  payments: PaymentPdfDto[];
};

export type ApartmentDetailDto = ApartmentSummaryDto & {
  homeownersAssociation: HomeownersAssociationSummaryDto;
  user: ApartmentAssignedUserDto | null;
  charges: ChargePeriodItemDto[];
  chargeNotifications: ChargeNotificationDto[];
  payments: PaymentPdfDto[];
};

function toIsoString(value: Date | string): string {
  return value instanceof Date ? value.toISOString() : String(value);
}

export function toApartmentSummaryDto(
  apartment: ApartmentSummaryDtoSource
): ApartmentSummaryDto {
  return {
    id: apartment.id,
    externalOwnerId: apartment.externalOwnerId,
    externalApartmentId: apartment.externalApartmentId,
    owner: apartment.owner,
    email: apartment.email,
    address: apartment.address,
    building: apartment.building,
    number: apartment.number,
    postalCode: apartment.postalCode,
    city: apartment.city,
    shareNumerator: apartment.shareNumerator,
    shareDenominator: apartment.shareDenominator,
    isActive: apartment.isActive,
  };
}

export function toHomeownersAssociationSummaryDto(
  homeownersAssociation: HomeownersAssociationSummaryDtoSource
): HomeownersAssociationSummaryDto {
  return {
    id: homeownersAssociation.id,
    externalId: homeownersAssociation.externalId,
    name: homeownersAssociation.name,
  };
}

export function toChargeNotificationDto(
  notification: ChargeNotificationDtoSource
): ChargeNotificationDto {
  return {
    id: notification.id,
    lineNo: notification.lineNo,
    description: notification.description,
    quantity: toDecimal(notification.quantity).toString(),
    unit: notification.unit,
    unitPrice: toDecimal(notification.unitPrice).toString(),
    totalAmount: toDecimal(notification.totalAmount).toString(),
    createdAt: toIsoString(notification.createdAt),
    updatedAt: toIsoString(notification.updatedAt),
  };
}

export function toApartmentDetailDto(
  apartment: ApartmentDetailDtoSource
): ApartmentDetailDto {
  return {
    ...toApartmentSummaryDto(apartment),
    homeownersAssociation: toHomeownersAssociationSummaryDto(
      apartment.homeownersAssociation
    ),
    user: apartment.user
      ? {
          id: apartment.user.id,
          name: apartment.user.name,
          email: apartment.user.email,
        }
      : null,
    charges: apartment.charges,
    chargeNotifications: apartment.chargeNotifications.map(
      toChargeNotificationDto
    ),
    payments: apartment.payments,
  };
}
