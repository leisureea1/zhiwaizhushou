import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'
import { apiService } from '../../services/api'
import { Button, SearchBar, Card, CardImage, CardContent, Badge, ImageWithFallback } from '../../components/ui'
import { BottomNav } from '../../components/BottomNav'

interface FleaMarketItem {
  id: number
  title: string
  description: string
  price: number
  image_url: string
  publisher_name: string
  created_at: string
}

interface FleaMarketState {
  items: FleaMarketItem[]
  page: number
  limit: number
  total: number
  loading: boolean
  hasMore: boolean
  searchQuery: string
  activeTab: string
}

// 从示例完整移植的底部导航标签
const tabs = [
  { id: 'home', label: '首页', icon: '⌂' },
  { id: 'category', label: '分类', icon: '▦' },
  { id: 'messages', label: '消息', icon: '✉' },
  { id: 'profile', label: '我的', icon: '◉' },
]

export default class FleaMarketPage extends Component<any, FleaMarketState> {
  state: FleaMarketState = {
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    loading: false,
    hasMore: true,
    searchQuery: '',
    activeTab: 'home'
  }

  componentDidMount() {
    this.loadItems()
  }

  loadItems = async (page: number = 1) => {
    if (this.state.loading) return

    this.setState({ loading: true })

    try {
      const res: any = await apiService.getFleaMarketList({
        page,
        limit: this.state.limit,
        status: 'approved'
      })

      const items = res?.data || []
      const pagination = res?.pagination || {}

      this.setState(prev => ({
        items: page === 1 ? items : prev.items.concat(items),
        page,
        total: pagination.total || 0,
        hasMore: items.length >= this.state.limit,
        loading: false
      }))
    } catch (e: any) {
      console.error('加载商品失败', e)
      Taro.showToast({ title: e.message || '加载失败', icon: 'none' })
      this.setState({ loading: false })
    }
  }

  onLoadMore = () => {
    if (!this.state.hasMore || this.state.loading) return
    this.loadItems(this.state.page + 1)
  }

  onItemClick = (item: FleaMarketItem) => {
    Taro.navigateTo({
      url: `/pages/flea-market-detail/index?id=${item.id}`
    })
  }

  onPublish = () => {
    const userInfo = Taro.getStorageSync('userInfo')
    const userId = userInfo?.userId
    
    if (!userId) {
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

    Taro.navigateTo({
      url: '/pages/flea-market-publish/index'
    })
  }

  onSearch = (value: string) => {
    this.setState({ searchQuery: value })
  }

  onTabChange = (tabId: string) => {
    this.setState({ activeTab: tabId })
  }

  formatTime = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diff = now.getTime() - date.getTime()
    
    if (diff < 60000) return '刚刚'
    if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`
    if (diff < 604800000) return `${Math.floor(diff / 86400000)}天前`
    
    return date.toLocaleDateString()
  }

  // 从示例移植：渲染不同标签页的内容
  renderContent = () => {
    const { activeTab, items, loading, hasMore } = this.state

    switch (activeTab) {
      case 'category':
        return (
          <View className="tab-content">
            <Text className="content-title">商品分类</Text>
            <View className="category-grid">
              <View className="category-item">
                <View className="category-icon-box">
                  <Text className="category-icon">⚡</Text>
                </View>
                <Text className="category-label">电子产品</Text>
              </View>
              <View className="category-item">
                <View className="category-icon-box">
                  <Text className="category-icon">◈</Text>
                </View>
                <Text className="category-label">书籍文具</Text>
              </View>
              <View className="category-item">
                <View className="category-icon-box">
                  <Text className="category-icon">●</Text>
                </View>
                <Text className="category-label">运动户外</Text>
              </View>
              <View className="category-item">
                <View className="category-icon-box">
                  <Text className="category-icon">◆</Text>
                </View>
                <Text className="category-label">生活用品</Text>
              </View>
            </View>
          </View>
        )

      case 'messages':
        return (
          <View className="empty-content">
            <View className="empty-icon-box">
              <Text className="empty-icon">✉</Text>
            </View>
            <Text className="empty-title">消息中心</Text>
            <Text className="empty-hint">暂无新消息</Text>
          </View>
        )

      case 'profile':
        return (
          <View className="tab-content">
            <View className="profile-card">
              <View className="profile-avatar">
                <Text className="avatar-icon">◉</Text>
              </View>
              <View className="profile-info">
                <Text className="profile-name">用户昵称</Text>
                <Text className="profile-desc">点击设置个人信息</Text>
              </View>
            </View>
            
            <View className="menu-list">
              <Button variant="outline" className="menu-item">
                我发布的商品
              </Button>
              <Button variant="outline" className="menu-item">
                我的收藏
              </Button>
              <Button variant="outline" className="menu-item">
                交易记录
              </Button>
              <Button variant="outline" className="menu-item">
                设置
              </Button>
            </View>
          </View>
        )

      default: // home
        return (
          <View className="tab-content">
            {/* 顶部操作栏 */}
            <View className="content-header">
              <Text className="content-title">推荐商品</Text>
              <View className="header-actions">
                <Button variant="outline" size="sm">
                  <Text>筛选</Text>
                </Button>
                <Button size="sm" onClick={this.onPublish}>
                  <Text>+ 发布</Text>
                </Button>
              </View>
            </View>

            {/* 商品列表 */}
            {items.length === 0 && !loading && (
              <View className="empty-state">
                <View className="empty-icon-box">
                  <Text className="empty-icon">□</Text>
                </View>
                <Text className="empty-text">暂无商品</Text>
                <Text className="empty-hint">快来发布第一件商品吧~</Text>
              </View>
            )}

            <View className="product-grid">
              {items.map((item) => (
                <Card key={item.id} onClick={() => this.onItemClick(item)}>
                  <CardImage>
                    {item.image_url ? (
                      <ImageWithFallback
                        src={item.image_url}
                        className="product-image"
                        mode="aspectFill"
                      />
                    ) : (
                      <View className="image-placeholder">
                        <Text className="placeholder-icon">□</Text>
                      </View>
                    )}
                  </CardImage>

                  <CardContent>
                    <Text className="product-title" numberOfLines={2}>
                      {item.title}
                    </Text>
                    
                    <View className="price-section">
                      <Text className="price">¥{item.price}</Text>
                      <Badge variant="secondary">二手</Badge>
                    </View>

                    <View className="seller-info">
                      <Text className="seller-name">{item.publisher_name}</Text>
                      <Text className="publish-time">
                        {this.formatTime(item.created_at)}
                      </Text>
                    </View>
                  </CardContent>
                </Card>
              ))}
            </View>

            {loading && (
              <View className="loading-state">
                <View className="spinner"></View>
                <Text className="loading-text">加载中...</Text>
              </View>
            )}

            {!hasMore && items.length > 0 && (
              <View className="end-state">
                <Text className="end-text">— 已经到底了 —</Text>
              </View>
            )}

            {/* 查看更多按钮 */}
            {items.length > 0 && hasMore && (
              <Button variant="outline" className="load-more-btn" onClick={this.onLoadMore}>
                查看更多商品
              </Button>
            )}
          </View>
        )
    }
  }

  render() {
    const { activeTab } = this.state

    return (
      <View className="marketplace-page">
        {/* Header */}
        <View className="header">
          <View className="header-top">
            <View className="header-left">
              <View className="back-btn" onClick={() => Taro.navigateBack()}>
                <Text className="back-icon">‹</Text>
              </View>
              <Text className="header-title">跳蚤市场</Text>
            </View>
            <Button size="sm" onClick={this.onPublish}>
              <Text className="publish-icon">+</Text>
              <Text>发布</Text>
            </Button>
          </View>
          
          <SearchBar 
            placeholder="搜索商品..." 
            onSearch={this.onSearch}
          />
        </View>

        {/* Content */}
        <ScrollView
          className="content"
          scrollY
          onScrollToLower={this.onLoadMore}
          lowerThreshold={50}
        >
          {this.renderContent()}
        </ScrollView>

        {/* Bottom Navigation */}
        <BottomNav
          tabs={tabs}
          activeTab={activeTab}
          onTabChange={this.onTabChange}
        />
      </View>
    )
  }
}