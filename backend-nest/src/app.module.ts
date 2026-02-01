import { Module, Global } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';

// 配置
import { appConfig } from './config';

// Prisma
import { PrismaModule } from './prisma';

// Services
import { RedisService } from './services/redis.service';

// 模块
import { AuthModule } from './modules/auth';
import { UsersModule } from './modules/users';
import { AnnouncementsModule } from './modules/announcements';
import { AdminModule } from './modules/admin';
import { JwxtModule } from './modules/jwxt';

// Guards
import { JwtAuthGuard } from './modules/auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';

@Module({
  imports: [
    // 配置模块
    ConfigModule.forRoot({
      isGlobal: true,
      load: [appConfig],
      envFilePath: ['.env.local', '.env'],
    }),

    // 限流模块
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 60 秒
        limit: 100, // 100 次请求
      },
    ]),

    // Prisma 数据库模块
    PrismaModule,

    // 业务模块
    AuthModule,
    UsersModule,
    AnnouncementsModule,
    AdminModule,
    JwxtModule,
  ],
  providers: [
    // 全局 Redis 服务
    RedisService,
    // 全局限流守卫
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
    // 全局 JWT 认证守卫
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    // 全局角色守卫
    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },
  ],
  exports: [RedisService],
})
@Global()
export class AppModule {}
