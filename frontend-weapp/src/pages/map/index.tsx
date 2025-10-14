import { Component } from 'react'
import { View, Map, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'
import { CAMPUS_MARKERS } from './markers'

// 校区中心点
type CampusKey = 'changan' | 'yanta'
const CAMPUS_CENTERS: Record<CampusKey, { latitude: number; longitude: number; label: string }> = {
  changan: { latitude: 34.136600, longitude: 108.875451, label: '长安校区' },
  yanta: { latitude: 34.206984, longitude: 108.950317, label: '雁塔校区' }
}

type Marker = {
  id: number
  latitude: number
  longitude: number
  title?: string
  callout?: any
  iconPath?: string
}

export default class CampusMapPage extends Component<any, any> {
  state = {
    campus: 'changan' as CampusKey,
    center: CAMPUS_CENTERS.changan,
    scale: 16,
    markers: CAMPUS_MARKERS.changan,
    showLocation: false,
    picking: false
  }

  switchCampus = (key: CampusKey) => {
    const center = CAMPUS_CENTERS[key]
    const markers = CAMPUS_MARKERS[key]
    this.setState({ campus: key, center, scale: 16, markers })
  }

  backToCenter = () => {
    const center = CAMPUS_CENTERS[this.state.campus]
    this.setState({ center, scale: 16 }, () => {
      try {
        // 直接使用组件 API 移动到指定坐标
        const ctx = Taro.createMapContext('campusMap')
        // 小程序 moveToLocation 只支持移动到当前 showLocation 或指定坐标（部分平台差异）
        // 这里尝试调用，同时我们已更新状态，组件会渲染到新 center
        ctx.moveToLocation({ latitude: center.latitude, longitude: center.longitude })
      } catch (e) {
        // 忽略异常，由 state 更新保证中心点
      }
    })
  }

  locateMe = async () => {
    try {
      // 主动触发授权弹窗（需在 app.config 声明 permission 与 requiredPrivateInfos）
      await Taro.authorize({ scope: 'scope.userLocation' })
      const res = await Taro.getLocation({ type: 'gcj02', isHighAccuracy: true })
      this.setState({ center: { latitude: res.latitude, longitude: res.longitude, label: '我的位置' }, showLocation: true, scale: 17 })
    } catch (e) {
      // 引导用户前往设置打开定位权限
      Taro.showModal({
        title: '需要定位权限',
        content: '请在设置中开启“地理位置”权限，以便显示当前位置。',
        confirmText: '去设置',
        cancelText: '取消',
        success: (r) => {
          if (r.confirm) {
            Taro.openSetting({})
          }
        }
      })
    }
  }

  goBack = () => {
    try {
      const pages = (Taro as any).getCurrentPages ? (Taro as any).getCurrentPages() : []
      if (pages && pages.length > 1) {
        Taro.navigateBack({ delta: 1 })
      } else {
        // 若无历史栈，回到首页 Tab（课程表）
        Taro.switchTab({ url: '/pages/schedule/index' })
      }
    } catch (_) {
      // 兜底：直接回首页 Tab
      Taro.switchTab({ url: '/pages/schedule/index' })
    }
  }

  onMarkerTap = (e: any) => {
    const id = e?.detail?.markerId
    const m = this.state.markers.find((x: Marker) => x.id === id)
    if (m) Taro.showToast({ title: m.title || '标注', icon: 'none' })
  }

  onTapMap = async (e: any) => {
    // 采点模式下点击复制坐标
    if (!this.state.picking) return
    const { latitude, longitude } = e?.detail || {}
    if (latitude && longitude) {
      const text = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      try {
        await Taro.setClipboardData({ data: text })
        Taro.showToast({ title: `已复制坐标\n${text}`, icon: 'none', duration: 2000 })
      } catch (_) {
        Taro.showToast({ title: text, icon: 'none' })
      }
    }
  }

  onPoiTap = async (e: any) => {
    // 点击内置 POI，复制名称与坐标
    const name = e?.detail?.name
    const latitude = e?.detail?.latitude
    const longitude = e?.detail?.longitude
    if (latitude && longitude) {
      const text = `${name || 'POI'}, ${latitude.toFixed(6)}, ${longitude.toFixed(6)}`
      try {
        await Taro.setClipboardData({ data: text })
        Taro.showToast({ title: `已复制\n${text}`, icon: 'none', duration: 2000 })
      } catch (_) {
        Taro.showToast({ title: text, icon: 'none' })
      }
    }
  }

  render() {
    const { center, scale, markers, showLocation, campus } = this.state
    return (
      <View className="map-page">
        <View className="map-toolbar">
          <View className="segmented">
            <View className={`seg-btn ${campus==='changan'?'active':''}`} onClick={() => this.switchCampus('changan')}>
              <Text>长安</Text>
            </View>
            <View className={`seg-btn ${campus==='yanta'?'active':''}`} onClick={() => this.switchCampus('yanta')}>
              <Text>雁塔</Text>
            </View>
          </View>
          <View className="actions">
            <View className="act-btn" onClick={this.backToCenter}><Text>回到中心</Text></View>
            <View className="act-btn" onClick={this.locateMe}><Text>定位自己</Text></View>
            <View className="act-btn" onClick={this.goBack}><Text>返回主页</Text></View>
          </View>
        </View>
        <Map
          className="map"
          id="campusMap"
          latitude={center.latitude}
          longitude={center.longitude}
          scale={scale}
          enableZoom
          enableScroll
          enableRotate={false}
          showLocation={showLocation}
          markers={markers as any}
          onTap={this.onTapMap}
          onUpdated={() => {}}
          onRegionChange={() => {}}
          onMarkerTap={this.onMarkerTap}
          onCalloutTap={this.onMarkerTap}
          onPoiTap={this.onPoiTap}
          onError={() => {}}
        />
      </View>
    )
  }
}
