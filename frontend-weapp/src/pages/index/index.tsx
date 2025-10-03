import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'
import { apiService } from '../../services/api'
import AppIcon, { AppIconName } from '../../components/AppIcon/index'

type AppItem = { name: string; action: AppIconName; color: string }

interface IndexState {
  apps: AppItem[]
  announcements: Array<{ id: string; title: string }>
  page: number
  limit: number
  hasMore: boolean
  loadingAnnouncements: boolean
}

export default class IndexPage extends Component<any, IndexState> {

  state: IndexState = {
    // 基于原始 front/AppsPage.tsx 的应用列表
    apps: [
      { name: '成绩查询', action: 'grades', color: '#3b82f6' },
      { name: '校内地图', action: 'map', color: '#ef4444' },
      { name: '成绩订阅', action: 'subscribe', color: '#eab308' },
      { name: '校内电话', action: 'phone', color: '#f97316' },
      { name: '跳蚤市场', action: 'market', color: '#fb923c' },
      { name: '失物招领', action: 'lost', color: '#2563eb' },
      { name: '通勤车', action: 'bus', color: '#1d4ed8' },
      { name: '饿了么红包', action: 'eleme', color: '#a16207' },
      { name: '美团红包', action: 'coupon', color: '#ca8a04' },
      { name: '本科招生', action: 'admission', color: '#dc2626' }
    ],
    // 公告数据
    announcements: [] as Array<{ id: string; title: string }>,
    page: 1,
    limit: 6,
    hasMore: true,
    loadingAnnouncements: false
  }

  componentDidMount() {
    // 页面加载时的逻辑
    this.loadAnnouncements(1)
  }

  /** @param {any} app */
  onAppClick = (app: AppItem) => {
    switch (app.action) {
      case 'grades':
        Taro.navigateTo({
          url: '/pages/grades/index'
        })
        break
      case 'market':
        Taro.navigateTo({
          url: '/pages/flea-market/index'
        })
        break
      case 'lost':
        Taro.navigateTo({
          url: '/pages/lost-found/index'
        })
        break
      case 'eleme':
        this.showComingSoon(app.name)
        break
      default:
        this.showComingSoon(app.name)
    }
  }

  // 加载公告列表
  loadAnnouncements = async (page: number) => {
    if (this.state.loadingAnnouncements) return
    this.setState({ loadingAnnouncements: true })
    try {
      const res: any = await apiService.getAnnouncements({ page, limit: this.state.limit })
      const list: Array<{ id: string; title: string }> = res?.list || res?.data || []
      const hasMore = list.length >= this.state.limit
      this.setState(prev => ({
        announcements: page === 1 ? list : prev.announcements.concat(list),
        page,
        hasMore
      }))
    } catch (e) {
      console.error('获取公告失败', e)
      Taro.showToast({ title: '公告加载失败', icon: 'none' })
    } finally {
      this.setState({ loadingAnnouncements: false })
    }
  }

  // 点击公告，拉取详情并弹窗展示
  onAnnouncementClick = async (id: string) => {
    try {
      const detail: any = await apiService.getAnnouncementDetail(id)
      // 兼容多种后端返回结构
      const title = detail?.title || detail?.data?.title || detail?.announcement?.title || '公告'
      const contentRaw = detail?.content || detail?.data?.content || detail?.announcement?.content || detail?.body || ''
      const text = String(contentRaw)
        .replace(/<style[\s\S]*?<\/style>/gi, '')
        .replace(/<script[\s\S]*?<\/script>/gi, '')
        .replace(/<[^>]+>/g, '')
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .trim()
      const content = text || '暂无内容'
      Taro.showModal({ title, content: content.slice(0, 1000), showCancel: false })
    } catch (e) {
      console.error('获取公告详情失败', e)
      Taro.showToast({ title: '获取详情失败', icon: 'none' })
    }
  }

  /** @param {string} appName */
  showComingSoon = (appName: string) => {
    Taro.showModal({
      title: '敬请期待',
      content: `${appName}功能即将上线，敬请期待！`,
      showCancel: false
    })
  }

  render() {
    const { apps } = this.state as any
    const topApps = apps.slice(0, 5)
    const bottomApps = apps.slice(5)

    return (
      <View className="apps-page">
        {/* 状态栏占位 */}
        <View className="status-bar-placeholder"></View>
        
        {/* 顶部欢迎横幅 */}
        <View className="welcome-banner">
          <View className="decoration decoration-top"></View>
          <View className="decoration decoration-bottom"></View>
          <View className="banner-content">
            <View className="greeting">
              <Text className="hello-text">Hello</Text>
              <Text className="name-text">西外</Text>
            </View>
            <Text className="subtitle">Xisuer</Text>
            <Text className="subtitle">便捷课表，服务校区</Text>
          </View>
          <View className="banner-illustration">
            <View className="illustration-item orange"></View>
            <View className="illustration-item yellow"></View>
          </View>
        </View>


        {/* 应用网格 */}
        <View className="apps-content">
          {/* 应用卡片容器 */}
          <View className="apps-card">
            <View className="apps-row">
              {topApps.map((app: AppItem, index: number) => (
                <View key={index} className="app-item" onClick={() => this.onAppClick(app)}>
                  <View className="app-icon">
                    <AppIcon name={app.action} color={app.color} />
                  </View>
                  <Text className="app-name">{app.name}</Text>
                </View>
              ))}
            </View>
            <View className="apps-row">
              {bottomApps.map((app: AppItem, index: number) => (
                <View key={index} className="app-item" onClick={() => this.onAppClick(app)}>
                  <View className="app-icon">
                    <AppIcon name={app.action} color={app.color} />
                  </View>
                  <Text className="app-name">{app.name}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* 公告卡片区域（替换伪代码） */}
          <View className="announcements">
            <View className="announcement-card">
              <Text className="announcement-title">公告</Text>
              <View className="announcement-list">
                {this.state.announcements.map(item => (
                  <View key={item.id} className="announcement-item" onClick={() => this.onAnnouncementClick(item.id)}>
                    <Text className="announcement-text">{item.title}</Text>
                  </View>
                ))}
                {!this.state.announcements.length && (
                  <View className="announcement-item">
                    <Text className="announcement-text">暂无公告</Text>
                  </View>
                )}
              </View>
              {this.state.hasMore && (
                <View className="announcement-more" onClick={() => this.loadAnnouncements(this.state.page + 1)}>
                  <Text className="more-text">加载更多</Text>
                </View>
              )}
            </View>
          </View>
        </View>
      </View>
    )
  }
}
