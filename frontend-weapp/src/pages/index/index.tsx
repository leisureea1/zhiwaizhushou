import { Component } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'
import { apiService } from '../../services/api'
import AppIcon, { AppIconName } from '../../components/AppIcon/index'

type AppItem = { name: string; action: AppIconName; color: string; disabled?: boolean }

interface IndexState {
  apps: AppItem[]
  announcements: Array<{ id: string; title: string; cover?: string; excerpt?: string }>
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
      { name: '流量卡办理', action: 'flowcard', color: '#eab308' },
      { name: '校内电话', action: 'phone', color: '#f97316' },
      { name: '跳蚤市场', action: 'market', color: '#fb923c' },
      { name: '失物招领', action: 'lost', color: '#2563eb' },
      { name: '通勤车', action: 'bus', color: '#1d4ed8' },
      { name: '饿了么红包', action: 'eleme', color: '#a16207' },
      { name: '美团红包', action: 'coupon', color: '#ca8a04' },
      { name: '本科招生', action: 'admission', color: '#dc2626' }
    ],
    // 公告数据
  announcements: [] as Array<{ id: string; title: string; cover?: string; excerpt?: string }>,
    page: 1,
    limit: 6,
    hasMore: true,
    loadingAnnouncements: false
  }

  componentDidMount() {
    // 页面加载时的逻辑
    this.loadAnnouncements(1)
    // 根据功能配置更新应用列表
    this.updateAppsStatus()
  }

  // 根据功能配置更新应用状态
  updateAppsStatus = () => {
    const featureSettings = Taro.getStorageSync('featureSettings') || {}
    const updatedApps = this.state.apps.map(app => {
      // 检查跳蚤市场
      if (app.action === 'market') {
        if (!featureSettings.flea_market || !featureSettings.flea_market.enabled) {
          return { ...app, name: '敬请期待', disabled: true }
        }
      }
      // 检查失物招领
      if (app.action === 'lost') {
        if (!featureSettings.lost_found || !featureSettings.lost_found.enabled) {
          return { ...app, name: '敬请期待', disabled: true }
        }
      }
      return app
    })
    this.setState({ apps: updatedApps })
  }

  // 分享配置
  onShareAppMessage() {
    return {
      title: '知外助手 - 校园生活服务平台',
      path: '/pages/index/index'
    }
  }

  // 分享到朋友圈配置
  onShareTimeline() {
    return {
      title: '知外助手 - 校园生活服务平台'
    }
  }

  stripHtml = (html: string): string => {
    if (!html) return ''
    return String(html)
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .trim()
  }

  extractFirstImage = (html: string): string => {
    if (!html) return ''
    const match = html.match(/<img[^>]+src=["']([^"']+)["'][^>]*>/i)
    return match?.[1] || ''
  }

  /** @param {any} app */
  onAppClick = (app: AppItem) => {
    // 如果应用被禁用，显示提示并返回
    if (app.disabled) {
      Taro.showToast({
        title: '该功能暂未开放',
        icon: 'none',
        duration: 2000
      })
      return
    }
    
    // 检查功能开关（双重保险）
    const featureSettings = Taro.getStorageSync('featureSettings') || {}
    
    switch (app.action) {
      case 'grades':
        Taro.navigateTo({
          url: '/pages/grades/index'
        })
        break
      case 'map':
        Taro.navigateTo({ url: '/pages/map/index' })
        break
      case 'bus':
        Taro.navigateTo({
          url: '/pages/commute/index'
        })
        break
      case 'market':
        // 检查跳蚤市场功能是否开启
        // 如果配置不存在或明确禁用，则阻止访问
        if (!featureSettings.flea_market || !featureSettings.flea_market.enabled) {
          Taro.showToast({
            title: featureSettings.flea_market?.message || '跳蚤市场功能暂时关闭，请稍后再试',
            icon: 'none',
            duration: 2000
          })
          return
        }
        Taro.navigateTo({
          url: '/pages/flea-market/index'
        })
        break
      case 'lost':
        // 检查失物招领功能是否开启
        // 如果配置不存在或明确禁用，则阻止访问
        if (!featureSettings.lost_found || !featureSettings.lost_found.enabled) {
          Taro.showToast({
            title: featureSettings.lost_found?.message || '失物招领功能暂时关闭，请稍后再试',
            icon: 'none',
            duration: 2000
          })
          return
        }
        Taro.navigateTo({
          url: '/pages/lost-found/index'
        })
        break
      case 'flowcard':
        Taro.navigateTo({
          url: '/pages/flowcard/index'
        })
        break
      case 'admission':
        // 跳转到其他小程序
        Taro.navigateToMiniProgram({ appId: 'wx91ba9e5d920d9316' })
        break
      case 'eleme':
        Taro.setClipboardData({ data: 'https://to.ele.me/AK.je6ShmmM?alsc_exsrc=ch_app_chsub_wordlink' })
          .then(()=> Taro.showToast({ title: '链接已复制，请在浏览器打开', icon: 'none' }))
          .catch(()=> Taro.showToast({ title: '复制失败，请重试', icon: 'none' }))
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
      const raw: any[] = res?.list || res?.data || []
      const list: Array<{ id: string; title: string; cover?: string; excerpt?: string }> = raw.map((it: any) => {
        const id = it?.id || it?._id || String(it?.id || it?._id || '')
        const title = it?.title || it?.name || '公告'
        
        // 处理封面图片：优先从 images 数组获取第一张，否则尝试其他字段
        let cover = ''
        if (it?.images) {
          try {
            const imagesArray = typeof it.images === 'string' ? JSON.parse(it.images) : it.images
            if (Array.isArray(imagesArray) && imagesArray.length > 0) {
              cover = imagesArray[0]
            }
          } catch (e) {
            console.warn('解析 images 字段失败', e)
          }
        }
        if (!cover) {
          cover = it?.cover || it?.thumbnail || it?.image || it?.pic || ''
        }
        
        const excerpt = this.stripHtml(it?.excerpt || it?.summary || it?.content || '')
        return { id, title, cover, excerpt }
      })
      const hasMore = list.length >= this.state.limit
      this.setState(prev => ({
        announcements: page === 1 ? list : prev.announcements.concat(list),
        page,
        hasMore
      }), () => {
        // 补充封面/摘要：若缺失则拉取详情进行富化（仅当前页）
        this.enrichAnnouncements(page)
      })
    } catch (e) {
      console.error('获取公告失败', e)
      Taro.showToast({ title: '公告加载失败', icon: 'none' })
    } finally {
      this.setState({ loadingAnnouncements: false })
    }
  }

  // 拉详情补充封面和摘要（避免列表数据过于简陋）
  enrichAnnouncements = async (page: number) => {
    const startIndex = (page - 1) * this.state.limit
    const endIndex = Math.min(startIndex + this.state.limit, this.state.announcements.length)
    const slice = this.state.announcements.slice(startIndex, endIndex)
    const toFetch = slice.filter(it => !it.cover || !it.excerpt)
    if (!toFetch.length) return
    for (const item of toFetch) {
      try {
        const detail: any = await apiService.getAnnouncementDetail(item.id)
        const title = detail?.title || detail?.data?.title || detail?.announcement?.title || item.title
        const rawContent = detail?.content || detail?.data?.content || detail?.announcement?.content || detail?.body || ''
        
        // 处理封面图片：优先从 images 数组获取，否则从内容中提取
        let cover = item.cover
        if (!cover && detail?.images) {
          try {
            const imagesArray = typeof detail.images === 'string' ? JSON.parse(detail.images) : detail.images
            if (Array.isArray(imagesArray) && imagesArray.length > 0) {
              cover = imagesArray[0]
            }
          } catch (e) {
            console.warn('解析详情 images 字段失败', e)
          }
        }
        if (!cover) {
          cover = this.extractFirstImage(rawContent)
        }
        
        const excerpt = item.excerpt && item.excerpt.length > 0 ? item.excerpt : this.stripHtml(rawContent).slice(0, 80)
        this.setState(prev => ({
          announcements: prev.announcements.map(a => a.id === item.id ? { ...a, title, cover, excerpt } : a)
        }))
      } catch (e) {
        // 静默失败即可
      }
    }
  }

  // 点击公告，跳转到详情页面
  onAnnouncementClick = (id: string) => {
    Taro.navigateTo({
      url: `/pages/announcement-detail/index?id=${id}`
    })
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
                <View 
                  key={index} 
                  className={`app-item ${app.disabled ? 'app-item-disabled' : ''}`}
                  onClick={() => this.onAppClick(app)}
                >
                  <View className="app-icon">
                    <AppIcon name={app.action} color={app.disabled ? '#d1d5db' : app.color} />
                  </View>
                  <Text className="app-name">{app.name}</Text>
                </View>
              ))}
            </View>
            <View className="apps-row">
              {bottomApps.map((app: AppItem, index: number) => (
                <View 
                  key={index} 
                  className={`app-item ${app.disabled ? 'app-item-disabled' : ''}`}
                  onClick={() => this.onAppClick(app)}
                >
                  <View className="app-icon">
                    <AppIcon name={app.action} color={app.disabled ? '#d1d5db' : app.color} />
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
                    <View className="cover">
                      {item.cover ? (
                        <Image className="cover-image" src={item.cover} mode="aspectFill" />
                      ) : (
                        <View className="cover-placeholder" />
                      )}
                    </View>
                    <View className="meta">
                      <Text className="announcement-item-title">{item.title}</Text>
                      <Text className="announcement-excerpt">{item.excerpt || '暂无摘要'}</Text>
                    </View>
                  </View>
                ))}
                {!this.state.announcements.length && (
                  <View className="announcement-empty">
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
