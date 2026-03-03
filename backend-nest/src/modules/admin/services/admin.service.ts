import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UserStatus, AnnouncementStatus } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

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

  // ========== 系统配置（.env）管理 ==========

  private readonly logger = new Logger(AdminService.name);

  /** 允许通过管理后台修改的配置项白名单 */
  private readonly editableKeys = [
    'PORT',
    'CORS_ORIGINS',
    'JWT_ACCESS_EXPIRATION',
    'JWT_REFRESH_EXPIRATION',
    'MAIL_HOST',
    'MAIL_PORT',
    'MAIL_SECURE',
    'MAIL_USER',
    'MAIL_PASSWORD',
    'MAIL_FROM',
    'MAIL_FROM_NAME',
    'JWXT_SERVICE_URL',
    'JWXT_SERVICE_API_KEY',
    'UPLOAD_DIR',
    'MAX_FILE_SIZE',
    'THROTTLE_TTL',
    'THROTTLE_LIMIT',
  ];

  /** 敏感配置项，读取时做脱敏 */
  private readonly sensitiveKeys = [
    'JWT_SECRET',
    'JWT_REFRESH_SECRET',
    'MAIL_PASSWORD',
    'JWXT_SERVICE_API_KEY',
    'DATABASE_URL',
    'REDIS_PASSWORD',
  ];

  /** 配置分组定义 */
  private readonly configGroups = [
    {
      label: '基础配置',
      keys: ['PORT', 'CORS_ORIGINS'],
    },
    {
      label: 'JWT 认证',
      keys: ['JWT_ACCESS_EXPIRATION', 'JWT_REFRESH_EXPIRATION'],
    },
    {
      label: '邮件配置',
      keys: [
        'MAIL_HOST',
        'MAIL_PORT',
        'MAIL_SECURE',
        'MAIL_USER',
        'MAIL_PASSWORD',
        'MAIL_FROM',
        'MAIL_FROM_NAME',
      ],
    },
    {
      label: '教务服务',
      keys: ['JWXT_SERVICE_URL', 'JWXT_SERVICE_API_KEY'],
    },
    {
      label: '文件上传',
      keys: ['UPLOAD_DIR', 'MAX_FILE_SIZE'],
    },
    {
      label: '限流配置',
      keys: ['THROTTLE_TTL', 'THROTTLE_LIMIT'],
    },
  ];

  private getEnvPath(): string {
    return path.resolve(process.cwd(), '.env');
  }

  private parseEnvFile(): Record<string, string> {
    const envPath = this.getEnvPath();
    if (!fs.existsSync(envPath)) return {};

    const content = fs.readFileSync(envPath, 'utf-8');
    const result: Record<string, string> = {};

    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) continue;
      const key = trimmed.slice(0, eqIdx).trim();
      const value = trimmed.slice(eqIdx + 1).trim();
      result[key] = value;
    }
    return result;
  }

  private writeEnvFile(envMap: Record<string, string>) {
    const envPath = this.getEnvPath();
    // 保留原始文件中的注释和空行结构
    let originalContent = '';
    if (fs.existsSync(envPath)) {
      originalContent = fs.readFileSync(envPath, 'utf-8');
    }

    const updatedKeys = new Set<string>();
    const lines = originalContent.split('\n').map((line) => {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) return line;
      const eqIdx = trimmed.indexOf('=');
      if (eqIdx === -1) return line;
      const key = trimmed.slice(0, eqIdx).trim();
      if (key in envMap) {
        updatedKeys.add(key);
        return `${key}=${envMap[key]}`;
      }
      return line;
    });

    // 追加新增的配置项
    for (const [key, value] of Object.entries(envMap)) {
      if (!updatedKeys.has(key)) {
        lines.push(`${key}=${value}`);
      }
    }

    fs.writeFileSync(envPath, lines.join('\n'), 'utf-8');
  }

  async getConfig() {
    const envMap = this.parseEnvFile();
    const configs: Record<string, string> = {};

    for (const key of this.editableKeys) {
      const raw = envMap[key] ?? '';
      configs[key] = this.sensitiveKeys.includes(key) ? this.maskValue(raw) : raw;
    }

    return {
      configs,
      groups: this.configGroups,
      editableKeys: this.editableKeys,
    };
  }

  async updateConfig(newConfigs: Record<string, string>) {
    const envMap = this.parseEnvFile();
    const changes: string[] = [];

    for (const [key, value] of Object.entries(newConfigs)) {
      if (!this.editableKeys.includes(key)) {
        this.logger.warn(`Attempted to modify non-editable config: ${key}`);
        continue;
      }
      // 如果值是脱敏的（全是 *），跳过不修改
      if (/^\*+$/.test(value)) continue;

      if (envMap[key] !== value) {
        changes.push(key);
        envMap[key] = value;
      }
    }

    if (changes.length > 0) {
      this.writeEnvFile(envMap);
      this.logger.log(`Config updated: ${changes.join(', ')}`);
    }

    return {
      updated: changes,
      message:
        changes.length > 0
          ? `已更新 ${changes.length} 项配置，部分配置需要重启服务后生效`
          : '没有需要更新的配置',
    };
  }

  private maskValue(value: string): string {
    if (!value) return '';
    if (value.length <= 4) return '****';
    return value.slice(0, 2) + '*'.repeat(value.length - 4) + value.slice(-2);
  }
}
