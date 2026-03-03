import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const routes: RouteRecordRaw[] = [
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/login/index.vue'),
    meta: { title: '登录', public: true },
  },
  {
    path: '/',
    component: () => import('@/layout/index.vue'),
    redirect: '/dashboard',
    children: [
      {
        path: 'dashboard',
        name: 'Dashboard',
        component: () => import('@/views/dashboard/index.vue'),
        meta: { title: '仪表盘', icon: 'Odometer' },
      },
      {
        path: 'users',
        name: 'Users',
        component: () => import('@/views/users/index.vue'),
        meta: { title: '用户管理', icon: 'User' },
      },
      {
        path: 'announcements',
        name: 'Announcements',
        component: () => import('@/views/announcements/index.vue'),
        meta: { title: '公告管理', icon: 'Bell' },
      },
      {
        path: 'announcements/create',
        name: 'AnnouncementCreate',
        component: () => import('@/views/announcements/edit.vue'),
        meta: { title: '发布公告', hidden: true },
      },
      {
        path: 'announcements/:id/edit',
        name: 'AnnouncementEdit',
        component: () => import('@/views/announcements/edit.vue'),
        meta: { title: '编辑公告', hidden: true },
      },
      {
        path: 'logs',
        name: 'Logs',
        component: () => import('@/views/logs/index.vue'),
        meta: { title: '系统日志', icon: 'Document' },
      },
      {
        path: 'settings',
        name: 'Settings',
        component: () => import('@/views/settings/index.vue'),
        meta: { title: '系统设置', icon: 'Setting' },
      },
    ],
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/dashboard',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  document.title = `${to.meta.title || '管理后台'} - 知外助手`

  if (to.meta.public) {
    next()
    return
  }

  const authStore = useAuthStore()
  if (!authStore.isLoggedIn) {
    next('/login')
    return
  }

  next()
})

export default router
