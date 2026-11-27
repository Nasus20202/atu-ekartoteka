import { prisma } from '@/lib/platform/database/prisma';

export async function getDashboardStats() {
  const [
    hoaCount,
    apartmentCount,
    chargeCount,
    notificationCount,
    paymentCount,
    userCount,
    utilitySettlementCount,
    meterReadingCount,
    annualSettlementCount,
  ] = await Promise.all([
    prisma.homeownersAssociation.count(),
    prisma.apartment.count(),
    prisma.charge.count(),
    prisma.chargeNotification.count(),
    prisma.payment.count(),
    prisma.user.count(),
    prisma.utilitySettlement.count(),
    prisma.meterReading.count(),
    prisma.annualCostSettlement.count(),
  ]);

  return {
    hoa: hoaCount,
    apartments: apartmentCount,
    charges: chargeCount,
    notifications: notificationCount,
    payments: paymentCount,
    users: userCount,
    utilitySettlements: utilitySettlementCount,
    meterReadings: meterReadingCount,
    annualSettlements: annualSettlementCount,
  };
}
