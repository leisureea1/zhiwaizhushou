import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import './index.scss'

export default class LostFoundMyMessagesPage extends Component<any, any> {
  state = { statusBarHeight: 44 }
  componentDidMount(){ const w=(Taro as any).getWindowInfo?.()||(Taro as any).getSystemInfoSync?.(); this.setState({statusBarHeight:Number(w?.statusBarHeight||44)}) }
  render(){ return (
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
