import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { DateUtil } from '../../utils/date'
import { apiService } from '../../services/api'
import './index.scss'
import AppIcon from '../../components/AppIcon/index'

interface Course {
  name: string
  teacher: string
  location: string
  weeks: number[]  // 周次数组，如 [2,3,4,5,6,7,8,9,10,11,13,14,15,16,17,18,19]
  dayOfWeek: number  // 1-7 (周一到周日)
  startSection: number  // 开始节次
  endSection: number    // 结束节次
}

export default class SchedulePage extends Component {

  state = {
    // 动态获取当前周的日期
    weekDays: [] as Array<{ key: string; label: string; date: string; isActive: boolean }>,
    currentWeekNumber: 1,
    selectedWeekNumber: 1, // 用户选择的周数
    currentDateText: '',
    isVacation: false,
    vacationGreeting: '',
    showWeekPicker: false, // 是否显示周数选择器
    loading: false,
    courses: [] as Course[],  // 课程数据
    
    timeSlots: [
      { period: "1", time: "8:00-8:50" },
      { period: "2", time: "9:00-9:50" },
      { period: "3", time: "10:10-11:00" },
      { period: "4", time: "11:10-12:00" },
      { period: "午休", time: "12:00-14:00" },
      { period: "6", time: "14:00-14:50" },
      { period: "7", time: "15:00-15:50" },
      { period: "8", time: "16:10-17:00" },
      { period: "9", time: "17:10-18:00" },
      { period: "晚休", time: "18:00-19:10" },
      { period: "11", time: "19:10-20:00" },
      { period: "12", time: "20:10-21:00" }
    ]
  }

  // 固定的柔和色卡（按用户提供方案）
  getColorPalette = (): string[] => [
    // 低饱和度（S≈10-25%）、高亮度（L≈90-97%）的浅色系
    '#F3FBF3', '#ECF9EC', // very light mint
    '#F5EFFC', '#F8F2FF', // very light lavender
    '#EEF7FF', '#F3FAFF', // very light sky
    '#FDEFF0', '#FFF6F7', // very light rose
    '#FFF9DE', '#FFFBEA', // very light lemon
    '#FFF2E8', '#FFF6EF', // very light peach
    '#F7F2E6', '#FAF6EE'  // very light sand
  ]

  // 时间槽总数（用于百分比计算）
  totalTimeSlots = 12

  componentDidMount() {
    // 动态加载当前周的日期
    this.loadCurrentWeekDates()
    // 加载课程表
    this.loadCourseSchedule()
  }

  componentDidShow() {
    // 每次页面显示时重新加载课程表（用户登录后返回会触发）
    this.loadCourseSchedule()
  }

  loadCurrentWeekDates = () => {
    const weekDates = DateUtil.getCurrentWeekDates()
    const today = new Date()
    const semesterStart = DateUtil.getCurrentSemesterStart()
    const weekNumber = DateUtil.getWeekNumber(semesterStart, today)
    const isVacation = DateUtil.isInVacation(today)
    const vacationGreeting = DateUtil.getVacationGreeting(today)
    
    const keyMap = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    
    const weekDays = weekDates.map((item, index) => ({
      key: keyMap[index],
      label: item.dayName,
      date: item.dateText.replace(/^0/, '').replace(/\/0/, '/'), // 去掉前导0，如 09/29 -> 9/29
      isActive: DateUtil.isToday(item.date)
    }))

    // 获取今天的完整日期文本
    const currentDateText = DateUtil.format(today, 'YYYY年MM月DD日') + `(${weekDays.find(d => d.isActive)?.label || '周一'})`

    this.setState({
      weekDays,
      currentWeekNumber: weekNumber,
      selectedWeekNumber: weekNumber, // 初始选中当前周
      currentDateText,
      isVacation,
      vacationGreeting
    })
  }

  // 获取课程缓存Key
  getScheduleCacheKey = (userInfo: any): string => {
    const token = Taro.getStorageSync('userToken')
    const uid = userInfo?.userId || userInfo?.user_id || token || 'guest'
    return `schedule_cache_${uid}`
  }

  // 获取今天（北京时区）日期字符串
  getTodayStr = (): string => {
    const now = new Date()
    // 使用DateUtil确保北京时间
    return DateUtil.format(now, 'YYYY-MM-DD')
  }

  // 加载课程表（支持缓存与强制刷新）
  // 返回状态：ok | not_logged_in | failed
  loadCourseSchedule = async (forceRefresh: boolean = false): Promise<'ok' | 'not_logged_in' | 'failed'> => {
    try {
      // 检查小程序登录状态（以 userToken 为准）
      const userInfo = Taro.getStorageSync('userInfo')
      const userToken = Taro.getStorageSync('userToken')
      if (!userToken) {
        console.log('小程序未登录，跳过加载课程表')
        return 'not_logged_in'
      }
      const cacheKey = this.getScheduleCacheKey(userInfo)
      const today = this.getTodayStr()
      const cached = Taro.getStorageSync(cacheKey)

      // 优先使用“当天缓存”，除非forceRefresh
      if (!forceRefresh && cached && cached.date === today && Array.isArray(cached.courses)) {
        this.setState({ courses: cached.courses })
        return 'ok'
      }

      this.setState({ loading: true })

      let courses: Course[] | null = null
      try {
        // 从 userInfo 中取到教务用户名/密码用于后端调用
        const response = await apiService.getCourseSchedule() as any
        if (response && response.courses) {
          courses = this.mapCoursesFromBackend(response.courses)
        }
      } catch (e) {
        console.error('请求课程失败，尝试使用历史缓存', e)
        // 请求失败时使用任意历史缓存兜底
        if (cached && Array.isArray(cached.courses)) {
          courses = cached.courses
        }
      }

      if (courses) {
        this.setState({ courses })
        // 覆盖缓存（每日一次）
        Taro.setStorageSync(cacheKey, { date: today, courses })
        return 'ok'
      }
    } catch (error) {
      console.error('加载课程表失败:', error)
      Taro.showToast({
        title: '加载课程表失败',
        icon: 'none'
      })
      return 'failed'
    } finally {
      this.setState({ loading: false })
    }
    return 'failed'
  }

  // 映射后端课程数据到前端格式
  mapCoursesFromBackend = (backendCourses: any[]): Course[] => {
    const courses: Course[] = []
    
    // 星期映射
    const weekdayMap: { [key: string]: number } = {
      '星期一': 1, '星期二': 2, '星期三': 3, '星期四': 4,
      '星期五': 5, '星期六': 6, '星期日': 7
    }
    
    // 后端节次(1-12)到前端实际节次的映射
    // 后端: 1,2,3,4,5(午休),6,7,8,9,10(晚休),11,12
    // 前端: 1,2,3,4,午休,6,7,8,9,晚休,11,12
    const backendToFrontendPeriod = (backendPeriod: number): number | null => {
      if (backendPeriod <= 4) return backendPeriod  // 1-4节 不变
      if (backendPeriod === 5) return null  // 第5节是午休，不作为课程显示
      if (backendPeriod >= 6 && backendPeriod <= 9) return backendPeriod  // 6-9节 不变
      if (backendPeriod === 10) return null  // 第10节是晚休，不作为课程显示
      if (backendPeriod >= 11 && backendPeriod <= 12) return backendPeriod  // 11-12节 不变
      return null
    }
    
    backendCourses.forEach(item => {
      if (!item.time_slots || !Array.isArray(item.time_slots)) return
      if (!item.weeks || !Array.isArray(item.weeks)) return
      
      // 按星期和节次分组
      const groupedByDay: { [key: number]: number[] } = {}
      
      item.time_slots.forEach((slot: any) => {
        const dayOfWeek = weekdayMap[slot.weekday] || 1
        // 将后端的period(1-12)映射到前端实际节次(1,2,3,4,6,7,8,9,11,12)
        const frontendPeriod = backendToFrontendPeriod(slot.period || 1)
        
        // 跳过午休和晚休（返回null的情况）
        if (frontendPeriod === null) return
        
        if (!groupedByDay[dayOfWeek]) {
          groupedByDay[dayOfWeek] = []
        }
        groupedByDay[dayOfWeek].push(frontendPeriod)
      })
      
      // 为每个星期创建课程条目
      Object.entries(groupedByDay).forEach(([day, periods]) => {
        periods.sort((a, b) => a - b)
        
        courses.push({
          name: item.course_name || '',
          teacher: item.teacher_name || '',
          location: item.classroom || '',
          weeks: item.weeks,  // 保存周次数组 [2,3,4,5,...]
          dayOfWeek: Number(day),
          startSection: Math.min(...periods),
          endSection: Math.max(...periods)
        })
      })
    })
    
    console.log('映射后的课程数据:', courses)
    
    return courses
  }

  // 获取指定星期和节次的课程（根据选中的周次过滤）
  getCourseAtPosition = (dayOfWeek: number, section: number): Course | null => {
    const { courses, selectedWeekNumber } = this.state
    
    return courses.find(course => {
      // 检查星期是否匹配
      if (course.dayOfWeek !== dayOfWeek) return false
      
      // 检查节次是否在范围内
      if (section < course.startSection || section > course.endSection) return false
      
      // 检查周次是否匹配：当前选择的周数是否在课程的weeks数组中
      if (!course.weeks || !Array.isArray(course.weeks)) return false
      if (!course.weeks.includes(selectedWeekNumber)) return false
      
      return true
    }) || null
  }

  // 检查当前位置是否是课程的开始节次
  isCourseStart = (dayOfWeek: number, section: number): boolean => {
    const course = this.getCourseAtPosition(dayOfWeek, section)
    return course ? course.startSection === section : false
  }

  // 将时间槽数组索引转换为实际节次编号
  getActualSectionNumber = (index: number): number | null => {
    const { timeSlots } = this.state
    const slot = timeSlots[index]
    
    // 如果是休息时间，返回null
    if (slot.period === "午休" || slot.period === "晚休") {
      return null
    }
    
    // 否则返回节次编号
    return parseInt(slot.period)
  }

  // 计算节次对应的时间槽索引（用于绝对定位）
  getSectionIndex = (section: number): number => {
    const { timeSlots } = this.state
    return timeSlots.findIndex(slot => slot.period === section.toString())
  }

  // 获取某一天、当前选中周的所有课程
  getCoursesForDay = (dayOfWeek: number): Course[] => {
    const { courses, selectedWeekNumber } = this.state
    return courses.filter(course => {
      if (course.dayOfWeek !== dayOfWeek) return false
      if (!course.weeks || !Array.isArray(course.weeks)) return false
      return course.weeks.includes(selectedWeekNumber)
    })
  }

  // 颜色索引：基于课程+星期+节次
  getCourseColorIndex = (course: Course, dayIndex: number): number => {
    const colors = this.getColorPalette()
    const key = `${course.name}|${course.location}|${course.teacher}`
    const baseHash = key.split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
    return (baseHash + dayIndex + course.startSection) % colors.length
  }

  // 获取课程颜色（使用固定色卡）
  getCourseColor = (course: Course, dayIndex: number): string => {
    const colors = this.getColorPalette()
    return colors[this.getCourseColorIndex(course, dayIndex)]
  }

  // 加载指定周的日期
  loadWeekDates = (weekNumber: number) => {
    const semesterStart = DateUtil.getCurrentSemesterStart()
    const today = new Date()
    
    // 计算该周的周一日期
    const targetMonday = new Date(semesterStart)
    targetMonday.setDate(semesterStart.getDate() + (weekNumber - 1) * 7)
    
    const keyMap = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
    const weekDays = []
    
    for (let i = 0; i < 7; i++) {
      const date = new Date(targetMonday)
      date.setDate(targetMonday.getDate() + i)
      
      const dateText = DateUtil.format(date, 'MM/DD').replace(/^0/, '').replace(/\/0/, '/')
      
      weekDays.push({
        key: keyMap[i],
        label: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'][i],
        date: dateText,
        isActive: DateUtil.isToday(date)
      })
    }

    const isVacation = weekNumber < 1 || weekNumber > 18
    const vacationGreeting = DateUtil.getVacationGreeting(targetMonday)

    this.setState({
      weekDays,
      selectedWeekNumber: weekNumber,
      isVacation,
      vacationGreeting
    })
  }

  // 切换周数选择器
  toggleWeekPicker = () => {
    if (this.state.isVacation) {
      Taro.showToast({
        title: '假期中无法切换周数',
        icon: 'none'
      })
      return
    }
    this.setState({ showWeekPicker: !this.state.showWeekPicker })
  }

  // 选择周数
  selectWeek = (weekNumber: number) => {
    this.loadWeekDates(weekNumber)
    this.setState({ showWeekPicker: false })
  }

  // 回到本周
  backToCurrentWeek = () => {
    this.loadWeekDates(this.state.currentWeekNumber)
  }

  onRefresh = async () => {
    Taro.showLoading({
      title: '刷新中...'
    })
    
    // 重新加载当前周日期并回到本周
    this.loadCurrentWeekDates()
    // 强制刷新课程并更新缓存
    const status = await this.loadCourseSchedule(true)
    
    setTimeout(() => {
      Taro.hideLoading()
      if (status === 'ok') {
        Taro.showToast({ title: '已刷新', icon: 'success', duration: 1500 })
      } else if (status === 'not_logged_in') {
        Taro.showToast({ title: '请先登录', icon: 'none', duration: 1500 })
      } else {
        Taro.showToast({ title: '刷新失败', icon: 'none', duration: 1500 })
      }
    }, 800)
  }

  render() {
    const { weekDays, timeSlots, currentWeekNumber, selectedWeekNumber, currentDateText, isVacation, vacationGreeting, showWeekPicker } = this.state

    return (
      <View className="schedule-page">
        {/* 状态栏占位 */}
        <View className="status-bar-placeholder"></View>
        
        {/* 顶部标题栏 - 严格按照原始设计 */}
        <View className="header">
          {/* 左侧 */}
          <View className="header-left">
            <View className="menu-icon">
              <Text className="menu-text">☰</Text>
            </View>
            <View className="week-info" onClick={this.toggleWeekPicker}>
              <View className="week-title-row">
                <Text className="week-title">{isVacation ? vacationGreeting : `第${selectedWeekNumber}周`}</Text>
                {!isVacation && <Text className="dropdown-icon">▼</Text>}
              </View>
              <Text className="current-date">{selectedWeekNumber !== currentWeekNumber && !isVacation ? `当前第${currentWeekNumber}周` : currentDateText}</Text>
            </View>
          </View>

          {/* 右侧 - 刷新按钮 */}
          <View className="header-right">
            <View className="refresh-button" onClick={this.onRefresh}>
              <View className="refresh-icon-wrapper">
                <AppIcon name="refresh" color="#1f2937" size="38rpx" />
                <Text className="refresh-text">刷新</Text>
            </View>
            </View>
          </View>
        </View>

        {/* 周数选择器 */}
        {showWeekPicker && (
          <View className="week-picker-overlay" onClick={this.toggleWeekPicker}>
            <View className="week-picker" onClick={(e) => e.stopPropagation()}>
              <View className="week-picker-header">
                <Text className="week-picker-title">选择周数</Text>
                <View className="week-picker-close" onClick={this.toggleWeekPicker}>
                  <Text>✕</Text>
                </View>
              </View>
              <View className="week-picker-content">
                {Array.from({ length: 18 }, (_, i) => i + 1).map((week) => (
                  <View
                    key={week}
                    className={`week-option ${week === selectedWeekNumber ? 'active' : ''} ${week === currentWeekNumber ? 'current' : ''}`}
                    onClick={() => this.selectWeek(week)}
                  >
                    <Text className="week-option-text">第{week}周</Text>
                    {week === currentWeekNumber && <Text className="week-option-badge">本周</Text>}
                  </View>
                ))}
              </View>
            </View>
          </View>
        )}

        {/* 周日期选择栏 - 严格按照原始设计 */}
        <View className="week-selector">
          {weekDays.map((day) => (
            <View key={day.key} className="week-day">
              <Text className="day-label">{day.label}</Text>
              <Text className="day-date">{day.date}</Text>
              {day.isActive && <View className="active-indicator"></View>}
            </View>
          ))}
        </View>

        {/* 课程时间轴区域或假期提示 */}
        <View className="timeline-container">
          {isVacation ? (
            <View className="vacation-message">
              <Text className="vacation-emoji">🏖️</Text>
              <Text className="vacation-title">{vacationGreeting}</Text>
              <Text className="vacation-subtitle">好好享受假期时光吧！</Text>
            </View>
          ) : (
            <View className="schedule-wrapper">
              {/* 背景网格（时间轴+7列） */}
          <View className="timeline-content">
            {timeSlots.map((slot, index) => (
              <View key={`${slot.period}-${index}`} className="time-slot">
                {/* 左侧节次和时间 */}
                <View className="time-info">
                      <Text className={`period ${(slot.period === '午休' || slot.period === '晚休') ? 'break-period' : ''}`}>{slot.period}</Text>
                  <Text className="time-text">{slot.time}</Text>
                </View>
                    {/* 右侧网格列 */}
                <View className="course-area">
                      {(slot.period === '午休' || slot.period === '晚休') ? (
                    <View className="break-indicator">
                          <Text className="break-text">{slot.period}时间</Text>
                    </View>
                  ) : (
                        <View className="course-grid">
                          {weekDays.map(day => (
                            <View key={day.key} className="grid-cell" />
                          ))}
                    </View>
                  )}
                </View>
              </View>
            ))}
          </View>

              {/* 课程卡片层（绝对定位，纵向铺放，契合网格） */}
              <View className="courses-layer">
                {weekDays.map((day, dayIndex) => {
                  const dayOfWeek = dayIndex + 1
                  const dayCourses = this.getCoursesForDay(dayOfWeek)

                  return dayCourses.map((course, idx) => {
                    const startIndex = this.getSectionIndex(course.startSection)
                    const endIndex = this.getSectionIndex(course.endSection)
                    if (startIndex < 0 || endIndex < 0) return null

                    // 使用百分比计算位置，自适应屏幕高度
                    const slotHeight = 100 / this.totalTimeSlots // 每个时间槽占的百分比
                    const top = startIndex * slotHeight
                    const height = (endIndex - startIndex + 1) * slotHeight
                    const cellWidth = 100 / 7
                    const courseColor = this.getCourseColor(course, dayIndex)

                    return (
                      <View
                        key={`${day.key}-${idx}`}
                        className="floating-course-card"
                        style={{
                          left: `${dayIndex * cellWidth}%`,
                          width: `${cellWidth}%`,
                          top: `${top}%`,
                          height: `${height}%`,
                          background: courseColor
                        }}
                      >
                        <Text className="course-name">{course.name}</Text>
                        <Text className="course-location">{course.location}</Text>
                        <Text className="course-teacher">{course.teacher}</Text>
                      </View>
                    )
                  })
                })}
              </View>
            </View>
          )}
        </View>
      </View>
    )
  }
}
