import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { apiService } from '../../services/api'
import './index.scss'

interface Item {
  id: string
  title: string
  price: number | string
  image: string
  status: string
}

interface State { statusBarHeight: number; uid: string; username: string; navigating?: boolean }

export default class FleaMarketMinePage extends Component<any, State> {
  state: State = { statusBarHeight: 44, uid: '', username: '', navigating: false }
  goSafe = (url: string) => {
    if (this.state.navigating) return
    this.setState({ navigating: true }, () => {
      Taro.nextTick(() => {
        Taro.navigateTo({ url })
        setTimeout(() => this.setState({ navigating: false }), 1200)
      })
    })
  }

  componentDidMount() {
    const win = Taro.getWindowInfo ? Taro.getWindowInfo() : (Taro as any).getSystemInfoSync?.()
    const statusBarHeight = win?.statusBarHeight ? Number(win.statusBarHeight) : 44
    const userInfo = Taro.getStorageSync('userInfo') || {}
    // 显示小程序账户名：优先登录时的 username，其次回退到 name
    const username = userInfo.username || userInfo.userName || userInfo.name || ''
    this.setState({ statusBarHeight, uid: String(userInfo.userId || userInfo.uid || ''), username })
  }

  render() {
    const { uid, username } = this.state
    const userInfo = Taro.getStorageSync('userInfo') || {}
    const avatarUrl = userInfo.avatarUrl || userInfo.avatar || ''
    return (
      <View className='mine-page'>
        <View className='status-bar' style={{ height: `${this.state.statusBarHeight}px` }} />
        <View className='nav' style={{ paddingTop: `${this.state.statusBarHeight}px` }}>
          <View className='left' onClick={() => Taro.navigateBack()}><Text className='back'>‹</Text></View>
          <Text className='title'>我的</Text>
          <View className='right' />
        </View>

        <View className='profile'>
          <View className='avatar'>{avatarUrl ? <Image src={avatarUrl} style={{width:'96rpx',height:'96rpx',borderRadius:'48rpx'}} mode='aspectFill' /> : null}</View>
          <View className='info'>
            <Text className='name'>{username || '未登录'}</Text>
            <Text className='uid'>UID: {uid || '-'}</Text>
          </View>
        </View>

        <View className='entry-list'>
          <View className='entry' onClick={()=>this.goSafe('/pages/flea-market-my-list/index')}>
            <Text className='entry-title'>我的发布</Text>
            <Text className='arrow'>›</Text>
          </View>
          <View className='entry' onClick={()=>this.goSafe('/pages/flea-market-my-messages/index')}>
            <Text className='entry-title'>我的消息</Text>
            <Text className='arrow'>›</Text>
          </View>
        </View>
      </View>
    )
  }
}


