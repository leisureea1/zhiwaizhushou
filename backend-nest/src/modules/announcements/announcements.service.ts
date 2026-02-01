import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto, AnnouncementQueryDto } from './dto';
import { PaginationDto, PaginatedResponse } from '@/common/dto/pagination.dto';
import { AnnouncementStatus, UserRole } from '@prisma/client';

@Injectable()
export class AnnouncementsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateAnnouncementDto, authorId: string) {
    const announcement = await this.prisma.announcement.create({
      data: {
        ...dto,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
        authorId,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            realName: true,
            avatar: true,
          },
        },
      },
    });

    return announcement;
  }

  async findAll(
    query: AnnouncementQueryDto,
    pagination: PaginationDto,
    includeUnpublished = false,
  ) {
    const { keyword, type, status } = query;
    const { page = 1, pageSize = 20 } = pagination;

    const where: any = {};

    if (keyword) {
      where.OR = [
        { title: { contains: keyword, mode: 'insensitive' } },
        { content: { contains: keyword, mode: 'insensitive' } },
      ];
    }

    if (type) {
      where.type = type;
    }

    if (status) {
      where.status = status;
    } else if (!includeUnpublished) {
      // 普通用户只能看已发布的公告
      where.status = AnnouncementStatus.PUBLISHED;
      where.OR = [{ expiresAt: null }, { expiresAt: { gt: new Date() } }];
    }

    const [announcements, total] = await Promise.all([
      this.prisma.announcement.findMany({
        where,
        include: {
          author: {
            select: {
              id: true,
              username: true,
              realName: true,
              avatar: true,
            },
          },
          _count: {
            select: { views: true },
          },
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: [{ isPinned: 'desc' }, { publishedAt: 'desc' }, { createdAt: 'desc' }],
      }),
      this.prisma.announcement.count({ where }),
    ]);

    return new PaginatedResponse(announcements, total, page, pageSize);
  }

  async findById(id: string, userId?: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            realName: true,
            avatar: true,
          },
        },
        attachments: true,
        _count: {
          select: { views: true },
        },
      },
    });

    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }

    // 如果用户已登录，记录浏览
    if (userId) {
      await this.prisma.announcementView.upsert({
        where: {
          announcementId_userId: {
            announcementId: id,
            userId,
          },
        },
        update: { viewedAt: new Date() },
        create: {
          announcementId: id,
          userId,
        },
      });
    }

    return announcement;
  }

  async update(id: string, dto: UpdateAnnouncementDto, userId: string, userRole: UserRole) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }

    // 只有作者或管理员可以修改
    if (announcement.authorId !== userId && userRole === UserRole.USER) {
      throw new ForbiddenException('无权修改此公告');
    }

    return this.prisma.announcement.update({
      where: { id },
      data: {
        ...dto,
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : undefined,
      },
      include: {
        author: {
          select: {
            id: true,
            username: true,
            realName: true,
            avatar: true,
          },
        },
      },
    });
  }

  async delete(id: string, userId: string, userRole: UserRole) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }

    // 只有作者或管理员可以删除
    if (announcement.authorId !== userId && userRole === UserRole.USER) {
      throw new ForbiddenException('无权删除此公告');
    }

    await this.prisma.announcement.delete({
      where: { id },
    });

    return { message: '公告删除成功' };
  }

  async publish(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }

    return this.prisma.announcement.update({
      where: { id },
      data: {
        status: AnnouncementStatus.PUBLISHED,
        publishedAt: new Date(),
      },
    });
  }

  async togglePin(id: string) {
    const announcement = await this.prisma.announcement.findUnique({
      where: { id },
    });

    if (!announcement) {
      throw new NotFoundException('公告不存在');
    }

    return this.prisma.announcement.update({
      where: { id },
      data: {
        isPinned: !announcement.isPinned,
      },
    });
  }

  async markViewed(id: string, userId: string) {
    await this.prisma.announcementView.upsert({
      where: {
        announcementId_userId: {
          announcementId: id,
          userId,
        },
      },
      update: { viewedAt: new Date() },
      create: {
        announcementId: id,
        userId,
      },
    });

    return { message: '已标记为已读' };
  }

  async getUnviewedCount(userId: string) {
    const viewedIds = await this.prisma.announcementView.findMany({
      where: { userId },
      select: { announcementId: true },
    });

    const count = await this.prisma.announcement.count({
      where: {
        status: AnnouncementStatus.PUBLISHED,
        id: {
          notIn: viewedIds.map((v) => v.announcementId),
        },
        OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
      },
    });

    return { unviewedCount: count };
  }
}
