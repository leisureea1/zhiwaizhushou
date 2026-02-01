import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UserStatus, AnnouncementStatus } from '@prisma/client';

@Injectable()
export class AdminService {
  constructor(private readonly prisma: PrismaService) {}

  async getDashboardStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [
      totalUsers,
      activeUsers,
      newUsersToday,
      totalAnnouncements,
      publishedAnnouncements,
      todayLogs,
    ] = await Promise.all([
      this.prisma.user.count(),
      this.prisma.user.count({ where: { status: UserStatus.ACTIVE } }),
      this.prisma.user.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.announcement.count(),
      this.prisma.announcement.count({
        where: { status: AnnouncementStatus.PUBLISHED },
      }),
      this.prisma.systemLog.count({
        where: { createdAt: { gte: today } },
      }),
    ]);

    return {
      users: {
        total: totalUsers,
        active: activeUsers,
        newToday: newUsersToday,
      },
      announcements: {
        total: totalAnnouncements,
        published: publishedAnnouncements,
      },
      logs: {
        todayCount: todayLogs,
      },
    };
  }

  async getPendingItems() {
    const [draftAnnouncements, inactiveUsers] = await Promise.all([
      this.prisma.announcement.count({
        where: { status: AnnouncementStatus.DRAFT },
      }),
      this.prisma.user.count({
        where: { status: UserStatus.INACTIVE },
      }),
    ]);

    return {
      draftAnnouncements,
      inactiveUsers,
    };
  }

  async getFeatureFlags() {
    return this.prisma.featureFlag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async updateFeatureFlag(name: string, isEnabled: boolean) {
    return this.prisma.featureFlag.upsert({
      where: { name },
      update: { isEnabled },
      create: { name, isEnabled },
    });
  }

  async checkFeature(name: string) {
    const flag = await this.prisma.featureFlag.findUnique({
      where: { name },
    });

    return {
      name,
      isEnabled: flag?.isEnabled ?? true,
    };
  }
}
