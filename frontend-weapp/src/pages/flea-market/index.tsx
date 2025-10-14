import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text, ScrollView, Image, Input } from '@tarojs/components'
import { LazyImage } from '../../components/LazyImage'
import { apiService } from '../../services/api'
import './index.scss'

interface Product {
  id: string
  title: string
  description: string
  price: number
  images: string[]
  category: string
  condition: 'new' | 'like_new' | 'good' | 'fair'
  seller: {
    id: string
    name: string
    avatar: string
  }
  location: string
  views: number
  likes: number
  createdAt: string
}

interface FleaMarketState {
  products: Product[]
  loading: boolean
  refreshing: boolean
  page: number
  hasMore: boolean
  activeCategory: string
  searchQuery: string
  statusBarHeight: number
}

// Mock 数据
const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    title: 'MacBook Pro 2021 14英寸',
    description: 'M1 Pro芯片，16GB内存，512GB存储，99新，保护非常好',
    price: 8999,
    images: [
      'https://images.unsplash.com/photo-1517336714731-489689fd1ca8?w=800',
      'https://images.unsplash.com/photo-1611186871348-b1ce696e52c9?w=800'
    ],
    category: 'electronics',
    condition: 'like_new',
    seller: {
      id: 'u1',
      name: '张同学',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=1'
    },
    location: '长安校区',
    views: 234,
    likes: 12,
    createdAt: '2025-10-01'
  },
  {
    id: '2',
    title: '大学英语教材全套',
    description: '全新未使用，包含听力材料，原价268元',
    price: 120,
    images: [
      'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800',
      'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=800'
    ],
    category: 'books',
    condition: 'new',
    seller: {
      id: 'u2',
      name: '李同学',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=2'
    },
    location: '雁塔校区',
    views: 156,
    likes: 8,
    createdAt: '2025-09-30'
  },
  {
    id: '3',
    title: '宿舍用电风扇',
    description: '美的落地扇，8成新，静音效果好',
    price: 80,
    images: [
      'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'
    ],
    category: 'daily',
    condition: 'good',
    seller: {
      id: 'u3',
      name: '王同学',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=3'
    },
    location: '长安校区',
    views: 89,
    likes: 5,
    createdAt: '2025-09-29'
  },
  {
    id: '4',
    title: 'Nike 运动鞋',
    description: '全新正品，尺码42，颜色不合适转让',
    price: 399,
    images: [
      'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800',
      'https://images.unsplash.com/photo-1460353581641-37baddab0fa2?w=800'
    ],
    category: 'sports',
    condition: 'new',
    seller: {
      id: 'u4',
      name: '赵同学',
      avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=4'
    },
    location: '雁塔校区',
    views: 198,
    likes: 15,
    createdAt: '2025-09-28'
  }
]

const CATEGORIES = [
  { id: 'all', name: '全部', icon: '▦' },
  { id: 'electronics', name: '数码', icon: '⚡' },
  { id: 'books', name: '书籍', icon: '◈' },
  { id: 'sports', name: '运动', icon: '●' },
  { id: 'daily', name: '日用', icon: '◆' },
  { id: 'other', name: '其他', icon: '◇' }
]

export default class FleaMarketPage extends Component<any, FleaMarketState> {
  state: FleaMarketState = {
    products: [],
    loading: false,
    refreshing: false,
    page: 1,
    hasMore: true,
    activeCategory: 'all',
    searchQuery: '',
    statusBarHeight: 44
  }

  componentDidMount() {
    const win = Taro.getWindowInfo ? Taro.getWindowInfo() : (Taro as any).getSystemInfoSync?.()
    const statusBarHeight = win?.statusBarHeight ? Number(win.statusBarHeight) : 44
    this.setState({ statusBarHeight })
    if (!this.requireLogin()) return
    this.loadProducts(true)
  }

  componentDidShow() {
    // 检查是否需要刷新
    if (!this.requireLogin()) return
    const flag = Taro.getStorageSync('refresh_flea_market')
    if (flag) {
      Taro.removeStorageSync('refresh_flea_market')
      this.loadProducts(true)
    } else if ((this.state.products || []).length === 0) {
      this.loadProducts(true)
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

  // 加载商品列表（对接后端）
  loadProducts = async (isRefresh = false) => {
    const { loading, products, page, hasMore } = this.state
    if (loading || (!isRefresh && !hasMore)) return
    this.setState({ loading: true })
    try {
      const nextPage = isRefresh ? 1 : page
      const hasQuery = !!(this.state.searchQuery && this.state.searchQuery.trim())
      const categoryParam = hasQuery ? undefined : (this.state.activeCategory === 'all' ? undefined : this.state.activeCategory)
      const resp: any = await apiService.getFleaMarketList({ page: nextPage, limit: 10, status: 'approved', category: categoryParam, q: this.state.searchQuery?.trim() || undefined })
      const list = (resp?.data || resp?.list || []) as any[]
      const mapped: Product[] = list.map((it: any): Product => {
        let images: string[] = []
        try {
          if (Array.isArray(it.image_urls)) images = it.image_urls as string[]
          else if (it.image_urls) images = JSON.parse(it.image_urls)
          else if (it.image_url) images = [it.image_url]
        } catch { images = it.image_url ? [String(it.image_url)] : [] }
        const cond = (it.condition_level || it.condition || 'good') as 'new' | 'like_new' | 'good' | 'fair'
        return {
          id: String(it.id),
          title: it.title ?? '',
          description: it.description ?? '',
          price: Number(it.price ?? 0),
          images,
          category: 'other',
          condition: cond,
          seller: { id: String(it.publisher_uid ?? ''), name: it.publisher_name ?? '用户', avatar: it.publisher_avatar || '' },
          location: it.location ?? '校区',
          views: Number(it.views ?? 0),
          likes: Number(it.likes ?? 0),
          createdAt: it.created_at ?? ''
        }
      })
      const newList = isRefresh ? mapped : [...products, ...mapped]
      this.setState({
        products: newList,
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
    this.loadProducts(true)
  }

  // 上拉加载更多
  onLoadMore = () => {
    this.loadProducts()
  }

  // 切换分类
  onCategoryChange = (categoryId: string) => {
    this.setState({ 
      activeCategory: categoryId,
      products: [],
      page: 1,
      hasMore: true
    }, () => {
      this.loadProducts(true)
    })
  }

  // 跳转到详情页
  onProductClick = (product: Product) => {
    Taro.navigateTo({
      url: `/pages/flea-market-detail/index?id=${product.id}`
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
    Taro.navigateTo({ url: '/pages/flea-market-publish/index' })
  }

  // 跳转到搜索页
  onSearch = () => {
    Taro.showToast({ title: '搜索功能开发中', icon: 'none' })
  }

  // 返回本页首页（刷新列表到第一页）
  onBackHome = () => {
    this.loadProducts(true)
  }

  // 跳转到消息页
  onMessage = () => {
    Taro.showToast({ title: '消息功能开发中', icon: 'none' })
  }

  // 我的（跳转到我的发布/消息页）
  onProfile = () => {
    Taro.navigateTo({ url: '/pages/flea-market-mine/index' })
  }

  // 格式化价格
  formatPrice = (price: number) => {
    return `¥${price.toFixed(2)}`
  }

  // 格式化数量
  formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`
    }
    return count.toString()
  }

  // 获取成色标签
  getConditionLabel = (condition: string) => {
    const labels: { [key: string]: string } = {
      new: '全新',
      like_new: '99新',
      good: '8成新',
      fair: '5成新'
    }
    return labels[condition] || '未知'
  }

  render() {
    const { products, loading, refreshing, activeCategory } = this.state

    return (
      <View className="flea-market-page">
        {/* 状态栏占位 */}
        <View className="status-bar-placeholder" style={{ height: `${this.state.statusBarHeight}px` }}></View>
        
        {/* 头部 */}
        <View className="page-header" style={{ paddingTop: `${this.state.statusBarHeight}px` }}>
          <View className="brand-row">
            <View className="back-btn" onClick={() => Taro.navigateBack()}>
              <Text className="back-icon">‹</Text>
            </View>
            <Text className="brand-logo">西外跳蚤市场</Text>
            <View style={{ width: '64rpx' }} />
          </View>

          {/* 搜索框 */}
          <View className="market-search">
            <Input
              className="search-input"
              placeholder="输入关键词搜索"
              placeholderClass="search-placeholder"
              value={this.state.searchQuery}
              onInput={(e)=> this.setState({ searchQuery: (e.detail as any).value })}
              onConfirm={()=> this.loadProducts(true)}
            />
            <View className="search-button" onClick={()=> this.loadProducts(true)}>
              <Text className="search-glyph">⌕</Text>
            </View>
          </View>

          {/* 分类标签 */}
          <ScrollView
            className="category-chips"
            scrollX
            scrollWithAnimation
          >
            <View className="category-chips-inner">
              {CATEGORIES.map(cat => (
                <View
                  key={cat.id}
                  className={`chip ${activeCategory === cat.id ? 'active' : ''}`}
                  onClick={() => this.onCategoryChange(cat.id)}
                >
                  <Text className="chip-icon">{cat.icon}</Text>
                  <Text className="chip-text">{cat.name}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 商品列表 */}
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
            <View className="products-grid">
              {products.map(product => (
                <View
                  key={product.id}
                  className="product-card"
                  onClick={() => this.onProductClick(product)}
                >
                  <View className="product-image-wrapper">
                    <LazyImage
                      src={product.images[0]}
                      className="product-image"
                      mode="aspectFill"
                    />
                    {product.images.length > 1 && (
                      <View className="image-count">
                        <Text className="count-icon">◫</Text>
                        <Text className="count-text">{product.images.length}</Text>
                      </View>
                    )}
                    <View className="condition-badge">
                      {this.getConditionLabel(product.condition)}
                    </View>
                  </View>

                  <View className="product-info">
                    <Text className="product-title" numberOfLines={2}>
                      {product.title}
                    </Text>
                    <Text className="product-desc" numberOfLines={1}>
                      {product.description}
                    </Text>

                    <View className="product-meta">
                      <View className="meta-left">
                        <Text className="product-price">
                          {this.formatPrice(product.price)}
                        </Text>
                        <Text className="product-location">{product.location}</Text>
                      </View>
                      <View className="meta-right">
                        <View className="stat-item">
                          <Text className="stat-icon">◉</Text>
                          <Text className="stat-text">{this.formatCount(product.views)}</Text>
                        </View>
                      </View>
                    </View>

                    <View className="seller-info">
                      <Image src={product.seller.avatar} className="seller-avatar" />
                      <Text className="seller-name">{product.seller.name}</Text>
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

            {!loading && products.length === 0 && (
              <View className="empty-state">
                <View className="empty-icon">□</View>
                <Text className="empty-text">暂无商品</Text>
                <Text className="empty-hint">快来发布第一件商品吧~</Text>
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

