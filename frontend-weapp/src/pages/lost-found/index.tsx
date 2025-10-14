import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import { LazyImage } from '../../components/LazyImage'
import { apiService } from '../../services/api'
import './index.scss'

interface LostFoundItem {
  id: string
  type: 'lost' | 'found'
  title: string
  description: string
  images: string[]
  category: string
  location: string
  time: string
  contact: string
  poster: {
    id: string
    name: string
    avatar: string
  }
  status: 'open' | 'closed'
  views: number
  createdAt: string
}

interface LostFoundState {
  items: LostFoundItem[]
  loading: boolean
  refreshing: boolean
  page: number
  hasMore: boolean
  activeType: 'lost' | 'found'
  activeCategory: string
  searchQuery?: string
  statusBarHeight: number
}

// Mock 数据
const MOCK_ITEMS: LostFoundItem[] = [
  {
    id: '1',
    type: 'lost',
    title: '丢失黑色钱包',
    description: '在图书馆三楼丢失黑色皮质钱包，内有学生卡和少量现金，如有拾到请联系，重谢！',
    images: [
      'https://images.unsplash.com/photo-1627123424574-724758594e93?w=800'
    ],
    category: 'wallet',
    location: '图书馆三楼',
    time: '2025-10-03 14:30',
    contact: '微信: abc123',
    poster: {
      id: 'u1',
      name: '张同学',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhang'
    },
    status: 'open',
    views: 156,
    createdAt: '2025-10-03'
  },
  {
    id: '2',
    type: 'found',
    title: '捡到校园卡',
    description: '在食堂门口捡到一张校园卡，姓名：李XX，失主请联系认领',
    images: [
      'https://images.unsplash.com/photo-1614680376593-902f74cf0d41?w=800'
    ],
    category: 'card',
    location: '一食堂门口',
    time: '2025-10-03 12:00',
    contact: '电话: 138****1234',
    poster: {
      id: 'u2',
      name: '王同学',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=wang'
    },
    status: 'open',
    views: 89,
    createdAt: '2025-10-03'
  },
  {
    id: '3',
    type: 'lost',
    title: '寻找遗失的蓝牙耳机',
    description: 'AirPods Pro，白色充电盒，可能遗失在教学楼或者操场附近',
    images: [
      'https://images.unsplash.com/photo-1606841837239-c5a1a4a07af7?w=800',
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800'
    ],
    category: 'electronics',
    location: '第三教学楼',
    time: '2025-10-02 16:00',
    contact: 'QQ: 123456',
    poster: {
      id: 'u3',
      name: '赵同学',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=zhao'
    },
    status: 'open',
    views: 234,
    createdAt: '2025-10-02'
  },
  {
    id: '4',
    type: 'found',
    title: '拾到钥匙一串',
    description: '在宿舍楼下拾到钥匙一串，上面有卡通挂件，失主请联系',
    images: [
      'https://images.unsplash.com/photo-1582139329536-e7284fece509?w=800'
    ],
    category: 'key',
    location: '7号宿舍楼',
    time: '2025-10-02 09:30',
    contact: '微信: xyz789',
    poster: {
      id: 'u4',
      name: '刘同学',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=liu'
    },
    status: 'closed',
    views: 67,
    createdAt: '2025-10-02'
  }
]

// 与发布页保持一致：card/electronics/key/wallet/book/other
const CATEGORIES = [
  { id: 'all', name: '全部', icon: '▦' },
  { id: 'card', name: '证卡', icon: '▭' },
  { id: 'electronics', name: '数码', icon: '⚡' },
  { id: 'key', name: '钥匙', icon: '⚷' },
  { id: 'wallet', name: '钱包', icon: '▣' },
  { id: 'book', name: '书籍', icon: '◈' },
  { id: 'other', name: '其他', icon: '◇' }
]

export default class LostFoundPage extends Component<any, LostFoundState> {
  state: LostFoundState = {
    items: [],
    loading: false,
    refreshing: false,
    page: 1,
    hasMore: true,
    activeType: 'lost',
    activeCategory: 'all',
    searchQuery: '',
    statusBarHeight: 44
  }

  componentDidMount() {
    const win = Taro.getWindowInfo ? Taro.getWindowInfo() : (Taro as any).getSystemInfoSync?.()
    const statusBarHeight = win?.statusBarHeight ? Number(win.statusBarHeight) : 44
    this.setState({ statusBarHeight })
    if (!this.requireLogin()) return
    this.loadItems(true)
  }

  componentDidShow() {
    if (!this.requireLogin()) return
    const flag = Taro.getStorageSync('refresh_lost_found')
    if (flag) {
      Taro.removeStorageSync('refresh_lost_found')
      this.loadItems(true)
    } else if ((this.state.items || []).length === 0) {
      this.loadItems(true)
    }
  }

  // 进入页面时校验登录
  requireLogin = (): boolean => {
    const token = Taro.getStorageSync('userToken')
    const userInfo = Taro.getStorageSync('userInfo') || {}
    if (token || userInfo?.userId || userInfo?.uid) {
      return true
    }
    if (!userInfo?.userId && !userInfo?.uid) {
      Taro.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
      return false
    }
    return true
  }

  // 加载列表（对接后端）
  loadItems = async (isRefresh = false) => {
    const { loading, items, page, hasMore, activeType } = this.state
    if (loading || (!isRefresh && !hasMore)) return
    this.setState({ loading: true })
    try {
      const nextPage = isRefresh ? 1 : page
      const q = this.state.searchQuery?.trim() || undefined
      const category = this.state.searchQuery?.trim() ? undefined : (this.state.activeCategory==='all'? undefined : this.state.activeCategory)
      const resp: any = await apiService.getLostFoundList({ page: nextPage, limit: 10, status: activeType, q, category })
      const list = (resp?.data || resp?.list || []) as any[]
      const mapped: LostFoundItem[] = list.map((it: any): LostFoundItem => {
        const itemType: 'lost' | 'found' = (it.status === 'found' ? 'found' : 'lost') as 'lost' | 'found'
        let images: string[] = []
        try {
          if (Array.isArray(it.image_urls)) images = it.image_urls as string[]
          else if (it.image_urls) images = JSON.parse(it.image_urls)
          else if (it.image_url) images = [String(it.image_url)]
        } catch {
          images = it.image_url ? [String(it.image_url)] : []
        }
        const statusVal: 'open' | 'closed' = (it.status === 'closed' ? 'closed' : 'open') as 'open' | 'closed'
        return {
          id: String(it.id),
          type: itemType,
          title: (it.title && String(it.title)) || (it.description ? String(it.description).slice(0, 20) : '信息'),
          description: it.description || '',
          images,
          category: (it.category && String(it.category)) || 'other',
          location: it.location || '校区',
          time: it.lost_time || it.time || it.created_at,
          contact: it.contact_info || '',
          poster: { id: String(it.publisher_uid ?? ''), name: it.publisher_name || '用户', avatar: it.publisher_avatar || '' },
          status: statusVal,
          views: Number(it.views || 0),
          createdAt: it.created_at || ''
        }
      })
      const newList = isRefresh ? mapped : [...items, ...mapped]
      this.setState({
        items: newList,
        page: nextPage + 1,
        hasMore: list.length >= 10,
        loading: false,
        refreshing: false
      })
    } catch (e) {
      console.error(e)
      this.setState({ loading: false, refreshing: false })
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  // 下拉刷新
  onRefresh = () => {
    this.setState({ refreshing: true })
    this.loadItems(true)
  }

  // 上拉加载更多
  onLoadMore = () => {
    this.loadItems()
  }

  // 切换类型
  onTypeChange = (type: 'lost' | 'found') => {
    this.setState({ 
      activeType: type,
      items: [],
      page: 1,
      hasMore: true
    }, () => {
      this.loadItems(true)
    })
  }

  // 切换分类
  onCategoryChange = (categoryId: string) => {
    this.setState({ 
      activeCategory: categoryId,
      searchQuery: '',
      // 不与搜索叠加：如果有关键词则忽略分类（这里仅更新状态，不传分类给接口）
      items: [],
      page: 1,
      hasMore: true
    }, () => {
      this.loadItems(true)
    })
  }

  // 跳转到详情
  onItemClick = (item: LostFoundItem) => {
    Taro.navigateTo({
      url: `/pages/lost-found-detail/index?id=${item.id}`
    })
  }

  // 跳转到发布页面
  onPublish = () => {
    const userInfo = Taro.getStorageSync('userInfo')
    if (!userInfo?.userId) {
      Taro.showModal({
        title: '提示',
        content: '请先登录',
        success: (res) => {
          if (res.confirm) {
            Taro.navigateTo({ url: '/pages/login/index' })
          }
        }
      })
      return
    }
    const { activeType } = this.state
    Taro.navigateTo({ url: `/pages/lost-found-publish/index?type=${activeType}` })
  }

  // 跳转到搜索页
  onSearch = () => { this.loadItems(true) }

  // 返回本页首页（刷新列表到第一页）
  onBackHome = () => {
    this.loadItems(true)
  }

  // 跳转到消息页
  onMessage = () => {
    Taro.showToast({ title: '消息功能开发中', icon: 'none' })
  }

  // 我的
  onProfile = () => {
    Taro.navigateTo({ url: '/pages/lost-found-mine/index' })
  }

  // 格式化数量
  formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  render() {
    const { items, loading, refreshing, activeType, activeCategory } = this.state

    return (
      <View className="lost-found-page">
        {/* 状态栏占位 */}
        <View className="status-bar-placeholder" style={{ height: `${this.state.statusBarHeight}px` }}></View>
        
        {/* 头部 */}
        <View className="page-header" style={{ paddingTop: `${this.state.statusBarHeight}px` }}>
          <View className="brand-row">
            <View className="back-btn" onClick={() => Taro.navigateBack()}>
              <Text className="back-icon">‹</Text>
            </View>
            <Text className="brand-logo">失物招领</Text>
            <View style={{ width: '64rpx' }} />
          </View>

          {/* 搜索框 */}
          <View className="market-search">
            <Input
              className="search-input"
              placeholder={activeType === 'lost' ? '试试：钱包、校园卡、钥匙…' : '试试：捡到物品、地点…'}
              placeholderClass="search-placeholder"
              value={this.state.searchQuery}
              onInput={(e)=> this.setState({ searchQuery: (e.detail as any).value })}
              onConfirm={this.onSearch}
            />
            <View className="search-button" onClick={this.onSearch}>
              <Text className="search-glyph">⌕</Text>
            </View>
          </View>

          {/* 类型切换 */}
          <View className="type-tabs">
            <View
              className={`type-tab ${activeType === 'lost' ? 'active' : ''}`}
              onClick={() => this.onTypeChange('lost')}
            >
              <Text className="type-icon">?</Text>
              <Text className="type-name">寻物启事</Text>
            </View>
            <View
              className={`type-tab ${activeType === 'found' ? 'active' : ''}`}
              onClick={() => this.onTypeChange('found')}
            >
              <Text className="type-icon">!</Text>
              <Text className="type-name">失物招领</Text>
            </View>
          </View>

          {/* 分类标签 */}
          <ScrollView
            className="category-tabs"
            scrollX
            scrollWithAnimation
          >
            <View className="category-tabs-inner">
              {CATEGORIES.map(cat => (
                <View
                  key={cat.id}
                  className={`category-tab ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => this.onCategoryChange(cat.id)}
                >
                  <Text className="category-icon">{cat.icon}</Text>
                  <Text className="category-name">{cat.name}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 列表内容（与跳蚤市场统一为网格卡片） */}
        <ScrollView
          className="content-scroll"
          scrollY
          refresherEnabled
          refresherTriggered={refreshing}
          onRefresherRefresh={this.onRefresh}
          onScrollToLower={this.onLoadMore}
          lowerThreshold={100}
        >
          <View className="content-inner">
            <View className="items-grid">
              {items.map(item => (
                <View key={item.id} className="lf-card" onClick={() => this.onItemClick(item)}>
                  <View className="image-wrapper">
                    <LazyImage src={item.images[0]} className="image" mode="aspectFill" />
                    {item.images.length > 1 && (
                      <View className="image-count">
                        <Text className="count-icon">◫</Text>
                        <Text className="count-text">{item.images.length}</Text>
                      </View>
                    )}
                    <View className={`type-badge-overlay ${item.type}`}>
                      {item.type === 'lost' ? '寻物' : '招领'}
                    </View>
                    {item.status === 'closed' && (
                      <View className="closed-mask">
                        <Text className="closed-text">已完成</Text>
                      </View>
                    )}
                  </View>

                  <View className="info">
                    <Text className="title" numberOfLines={2}>{item.title}</Text>
                    <Text className="desc" numberOfLines={1}>{item.description}</Text>

                    <View className="meta">
                      <View className="meta-left">
                        <Text className="location">{item.location}</Text>
                        <Text className="time">{item.time}</Text>
                      </View>
                      <View className="meta-right">
                        <Text className="view-icon">◉</Text>
                        <Text className="view-text">{this.formatCount(item.views)}</Text>
                      </View>
                    </View>

                    <View className="poster">
                      <Image src={item.poster.avatar} className="avatar" />
                      <Text className="name">{item.poster.name}</Text>
                    </View>
                  </View>
                </View>
              ))}
            </View>

            {loading && !refreshing && (
              <View className="loading-more">
                <Text className="loading-text">加载中...</Text>
              </View>
            )}

            {!loading && items.length === 0 && (
              <View className="empty-state">
                <View className="empty-icon">
                  {activeType === 'lost' ? '?' : '!'}
                </View>
                <Text className="empty-text">暂无信息</Text>
                <Text className="empty-hint">
                  {activeType === 'lost' 
                    ? '丢失物品？快来发布寻物启事吧' 
                    : '捡到物品？快来发布招领信息吧'}
                </Text>
              </View>
            )}
            {/* 内容底部占位，避免被底部导航遮挡 */}
            <View className="scroll-bottom-space" />
          </View>
        </ScrollView>

        {/* 底部导航 */}
        <View className="bottom-nav">
          <View className="nav-item" onClick={this.onBackHome}>
            <Text className="nav-icon active">⌂</Text>
            <Text className="nav-label active">首页</Text>
          </View>
          <View className="nav-item publish" onClick={this.onPublish}>
            <View className="nav-publish-circle">
              <Text className="nav-publish-icon">◎</Text>
            </View>
            <Text className="nav-label">发布</Text>
          </View>
          <View className="nav-item" onClick={this.onProfile}>
            <Text className="nav-icon">◉</Text>
            <Text className="nav-label">我的</Text>
          </View>
        </View>
      </View>
    )
  }
}

