import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text, Input, Textarea, Image, Picker } from '@tarojs/components'
import './index.scss'
import { apiService, API_BASE_URL } from '../../services/api'

interface PublishState {
  type: 'lost' | 'found'
  title: string
  description: string
  category: string
  location: string
  time: string
  contact: string
  images: string[]
  submitting: boolean
  statusBarHeight: number
  wechatQr?: string
  featureDisabled: boolean
  offlineMessage: string
}

const CATEGORIES = [
  { value: 'card', label: '证卡类' },
  { value: 'electronics', label: '数码产品' },
  { value: 'key', label: '钥匙' },
  { value: 'wallet', label: '钱包' },
  { value: 'book', label: '书籍' },
  { value: 'other', label: '其他' }
]

// 地点改为自由输入

export default class LostFoundPublishPage extends Component<any, PublishState> {
  state: PublishState = {
    type: 'lost',
    title: '',
    description: '',
    category: 'card',
    location: '',
    time: '',
    contact: '',
    images: [],
    submitting: false,
    statusBarHeight: 44,
    wechatQr: '',
    featureDisabled: false,
    offlineMessage: ''
  }

  maxImages = 9

  componentDidMount() {
    if (!this.checkFeatureEnabled()) return
    // 从路由参数获取类型
    const pages = Taro.getCurrentPages()
    const currentPage = pages[pages.length - 1]
    const type = currentPage.options?.type || 'lost'
    const editId = currentPage.options?.id
    this.setState({ type: type as 'lost' | 'found' })
    const win = Taro.getWindowInfo ? Taro.getWindowInfo() : (Taro as any).getSystemInfoSync?.()
    const statusBarHeight = win?.statusBarHeight ? Number(win.statusBarHeight) : 44
    this.setState({ statusBarHeight })
    if (editId) this.loadDetail(String(editId))
  }

  checkFeatureEnabled = (): boolean => {
    const featureSettings = Taro.getStorageSync('featureSettings') || {}
    if (!featureSettings.lost_found || !featureSettings.lost_found.enabled) {
      this.setState({
        featureDisabled: true,
        offlineMessage: featureSettings.lost_found?.message || '失物招领功能暂时关闭，敬请期待'
      })
      return false
    }
    return true
  }

  // 详情回填（编辑）
  loadDetail = async (id: string) => {
    try {
      const resp:any = await apiService.getLostFoundDetail(id)
      const it = resp?.data || resp
      if(!it) return
      let images:string[] = []
      if (Array.isArray(it.image_urls)) images = it.image_urls
      else if (typeof it.image_urls === 'string') { try { const arr = JSON.parse(it.image_urls); if(Array.isArray(arr)) images = arr } catch {} }
      if (images.length===0 && it.image_url) images = [it.image_url]
      const locationValue = (()=>{ return this.state.location })()
      this.setState({
        type: (it.status==='found'?'found':'lost'),
        title: it.title || it.description?.slice(0,20) || '',
        description: it.description || '',
        location: locationValue,
        contact: it.contact_info || '',
        images,
        wechatQr: it.wechat_qr_url || ''
      })
      ;(this as any).editId = id
    } catch(e){ Taro.showToast({ title:'加载详情失败', icon:'none'}) }
  }

  // 选择图片
  chooseImages = () => {
    const { images } = this.state
    const remainCount = this.maxImages - images.length

    if (remainCount <= 0) {
      Taro.showToast({
        title: `最多上传${this.maxImages}张图片`,
        icon: 'none'
      })
      return
    }

    Taro.chooseImage({
      count: remainCount,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        this.setState({
          images: [...images, ...res.tempFilePaths]
        })
      }
    })
  }

  // 预览图片
  previewImage = (index: number) => {
    Taro.previewImage({
      current: this.state.images[index],
      urls: this.state.images
    })
  }

  // 删除图片
  deleteImage = (index: number) => {
    const { images } = this.state
    Taro.showModal({
      title: '提示',
      content: '确定删除这张图片吗？',
      success: (res) => {
        if (res.confirm) {
          const newImages = [...images]
          newImages.splice(index, 1)
          this.setState({ images: newImages })
        }
      }
    })
  }

  // 选择微信二维码
  chooseQr = () => {
    Taro.chooseImage({
      count: 1,
      sizeType: ['compressed'],
      sourceType: ['album','camera'],
      success: (res) => {
        const path = res.tempFilePaths?.[0]
        if (path) this.setState({ wechatQr: path })
      }
    })
  }

  // 上传文件
  uploadLocalFile = async (filePath: string): Promise<string> => {
    console.log('[失物招领] 开始上传图片:', filePath)
    
    // 基础类型校验
    try {
      const info = await Taro.getImageInfo({ src: filePath })
      const t = (info as any)?.type?.toLowerCase?.() || ''
      const allowed = ['jpg','jpeg','png','webp']
      if (t && !allowed.includes(t)) {
        throw new Error('仅支持 jpg/jpeg/png/webp')
      }
      console.log('[失物招领] 图片类型:', t)
    } catch (_) {}

    const prepared = await this.prepareFile(filePath)
    console.log('[失物招领] 压缩后路径:', prepared)
    
    const token = Taro.getStorageSync('userToken')
    if (!token) {
      Taro.showModal({ title: '提示', content: '请先登录后再上传图片', showCancel: false })
      throw new Error('No token')
    }
    
    console.log('[失物招领] 开始上传到服务器...')
    const res = await Taro.uploadFile({
      url: `${API_BASE_URL}/api/upload/image`,
      filePath: prepared,
      name: 'file',
      header: { Authorization: `Bearer ${token}` }
    })
    
    console.log('[失物招领] 上传响应状态:', res.statusCode)
    console.log('[失物招领] 上传响应数据:', res.data)
    
    if (res.statusCode !== 200) {
      throw new Error(`上传失败: HTTP ${res.statusCode}`)
    }
    
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : (res.data as any)
    if (!data || !data.url) {
      console.error('[失物招领] 响应中没有URL:', data)
      throw new Error('上传失败: 未返回URL')
    }
    
    console.log('[失物招领] 上传成功,URL:', data.url)
    return data.url
  }

  // 将图片压缩到阈值以内（约 2MB）
  prepareFile = async (path: string): Promise<string> => {
    try {
      const fsm = Taro.getFileSystemManager?.()
      const info: any = fsm && (fsm as any).getFileInfo ? await (fsm as any).getFileInfo({ filePath: path }) : await (Taro as any).getFileInfo({ filePath: path })
      const limit = 2 * 1024 * 1024
      if ((info?.size || 0) <= limit) return path
      const quality = info.size > 8 * 1024 * 1024 ? 40 : 60
      const r: any = await Taro.compressImage({ src: path, quality })
      return r?.tempFilePath || path
    } catch {
      return path
    }
  }

  // 切换类型（寻物/招领）
  onTypeChange = (type: 'lost' | 'found') => {
    this.setState({ type })
  }

  // 表单验证
  validateForm = () => {
    const { title, description, time, contact } = this.state

    if (!title.trim()) {
      Taro.showToast({ title: '请输入标题', icon: 'none' })
      return false
    }

    if (!description.trim()) {
      Taro.showToast({ title: '请输入详细描述', icon: 'none' })
      return false
    }

    if (!time.trim()) {
      Taro.showToast({ title: '请输入时间', icon: 'none' })
      return false
    }

    if (!contact.trim()) {
      Taro.showToast({ title: '请输入联系方式', icon: 'none' })
      return false
    }

    return true
  }

  // 提交发布
  onSubmit = async () => {
    if (!this.validateForm()) return

    const { submitting } = this.state
    if (submitting) return

    this.setState({ submitting: true })

    try {
      const userInfo = Taro.getStorageSync('userInfo') || {}
      const publisherUid = userInfo.userId || userInfo.uid || ''

      console.log('[失物招领] 开始处理图片上传...')
      console.log('[失物招领] 原始图片列表:', this.state.images)
      
      // 判断是否为真实服务器URL(不是临时路径)
      const isRealServerUrl = (s: string) => {
        if (!s) return false
        // 微信临时路径: wxfile://, http://tmp/, https://tmp/
        if (s.startsWith('wxfile://') || s.includes('://tmp/')) {
          console.log('[失物招领] 临时路径:', s)
          return false
        }
        // 真实服务器URL: http://localhost, http://域名, https://域名
        if (/^https?:\/\/(?!tmp)/.test(s)) {
          console.log('[失物招领] 真实URL:', s)
          return true
        }
        // 其他本地路径
        console.log('[失物招领] 本地路径:', s)
        return false
      }
      
      const imageUrls: string[] = []
      for (let i = 0; i < this.state.images.length; i++) {
        const p = this.state.images[i]
        console.log(`[失物招领] 处理第 ${i + 1} 张图片:`, p)
        
        if (isRealServerUrl(p)) {
          console.log(`[失物招领] 第 ${i + 1} 张是服务器URL,直接使用`)
          imageUrls.push(p)
        } else {
          console.log(`[失物招领] 第 ${i + 1} 张需要上传...`)
          try {
            const url = await this.uploadLocalFile(p)
            console.log(`[失物招领] 第 ${i + 1} 张上传成功:`, url)
            imageUrls.push(url)
          } catch (e) {
            console.error(`[失物招领] 第 ${i + 1} 张上传失败:`, e)
            throw e
          }
        }
      }
      
      console.log('[失物招领] 所有图片处理完成:', imageUrls)
      
      // 上传二维码
      let qrUrl = ''
      if (this.state.wechatQr) {
        console.log('[失物招领] 处理二维码:', this.state.wechatQr)
        if (isRealServerUrl(this.state.wechatQr)) {
          qrUrl = this.state.wechatQr
        } else {
          qrUrl = await this.uploadLocalFile(this.state.wechatQr)
        }
        console.log('[失物招领] 二维码URL:', qrUrl)
      }

      const payload: any = {
        description: this.state.description,
        image_url: imageUrls[0] || '',
        image_urls: imageUrls,
        category: this.state.category,
        status: this.state.type,
        publisher_uid: publisherUid,
        contact_info: this.state.contact,
        wechat_qr_url: qrUrl,
        location: this.state.location,
        lost_time: this.state.time
      }
      
      console.log('[失物招领] 提交数据:', payload)
      
      if ((this as any).editId) {
        await apiService.updateLostFoundItem((this as any).editId, payload)
        Taro.showToast({ title: '已更新', icon: 'success', duration: 1500 })
      } else {
        await apiService.createLostFoundItem(payload)
        Taro.showToast({ title: '发布成功', icon: 'success', duration: 1500 })
      }
      // 标记列表需要刷新
      Taro.setStorageSync('refresh_lost_found', Date.now())
      setTimeout(() => Taro.navigateBack(), 1500)
    } catch (error) {
      console.error('发布失败:', error)
      Taro.showToast({ title: '发布失败，请重试', icon: 'none' })
      this.setState({ submitting: false })
    }
  }

  // 返回
  onBack = () => {
    Taro.showModal({
      title: '提示',
      content: '确定放弃发布吗？',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateBack()
        }
      }
    })
  }

  render() {
    const {
      type,
      title,
      description,
      category,
      location,
      time,
      contact,
      images,
      submitting,
      featureDisabled,
      offlineMessage
    } = this.state

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

    const categoryIndex = CATEGORIES.findIndex(c => c.value === category)

    return (
      <View className="lost-found-publish-page">
        {/* 状态栏占位 */}
        <View className="status-bar-placeholder" style={{ height: `${this.state.statusBarHeight}px` }}></View>
        
        {/* 头部 */}
        <View className="page-header" style={{ paddingTop: `${this.state.statusBarHeight}px` }}>
          <View className="back-btn" onClick={this.onBack}>
            <Text className="back-icon">‹</Text>
            <Text className="back-text">取消</Text>
          </View>
          <Text className="page-title">
            {type === 'lost' ? '发布寻物' : '发布招领'}
          </Text>
          <View className="submit-btn" style={{ opacity: 0 }}>
            <Text className="submit-text">占位</Text>
          </View>
        </View>

        {/* 表单内容 */}
        <View className="form-content">
          {/* 类型切换 */}
          <View className="type-switch">
            <View
              className={`switch-item ${type === 'lost' ? 'active' : ''}`}
              onClick={() => this.onTypeChange('lost')}
            >
              <Text className="switch-icon">?</Text>
              <Text className="switch-text">寻物启事</Text>
            </View>
            <View
              className={`switch-item ${type === 'found' ? 'active' : ''}`}
              onClick={() => this.onTypeChange('found')}
            >
              <Text className="switch-icon">!</Text>
              <Text className="switch-text">失物招领</Text>
            </View>
          </View>

          {/* 类型提示 */}
          <View className={`type-banner ${type}`}>
            <Text className="banner-icon">{type === 'lost' ? '?' : '!'}</Text>
            <View className="banner-content">
              <Text className="banner-title">
                {type === 'lost' ? '寻物启事' : '失物招领'}
              </Text>
              <Text className="banner-hint">
                {type === 'lost' 
                  ? '请详细描述丢失物品的特征和丢失地点' 
                  : '请详细描述拾到物品的特征和拾到地点'}
              </Text>
            </View>
          </View>

          {/* 图片上传 */}
          <View className="form-section">
            <View className="section-header">
              <Text className="section-title">物品图片</Text>
              <Text className="section-hint">选填，最多{this.maxImages}张</Text>
            </View>
            <View className="images-grid">
              {images.map((img, index) => (
                <View key={index} className="image-item">
                  <Image
                    src={img}
                    className="image"
                    mode="aspectFill"
                    onClick={() => this.previewImage(index)}
                  />
                  <View
                    className="delete-btn"
                    onClick={() => this.deleteImage(index)}
                  >
                    <Text className="delete-icon">×</Text>
                  </View>
                </View>
              ))}
              {images.length < this.maxImages && (
                <View className="add-image-btn" onClick={this.chooseImages}>
                  <Text className="add-icon">+</Text>
                  <Text className="add-text">添加图片</Text>
                </View>
              )}
            </View>
          </View>

          {/* 基本信息 */}
          <View className="form-section">
            <View className="section-header">
              <Text className="section-title">基本信息</Text>
            </View>

            <View className="form-item">
              <Text className="item-label">物品名称</Text>
              <Input
                className="item-input"
                placeholder={type === 'lost' ? '例如：黑色钱包' : '例如：拾到校园卡'}
                value={title}
                maxlength={50}
                onInput={(e) => this.setState({ title: e.detail.value })}
              />
            </View>

            <View className="form-item">
              <Text className="item-label">详细描述</Text>
              <Textarea
                className="item-textarea"
                placeholder={type === 'lost' 
                  ? '请描述物品的颜色、品牌、特征等信息，以及大致丢失的时间和地点' 
                  : '请描述物品的颜色、品牌、特征等信息，以及拾到的时间和地点'}
                value={description}
                maxlength={500}
                onInput={(e) => this.setState({ description: e.detail.value })}
              />
            </View>

            <View className="form-item picker-item">
              <Text className="item-label">物品分类</Text>
              <Picker
                mode="selector"
                range={CATEGORIES.map(c => c.label)}
                value={categoryIndex}
                onChange={(e) => {
                  const index = e.detail.value as number
                  this.setState({ category: CATEGORIES[index].value })
                }}
              >
                <View className="picker-value">
                  <Text>{CATEGORIES[categoryIndex].label}</Text>
                  <Text className="picker-arrow">›</Text>
                </View>
              </Picker>
            </View>

            <View className="form-item">
              <Text className="item-label">{type === 'lost' ? '丢失地点' : '拾到地点'}</Text>
              <Input
                className="item-input"
                placeholder={type === 'lost' ? '请输入丢失地点' : '请输入拾到地点'}
                value={location}
                onInput={(e)=> this.setState({ location: e.detail.value })}
              />
            </View>

            <View className="form-item">
              <Text className="item-label">
                {type === 'lost' ? '丢失时间' : '拾到时间'}
              </Text>
              <Input
                className="item-input"
                placeholder="例如：10月3日 下午2点"
                value={time}
                onInput={(e) => this.setState({ time: e.detail.value })}
              />
            </View>

            <View className="form-item">
              <Text className="item-label">联系方式</Text>
              <Input
                className="item-input"
                placeholder="请输入微信号、QQ号或手机号"
                value={contact}
                onInput={(e) => this.setState({ contact: e.detail.value })}
              />
            </View>

            <View className="form-item">
              <Text className="item-label">微信二维码（选填）</Text>
              <View className="images-grid">
                {this.state.wechatQr ? (
                  <View className="image-item">
                    <Image src={this.state.wechatQr} className="image" mode="aspectFill" />
                    <View className="delete-btn" onClick={() => this.setState({ wechatQr: '' })}>
                      <Text className="delete-icon">×</Text>
                    </View>
                  </View>
                ) : (
                  <View className="add-image-btn" onClick={this.chooseQr}>
                    <Text className="add-icon">+</Text>
                    <Text className="add-text">上传二维码</Text>
                  </View>
                )}
              </View>
            </View>
          </View>

          {/* 提示信息 */}
          <View className="tips-section">
            <View className="tips-title">
              <Text className="tips-icon">◉</Text>
              <Text className="tips-text">温馨提示</Text>
            </View>
            <Text className="tips-item">• 请详细描述物品特征，便于快速找到</Text>
            <Text className="tips-item">• 请保持联系方式畅通，及时回复消息</Text>
            <Text className="tips-item">• 请核实对方身份后再归还/认领物品</Text>
            <Text className="tips-item">• 如物品已找到，请及时关闭信息</Text>
          </View>
        </View>

        {/* 底部操作栏 */}
        <View className="bottom-bar">
          <View className="preview-info">
            <Text className="info-text">
              已添加 {images.length}/{this.maxImages} 张图片
            </Text>
          </View>
          <View 
            className={`publish-btn ${submitting ? 'disabled' : ''}`}
            onClick={this.onSubmit}
          >
            <Text className="publish-text">
              {submitting ? '发布中...' : '立即发布'}
            </Text>
          </View>
        </View>
      </View>
    )
  }
}

