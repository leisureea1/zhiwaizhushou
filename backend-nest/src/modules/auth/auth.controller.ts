import { Controller, Post, Body, HttpCode, HttpStatus, Req, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { RegisterDto, LoginDto, RefreshTokenDto, ChangePasswordDto, SendVerificationCodeDto, VerifyEmailCodeDto, ResetPasswordRequestDto, ResetPasswordConfirmDto } from './dto';
import { Public } from '@/common/decorators/public.decorator';
import { CurrentUser } from '@/common/decorators/current-user.decorator';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@ApiTags('认证')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('send-code')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发送邮箱验证码' })
  @ApiResponse({ status: 200, description: '验证码发送成功' })
  @ApiResponse({ status: 409, description: '邮箱已被注册' })
  @ApiResponse({ status: 400, description: '请勿频繁发送' })
  async sendVerificationCode(@Body() dto: SendVerificationCodeDto) {
    return this.authService.sendVerificationCode(dto);
  }

  @Post('verify-code')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '验证邮箱验证码' })
  @ApiResponse({ status: 200, description: '验证成功' })
  @ApiResponse({ status: 400, description: '验证码错误或已过期' })
  async verifyEmailCode(@Body() dto: VerifyEmailCodeDto) {
    return this.authService.verifyEmailCode(dto);
  }

  @Post('register')
  @Public()
  @ApiOperation({ summary: '用户注册' })
  @ApiResponse({ status: 201, description: '注册成功' })
  @ApiResponse({ status: 409, description: '用户名/邮箱/手机号已存在' })
  async register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('login')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '用户登录' })
  @ApiResponse({ status: 200, description: '登录成功' })
  @ApiResponse({ status: 401, description: '学号或密码错误' })
  async login(@Body() dto: LoginDto, @Req() req: Request) {
    const ip = req.ip || req.headers['x-forwarded-for']?.toString();
    const userAgent = req.headers['user-agent'];
    return this.authService.login(dto, ip, userAgent);
  }

  @Post('refresh')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '刷新令牌' })
  @ApiResponse({ status: 200, description: '刷新成功' })
  @ApiResponse({ status: 401, description: '无效或过期的刷新令牌' })
  async refreshToken(@Body() dto: RefreshTokenDto) {
    return this.authService.refreshToken(dto);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '用户登出' })
  @ApiResponse({ status: 200, description: '登出成功' })
  async logout(@CurrentUser('id') userId: string, @Body('refreshToken') refreshToken?: string) {
    return this.authService.logout(userId, refreshToken);
  }

  @Post('change-password')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth()
  @ApiOperation({ summary: '修改密码' })
  @ApiResponse({ status: 200, description: '密码修改成功' })
  @ApiResponse({ status: 400, description: '旧密码错误' })
  async changePassword(@CurrentUser('id') userId: string, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(userId, dto.oldPassword, dto.newPassword);
  }

  @Post('forgot-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '发送密码重置验证码' })
  @ApiResponse({ status: 200, description: '验证码发送成功' })
  @ApiResponse({ status: 404, description: '邮箱未注册' })
  @ApiResponse({ status: 400, description: '请勿频繁发送' })
  async forgotPassword(@Body() dto: ResetPasswordRequestDto) {
    return this.authService.sendResetPasswordCode(dto.email);
  }

  @Post('reset-password')
  @Public()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: '重置密码' })
  @ApiResponse({ status: 200, description: '密码重置成功' })
  @ApiResponse({ status: 400, description: '验证码错误或已过期' })
  async resetPassword(@Body() dto: ResetPasswordConfirmDto) {
    return this.authService.resetPassword(dto.token, dto.newPassword);
  }
}
