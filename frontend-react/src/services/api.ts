// API服务文件，用于处理前端与后端的对接
const API_BASE_URL = 'https://api.xisu.leisureea.cn'; // 后端API基础URL

// API服务类
class ApiService {
  // 统一请求处理，拦截 401/403
  private static async request(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
    const response = await fetch(input, init);
    
    // 检查是否未授权
    if (response.status === 401 || response.status === 403) {
      // 触发自定义事件，通知 App 组件登出
      window.dispatchEvent(new CustomEvent('auth:unauthorized'));
    }
    
    return response;
  }

  // 用户相关API
  static async userLogin(username: string, password: string) {
    const response = await this.request(`${API_BASE_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  }

  static async userRegister(userData: any) {
    const response = await this.request(`${API_BASE_URL}/api/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  }

  // 管理员认证相关API
  static async adminLogin(username: string, password: string) {
    const response = await this.request(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 携带 cookie
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  }

  // 管理员登出
  static async adminLogout() {
    const response = await this.request(`${API_BASE_URL}/api/admin/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include', // 携带 cookie
    });
    return response.json();
  }

  // 验证管理员 session 是否有效
  static async validateAdminSession() {
    try {
      // 这里保持使用 fetch，避免触发全局未授权事件（虽然触发也没关系，但保持纯净）
      const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`, {
        credentials: 'include',
      });
      // 如果返回 401 或 403，说明 session 无效
      if (response.status === 401 || response.status === 403) {
        return { valid: false };
      }
      const data = await response.json();
      // 如果返回了错误信息，也认为无效
      if (data.error && (data.error.includes('未登录') || data.error.includes('权限'))) {
        return { valid: false };
      }
      return { valid: true };
    } catch (error) {
      console.error('验证 session 失败:', error);
      return { valid: false };
    }
  }

  // 管理员仪表板相关API
  static async getDashboardStats() {
    const response = await this.request(`${API_BASE_URL}/api/admin/dashboard/stats`, {
      credentials: 'include',
    });
    return response.json();
  }

  static async getRecentAnnouncements() {
    const response = await this.request(`${API_BASE_URL}/api/admin/dashboard/recent-announcements`, {
      credentials: 'include',
    });
    return response.json();
  }

  static async getPendingItems() {
    const response = await this.request(`${API_BASE_URL}/api/admin/dashboard/pending-items`, {
      credentials: 'include',
    });
    return response.json();
  }

  // 课程相关API
  static async getCourseSchedule(userId: string) {
    const response = await this.request(`${API_BASE_URL}/api/course/schedule?user_id=${userId}`);
    return response.json();
  }

  static async getCourseGrades(userId: string) {
    const response = await this.request(`${API_BASE_URL}/api/course/grades?user_id=${userId}`);
    return response.json();
  }

  static async getCourseData(userId: string) {
    try {
      const scheduleData = await this.getCourseSchedule(userId);
      const gradesData = await this.getCourseGrades(userId);
      
      return {
        schedule: scheduleData.data?.schedule || [],
        grades: gradesData.data?.grades || []
      };
    } catch (error) {
      console.error('获取课程数据失败:', error);
      return {
        schedule: [],
        grades: []
      };
    }
  }

  // 公告相关API
  static async getAnnouncementList() {
    const response = await this.request(`${API_BASE_URL}/api/announcement/list`);
    return response.json();
  }

  static async getAnnouncementDetail(id: string) {
    const response = await this.request(`${API_BASE_URL}/api/announcement/detail?id=${id}`);
    return response.json();
  }

  static async createAnnouncement(announcementData: any) {
    const response = await this.request(`${API_BASE_URL}/api/announcement/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',  // 携带 session cookie
      body: JSON.stringify(announcementData),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '创建公告失败');
    }
    return data;
  }

  // 上传图片
  static async uploadImage(file: File, isPublic: boolean = false): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append('file', file);
    
    const url = isPublic 
      ? `${API_BASE_URL}/api/upload/image?public=1`
      : `${API_BASE_URL}/api/upload/image`;
    
    const response = await this.request(url, {
      method: 'POST',
      body: formData,
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '上传失败');
    }
    return data;
  }

  static async updateAnnouncement(id: string, announcementData: any) {
    const response = await this.request(`${API_BASE_URL}/api/announcement/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',  // 携带 session cookie
      body: JSON.stringify({ id, ...announcementData }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '更新公告失败');
    }
    return data;
  }

  static async deleteAnnouncement(id: string) {
    const response = await this.request(`${API_BASE_URL}/api/announcement/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',  // 携带 session cookie
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '删除公告失败');
    }
    return data;
  }

  // 跳蚤市场相关API
  static async getFleaMarketList(params?: { status?: string; page?: number; limit?: number }) {
    const queryParts = [];
    if (params?.status) {
      queryParts.push(`status=${params.status}`);
    }
    if (params?.page) {
      queryParts.push(`page=${params.page}`);
    }
    if (params?.limit) {
      queryParts.push(`limit=${params.limit}`);
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await this.request(`${API_BASE_URL}/api/flea-market/list${queryString}`, {
      credentials: 'include',
    });
    return response.json();
  }

  static async createFleaMarketItem(itemData: any) {
    const response = await this.request(`${API_BASE_URL}/api/flea-market/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(itemData),
    });
    return response.json();
  }

  static async updateFleaMarketItem(itemData: any) {
    const response = await this.request(`${API_BASE_URL}/api/flea-market/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(itemData),
    });
    return response.json();
  }

  static async deleteFleaMarketItem(id: string) {
    const response = await this.request(`${API_BASE_URL}/api/flea-market/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ id }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '删除失败');
    }
    return data;
  }

  // 审核通过跳蚤市场商品
  static async approveFleaMarketItem(id: string) {
    const response = await this.request(`${API_BASE_URL}/api/flea-market/approve?id=${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ status: 'approved' }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '审核失败');
    }
    return data;
  }

  // 拒绝跳蚤市场商品
  static async rejectFleaMarketItem(id: string, reason: string) {
    const response = await this.request(`${API_BASE_URL}/api/flea-market/approve?id=${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ status: 'rejected', reason }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '拒绝失败');
    }
    return data;
  }

  // 失物招领相关API
  static async getLostFoundList(params?: { category?: string; page?: number; limit?: number }) {
    const queryParts = [];
    if (params?.category) {
      queryParts.push(`category=${params.category}`);
    }
    if (params?.page) {
      queryParts.push(`page=${params.page}`);
    }
    if (params?.limit) {
      queryParts.push(`limit=${params.limit}`);
    }
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await this.request(`${API_BASE_URL}/api/lost-found${queryString}`, {
      credentials: 'include',
    });
    return response.json();
  }

  static async createLostFoundItem(itemData: any) {
    const response = await this.request(`${API_BASE_URL}/api/lost-found/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(itemData),
    });
    return response.json();
  }

  static async updateLostFoundItem(itemData: any) {
    const response = await this.request(`${API_BASE_URL}/api/lost-found/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(itemData),
    });
    return response.json();
  }

  static async deleteLostFoundItem(id: string) {
    const response = await this.request(`${API_BASE_URL}/api/admin/lost-found/delete?id=${id}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '删除失败');
    }
    return data;
  }

  // 获取公告列表（用于前端组件）
  static async getAnnouncements() {
    try {
      const data = await this.getAnnouncementList();
      const announcements = data.data || [];
      // 转换字段名以匹配前端期望的格式
      return announcements.map((announcement: any) => ({
        id: announcement.id,
        title: announcement.title,
        content: announcement.content,
        author: announcement.author_name || announcement.author || '未知',
        publishDate: announcement.created_at ? announcement.created_at.split(' ')[0] : '',
        images: announcement.images ? JSON.parse(announcement.images) : [],
        isPinned: !!(announcement.is_pinned)
      }));
    } catch (error) {
      console.error('获取公告列表失败:', error);
      return [];
    }
  }

  // 用户管理相关API - 后端暂未实现，使用模拟数据
  static async getUserList() {
    const res = await this.request(`${API_BASE_URL}/api/admin/users/list`, {
      credentials: 'include',
    });
    return res.json();
  }

  static async createUser(userData: any) {
    const payload = {
      student_id: userData.studentId,
      name: userData.name,
      email: userData.email,
      role: userData.role === 'student' ? 'user' : userData.role,
    };
    const res = await this.request(`${API_BASE_URL}/api/admin/users/create`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async updateUserRole(userId: string, role: string) {
    const payload = { user_id: Number(userId), role: role === '学生' ? 'user' : role };
    const res = await this.request(`${API_BASE_URL}/api/admin/users/update-role`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    return res.json();
  }

  static async deleteUser(userId: string) {
    const res = await this.request(`${API_BASE_URL}/api/admin/users/delete`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include', // 携带 cookie，使后端能读取 session
      body: JSON.stringify({ user_id: Number(userId) }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw { response: { data } };
    }
    return data;
  }

  // 获取用户详情（包含教务系统密码）
  static async getUserDetail(userId: string) {
    const res = await this.request(`${API_BASE_URL}/api/admin/users/detail?user_id=${userId}`, {
      method: 'GET',
      credentials: 'include',
    });
    const data = await res.json();
    if (!res.ok) {
      throw { response: { data } };
    }
    return data.data;
  }

  // 更新用户信息
  static async updateUser(userId: string, userData: any) {
    const payload = {
      user_id: Number(userId),
      username: userData.username,
      name: userData.name,
      edu_system_username: userData.studentId,
      edu_system_password: userData.eduPassword || undefined,
      password: userData.password || undefined, // 小程序登录密码
      role: userData.role,
    };
    const res = await this.request(`${API_BASE_URL}/api/admin/users/update`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!res.ok) {
      throw { response: { data } };
    }
    return data;
  }

  // 获取用户列表（用于前端组件）
  static async getUsers() {
    try {
      const data = await this.getUserList();
      return (data.data || []).map((u: any) => ({
        id: String(u.uid),
        username: u.username || '',
        name: u.name || '',
        studentId: u.edu_system_username || '', // 学号
        role: u.role || 'user',
        status: 'active', // 简化处理，默认为活跃状态
        createdAt: u.created_at || null,
        lastLoginAt: u.last_login_at || null,
        lastLoginIp: u.last_login_ip || null,
      }));
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return [];
    }
  }

  // 系统日志管理相关API
  static async getSystemLogs(params?: { page?: number; limit?: number; action?: string; start_date?: string; end_date?: string }) {
    const queryParts = [];
    if (params?.page) queryParts.push(`page=${params.page}`);
    if (params?.limit) queryParts.push(`limit=${params.limit}`);
    if (params?.action) queryParts.push(`action=${params.action}`);
    if (params?.start_date) queryParts.push(`start_date=${params.start_date}`);
    if (params?.end_date) queryParts.push(`end_date=${params.end_date}`);
    
    const queryString = queryParts.length > 0 ? `?${queryParts.join('&')}` : '';
    const response = await this.request(`${API_BASE_URL}/api/admin/system-logs/list${queryString}`, {
      credentials: 'include',
    });
    return response.json();
  }

  static async getSystemLogStats() {
    const response = await this.request(`${API_BASE_URL}/api/admin/system-logs/stats`, {
      credentials: 'include',
    });
    return response.json();
  }

  static async getSystemLogActionTypes() {
    const response = await this.request(`${API_BASE_URL}/api/admin/system-logs/action-types`, {
      credentials: 'include',
    });
    return response.json();
  }

  // 通知管理相关API
  static async getNotificationSettings() {
    const response = await this.request(`${API_BASE_URL}/api/admin/notifications/settings`, {
      credentials: 'include',
    });
    return response.json();
  }

  static async updateNotificationSettings(data: { settings: Record<string, string> }) {
    const response = await this.request(`${API_BASE_URL}/api/admin/notifications/settings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify(data),
    });
    return response.json();
  }

  static async testBarkNotification() {
    const response = await this.request(`${API_BASE_URL}/api/admin/notifications/test-bark`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
    });
    return response.json();
  }

  // 功能开关管理相关API
  static async getFeatureList() {
    const response = await this.request(`${API_BASE_URL}/api/admin/features/list`, {
      credentials: 'include',
    });
    return response.json();
  }

  static async toggleFeature(featureKey: string, isEnabled: boolean) {
    const response = await this.request(`${API_BASE_URL}/api/admin/features/toggle`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({
        feature_key: featureKey,
        is_enabled: isEnabled ? 1 : 0
      }),
    });
    return response.json();
  }

  static async updateFeature(id: number, data: { offline_message?: string; is_enabled?: number }) {
    const response = await this.request(`${API_BASE_URL}/api/admin/features/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ id, ...data }),
    });
    return response.json();
  }

  // 设置公告置顶状态（管理员）
  static async setAnnouncementPinned(id: string, isPinned: boolean) {
    const response = await this.request(`${API_BASE_URL}/api/announcement/set-pinned`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'include',
      body: JSON.stringify({ id, is_pinned: isPinned ? 1 : 0 }),
    });
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.error || '设置置顶状态失败');
    }
    return data;
  }
}

export default ApiService;
