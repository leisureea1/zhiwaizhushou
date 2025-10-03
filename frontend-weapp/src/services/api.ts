import Taro from '@tarojs/taro'

// API 基础配置
const BASE_URL = 'http://localhost:8000' // PHP后端地址

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  needAuth?: boolean
}

class ApiService {
  // 获取存储的token
  getToken(): string | null {
    return Taro.getStorageSync('userToken') || null
  }

  // 通用请求方法
  async request<T>(options: RequestOptions): Promise<T> {
    const { url, method = 'GET', data, header = {}, needAuth = false } = options

    try {
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...header
      }

      // 如果需要认证，添加token
      if (needAuth) {
        const token = this.getToken()
        if (token) {
          headers['Authorization'] = `Bearer ${token}`
        }
      }

      const response = await Taro.request({
        url: BASE_URL + url,
        method,
        data,
        header: headers
      })

      if (response.statusCode === 200) {
        return response.data
      } else {
        const errorData = response.data as any
        throw new Error(errorData?.error || `请求失败: ${response.statusCode}`)
      }
    } catch (error: any) {
      console.error('API请求错误:', error)
      throw error
    }
  }

  // ==================== 用户认证相关 ====================
  
  /**
   * 用户注册
   */
  async register(data: {
    username: string
    password: string
    studentId: string
    jwxtPassword: string
  }) {
    return this.request({
      url: '/api/user/register',
      method: 'POST',
      data: {
        student_id: data.studentId,
        name: data.username,
        password: data.password,
        email: `${data.studentId}@temp.com`, // 临时邮箱，后续可让用户完善
        edu_system_username: data.studentId,
        edu_system_password: data.jwxtPassword
      }
    })
  }

  /**
   * 用户登录
   */
  async login(username: string, password: string) {
    return this.request({
      url: '/api/user/login',
      method: 'POST',
      data: {
        student_id: username,
        password: password
      }
    })
  }

  /**
   * 修改密码
   */
  async changePassword(userId: string, oldPassword: string, newPassword: string) {
    return this.request({
      url: '/api/user/change-password',
      method: 'POST',
      data: {
        user_id: userId,
        old_password: oldPassword,
        new_password: newPassword
      },
      needAuth: true
    })
  }


  /**
   * 获取用户详细信息（从教务系统）
   */
  async getUserDetail(userId: string) {
    return this.request({
      url: '/api/user/get-detail',
      method: 'POST',
      data: { user_id: userId },
      needAuth: true
    })
  }

  /**
   * 验证教务系统账号密码
   */
  async verifyJwxtCredentials(studentId: string, password: string) {
    return this.request({
      url: '/api/user/verify-jwxt',
      method: 'POST',
      data: {
        student_id: studentId,
        password: password
      }
    })
  }

  /**
   * 验证用户凭据（用户名和学号是否匹配）
   */
  async validateUserCredentials(username: string, studentId: string) {
    return this.request({
      url: '/api/user/validate-credentials',
      method: 'POST',
      data: {
        username: username,
        student_id: studentId
      }
    })
  }

  /**
   * 重置密码
   */
  async resetPassword(userId: string, newPassword: string) {
    return this.request({
      url: '/api/user/reset-password',
      method: 'POST',
      data: {
        user_id: userId,
        new_password: newPassword
      }
    })
  }

  // ==================== 课程相关 ====================

  /**
   * 获取课程表
   */
  async getCourseSchedule(semesterId?: string, weekNumber?: number) {
    // 从本地存储获取用户信息
    const userInfo = Taro.getStorageSync('userInfo')
    
    if (!userInfo || !userInfo.eduUsername || !userInfo.eduPassword) {
      throw new Error('请先登录')
    }
    
    return this.request({
      url: '/api/course/schedule',
      method: 'GET',
      data: {
        username: userInfo.eduUsername,
        password: userInfo.eduPassword,
        semester_id: semesterId,
        week_number: weekNumber
      },
      needAuth: true
    })
  }

  /**
   * 获取成绩
   */
  async getGrades(userId: string, semesterId?: string) {
    return this.request({
      url: '/api/course/grades',
      method: 'GET',
      data: {
        user_id: userId,
        semester_id: semesterId
      },
      needAuth: true
    })
  }

  /**
   * 获取可用学期列表
   */
  async getSemesters(userId: string) {
    return this.request({
      url: '/api/course/semesters',
      method: 'GET',
      data: {
        user_id: userId
      },
      needAuth: true
    })
  }

  // ==================== 公告相关 ====================

  /**
   * 获取公告列表
   */
  async getAnnouncements(params?: { page?: number; limit?: number }) {
    return this.request({
      url: '/api/announcement/list',
      method: 'GET',
      data: params
    })
  }

  /**
   * 获取公告详情
   */
  async getAnnouncementDetail(id: string) {
    return this.request({
      url: '/api/announcement/detail',
      method: 'GET',
      data: { id }
    })
  }

  // ==================== 跳蚤市场相关 ====================

  /**
   * 获取跳蚤市场列表
   */
  async getFleaMarketList(params?: { page?: number; limit?: number; status?: string }) {
    const queryParts = [
      `page=${params?.page || 1}`,
      `limit=${params?.limit || 10}`,
      `status=${params?.status || 'approved'}`
    ]
    
    return this.request({
      url: `/api/flea-market?${queryParts.join('&')}`,
      method: 'GET'
    })
  }
  
  async getFleaMarketDetail(id: string) {
    return this.request({
      url: `/api/flea-market?id=${id}`,
      method: 'GET'
    })
  }

  /**
   * 创建跳蚤市场商品
   */
  async createFleaMarketItem(data: any) {
    return this.request({
      url: '/api/flea-market/create',
      method: 'POST',
      data,
      needAuth: true
    })
  }

  // ==================== 失物招领相关 ====================

  /**
   * 获取失物招领列表
   */
  async getLostFoundList(params?: { page?: number; limit?: number; status?: string }) {
    const queryParts = [
      `page=${params?.page || 1}`,
      `limit=${params?.limit || 10}`
    ]
    
    if (params?.status) {
      queryParts.push(`status=${params.status}`)
    }
    
    return this.request({
      url: `/api/lost-found?${queryParts.join('&')}`,
      method: 'GET'
    })
  }
  
  async getLostFoundDetail(id: string) {
    return this.request({
      url: `/api/lost-found?id=${id}`,
      method: 'GET'
    })
  }

  /**
   * 创建失物招领信息
   */
  async createLostFoundItem(data: any) {
    return this.request({
      url: '/api/lost-found/create',
      method: 'POST',
      data,
      needAuth: true
    })
  }
}

export const apiService = new ApiService()