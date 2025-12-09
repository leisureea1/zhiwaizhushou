import { Component, PropsWithChildren } from 'react'
import Taro from '@tarojs/taro'
import { apiService } from './services/api'
import { avatarUploadService } from './services/avatarUploadService'
import './app.scss'

class App extends Component<PropsWithChildren> {
  /**
   * 加载功能配置
   */
  loadFeatureSettings = async () => {
    try {
      const response: any = await apiService.getFeatureSettings()
      if (response.success && response.data) {
        // 将功能配置存储到本地
        Taro.setStorageSync('featureSettings', response.data)
        console.log('功能配置已加载:', response.data)
      } else {
        // 后端返回了响应但没有数据，使用默认配置（全部禁用）
        console.warn('后端未返回功能配置数据，默认禁用所有功能')
        Taro.setStorageSync('featureSettings', {
          flea_market: { enabled: false, message: '跳蚤市场功能已下线' },
          lost_found: { enabled: false, message: '失物招领功能已下线' }
        })
      }
    } catch (error) {
      console.error('加载功能配置失败:', error)
      // 网络错误或后端异常时，使用默认配置（全部禁用）
      Taro.setStorageSync('featureSettings', {
        flea_market: { enabled: false, message: '跳蚤市场功能已下线' },
        lost_found: { enabled: false, message: '失物招领功能已下线' }
      })
    }
  }

  /**
   * 更新用户活跃状态
   */
  updateUserActivity = async () => {
    try {
      const token = Taro.getStorageSync('userToken')
      const userInfo = Taro.getStorageSync('userInfo')
      
      if (token && userInfo && userInfo.userId) {
        // 调用后端接口更新最后登录时间和IP
        await apiService.updateUserActivity(userInfo.userId)
        console.log('用户活跃状态已更新')
      }
    } catch (error) {
      console.error('更新用户活跃状态失败:', error)
      // 静默失败，不影响用户体验
    }
  }

  componentDidMount() {
    // 标注一次应用启动ID，用于控制“每次启动仅弹一次”
    try {
      Taro.setStorageSync('appLaunchId', Date.now())
    } catch {}

    // 应用启动时加载功能配置
    this.loadFeatureSettings()
    
    // 应用启动时，尝试使用上次账号无感登录（仅刷新token与本地信息，不跳转）
    try {
      const token = Taro.getStorageSync('userToken')
      const userInfo = Taro.getStorageSync('userInfo')
      if (token && userInfo) {
        // 可在此添加"静默续期"逻辑；当前仅作为占位，确保启动就具备登录态
        // 更新用户活跃状态
        this.updateUserActivity()
        
        // 启动头像上传后台服务
        avatarUploadService.start()
      }
    } catch {}
  }

  componentDidShow() {
    // 每次小程序从后台进入前台时，也更新活跃状态
    this.updateUserActivity()
    
    // 检查是否需要启动头像上传服务
    try {
      const token = Taro.getStorageSync('userToken')
      if (token) {
        avatarUploadService.start()
      }
    } catch {}
  }

  componentDidHide() {}
  
  componentWillUnmount() {
    // 应用卸载时停止服务
    avatarUploadService.stop()
  }

  render() {
    // 注意这里，在 Taro 中，不需要渲染任何内容
    // 各个页面会自动根据路由进行渲染
    return this.props.children
  }
}

export default App
