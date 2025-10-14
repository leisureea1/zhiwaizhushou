import Taro from '@tarojs/taro'
import { Component } from 'react'
import { View, Text, Picker, ScrollView } from '@tarojs/components'
import './index.scss'
import { FIXED_SCHEDULE, ROUTES, RouteKey, Trip } from './schedule.data'

const WEEK_DAYS = ['周一','周二','周三','周四','周五','周六','周日']
type Direction = RouteKey

function pad(n: number) { return n < 10 ? `0${n}` : `${n}` }
function nowStr() { const d = new Date(); return `${pad(d.getHours())}:${pad(d.getMinutes())}` }

function compareHHMM(a: string, b: string) {
  const [ah, am] = a.split(':').map(Number)
  const [bh, bm] = b.split(':').map(Number)
  if (ah !== bh) return ah - bh
  return am - bm
}

function toMs(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  const d = new Date()
  d.setHours(h, m, 0, 0)
  return d.getTime()
}

function toMinutes(hhmm: string) {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export default class CommutePage extends Component<any, any> {
  state = {
    statusBarHeight: 44,
    placeholderHeight: 44,
    dayIndex: new Date().getDay() === 0 ? 6 : new Date().getDay() - 1, // 0-6 -> 周一到周日
    direction: 'yt-ca' as Direction,
    now: nowStr(), // 当前时间 HH:MM
    nextTime: '',
    nextArrive: '',
    countdown: '',
  }

  timer: any = null

  componentDidMount() {
    const win = Taro.getWindowInfo ? Taro.getWindowInfo() : (Taro as any).getSystemInfoSync?.()
  const statusBarHeight = win?.statusBarHeight ? Number(win.statusBarHeight) : 44
  // 顶部占位尽量贴合系统状态栏，较之前略微增加下限，避免“过度压缩”的观感
  const placeholderHeight = Math.max(32, statusBarHeight)
  this.setState({ statusBarHeight, placeholderHeight })
    this.updateNext()
    this.timer = setInterval(() => this.tick(), 1000)
  }

  componentWillUnmount() {
    if (this.timer) clearInterval(this.timer)
  }

  tick = () => {
    const now = nowStr()
    this.setState({ now })
    this.updateNext()
  }

  getTodayTrips = (): Trip[] => {
    const { dayIndex, direction } = this.state
    const day = (dayIndex + 1) as 1|2|3|4|5|6|7
    const trips = FIXED_SCHEDULE[direction]?.[day] || []
    return trips.slice().sort((a, b) => compareHHMM(a.depart, b.depart))
  }

  updateNext = () => {
    const trips = this.getTodayTrips()
    const now = this.state.now
    const nextTrip = trips.find(t => compareHHMM(t.depart, now) > 0)
    const next = nextTrip?.depart || ''
    const nextArrive = nextTrip?.arrive || ''
    let countdown = ''
    if (next) {
      const diff = toMs(next) - Date.now()
      if (diff > 0) {
        const m = Math.floor(diff / 60000)
        const s = Math.floor((diff % 60000) / 1000)
        countdown = `${pad(m)}:${pad(s)}`
      } else countdown = '00:00'
    }
    this.setState({ nextTime: next, nextArrive, countdown })
  }

  onDayChange = (e: any) => {
    const index = Number(e.detail.value)
    this.setState({ dayIndex: index }, this.updateNext)
  }

  onSwitchDirection = (dir: Direction) => {
    this.setState({ direction: dir }, this.updateNext)
  }

  onBack = () => {
    const pages = Taro.getCurrentPages()
    if (pages && pages.length > 1) {
      Taro.navigateBack()
    } else {
      // 无历史栈时回到“应用”页
      Taro.switchTab({ url: '/pages/index/index' })
    }
  }

  render() {
    const { statusBarHeight, dayIndex, direction, now, nextTime, nextArrive, countdown } = this.state
    const trips = this.getTodayTrips()

    const groups = (() => {
      const morning: Trip[] = []
      const afternoon: Trip[] = []
      const evening: Trip[] = []
      trips.forEach(t => {
        const mins = toMinutes(t.depart)
        if (mins < 12 * 60) morning.push(t)
        else if (mins < 18 * 60) afternoon.push(t)
        else evening.push(t)
      })
      const res: Array<{ title: string; items: Trip[] }> = []
      if (morning.length) res.push({ title: '上午', items: morning })
      if (afternoon.length) res.push({ title: '下午', items: afternoon })
      if (evening.length) res.push({ title: '晚间', items: evening })
      return res
    })()

    return (
      <View className="commute-page">
  <View className="status-bar-placeholder" style={{ height: `${this.state.placeholderHeight}px` }}></View>

        {/* 头部 */}
        <View className="page-header">
          <View className="back-btn" onClick={this.onBack}>
            <Text className="back-icon">‹</Text>
            <Text className="back-text">返回</Text>
          </View>
          <Text className="page-title">通勤车</Text>
          <View className="right-placeholder" />
        </View>

        {/* 选择栏 */}
        <View className="toolbar">
          <Picker mode="selector" range={WEEK_DAYS} value={dayIndex} onChange={this.onDayChange}>
            <View className="day-picker">
              <Text className="picker-label">日期</Text>
              <Text className="picker-value">{WEEK_DAYS[dayIndex]}</Text>
            </View>
          </Picker>

          <ScrollView scrollX className="direction-scroll" enableFlex>
            <View className="direction-switch">
              {ROUTES.map(r => (
                <View key={r.key} className={`dir-btn ${direction===r.key?'active':''}`} onClick={() => this.onSwitchDirection(r.key)}>
                  <Text>{r.label}</Text>
                </View>
              ))}
            </View>
          </ScrollView>
        </View>

        {/* 下一班车 */}
        <View className="next-box">
          <Text className="now-time">当前时间 {now}</Text>
          {nextTime ? (
            <>
              <Text className="next-title">下一班车</Text>
              <View className="next-times">
                <Text className="label">始发</Text>
                <Text className="next-time">{nextTime}</Text>
                <Text className="sep">—</Text>
                <Text className="label">到达</Text>
                <Text className="next-time next-arrive">{nextArrive}</Text>
              </View>
              <Text className="countdown">发车倒计时 {countdown}</Text>
            </>
          ) : (
            <Text className="no-next">今天已无班次</Text>
          )}
        </View>

        {/* 全部班次 */}
        <View className="list">
          {groups.map(group => (
            <View key={group.title} className="section">
              <View className="section-title">{group.title}</View>
              {group.items.map(trip => (
                <View key={`${group.title}-${trip.depart}-${trip.arrive}`} className="item">
                  <View className="row">
                    <Text className="label">始发</Text>
                    <Text className="t">{trip.depart}</Text>
                    <Text className="sep">—</Text>
                    <Text className="label">到达</Text>
                    <Text className="t t-arrive">{trip.arrive}</Text>
                  </View>
                </View>
              ))}
            </View>
          ))}
          {!groups.length && (
            <View className="empty">
              <Text className="empty-text">今天暂无班次</Text>
            </View>
          )}
        </View>
      </View>
    )
  }
}
