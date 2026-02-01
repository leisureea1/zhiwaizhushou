import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsOptional, IsEnum, IsBoolean, IsDateString, IsNotEmpty } from 'class-validator';
import { AnnouncementType, AnnouncementStatus } from '@prisma/client';

export class CreateAnnouncementDto {
  @ApiProperty({ description: '公告标题' })
  @IsNotEmpty({ message: '标题不能为空' })
  @IsString()
  title: string;

  @ApiProperty({ description: '公告内容' })
  @IsNotEmpty({ message: '内容不能为空' })
  @IsString()
  content: string;

  @ApiPropertyOptional({ description: '摘要' })
  @IsOptional()
  @IsString()
  summary?: string;

  @ApiPropertyOptional({ description: '公告类型', enum: AnnouncementType })
  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType;

  @ApiPropertyOptional({ description: '是否置顶' })
  @IsOptional()
  @IsBoolean()
  isPinned?: boolean;

  @ApiPropertyOptional({ description: '是否弹窗显示' })
  @IsOptional()
  @IsBoolean()
  isPopup?: boolean;

  @ApiPropertyOptional({ description: '过期时间' })
  @IsOptional()
  @IsDateString()
  expiresAt?: string;
}

export class UpdateAnnouncementDto extends CreateAnnouncementDto {
  @ApiPropertyOptional({ description: '公告状态', enum: AnnouncementStatus })
  @IsOptional()
  @IsEnum(AnnouncementStatus)
  status?: AnnouncementStatus;
}

export class AnnouncementQueryDto {
  @ApiPropertyOptional({ description: '搜索关键字' })
  @IsOptional()
  @IsString()
  keyword?: string;

  @ApiPropertyOptional({ description: '公告类型', enum: AnnouncementType })
  @IsOptional()
  @IsEnum(AnnouncementType)
  type?: AnnouncementType;

  @ApiPropertyOptional({ description: '公告状态', enum: AnnouncementStatus })
  @IsOptional()
  @IsEnum(AnnouncementStatus)
  status?: AnnouncementStatus;
}

export class PublishAnnouncementDto {
  @ApiPropertyOptional({ description: '是否立即发布', default: true })
  @IsOptional()
  @IsBoolean()
  immediate?: boolean;

  @ApiPropertyOptional({ description: '定时发布时间' })
  @IsOptional()
  @IsDateString()
  publishAt?: string;
}
