import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text, Image } from '@tarojs/components'
import './index.scss'

interface State { statusBarHeight: number; uid: string; username: string; navigating?: boolean; featureDisabled: boolean; offlineMessage: string }

export default class LostFoundMinePage extends Component<any, State> {
  state: State = { statusBarHeight: 44, uid: '', username: '', navigating: false, featureDisabled: false, offlineMessage: '' }
  goSafe = (url:string) => {
    if (this.state.navigating) return
    this.setState({ navigating: true }, () => {
      Taro.nextTick(()=>{
        Taro.navigateTo({ url })
        setTimeout(()=> this.setState({ navigating: false }), 1200)
      })
    })
  }
  componentDidMount() {
    const win = Taro.getWindowInfo ? Taro.getWindowInfo() : (Taro as any).getSystemInfoSync?.()
    const statusBarHeight = win?.statusBarHeight ? Number(win.statusBarHeight) : 44
    const userInfo = Taro.getStorageSync('userInfo') || {}
    const username = userInfo.username || userInfo.userName || userInfo.name || ''
    this.setState({ statusBarHeight, uid: String(userInfo.userId || userInfo.uid || ''), username })
    
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

  render() {
    const { uid, username, statusBarHeight, featureDisabled, offlineMessage } = this.state
    
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
    
    const userInfo = Taro.getStorageSync('userInfo') || {}
    const avatarUrl = userInfo.avatarUrl || userInfo.avatar || ''
    return (
    <View className='lf-mine-page'>
      <View className='status-bar' style={{ height: `${statusBarHeight}px` }} />
      <View className='nav' style={{ paddingTop: `${statusBarHeight}px` }}>
        <View className='left' onClick={()=>Taro.navigateBack()}><Text className='back'>‹</Text></View>
        <Text className='title'>我的</Text>
        <View className='right' />
      </View>

      <View className='profile'>
        <View className='avatar'>{avatarUrl ? <Image src={avatarUrl} style={{width:'96rpx',height:'96rpx',borderRadius:'48rpx'}} mode='aspectFill' /> : null}</View>
        <View className='info'>
          <Text className='name'>{username||'未登录'}</Text>
          <Text className='uid'>UID: {uid||'-'}</Text>
        </View>
      </View>

      <View className='entry-list'>
        <View className='entry' onClick={()=>this.goSafe('/pages/lost-found-my-list/index')}>
          <Text className='entry-title'>我的发布</Text>
          <Text className='arrow'>›</Text>
        </View>
        <View className='entry' onClick={()=>this.goSafe('/pages/lost-found-my-messages/index')}>
          <Text className='entry-title'>我的消息</Text>
          <Text className='arrow'>›</Text>
        </View>
      </View>
    </View>
  )}
}
