import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text, Image, RichText } from '@tarojs/components'
import { apiService } from '../../services/api'
import './index.scss'

interface IAnnouncementDetail {
  id: string
  title: string
  content: string
  images?: string[]
  author_name?: string
  created_at?: string
  status?: string
}

interface PageState {
  loading: boolean
  error: string
  announcement: IAnnouncementDetail | null
}

class AnnouncementDetailPage extends Component<{}, PageState> {
  state: PageState = {
    loading: true,
    error: '',
    announcement: null
  }

  componentDidMount() {
    const { id } = Taro.getCurrentInstance().router?.params || {}
    if (id) {
      this.loadAnnouncementDetail(id)
    } else {
      this.setState({ 
        loading: false, 
        error: '缺少公告ID参数' 
      })
    }
  }

  // 加载公告详情
  loadAnnouncementDetail = async (id: string) => {
    this.setState({ loading: true, error: '' })
    try {
      const detail: any = await apiService.getAnnouncementDetail(id)
      
      // 兼容多种后端返回结构
      const announcement: IAnnouncementDetail = {
        id: detail?.id || id,
        title: detail?.title || detail?.data?.title || detail?.announcement?.title || '公告详情',
        content: detail?.content || detail?.data?.content || detail?.announcement?.content || detail?.body || '',
        author_name: detail?.author_name || detail?.data?.author_name || detail?.announcement?.author_name || '管理员',
        created_at: detail?.created_at || detail?.data?.created_at || detail?.announcement?.created_at || '',
        status: detail?.status || detail?.data?.status || detail?.announcement?.status || 'published',
        images: []
      }

      // 解析 images 字段
      const imagesData = detail?.images || detail?.data?.images || detail?.announcement?.images
      if (imagesData) {
        try {
          const imagesArray = typeof imagesData === 'string' ? JSON.parse(imagesData) : imagesData
          if (Array.isArray(imagesArray) && imagesArray.length > 0) {
            announcement.images = imagesArray
          }
        } catch (e) {
          console.warn('解析 images 字段失败', e)
        }
      }

      // 如果没有图片，尝试从内容中提取
      if (!announcement.images || announcement.images.length === 0) {
        const extractedImages = this.extractImagesFromContent(announcement.content)
        if (extractedImages.length > 0) {
          announcement.images = extractedImages
        }
      }

      this.setState({ 
        announcement, 
        loading: false 
      })
    } catch (e: any) {
      console.error('获取公告详情失败', e)
      this.setState({ 
        loading: false, 
        error: e?.message || '加载失败，请稍后重试' 
      })
    }
  }

  // 从内容中提取图片
  extractImagesFromContent = (content: string): string[] => {
    const images: string[] = []
    const imgRegex = /<img[^>]+src="([^">]+)"/g
    let match
    while ((match = imgRegex.exec(content)) !== null) {
      images.push(match[1])
    }
    return images
  }

  // 处理HTML内容，确保图片自适应
  processHtmlContent = (html: string): string => {
    if (!html) return ''
    
    // 移除图片标签中的固定宽高属性，添加自适应样式
    return html
      .replace(/<img([^>]*?)width="[^"]*"([^>]*?)>/gi, '<img$1$2>')
      .replace(/<img([^>]*?)height="[^"]*"([^>]*?)>/gi, '<img$1$2>')
      .replace(/<img([^>]*?)style="([^"]*?)"([^>]*?)>/gi, (match, before, style, after) => {
        // 移除 style 中的 width 和 height
        const newStyle = style
          .replace(/width\s*:\s*[^;]+;?/gi, '')
          .replace(/height\s*:\s*[^;]+;?/gi, '')
          .trim()
        return `<img${before}style="max-width:100%;height:auto;${newStyle}"${after}>`
      })
      .replace(/<img(?![^>]*style=)([^>]*?)>/gi, '<img$1 style="max-width:100%;height:auto;">')
  }

  // 格式化时间
  formatTime = (timeStr: string): string => {
    if (!timeStr) return ''
    try {
      const date = new Date(timeStr)
      const year = date.getFullYear()
      const month = String(date.getMonth() + 1).padStart(2, '0')
      const day = String(date.getDate()).padStart(2, '0')
      const hour = String(date.getHours()).padStart(2, '0')
      const minute = String(date.getMinutes()).padStart(2, '0')
      return `${year}-${month}-${day} ${hour}:${minute}`
    } catch (e) {
      return timeStr
    }
  }

  // 清理 HTML 标签
  stripHtml = (html: string): string => {
    return String(html)
      .replace(/<style[\s\S]*?<\/style>/gi, '')
      .replace(/<script[\s\S]*?<\/script>/gi, '')
      .replace(/<[^>]+>/g, '')
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim()
  }

  // 图片预览
  onImageClick = (current: string, images: string[]) => {
    Taro.previewImage({
      current,
      urls: images
    })
  }

  // 分享
  onShare = () => {
    const { announcement } = this.state
    if (!announcement) return

    Taro.showShareMenu({
      withShareTicket: true
    })
  }

  // 返回
  onBack = () => {
    Taro.navigateBack()
  }

  // 重试加载
  onRetry = () => {
    const { id } = Taro.getCurrentInstance().router?.params || {}
    if (id) {
      this.loadAnnouncementDetail(id)
    }
  }

  // 获取图片网格的类名
  getImagesGridClass = (count: number): string => {
    if (count === 1) return 'images-grid single'
    if (count === 2) return 'images-grid double'
    return 'images-grid'
  }

  render() {
    const { loading, error, announcement } = this.state

    // 加载中
    if (loading) {
      return (
        <View className='announcement-detail'>
          <View className='loading-container'>
            <Text>加载中...</Text>
          </View>
        </View>
      )
    }

    // 错误状态
    if (error || !announcement) {
      return (
        <View className='announcement-detail'>
          <View className='error-container'>
            <Text className='error-icon'>⚠️</Text>
            <Text className='error-text'>{error || '加载失败'}</Text>
            <View className='retry-btn' onClick={this.onRetry}>
              <Text>重试</Text>
            </View>
          </View>
        </View>
      )
    }

    const cleanContent = this.stripHtml(announcement.content)
    const hasImages = announcement.images && announcement.images.length > 0
    const imageCount = announcement.images?.length || 0

    return (
        <View className='announcement-detail'>
          {/* 状态栏占位 */}
          <View className="status-bar-placeholder"></View>
        <View className='content-wrapper'>
          {/* 标题和元信息 */}
          <View className='header'>
            <Text className='title'>{announcement.title}</Text>
            <View className='meta'>
              <Text className='author'>👤 {announcement.author_name}</Text>
              {announcement.created_at && (
                <Text className='time'>🕒 {this.formatTime(announcement.created_at)}</Text>
              )}
              {announcement.status && (
                <Text className={`status ${announcement.status}`}>
                  {announcement.status === 'published' ? '已发布' : '草稿'}
                </Text>
              )}
            </View>
          </View>


          {/* 内容 */}
          <View className='content-section'>
            {announcement.content ? (
              <RichText 
                className='rich-content' 
                nodes={this.processHtmlContent(announcement.content)}
                space='nbsp'
              />
            ) : (
              <Text className='empty-content'>暂无内容</Text>
            )}
          </View>
        </View>

        {/* 底部操作栏 */}
        <View className='actions' style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}>
          <View className='action-btn' onClick={this.onBack}>
            <Text className='icon'>←</Text>
            <Text>返回</Text>
          </View>
          <View className='action-btn primary' onClick={this.onShare}>
            <Text className='icon'>↗</Text>
            <Text>分享</Text>
          </View>
        </View>
      </View>
    )
  }
}

export default AnnouncementDetailPage
