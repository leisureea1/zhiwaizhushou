import {
  Injectable,
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '@/prisma/prisma.service';
import { UpdateUserDto, AdminUpdateUserDto, UserQueryDto } from './dto';
import { PaginationDto, PaginatedResponse } from '@/common/dto/pagination.dto';
import { UserRole, Prisma } from '@prisma/client';

@Injectable()
export class UsersService {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        studentId: true,
        realName: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true,
        college: true,
        major: true,
        className: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    return user;
  }

  async findAll(query: UserQueryDto, pagination: PaginationDto) {
    const { keyword, role, status } = query;
    const { page = 1, pageSize = 20 } = pagination;

    const where: Prisma.UserWhereInput = {};

    if (keyword) {
      where.OR = [
        { username: { contains: keyword, mode: 'insensitive' } },
        { email: { contains: keyword, mode: 'insensitive' } },
        { phone: { contains: keyword } },
        { realName: { contains: keyword } },
        { studentId: { contains: keyword } },
      ];
    }

    if (role) {
      where.role = role;
    }

    if (status) {
      where.status = status;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        select: {
          id: true,
          username: true,
          email: true,
          phone: true,
          studentId: true,
          realName: true,
          nickname: true,
          avatar: true,
          role: true,
          status: true,
          createdAt: true,
          lastLoginAt: true,
        },
        skip: (page - 1) * pageSize,
        take: pageSize,
        orderBy: { createdAt: 'desc' },
      }),
      this.prisma.user.count({ where }),
    ]);

    return new PaginatedResponse(users, total, page, pageSize);
  }

  async update(id: string, dto: UpdateUserDto, currentUserId: string) {
    // 只能修改自己的资料，管理员除外
    if (id !== currentUserId) {
      const currentUser = await this.prisma.user.findUnique({
        where: { id: currentUserId },
        select: { role: true },
      });

      if (currentUser?.role === UserRole.USER) {
        throw new ForbiddenException('无权修改其他用户的资料');
      }
    }

    // 检查邮箱和手机号是否被占用
    if (dto.email || dto.phone) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [dto.email ? { email: dto.email } : {}, dto.phone ? { phone: dto.phone } : {}].filter(
            (condition) => Object.keys(condition).length > 0,
          ),
        },
      });

      if (existingUser) {
        if (dto.email && existingUser.email === dto.email) {
          throw new ConflictException('邮箱已被其他用户使用');
        }
        if (dto.phone && existingUser.phone === dto.phone) {
          throw new ConflictException('手机号已被其他用户使用');
        }
      }
    }

    const user = await this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        studentId: true,
        realName: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });

    return user;
  }

  async updateAvatar(id: string, avatar: string) {
    const user = await this.prisma.user.update({
      where: { id },
      data: { avatar },
      select: {
        id: true,
        avatar: true,
      },
    });

    return user;
  }

  async adminUpdate(id: string, dto: AdminUpdateUserDto) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    // 不能修改超级管理员
    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('不能修改超级管理员');
    }

    return this.prisma.user.update({
      where: { id },
      data: dto,
      select: {
        id: true,
        username: true,
        email: true,
        phone: true,
        studentId: true,
        realName: true,
        nickname: true,
        avatar: true,
        role: true,
        status: true,
        createdAt: true,
        lastLoginAt: true,
      },
    });
  }

  async delete(id: string) {
    const user = await this.prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new NotFoundException('用户不存在');
    }

    if (user.role === UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('不能删除超级管理员');
    }

    await this.prisma.user.delete({
      where: { id },
    });

    return { message: '用户删除成功' };
  }

  async getNotificationSettings(userId: string) {
    let settings = await this.prisma.notificationSetting.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await this.prisma.notificationSetting.create({
        data: { userId },
      });
    }

    return settings;
  }

  async updateNotificationSettings(
    userId: string,
    data: Prisma.NotificationSettingUncheckedUpdateInput,
  ) {
    const settings = await this.prisma.notificationSetting.upsert({
      where: { userId },
      update: data,
      create: { userId, ...data } as Prisma.NotificationSettingUncheckedCreateInput,
    });

    return settings;
  }
}
