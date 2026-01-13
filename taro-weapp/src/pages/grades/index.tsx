import { View, Text, ScrollView } from '@tarojs/components'
import './index.scss'

const GRADES = [
  { title: '高等数学 (上)', type: '必修', credit: '5.0', score: '95', gpa: '4.0', color: 'blue', icon: 'icon-math' },
  { title: '大学英语 III', type: '必修', credit: '3.0', score: '92', gpa: '4.0', color: 'pink', icon: 'icon-translate' },
  { title: 'C语言程序设计', type: '专选', credit: '4.0', score: '98', gpa: '4.0', color: 'purple', icon: 'icon-code' },
  { title: '中国近代史纲要', type: '通识', credit: '2.0', score: '88', gpa: '3.7', color: 'orange', icon: 'icon-history' },
  { title: '大学体育 I', type: '必修', credit: '1.0', score: 'A', gpa: '4.0', color: 'green', icon: 'icon-sports' },
  { title: '大学物理 (下)', type: '必修', credit: '4.0', score: '91', gpa: '4.0', color: 'blue', icon: 'icon-science' }
]

export default function Grades() {
  return (
    <View className='grades-page'>
      <ScrollView className='main-content' scrollY>
        {/* GPA Card */}
        <View className='gpa-card'>
          <View className='gpa-bg-circle top' />
          <View className='gpa-bg-circle bottom' />
          <View className='gpa-content'>
            <View className='gpa-item'>
              <Text className='gpa-label'>平均绩点 (GPA)</Text>
              <Text className='gpa-value'>3.86</Text>
            </View>
            <View className='gpa-divider' />
            <View className='gpa-item'>
              <Text className='gpa-label'>平均分</Text>
              <Text className='gpa-value'>91.5</Text>
            </View>
          </View>
        </View>

        {/* Term Selector */}
        <ScrollView className='term-selector' scrollX>
          <View className='term-btn active'>2023-2024 秋</View>
          <View className='term-btn inactive'>2023-2024 春</View>
          <View className='term-btn inactive'>2022-2023 秋</View>
        </ScrollView>

        {/* Grades List */}
        <View className='grades-list'>
          {GRADES.map((grade, idx) => (
            <View key={idx} className='grade-card'>
              <View className={`grade-left-bar ${grade.color}`} />
              <View className='grade-info'>
                <View className={`grade-icon ${grade.color}`}>
                  <Text className={`iconfont ${grade.icon}`} />
                </View>
                <View className='grade-details'>
                  <Text className='grade-title'>{grade.title}</Text>
                  <View className='grade-meta'>
                    <Text className='grade-type'>{grade.type}</Text>
                    <Text className='grade-credit'>{grade.credit} 学分</Text>
                  </View>
                </View>
              </View>
              <View className='grade-score'>
                <Text className={`score-value ${grade.color}`}>{grade.score}</Text>
                <Text className='score-gpa'>{grade.gpa}</Text>
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  )
}
