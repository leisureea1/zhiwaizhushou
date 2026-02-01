import { Controller, Get, Post, Put, Delete, Body, Param, Query, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AnnouncementsService } from './announcements.service';
import { CreateAnnouncementDto, UpdateAnnouncementDto, AnnouncementQueryDto } from './dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { Public } from '@/common/decorators/public.decorator';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('公告')
@Controller('announcements')
@UseGuards(JwtAuthGuard, RolesGuard)
@ApiBearerAuth()
export class AnnouncementsController {
  constructor(private readonly announcementsService: AnnouncementsService) {}

  @Get()
  @Public()
  @ApiOperation({ summary: '获取公告列表' })
  @ApiResponse({ status: 200, description: '成功' })
  async findAll(
    @Query() query: AnnouncementQueryDto,
    @Query() pagination: PaginationDto,
    @CurrentUser() user?: any,
  ) {
    const includeUnpublished = user?.role && user.role !== UserRole.USER;
    return this.announcementsService.findAll(query, pagination, includeUnpublished);
  }

  @Get('unviewed-count')
  @ApiOperation({ summary: '获取未读公告数量' })
  async getUnviewedCount(@CurrentUser('id') userId: string) {
    return this.announcementsService.getUnviewedCount(userId);
  }

  @Get(':id')
  @Public()
  @ApiOperation({ summary: '获取公告详情' })
  @ApiResponse({ status: 200, description: '成功' })
  @ApiResponse({ status: 404, description: '公告不存在' })
  async findOne(@Param('id') id: string, @CurrentUser('id') userId?: string) {
    return this.announcementsService.findById(id, userId);
  }

  @Post()
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '创建公告（管理员）' })
  @ApiResponse({ status: 201, description: '创建成功' })
  async create(@Body() dto: CreateAnnouncementDto, @CurrentUser('id') authorId: string) {
    return this.announcementsService.create(dto, authorId);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '更新公告（管理员）' })
  @ApiResponse({ status: 200, description: '更新成功' })
  async update(
    @Param('id') id: string,
    @Body() dto: UpdateAnnouncementDto,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.announcementsService.update(id, dto, userId, userRole);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '删除公告（管理员）' })
  @ApiResponse({ status: 200, description: '删除成功' })
  async delete(
    @Param('id') id: string,
    @CurrentUser('id') userId: string,
    @CurrentUser('role') userRole: UserRole,
  ) {
    return this.announcementsService.delete(id, userId, userRole);
  }

  @Post(':id/publish')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '发布公告（管理员）' })
  async publish(@Param('id') id: string) {
    return this.announcementsService.publish(id);
  }

  @Post(':id/pin')
  @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
  @ApiOperation({ summary: '置顶/取消置顶公告（管理员）' })
  async togglePin(@Param('id') id: string) {
    return this.announcementsService.togglePin(id);
  }

  @Post(':id/mark-viewed')
  @ApiOperation({ summary: '标记公告为已读' })
  async markViewed(@Param('id') id: string, @CurrentUser('id') userId: string) {
    return this.announcementsService.markViewed(id, userId);
  }
}
