import { Component } from 'react'
import { View, Text, Input, Textarea, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'
import { apiService } from '../../services/api'

interface PublishState {
  title: string
  description: string
  price: string
  imageUrl: string
  isSubmitting: boolean
}

export default class FleaMarketPublishPage extends Component<any, PublishState> {
  state: PublishState = {
    title: '',
    description: '',
    price: '',
    imageUrl: '',
    isSubmitting: false
  }

  // 返回
  onBack = () => {
    Taro.navigateBack()
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
    const { title, description, price, imageUrl, isSubmitting } = this.state

    // 验证
    if (!title.trim()) {
      Taro.showToast({ title: '请输入商品标题', icon: 'none' })
      return
    }

    if (!description.trim()) {
      Taro.showToast({ title: '请输入商品描述', icon: 'none' })
      return
    }

    if (!price.trim()) {
      Taro.showToast({ title: '请输入商品价格', icon: 'none' })
      return
    }

    const priceNum = parseFloat(price)
    if (isNaN(priceNum) || priceNum <= 0) {
      Taro.showToast({ title: '请输入有效价格', icon: 'none' })
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
      // 如果有图片，这里应该先上传图片获取URL
      // 现在暂时直接使用本地路径（实际应该上传到服务器）
      
      await apiService.createFleaMarketItem({
        title: title.trim(),
        description: description.trim(),
        price: priceNum,
        publisher_uid: userInfo.userId,
        image_url: imageUrl || ''
      })

      Taro.showToast({ 
        title: '发布成功，等待审核', 
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
    const { title, description, price, imageUrl, isSubmitting } = this.state

    return (
      <View className="publish-page">
        {/* 状态栏占位 */}
        <View className="status-bar-placeholder"></View>

        {/* 顶部导航 */}
        <View className="header">
          <View className="back-btn" onClick={this.onBack}>
            <Text className="back-icon">‹</Text>
          </View>
          <Text className="title">发布商品</Text>
          <View className="placeholder"></View>
        </View>

        {/* 表单内容 */}
        <View className="content">
          {/* 图片上传 */}
          <View className="form-section">
            <Text className="section-label">商品图片</Text>
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

          {/* 商品标题 */}
          <View className="form-section">
            <Text className="section-label">商品标题</Text>
            <Input
              className="input"
              placeholder="请输入商品标题"
              value={title}
              maxlength={50}
              onInput={(e) => this.setState({ title: e.detail.value })}
            />
            <Text className="input-hint">{title.length}/50</Text>
          </View>

          {/* 商品描述 */}
          <View className="form-section">
            <Text className="section-label">商品描述</Text>
            <Textarea
              className="textarea"
              placeholder="请详细描述商品信息、成色、购买时间等"
              value={description}
              maxlength={500}
              onInput={(e) => this.setState({ description: e.detail.value })}
            />
            <Text className="input-hint">{description.length}/500</Text>
          </View>

          {/* 商品价格 */}
          <View className="form-section">
            <Text className="section-label">商品价格</Text>
            <View className="price-input">
              <Text className="price-symbol">¥</Text>
              <Input
                className="input"
                type="digit"
                placeholder="0.00"
                value={price}
                onInput={(e) => this.setState({ price: e.detail.value })}
              />
            </View>
          </View>

          {/* 提交按钮 */}
          <Button 
            className="submit-btn" 
            onClick={this.onSubmit}
            disabled={isSubmitting}
          >
            {isSubmitting ? '发布中...' : '发布商品'}
          </Button>

          <Text className="submit-hint">
            发布的商品需要经过审核后才会显示
          </Text>
        </View>
      </View>
    )
  }
}
