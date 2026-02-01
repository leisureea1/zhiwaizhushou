import {
  Controller,
  Get,
  Post,
  Query,
  Body,
  UseGuards,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { JwxtClientService } from '@/services/jwxt-client.service';
import { PrismaService } from '@/prisma/prisma.service';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from '@/modules/auth/guards/jwt-auth.guard';

@ApiTags('教务系统')
@Controller('jwxt')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class JwxtController {
  constructor(
    private readonly jwxtClient: JwxtClientService,
    private readonly prisma: PrismaService,
  ) {}

  private async getJwxtToken(userId: string): Promise<string> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { jwxtUsername: true, jwxtPassword: true },
    });

    if (!user?.jwxtUsername || !user?.jwxtPassword) {
      throw new HttpException('请先绑定教务系统账号', HttpStatus.BAD_REQUEST);
    }

    // 登录教务系统获取 token
    const result = await this.jwxtClient.login(user.jwxtUsername, user.jwxtPassword);
    if (!result.success || !result.token) {
      throw new HttpException(result.error || '教务系统登录失败', HttpStatus.BAD_REQUEST);
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
    const token = await this.getJwxtToken(userId);
    return this.jwxtClient.getSemesters(token);
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
