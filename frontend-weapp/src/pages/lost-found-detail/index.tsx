import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text, Swiper, SwiperItem, Image } from '@tarojs/components'
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
  wechat_qr_url?: string
  poster: {
    id: string
    name: string
    avatar: string
  }
  status: 'open' | 'closed'
  views: number
  createdAt: string
}

interface DetailState {
  item: LostFoundItem | null
  loading: boolean
  currentImageIndex: number
  statusBarHeight: number
  showContactModal: boolean
}

export default class LostFoundDetailPage extends Component<any, DetailState> {
  state: DetailState = {
    item: null,
    loading: true,
    currentImageIndex: 0,
    statusBarHeight: 44,
    showContactModal: false
  }

  componentDidMount() {
    const win = Taro.getWindowInfo ? Taro.getWindowInfo() : (Taro as any).getSystemInfoSync?.()
    const statusBarHeight = win?.statusBarHeight ? Number(win.statusBarHeight) : 44
    this.setState({ statusBarHeight })
    this.loadItemDetail()
  }

  loadItemDetail = async () => {
    try {
      const pages = Taro.getCurrentPages()
      const current = pages[pages.length - 1]
      const id = (current as any)?.options?.id
      if (!id) throw new Error('缺少ID')

      const resp: any = await apiService.getLostFoundDetail(String(id))
      const it = resp?.data || resp

      let images: string[] = []
      try {
        if (Array.isArray(it.image_urls)) images = it.image_urls
        else if (it.image_urls) images = JSON.parse(it.image_urls)
        else if (it.image_url) images = [it.image_url]
      } catch {
        images = it.image_url ? [String(it.image_url)] : []
      }

      const mapped: LostFoundItem = {
        id: String(it.id),
        type: it.status === 'found' ? 'found' : 'lost',
        title: it.title || (it.description ? String(it.description).slice(0, 20) : '信息'),
        description: it.description || '',
        images,
        category: it.category || 'other',
        location: it.location || '校区',
        time: it.lost_time || it.time || it.created_at || '',
        contact: it.contact_info || '',
        wechat_qr_url: it.wechat_qr_url || '',
        poster: { id: String(it.publisher_uid ?? ''), name: it.publisher_name || '用户', avatar: it.publisher_avatar || '' },
        status: it.status === 'closed' ? 'closed' : 'open',
        views: Number(it.views || 0),
        createdAt: it.created_at || ''
      }

      this.setState({ item: mapped, loading: false })
    } catch (error) {
      console.error('加载详情失败:', error)
      this.setState({ loading: false })
      Taro.showToast({ title: '加载失败', icon: 'none' })
    }
  }

  onBack = () => {
    Taro.navigateBack()
  }

  onContact = () => {
    this.setState({ showContactModal: true })
  }

  closeContactModal = () => {
    this.setState({ showContactModal: false })
  }

  onSwiperChange = (e: any) => {
    this.setState({ currentImageIndex: e?.detail?.current ?? 0 })
  }

  onPreviewImage = (index: number) => {
    const { item } = this.state
    if (!item) return

    Taro.previewImage({
      current: item.images[index],
      urls: item.images
    })
  }

  render() {
    const { item, loading, currentImageIndex } = this.state

    if (loading) {
      return (
        <View className="lost-found-detail-page loading">
          <Text>加载中...</Text>
        </View>
      )
    }

    if (!item) {
      return (
        <View className="lost-found-detail-page empty">
          <Text>信息不存在</Text>
        </View>
      )
    }

    return (
      <View className="lost-found-detail-page">
        {/* 头部导航 */}
        <View className="nav-bar" style={{ paddingTop: `${this.state.statusBarHeight}px` }}>
          <View className="nav-btn" onClick={this.onBack}>
            <Text className="nav-icon">‹</Text>
          </View>
          {/* 右侧图标已移除 */}
        </View>

        {/* 图片轮播 */}
        {item.images.length > 0 && (
          <View className="image-section">
            <Swiper
              className="image-swiper"
              indicatorDots={false}
              autoplay={false}
              circular
              onChange={this.onSwiperChange}
            >
              {item.images.map((img, index) => (
                <SwiperItem key={index}>
                  <View className="swiper-item" onClick={() => this.onPreviewImage(index)}>
                    <LazyImage
                      src={img}
                      className="item-image"
                      mode="aspectFill"
                    />
                  </View>
                </SwiperItem>
              ))}
            </Swiper>
            {item.images.length > 1 && (
              <View className="image-indicator">
                <Text className="indicator-text">
                  {currentImageIndex + 1}/{item.images.length}
                </Text>
              </View>
            )}
          </View>
        )}

        {/* 基本信息 */}
        <View className="info-section">
          <View className="title-row">
            <View className={`type-badge ${item.type}`}>
              {item.type === 'lost' ? '寻物' : '招领'}
            </View>
            <Text className="item-title">{item.title}</Text>
            {item.status === 'closed' && (
              <View className="status-badge closed">已完成</View>
            )}
          </View>

          <View className="meta-grid">
            <View className="meta-item">
              <Text className="meta-label">地点</Text>
              <Text className="meta-value">{item.location}</Text>
            </View>
            <View className="meta-item">
              <Text className="meta-label">时间</Text>
              <Text className="meta-value">{item.time}</Text>
            </View>
            <View className="meta-item">
              <Text className="meta-label">分类</Text>
              <Text className="meta-value">{item.category}</Text>
            </View>
          </View>
        </View>

        {/* 发布者信息 */}
        <View className="poster-section">
          <View className="poster-card">
            <Image src={item.poster.avatar} className="poster-avatar" />
            <View className="poster-info">
              <Text className="poster-name">{item.poster.name}</Text>
              <Text className="poster-time">发布于 {item.createdAt}</Text>
            </View>
          </View>
        </View>

        {/* 详细描述 */}
        <View className="description-section">
          <View className="section-title">
            <Text className="title-text">详细描述</Text>
          </View>
          <Text className="description-text">{item.description}</Text>
        </View>

        {/* 底部操作栏 */}
        {item.status === 'open' && (
          <View className="bottom-bar">
            <View className={`contact-btn ${item.type}`} onClick={this.onContact}>
              <Text className="btn-text">
                {item.type === 'lost' ? '我捡到了' : '这是我的'}
              </Text>
            </View>
          </View>
        )}

        {/* 联系方式弹层 */}
        {this.state.showContactModal && (
          <View className="contact-modal">
            <View className="contact-mask" onClick={this.closeContactModal} />
            <View className="contact-dialog">
              <Text className="dialog-title">联系发布者</Text>
              {item.wechat_qr_url ? (
                <Image src={item.wechat_qr_url} className="qr-image" mode="aspectFit" />
              ) : null}
              {item.contact ? (
                <Text className="contact-text">微信号：{item.contact}</Text>
              ) : null}
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

