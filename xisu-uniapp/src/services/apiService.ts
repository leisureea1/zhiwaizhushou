/**
 * API 服务 - 封装网络请求
 */

// 后端API地址 - NestJS 后端
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://192.168.3.24:3000/api/v1';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyObject = Record<string, any>;

interface RequestOptions {
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  data?: string | AnyObject | ArrayBuffer;
  header?: Record<string, string>;
}

interface ApiResponse<T = unknown> {
  code?: number;
  data?: T;
  message?: string;
  timestamp?: string;
}

// 判断响应是否为包装格式
function isWrappedResponse<T>(response: unknown): response is ApiResponse<T> {
  return (
    typeof response === 'object' &&
    response !== null &&
    'code' in response &&
    'data' in response
  );
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

/**
 * 保存登录凭证
 */
export const saveTokens = (tokens: AuthTokens) => {
  uni.setStorageSync('access_token', tokens.accessToken);
  uni.setStorageSync('refresh_token', tokens.refreshToken);
};

/**
 * 获取 Access Token
 */
export const getAccessToken = (): string | null => {
  return uni.getStorageSync('access_token') || null;
};

/**
 * 清除登录凭证
 */
export const clearTokens = () => {
  uni.removeStorageSync('access_token');
  uni.removeStorageSync('refresh_token');
  uni.removeStorageSync('user_info');
};

/**
 * 保存用户信息
 */
export const saveUserInfo = (userInfo: unknown) => {
  uni.setStorageSync('user_info', JSON.stringify(userInfo));
};

/**
 * 获取用户信息
 */
export const getUserInfo = <T = unknown>(): T | null => {
  const info = uni.getStorageSync('user_info');
  if (info) {
    try {
      return JSON.parse(info) as T;
    } catch {
      return null;
    }
  }
  return null;
};

/**
 * 通用请求方法
 */
export const request = async <T = unknown>(options: RequestOptions): Promise<T> => {
  const { url, method = 'GET', data, header = {} } = options;
  
  // 获取token
  const token = getAccessToken();
  if (token) {
    header['Authorization'] = `Bearer ${token}`;
  }
  
  return new Promise((resolve, reject) => {
    uni.request({
      url: `${BASE_URL}${url}`,
      method,
      data,
      header: {
        'Content-Type': 'application/json',
        ...header
      },
      success: (res) => {
        const statusCode = res.statusCode;
        const response = res.data as ApiResponse<T>;
        
        console.log('[API Response]', url, statusCode, JSON.stringify(response));
        
        if (statusCode >= 200 && statusCode < 300) {
          // 检查是否为包装格式 { code, data, message }
          if (isWrappedResponse<T>(response)) {
            console.log('[API] Unwrapping response, data:', JSON.stringify(response.data));
            if (response.code === 0) {
              resolve(response.data as T);
            } else {
              reject(new Error(response.message || '请求失败'));
            }
          } else {
            // 直接返回数据（兼容未包装的响应）
            resolve(response as T);
          }
        } else if (statusCode === 401) {
          // Token过期，清除凭证并跳转登录
          clearTokens();
          uni.reLaunch({ url: '/pages/login/index' });
          reject(new Error('登录已过期，请重新登录'));
        } else {
          // 错误响应
          const errorMessage = response.message || `请求失败 (${statusCode})`;
          reject(new Error(errorMessage));
        }
      },
      fail: (err) => {
        console.error('Request failed:', err);
        reject(new Error('网络请求失败，请检查网络连接'));
      }
    });
  });
};

/**
 * GET 请求
 */
export const get = <T = unknown>(url: string, data?: AnyObject): Promise<T> => {
  return request<T>({ url, method: 'GET', data });
};

/**
 * POST 请求
 */
export const post = <T = unknown>(url: string, data?: AnyObject): Promise<T> => {
  return request<T>({ url, method: 'POST', data });
};

/**
 * PUT 请求
 */
export const put = <T = unknown>(url: string, data?: AnyObject): Promise<T> => {
  return request<T>({ url, method: 'PUT', data });
};

/**
 * DELETE 请求
 */
export const del = <T = unknown>(url: string, data?: AnyObject): Promise<T> => {
  return request<T>({ url, method: 'DELETE', data });
};

// ============================================
// Auth API
// ============================================

export interface LoginRequest {
  studentId: string;
  password: string;
}

export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  user: UserInfo;
}

export interface UserInfo {
  id: string;
  username: string;
  email: string;
  studentId: string;
  realName?: string;
  avatar?: string;
  role: string;
  college?: string;
  major?: string;
  className?: string;
}

export interface RegisterRequest {
  username: string;
  password: string;
  email: string;
  studentId: string;
  xiwaiPassword: string;
  emailToken?: string;
  avatar?: string;
}

export interface SendCodeRequest {
  email: string;
}

export interface VerifyCodeRequest {
  email: string;
  code: string;
}

export interface VerifyCodeResponse {
  verified: boolean;
  token: string;
}

/**
 * Auth API
 */
export const authApi = {
  /** 发送邮箱验证码 */
  sendCode: (data: SendCodeRequest) => post<{ message: string }>('/auth/send-code', data),
  
  /** 验证邮箱验证码 */
  verifyCode: (data: VerifyCodeRequest) => post<VerifyCodeResponse>('/auth/verify-code', data),
  
  /** 用户注册 */
  register: (data: RegisterRequest) => post<LoginResponse>('/auth/register', data),
  
  /** 用户登录 */
  login: (data: LoginRequest) => post<LoginResponse>('/auth/login', data),
  
  /** 刷新令牌 */
  refresh: (refreshToken: string) => post<{ accessToken: string; refreshToken: string }>('/auth/refresh', { refreshToken }),
  
  /** 用户登出 */
  logout: (refreshToken?: string) => post('/auth/logout', { refreshToken }),
  
  /** 修改密码 */
  changePassword: (oldPassword: string, newPassword: string) => post('/auth/change-password', { oldPassword, newPassword }),
};

/**
 * User API
 */
export const userApi = {
  /** 获取当前用户信息 */
  getMe: () => get<UserInfo>('/users/me'),
  
  /** 更新用户资料 */
  updateProfile: (id: string, data: Partial<UserInfo>) => put<UserInfo>(`/users/${id}`, data),
};

// ============================================
// JWXT API - 教务系统相关
// ============================================

export interface CourseItem {
  name: string;
  teacher: string;
  classroom: string;
  weekday: number;
  startSection: number;
  endSection: number;
  weeks: string;
}

export interface CourseData {
  success: boolean;
  data?: {
    courses: CourseItem[];
    semester?: string;
  };
  error?: string;
}

export interface GradeItem {
  id: number;
  [key: string]: string | number | undefined; // 动态字段，如 "课程名称", "学分", "成绩" 等
}

export interface GradeStatistics {
  total_courses: number;
  average_score: number | null;
  weighted_average: number | null;
  total_credits: number;
  grade_distribution: Record<string, number>;
}

export interface GradeData {
  success: boolean;
  data?: {
    success: boolean;
    semester_id?: string;
    grades: GradeItem[];
    statistics: GradeStatistics;
    total_courses: number;
    message?: string;
  };
  error?: string;
}

export interface ExamItem {
  id: number;
  [key: string]: string | number | undefined; // 动态字段
  // 标准化字段
  course_name?: string;
  exam_date?: string;
  exam_time?: string;
  start_time?: string;
  end_time?: string;
  location?: string;
  seat?: string;
  exam_type?: string;
  status?: string;
}

export interface ExamData {
  success: boolean;
  data?: {
    success: boolean;
    exams: ExamItem[];
    total: number;
    semester_id?: string;
  };
  error?: string;
}

export interface SemesterInfo {
  id: string;
  name: string;
  current?: boolean;
}

export interface SemesterData {
  success: boolean;
  data?: {
    semesters: SemesterInfo[];
    current_semester?: string;
  };
  error?: string;
}

// 评教相关接口
export interface EvaluationItem {
  lesson_id: string;
  teacher_name: string;
  course_code: string;
  course_name: string;
  course_type: string;
}

export interface EvaluationPendingData {
  success: boolean;
  data?: {
    success: boolean;
    total: number;
    evaluations: EvaluationItem[];
  };
  error?: string;
}

export interface EvaluationAutoData {
  success: boolean;
  data?: {
    success: boolean;
    total: number;
    succeeded: number;
    failed: number;
    message: string;
    details?: Array<{
      lesson_id: string;
      course: string;
      teacher: string;
      success: boolean;
      message: string;
    }>;
  };
  error?: string;
}

/**
 * JWXT API - 教务系统
 */
export const jwxtApi = {
  /** 获取课程表（使用缓存） */
  getCourses: (semesterId?: string) => get<CourseData>('/jwxt/course', semesterId ? { semester_id: semesterId } : undefined),
  
  /** 刷新课程表（清除缓存重新获取） */
  refreshCourses: (semesterId?: string) => get<CourseData>('/jwxt/course/refresh', semesterId ? { semester_id: semesterId } : undefined),
  
  /** 获取成绩 */
  getGrades: (semesterId?: string) => get<GradeData>('/jwxt/grade', semesterId ? { semester_id: semesterId } : undefined),
  
  /** 获取考试安排 */
  getExams: (semesterId?: string) => get<ExamData>('/jwxt/exam', semesterId ? { semester_id: semesterId } : undefined),
  
  /** 获取学期列表 */
  getSemesters: () => get<SemesterData>('/jwxt/semester'),
  
  /** 获取教务系统用户信息 */
  getUserInfo: () => get<{ success: boolean; data?: { name: string; student_id: string; department: string; major: string; class_name: string }; error?: string }>('/jwxt/user'),
  
  /** 获取待评教列表 */
  getEvaluationPending: () => get<EvaluationPendingData>('/jwxt/evaluation/pending'),
  
  /** 一键评教 */
  autoEvaluate: () => post<EvaluationAutoData>('/jwxt/evaluation/auto'),
  
  /** 绑定教务系统账号 */
  bindAccount: (username: string, password: string) => post<{ message: string }>('/jwxt/bind', { username, password }),
  
  /** 解绑教务系统账号 */
  unbindAccount: () => post<{ message: string }>('/jwxt/unbind'),
};
