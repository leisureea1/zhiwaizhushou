import { Injectable, Logger, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import { RedisService } from './redis.service';

// 缓存配置
const CACHE_PREFIX = 'jwxt:';
const COURSE_CACHE_TTL = 5 * 24 * 60 * 60; // 5天（秒）

export interface JwxtSession {
  sessionId: string;
  cookies: string[];
  expiresAt: Date;
}

export interface Course {
  name: string;
  teacher: string;
  classroom: string;
  weekday: number;
  startSection: number;
  endSection: number;
  weeks: string;
  [key: string]: unknown;
}

export interface CourseData {
  courses: Course[];
  semester: string;
}

export interface Grade {
  courseName: string;
  credit: number;
  score: string | number;
  gradePoint: number;
  [key: string]: unknown;
}

export interface GradeData {
  grades: Grade[];
  semester: string;
}

export interface Exam {
  courseName: string;
  examTime: string;
  location: string;
  seatNumber?: string;
  [key: string]: unknown;
}

export interface ExamData {
  exams: Exam[];
  semester: string;
}

export interface EvaluationItem {
  id: string;
  courseName: string;
  teacherName: string;
  status: string;
  [key: string]: unknown;
}

export interface EvaluationSubmitData {
  scores: Record<string, number>;
  comment?: string;
  [key: string]: unknown;
}

export interface EvaluationResult {
  evaluationId: string;
  success: boolean;
  message?: string;
}

export interface JwxtUserInfo {
  studentId: string;
  name: string;
  college?: string;
  major?: string;
  className?: string;
  [key: string]: unknown;
}

export interface CacheStats {
  totalKeys: number;
  memoryUsage: string;
  [key: string]: unknown;
}

export interface CacheClearResult {
  cleared: number;
  message: string;
}

interface JwxtErrorResponse {
  detail?: string;
}

@Injectable()
export class JwxtClientService {
  private readonly logger = new Logger(JwxtClientService.name);
  private readonly client: AxiosInstance;
  private readonly serviceUrl: string;
  private readonly apiKey: string;

  constructor(
    private readonly configService: ConfigService,
    private readonly redisService: RedisService,
  ) {
    this.serviceUrl =
      this.configService.get<string>('app.jwxt.serviceUrl') || 'http://localhost:8000';
    this.apiKey = this.configService.get<string>('app.jwxt.apiKey') || '';

    this.client = axios.create({
      baseURL: this.serviceUrl,
      timeout: 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': this.apiKey,
      },
    });

    // 请求拦截器
    this.client.interceptors.request.use(
      (config) => {
        this.logger.debug(`JWXT Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('JWXT Request Error:', error.message);
        return Promise.reject(error);
      },
    );

    // 响应拦截器
    this.client.interceptors.response.use(
      (response) => {
        this.logger.debug(`JWXT Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error: AxiosError) => {
        this.handleError(error);
        return Promise.reject(error);
      },
    );
  }

  private handleError(error: AxiosError): never {
    const status = error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR;
    const message =
      (error.response?.data as JwxtErrorResponse)?.detail || error.message || '教务服务请求失败';

    this.logger.error(`JWXT Error: ${status} - ${message}`);

    throw new HttpException(
      {
        code: status,
        message: `教务服务错误: ${message}`,
      },
      status,
    );
  }

  /**
   * 用户登录教务系统，返回 token
   */
  async login(
    username: string,
    password: string,
  ): Promise<{
    success: boolean;
    token?: string;
    expires_in?: number;
    user_info?: JwxtUserInfo;
    error?: string;
  }> {
    const response = await this.client.post('/auth/login', { username, password });
    const data = response.data;

    if (data.success && data.token) {
      return {
        success: true,
        token: data.token,
        expires_in: data.expires_in,
        user_info: data.user_info
          ? {
              studentId: data.user_info.student_id || data.user_info.student_code || username,
              name: data.user_info.name || '',
              college: data.user_info.department || '',
              major: data.user_info.major || '',
              className: data.user_info.class_name || '',
            }
          : undefined,
      };
    }

    return { success: false, error: data.error || '登录失败' };
  }

  /**
   * 刷新教务系统会话（当会话过期时调用）
   */
  async refreshSession(
    token: string,
    username: string,
    password: string,
  ): Promise<{ success: boolean; token?: string; expires_in?: number }> {
    const response = await this.client.post(
      '/auth/refresh',
      { username, password },
      { headers: { Authorization: `Bearer ${token}` } },
    );
    return response.data;
  }

  /**
   * 验证教务系统会话是否有效
   */
  async validateSession(token: string): Promise<boolean> {
    try {
      const response = await this.client.get('/auth/validate', {
        headers: { Authorization: `Bearer ${token}` },
      });
      return response.data?.valid === true;
    } catch {
      return false;
    }
  }

  /**
   * 获取课表（带缓存）
   */
  async getCourses(token: string, semesterId?: string, userId?: string): Promise<CourseData> {
    // 生成缓存键
    const cacheKey = userId ? `${CACHE_PREFIX}courses:${userId}:${semesterId || 'current'}` : null;

    // 尝试从缓存获取
    if (cacheKey) {
      try {
        const cached = await this.redisService.get(cacheKey);
        if (cached) {
          this.logger.debug(`[Cache HIT] ${cacheKey}`);
          return JSON.parse(cached);
        }
        this.logger.debug(`[Cache MISS] ${cacheKey}`);
      } catch (error) {
        this.logger.warn(`Cache read error: ${error}`);
      }
    }

    // 从后端获取
    const response = await this.client.get('/course', {
      headers: { Authorization: `Bearer ${token}` },
      params: semesterId ? { semester_id: semesterId } : undefined,
    });
    const data = response.data;

    // 存入缓存
    if (cacheKey && data.success) {
      try {
        await this.redisService.set(cacheKey, JSON.stringify(data), COURSE_CACHE_TTL);
        this.logger.debug(`[Cache SET] ${cacheKey}, TTL: ${COURSE_CACHE_TTL}s`);
      } catch (error) {
        this.logger.warn(`Cache write error: ${error}`);
      }
    }

    return data;
  }

  /**
   * 清除用户课程缓存
   */
  async clearCourseCache(userId: string): Promise<void> {
    try {
      // 清除该用户所有学期的课程缓存
      const pattern = `${CACHE_PREFIX}courses:${userId}:*`;
      await this.redisService.deletePattern(pattern);
      this.logger.log(`Cleared course cache for user: ${userId}`);
    } catch (error) {
      this.logger.warn(`Failed to clear cache: ${error}`);
    }
  }

  /**
   * 获取成绩
   */
  async getGrades(token: string, semesterId?: string): Promise<GradeData> {
    const response = await this.client.get('/grade', {
      headers: { Authorization: `Bearer ${token}` },
      params: semesterId ? { semester_id: semesterId } : undefined,
    });
    return response.data;
  }

  /**
   * 获取考试安排
   */
  async getExams(token: string, semesterId?: string): Promise<ExamData> {
    const response = await this.client.get('/exam', {
      headers: { Authorization: `Bearer ${token}` },
      params: semesterId ? { semester_id: semesterId } : undefined,
    });
    return response.data;
  }

  /**
   * 获取学期列表
   */
  async getSemesters(token: string): Promise<{ semesters: string[]; current: string }> {
    const response = await this.client.get('/semester', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  /**
   * 获取待评教列表
   */
  async getEvaluationPending(token: string): Promise<EvaluationItem[]> {
    const response = await this.client.get('/evaluation/pending', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  /**
   * 提交评教
   */
  async submitEvaluation(
    token: string,
    evaluationId: string,
    data: EvaluationSubmitData,
  ): Promise<EvaluationResult> {
    const response = await this.client.post(`/evaluation/submit/${evaluationId}`, data, {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  /**
   * 一键评教
   */
  async autoEvaluate(
    token: string,
  ): Promise<{ success: number; failed: number; results: EvaluationResult[] }> {
    const response = await this.client.post(
      '/evaluation/auto',
      {},
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    return response.data;
  }

  /**
   * 获取用户信息
   */
  async getUserInfo(token: string): Promise<JwxtUserInfo> {
    const response = await this.client.get('/user', {
      headers: { Authorization: `Bearer ${token}` },
    });
    return response.data;
  }

  /**
   * 获取缓存统计
   */
  async getCacheStats(): Promise<CacheStats> {
    const response = await this.client.get('/cache/stats');
    return response.data;
  }

  /**
   * 清理缓存
   */
  async clearCache(pattern?: string): Promise<CacheClearResult> {
    const response = await this.client.post('/cache/clear', { pattern });
    return response.data;
  }

  /**
   * 健康检查
   */
  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health');
      return response.status === 200;
    } catch {
      return false;
    }
  }
}
