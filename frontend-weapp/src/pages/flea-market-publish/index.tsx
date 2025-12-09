import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text, Input, Textarea, Image, Picker } from '@tarojs/components'
import { apiService, API_BASE_URL } from '../../services/api'
import './index.scss'

interface PublishState {
  title: string
  description: string
  price: string
  category: string
  condition: string
  location: string
  contact: string
  images: string[]
  submitting: boolean
  statusBarHeight: number
  wechatQr?: string
  editId?: string
  featureDisabled: boolean
  offlineMessage: string
}

const CATEGORIES = [
  { value: 'electronics', label: '数码产品' },
  { value: 'books', label: '书籍文具' },
  { value: 'sports', label: '运动器材' },
  { value: 'daily', label: '生活用品' },
  { value: 'other', label: '其他' }
]

const CONDITIONS = [
  { value: 'new', label: '全新' },
  { value: 'like_new', label: '99新' },
  { value: 'good', label: '8成新' },
  { value: 'fair', label: '5成新' }
]

const LOCATIONS = [
  { value: 'changan', label: '长安校区' },
  { value: 'yanta', label: '雁塔校区' }
]

export default class FleaMarketPublishPage extends Component<any, PublishState> {
  state: PublishState = {
    title: '',
    description: '',
    price: '',
    category: 'electronics',
    condition: 'good',
    location: 'changan',
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
    const win = Taro.getWindowInfo ? Taro.getWindowInfo() : (Taro as any).getSystemInfoSync?.()
    const statusBarHeight = win?.statusBarHeight ? Number(win.statusBarHeight) : 44
    this.setState({ statusBarHeight })

    if (!this.checkFeatureEnabled()) return

    // 检测是否编辑模式
    const pages = Taro.getCurrentPages()
    const current = pages[pages.length - 1] as any
    const editId = current?.options?.id
    if (editId) {
      this.setState({ editId: String(editId) })
      this.loadDetail(String(editId))
    }
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

  // 根据后端详情回填表单
  loadDetail = async (id: string) => {
    try {
      const resp: any = await apiService.getFleaMarketDetail(id)
      const it = resp?.data || resp?.item || resp
      if (!it) return

      const parsedImages: string[] = []
      if (Array.isArray(it.image_urls)) {
        parsedImages.push(...it.image_urls)
      } else if (typeof it.image_urls === 'string') {
        try {
          const arr = JSON.parse(it.image_urls)
          if (Array.isArray(arr)) parsedImages.push(...arr)
        } catch {}
      }
      if (parsedImages.length === 0 && it.image_url) parsedImages.push(it.image_url)

      const locationValue = (() => {
        const byLabel = LOCATIONS.find(l => l.label === it.location)
        if (byLabel) return byLabel.value
        const byValue = LOCATIONS.find(l => l.value === it.location)
        return byValue ? byValue.value : this.state.location
      })()

      const conditionValue = (() => {
        const raw = it.condition_level || it.condition || 'good'
        const allowed = CONDITIONS.map(c => c.value)
        return allowed.includes(raw) ? raw : 'good'
      })()

      const categoryValue = (() => {
        const raw = it.category || this.state.category
        const allowed = CATEGORIES.map(c => c.value)
        return allowed.includes(raw) ? raw : this.state.category
      })()

      this.setState({
        title: it.title || '',
        description: it.description || '',
        price: String(it.price || ''),
        category: categoryValue,
        condition: conditionValue,
        location: locationValue,
        contact: it.contact_info || it.contact || '',
        images: parsedImages,
        wechatQr: it.wechat_qr_url || it.contact_qr_url || ''
      })
    } catch (e) {
      console.error('加载商品详情失败', e)
      Taro.showToast({ title: '加载详情失败', icon: 'none' })
    }
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

  // 上传文件到后端,返回url
  uploadLocalFile = async (filePath: string): Promise<string> => {
    console.log('[跳蚤市场] 开始上传图片:', filePath)
    
    // 基础类型校验(前端侧)
    try {
      const info = await Taro.getImageInfo({ src: filePath })
      const t = (info as any)?.type?.toLowerCase?.() || ''
      const allowed = ['jpg','jpeg','png','webp']
      if (t && !allowed.includes(t)) {
        throw new Error('仅支持 jpg/jpeg/png/webp')
      }
      console.log('[跳蚤市场] 图片类型:', t)
    } catch (_) {
      // getImageInfo 某些平台返回失败时忽略,由服务端二次校验
    }

    // 压缩以避免超过服务端限制
    const prepared = await this.prepareFile(filePath)
    console.log('[跳蚤市场] 压缩后路径:', prepared)
    
    const token = Taro.getStorageSync('userToken')
    if (!token) {
      Taro.showModal({ title: '提示', content: '请先登录后再上传图片', showCancel: false })
      throw new Error('No token')
    }
    
    console.log('[跳蚤市场] 开始上传到服务器...')
    const res = await Taro.uploadFile({
      url: `${API_BASE_URL}/api/upload/image`,
      filePath: prepared,
      name: 'file',
      header: { Authorization: `Bearer ${token}` }
    })
    
    console.log('[跳蚤市场] 上传响应状态:', res.statusCode)
    console.log('[跳蚤市场] 上传响应数据:', res.data)
    
    if (res.statusCode !== 200) {
      throw new Error(`上传失败: HTTP ${res.statusCode}`)
    }
    
    const data = typeof res.data === 'string' ? JSON.parse(res.data) : (res.data as any)
    if (!data || !data.url) {
      console.error('[跳蚤市场] 响应中没有URL:', data)
      throw new Error('上传失败: 未返回URL')
    }
    
    console.log('[跳蚤市场] 上传成功,URL:', data.url)
    return data.url
  }

  // 将图片压缩到阈值以内（约 2MB）
  prepareFile = async (path: string): Promise<string> => {
    try {
      const fsm = Taro.getFileSystemManager?.()
      const info: any = fsm && (fsm as any).getFileInfo ? await (fsm as any).getFileInfo({ filePath: path }) : await (Taro as any).getFileInfo({ filePath: path })
      const limit = 2 * 1024 * 1024
      if ((info?.size || 0) <= limit) return path
      // 根据大小动态降低质量
      const quality = info.size > 8 * 1024 * 1024 ? 40 : 60
      const r: any = await Taro.compressImage({ src: path, quality })
      return r?.tempFilePath || path
    } catch {
      return path
    }
  }

  // 表单验证
  validateForm = () => {
    const { title, description, price, images, contact } = this.state

    if (!title.trim()) {
      Taro.showToast({ title: '请输入商品标题', icon: 'none' })
      return false
    }

    if (!description.trim()) {
      Taro.showToast({ title: '请输入商品描述', icon: 'none' })
      return false
    }

    if (!price || parseFloat(price) <= 0) {
      Taro.showToast({ title: '请输入正确的价格', icon: 'none' })
      return false
    }

    if (images.length === 0) {
      Taro.showToast({ title: '请至少上传一张图片', icon: 'none' })
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

      console.log('[跳蚤市场] 开始处理图片上传...')
      console.log('[跳蚤市场] 原始图片列表:', this.state.images)
      
      // 判断是否为真实服务器URL(不是临时路径)
      const isRealServerUrl = (s: string) => {
        if (!s) return false
        // 微信临时路径: wxfile://, http://tmp/, https://tmp/
        if (s.startsWith('wxfile://') || s.includes('://tmp/')) {
          console.log('[跳蚤市场] 临时路径:', s)
          return false
        }
        // 真实服务器URL: http://localhost, http://域名, https://域名
        if (/^https?:\/\/(?!tmp)/.test(s)) {
          console.log('[跳蚤市场] 真实URL:', s)
          return true
        }
        // 其他本地路径
        console.log('[跳蚤市场] 本地路径:', s)
        return false
      }
      
      const imageUrls: string[] = []
      for (let i = 0; i < this.state.images.length; i++) {
        const p = this.state.images[i]
        console.log(`[跳蚤市场] 处理第 ${i + 1} 张图片:`, p)
        
        if (isRealServerUrl(p)) {
          console.log(`[跳蚤市场] 第 ${i + 1} 张是服务器URL,直接使用`)
          imageUrls.push(p)
        } else {
          console.log(`[跳蚤市场] 第 ${i + 1} 张需要上传...`)
          try {
            const url = await this.uploadLocalFile(p)
            console.log(`[跳蚤市场] 第 ${i + 1} 张上传成功:`, url)
            imageUrls.push(url)
          } catch (e) {
            console.error(`[跳蚤市场] 第 ${i + 1} 张上传失败:`, e)
            throw e
          }
        }
      }
      
      console.log('[跳蚤市场] 所有图片处理完成:', imageUrls)
      
      // 上传二维码
      let qrUrl = ''
      if (this.state.wechatQr) {
        console.log('[跳蚤市场] 处理二维码:', this.state.wechatQr)
        if (isRealServerUrl(this.state.wechatQr)) {
          qrUrl = this.state.wechatQr
        } else {
          qrUrl = await this.uploadLocalFile(this.state.wechatQr)
        }
        console.log('[跳蚤市场] 二维码URL:', qrUrl)
      }

      const payload: any = {
        title: this.state.title,
        description: this.state.description,
        price: this.state.price,
        category: this.state.category,
        condition: this.state.condition,
        image_url: imageUrls[0] || '',
        image_urls: imageUrls,
        contact_info: this.state.contact,
        wechat_qr_url: qrUrl,
        publisher_uid: publisherUid,
        location: (LOCATIONS.find(l => l.value === this.state.location)?.label) || this.state.location
      }

      console.log('[跳蚤市场] 提交数据:', payload)

      if (this.state.editId) {
        await apiService.updateFleaMarketItem(this.state.editId, payload)
      } else {
        await apiService.createFleaMarketItem(payload)
      }

      Taro.showToast({ title: this.state.editId ? '已更新，待审核通过后展示' : '已提交，待审核通过后展示', icon: 'success', duration: 2000 })
      // 标记列表需要刷新
      Taro.setStorageSync('refresh_flea_market', Date.now())
      setTimeout(() => Taro.navigateBack(), 2000)
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
      title,
      description,
      price,
      category,
      condition,
      location,
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
    const conditionIndex = CONDITIONS.findIndex(c => c.value === condition)
    const locationIndex = LOCATIONS.findIndex(l => l.value === location)

    return (
      <View className="publish-page">
        {/* 状态栏占位 */}
        <View className="status-bar-placeholder" style={{ height: `${this.state.statusBarHeight}px` }}></View>
        
        {/* 头部 */}
        <View className="page-header" style={{ paddingTop: `${this.state.statusBarHeight}px` }}>
          <View className="back-btn" onClick={this.onBack}>
            <Text className="back-icon">‹</Text>
            <Text className="back-text">取消</Text>
          </View>
          <Text className="page-title">{this.state.editId ? '编辑商品' : '发布商品'}</Text>
          <View className="submit-btn" style={{ opacity: 0 }}>
            <Text className="submit-text">占位</Text>
          </View>
        </View>

        {/* 表单内容 */}
        <View className="form-content">
          {/* 图片上传 */}
          <View className="form-section">
            <View className="section-header">
              <Text className="section-title">商品图片</Text>
              <Text className="section-hint">最多{this.maxImages}张</Text>
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
              <Text className="item-label">商品标题</Text>
              <Input
                className="item-input"
                placeholder="请输入商品标题"
                value={title}
                maxlength={50}
                onInput={(e) => this.setState({ title: e.detail.value })}
              />
            </View>

            <View className="form-item">
              <Text className="item-label">商品描述</Text>
              <Textarea
                className="item-textarea"
                placeholder="请详细描述商品信息、购买时间、使用情况等"
                value={description}
                maxlength={500}
                onInput={(e) => this.setState({ description: e.detail.value })}
              />
            </View>

            <View className="form-item">
              <Text className="item-label">出售价格</Text>
              <View className="price-input-wrapper">
                <Text className="price-symbol">¥</Text>
                <Input
                  className="item-input price-input"
                  placeholder="0.00"
                  type="digit"
                  value={price}
                  onInput={(e) => this.setState({ price: e.detail.value })}
                />
              </View>
            </View>

            <View className="form-item picker-item">
              <Text className="item-label">商品分类</Text>
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

            <View className="form-item picker-item">
              <Text className="item-label">成色</Text>
              <Picker
                mode="selector"
                range={CONDITIONS.map(c => c.label)}
                value={conditionIndex}
                onChange={(e) => {
                  const index = e.detail.value as number
                  this.setState({ condition: CONDITIONS[index].value })
                }}
              >
                <View className="picker-value">
                  <Text>{CONDITIONS[conditionIndex].label}</Text>
                  <Text className="picker-arrow">›</Text>
                </View>
              </Picker>
            </View>

            <View className="form-item picker-item">
              <Text className="item-label">所在校区</Text>
              <Picker
                mode="selector"
                range={LOCATIONS.map(l => l.label)}
                value={locationIndex}
                onChange={(e) => {
                  const index = e.detail.value as number
                  this.setState({ location: LOCATIONS[index].value })
                }}
              >
                <View className="picker-value">
                  <Text>{LOCATIONS[locationIndex].label}</Text>
                  <Text className="picker-arrow">›</Text>
                </View>
              </Picker>
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
              <Text className="tips-text">发布提示</Text>
            </View>
            <Text className="tips-item">• 请如实描述商品信息，上传真实图片</Text>
            <Text className="tips-item">• 请合理定价，方便快速成交</Text>
            <Text className="tips-item">• 请保持联系方式畅通，及时回复买家</Text>
            <Text className="tips-item">• 严禁发布违法违规信息</Text>
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
              {submitting ? (this.state.editId ? '保存中...' : '发布中...') : (this.state.editId ? '保存修改' : '立即发布')}
            </Text>
          </View>
        </View>
      </View>
    )
  }
}

