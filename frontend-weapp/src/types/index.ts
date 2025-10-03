// 用户信息类型
export interface UserInfo {
  name: string
  studentId: string
  college: string
  major: string
  avatar?: string
}

// 课程信息类型
export interface Course {
  id: string
  name: string
  location: string
  time: string
  teacher?: string
  color: string
  period: number
  duration: number
  weeks?: number[]
  courseCode?: string
  credits?: number
}

// 时间段类型
export interface TimeSlot {
  period: string
  time: string
  startTime: string
  endTime: string
}

// 星期类型
export interface WeekDay {
  key: string
  label: string
  date: string
  isActive: boolean
}

// 成绩信息类型
export interface Grade {
  id: string
  semesterName: string
  courseCode: string
  courseName: string
  courseType: string
  credits: number
  finalScore: string | number
  gradePoint?: number
  examScore?: string | number
  usualScore?: string | number
}

// 学期信息类型
export interface Semester {
  id: string
  name: string
  schoolYear: string
  startDate: string
  endDate: string
  isActive: boolean
}

// API响应基础类型
export interface ApiResponse<T = any> {
  success: boolean
  data: T
  message?: string
  code?: number
}

// 登录请求类型
export interface LoginRequest {
  username: string
  password: string
}

// 登录响应类型
export interface LoginResponse {
  token: string
  userInfo: UserInfo
  expiresIn: number
}

// 课程表响应类型
export interface CourseTableResponse {
  semester: Semester
  courses: Record<string, Course[]>
  timeSlots: TimeSlot[]
}

// 成绩响应类型
export interface GradeResponse {
  semester: Semester
  grades: Grade[]
  statistics: {
    totalCourses: number
    averageScore: number
    totalCredits: number
    gradeDistribution: Record<string, number>
  }
}

// 应用菜单项类型
export interface AppMenuItem {
  id: string
  name: string
  description: string
  icon: string
  url?: string
  action?: string
  badge?: string | number
}

// 页面状态类型
export interface PageState {
  loading: boolean
  error?: string
  refreshing?: boolean
}

// 小程序页面配置类型
export interface PageConfig {
  navigationBarTitleText: string
  navigationBarBackgroundColor?: string
  navigationBarTextStyle?: 'black' | 'white'
  backgroundColor?: string
  enablePullDownRefresh?: boolean
}
