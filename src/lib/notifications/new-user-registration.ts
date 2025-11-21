import { prisma } from '@/lib/database/prisma';
import { getEmailService } from '@/lib/email/email-service';
import { createLogger } from '@/lib/logger';
import { UserRole } from '@/lib/types';

const logger = createLogger('notifications:new-user-registration');

/**
 * Send notification to all admins when a new user registers
 */
export async function notifyAdminsOfNewUser(
  userEmail: string,
  userName: string,
  registrationDate: Date
): Promise<void> {
  try {
    // Get all admin users
    const admins = await prisma.user.findMany({
      where: {
        role: UserRole.ADMIN,
      },
      select: {
        email: true,
        name: true,
      },
    });

    if (admins.length === 0) {
      logger.warn('No admin users found to notify about new registration');
      return;
    }

    const emailService = getEmailService();
    const formattedDate = registrationDate.toLocaleString('pl-PL', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });

    // Send notification to each admin
    const notifications = admins.map(async (admin) => {
      try {
        await emailService.sendNewUserNotificationToAdmin(
          admin.email,
          userEmail,
          userName,
          formattedDate
        );
        logger.info(
          { adminEmail: admin.email, newUserEmail: userEmail },
          'Admin notified of new user registration'
        );
      } catch (error) {
        logger.error(
          { error, adminEmail: admin.email, newUserEmail: userEmail },
          'Failed to send admin notification'
        );
        // Don't throw - continue with other admins
      }
    });

    await Promise.allSettled(notifications);

    logger.info(
      { userEmail, adminCount: admins.length },
      'New user registration notifications sent to admins'
    );
  } catch (error) {
    logger.error(
      { error, userEmail },
      'Failed to notify admins of new user registration'
    );
    // Don't throw - notification failure shouldn't break registration
  }
}
