import Taro from '@tarojs/taro'
import { API_BASE_URL } from './api'

/**
 * 头像上传后台服务
 * 负责检测并上传本地临时头像到服务器
 */
class AvatarUploadService {
  private uploadCheckTimer: any = null
  private isRunning: boolean = false

  /**
   * 检测路径是否为本地临时路径
   */
  isLocalTempPath(path: string): boolean {
    if (!path) return false
    
    // 检查是否为真正的服务器 URL（包含域名或 IP）
    // 真正的服务器 URL 格式: http://domain.com/... 或 http://192.168.1.1/...
    const serverUrlPattern = /^https?:\/\/([a-zA-Z0-9.-]+|\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?\//
    if (serverUrlPattern.test(path)) {
      // 进一步确认：如果 URL 中包含 API_BASE_URL 的域名，则是服务器路径
      if (path.startsWith(API_BASE_URL) || path.includes('://')) {
        const urlObj = new URL(path)
        // 如果有真实的主机名（不是 tmp），则是服务器 URL
        if (urlObj.hostname && urlObj.hostname !== 'tmp') {
          return false
        }
      }
    }
    
    // 微信开发者工具模拟的临时路径：http://tmp/...
    if (path.startsWith('http://tmp/') || path.startsWith('https://tmp/')) {
      return true
    }
    
    // 微信真机临时文件路径特征
    return (
      path.startsWith('wxfile://') ||
      path.includes('/tmp_') ||
      path.includes('/temp/') ||
      path.includes('tmpfile') ||
      // 如果不以 http 开头，可能是本地路径
      (!path.startsWith('http://') && !path.startsWith('https://'))
    )
  }

  /**
   * 启动后台上传检测服务
   */
  start() {
    if (this.isRunning) return
    
    console.log('[AvatarUploadService] 启动头像上传检测服务')
    this.isRunning = true

    // 立即检测一次
    this.checkAndUploadAvatar()

    // 每30秒检测一次
    this.uploadCheckTimer = setInterval(() => {
      this.checkAndUploadAvatar()
    }, 30000)
  }

  /**
   * 停止后台上传检测服务
   */
  stop() {
    if (!this.isRunning) return
    
    console.log('[AvatarUploadService] 停止头像上传检测服务')
    this.isRunning = false

    if (this.uploadCheckTimer) {
      clearInterval(this.uploadCheckTimer)
      this.uploadCheckTimer = null
    }
  }

  /**
   * 检测并上传临时头像
   */
  private async checkAndUploadAvatar() {
    try {
      console.log('[AvatarUploadService] 开始检测头像...')
      const userInfo = Taro.getStorageSync('userInfo')
      
      if (!userInfo) {
        console.log('[AvatarUploadService] 未找到用户信息')
        return
      }
      
      if (!userInfo.avatarUrl) {
        console.log('[AvatarUploadService] 用户信息中无头像URL')
        return
      }

      const avatarUrl = userInfo.avatarUrl
      console.log('[AvatarUploadService] 当前头像路径:', avatarUrl)
      
      const isTemp = this.isLocalTempPath(avatarUrl)
      console.log('[AvatarUploadService] 是否为临时路径:', isTemp)

      // 如果不是临时路径，停止检测
      if (!isTemp) {
        console.log('[AvatarUploadService] 头像已是服务器URL，停止检测')
        this.stop()
        return
      }

      // 尝试上传临时文件
      console.log('[AvatarUploadService] 检测到临时头像，尝试上传...')
      const uploadedUrl = await this.uploadAvatarToServer(avatarUrl)

      if (uploadedUrl) {
        // 上传成功，更新本地存储
        userInfo.avatarUrl = uploadedUrl
        Taro.setStorageSync('userInfo', userInfo)
        console.log('[AvatarUploadService] 头像上传成功，已更新本地存储:', uploadedUrl)

        // 停止检测
        this.stop()

        // 可选：调用后端接口更新用户头像
        try {
          const userId = userInfo.userId || userInfo.uid
          if (userId) {
            await this.updateUserAvatarOnServer(userId, uploadedUrl)
            console.log('[AvatarUploadService] 已同步更新服务器用户头像')
          }
        } catch (error) {
          console.error('[AvatarUploadService] 更新服务器用户头像失败:', error)
        }
      } else {
        console.log('[AvatarUploadService] 上传失败，将在下次重试')
      }
    } catch (error) {
      console.error('[AvatarUploadService] 后台上传头像异常:', error)
      // 静默失败，下次继续尝试
    }
  }

  /**
   * 上传头像到服务器
   */
  private async uploadAvatarToServer(filePath: string): Promise<string | null> {
    try {
      const token = Taro.getStorageSync('userToken')
      const headers: any = {}
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const upload = await Taro.uploadFile({
        url: `${API_BASE_URL}/api/upload/image?public=1`,
        filePath: filePath,
        name: 'file',
        header: headers
      })
      
      const data = typeof upload.data === 'string' ? JSON.parse(upload.data) : upload.data
      return data?.url || null
    } catch (error) {
      console.error('[AvatarUploadService] 上传失败:', error)
      return null
    }
  }

  /**
   * 更新服务器用户头像
   */
  private async updateUserAvatarOnServer(userId: string, avatarUrl: string): Promise<void> {
    try {
      const token = Taro.getStorageSync('userToken')
      const headers: any = {
        'Content-Type': 'application/json'
      }
      if (token) {
        headers['Authorization'] = `Bearer ${token}`
      }

      const response = await Taro.request({
        url: `${API_BASE_URL}/api/user/update-avatar`,
        method: 'POST',
        header: headers,
        data: {
          user_id: userId,
          avatar_url: avatarUrl
        }
      })

      if (response.statusCode !== 200) {
        throw new Error(response.data?.error || '更新头像失败')
      }

      console.log('[AvatarUploadService] 服务器数据库头像已更新')
    } catch (error) {
      console.error('[AvatarUploadService] 更新服务器头像失败:', error)
      throw error
    }
  }
}

// 导出单例
export const avatarUploadService = new AvatarUploadService()
