import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsEnum, IsString, IsDateString } from 'class-validator';
import { LogLevel, ActionType } from '@prisma/client';

export class SystemLogQueryDto {
  @ApiPropertyOptional({ description: '日志级别', enum: LogLevel })
  @IsOptional()
  @IsEnum(LogLevel)
  level?: LogLevel;

  @ApiPropertyOptional({ description: '操作类型', enum: ActionType })
  @IsOptional()
  @IsEnum(ActionType)
  action?: ActionType;

  @ApiPropertyOptional({ description: '模块名称' })
  @IsOptional()
  @IsString()
  module?: string;

  @ApiPropertyOptional({ description: '用户ID' })
  @IsOptional()
  @IsString()
  userId?: string;

  @ApiPropertyOptional({ description: '开始时间' })
  @IsOptional()
  @IsDateString()
  startDate?: string;

  @ApiPropertyOptional({ description: '结束时间' })
  @IsOptional()
  @IsDateString()
  endDate?: string;
}

export class DashboardStatsDto {
  totalUsers: number;
  activeUsers: number;
  totalAnnouncements: number;
  todayLogs: number;
}
