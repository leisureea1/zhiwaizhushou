import { Component } from 'react'
import { View, Text, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { apiService } from '../../services/api'
import './index.scss'
const avatarLogo = require('../../assets/images/xisu-logo.png')

export default class ProfilePage extends Component {

  state = {
    isLoggedIn: false, // 登录状态
    userInfo: {
      name: '',
      studentId: '',
      college: '',
      major: '',
      className: ''
    },
    isFetching: false,
    // 基于原始 front/LoginPage.tsx 的设置项
    basicSettings: [
      { icon: 'key', title: '更新网办大厅密码', color: 'blue', action: 'updateJwxtPassword' },
      { icon: 'lock', title: '修改知外助手密码', color: 'green', action: 'changeAppPassword' }
    ],
    feedbackSettings: [
      { icon: 'headphones', title: '联系客服', color: 'blue', action: 'contact' },
      { icon: 'message', title: '提交意见', color: 'green', action: 'feedback' },
      { icon: 'shield', title: '隐私政策', color: 'gray', action: 'privacy' },
      { icon: 'info', title: '关于我们', color: 'orange', action: 'about' }
    ]
  }

  componentDidMount() {
    // 检查登录状态
    this.checkLoginStatus()
  }

  componentDidShow() {
    // 每次页面显示时检查登录状态
    this.checkLoginStatus()
  }

  // 分享配置
  onShareAppMessage() {
    return {
      title: '知外助手 - 校园生活服务平台',
      path: '/pages/index/index'
    }
  }

  // 分享到朋友圈配置
  onShareTimeline() {
    return {
      title: '知外助手 - 校园生活服务平台'
    }
  }

  // 检查登录状态
  checkLoginStatus = async () => {
    const token = Taro.getStorageSync('userToken')
    const userInfo = Taro.getStorageSync('userInfo')
    
    if (token && userInfo?.userId) {
      this.setState({ isLoggedIn: true })
      // 一直使用缓存；若切换账号则强制重新请求
      const uid = userInfo.userId
      const cacheKey = `user_detail_cache_${uid}`
      const cached = Taro.getStorageSync(cacheKey)
      const lastUid = Taro.getStorageSync('last_profile_uid')
      const switched = !!lastUid && lastUid !== uid

      // 若存在缓存且未切换账号，直接使用缓存并返回（不请求后端）
      if (cached && cached.data && !switched) {
        const updatedUserInfo = {
          ...userInfo,
          studentId: cached.data.student_code || userInfo.studentId,
          name: cached.data.name || userInfo.name,
          college: cached.data.department || '',
          major: cached.data.major || '',
          className: cached.data.class_name || ''
        }
        Taro.setStorageSync('userInfo', updatedUserInfo)
        this.setState({ userInfo: updatedUserInfo })
        return
      }

      // 切换账号或无缓存时，请求后端并写入缓存
      if (this.state.isFetching) return
      this.setState({ isFetching: true })
      try {
        const detailResponse = await apiService.getUserDetail(uid) as any
        if (detailResponse && (detailResponse.student_id || detailResponse.student_code || detailResponse.name)) {
          const updatedUserInfo = {
            ...userInfo,
            studentId: detailResponse.student_code || userInfo.studentId,
            name: detailResponse.name || userInfo.name,
            college: detailResponse.department || '',
            major: detailResponse.major || '',
            className: detailResponse.class_name || ''
          }
          Taro.setStorageSync('userInfo', updatedUserInfo)
          // 写入缓存（不再按天失效，仅覆盖）
          Taro.setStorageSync(cacheKey, { data: detailResponse, ts: Date.now() })
          // 记录最近一次展示详情的账号ID
          Taro.setStorageSync('last_profile_uid', uid)
          this.setState({ userInfo: updatedUserInfo })
        } else {
          this.setState({ userInfo: userInfo })
        }
      } catch (error) {
        console.error('获取用户详细信息失败:', error)
        // 若有缓存但因切换账号强制请求失败，则回退到缓存（如果存在）
        if (cached && cached.data) {
          const updatedUserInfo = {
            ...userInfo,
            studentId: cached.data.student_code || userInfo.studentId,
            name: cached.data.name || userInfo.name,
            college: cached.data.department || '',
            major: cached.data.major || '',
            className: cached.data.class_name || ''
          }
          Taro.setStorageSync('userInfo', updatedUserInfo)
          this.setState({ userInfo: updatedUserInfo })
        }
      } finally {
        this.setState({ isFetching: false })
      }
    } else {
      this.setState({ 
        isLoggedIn: false,
        userInfo: {
          name: '',
          studentId: '',
          college: '',
          major: '',
          className: ''
        }
      })
    }
  }

  // 登录/登出按钮点击
  onAuthClick = () => {
    if (this.state.isLoggedIn) {
      // 已登录，显示退出确认
      Taro.showModal({
        title: '确认退出',
        content: '确定要退出登录吗？',
        success: (res) => {
          if (res.confirm) {
            // 在移除前获取当前用户ID，用于清理缓存
            const curInfo = Taro.getStorageSync('userInfo')
            const uid = curInfo?.userId
            // 清理登录态
            Taro.removeStorageSync('userToken')
            Taro.removeStorageSync('userInfo')
            // 删除个人页缓存与最近账号标记
            try {
              if (uid) {
                const cacheKey = `user_detail_cache_${uid}`
                Taro.removeStorageSync(cacheKey)
              }
              Taro.removeStorageSync('last_profile_uid')
            } catch {}
            this.setState({ isLoggedIn: false })
            Taro.showToast({
              title: '已退出登录',
              icon: 'success'
            })
          }
        }
      })
    } else {
      // 未登录，跳转到登录页
      Taro.navigateTo({
        url: '/pages/login/index'
      })
    }
  }

  /** @param {string} action */
  onSettingClick = (action: string) => {
    switch (action) {
      case 'updateJwxtPassword':
        this.showUpdateJwxtPassword()
        break
      case 'changeAppPassword':
        this.showChangeAppPassword()
        break
      case 'contact':
        this.showComingSoon('联系客服')
        break
      case 'feedback':
        this.showComingSoon('意见反馈')
        break
      case 'privacy':
        Taro.navigateTo({ url: '/pages/privacy/index' })
        break
      case 'about':
        this.showAbout()
        break
      default:
        this.showComingSoon('功能')
    }
  }

  // 更新网办大厅密码
  showUpdateJwxtPassword = () => {
    if (!this.state.isLoggedIn) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    Taro.navigateTo({
      url: '/pages/update-jwxt-password/index'
    })
  }

  // 修改知外助手密码
  showChangeAppPassword = () => {
    if (!this.state.isLoggedIn) {
      Taro.showToast({
        title: '请先登录',
        icon: 'none'
      })
      return
    }

    Taro.navigateTo({
      url: '/pages/change-app-password/index'
    })
  }

  /** @param {string} feature */
  showComingSoon = (feature: string) => {
    Taro.showModal({
      title: '敬请期待',
      content: `${feature}功能即将上线`,
      showCancel: false
    })
  }

  showAbout = () => {
    Taro.showModal({
      title: '关于我们',
      content: '开发者：Leisure\n版本：1.0.0\n',
      showCancel: false
    })
  }

  // Base64编码函数（与AppIcon组件相同）
  base64Encode = (input: string) => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
    let str = input
    let output = ''
    let i = 0

    while (i < str.length) {
      const chr1 = str.charCodeAt(i++)
      const chr2Raw = str.charCodeAt(i++)
      const chr3Raw = str.charCodeAt(i++)

      const hasChr2 = !Number.isNaN(chr2Raw)
      const hasChr3 = !Number.isNaN(chr3Raw)
      const chr2 = hasChr2 ? chr2Raw : 0
      const chr3 = hasChr3 ? chr3Raw : 0

      const enc1 = chr1 >> 2
      const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
      let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
      let enc4 = chr3 & 63

      if (!hasChr2) {
        enc3 = 64
        enc4 = 64
      } else if (!hasChr3) {
        enc3 = ((chr2 & 15) << 2)
        enc4 = 64
      }

      output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4)
    }

    return output
  }

  // 转换SVG为Data URI
  toDataUri = (pathD: string, fillColor: string) => {
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${fillColor}'><path d='${pathD}'/></svg>`
    const base64 = this.base64Encode(svg)
    return `data:image/svg+xml;base64,${base64}`
  }

  // 渲染SVG图标
  renderIcon = (iconName: string, colorClass: string) => {
    // 颜色映射
    const colorMap: Record<string, string> = {
      blue: '#3b82f6',
      green: '#10b981',
      gray: '#6b7280',
      orange: '#f97316'
    }
    
    const fillColor = colorMap[colorClass] || '#3b82f6'
    
    const iconMap: Record<string, string> = {
      key: this.toDataUri("M7 14a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2h-3.586l-3 3H9v-3H7Zm2-2h3v1.414l1.293-1.293L13.586 12H17V5H7v7Zm2-5h6v2h-6V7Z", fillColor),
      lock: this.toDataUri("M12 3a5 5 0 0 1 5 5v1h1a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h1V8a5 5 0 0 1 5-5Zm3 6V8a3 3 0 1 0-6 0v1h6Zm-3 4a2 2 0 0 1 1 3.732V18h-2v-1.268A2 2 0 0 1 12 13Z", fillColor),
      headphones: this.toDataUri("M12 3a9 9 0 0 0-9 9v6a3 3 0 0 0 3 3h2v-8H5v-1a7 7 0 0 1 14 0v1h-3v8h2a3 3 0 0 0 3-3v-6a9 9 0 0 0-9-9Z", fillColor),
      message: this.toDataUri("M4 4h16a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H6.414l-3.707 3.707A1 1 0 0 1 1 22.707V6a2 2 0 0 1 2-2h1Zm0 2v12.586l1.293-1.293L6 16.586 6.586 16H20V6H4Zm4 3h8v2H8V9Zm0 4h6v2H8v-2Z", fillColor),
      shield: this.toDataUri("M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4Zm7 10c0 4.52-2.98 8.69-7 9.93-4.02-1.24-7-5.41-7-9.93V6.3l7-3.11 7 3.11V11Z", fillColor),
      info: this.toDataUri("M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm0 3a1 1 0 0 1 1 1v1a1 1 0 1 1-2 0V8a1 1 0 0 1 1-1Zm0 4a1 1 0 0 1 1 1v4a1 1 0 1 1-2 0v-4a1 1 0 0 1 1-1Z", fillColor)
    }
    
    return iconMap[iconName] || iconMap.info
  }

  render() {
    const { isLoggedIn, userInfo, basicSettings, feedbackSettings } = this.state

    return (
      <View className="profile-page">
        {/* 状态栏占位 */}
        <View className="status-bar-placeholder"></View>
        
        {/* 顶部标题栏 */}
        <View className="header">
          <Text className="title">知外助手</Text>
          <View className="auth-button" onClick={this.onAuthClick}>
            <Text className="auth-text">{isLoggedIn ? '登出' : '登录'}</Text>
          </View>
        </View>

        {/* 用户信息区域 */}
        <View className="user-info-card">
          <View className="avatar-container">
            <View className="avatar-bg">
              <Image className="avatar-img" src={(Taro.getStorageSync('userInfo')||{}).avatarUrl || avatarLogo} mode="aspectFill" />
            </View>
          </View>
          <View className="user-details">
            {isLoggedIn ? (
              <>
              <View className="info-row">
                
                <Text className="label">姓名：{userInfo.name || '未设置'}</Text>
              </View>
                <View className="info-row">
                  
                  <Text className="label">学院：{userInfo.college || '未设置'}</Text>
                </View>
                <View className="info-row">
                  
                  <Text className="label">专业：{userInfo.major || '未设置'}</Text>
                </View>
                <View className="info-row">
                  
                  <Text className="label">班级：{userInfo.className || '未设置'}</Text>
                </View>
              </>
            ) : (
              <>
              <View className="info-row">
              
                <Text className="label">姓名：</Text>
              </View>
            <View className="info-row">
                
              <Text className="label">学院：</Text>
            </View>
            <View className="info-row">
              <Text className="label">专业：</Text>
            </View>
            <View className="info-row">
                
              <Text className="label">班级：</Text>
            </View>
              </>
            )}
          </View>
        </View>

        {/* 基础设置 */}
        <View className="settings-section">
          <Text className="section-title">基础设置</Text>
          <View className="settings-card">
            {basicSettings.map((item, index) => (
              <View 
                key={index} 
                className={`setting-item ${index !== basicSettings.length - 1 ? 'with-border' : ''}`}
                onClick={() => this.onSettingClick(item.action)}
              >
                <View className="setting-left">
                  <Image 
                    className={`setting-icon ${item.color}`}
                    src={this.renderIcon(item.icon, item.color)}
                    mode="aspectFit"
                  />
                  <Text className="setting-title">{item.title}</Text>
                </View>
                <Text className="setting-arrow">{'>'}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* 应用反馈 */}
        <View className="settings-section">
          <Text className="section-title">应用反馈</Text>
          <View className="settings-card">
            {feedbackSettings.map((item, index) => (
              item.action === 'contact' ? (
                <View 
                  key={index}
                  className={`setting-item ${index !== feedbackSettings.length - 1 ? 'with-border' : ''}`}
                  style={{ position: 'relative' }}
                >
                  <View className="setting-left">
                    <Image 
                      className={`setting-icon ${item.color}`}
                      src={this.renderIcon(item.icon, item.color)}
                      mode="aspectFit"
                    />
                    <Text className="setting-title">{item.title}</Text>
                  </View>
                  <Text className="setting-arrow">{'>'}</Text>
                  {/* 透明覆盖按钮，不改变视觉样式 */}
                  <Button
                    openType='contact'
                    hoverClass='none'
                    style={'position:absolute;top:0;left:0;right:0;bottom:0;opacity:0;background:transparent;padding:0;margin:0;border:none;'}
                    sessionFrom={JSON.stringify({ from: 'profile', userId: this.state.userInfo?.studentId || '', name: this.state.userInfo?.name || '' })}
                  >
                    {/* 占位，避免按钮内部空导致点击区域异常 */}
                    <Text style={{ opacity: 0 }}>contact</Text>
                  </Button>
                </View>
              ) : (
                <View 
                  key={index} 
                  className={`setting-item ${index !== feedbackSettings.length - 1 ? 'with-border' : ''}`}
                  onClick={() => this.onSettingClick(item.action)}
                >
                  <View className="setting-left">
                    <Image 
                      className={`setting-icon ${item.color}`}
                      src={this.renderIcon(item.icon, item.color)}
                      mode="aspectFit"
                    />
                    <Text className="setting-title">{item.title}</Text>
                  </View>
                  <Text className="setting-arrow">{'>'}</Text>
                </View>
              )
            ))}
          </View>
        </View>
      </View>
    )
  }
}
