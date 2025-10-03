import Taro from '@tarojs/taro'

// 本地存储工具类
export class StorageUtil {
  // 设置存储
  static set(key: string, data: any): void {
    try {
      Taro.setStorageSync(key, data)
    } catch (error) {
      console.error('设置存储失败:', error)
    }
  }

  // 获取存储
  static get<T>(key: string): T | null {
    try {
      return Taro.getStorageSync(key)
    } catch (error) {
      console.error('获取存储失败:', error)
      return null
    }
  }

  // 删除存储
  static remove(key: string): void {
    try {
      Taro.removeStorageSync(key)
    } catch (error) {
      console.error('删除存储失败:', error)
    }
  }

  // 清空所有存储
  static clear(): void {
    try {
      Taro.clearStorageSync()
    } catch (error) {
      console.error('清空存储失败:', error)
    }
  }

  // 检查key是否存在
  static has(key: string): boolean {
    try {
      const data = Taro.getStorageSync(key)
      return data !== undefined && data !== null && data !== ''
    } catch (error) {
      return false
    }
  }
}

// 预定义的存储key
export const STORAGE_KEYS = {
  USER_TOKEN: 'userToken',
  USER_INFO: 'userInfo',
  COURSE_DATA: 'courseData',
  GRADE_DATA: 'gradeData',
  SEMESTER_LIST: 'semesterList',
  CURRENT_SEMESTER: 'currentSemester'
}
