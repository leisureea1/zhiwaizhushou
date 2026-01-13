import { View, Text, ScrollView } from '@tarojs/components'
import './index.scss'

const DAYS = [
  { day: '周一', date: '9/8' },
  { day: '周二', date: '9/9' },
  { day: '周三', date: '9/10' },
  { day: '周四', date: '9/11' },
  { day: '周五', date: '9/12' },
  { day: '周六', date: '9/13' },
  { day: '周日', date: '9/14' }
]

const TIME_SLOTS_MORNING = [
  { num: 1, time: '8:00\n8:50' },
  { num: 2, time: '9:00\n9:50' },
  { num: 3, time: '10:10\n11:00' },
  { num: 4, time: '11:10\n12:00' }
]

const TIME_SLOTS_AFTERNOON = [
  { num: 6, time: '14:00\n14:50' },
  { num: 7, time: '15:00\n15:50' },
  { num: 8, time: '16:10\n17:00' },
  { num: 9, time: '17:10\n18:00' }
]

const TIME_SLOTS_EVENING = [
  { num: 11, time: '19:10\n20:00' },
  { num: 12, time: '20:10\n21:00' }
]

// 课程数据：row 表示在当前时段的第几行（从0开始）
const COURSES_MORNING = [
  { day: 0, row: 0, span: 2, title: '实践俄语 III', teacher: '李小彤', location: 'JB107', color: 'sky' },
  { day: 2, row: 0, span: 2, title: '俄语语法 I', teacher: '刘珏', location: 'JB107', color: 'pink' },
  { day: 3, row: 0, span: 2, title: '实践俄语 III', teacher: '李小彤', location: 'JB107', color: 'amber' },
  { day: 0, row: 2, span: 2, title: '俄语语法 I', teacher: '刘珏', location: 'JB107', color: 'pink' },
  { day: 2, row: 2, span: 2, title: '实践俄语 III', teacher: '李小彤', location: 'JB107', color: 'sky' }
]

const COURSES_AFTERNOON = [
  { day: 1, row: 0, span: 2, title: '国际法学', teacher: '王阳', location: 'JB107', color: 'indigo' },
  { day: 2, row: 0, span: 2, title: '民事诉讼法学', teacher: '张妮', location: 'JB107', color: 'yellow' }
]

const COURSES_EVENING = [
  { day: 2, row: 0, span: 2, title: '毛泽东思想和中国特色社会主义理论体系概论', teacher: '梁东亮', location: 'JA410', color: 'emerald' }
]

export default function Home() {
  const renderCourseGrid = (slots: typeof TIME_SLOTS_MORNING, courses: typeof COURSES_MORNING) => (
    <View className='schedule-section'>
      {slots.map((slot, slotIdx) => (
        <View key={slotIdx} className='schedule-row'>
          <View className='time-cell'>
            <Text className='slot-num'>{slot.num}</Text>
            <Text className='slot-time'>{slot.time}</Text>
          </View>
          {DAYS.map((_, dayIdx) => {
            const course = courses.find(c => c.day === dayIdx && c.row === slotIdx)
            if (course) {
              return (
                <View key={dayIdx} className='day-cell'>
                  <View className={`course-card ${course.color}`} style={{ height: `${course.span * 120 - 8}rpx` }}>
                    <Text className='course-title'>{course.title}</Text>
                    <Text className='course-info'>{course.teacher}</Text>
                    <Text className='course-info'>{course.location}</Text>
                  </View>
                </View>
              )
            }
            // 检查是否被上面的课程占用
            const occupiedBy = courses.find(c => c.day === dayIdx && c.row < slotIdx && c.row + c.span > slotIdx)
            if (occupiedBy) {
              return <View key={dayIdx} className='day-cell occupied' />
            }
            return <View key={dayIdx} className='day-cell' />
          })}
        </View>
      ))}
    </View>
  )

  return (
    <View className='home-page'>
      {/* Header */}
      <View className='header'>
        <View className='header-top'>
          <View className='menu-btn'>
            <Text>☰</Text>
          </View>
          <View className='week-info'>
            <View className='week-title'>
              <Text className='week-text'>第2周</Text>
              <Text className='arrow'>▼</Text>
            </View>
            <Text className='week-subtitle'>当前第-33周</Text>
          </View>
          <View className='refresh-btn'>
            <Text>↻</Text>
            <Text className='refresh-text'>刷新</Text>
          </View>
        </View>

        {/* 日期头 */}
        <View className='date-header'>
          <View className='time-col' />
          {DAYS.map((item, idx) => (
            <View key={idx} className='day-col'>
              <Text className='day-name'>{item.day}</Text>
              <Text className='day-date'>{item.date}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* 课程表 */}
      <ScrollView className='schedule-container' scrollY>
        {/* 上午 */}
        {renderCourseGrid(TIME_SLOTS_MORNING, COURSES_MORNING)}

        {/* 午休 */}
        <View className='break-row'>
          <View className='break-label'>
            <Text>午休</Text>
          </View>
          <View className='break-content'>
            <Text>☀️ 午休 12:00-14:00</Text>
          </View>
        </View>

        {/* 下午 */}
        {renderCourseGrid(TIME_SLOTS_AFTERNOON, COURSES_AFTERNOON)}

        {/* 晚休 */}
        <View className='break-row'>
          <View className='break-label'>
            <Text>晚休</Text>
          </View>
          <View className='break-content'>
            <Text>🌙 晚休 18:00-19:10</Text>
          </View>
        </View>

        {/* 晚上 */}
        {renderCourseGrid(TIME_SLOTS_EVENING, COURSES_EVENING)}
      </ScrollView>
    </View>
  )
}
