import { Component } from 'react'
import { View, Text, Textarea, Button, Image, Picker } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'
import { apiService } from '../../services/api'

interface PublishState {
  description: string
  contactInfo: string
  imageUrl: string
  status: 'lost' | 'found'
  isSubmitting: boolean
}

export default class LostFoundPublishPage extends Component<any, PublishState> {
  state: PublishState = {
    description: '',
    contactInfo: '',
    imageUrl: '',
    status: 'lost',
    isSubmitting: false
  }

  statusOptions = [
    { label: '寻物', value: 'lost' },
    { label: '招领', value: 'found' }
  ]

  // 返回
  onBack = () => {
    Taro.navigateBack()
  }

  // 选择类型
  onStatusChange = (e: any) => {
    const index = e.detail.value
    this.setState({ status: this.statusOptions[index].value as 'lost' | 'found' })
  }

  // 选择图片
  onChooseImage = async () => {
    try {
      const res = await Taro.chooseImage({
        count: 1,
        sizeType: ['compressed'],
        sourceType: ['album', 'camera']
      })

      if (res.tempFilePaths && res.tempFilePaths.length > 0) {
        this.setState({ imageUrl: res.tempFilePaths[0] })
      }
    } catch (e: any) {
      console.error('选择图片失败', e)
    }
  }

  // 删除图片
  onRemoveImage = () => {
    this.setState({ imageUrl: '' })
  }

  // 提交
  onSubmit = async () => {
    const { description, contactInfo, imageUrl, status, isSubmitting } = this.state

    // 验证
    if (!description.trim()) {
      Taro.showToast({ title: '请输入物品描述', icon: 'none' })
      return
    }

    if (!contactInfo.trim()) {
      Taro.showToast({ title: '请输入联系方式', icon: 'none' })
      return
    }

    if (isSubmitting) return

    const userInfo = Taro.getStorageSync('userInfo')
    if (!userInfo?.userId) {
      Taro.showToast({ title: '请先登录', icon: 'none' })
      return
    }

    this.setState({ isSubmitting: true })

    try {
      await apiService.createLostFoundItem({
        description: description.trim(),
        contact_info: contactInfo.trim(),
        status,
        publisher_uid: userInfo.userId,
        image_url: imageUrl || ''
      })

      Taro.showToast({ 
        title: '发布成功', 
        icon: 'success',
        duration: 2000
      })

      setTimeout(() => {
        Taro.navigateBack()
      }, 2000)
    } catch (e: any) {
      console.error('发布失败', e)
      Taro.showToast({ 
        title: e.message || '发布失败', 
        icon: 'none' 
      })
      this.setState({ isSubmitting: false })
    }
  }

  render() {
    const { description, contactInfo, imageUrl, status, isSubmitting } = this.state
    const statusIndex = this.statusOptions.findIndex(item => item.value === status)

    return (
      <View className="publish-page lost-found">
        {/* 状态栏占位 */}
        <View className="status-bar-placeholder"></View>

        {/* 顶部导航 */}
        <View className="header">
          <View className="back-btn" onClick={this.onBack}>
            <Text className="back-icon">‹</Text>
          </View>
          <Text className="title">发布信息</Text>
          <View className="placeholder"></View>
        </View>

        {/* 表单内容 */}
        <View className="content">
          {/* 类型选择 */}
          <View className="form-section">
            <Text className="section-label">信息类型</Text>
            <Picker 
              mode="selector" 
              range={this.statusOptions.map(item => item.label)}
              value={statusIndex}
              onChange={this.onStatusChange}
            >
              <View className="picker">
                <Text className="picker-value">
                  {status === 'lost' ? '😢 寻物' : '🎉 招领'}
                </Text>
                <Text className="picker-arrow">›</Text>
              </View>
            </Picker>
          </View>

          {/* 图片上传 */}
          <View className="form-section">
            <Text className="section-label">物品图片</Text>
            <View className="image-upload">
              {imageUrl ? (
                <View className="image-preview">
                  <Image 
                    className="preview-image" 
                    src={imageUrl} 
                    mode="aspectFill"
                  />
                  <View className="remove-btn" onClick={this.onRemoveImage}>
                    <Text className="remove-icon">×</Text>
                  </View>
                </View>
              ) : (
                <View className="upload-btn" onClick={this.onChooseImage}>
                  <Text className="upload-icon">📷</Text>
                  <Text className="upload-text">添加图片</Text>
                </View>
              )}
            </View>
          </View>

          {/* 物品描述 */}
          <View className="form-section">
            <Text className="section-label">物品描述</Text>
            <Textarea
              className="textarea"
              placeholder={status === 'lost' 
                ? '请详细描述丢失物品的特征、丢失时间、地点等信息...' 
                : '请详细描述拾到物品的特征、拾到时间、地点等信息...'}
              value={description}
              maxlength={500}
              onInput={(e) => this.setState({ description: e.detail.value })}
            />
            <Text className="input-hint">{description.length}/500</Text>
          </View>

          {/* 联系方式 */}
          <View className="form-section">
            <Text className="section-label">联系方式</Text>
            <Textarea
              className="textarea small"
              placeholder="请输入您的联系方式（手机号、微信号等）"
              value={contactInfo}
              maxlength={100}
              onInput={(e) => this.setState({ contactInfo: e.detail.value })}
            />
            <Text className="input-hint">{contactInfo.length}/100</Text>
          </View>

          {/* 提交按钮 */}
          <Button 
            className="submit-btn" 
            onClick={this.onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '发布中...' : '发布信息'}
          </Button>

          <Text className="submit-hint">
            {status === 'lost' 
              ? '发布后其他同学看到物品会联系您' 
              : '发布后失主看到会联系您归还'}
          </Text>
        </View>
      </View>
    )
  }
}
