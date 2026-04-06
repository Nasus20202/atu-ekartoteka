import { prisma } from '@/lib/database/prisma';

export async function getDashboardStats() {
  const [
    hoaCount,
    apartmentCount,
    chargeCount,
    notificationCount,
    paymentCount,
    userCount,
  ] = await Promise.all([
    prisma.homeownersAssociation.count(),
    prisma.apartment.count(),
    prisma.charge.count(),
    prisma.chargeNotification.count(),
    prisma.payment.count(),
    prisma.user.count(),
  ]);

  return {
    hoa: hoaCount,
    apartments: apartmentCount,
    charges: chargeCount,
    notifications: notificationCount,
    payments: paymentCount,
    users: userCount,
  };
}
