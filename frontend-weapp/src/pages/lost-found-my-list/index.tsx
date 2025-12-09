import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { apiService } from '../../services/api'
import './index.scss'

export default class LostFoundMyListPage extends Component<any, any> {
  state = { list: [], loading: false, page: 1, hasMore: true, statusBarHeight: 44, featureDisabled: false, offlineMessage: '' }
  componentDidMount(){ 
    const w=(Taro as any).getWindowInfo?.()||(Taro as any).getSystemInfoSync?.()
    this.setState({ statusBarHeight: Number(w?.statusBarHeight||44)})
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
  componentDidShow(){ this.load(true) }
  load = async (refresh=false) => {
    if(this.state.loading) return
    this.setState({loading:true})
    try{
      const userInfo = Taro.getStorageSync('userInfo')||{}
      const uid = userInfo.userId || userInfo.uid
      const page = refresh?1:this.state.page
      const resp:any = await apiService.getLostFoundList({ page, limit: 10, publisher_uid: uid })
      const arr = (resp?.data||[]) as any[]
      const mapped = arr.map((it:any)=>({ id:String(it.id), title: it.title||it.description||'', image: (Array.isArray(it.image_urls)? it.image_urls[0] : (it.image_url||'')), status: it.status||'open' }))
      const list = refresh? mapped : [...(this.state.list as any[]), ...mapped]
      this.setState({ list, page: page+1, hasMore: arr.length>=10 })
    } finally { this.setState({loading:false}) }
  }
  onEdit = (id:string)=> Taro.navigateTo({ url: `/pages/lost-found-publish/index?id=${id}` })
  onDelete = async (id:string) => {
    const userInfo = Taro.getStorageSync('userInfo')||{}
    const uid = userInfo.userId || userInfo.uid
    const confirm = await Taro.showModal({ title:'提示', content:'确定删除该信息？'})
    if(!confirm.confirm) return
    await apiService.deleteLostFoundItem(id, uid)
    Taro.showToast({ title:'已删除', icon:'success'})
    Taro.setStorageSync('refresh_lost_found', Date.now())
    this.load(true)
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
    <View className='lf-mylist-page'>
      <View className='status-bar' style={{height:`${this.state.statusBarHeight}px`}} />
      <View className='nav' style={{paddingTop:`${this.state.statusBarHeight}px`}}>
        <View className='left' onClick={()=>Taro.navigateBack()}><Text className='back'>‹</Text></View>
        <Text className='title'>我的发布</Text>
        <View className='right' />
      </View>
      <ScrollView className='list' scrollY onScrollToLower={()=>this.load()} lowerThreshold={120}>
        <View className='list-inner'>
          {list.map((it:any)=> (
            <View key={it.id} className='item'>
              <Image src={it.image} className='cover' mode='aspectFill' />
              <View className='meta'>
                <Text className='title' numberOfLines={1}>{it.title}</Text>
                <Text className={`status ${it.status}`}>{it.status==='found'?'招领':(it.status==='lost'?'寻物':'')}</Text>
              </View>
              <View className='ops'>
                <View className='btn edit' onClick={()=>this.onEdit(it.id)}><Text>编辑</Text></View>
                <View className='btn del' onClick={()=>this.onDelete(it.id)}><Text>删除</Text></View>
              </View>
            </View>
          ))}
          <View className='bottom-space' />
        </View>
      </ScrollView>
    </View>
  )}
}
