import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';
import { PrismaService } from '@/prisma/prisma.service';
import {
  RegisterDto,
  LoginDto,
  RefreshTokenDto,
  SendVerificationCodeDto,
  VerifyEmailCodeDto,
} from './dto';
import { JwtPayload } from './strategies/jwt.strategy';
import { MailService } from '@/modules/mail/mail.service';
import { JwxtClientService } from '@/services/jwxt-client.service';
import { RedisService } from '@/services/redis.service';

// Redis 键前缀
const VERIFICATION_CODE_PREFIX = 'verify_code:';
const RESET_PASSWORD_CODE_PREFIX = 'reset_pwd_code:';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly jwxtClient: JwxtClientService,
    private readonly redisService: RedisService,
  ) {}

  /**
   * 发送邮箱验证码
   */
  async sendVerificationCode(dto: SendVerificationCodeDto): Promise<{ message: string }> {
    const { email } = dto;
    const redisKey = `${VERIFICATION_CODE_PREFIX}${email}`;

    // 检查邮箱是否已被注册
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('该邮箱已被注册');
    }

    // 检查是否频繁发送（60秒内只能发送一次）
    const ttl = await this.redisService.ttl(redisKey);
    if (ttl > 540) {
      // 剩余时间超过9分钟，说明是60秒内发送的
      throw new BadRequestException('请勿频繁发送验证码，请60秒后再试');
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 保存验证码到 Redis（10分钟 = 600秒）
    await this.redisService.set(redisKey, code, 600);

    // 发送邮件
    const success = await this.mailService.sendVerificationCode(email, code);
    if (!success) {
      throw new BadRequestException('验证码发送失败，请稍后再试');
    }

    this.logger.log(`Verification code sent to ${email}`);
    return { message: '验证码已发送，请查收邮件' };
  }

  /**
   * 验证邮箱验证码
   */
  async verifyEmailCode(dto: VerifyEmailCodeDto): Promise<{ verified: boolean; token: string }> {
    const { email, code } = dto;
    const redisKey = `${VERIFICATION_CODE_PREFIX}${email}`;

    const storedCode = await this.redisService.get(redisKey);
    if (!storedCode) {
      throw new BadRequestException('验证码不存在或已过期，请重新发送');
    }

    if (storedCode !== code) {
      throw new BadRequestException('验证码错误');
    }

    // 验证成功，删除验证码
    await this.redisService.del(redisKey);

    // 生成临时令牌，用于注册时验证邮箱已通过验证
    const token = this.jwtService.sign({ email, verified: true }, { expiresIn: '30m' });

    this.logger.log(`Email ${email} verified successfully`);
    return { verified: true, token };
  }

  async register(dto: RegisterDto) {
    // 1. 先验证教务系统账号并获取用户信息
    this.logger.log(`Verifying JWXT account for student: ${dto.studentId}`);
    let realName: string | undefined;
    let college: string | undefined;
    let major: string | undefined;
    let className: string | undefined;

    try {
      const loginResult = await this.jwxtClient.login(dto.studentId, dto.xiwaiPassword);
      if (!loginResult.success) {
        throw new Error(loginResult.error || '登录失败');
      }
      this.logger.log(`JWXT verification successful for student: ${dto.studentId}`);

      // 从登录结果中获取用户信息
      if (loginResult.user_info) {
        realName = loginResult.user_info.name;
        college = loginResult.user_info.college;
        major = loginResult.user_info.major;
        className = loginResult.user_info.className;
        this.logger.log(`Got user info from JWXT: ${realName}, ${college}, ${major}`);
      }
    } catch (error) {
      this.logger.error(`JWXT verification failed for student: ${dto.studentId}`, error);
      throw new BadRequestException('教务系统验证失败，请检查学号和密码是否正确');
    }

    // 2. 检查用户名、邮箱、学号是否已存在
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }, { studentId: dto.studentId }],
      },
    });

    if (existingUser) {
      if (existingUser.username === dto.username) {
        throw new ConflictException('用户名已存在');
      }
      if (existingUser.email === dto.email) {
        throw new ConflictException('邮箱已被注册');
      }
      if (existingUser.studentId === dto.studentId) {
        throw new ConflictException('学号已被注册');
      }
    }

    // 3. 密码加密
    const passwordHash = await bcrypt.hash(dto.password, 10);

    // 4. 创建用户（教务系统已验证成功，保存绑定信息）
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        passwordHash,
        email: dto.email,
        studentId: dto.studentId,
        realName,
        college,
        major,
        className,
        avatar: dto.avatar,
        jwxtUsername: dto.studentId, // 保存教务系统用户名（学号）
        jwxtPassword: dto.xiwaiPassword, // 保存教务系统密码
      },
      select: {
        id: true,
        username: true,
        email: true,
        studentId: true,
        realName: true,
        college: true,
        major: true,
        className: true,
        avatar: true,
        role: true,
        createdAt: true,
      },
    });

    this.logger.log(`User registered: ${user.username} (Student ID: ${dto.studentId})`);

    // 5. 生成登录凭证，注册后自动登录
    const tokens = await this.generateTokens(user.id, user.username, user.role);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        ...user,
        jwxtBound: true, // 标记教务系统已绑定
      },
    };
  }

  async login(dto: LoginDto, ip?: string, userAgent?: string) {
    // 查找用户（支持学号、用户名、邮箱登录）
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [{ studentId: dto.studentId }, { username: dto.studentId }, { email: dto.studentId }],
      },
    });

    if (!user) {
      throw new UnauthorizedException('学号或密码错误');
    }

    // 验证密码
    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException('学号或密码错误');
    }

    // 检查账号状态
    if (user.status !== 'ACTIVE') {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 生成令牌
    const tokens = await this.generateTokens(user.id, user.username, user.role);

    // 保存刷新令牌
    await this.saveRefreshToken(user.id, tokens.refreshToken, ip, userAgent);

    // 更新最后登录信息
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    this.logger.log(`User logged in: ${user.username}`);

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        phone: user.phone,
        studentId: user.studentId,
        realName: user.realName,
        nickname: user.nickname,
        avatar: user.avatar,
        role: user.role,
        college: user.college,
        major: user.major,
        className: user.className,
      },
    };
  }

  async refreshToken(dto: RefreshTokenDto) {
    // 查找刷新令牌
    const tokenRecord = await this.prisma.refreshToken.findUnique({
      where: { token: dto.refreshToken },
      include: { user: true },
    });

    if (!tokenRecord) {
      throw new UnauthorizedException('无效的刷新令牌');
    }

    // 检查是否过期
    if (tokenRecord.expiresAt < new Date()) {
      await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });
      throw new UnauthorizedException('刷新令牌已过期');
    }

    // 检查用户状态
    if (tokenRecord.user.status !== 'ACTIVE') {
      throw new UnauthorizedException('账号已被禁用');
    }

    // 删除旧的刷新令牌
    await this.prisma.refreshToken.delete({ where: { id: tokenRecord.id } });

    // 生成新令牌
    const tokens = await this.generateTokens(
      tokenRecord.user.id,
      tokenRecord.user.username,
      tokenRecord.user.role,
    );

    // 保存新的刷新令牌
    await this.saveRefreshToken(
      tokenRecord.user.id,
      tokens.refreshToken,
      tokenRecord.ipAddress ?? undefined,
      tokenRecord.userAgent ?? undefined,
    );

    return {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
    };
  }

  async logout(userId: string, refreshToken?: string) {
    if (refreshToken) {
      // 删除指定的刷新令牌
      await this.prisma.refreshToken.deleteMany({
        where: {
          userId,
          token: refreshToken,
        },
      });
    } else {
      // 删除用户所有刷新令牌（登出所有设备）
      await this.prisma.refreshToken.deleteMany({
        where: { userId },
      });
    }

    return { message: '登出成功' };
  }

  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 验证旧密码
    const isPasswordValid = await bcrypt.compare(oldPassword, user.passwordHash);
    if (!isPasswordValid) {
      throw new BadRequestException('旧密码错误');
    }

    // 更新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: userId },
      data: { passwordHash: newPasswordHash },
    });

    // 删除所有刷新令牌，强制重新登录
    await this.prisma.refreshToken.deleteMany({
      where: { userId },
    });

    return { message: '密码修改成功，请重新登录' };
  }

  /**
   * 发送密码重置验证码
   */
  async sendResetPasswordCode(email: string): Promise<{ message: string }> {
    const redisKey = `${RESET_PASSWORD_CODE_PREFIX}${email}`;

    // 检查邮箱是否已注册
    const existingUser = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!existingUser) {
      throw new BadRequestException('该邮箱未注册');
    }

    // 检查是否频繁发送（60秒内只能发送一次）
    const ttl = await this.redisService.ttl(redisKey);
    if (ttl > 540) {
      // 剩余时间超过9分钟，说明是60秒内发送的
      throw new BadRequestException('请勿频繁发送验证码，请60秒后再试');
    }

    // 生成6位验证码
    const code = Math.floor(100000 + Math.random() * 900000).toString();

    // 保存验证码到 Redis（10分钟 = 600秒）
    await this.redisService.set(redisKey, code, 600);

    // 发送邮件
    const success = await this.mailService.sendPasswordReset(email, code);
    if (!success) {
      throw new BadRequestException('验证码发送失败，请稍后再试');
    }

    this.logger.log(`Reset password code sent to ${email}`);
    return { message: '验证码已发送，请查收邮件' };
  }

  /**
   * 重置密码
   */
  async resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
    // 从 token 中解析邮箱和验证码
    let decoded: { email: string; code: string };
    try {
      decoded = JSON.parse(Buffer.from(token, 'base64').toString('utf8'));
    } catch {
      throw new BadRequestException('无效的重置令牌');
    }

    const { email, code } = decoded;
    const redisKey = `${RESET_PASSWORD_CODE_PREFIX}${email}`;

    // 验证验证码
    const storedCode = await this.redisService.get(redisKey);
    if (!storedCode) {
      throw new BadRequestException('验证码不存在或已过期，请重新获取');
    }

    if (storedCode !== code) {
      throw new BadRequestException('验证码错误');
    }

    // 查找用户
    const user = await this.prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      throw new BadRequestException('用户不存在');
    }

    // 更新密码
    const newPasswordHash = await bcrypt.hash(newPassword, 10);
    await this.prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // 删除验证码
    await this.redisService.del(redisKey);

    // 删除所有刷新令牌，强制重新登录
    await this.prisma.refreshToken.deleteMany({
      where: { userId: user.id },
    });

    this.logger.log(`Password reset for user: ${user.username}`);
    return { message: '密码重置成功，请使用新密码登录' };
  }

  private async generateTokens(userId: string, username: string, role: string) {
    const payload: JwtPayload = {
      sub: userId,
      username,
      role,
    };

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.configService.get<string>('app.jwt.secret'),
        expiresIn: this.configService.get<string>('app.jwt.accessExpiration'),
      }),
      this.jwtService.signAsync(
        { sub: userId },
        {
          secret: this.configService.get<string>('app.jwt.refreshSecret'),
          expiresIn: this.configService.get<string>('app.jwt.refreshExpiration'),
        },
      ),
    ]);

    return { accessToken, refreshToken };
  }

  private async saveRefreshToken(
    userId: string,
    token: string,
    ipAddress?: string,
    userAgent?: string,
  ) {
    const refreshExpiration = this.configService.get<string>('app.jwt.refreshExpiration') || '7d';
    const expiresIn = this.parseExpiration(refreshExpiration);

    await this.prisma.refreshToken.create({
      data: {
        id: uuidv4(),
        token,
        userId,
        ipAddress,
        userAgent,
        expiresAt: new Date(Date.now() + expiresIn),
      },
    });
  }

  private parseExpiration(expiration: string): number {
    const match = expiration.match(/^(\d+)([smhd])$/);
    if (!match) {
      return 7 * 24 * 60 * 60 * 1000; // 默认7天
    }

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 's':
        return value * 1000;
      case 'm':
        return value * 60 * 1000;
      case 'h':
        return value * 60 * 60 * 1000;
      case 'd':
        return value * 24 * 60 * 60 * 1000;
      default:
        return 7 * 24 * 60 * 60 * 1000;
    }
  }
}
