import request from '@/utils/request'

// 认证相关
export const authApi = {
  login: (data: { studentId: string; password: string }) =>
    request.post('/auth/login', data),
  refreshToken: (refreshToken: string) =>
    request.post('/auth/refresh', { refreshToken }),
  logout: () => request.post('/auth/logout'),
  changePassword: (oldPassword: string, newPassword: string) =>
    request.post('/auth/change-password', { oldPassword, newPassword }),
}

// 管理后台
export const adminApi = {
  getDashboardStats: () => request.get('/admin/dashboard/stats'),
  getPendingItems: () => request.get('/admin/dashboard/pending-items'),
  getFeatureFlags: () => request.get('/admin/features'),
  updateFeatureFlag: (name: string, isEnabled: boolean) =>
    request.post(`/admin/features/${name}`, { isEnabled }),
  getConfig: () => request.get('/admin/config'),
  updateConfig: (configs: Record<string, string>) =>
    request.post('/admin/config', { configs }),
}

// 用户管理
export const usersApi = {
  getList: (params: Record<string, any>) => request.get('/users', { params }),
  getById: (id: string) => request.get(`/users/${id}`),
  getMe: () => request.get('/users/me'),
  adminUpdate: (id: string, data: Record<string, any>) =>
    request.put(`/users/${id}/admin`, data),
  delete: (id: string) => request.delete(`/users/${id}`),
}

// 公告管理
export const announcementsApi = {
  getList: (params: Record<string, any>) =>
    request.get('/announcements', { params }),
  getById: (id: string) => request.get(`/announcements/${id}`),
  create: (data: Record<string, any>) => request.post('/announcements', data),
  update: (id: string, data: Record<string, any>) =>
    request.put(`/announcements/${id}`, data),
  delete: (id: string) => request.delete(`/announcements/${id}`),
  publish: (id: string) => request.post(`/announcements/${id}/publish`),
  togglePin: (id: string) => request.post(`/announcements/${id}/pin`),
}

// 系统日志
export const logsApi = {
  getList: (params: Record<string, any>) =>
    request.get('/admin/system-logs', { params }),
  getActionTypes: () => request.get('/admin/system-logs/action-types'),
  getStats: () => request.get('/admin/system-logs/stats'),
}
