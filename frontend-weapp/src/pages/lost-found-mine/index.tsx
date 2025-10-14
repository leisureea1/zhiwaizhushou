import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import './index.scss'

interface State { statusBarHeight: number; uid: string; username: string; navigating?: boolean }

export default class LostFoundMinePage extends Component<any, State> {
  state: State = { statusBarHeight: 44, uid: '', username: '', navigating: false }
  goSafe = (url:string) => {
    if (this.state.navigating) return
    this.setState({ navigating: true }, () => {
      Taro.nextTick(()=>{
        Taro.navigateTo({ url })
        setTimeout(()=> this.setState({ navigating: false }), 1200)
      })
    })
  }
  componentDidMount(){ const w=(Taro as any).getWindowInfo?.()||(Taro as any).getSystemInfoSync?.(); const s=Number(w?.statusBarHeight||44); const u=Taro.getStorageSync('userInfo')||{}; const username=u.username||u.userName||u.name||''; this.setState({ statusBarHeight: s, uid: String(u.userId||u.uid||''), username }) }
  render(){ const { uid, username } = this.state; const userInfo = Taro.getStorageSync('userInfo')||{}; const avatarUrl = userInfo.avatarUrl||userInfo.avatar||''; return (
    <View className='lf-mine-page'>
      <View className='status-bar' style={{height:`${this.state.statusBarHeight}px`}} />
      <View className='nav' style={{paddingTop:`${this.state.statusBarHeight}px`}}>
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
