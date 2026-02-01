import { Injectable } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { LogLevel, ActionType } from '@prisma/client';

export interface LogData {
  level?: LogLevel;
  action: ActionType;
  module: string;
  message: string;
  details?: any;
  userId?: string;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
  responseCode?: number;
  duration?: number;
}

@Injectable()
export class SystemLogService {
  constructor(private readonly prisma: PrismaService) {}

  async log(data: LogData) {
    return this.prisma.systemLog.create({
      data: {
        level: data.level || LogLevel.INFO,
        action: data.action,
        module: data.module,
        message: data.message,
        details: data.details,
        userId: data.userId,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        requestPath: data.requestPath,
        requestMethod: data.requestMethod,
        responseCode: data.responseCode,
        duration: data.duration,
      },
    });
  }

  async findAll(query: any, pagination: any) {
    const { level, action, module, userId, startDate, endDate } = query;
    const { page = 1, pageSize = 20 } = pagination;

    const where: any = {};

    if (level) where.level = level;
    if (action) where.action = action;
    if (module) where.module = { contains: module, mode: 'insensitive' };
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const [logs, total] = await Promise.all([
      this.prisma.systemLog.findMany({
        where,
        include: {
          user: {
            select: {
              id: true,
              username: true,
              realName: true,
            },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.systemLog.count({ where }),
    ]);

    return {
      items: logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    };
  }

  async getActionTypes() {
    return Object.values(ActionType);
  }

  async getStats() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [todayLogs, weekLogs, logsByLevel, logsByAction] = await Promise.all([
      this.prisma.systemLog.count({
        where: { createdAt: { gte: today } },
      }),
      this.prisma.systemLog.count({
        where: {
          createdAt: { gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) },
        },
      }),
      this.prisma.systemLog.groupBy({
        by: ['level'],
        _count: true,
        where: { createdAt: { gte: today } },
      }),
      this.prisma.systemLog.groupBy({
        by: ['action'],
        _count: true,
        where: { createdAt: { gte: today } },
      }),
    ]);

    return {
      todayLogs,
      weekLogs,
      byLevel: logsByLevel.map((l) => ({ level: l.level, count: l._count })),
      byAction: logsByAction.map((a) => ({ action: a.action, count: a._count })),
    };
  }
}
