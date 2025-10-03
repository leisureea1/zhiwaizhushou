import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'
import { apiService } from '../../services/api'
import { Button, SearchBar, Card, CardImage, CardContent, Badge, Tabs, TabsList, TabsTrigger, ImageWithFallback } from '../../components/ui'
import { BottomNav } from '../../components/BottomNav'

interface LostFoundItem {
  id: number
  description: string
  image_url: string
  status: 'lost' | 'found'
  publisher_name: string
  contact_info: string
  created_at: string
}

interface LostFoundState {
  items: LostFoundItem[]
  page: number
  limit: number
  total: number
  loading: boolean
  hasMore: boolean
  currentTab: 'lost' | 'found'
  searchQuery: string
  activeTab: string
}

// 从示例完整移植的底部导航标签
const tabs = [
  { id: 'home', label: '首页', icon: '⌂' },
  { id: 'search', label: '搜索', icon: '⊙' },
  { id: 'messages', label: '消息', icon: '✉' },
  { id: 'profile', label: '我的', icon: '◉' },
]

export default class LostFoundPage extends Component<any, LostFoundState> {
  state: LostFoundState = {
    items: [],
    page: 1,
    limit: 10,
    total: 0,
    loading: false,
    hasMore: true,
    currentTab: 'lost',
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
      const params: any = {
        page,
        limit: this.state.limit,
        status: this.state.currentTab
      }

      const res: any = await apiService.getLostFoundList(params)

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
      console.error('加载失败', e)
      Taro.showToast({ title: e.message || '加载失败', icon: 'none' })
      this.setState({ loading: false })
    }
  }

  onTypeTabChange = (tab: string) => {
    this.setState({ currentTab: tab as 'lost' | 'found', items: [], page: 1 }, () => {
      this.loadItems(1)
    })
  }

  onLoadMore = () => {
    if (!this.state.hasMore || this.state.loading) return
    this.loadItems(this.state.page + 1)
  }

  onItemClick = (item: LostFoundItem) => {
    Taro.navigateTo({
      url: `/pages/lost-found-detail/index?id=${item.id}`
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
      url: '/pages/lost-found-publish/index'
    })
  }

  onSearch = (value: string) => {
    this.setState({ searchQuery: value })
  }

  onBottomTabChange = (tabId: string) => {
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
    const { activeTab, items, loading, hasMore, currentTab } = this.state

    switch (activeTab) {
      case 'search':
        return (
          <View className="tab-content">
            <Text className="content-title">高级搜索</Text>
            
            <View className="search-section">
              <Text className="section-label">物品类型</Text>
              <View className="filter-grid">
                <Button variant="outline" size="sm">手机</Button>
                <Button variant="outline" size="sm">钱包</Button>
                <Button variant="outline" size="sm">钥匙</Button>
                <Button variant="outline" size="sm">证件</Button>
                <Button variant="outline" size="sm">背包</Button>
                <Button variant="outline" size="sm">其他</Button>
              </View>
            </View>

            <View className="search-section">
              <Text className="section-label">地点范围</Text>
              <View className="filter-grid">
                <Button variant="outline" size="sm">教学楼</Button>
                <Button variant="outline" size="sm">图书馆</Button>
                <Button variant="outline" size="sm">宿舍</Button>
                <Button variant="outline" size="sm">食堂</Button>
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
                我发布的信息
              </Button>
              <Button variant="outline" className="menu-item">
                我的关注
              </Button>
              <Button variant="outline" className="menu-item">
                联系记录
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
              <Text className="content-title">失物招领</Text>
              <View className="header-actions">
                <Button variant="outline" size="sm">
                  <Text>筛选</Text>
                </Button>
                <Button size="sm" onClick={this.onPublish}>
                  <Text>+ 发布</Text>
                </Button>
              </View>
            </View>

            {/* 寻物/招领切换 */}
            <View className="type-tabs-wrapper">
              <Tabs defaultValue="lost" value={currentTab}>
                <TabsList>
                  <TabsTrigger 
                    value="lost" 
                    activeValue={currentTab}
                    onTrigger={this.onTypeTabChange}
                  >
                    寻物启事
                  </TabsTrigger>
                  <TabsTrigger 
                    value="found"
                    activeValue={currentTab}
                    onTrigger={this.onTypeTabChange}
                  >
                    失物招领
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </View>

            {/* 物品列表 */}
            {items.length === 0 && !loading && (
              <View className="empty-state">
                <View className="empty-icon-box">
                  <Text className="empty-icon">
                    {currentTab === 'lost' ? '?' : '!'}
                  </Text>
                </View>
                <Text className="empty-text">暂无信息</Text>
                <Text className="empty-hint">
                  {currentTab === 'lost' 
                    ? '丢失物品？快来发布寻物启事吧' 
                    : '捡到物品？快来发布招领信息吧'}
                </Text>
              </View>
            )}

            <View className="item-grid">
              {items.map((item) => (
                <Card key={item.id} onClick={() => this.onItemClick(item)}>
                  <CardImage>
                    {item.image_url ? (
                      <ImageWithFallback
                        src={item.image_url}
                        className="item-image"
                        mode="aspectFill"
                      />
                    ) : (
                      <View className="image-placeholder">
                        <Text className="placeholder-icon">
                          {item.status === 'lost' ? '?' : '!'}
                        </Text>
                      </View>
                    )}
                  </CardImage>

                  <CardContent>
                    <View className="title-section">
                      <Text className="item-title" numberOfLines={1}>
                        {item.description.substring(0, 15)}
                        {item.description.length > 15 ? '...' : ''}
                      </Text>
                      <Badge variant={item.status === 'lost' ? 'destructive' : 'default'}>
                        {item.status === 'lost' ? '寻物' : '招领'}
                      </Badge>
                    </View>

                    <Text className="item-desc" numberOfLines={2}>
                      {item.description}
                    </Text>

                    <View className="footer-info">
                      <Text className="contact-name">
                        {item.publisher_name}
                      </Text>
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
                查看更多信息
              </Button>
            )}
          </View>
        )
    }
  }

  render() {
    const { activeTab } = this.state

    return (
      <View className="lost-found-page">
        {/* Header */}
        <View className="header">
          <View className="header-top">
            <View className="header-left">
              <View className="back-btn" onClick={() => Taro.navigateBack()}>
                <Text className="back-icon">‹</Text>
              </View>
              <Text className="header-title">失物招领</Text>
            </View>
            <Button size="sm" onClick={this.onPublish}>
              <Text className="publish-icon">+</Text>
              <Text>发布</Text>
            </Button>
          </View>
          
          <SearchBar 
            placeholder="搜索失物信息..." 
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
          onTabChange={this.onBottomTabChange}
        />
      </View>
    )
  }
}