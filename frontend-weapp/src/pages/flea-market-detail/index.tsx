import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text, Swiper, SwiperItem, Image } from '@tarojs/components'
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
  condition: string
  contact?: string
  wechat_qr_url?: string
  seller: {
    id: string
    name: string
    avatar: string
    reputation: number
    soldCount: number
  }
  location: string
  views: number
  likes: number
  isLiked: boolean
  createdAt: string
}

interface DetailState {
  product: Product | null
  loading: boolean
  currentImageIndex: number
  statusBarHeight: number
  showContactModal: boolean
  featureDisabled: boolean
  offlineMessage: string
}

export default class FleaMarketDetailPage extends Component<any, DetailState> {
  state: DetailState = {
    product: null,
    loading: true,
    currentImageIndex: 0,
    statusBarHeight: 44,
    showContactModal: false,
    featureDisabled: false,
    offlineMessage: ''
  }

  componentDidMount() {
    const win = Taro.getWindowInfo ? Taro.getWindowInfo() : (Taro as any).getSystemInfoSync?.()
    const statusBarHeight = win?.statusBarHeight ? Number(win.statusBarHeight) : 44
    this.setState({ statusBarHeight })
    if (!this.checkFeatureEnabled()) return
    this.loadProductDetail()
  }

  checkFeatureEnabled = (): boolean => {
    const featureSettings = Taro.getStorageSync('featureSettings') || {}
    if (!featureSettings.flea_market || !featureSettings.flea_market.enabled) {
      this.setState({
        featureDisabled: true,
        offlineMessage: featureSettings.flea_market?.message || '跳蚤市场功能暂时关闭，敬请期待'
      })
      return false
    }
    return true
  }

  // 加载商品详情（后端）
  loadProductDetail = async () => {
    try {
      // 获取路由参数
      const pages = Taro.getCurrentPages()
      const current = pages[pages.length - 1]
      const id = (current as any)?.options?.id
      if (!id) throw new Error('缺少商品ID')

      const resp: any = await apiService.getFleaMarketDetail(String(id))
      const it = resp?.data || resp
      const images: string[] = (() => {
        try {
          if (Array.isArray(it.image_urls)) return it.image_urls
          if (it.image_urls) return JSON.parse(it.image_urls)
          if (it.image_url) return [it.image_url]
          return []
        } catch { return it.image_url ? [it.image_url] : [] }
      })()

      const mapped: Product = {
        id: String(it.id),
        title: it.title ?? '',
        description: it.description ?? '',
        price: Number(it.price ?? 0),
        images: images,
        category: 'other',
        condition: (it.condition_level || it.condition || 'good') as any,
        seller: {
          id: String(it.publisher_uid ?? ''),
          name: it.publisher_name ?? '用户',
          avatar: it.publisher_avatar ?? '',
          reputation: Number(it.reputation ?? it.seller_reputation ?? 0),
          soldCount: Number(it.sold_count ?? 0)
        },
        location: it.location ?? '校区',
        views: Number(it.views ?? 0),
        likes: Number(it.likes ?? 0),
        isLiked: false,
        createdAt: it.created_at ?? '',
      }

      ;(mapped as any).contact = it.contact_info
      mapped.wechat_qr_url = it.wechat_qr_url || it.contact_qr_url

      this.setState({ product: mapped, loading: false })
    } catch (error) {
      console.error('加载详情失败:', error)
      this.setState({ loading: false })
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  // 返回
  onBack = () => {
    Taro.navigateBack()
  }

  // 收藏/取消收藏
  onToggleLike = () => {
    const { product } = this.state
    if (!product) return

    this.setState({
      product: {
        ...product,
        isLiked: !product.isLiked,
        likes: product.isLiked ? product.likes - 1 : product.likes + 1
      }
    })

    Taro.showToast({
      title: product.isLiked ? '已取消收藏' : '已收藏',
      icon: 'none'
    })
  }

  // 联系卖家（展示二维码优先）
  onContact = () => {
    this.setState({ showContactModal: true })
  }

  closeContactModal = () => {
    this.setState({ showContactModal: false })
  }

  // 立即购买
  onBuy = () => {
    Taro.showModal({
      title: '购买确认',
      content: '确定要购买这件商品吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.showToast({ title: '购买功能开发中', icon: 'none' })
        }
      }
    })
  }

  // 图片切换
  onSwiperChange = (e: any) => {
    this.setState({ currentImageIndex: e.detail.current })
  }

  // 预览图片
  onPreviewImage = (index: number) => {
    const { product } = this.state
    if (!product) return

    Taro.previewImage({
      current: product.images[index],
      urls: product.images
    })
  }

  // 格式化价格
  formatPrice = (price: number) => {
    return price.toFixed(2)
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
    const { product, loading, currentImageIndex, featureDisabled, offlineMessage } = this.state

    if (featureDisabled) {
      return (
        <View className="feature-disabled-page">
          <View className="disabled-content">
            <View className="disabled-icon">🚫</View>
            <Text className="disabled-title">功能暂未开放</Text>
            <Text className="disabled-message">{offlineMessage}</Text>
            <View className="back-home-btn" onClick={() => Taro.switchTab({ url: '/pages/index/index' })}>
              <Text className="btn-text">返回首页</Text>
            </View>
          </View>
        </View>
      )
    }

    if (loading) {
      return (
        <View className="detail-page loading">
          <Text>加载中...</Text>
        </View>
      )
    }

    if (!product) {
      return (
        <View className="detail-page empty">
          <Text>商品不存在</Text>
        </View>
      )
    }

    return (
      <View className="detail-page">
        {/* 头部导航 */}
        <View className="nav-bar" style={{ paddingTop: `${this.state.statusBarHeight}px` }}>
          <View className="nav-btn" onClick={this.onBack}>
            <Text className="nav-icon">‹</Text>
          </View>
          {/* 右侧图标已移除 */}
        </View>

        {/* 图片轮播 */}
        <View className="image-section">
          <Swiper
            className="image-swiper"
            indicatorDots={false}
            autoplay={false}
            circular
            onChange={this.onSwiperChange}
          >
            {product.images.map((img, index) => (
              <SwiperItem key={index}>
                <View className="swiper-item" onClick={() => this.onPreviewImage(index)}>
                  <LazyImage
                    src={img}
                    className="product-image"
                    mode="aspectFill"
                  />
                </View>
              </SwiperItem>
            ))}
          </Swiper>
          <View className="image-indicator">
            <Text className="indicator-text">
              {currentImageIndex + 1}/{product.images.length}
            </Text>
          </View>
        </View>

        {/* 商品信息 */}
        <View className="info-section">
          <View className="price-row">
            <View className="price-wrapper">
              <Text className="price-symbol">¥</Text>
              <Text className="price-value">{this.formatPrice(product.price)}</Text>
            </View>
            <View className="stats">
              <View className="stat-item">
                <Text className="stat-icon">◉</Text>
                <Text className="stat-text">{product.views}</Text>
              </View>
              <View className="stat-item">
                <Text className="stat-icon">♥</Text>
                <Text className="stat-text">{product.likes}</Text>
              </View>
            </View>
          </View>

          <Text className="product-title">{product.title}</Text>

          <View className="tags-row">
            <View className="tag condition">{this.getConditionLabel(product.condition)}</View>
            <View className="tag location">
              <Text className="tag-icon">◉</Text>
              <Text>{product.location}</Text>
            </View>
            <View className="tag time">
              <Text className="tag-icon">◷</Text>
              <Text>{product.createdAt}</Text>
            </View>
          </View>
        </View>

        {/* 卖家信息（去掉信誉/已售/联系按钮） */}
        <View className="seller-section">
          <View className="seller-card">
            <Image src={product.seller.avatar} className="seller-avatar" />
            <View className="seller-info">
              <Text className="seller-name">{product.seller.name}</Text>
            </View>
          </View>
        </View>

        {/* 商品描述 */}
        <View className="description-section">
          <View className="section-title">
            <Text className="title-text">商品描述</Text>
          </View>
          <Text className="description-text">{product.description}</Text>
        </View>

        {/* 底部操作栏 */}
        <View className="bottom-bar">
          <View className="bar-actions">
            <View className="action-btn" onClick={this.onToggleLike}>
              <Text className={`action-icon ${product.isLiked ? 'liked' : ''}`}>
                ♥
              </Text>
              <Text className="action-text">收藏</Text>
            </View>
          </View>
          <View className="bar-buttons">
            <View className="contact-btn" onClick={this.onContact}>
              <Text className="btn-text">联系卖家</Text>
            </View>
          </View>
        </View>

        {/* 联系方式弹层 */}
        {this.state.showContactModal && (
          <View className="contact-modal">
            <View className="contact-mask" onClick={this.closeContactModal} />
            <View className="contact-dialog">
              <Text className="dialog-title">联系卖家</Text>
              {product.wechat_qr_url ? (
                <Image src={product.wechat_qr_url} className="qr-image" mode="aspectFit" />
              ) : null}
              {((product as any).contact || (product as any).contact_info) && (
                <Text className="contact-text">微信号：{(product as any).contact || (product as any).contact_info}</Text>
              )}
              <Text className="hint-text">提示：长按保存或识别二维码，或复制微信号添加</Text>
              <View className="dialog-actions">
                <View className="close-btn" onClick={this.closeContactModal}><Text>关闭</Text></View>
              </View>
            </View>
          </View>
        )}
      </View>
    )
  }
}

