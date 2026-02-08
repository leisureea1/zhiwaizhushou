import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwxtClientService } from '@/services/jwxt-client.service';
import { PrismaService } from '@/prisma/prisma.service';
import { RedisService } from '@/services/redis.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

// 缓存配置
const TOKEN_CACHE_PREFIX = 'jwxt:token:';
const TOKEN_CACHE_TTL = 50 * 60; // 50分钟（Python token有效期1小时，留10分钟余量）
const SEMESTER_CACHE_PREFIX = 'jwxt:semester:';
const SEMESTER_CACHE_TTL = 24 * 60 * 60; // 1天

@ApiTags('教务系统')
@Controller('jwxt')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JwxtController {
  private readonly logger = new Logger(JwxtController.name);

  constructor(
    private readonly jwxtClient: JwxtClientService,
    private readonly prisma: PrismaService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 获取 JWXT Token（带 Redis 缓存，避免每次都重新 CAS 登录）
   */
  private async getJwxtToken(userId: string): Promise<string> {
    // 1. 尝试从缓存获取 token
    const cacheKey = `${TOKEN_CACHE_PREFIX}${userId}`;
    try {
      const cachedToken = await this.redisService.get(cacheKey);
      if (cachedToken) {
        // 验证 token 是否仍然有效
        const isValid = await this.jwxtClient.validateSession(cachedToken);
        if (isValid) {
          this.logger.debug(`[Token Cache HIT] user: ${userId}`);
          return cachedToken;
        }
        this.logger.debug(`[Token Cache EXPIRED] user: ${userId}, re-login`);
      }
    } catch (error) {
      this.logger.warn(`Token cache read error: ${error}`);
    }

    // 2. 缓存未命中或已过期，重新登录
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { jwxtUsername: true, jwxtPassword: true },
    });

    if (!user?.jwxtUsername || !user?.jwxtPassword) {
      throw new HttpException('请先绑定教务系统账号', HttpStatus.BAD_REQUEST);
    }

    const result = await this.jwxtClient.login(user.jwxtUsername, user.jwxtPassword);
    if (!result.success || !result.token) {
      throw new HttpException(result.error || '教务系统登录失败', HttpStatus.BAD_REQUEST);
    }

    // 3. 缓存 token
    try {
      await this.redisService.set(cacheKey, result.token, TOKEN_CACHE_TTL);
      this.logger.debug(`[Token Cache SET] user: ${userId}, TTL: ${TOKEN_CACHE_TTL}s`);
    } catch (error) {
      this.logger.warn(`Token cache write error: ${error}`);
    }

    return result.token;
  }

  @Get('course')
  @ApiOperation({ summary: '获取课表' })
  @ApiResponse({ status: 200, description: '成功' })
  async getCourses(@CurrentUser('id') userId: string, @Query('semester_id') semesterId?: string) {
    const token = await this.getJwxtToken(userId);
    return this.jwxtClient.getCourses(token, semesterId, userId);
  }

  @Get('course/refresh')
  @ApiOperation({ summary: '刷新课表（清除缓存重新获取）' })
  @ApiResponse({ status: 200, description: '成功' })
  async refreshCourses(
    @CurrentUser('id') userId: string,
    @Query('semester_id') semesterId?: string,
  ) {
    // 先清除缓存
    await this.jwxtClient.clearCourseCache(userId);
    // 重新获取
    const token = await this.getJwxtToken(userId);
    return this.jwxtClient.getCourses(token, semesterId, userId);
  }

  @Get('grade')
  @ApiOperation({ summary: '获取成绩' })
  @ApiResponse({ status: 200, description: '成功' })
  async getGrades(@CurrentUser('id') userId: string, @Query('semester_id') semesterId?: string) {
    const token = await this.getJwxtToken(userId);
    return this.jwxtClient.getGrades(token, semesterId);
  }

  @Get('exam')
  @ApiOperation({ summary: '获取考试安排' })
  @ApiResponse({ status: 200, description: '成功' })
  async getExams(@CurrentUser('id') userId: string, @Query('semester_id') semesterId?: string) {
    const token = await this.getJwxtToken(userId);
    return this.jwxtClient.getExams(token, semesterId);
  }

  @Get('semester')
  @ApiOperation({ summary: '获取学期列表' })
  @ApiResponse({ status: 200, description: '成功' })
  async getSemesters(@CurrentUser('id') userId: string) {
    // 学期数据几乎不变，优先从缓存读取
    const cacheKey = `${SEMESTER_CACHE_PREFIX}${userId}`;
    try {
      const cached = await this.redisService.get(cacheKey);
      if (cached) {
        this.logger.debug(`[Semester Cache HIT] user: ${userId}`);
        return JSON.parse(cached);
      }
    } catch (error) {
      this.logger.warn(`Semester cache read error: ${error}`);
    }

    const token = await this.getJwxtToken(userId);
    const data = await this.jwxtClient.getSemesters(token);

    // 缓存学期数据
    try {
      await this.redisService.set(cacheKey, JSON.stringify(data), SEMESTER_CACHE_TTL);
      this.logger.debug(`[Semester Cache SET] user: ${userId}`);
    } catch (error) {
      this.logger.warn(`Semester cache write error: ${error}`);
    }

    return data;
  }

  @Get('evaluation/pending')
  @ApiOperation({ summary: '获取待评教列表' })
  @ApiResponse({ status: 200, description: '成功' })
  async getEvaluationPending(@CurrentUser('id') userId: string) {
    const token = await this.getJwxtToken(userId);
    return this.jwxtClient.getEvaluationPending(token);
  }

  @Post('evaluation/auto')
  @ApiOperation({ summary: '一键评教' })
  @ApiResponse({ status: 200, description: '成功' })
  async autoEvaluate(@CurrentUser('id') userId: string) {
    const token = await this.getJwxtToken(userId);
    return this.jwxtClient.autoEvaluate(token);
  }

  @Get('user')
  @ApiOperation({ summary: '获取教务系统用户信息' })
  @ApiResponse({ status: 200, description: '成功' })
  async getUserInfo(@CurrentUser('id') userId: string) {
    const token = await this.getJwxtToken(userId);
    return this.jwxtClient.getUserInfo(token);
  }

  @Post('bind')
  @ApiOperation({ summary: '绑定教务系统账号' })
  @ApiResponse({ status: 200, description: '绑定成功' })
  async bindJwxtAccount(
    @CurrentUser('id') userId: string,
    @Body() body: { username: string; password: string },
  ) {
    // 先验证账号密码是否正确
    const loginResult = await this.jwxtClient.login(body.username, body.password);
    if (!loginResult.success) {
      throw new HttpException(
        loginResult.error || '教务系统账号或密码错误',
        HttpStatus.BAD_REQUEST,
      );
    }

    // 保存到数据库（实际应用中需要加密存储密码）
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        jwxtUsername: body.username,
        jwxtPassword: body.password, // TODO: 应该加密存储
      },
    });

    return { message: '绑定成功' };
  }

  @Post('unbind')
  @ApiOperation({ summary: '解绑教务系统账号' })
  @ApiResponse({ status: 200, description: '解绑成功' })
  async unbindJwxtAccount(@CurrentUser('id') userId: string) {
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        jwxtUsername: null,
        jwxtPassword: null,
      },
    });

    return { message: '解绑成功' };
  }
}
