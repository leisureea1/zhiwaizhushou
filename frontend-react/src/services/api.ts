// API服务文件，用于处理前端与后端的对接
const API_BASE_URL = 'http://localhost:8000'; // 后端API基础URL

// API服务类
class ApiService {
  // 用户相关API
  static async userLogin(username: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/user/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ username, password }),
    });
    return response.json();
  }

  static async userRegister(userData: any) {
    const response = await fetch(`${API_BASE_URL}/api/user/register`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(userData),
    });
    return response.json();
  }

  // 管理员认证相关API
  static async adminLogin(studentId: string, password: string) {
    const response = await fetch(`${API_BASE_URL}/api/admin/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ student_id: studentId, password }),
    });
    return response.json();
  }

  // 管理员登出
  static async adminLogout() {
    const response = await fetch(`${API_BASE_URL}/api/admin/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    return response.json();
  }

  // 管理员仪表板相关API
  static async getDashboardStats() {
    const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/stats`);
    return response.json();
  }

  static async getRecentAnnouncements() {
    const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/recent-announcements`);
    return response.json();
  }

  static async getPendingItems() {
    const response = await fetch(`${API_BASE_URL}/api/admin/dashboard/pending-items`);
    return response.json();
  }

  // 课程相关API
  static async getCourseSchedule(userId: string) {
    const response = await fetch(`${API_BASE_URL}/api/course/schedule?user_id=${userId}`);
    return response.json();
  }

  static async getCourseGrades(userId: string) {
    const response = await fetch(`${API_BASE_URL}/api/course/grades?user_id=${userId}`);
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
    const response = await fetch(`${API_BASE_URL}/api/announcement/list`);
    return response.json();
  }

  static async getAnnouncementDetail(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/announcement/detail?id=${id}`);
    return response.json();
  }

  static async createAnnouncement(announcementData: any) {
    const response = await fetch(`${API_BASE_URL}/api/announcement/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(announcementData),
    });
    return response.json();
  }

  static async updateAnnouncement(announcementData: any) {
    const response = await fetch(`${API_BASE_URL}/api/announcement/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(announcementData),
    });
    return response.json();
  }

  static async deleteAnnouncement(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/announcement/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    return response.json();
  }

  // 跳蚤市场相关API
  static async getFleaMarketList() {
    const response = await fetch(`${API_BASE_URL}/api/flea-market/list`);
    return response.json();
  }

  static async createFleaMarketItem(itemData: any) {
    const response = await fetch(`${API_BASE_URL}/api/flea-market/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
    return response.json();
  }

  static async updateFleaMarketItem(itemData: any) {
    const response = await fetch(`${API_BASE_URL}/api/flea-market/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
    return response.json();
  }

  static async deleteFleaMarketItem(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/flea-market/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    return response.json();
  }

  // 失物招领相关API
  static async getLostFoundList() {
    const response = await fetch(`${API_BASE_URL}/api/lost-found/list`);
    return response.json();
  }

  static async createLostFoundItem(itemData: any) {
    const response = await fetch(`${API_BASE_URL}/api/lost-found/create`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
    return response.json();
  }

  static async updateLostFoundItem(itemData: any) {
    const response = await fetch(`${API_BASE_URL}/api/lost-found/update`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(itemData),
    });
    return response.json();
  }

  static async deleteLostFoundItem(id: string) {
    const response = await fetch(`${API_BASE_URL}/api/lost-found/delete`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ id }),
    });
    return response.json();
  }

  // 获取公告列表（用于前端组件）
  static async getAnnouncements() {
    try {
      const data = await this.getAnnouncementList();
      return data.data || [];
    } catch (error) {
      console.error('获取公告列表失败:', error);
      return [];
    }
  }

  // 用户管理相关API - 后端暂未实现，使用模拟数据
  static async getUserList() {
    // 后端暂未实现用户管理API，返回模拟数据
    return {
      success: true,
      data: [
        {
          id: '1',
          studentId: '20210001',
          username: 'zhangsan',
          name: '张三',
          email: 'zhangsan@example.com',
          role: 'student',
          status: 'active',
          lastLogin: '2024-01-15 10:30'
        },
        {
          id: '2',
          studentId: '20210002',
          username: 'lisi',
          name: '李四',
          email: 'lisi@example.com',
          role: 'student',
          status: 'inactive',
          lastLogin: '2024-01-10 14:20'
        },
        {
          id: '3',
          studentId: '20210003',
          username: 'wangwu',
          name: '王五',
          email: 'wangwu@example.com',
          role: 'teacher',
          status: 'active',
          lastLogin: '2024-01-16 09:15'
        }
      ]
    };
  }

  static async createUser(userData: any) {
    // 后端暂未实现用户创建API，模拟成功响应
    console.log('创建用户:', userData);
    return { success: true, message: '用户创建成功' };
  }

  static async updateUserRole(userId: string, role: string) {
    // 后端暂未实现用户角色更新API，模拟成功响应
    console.log('更新用户角色:', userId, role);
    return { success: true, message: '用户角色更新成功' };
  }

  static async deleteUser(userId: string) {
    // 后端暂未实现用户删除API，模拟成功响应
    console.log('删除用户:', userId);
    return { success: true, message: '用户删除成功' };
  }

  // 获取用户列表（用于前端组件）
  static async getUsers() {
    try {
      const data = await this.getUserList();
      return data.data || [];
    } catch (error) {
      console.error('获取用户列表失败:', error);
      return [];
    }
  }
}

export default ApiService;