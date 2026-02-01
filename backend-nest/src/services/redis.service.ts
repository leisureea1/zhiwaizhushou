import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Redis from 'ioredis';

@Injectable()
export class RedisService implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private client: Redis | null = null;
  private connected = false;

  // 内存存储（Redis 不可用时的降级方案）
  private memoryStore = new Map<string, { value: string; expiresAt: number }>();

  constructor(private readonly configService: ConfigService) {}

  async onModuleInit() {
    const host = this.configService.get<string>('REDIS_HOST', 'localhost');
    const port = this.configService.get<number>('REDIS_PORT', 6379);
    const password = this.configService.get<string>('REDIS_PASSWORD', '');

    try {
      this.client = new Redis({
        host,
        port,
        password: password || undefined,
        maxRetriesPerRequest: 3,
        retryStrategy: (times) => {
          if (times > 3) {
            this.logger.warn('Redis connection failed, falling back to memory storage');
            return null;
          }
          return Math.min(times * 200, 2000);
        },
        lazyConnect: true,
      });

      this.client.on('connect', () => {
        this.connected = true;
        this.logger.log('Redis connected successfully');
      });

      this.client.on('error', (err) => {
        this.connected = false;
        this.logger.warn(`Redis error: ${err.message}, using memory storage`);
      });

      this.client.on('close', () => {
        this.connected = false;
      });

      // 尝试连接
      await this.client.connect().catch(() => {
        this.logger.warn('Redis not available, using memory storage');
      });
    } catch (error) {
      this.logger.warn('Redis initialization failed, using memory storage');
    }
  }

  async onModuleDestroy() {
    if (this.client) {
      await this.client.quit().catch(() => {});
    }
  }

  /**
   * 清理过期的内存存储
   */
  private cleanExpired() {
    const now = Date.now();
    for (const [key, data] of this.memoryStore.entries()) {
      if (data.expiresAt > 0 && data.expiresAt < now) {
        this.memoryStore.delete(key);
      }
    }
  }

  /**
   * 设置键值（支持过期时间）
   * @param key 键
   * @param value 值
   * @param ttlSeconds 过期时间（秒）
   */
  async set(key: string, value: string, ttlSeconds?: number): Promise<void> {
    if (this.connected && this.client) {
      try {
        if (ttlSeconds) {
          await this.client.setex(key, ttlSeconds, value);
        } else {
          await this.client.set(key, value);
        }
        return;
      } catch (error) {
        this.logger.warn(`Redis set failed, using memory: ${error}`);
      }
    }

    // 降级到内存存储
    this.memoryStore.set(key, {
      value,
      expiresAt: ttlSeconds ? Date.now() + ttlSeconds * 1000 : 0,
    });
  }

  /**
   * 获取值
   */
  async get(key: string): Promise<string | null> {
    if (this.connected && this.client) {
      try {
        return await this.client.get(key);
      } catch (error) {
        this.logger.warn(`Redis get failed, using memory: ${error}`);
      }
    }

    // 降级到内存存储
    this.cleanExpired();
    const data = this.memoryStore.get(key);
    if (!data) return null;
    if (data.expiresAt > 0 && data.expiresAt < Date.now()) {
      this.memoryStore.delete(key);
      return null;
    }
    return data.value;
  }

  /**
   * 删除键
   */
  async del(key: string): Promise<void> {
    if (this.connected && this.client) {
      try {
        await this.client.del(key);
        return;
      } catch (error) {
        this.logger.warn(`Redis del failed, using memory: ${error}`);
      }
    }

    this.memoryStore.delete(key);
  }

  /**
   * 检查键是否存在
   */
  async exists(key: string): Promise<boolean> {
    if (this.connected && this.client) {
      try {
        const result = await this.client.exists(key);
        return result === 1;
      } catch (error) {
        this.logger.warn(`Redis exists failed, using memory: ${error}`);
      }
    }

    this.cleanExpired();
    return this.memoryStore.has(key);
  }

  /**
   * 获取剩余过期时间（秒）
   */
  async ttl(key: string): Promise<number> {
    if (this.connected && this.client) {
      try {
        return await this.client.ttl(key);
      } catch (error) {
        this.logger.warn(`Redis ttl failed, using memory: ${error}`);
      }
    }

    // 降级到内存存储
    const data = this.memoryStore.get(key);
    if (!data) return -2; // key不存在
    if (data.expiresAt === 0) return -1; // 永不过期
    const remaining = Math.ceil((data.expiresAt - Date.now()) / 1000);
    return remaining > 0 ? remaining : -2;
  }

  /**
   * 按模式删除键（支持通配符）
   * @param pattern 匹配模式，如 "prefix:*"
   */
  async deletePattern(pattern: string): Promise<number> {
    let deleted = 0;

    if (this.connected && this.client) {
      try {
        const keys = await this.client.keys(pattern);
        if (keys.length > 0) {
          deleted = await this.client.del(...keys);
        }
        return deleted;
      } catch (error) {
        this.logger.warn(`Redis deletePattern failed, using memory: ${error}`);
      }
    }

    // 降级到内存存储
    const regex = new RegExp('^' + pattern.replace(/\*/g, '.*') + '$');
    for (const key of this.memoryStore.keys()) {
      if (regex.test(key)) {
        this.memoryStore.delete(key);
        deleted++;
      }
    }
    return deleted;
  }
}
