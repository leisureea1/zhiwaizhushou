import { View, Text, ScrollView } from '@tarojs/components'
import './index.scss'

const BUS_SCHEDULE = [
  { time: '15:00', arrive: '15:45', status: '有位', statusColor: 'green' },
  { time: '15:30', arrive: '16:15', status: '有位', statusColor: 'green' },
  { time: '16:00', arrive: '16:45', status: '紧俏', statusColor: 'orange' },
  { time: '16:30', arrive: '17:15', status: '已满', statusColor: 'red' },
  { time: '17:00', arrive: '17:45', status: '有位', statusColor: 'green' }
]

export default function Bus() {
  return (
    <View className='bus-page'>
      <ScrollView className='main-content' scrollY>
        {/* Tab Selector */}
        <View className='tab-selector'>
          <View className='tab-btn active'>
            <Text className='iconfont icon-location' />
            <Text>前往A校区</Text>
          </View>
          <View className='tab-btn'>
            <Text className='iconfont icon-near' />
            <Text>前往B校区</Text>
          </View>
        </View>

        {/* Hero Card */}
        <View className='hero-card'>
          <View className='hero-bg top' />
          <View className='hero-bg bottom' />
          <View className='hero-content'>
            <View className='hero-left'>
              <View className='next-badge'>
                <View className='pulse-dot' />
                <Text>最近班次 (Next)</Text>
              </View>
              <View className='time-display'>
                <Text className='time-value'>14:30</Text>
                <Text className='time-label'>发车</Text>
              </View>
            </View>
            <View className='hero-right'>
              <Text className='countdown-value'>12<Text className='countdown-unit'>min</Text></Text>
              <Text className='countdown-label'>倒计时</Text>
            </View>
          </View>
          <View className='bus-info'>
            <View className='bus-icon'>
              <Text className='iconfont icon-bus' />
            </View>
            <View className='bus-details'>
              <Text className='bus-name'>校区专线 (A ⇄ B)</Text>
              <Text className='bus-eta'>预计 15:15 到达 · 耗时 45min</Text>
            </View>
            <View className='seat-info'>
              <Text className='seat-badge'>有位</Text>
              <Text className='seat-count'>剩余 18 座</Text>
            </View>
          </View>
        </View>

        {/* Schedule List */}
        <View className='schedule-section'>
          <View className='section-header'>
            <Text className='iconfont icon-time' />
            <Text className='section-title'>今日班次计划</Text>
            <Text className='section-count'>共 12 个班次</Text>
          </View>
          <View className='schedule-list'>
            {BUS_SCHEDULE.map((item, idx) => (
              <View key={idx} className={`schedule-item ${item.statusColor === 'red' ? 'disabled' : ''}`}>
                <View className='schedule-left'>
                  <Text className='schedule-time'>{item.time}</Text>
                  <View className='schedule-divider' />
                  <View className='schedule-arrive'>
                    <Text className='arrive-label'>预计到达</Text>
                    <Text className='arrive-time'>{item.arrive}</Text>
                  </View>
                </View>
                <View className='schedule-right'>
                  <Text className={`status-badge ${item.statusColor}`}>{item.status}</Text>
                  <Text className='iconfont icon-arrow-right' />
                </View>
              </View>
            ))}
          </View>
          <Text className='schedule-note'>班次仅供参考，请提前5分钟到达上车点</Text>
        </View>
      </ScrollView>
    </View>
  )
}
