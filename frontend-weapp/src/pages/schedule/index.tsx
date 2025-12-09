import { Component } from 'react'
import { View, Text, Canvas, Image, Button } from '@tarojs/components'
// 导入本地图片，用于分享图叠加
// @ts-ignore
import weappLogo from '../../assets/images/weapp.png'
import Taro from '@tarojs/taro'
import { DateUtil } from '../../utils/date'
import { apiService } from '../../services/api'
import './index.scss'
import AppIcon from '../../components/AppIcon/index'
import AnnouncementModal from '../../components/AnnouncementModal/index'

interface Course {
  name: string
  teacher: string
  location: string
  weeks: number[]  // 周次数组，如 [2,3,4,5,6,7,8,9,10,11,13,14,15,16,17,18,19]
  dayOfWeek: number  // 1-7 (周一到周日)
  startSection: number  // 开始节次
  endSection: number    // 结束节次
}

interface Announcement {
  id: number
  title: string
  content: string
  author_name: string
  created_at: string
  images?: string
}

interface ScheduleState {
  weekDays: Array<{ key: string; label: string; date: string; isActive: boolean }>
  currentWeekNumber: number
  selectedWeekNumber: number
  currentDateText: string
  isVacation: boolean
  vacationGreeting: string
  showWeekPicker: boolean
  loading: boolean
  courses: Course[]
  colorSeed: number
  timeSlots: Array<{ period: string; time: string }>
  showSidebar: boolean
  sharing: boolean
  shareCanvasWidth: number
  shareCanvasHeight: number
  showSharePreview: boolean
  shareImagePath: string
  // 公告相关状态
  showAnnouncementModal: boolean
  pinnedAnnouncements: Announcement[]
  currentAnnouncementIndex: number
}

export default class SchedulePage extends Component<any, ScheduleState> {
  // 本次应用启动内，是否已经在本页面弹过登录提示（内存标记，配合本地存储保证单次）
  private hasShownLoginModal: boolean = false
  // 非强制刷新时的后台重验证标记，防止同一时刻重复拉取
  private isRevalidating: boolean = false

  state: ScheduleState = {
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
    // 课程配色随机种子：用于在用户刷新时改变颜色起点，从而整体更换配色
    colorSeed: 0,
    
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
    ],
    showSidebar: false,
    sharing: false,
    shareCanvasWidth: 0,
    shareCanvasHeight: 0,
    showSharePreview: false,
    shareImagePath: '',
    // 公告相关状态
    showAnnouncementModal: false,
    pinnedAnnouncements: [],
    currentAnnouncementIndex: 0
  }

  // 固定课程卡片“基色”调色板（粉彩系，使用Hex作为基础色，不带透明度）
  getColorPalette = (): string[] => [
   
    '#FBE7F3', // 浅粉
    '#FDEAD7', // 桃杏
    '#E7F1FF', // 天空蓝
    '#EEE7FF', // 淡紫
    '#FFF4CC', // 柠檬黄
    '#EAF8FF', // 婴儿蓝
    '#F6E8FF', // 浅丁香
    
   
    '#DFF7FF', // 晴空
    '#FFE8F0', // 腮红粉
    '#EAF5E6', // 青柠
    '#FFF1E6', // 奶橙
    '#EDEBFF', // 雾紫
    '#E6F7FA', // 冰蓝
    
    '#FFE6F7', // 牡丹粉
  ]

  // 将Hex颜色转为 {r,g,b}
  hexToRgb = (hex: string): { r: number; g: number; b: number } => {
    const norm = hex.replace('#', '')
    const full = norm.length === 3
      ? norm.split('').map(ch => ch + ch).join('')
      : norm
    const num = parseInt(full, 16)
    return {
      r: (num >> 16) & 255,
      g: (num >> 8) & 255,
      b: num & 255
    }
  }

  // RGB -> HSL（0..1）
  rgbToHsl = (r: number, g: number, b: number): { h: number; s: number; l: number } => {
    r /= 255; g /= 255; b /= 255
    const max = Math.max(r, g, b), min = Math.min(r, g, b)
    let h = 0, s = 0, l = (max + min) / 2
    if (max !== min) {
      const d = max - min
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break
        case g: h = (b - r) / d + 2; break
        case b: h = (r - g) / d + 4; break
      }
      h /= 6
    }
    return { h, s, l }
  }

  // HSL -> RGB（0..255）
  hslToRgb = (h: number, s: number, l: number): { r: number; g: number; b: number } => {
    let r: number, g: number, b: number
    if (s === 0) {
      r = g = b = l // 灰色
    } else {
      const hue2rgb = (p: number, q: number, t: number) => {
        if (t < 0) t += 1
        if (t > 1) t -= 1
        if (t < 1/6) return p + (q - p) * 6 * t
        if (t < 1/2) return q
        if (t < 2/3) return p + (q - p) * (2/3 - t) * 6
        return p
      }
      const q = l < 0.5 ? l * (1 + s) : l + s - l * s
      const p = 2 * l - q
      r = hue2rgb(p, q, h + 1/3)
      g = hue2rgb(p, q, h)
      b = hue2rgb(p, q, h - 1/3)
    }
    return { r: Math.round(r * 255), g: Math.round(g * 255), b: Math.round(b * 255) }
  }

  // 基于卡片颜色“再深一档”的文本色：同色相，适度加饱和(+0.10)，降低亮度(-0.15)
  deriveTextColor = (hex: string): string => {
    const { r, g, b } = this.hexToRgb(hex)
    const { h, s, l } = this.rgbToHsl(r, g, b)
    // 适度调整，保证是“再深一档”而非过度加深
    const s2 = Math.max(0, Math.min(1, s + 0.10))
    const l2 = Math.max(0, Math.min(1, l - 0.15))
    const rgb2 = this.hslToRgb(h, s2, l2)
    return `rgb(${rgb2.r}, ${rgb2.g}, ${rgb2.b})`
  }

  // 将hex基色转为半透明背景色（默认0.4，推荐范围 0.35~0.45）
  deriveBgColor = (hex: string, alpha: number = 0.4): string => {
    const { r, g, b } = this.hexToRgb(hex)
    return `rgba(${r}, ${g}, ${b}, ${alpha})`
  }

  // 计算 sRGB 到相对亮度（WCAG 2.1）
  private srgbToLinear = (c: number): number => {
    const cs = c / 255
    return cs <= 0.03928 ? cs / 12.92 : Math.pow((cs + 0.055) / 1.055, 2.4)
  }

  private relativeLuminance = (r: number, g: number, b: number): number => {
    const R = this.srgbToLinear(r)
    const G = this.srgbToLinear(g)
    const B = this.srgbToLinear(b)
    return 0.2126 * R + 0.7152 * G + 0.0722 * B
  }

  // 计算两种颜色的对比度（返回 >=1 的值）
  private contrastRatio = (rgb1: { r: number; g: number; b: number }, rgb2: { r: number; g: number; b: number }): number => {
    const L1 = this.relativeLuminance(rgb1.r, rgb1.g, rgb1.b)
    const L2 = this.relativeLuminance(rgb2.r, rgb2.g, rgb2.b)
    const lighter = Math.max(L1, L2)
    const darker = Math.min(L1, L2)
    return (lighter + 0.05) / (darker + 0.05)
  }

  // 将半透明前景色合成到白色背景上（小程序页面背景一般为白）
  private compositeOverWhite = (fg: { r: number; g: number; b: number }, alpha: number): { r: number; g: number; b: number } => {
    const r = Math.round(alpha * fg.r + (1 - alpha) * 255)
    const g = Math.round(alpha * fg.g + (1 - alpha) * 255)
    const b = Math.round(alpha * fg.b + (1 - alpha) * 255)
    return { r, g, b }
  }

  // 根据背景色与透明度，选择对比度更高的文本色（深色#111827 或 纯白#ffffff）
  getContrastAwareTextColor = (hexBg: string, alpha: number = 0.8): string => {
    const bgRgb = this.hexToRgb(hexBg)
    const comp = this.compositeOverWhite(bgRgb, alpha)
    const dark = { r: 17, g: 24, b: 39 } // #111827
    const white = { r: 255, g: 255, b: 255 }
    const contrastDark = this.contrastRatio(comp, dark)
    const contrastWhite = this.contrastRatio(comp, white)
    // 优先选择对比度更高者；常见浅色卡片会选择深色文本
    return contrastDark >= contrastWhite ? '#111827' : '#ffffff'
  }

  // 动态提升背景不透明度以满足最小对比度（默认 4.5:1）
  ensureContrastAlpha = (hexBg: string, initialAlpha: number = 0.8, minContrast: number = 4.5): { alpha: number; textColor: string } => {
    const bgRgb = this.hexToRgb(hexBg)
    let alpha = initialAlpha
    let textColor = this.getContrastAwareTextColor(hexBg, alpha)
    const dark = { r: 17, g: 24, b: 39 }
    const white = { r: 255, g: 255, b: 255 }

    const computeContrast = (a: number, txt: string) => {
      const comp = this.compositeOverWhite(bgRgb, a)
      const t = txt === '#ffffff' ? white : dark
      return this.contrastRatio(comp, t)
    }

    let contrast = computeContrast(alpha, textColor)
    // 逐步提高背景 alpha，最多到 1.0，以提升对比度
    while (contrast < minContrast && alpha < 1) {
      alpha = Math.min(1, +(alpha + 0.05).toFixed(2))
      textColor = this.getContrastAwareTextColor(hexBg, alpha)
      contrast = computeContrast(alpha, textColor)
    }

    return { alpha, textColor }
  }

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
    
    // 检查是否需要加载置顶公告（仅在首次访问时）
    this.checkAndLoadPinnedAnnouncements()

    // 公告检查触发后再尝试触发未登录提示（若此刻有公告弹窗，会在关闭后再触发）
    this.tryShowLoginPrompt()
  }

  // 分享配置
  onShareAppMessage() {
    return {
      title: '西外课程表 - 便捷查看课表',
      path: '/pages/schedule/index',
      imageUrl: weappLogo
    }
  }

  // 分享到朋友圈配置
  onShareTimeline() {
    return {
      title: '西外课程表 - 便捷查看课表',
      imageUrl: weappLogo
    }
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

      // 方案A（SWR）：
      // 1) 非强制刷新：若有任何缓存，先立即渲染缓存，保证首屏不空白；必要时在后台静默刷新
      if (!forceRefresh) {
        if (cached && Array.isArray(cached.courses)) {
          // 先显示缓存（可能是前一天的），提升首屏体验
          this.setState({ courses: cached.courses })
          // 条件重验证：缓存不是今天的数据时后台拉新；避免重复 revalidate
          const needRevalidate = cached.date !== today
          if (needRevalidate && !this.isRevalidating) {
            this.isRevalidating = true
            ;(async () => {
              try {
                const response = await apiService.getCourseSchedule() as any
                if (response && response.courses) {
                  const fresh = this.mapCoursesFromBackend(response.courses)
                  // 更新 UI 与缓存
                  this.setState({ courses: fresh })
                  Taro.setStorageSync(cacheKey, { date: today, courses: fresh })
                }
              } catch (e) {
                console.error('后台刷新课程失败，保留缓存数据', e)
              } finally {
                this.isRevalidating = false
              }
            })()
          }
          return 'ok'
        }
        // 没有任何缓存，则走正常请求，但不清空 UI（本就无数据）
      }

      // 2) 强制刷新或首次无缓存：走同步请求流程，保持原有交互（显示 loading，等待结果）
      this.setState({ loading: true })

      let courses: Course[] | null = null
      try {
        const response = await apiService.getCourseSchedule() as any
        if (response && response.courses) {
          courses = this.mapCoursesFromBackend(response.courses)
        }
      } catch (e) {
        console.error('请求课程失败，尝试使用历史缓存', e)
        if (cached && Array.isArray(cached.courses)) {
          courses = cached.courses
        }
      }

      if (courses) {
        this.setState({ courses })
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
      
      // 为每个星期创建课程条目（按连续节次拆分为多个区块，避免跨越午休/晚休）
      Object.entries(groupedByDay).forEach(([day, periods]) => {
        periods.sort((a, b) => a - b)

        // 将节次转换为时间槽索引，便于判断连续性
        const indices = periods
          .map(p => this.getSectionIndex(p))
          .filter(idx => idx >= 0)
          .sort((a, b) => a - b)

        // 按连续索引分段
        let startIdx = 0
        for (let i = 1; i <= indices.length; i++) {
          if (i === indices.length || indices[i] !== indices[i - 1] + 1) {
            // 一个连续区间 [startIdx, i-1]
            const segIndices = indices.slice(startIdx, i)
            const segPeriods = segIndices.map(idx => periods.find(p => this.getSectionIndex(p) === idx)!).filter(Boolean)
            if (segPeriods.length) {
              courses.push({
                name: item.course_name || '',
                teacher: item.teacher_name || '',
                location: item.classroom || '',
                weeks: item.weeks,
                dayOfWeek: Number(day),
                startSection: Math.min(...segPeriods),
                endSection: Math.max(...segPeriods)
              })
            }
            startIdx = i
          }
        }
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
    const seed = this.state.colorSeed || 0
    return (baseHash + dayIndex + course.startSection + seed) % colors.length
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

  // 打开/关闭侧边栏
  openSidebar = () => this.setState({ showSidebar: true })
  closeSidebar = () => this.setState({ showSidebar: false })

  // 生成并显示课表分享图预览
  onShareSchedule = async () => {
    this.setState({ showSidebar: false })
    
    Taro.showLoading({ title: '生成中...' })
    
    try {
      // 获取窗口信息（使用新API替代已废弃的getSystemInfo）
      const windowInfo = Taro.getWindowInfo()
      const width = windowInfo.windowWidth * 2 // 2倍图，全屏宽度
      const height = windowInfo.windowHeight * 2 // 2倍图，全屏高度
      
      // 设置 Canvas 尺寸
      await new Promise<void>(resolve => {
        this.setState({ shareCanvasWidth: width, shareCanvasHeight: height }, () => {
          setTimeout(resolve, 300)
        })
      })
      
      // 绘制课表
      await this.drawScheduleToCanvas(width, height)
      
      // 等待绘制完成
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 导出为图片（使用全屏尺寸）
      const res = await Taro.canvasToTempFilePath({
        canvasId: 'scheduleShareCanvas',
        destWidth: width,
        destHeight: height,
        fileType: 'png',
        quality: 1
      })
      
      // 重置 Canvas 尺寸
      this.setState({ shareCanvasWidth: 0, shareCanvasHeight: 0 })
      
      Taro.hideLoading()
      
      // 显示预览弹窗
      this.setState({
        showSharePreview: true,
        shareImagePath: res.tempFilePath
      })
      
    } catch (error) {
      console.error('生成分享图失败:', error)
      Taro.hideLoading()
      Taro.showToast({ title: '生成失败', icon: 'none' })
    }
  }

  // 关闭分享预览
  closeSharePreview = () => {
    this.setState({ showSharePreview: false, shareImagePath: '' })
  }

  // 打开图片预览（长按可保存）
  openShareImage = () => {
    const { shareImagePath } = this.state
    if (shareImagePath) {
      Taro.previewImage({
        urls: [shareImagePath],
        current: shareImagePath
      })
    }
  }

  // 在 Canvas 上绘制当前课表
  drawScheduleToCanvas = async (width: number, height: number): Promise<number> => {
    const ctx = Taro.createCanvasContext('scheduleShareCanvas')
    const rpx2px = (v: number) => v * (width / 750)

    // 基础尺寸 - 减少页脚高度，增加课表主体空间
    const leftW = rpx2px(112)
    const headerH = rpx2px(160)
    const footerH = rpx2px(240) // 减少页脚高度从360到240
    const rows = this.state.timeSlots.length
    
    // 根据全屏高度计算每行的高度
    const availableHeight = height - headerH - footerH
    const rowH = availableHeight / rows
    
    const gridWidth = width - leftW
    const colW = gridWidth / 7

    // 动态调整字号 - 根据实际列宽确保一行能显示4个字
    // 计算：4个汉字需要的最小宽度，每个字宽度约等于字号
    const isSmallScreen = width <= 900 // 450px * 2 及以下（覆盖大部分手机）
    const targetChars = 4 // 目标显示4个汉字
    const padding = isSmallScreen ? 4 : 12 // 小屏减少内边距
    const innerColW = Math.max(0, colW - padding * 2)
    
    // 根据列宽动态计算字号：innerColW / targetChars
    // 中文字符实际宽度约为字号的1.0倍（等宽），留15%余量
    const calculatedFont = Math.floor(innerColW / targetChars * 0.85) // 0.85系数（4字稍紧凑）
    const maxFont = isSmallScreen ? 15 : 16 // 小屏最大15px，大屏最大16px
    const nameFont = Math.max(10, Math.min(maxFont, calculatedFont)) // 限制在10-15/16px之间
    const metaFont = Math.max(9, nameFont - 2) // 副文本小2号，最小9px
    const lineHeight = Math.max(13, nameFont + 4) // 行高 = 字号 + 4px，最小13
    
    // 调试日志
    console.log('Canvas绘制参数:', { 
      width, 
      isSmallScreen,
      leftW, 
      colW, 
      gridWidth,
      padding,
      innerColW,
      nameFont,
      metaFont,
      计算说明: `innerColW(${innerColW.toFixed(1)}) / ${targetChars}字 = ${(innerColW/targetChars).toFixed(1)}px/字`
    })
    
    // 文本换行工具函数
    ctx.setTextAlign('left' as any)
    ;(ctx as any).setTextBaseline && (ctx as any).setTextBaseline('top')

    const wrapLines = (text: string, fontSize: number, maxW: number): string[] => {
      if (!text) return []
      ctx.setFontSize(fontSize)
      const lines: string[] = []
      let cur = ''
      for (let i = 0; i < text.length; i++) {
        const nxt = cur + text[i]
        if (ctx.measureText(nxt).width > maxW) {
          if (cur.length === 0) {
            lines.push(text[i])
            cur = ''
          } else {
            lines.push(cur)
            cur = text[i]
          }
        } else {
          cur = nxt
        }
      }
      if (cur) lines.push(cur)
      return lines
    }

    const gridTop = headerH
    const gridHeight = rows * rowH

    // 背景
    ctx.setFillStyle('#ffffff')
    ctx.fillRect(0, 0, width, height)

    // 设置文本基线和对齐方式
    ctx.setTextAlign('left' as any)
    ctx.setTextBaseline('top' as any)

    // 顶部区域：左侧日期，右侧第X周 - 根据屏幕大小调整
    ctx.setFillStyle('#111827')
    ctx.setFontSize(isSmallScreen ? 16 : 20)
    const dateStr = this.state.currentDateText || ''
    ctx.fillText(dateStr, 32, 40)
    
    // 右侧周数
    const weekStr = `第${this.state.selectedWeekNumber}周`
    const weekW = ctx.measureText(weekStr).width
    ctx.fillText(weekStr, width - weekW - 32, 40)

    // 周标签
    const labels = ['周一','周二','周三','周四','周五','周六','周日']
    ctx.setFontSize(isSmallScreen ? 12 : 16)
    ctx.setFillStyle('#374151')
    labels.forEach((lab, i) => {
      const x = leftW + i * colW + colW / 2
      ctx.setTextAlign('center' as any)
      ctx.fillText(lab, x, gridTop - 24) // 调整位置
    })
    ctx.setTextAlign('left' as any)

    // 时间列与横线
    ctx.setStrokeStyle('#e5e7eb')
    ctx.setLineWidth(1)
    for (let r = 0; r <= rows; r++) {
      const y = gridTop + r * rowH
      ctx.beginPath()
      ctx.moveTo(0, y)
      ctx.lineTo(width, y)
      ctx.stroke()
    }
    // 竖线
    for (let i = 0; i <= 7; i++) {
      const x = leftW + i * colW
      ctx.beginPath()
      ctx.moveTo(x, gridTop)
      ctx.lineTo(x, gridTop + gridHeight)
      ctx.stroke()
    }

    // 时间标签
    ctx.setTextAlign('left' as any)
    ctx.setTextBaseline('middle' as any) // 使用 middle 基线让文字垂直居中
    ctx.setFillStyle('#6b7280')
    ctx.setFontSize(isSmallScreen ? 11 : 14)
    this.state.timeSlots.forEach((slot, idx) => {
      const y = gridTop + idx * rowH + rowH / 2
      // 节次标签
      ctx.fillText(slot.period, 16, y - 12)
      // 时间文字
      ctx.setFontSize(isSmallScreen ? 9 : 11)
      ctx.fillText(slot.time, 16, y + 12)
      ctx.setFontSize(isSmallScreen ? 11 : 14)
    })

    // 课程卡片
    const colors = this.getColorPalette()
    const assigned: number[][] = Array.from({ length: 7 }, () => Array(this.totalTimeSlots).fill(-1))
    this.state.weekDays.forEach((_, dayIndex) => {
      const dayOfWeek = dayIndex + 1
      const dayCourses = this.getCoursesForDay(dayOfWeek)
        .slice()
        .sort((a, b) => (a.startSection - b.startSection) || a.name.localeCompare(b.name))

      let lastColorIndex: number | null = null
      dayCourses.forEach((course) => {
        const startIndex = this.getSectionIndex(course.startSection)
        const endIndex = this.getSectionIndex(course.endSection)
        if (startIndex < 0 || endIndex < 0) return

        let colorIndex = this.getCourseColorIndex(course, dayIndex)
        const leftNeighborColors = new Set<number>()
        if (dayIndex > 0) {
          for (let s = startIndex; s <= endIndex; s++) {
            const leftColor = assigned[dayIndex - 1][s]
            if (leftColor !== -1) leftNeighborColors.add(leftColor)
          }
        }
        let tries = 0
        while ((lastColorIndex !== null && colorIndex === lastColorIndex) || leftNeighborColors.has(colorIndex)) {
          colorIndex = (colorIndex + 1) % colors.length
          tries++
          if (tries > colors.length) break
        }
        for (let s = startIndex; s <= endIndex; s++) assigned[dayIndex][s] = colorIndex

        const baseHex = colors[colorIndex]
        const { alpha, textColor } = this.ensureContrastAlpha(baseHex, 0.85, 4.5)
        const { r, g, b } = this.hexToRgb(baseHex)
        const bg = `rgba(${r}, ${g}, ${b}, ${alpha})`

        const cardMargin = 8 // 卡片外边距
        const x = leftW + dayIndex * colW + cardMargin
        const y = gridTop + startIndex * rowH + cardMargin
        const w = colW - cardMargin * 2
        const h = (endIndex - startIndex + 1) * rowH - cardMargin * 2

        // 卡片背景 - 使用圆角矩形
        this.drawRoundRect(ctx, x, y, w, h, 12)
        ctx.setFillStyle(bg)
        ctx.fill()

        // 文本绘制
        ctx.save()
        ctx.beginPath()
        ctx.rect(x, y, w, h)
        ctx.clip()
        ctx.setFillStyle(textColor)
        ctx.setTextBaseline('top' as any)
        ctx.setTextAlign('left' as any)

        const innerW2 = Math.max(0, w - padding * 2)
        const name = course.name || ''
        const teacher = course.teacher || ''
        const location = course.location || ''
        
        // 生成周次信息（如："2-18周"）
        let weeksInfo = ''
        if (course.weeks && course.weeks.length > 0) {
          const weeks = course.weeks.sort((a, b) => a - b)
          const first = weeks[0]
          const last = weeks[weeks.length - 1]
          if (first === last) {
            weeksInfo = `第${first}周`
          } else {
            weeksInfo = `${first}-${last}周`
          }
        }
        
        const nameLines2 = wrapLines(name, nameFont, innerW2)
        const teacherLines2 = wrapLines(teacher, metaFont, innerW2)
        const locationLines2 = wrapLines(location, metaFont, innerW2)
        const weeksLines2 = wrapLines(weeksInfo, metaFont, innerW2)
        const linesAll = [
          ...nameLines2.map(s => ({ s, f: nameFont })),
          ...teacherLines2.map(s => ({ s, f: metaFont })),
          ...locationLines2.map(s => ({ s, f: metaFont })),
          ...weeksLines2.map(s => ({ s, f: metaFont })),
        ]
        const startY = y + padding
        const startX = x + padding
        let offsetY = 0
        linesAll.forEach(item => {
          ctx.setFontSize(item.f)
          ctx.fillText(item.s, startX, startY + offsetY)
          offsetY += lineHeight
        })
        ctx.restore()
      })
    })

    // 底部页脚：圆角卡片（左logo 中文字 右二维码）
    const footerTop = gridTop + gridHeight
    // 分隔线
    ctx.setStrokeStyle('#e5e7eb')
    ctx.setLineWidth(1)
    ctx.beginPath()
    ctx.moveTo(0, footerTop)
    ctx.lineTo(width, footerTop)
    ctx.stroke()

    const cardMargin = 16
    const cardX = cardMargin
    const cardW = width - cardMargin * 2
    const cardH = rpx2px(280) // 增加卡片高度
    const cardY = footerTop + (footerH - cardH) / 2

    // 圆角白卡 + 细边
    this.drawRoundRect(ctx, cardX, cardY, cardW, cardH, 10)
    ctx.setFillStyle('#ffffff')
    ctx.fill()
    ctx.setStrokeStyle('#e5e7eb')
    ctx.stroke()

    // 内边距
    const pad = 16
    const innerX = cardX + pad
    const innerY = cardY + pad
  const innerCardW = cardW - pad * 2
    const innerH = cardH - pad * 2

  

    // 右侧二维码
    const qrSize = rpx2px(240)
    const qrX = cardX + cardW - pad - qrSize
    const qrY = cardY + (cardH - qrSize) / 2
    try {
      ctx.drawImage(weappLogo as string, qrX, qrY, qrSize, qrSize)
    } catch {}

    // 左侧文字区域（删除logo）
    const textAreaX = innerX
    const textAreaW = Math.max(0, qrX - 24 - textAreaX)
    const title = '知外助手· 课表分享'
    const subtitle = '欢迎使用知外助手小程序，便捷查看课表、成绩等'

    const wrapSimple = (t: string, size: number, maxW: number) => {
      ctx.setFontSize(size)
      const lines: string[] = []
      let cur = ''
      for (let i = 0; i < t.length; i++) {
        const nxt = cur + t[i]
        if (ctx.measureText(nxt).width > maxW) {
          if (cur.length === 0) { lines.push(t[i]); cur = '' } else { lines.push(cur); cur = t[i] }
        } else cur = nxt
      }
      if (cur) lines.push(cur)
      return lines
    }

    // 设置页脚文本基线 - 根据屏幕大小调整字号并垂直居中
    ctx.setTextBaseline('top' as any)
    ctx.setTextAlign('left' as any)
    
    const titleFontSize = isSmallScreen ? 24 : 32
    const subFontSize = isSmallScreen ? 18 : 24
    const titleLineHeight = isSmallScreen ? 30 : 40
    const subLineHeight = isSmallScreen ? 24 : 30
    
    const titleLines = wrapSimple(title, titleFontSize, textAreaW)
    const subLines = wrapSimple(subtitle, subFontSize, textAreaW)
    const totalTextHeight = titleLines.length * titleLineHeight + subLines.length * subLineHeight
    let ty = innerY + (innerH - totalTextHeight) / 2
    ctx.setFillStyle('#111827')
    titleLines.forEach((s, i) => { ctx.setFontSize(titleFontSize); ctx.fillText(s, textAreaX, ty + i * titleLineHeight) })
    ty += titleLines.length * titleLineHeight
    ctx.setFillStyle('#6b7280')
    subLines.forEach((s, i) => { ctx.setFontSize(subFontSize); ctx.fillText(s, textAreaX, ty + i * subLineHeight) })

    // 绘制并返回高度
    return new Promise<number>((resolve) => ctx.draw(false, () => resolve(height)))
  }

  // 画圆角矩形路径
  private drawRoundRect(ctx: any, x: number, y: number, w: number, h: number, r: number) {
    const radius = Math.min(r, w / 2, h / 2)
    ctx.beginPath()
    ctx.moveTo(x + radius, y)
    ctx.lineTo(x + w - radius, y)
    ctx.arc(x + w - radius, y + radius, radius, -Math.PI / 2, 0)
    ctx.lineTo(x + w, y + h - radius)
    ctx.arc(x + w - radius, y + h - radius, radius, 0, Math.PI / 2)
    ctx.lineTo(x + radius, y + h)
    ctx.arc(x + radius, y + h - radius, radius, Math.PI / 2, Math.PI)
    ctx.lineTo(x, y + radius)
    ctx.arc(x + radius, y + radius, radius, Math.PI, 1.5 * Math.PI)
    ctx.closePath()
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
  // 点击刷新时，递增配色种子，触发课程卡片颜色重算
  this.setState(prev => ({ colorSeed: (prev.colorSeed + 1) % 10000 }))
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

  // ==================== 公告相关方法 ====================
  
  // 检查并加载置顶公告（仅在首次访问时）
  checkAndLoadPinnedAnnouncements = async () => {
    try {
      // 检查是否已经在当前会话中检查过公告
      const sessionKey = 'schedule_announcements_checked'
      const appLaunchId = Taro.getStorageSync('appLaunchId')
      const checkedAt = Taro.getStorageSync(sessionKey)
      if (appLaunchId && checkedAt && checkedAt === appLaunchId) {
        return // 本次应用启动已检查过
      }
      
      // 获取全局置顶公告（无需登录）
      const result = await apiService.getPinnedAnnouncements() as any
      
      if (result.success && result.data && result.data.length > 0) {
        this.setState({
          pinnedAnnouncements: result.data,
          currentAnnouncementIndex: 0,
          showAnnouncementModal: true
        })
      }
      
  // 标记本次会话已检查过公告（按应用启动维度）
  const curLaunchId = Taro.getStorageSync('appLaunchId') || Date.now()
  Taro.setStorageSync('appLaunchId', curLaunchId)
  Taro.setStorageSync(sessionKey, curLaunchId)
      
    } catch (error) {
      console.error('获取置顶公告失败:', error)
    }
  }
  
  // 关闭公告弹窗
  handleCloseAnnouncementModal = () => {
    this.setState({
      showAnnouncementModal: false,
      pinnedAnnouncements: [],
      currentAnnouncementIndex: 0
    }, () => {
      // 公告关闭后再尝试提示登录（仅当未登录且本次启动未提示过时）
      this.tryShowLoginPrompt()
    })
  }
  
  // 显示下一条公告
  handleNextAnnouncement = () => {
    const { currentAnnouncementIndex, pinnedAnnouncements } = this.state
    if (currentAnnouncementIndex < pinnedAnnouncements.length - 1) {
      this.setState({
        currentAnnouncementIndex: currentAnnouncementIndex + 1
      })
    }
  }

  // ==================== 未登录提示（与公告串联） ====================
  // 判断是否已登录（以 userToken + userInfo.userId/uid 为准）
  isLoggedIn = (): boolean => {
    try {
      const token = Taro.getStorageSync('userToken')
      const userInfo = Taro.getStorageSync('userInfo')
      return !!token && !!(userInfo && (userInfo.userId || userInfo.uid))
    } catch {
      return false
    }
  }

  // 当前应用启动是否已经在课表页弹过登录提示
  hasShownLoginPromptThisLaunch = (): boolean => {
    try {
      const appLaunchId = Taro.getStorageSync('appLaunchId')
      const shownAt = Taro.getStorageSync('schedule_login_prompt_shown_at_launch')
      return !!appLaunchId && !!shownAt && appLaunchId === shownAt
    } catch {
      return this.hasShownLoginModal
    }
  }

  markLoginPromptShown = () => {
    try {
      const appLaunchId = Taro.getStorageSync('appLaunchId') || Date.now()
      Taro.setStorageSync('appLaunchId', appLaunchId)
      Taro.setStorageSync('schedule_login_prompt_shown_at_launch', appLaunchId)
    } catch {}
    this.hasShownLoginModal = true
  }

  // 在不与公告弹窗冲突的前提下，尝试弹出“去登录”提示；只出现一次
  tryShowLoginPrompt = () => {
    // 已登录则不提示
    if (this.isLoggedIn()) return
    // 正在展示公告时不打断，等待公告关闭后再触发
    if (this.state.showAnnouncementModal) return
    // 本页面已提示过或本次启动已提示过，则不再重复
    if (this.hasShownLoginModal || this.hasShownLoginPromptThisLaunch()) return

    // 标记为已提示（即便用户取消，也不再打扰）
    this.markLoginPromptShown()
    Taro.showModal({
      title: '提示',
      content: '请先登录后查看课程表',
      confirmText: '去登录',
      cancelText: '稍后',
      success: (res) => {
        if (res.confirm) {
          Taro.navigateTo({ url: '/pages/login/index' })
        }
      }
    })
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
            <View className="menu-icon" onClick={this.openSidebar}>
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
              <View className="schedule-grid">
                {/* 时间列（第1列）+ 背景网格（7列*12行） */}
                {timeSlots.map((slot, rowIdx) => (
                  <>
                    <View
                      key={`time-${rowIdx}`}
                      className="grid-time"
                      style={{ gridColumn: '1 / 2', gridRow: `${rowIdx + 1} / ${rowIdx + 2}` }}
                    >
                      <Text className={`period ${(slot.period === '午休' || slot.period === '晚休') ? 'break-period' : ''}`}>{slot.period}</Text>
                      <Text className="time-text">{slot.time}</Text>
                    </View>
                    {slot.period === '午休' || slot.period === '晚休' ? (
                      <View
                        key={`break-${rowIdx}`}
                        className="grid-break"
                        style={{ gridColumn: '2 / 9', gridRow: `${rowIdx + 1} / ${rowIdx + 2}` }}
                      >
                        <Text className="break-text">{slot.period}时间</Text>
                      </View>
                    ) : (
                      weekDays.map((_, dayIdx) => (
                        <View
                          key={`cell-${rowIdx}-${dayIdx}`}
                          className="grid-cell"
                          style={{ gridColumn: `${dayIdx + 2} / ${dayIdx + 3}`, gridRow: `${rowIdx + 1} / ${rowIdx + 2}` }}
                        />
                      ))
                    )}
                  </>
                ))}

                {/* 课程卡片（按 grid 放置，跨行显示） */}
                {(() => {
                  const colors = this.getColorPalette()
                  const assigned: number[][] = Array.from({ length: 7 }, () => Array(this.totalTimeSlots).fill(-1))
                  const nodes: any[] = []

                  weekDays.forEach((day, dayIndex) => {
                    const dayOfWeek = dayIndex + 1
                    const dayCourses = this.getCoursesForDay(dayOfWeek)
                      .slice()
                      .sort((a, b) => (a.startSection - b.startSection) || a.name.localeCompare(b.name))

                    let lastColorIndex: number | null = null

                    dayCourses.forEach((course, idx) => {
                      const startIndex = this.getSectionIndex(course.startSection)
                      const endIndex = this.getSectionIndex(course.endSection)
                      if (startIndex < 0 || endIndex < 0) return

                      // 基础颜色索引（哈希）
                      let colorIndex = this.getCourseColorIndex(course, dayIndex)

                      // 收集左邻颜色（与本课程重叠行的左侧列颜色）
                      const leftNeighborColors = new Set<number>()
                      if (dayIndex > 0) {
                        for (let s = startIndex; s <= endIndex; s++) {
                          const leftColor = assigned[dayIndex - 1][s]
                          if (leftColor !== -1) leftNeighborColors.add(leftColor)
                        }
                      }

                      // 垂直+水平避让
                      let tries = 0
                      while (
                        (lastColorIndex !== null && colorIndex === lastColorIndex) ||
                        leftNeighborColors.has(colorIndex)
                      ) {
                        colorIndex = (colorIndex + 1) % colors.length
                        tries++
                        if (tries > colors.length) break
                      }

                      // 写入已分配表
                      for (let s = startIndex; s <= endIndex; s++) {
                        assigned[dayIndex][s] = colorIndex
                      }

                      const baseHex = colors[colorIndex]
                      const { alpha, textColor } = this.ensureContrastAlpha(baseHex, 0.8, 4.5)
                      const courseColor = this.deriveBgColor(baseHex, alpha)
                      lastColorIndex = colorIndex

                      nodes.push(
                        <View
                          key={`course-${day.key}-${idx}`}
                          className="course-card"
                          style={{
                            gridColumn: `${dayIndex + 2} / ${dayIndex + 3}`,
                            gridRow: `${startIndex + 1} / span ${endIndex - startIndex + 1}`,
                            background: courseColor,
                            color: textColor
                          }}
                        >
                          <Text className="course-name">{course.name}</Text>
                          <Text className="course-teacher">{course.teacher}</Text>
                          <Text className="course-location">{course.location}</Text>
                        </View>
                      )
                    })
                  })

                  return nodes
                })()}
              </View>
            </View>
          )}
        </View>
        {/* 侧边栏与遮罩 */}
        {this.state.showSidebar && (
          <View className="sidebar-overlay" onClick={this.closeSidebar}>
            <View className="sidebar" onClick={(e) => e.stopPropagation()}>
              <View className="sidebar-status-bar"></View>
              <View className="sidebar-header">
                <Text className="sidebar-title">功能</Text>
                <View className="sidebar-close" onClick={this.closeSidebar}><Text>✕</Text></View>
              </View>
              <View className="sidebar-item" onClick={this.onShareSchedule}>
                <Text className="sidebar-item-text">分享课表</Text>
              </View>
            </View>
          </View>
        )}

        {/* 分享预览弹窗 */}
        {this.state.showSharePreview && this.state.shareImagePath && (
          <View className="share-preview-modal" onClick={this.closeSharePreview}>
            <View className="share-preview-card" onClick={(e) => e.stopPropagation()}>
              <View className="share-preview-close" onClick={this.closeSharePreview}>
                <Text>✕</Text>
              </View>
              <Image 
                src={this.state.shareImagePath} 
                className="share-preview-image"
                mode="widthFix"
              />
              <View className="share-preview-tips">
                <Text className="share-preview-tips-text">
                  可能展示图会有一些显示问题，但是打开图片分享功能目前可以正常使用
                </Text>
              </View>
              <Button className="share-preview-button" onClick={this.openShareImage}>
                点我打开图片，长按即可分享
              </Button>
            </View>
          </View>
        )}

        {/* 隐藏 Canvas 用于生成分享图片 */}
        {this.state.shareCanvasWidth > 0 && this.state.shareCanvasHeight > 0 && (
          <Canvas
            canvasId="scheduleShareCanvas"
            style={{
              position: 'fixed',
              left: '-9999px',
              top: '-9999px',
              width: `${this.state.shareCanvasWidth}px`,
              height: `${this.state.shareCanvasHeight}px`
            }}
          />
        )}
        
        {/* 公告弹窗 */}
        {this.state.showAnnouncementModal && this.state.pinnedAnnouncements.length > 0 && (
          <AnnouncementModal
            announcements={this.state.pinnedAnnouncements}
            currentIndex={this.state.currentAnnouncementIndex}
            onClose={this.handleCloseAnnouncementModal}
            onNext={this.handleNextAnnouncement}
          />
        )}
      </View>
    )
  }
}
