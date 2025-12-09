import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text, ScrollView } from '@tarojs/components'
import { apiService } from '../../services/api'
import './index.scss'

export default class MyMessagesPage extends Component<any, any> {
  state = { 
    statusBarHeight: 44, 
    list: [], 
    page: 1, 
    loading: false, 
    hasMore: true,
    featureDisabled: false,
    offlineMessage: ''
  }
  
  componentDidMount(){ 
    const w=(Taro as any).getWindowInfo?.()||(Taro as any).getSystemInfoSync?.()
    this.setState({statusBarHeight: Number(w?.statusBarHeight||44)})
    
    if (!this.checkFeatureEnabled()) return
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
  componentDidShow(){ this.load(true) }
  load = async (refresh=false) => {
    if (this.state.loading) return
    this.setState({loading:true})
    try{
      const page = refresh?1:this.state.page
      const resp:any = await apiService.getMyMessages({ page, limit: 20, action: 'flea_market_review_notify' })
      const arr = (resp?.data||[]) as any[]
      const list = refresh? arr : [...(this.state.list as any[]), ...arr]
      this.setState({ list, page: page+1, hasMore: arr.length>=20 })
    } finally { this.setState({loading:false}) }
  }
  render(){
    const { list, featureDisabled, offlineMessage } = this.state
    
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
      <View className='mymessages-page'>
        <View className='status-bar' style={{height:`${this.state.statusBarHeight}px`}} />
        <View className='nav' style={{paddingTop:`${this.state.statusBarHeight}px`}}>
          <View onClick={()=>Taro.navigateBack()}><Text className='back'>‹</Text></View>
          <Text className='title'>我的消息</Text>
          <View />
        </View>
        <ScrollView scrollY style={{height:'100vh'}} onScrollToLower={()=>this.load()} lowerThreshold={120}>
          <View style={{height:`${this.state.statusBarHeight+88}px`}} />
          {(!list || list.length===0)? (
            <View className='empty'><Text className='hint'>暂无消息</Text></View>
          ) : (
            <View>
              {list.map((it:any)=> (
                <View key={it.id||it.created_at+Math.random()} style={{padding:'24rpx',borderBottom:'1rpx solid #eee',background:'#fff'}}>
                  <Text style={{display:'block',fontSize:'28rpx',color:'#111'}}>{it.description||'审核通知'}</Text>
                  <Text style={{display:'block',marginTop:'8rpx',fontSize:'24rpx',color:'#666'}}>{it.created_at}</Text>
                </View>
              ))}
              <View style={{height:'80rpx'}} />
            </View>
          )}
        </ScrollView>
      </View>
    )
  }
}


