import { Controller, Get, Post, Body, Query, Param, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { AdminService } from './services/admin.service';
import { SystemLogService } from './services/system-log.service';
import { SystemLogQueryDto } from './dto';
import { PaginationDto } from '@/common/dto/pagination.dto';
import { Roles } from '@/common/decorators/roles.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from '@/common/guards/roles.guard';
import { UserRole } from '@prisma/client';

@ApiTags('管理后台')
@Controller('admin')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
@ApiBearerAuth()
export class AdminController {
  constructor(
    private readonly adminService: AdminService,
    private readonly systemLogService: SystemLogService,
  ) {}

  @Get('dashboard/stats')
  @ApiOperation({ summary: '获取仪表盘统计数据' })
  @ApiResponse({ status: 200, description: '成功' })
  async getDashboardStats() {
    return this.adminService.getDashboardStats();
  }

  @Get('dashboard/pending-items')
  @ApiOperation({ summary: '获取待处理项' })
  @ApiResponse({ status: 200, description: '成功' })
  async getPendingItems() {
    return this.adminService.getPendingItems();
  }

  @Get('system-logs')
  @ApiOperation({ summary: '查询系统日志' })
  @ApiResponse({ status: 200, description: '成功' })
  async getSystemLogs(@Query() query: SystemLogQueryDto, @Query() pagination: PaginationDto) {
    return this.systemLogService.findAll(query, pagination);
  }

  @Get('system-logs/action-types')
  @ApiOperation({ summary: '获取操作类型列表' })
  async getActionTypes() {
    return this.systemLogService.getActionTypes();
  }

  @Get('system-logs/stats')
  @ApiOperation({ summary: '获取日志统计' })
  async getLogStats() {
    return this.systemLogService.getStats();
  }

  @Get('features')
  @ApiOperation({ summary: '获取功能开关列表' })
  async getFeatureFlags() {
    return this.adminService.getFeatureFlags();
  }

  @Post('features/:name')
  @ApiOperation({ summary: '更新功能开关' })
  async updateFeatureFlag(@Param('name') name: string, @Body('isEnabled') isEnabled: boolean) {
    return this.adminService.updateFeatureFlag(name, isEnabled);
  }
}
