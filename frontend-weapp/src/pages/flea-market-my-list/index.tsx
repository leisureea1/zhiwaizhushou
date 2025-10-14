import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text, Image, ScrollView } from '@tarojs/components'
import { apiService } from '../../services/api'
import './index.scss'

export default class MyListPage extends Component<any, any> {
  state = { list: [], loading: false, page: 1, hasMore: true, statusBarHeight: 44 }

  componentDidMount() {
    const win = Taro.getWindowInfo ? Taro.getWindowInfo() : (Taro as any).getSystemInfoSync?.()
    const statusBarHeight = win?.statusBarHeight ? Number(win.statusBarHeight) : 44
    this.setState({ statusBarHeight })
  }

  componentDidShow() { this.load(true) }

  load = async (refresh = false) => {
    if (this.state.loading) return
    this.setState({ loading: true })
    try {
      const userInfo = Taro.getStorageSync('userInfo') || {}
      const uid = userInfo.userId || userInfo.uid
      const page = refresh ? 1 : this.state.page
      const resp: any = await apiService.getFleaMarketList({ page, limit: 10, status: 'all', publisher_uid: uid })
      const arr = (resp?.data || resp?.list || []) as any[]
      const mapped = arr.map((it: any) => ({ id: String(it.id), title: it.title || '', price: it.price || 0, image: (Array.isArray(it.image_urls) ? it.image_urls[0] : (it.image_url || '')), status: it.status || 'pending' }))
      const list = refresh ? mapped : [...this.state.list as any[], ...mapped]
      this.setState({ list, page: page + 1, hasMore: arr.length >= 10 })
    } finally { this.setState({ loading: false }) }
  }

  onEdit = (id: string) => Taro.navigateTo({ url: `/pages/flea-market-publish/index?id=${id}` })
  onDelete = async (id: string) => {
    const userInfo = Taro.getStorageSync('userInfo') || {}
    const uid = userInfo.userId || userInfo.uid
    const confirm = await Taro.showModal({ title: '提示', content: '确定删除该商品？' })
    if (!confirm.confirm) return
    await apiService.deleteFleaMarketItem(id, String(uid))
    Taro.showToast({ title: '已删除', icon: 'success' })
    // 通知首页刷新
    Taro.setStorageSync('refresh_flea_market', Date.now())
    this.load(true)
  }

  render() {
    const { list } = this.state
    return (
      <View className='mylist-page'>
        <View className='status-bar' style={{ height: `${this.state.statusBarHeight}px` }} />
        <View className='nav' style={{ paddingTop: `${this.state.statusBarHeight}px` }}>
          <View className='left' onClick={() => Taro.navigateBack()}><Text className='back'>‹</Text></View>
          <Text className='title'>我的发布</Text>
          <View className='right' />
        </View>
        <ScrollView className='list' scrollY onScrollToLower={()=>this.load()} lowerThreshold={120}>
          <View className='list-inner'>
            {list.map((it: any) => (
              <View key={it.id} className='item'>
                <Image src={it.image} className='cover' mode='aspectFill' />
                <View className='meta'>
                  <Text className='title' numberOfLines={1}>{it.title}</Text>
                  <Text className='price'>¥{it.price}</Text>
                  <Text className={`status ${it.status}`}>{it.status==='approved'?'已上架':(it.status==='rejected'?'未通过':'待审核')}</Text>
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
    )
  }
}


