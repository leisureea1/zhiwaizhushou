// 日期工具类
export class DateUtil {
  // 格式化日期
  static format(date: Date, format: string = 'YYYY-MM-DD'): string {
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hour = String(date.getHours()).padStart(2, '0')
    const minute = String(date.getMinutes()).padStart(2, '0')
    const second = String(date.getSeconds()).padStart(2, '0')

    return format
      .replace('YYYY', String(year))
      .replace('MM', month)
      .replace('DD', day)
      .replace('HH', hour)
      .replace('mm', minute)
      .replace('ss', second)
  }

  // 获取当前周的日期范围
  static getCurrentWeekDates(): Array<{ date: Date; dayName: string; dateText: string }> {
    const today = new Date()
    const currentDay = today.getDay() || 7 // 将周日(0)转换为7
    const monday = new Date(today)
    monday.setDate(today.getDate() - currentDay + 1)

    const weekDays = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
    const dates = []

    for (let i = 0; i < 7; i++) {
      const date = new Date(monday)
      date.setDate(monday.getDate() + i)
      
      dates.push({
        date,
        dayName: weekDays[i],
        dateText: this.format(date, 'MM/DD')
      })
    }

    return dates
  }

  // 获取学期周数
  static getWeekNumber(semesterStart: Date, currentDate: Date = new Date()): number {
    const diffTime = currentDate.getTime() - semesterStart.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    return Math.ceil(diffDays / 7)
  }

  // 检查是否在假期中（学期最大18周）
  static isInVacation(currentDate: Date = new Date()): boolean {
    const semesterStart = this.getCurrentSemesterStart()
    const weekNumber = this.getWeekNumber(semesterStart, currentDate)
    return weekNumber < 1 || weekNumber > 18
  }

  // 获取假期祝福语
  static getVacationGreeting(currentDate: Date = new Date()): string {
    const month = currentDate.getMonth() + 1
    
    // 寒假（1月-2月）
    if (month >= 1 && month <= 2) {
      return '寒假快乐 🎉'
    }
    // 暑假（7月-8月）
    else if (month >= 7 && month <= 8) {
      return '暑假快乐 ☀️'
    }
    // 其他假期
    else {
      return '假期快乐 🎊'
    }
  }

  // 判断是否为今天
  static isToday(date: Date): boolean {
    const today = new Date()
    return date.toDateString() === today.toDateString()
  }

  // 解析时间字符串 "08:00-08:50" 
  static parseTimeRange(timeStr: string): { start: string; end: string } | null {
    const match = timeStr.match(/(\d{2}:\d{2})-(\d{2}:\d{2})/)
    if (match) {
      return {
        start: match[1],
        end: match[2]
      }
    }
    return null
  }

  // 获取当前学期的开始日期
  static getCurrentSemesterStart(): Date {
    const now = new Date()
    const year = now.getFullYear()
    const month = now.getMonth() + 1

    // 春季学期：3月2日开始
    if (month >= 3 && month <= 7) {
      return new Date(year, 2, 2) // 3月2日
    }
    // 秋季学期：9月1日开始
    else if (month >= 9 || month <= 1) {
      return new Date(year, 8, 1) // 9月1日
    }
    // 2月份期间（寒假）仍按上一年秋季学期计算
    else {
      return new Date(year - 1, 8, 1) // 上一年9月1日
    }
  }
}
