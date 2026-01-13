import { View, Text, ScrollView } from '@tarojs/components'
import './index.scss'

const EXAMS = [
  { daysLeft: 3, title: '概率论与数理统计', code: 'MATH2003', type: '必修', time: '09:00 - 11:00', date: '1月10日 周三', location: '教二 JA101', color: 'red' },
  { daysLeft: 5, title: '大学英语 (IV)', code: 'ENG1004', type: '必修', time: '14:00 - 16:00', date: '1月12日 周五', location: '公共楼 A204', color: 'orange' },
  { daysLeft: 8, title: '计算机网络原理', code: 'CS3002', type: '选修', time: '09:00 - 11:30', date: '1月15日 周一', location: '信工楼 305', color: 'blue' },
  { daysLeft: 12, title: '宏观经济学', code: 'ECON2001', type: '必修', time: '14:30 - 16:30', date: '1月19日 周五', location: '文科楼 B102', color: 'blue' }
]

export default function Exams() {
  return (
    <View className='exams-page'>
      <ScrollView className='main-content' scrollY>
        {EXAMS.map((exam, idx) => (
          <View key={idx} className='exam-card'>
            <View className={`days-badge ${exam.color}`}>
              <Text>剩余 {exam.daysLeft} 天</Text>
            </View>
            <View className='exam-header'>
              <Text className='exam-title'>{exam.title}</Text>
              <Text className='exam-code'>{exam.code} · {exam.type}</Text>
            </View>
            <View className='exam-details'>
              <View className='detail-item'>
                <Text className='detail-label'>考试时间</Text>
                <View className='detail-value'>
                  <Text className='iconfont icon-time' />
                  <Text>{exam.time}</Text>
                </View>
                <Text className='detail-sub'>{exam.date}</Text>
              </View>
              <View className='detail-item'>
                <Text className='detail-label'>考试地点</Text>
                <View className='detail-value'>
                  <Text className='iconfont icon-location' />
                  <Text>{exam.location}</Text>
                </View>
              </View>
            </View>
          </View>
        ))}
        <Text className='empty-text'>没有更多考试了</Text>
      </ScrollView>
    </View>
  )
}
