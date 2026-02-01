import { Controller, Get, Put, Post, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { UsersService } from './users.service';
import { UpdateUserDto, AdminUpdateUserDto, UserQueryDto, UpdateAvatarDto } from './dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('用户')
@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get('me')
  @ApiOperation({ summary: '获取当前用户信息' })
  @ApiResponse({ status: 200, description: '成功' })
  async getMe(@CurrentUser('id') userId: string) {
    return this.usersService.findById(userId);
  }

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '获取用户列表（管理员）' })
  @ApiResponse({ status: 200, description: '成功' })
  async findAll(@Query() query: UserQueryDto, @Query() pagination: PaginationDto) {
    return this.usersService.findAll(query, pagination);
  }

  @Get(':id')
  @ApiOperation({ summary: '获取用户详情' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '用户不存在' })
  async findOne(@Param('id') id: string) {
    return this.usersService.findById(id);
  }

  @Put(':id')
  @ApiOperation({ summary: '更新用户资料' })
  @ApiResponse({ status: 200, description: '更新成功' })
  @ApiResponse({ status: 403, description: '无权修改' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    return this.usersService.update(id, dto, currentUserId);
  }

  @Post(':id/avatar')
  @ApiOperation({ summary: '更新用户头像' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async updateAvatar(
    @Param('id') id: string,
    @Body() dto: UpdateAvatarDto,
    @CurrentUser('id') currentUserId: string,
  ) {
    // 只能更新自己的头像
    if (id !== currentUserId) {
      return this.usersService.findById(id); // 抛出权限错误
    }
    return this.usersService.updateAvatar(id, dto.avatar);
  }

  @Put(':id/admin')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '管理员更新用户（包括角色、状态）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async adminUpdate(@Param('id') id: string, @Body() dto: AdminUpdateUserDto) {
    return this.usersService.adminUpdate(id, dto);
  }

  @Delete(':id')
  @Roles(UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '删除用户（超级管理员）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async delete(@Param('id') id: string) {
    return this.usersService.delete(id);
  }

  @Get('notifications/settings')
  @ApiOperation({ summary: '获取通知设置' })
  async getNotificationSettings(@CurrentUser('id') userId: string) {
    return this.usersService.getNotificationSettings(userId);
  }

  @Post('notifications/settings')
  @ApiOperation({ summary: '更新通知设置' })
  async updateNotificationSettings(@CurrentUser('id') userId: string, @Body() data: any) {
    return this.usersService.updateNotificationSettings(userId, data);
  }
}
