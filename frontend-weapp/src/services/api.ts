import Taro from '@tarojs/taro'

// API 基础配置
const BASE_URL = 'https://api.xisu.leisureea.cn' // PHP后端地址

export const API_BASE_URL = BASE_URL

export const toAbsoluteUrl = (url?: string): string => {
  if (!url) return ''
  if (/^https?:\/\//i.test(url)) return url
  return BASE_URL + url
}

interface RequestOptions {
  url: string
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  data?: any
  header?: Record<string, string>
  needAuth?: boolean
}

class ApiService {
  // 进行中请求去重池：相同 method+url+data 的请求复用同一个 Promise
  private inflight: Map<string, Promise<any>> = new Map()

  // 稳定序列化，确保对象 key 顺序一致
  private stableStringify(obj: any): string {
    if (obj === null || obj === undefined) return ''
    if (typeof obj !== 'object') return String(obj)
    if (Array.isArray(obj)) return '[' + obj.map((v) => this.stableStringify(v)).join(',') + ']'
    const keys = Object.keys(obj).sort()
    const parts = keys.map((k) => `${JSON.stringify(k)}:${this.stableStringify((obj as any)[k])}`)
    return '{' + parts.join(',') + '}'
  }

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

      // 去重 key（不包含 headers，避免 Authorization 差异导致无法合并；默认一个端同一时刻仅有一个登录用户）
      const dedupeKey = `${method} ${url} ${this.stableStringify(data)}`
      if (this.inflight.has(dedupeKey)) {
        return (this.inflight.get(dedupeKey) as Promise<any>) as Promise<T>
      }

      const p = Taro.request({
        url: BASE_URL + url,
        method,
        data,
        header: headers
      })
      // 将请求 Promise 放入去重池
      this.inflight.set(dedupeKey, p as unknown as Promise<any>)

      const response = await p.finally(() => {
        // 请求完成后移除去重标记
        this.inflight.delete(dedupeKey)
      })

      // 接受所有 2xx 状态码为成功
      if (response.statusCode >= 200 && response.statusCode < 300) {
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
   * @param username 用户自定义的用户名
   * @param name 从教务系统获取的真实姓名
   */
  async register(data: {
    username: string
    name: string
    password: string
    studentId: string
    jwxtPassword: string
    avatarUrl?: string
  }) {
    return this.request({
      url: '/api/user/register',
      method: 'POST',
      data: {
        username: data.username,
        name: data.name,
        password: data.password,
        edu_system_username: data.studentId,
        edu_system_password: data.jwxtPassword,
        avatar_url: data.avatarUrl
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
        username: username,
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
   * 从教务系统获取用户信息(姓名等)
   */
  async getUserInfoFromJwxt(studentId: string, password: string) {
    return this.request({
      url: '/api/user/get-jwxt-userinfo',
      method: 'POST',
      data: {
        student_id: studentId,
        password: password
      }
    })
  }

  /**
   * 验证用户凭据（用户名是否存在）
   */
  async validateUserCredentials(username: string) {
    return this.request({
      url: '/api/user/validate-credentials',
      method: 'POST',
      data: {
        username: username
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

  /**
   * 更新用户头像
   */
  async updateAvatar(userId: string, avatarUrl: string) {
    return this.request({
      url: '/api/user/update-avatar',
      method: 'POST',
      data: {
        user_id: userId,
        avatar_url: avatarUrl
      },
      needAuth: true
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
    
    // 构建请求参数，过滤掉 undefined 值
    const data: Record<string, any> = {
      username: userInfo.eduUsername,
      password: userInfo.eduPassword
    }
    if (semesterId !== undefined && semesterId !== null) {
      data.semester_id = semesterId
    }
    if (weekNumber !== undefined && weekNumber !== null) {
      data.week_number = weekNumber
    }
    
    return this.request({
      url: '/api/course/schedule',
      method: 'GET',
      data,
      needAuth: true
    })
  }

  /**
   * 获取成绩
   */
  async getGrades(userId: string, semesterId?: string) {
    const data: Record<string, any> = {
      user_id: userId
    }
    if (semesterId !== undefined && semesterId !== null) {
      data.semester_id = semesterId
    }
    
    return this.request({
      url: '/api/course/grades',
      method: 'GET',
      data,
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

  /**
   * 获取考试安排
   */
  async getExams(semesterId?: string) {
    const userInfo = Taro.getStorageSync('userInfo')
    
    if (!userInfo || !userInfo.eduUsername || !userInfo.eduPassword) {
      throw new Error('请先登录')
    }
    
    const data: Record<string, any> = {
      username: userInfo.eduUsername,
      password: userInfo.eduPassword
    }
    if (semesterId !== undefined && semesterId !== null) {
      data.semester_id = semesterId
    }
    
    return this.request({
      url: '/api/course/exams',
      method: 'GET',
      data,
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

  /**
   * 获取用户未查看的置顶公告
   */
  async getPinnedAnnouncements() {
    return this.request({
      url: '/api/announcement/pinned',
      method: 'GET',
      needAuth: false
    })
  }

  /**
   * 标记公告为已查看
   */
  // 标记已查看（当前需求不需要后端标记，保留接口以备后用）
  async markAnnouncementViewed(_announcementId: number, _userId?: string | number) {
    return { success: true }
  }

  // ==================== 跳蚤市场相关 ====================

  /**
   * 获取跳蚤市场列表
   */
  async getFleaMarketList(params?: { page?: number; limit?: number; status?: string; category?: string; publisher_uid?: string | number; q?: string }) {
    const queryParts = [
      `page=${params?.page || 1}`,
      `limit=${params?.limit || 10}`,
      `status=${params?.status || 'approved'}`
    ]
    if (params?.category) {
      queryParts.push(`category=${encodeURIComponent(params.category)}`)
    }
    if (params?.publisher_uid) {
      queryParts.push(`publisher_uid=${params.publisher_uid}`)
    }
    if (params?.q) {
      queryParts.push(`q=${encodeURIComponent(params.q)}`)
    }
    
    return this.request({
      url: `/api/flea-market?${queryParts.join('&')}`,
      method: 'GET'
    })
  }
  
  async getFleaMarketDetail(id: string) {
    const userInfo = Taro.getStorageSync('userInfo') || {}
    const userId = userInfo.userId || userInfo.uid
    const suffix = userId ? `&user_id=${userId}` : ''
    return this.request({
      url: `/api/flea-market?id=${id}${suffix}`,
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

  async updateFleaMarketItem(id: string, data: any) {
    try {
      const userInfo = Taro.getStorageSync('userInfo') || {}
      const userId = data?.user_id || userInfo.userId || userInfo.uid
      const body = { ...data, user_id: userId }
      return this.request({ url: `/api/flea-market/update?id=${id}`, method: 'POST', data: body, needAuth: true })
    } catch (e) {
      return this.request({ url: `/api/flea-market/update?id=${id}`, method: 'POST', data, needAuth: true })
    }
  }

  async deleteFleaMarketItem(id: string, userId: string) {
    return this.request({ url: `/api/flea-market/delete?id=${id}&user_id=${userId}`, method: 'POST', needAuth: true })
  }

  // ==================== 消息相关 ====================
  async getMyMessages(params?: { page?: number; limit?: number; action?: string }) {
    const userInfo = Taro.getStorageSync('userInfo') || {}
    const userId = userInfo.userId || userInfo.uid
    const page = params?.page || 1
    const limit = params?.limit || 10
    const action = params?.action
    const actionPart = action ? `&action=${encodeURIComponent(action)}` : ''
    return this.request({ url: `/api/message/list?user_id=${userId}&page=${page}&limit=${limit}${actionPart}`, method: 'GET', needAuth: true })
  }

  // ==================== 失物招领相关 ====================

  /**
   * 获取失物招领列表
   */
  async getLostFoundList(params?: { page?: number; limit?: number; status?: string; q?: string; publisher_uid?: string|number; category?: string }) {
    const queryParts = [
      `page=${params?.page || 1}`,
      `limit=${params?.limit || 10}`
    ]
    
    if (params?.status) {
      queryParts.push(`status=${params.status}`)
    }
    if (params?.q) {
      queryParts.push(`q=${encodeURIComponent(params.q)}`)
    }
    if (params?.publisher_uid) {
      queryParts.push(`publisher_uid=${params.publisher_uid}`)
    }
    if (params?.category) {
      queryParts.push(`category=${encodeURIComponent(params.category)}`)
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

  async updateLostFoundItem(id: string, data: any) {
    // 注入 user_id 以便后端校验发布者
    const userInfo = Taro.getStorageSync('userInfo') || {}
    const userId = data?.user_id || userInfo.userId || userInfo.uid
    const body = { ...data, user_id: userId }
    return this.request({ url: `/api/lost-found/update?id=${id}`, method: 'POST', data: body, needAuth: true })
  }

    async deleteLostFoundItem(id: string, userId?: string|number) {
    const uid = userId || (Taro.getStorageSync('userInfo')||{}).userId || (Taro.getStorageSync('userInfo')||{}).uid
    return this.request({ url: `/api/lost-found/delete?id=${id}&user_id=${uid}`, method: 'POST', needAuth: true })
  }

  /**
   * 更新用户活跃状态（小程序启动时调用）
   */
 
  async updateUserActivity(userId: string | number) {
    return this.request({
      url: '/api/user/update-activity',
      method: 'POST',
      data: {
        user_id: userId
      }
    })
  }

  /**
   * 获取功能配置（小程序启动时调用）
   */
  async getFeatureSettings() {
    return this.request({
      url: '/api/feature/settings',
      method: 'GET',
      needAuth: false
    })
  }
}




export const apiService = new ApiService()