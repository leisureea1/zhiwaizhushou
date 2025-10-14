import { Component } from 'react'
import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface FlowCardState {
  showModal: boolean
}

export default class FlowCardPage extends Component<any, FlowCardState> {
  
  state: FlowCardState = {
    showModal: false
  }

  componentDidMount() {
    // 页面加载时直接显示弹窗
    this.setState({ showModal: true })
  }

  // 关闭弹窗
  closeModal = () => {
    this.setState({ showModal: false })
    // 返回上一页
    Taro.navigateBack()
  }

  render() {
    const { showModal } = this.state

    return (
      <View className="flowcard-page">
        {/* 弹窗遮罩 */}
        {showModal && (
          <View className="modal-mask" onClick={this.closeModal}>
            <View className="modal-content" onClick={(e) => e.stopPropagation()}>
              {/* 弹窗标题 */}
              <View className="modal-header">
                <Text className="modal-title">流量卡办理</Text>
                <View className="close-btn" onClick={this.closeModal}>
                  <Text className="close-text">×</Text>
                </View>
              </View>
              
              {/* 弹窗内容 */}
              <View className="modal-body">
                <Text className="modal-desc">扫描下方二维码办理校园流量卡</Text>
                
                {/* 二维码图片 */}
                <View className="qrcode-container">
                  <Image 
                    className="qrcode-image" 
                    src={
                      // 使用远程小图，避免占用主包体积；需要可替换为你的 CDN 地址
                      'https://img.cdn.example.com/xisu/phone-card-qr-640.jpg'
                    }
                    mode="widthFix"
                    show-menu-by-longpress={true}
                  />
                </View>
                
                <Text className="qrcode-tip">长按识别二维码</Text>
                
                <Text className="service-tip">享受校园专属优惠流量套餐</Text>
                
                <Text className="fallback-tip">如长按无法识别，请先保存二维码图片，然后使用微信扫一扫功能</Text>
              </View>
              
              {/* 弹窗底部 */}
              <View className="modal-footer">
                <View className="confirm-btn" onClick={this.closeModal}>
                  <Text className="confirm-text">我知道了</Text>
                </View>
              </View>
            </View>
          </View>
        )}
      </View>
    )
  }
}