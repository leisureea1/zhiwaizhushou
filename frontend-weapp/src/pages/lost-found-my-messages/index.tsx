import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import './index.scss'

export default class LostFoundMyMessagesPage extends Component<any, any> {
  state = { statusBarHeight: 44, featureDisabled: false, offlineMessage: '' }
  componentDidMount(){ 
    const w=(Taro as any).getWindowInfo?.()||(Taro as any).getSystemInfoSync?.()
    this.setState({statusBarHeight:Number(w?.statusBarHeight||44)})
    if (!this.checkFeatureEnabled()) return
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
  
  render(){ 
    const { featureDisabled, offlineMessage } = this.state
    
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
    
    return (
    <View className='lf-mymessages-page'>
      <View className='status-bar' style={{height:`${this.state.statusBarHeight}px`}} />
      <View className='nav' style={{paddingTop:`${this.state.statusBarHeight}px`}}>
        <View onClick={()=>Taro.navigateBack()}><Text className='back'>‹</Text></View>
        <Text className='title'>我的消息</Text>
        <View />
      </View>
      <View style={{marginTop:'160rpx',textAlign:'center',color:'#999'}}>
        <Text>暂无消息</Text>
      </View>
    </View>
  ) }
}
