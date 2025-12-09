import { Component } from 'react'
import { View, Text, Input, Button, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { apiService, API_BASE_URL } from '../../services/api'
import { avatarUploadService } from '../../services/avatarUploadService'
import './index.scss'

export default class LoginPage extends Component {

  state = {
    mode: 'login', // 'login' 或 'register'
    username: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    jwxtPassword: '',
    avatarUrl: '',
    isLoading: false,
    passwordStrength: 0, // 0: 未输入, 1: 弱, 2: 中, 3: 强
    passwordError: '',
    isVerifying: false // 正在验证学号密码
  }

  componentDidMount() {
    // 检查是否已登录
    const token = Taro.getStorageSync('userToken')
    if (token) {
      // 已登录，返回上一页
      Taro.switchTab({ url: '/pages/schedule/index' })
    }
  }

  switchMode = () => {
    this.setState({
      mode: this.state.mode === 'login' ? 'register' : 'login',
      username: '',
      password: '',
      confirmPassword: '',
      studentId: '',
      jwxtPassword: '',
      avatarUrl: ''
    })
  }

  onForgotPassword = () => {
    Taro.navigateTo({
      url: '/pages/forgot-password/index'
    })
  }

  onUsernameChange = (e: any) => {
    this.setState({ username: e.detail.value })
  }

  // 检查密码强度
  checkPasswordStrength = (password: string) => {
    if (!password) {
      return { strength: 0, error: '' }
    }

    let strength = 0
    let error = ''

    // 长度检查
    if (password.length < 8) {
      error = '密码长度至少8位'
      return { strength: 0, error }
    }

    // 包含小写字母
    if (/[a-z]/.test(password)) strength++
    // 包含大写字母
    if (/[A-Z]/.test(password)) strength++
    // 包含数字
    if (/[0-9]/.test(password)) strength++
    // 包含特殊字符
    if (/[^a-zA-Z0-9]/.test(password)) strength++

    // 至少包含3种类型才算合格
    if (strength < 3) {
      error = '密码需包含大小写字母、数字、特殊字符中的至少3种'
      return { strength: 1, error }
    }

    // 强度评级
    if (strength === 3) {
      return { strength: 2, error: '' }
    } else if (strength === 4) {
      return { strength: 3, error: '' }
    }

    return { strength: 1, error }
  }

  onPasswordChange = (e: any) => {
    const password = e.detail.value
    const { strength, error } = this.checkPasswordStrength(password)
    this.setState({ 
      password,
      passwordStrength: strength,
      passwordError: error
    })
  }

  onConfirmPasswordChange = (e: any) => {
    this.setState({ confirmPassword: e.detail.value })
  }

  onStudentIdChange = (e: any) => {
    this.setState({ studentId: e.detail.value })
  }

  onJwxtPasswordChange = (e: any) => {
    this.setState({ jwxtPassword: e.detail.value })
  }

  // 获取微信头像(用户确认授权后)
  getWeChatAvatar = async () => {
    try {
      // 使用 open-type=chooseAvatar 的返回事件更稳妥,但在React中我们通过调用 chooseMedia 兜底
      const res: any = await Taro.chooseMedia({ count: 1, mediaType: ['image'], sourceType: ['album', 'camera'] })
      const tempPath = res?.tempFiles?.[0]?.tempFilePath
      if (!tempPath) throw new Error('未选择图片')
      
      console.log('[头像上传] 选择的图片路径:', tempPath)
      
      Taro.showLoading({ title: '上传头像中...', mask: true })
      
      // 头像属于公共用途,允许使用 public=1 上传
      // 不要手动设置 Content-Type,让微信自动处理
      const upload = await Taro.uploadFile({
        url: `${API_BASE_URL}/api/upload/image?public=1`,
        filePath: tempPath,
        name: 'file'
      })
      
      console.log('[头像上传] 上传响应状态:', upload.statusCode)
      console.log('[头像上传] 上传响应数据:', upload.data)
      
      Taro.hideLoading()
      
      const data = typeof upload.data === 'string' ? JSON.parse(upload.data) : upload.data
      
      if (upload.statusCode !== 200) {
        throw new Error(data?.error || `上传失败: ${upload.statusCode}`)
      }
      
      if (!data?.url) {
        throw new Error('未返回URL')
      }
      
      console.log('[头像上传] 上传成功,URL:', data.url)
      
      this.setState({ avatarUrl: data.url })
      Taro.showToast({ title: '头像已设置', icon: 'success' })
    } catch (e: any) {
      Taro.hideLoading()
      console.error('[头像上传] 失败:', e)
      Taro.showToast({ 
        title: e.message || '获取头像失败或已取消', 
        icon: 'none',
        duration: 3000
      })
    }
  }

  // 从临时路径上传（配合 open-type=chooseAvatar 的 e.detail.avatarUrl）
  getWeChatAvatarFromTemp = async (tempPath: string) => {
    try {
      Taro.showLoading({ title: '上传头像中...', mask: true })
      
      // 使用全局服务上传
      const uploadedUrl = await avatarUploadService['uploadAvatarToServer'](tempPath)
      
      Taro.hideLoading()
      
      if (uploadedUrl) {
        this.setState({ avatarUrl: uploadedUrl })
        Taro.showToast({ title: '头像已上传', icon: 'success', duration: 1500 })
      } else {
        // 上传失败，保存临时路径，稍后后台重试
        this.setState({ avatarUrl: tempPath })
        Taro.showToast({ title: '头像已选择，将在后台上传', icon: 'none', duration: 2000 })
      }
    } catch (error) {
      console.error('上传头像失败:', error)
      Taro.hideLoading()
      // 即使失败也保存临时路径，注册后后台上传
      this.setState({ avatarUrl: tempPath })
      Taro.showToast({ title: '头像已选择，将在后台上传', icon: 'none', duration: 2000 })
    }
  }

  // 确保头像已上传到服务器（返回服务器URL或临时路径）
  ensureAvatarUploaded = async (): Promise<string> => {
    const { avatarUrl } = this.state
    
    // 如果没有头像
    if (!avatarUrl) {
      throw new Error('请先选择头像')
    }
    
    // 如果已经是HTTP URL，直接返回
    if (/^https?:\/\//i.test(avatarUrl)) {
      return avatarUrl
    }
    
    // 如果是临时路径，尝试上传（不阻塞注册）
    try {
      const uploadedUrl = await avatarUploadService['uploadAvatarToServer'](avatarUrl)
      if (uploadedUrl) {
        // 上传成功，更新state
        this.setState({ avatarUrl: uploadedUrl })
        return uploadedUrl
      }
    } catch (error) {
      console.error('上传头像失败，将在后台重试:', error)
    }
    
    // 上传失败或超时，返回临时路径，注册后后台上传
    console.log('头像将在后台上传')
    return avatarUrl
  }

  // 验证学号和密码,并获取真实姓名
  verifyJwxtCredentials = async (studentId: string, jwxtPassword: string): Promise<{ valid: boolean; name?: string }> => {
    try {
      this.setState({ isVerifying: true })
      
      // 调用后端验证接口
      const response = await apiService.verifyJwxtCredentials(studentId, jwxtPassword) as any
      
      if (response.valid === true) {
        // 验证成功后,获取用户信息以得到真实姓名
        try {
          const userInfo = await apiService.getUserInfoFromJwxt(studentId, jwxtPassword) as any
          return { valid: true, name: userInfo.name || '' }
        } catch (error) {
          console.error('获取用户姓名失败:', error)
          return { valid: true, name: '' }
        }
      }
      
      return { valid: false }
    } catch (error: any) {
      console.error('验证学号密码失败:', error)
      throw error
    } finally {
      this.setState({ isVerifying: false })
    }
  }

  onSubmit = async () => {
    const { mode, username, password, confirmPassword, studentId, jwxtPassword, passwordStrength, passwordError } = this.state

    if (!username || !password) {
      Taro.showToast({
        title: '请填写完整信息',
        icon: 'none'
      })
      return
    }

    if (mode === 'register') {
      // 验证头像是否已选择
      if (!this.state.avatarUrl) {
        Taro.showToast({
          title: '请先选择头像',
          icon: 'none'
        })
        return
      }

      // 验证密码强度
      if (passwordError) {
        Taro.showToast({
          title: passwordError,
          icon: 'none',
          duration: 2000
        })
        return
      }

      if (passwordStrength < 2) {
        Taro.showToast({
          title: '密码强度不够，请设置更复杂的密码',
          icon: 'none',
          duration: 2000
        })
        return
      }

      if (!studentId || !jwxtPassword) {
        Taro.showToast({
          title: '请填写学号和网办大厅密码',
          icon: 'none'
        })
        return
      }

      if (password !== confirmPassword) {
        Taro.showToast({
          title: '两次密码不一致',
          icon: 'none'
        })
        return
      }

      // 验证学号和网办大厅密码
      Taro.showLoading({
        title: '验证学号密码中...',
        mask: true
      })

      try {
        const verifyResult = await this.verifyJwxtCredentials(studentId, jwxtPassword)
        
        Taro.hideLoading()

        if (!verifyResult.valid) {
          Taro.showModal({
            title: '验证失败',
            content: '学号或网办大厅密码错误，请检查后重试',
            showCancel: false
          })
          return
        }

        // 检查是否成功获取到真实姓名
        if (!verifyResult.name) {
          Taro.showModal({
            title: '获取信息失败',
            content: '无法从教务系统获取您的姓名信息，请稍后重试',
            showCancel: false
          })
          return
        }

        // 继续注册,传入真实姓名
        this.setState({ isLoading: true })

        try {
          // 确保头像已上传到服务器
          const uploadedAvatarUrl = await this.ensureAvatarUploaded()
          
          const response = await apiService.register({
            username,  // 用户自定义的用户名
            name: verifyResult.name,  // 从教务系统获取的真实姓名
            password,
            studentId, // 学号（教务系统账号）
            jwxtPassword, // 网办大厅密码
            avatarUrl: uploadedAvatarUrl
          }) as any

          Taro.showToast({
            title: '注册成功',
            icon: 'success'
          })
          
          // 注册成功后，如果头像是临时路径，启动后台上传服务
          if (uploadedAvatarUrl && avatarUploadService.isLocalTempPath(uploadedAvatarUrl)) {
            console.log('[注册] 检测到临时头像，准备在登录后启动后台上传')
            // 保存临时头像到本地存储，等待用户登录后自动上传
            try {
              const tempUserInfo = {
                avatarUrl: uploadedAvatarUrl
              }
              Taro.setStorageSync('pendingAvatarUpload', tempUserInfo)
            } catch (error) {
              console.error('[注册] 保存临时头像信息失败:', error)
            }
          }
          
          this.setState({
            mode: 'login',
            username: '',
            password: '',
            confirmPassword: '',
            studentId: '',
            jwxtPassword: '',
            passwordStrength: 0,
            passwordError: '',
            isLoading: false
          })
          return
        } catch (error: any) {
          console.error('注册错误:', error)
          Taro.showToast({
            title: error.message || '注册失败',
            icon: 'none',
            duration: 2000
          })
          this.setState({ isLoading: false })
          return
        }
      } catch (error: any) {
        Taro.hideLoading()
        Taro.showModal({
          title: '验证失败',
          content: error.message || '无法验证学号密码，请稍后重试',
          showCancel: false
        })
        return
      }
    }

    // 登录逻辑
    if (mode === 'login') {
      this.setState({ isLoading: true })

      try {
        // 调用登录API
        const response = await apiService.login(username, password) as any

        // 保存登录信息
        Taro.setStorageSync('userToken', response.token)
        
        // 检查是否有待上传的临时头像（来自注册）
        let finalAvatarUrl = response.avatar_url || this.state.avatarUrl || ''
        try {
          const pendingAvatar = Taro.getStorageSync('pendingAvatarUpload')
          if (pendingAvatar && pendingAvatar.avatarUrl) {
            console.log('[登录] 发现待上传的临时头像:', pendingAvatar.avatarUrl)
            finalAvatarUrl = pendingAvatar.avatarUrl
            // 清除临时标记
            Taro.removeStorageSync('pendingAvatarUpload')
          }
        } catch (error) {
          console.error('[登录] 检查待上传头像失败:', error)
        }
        
        Taro.setStorageSync('userInfo', {
          userId: response.user_id,
          studentId: response.student_id,
          // 小程序账户用户名（用于"我的"等展示）
          username: this.state.username,
          // 兼容后端返回的姓名（如卡片 publisher_name）
          name: response.name,
          role: response.role,
          eduUsername: response.edu_system_username,
          eduPassword: response.edu_system_password,
          avatarUrl: finalAvatarUrl
        })
        
        // 如果头像是临时路径，立即启动后台上传服务
        if (finalAvatarUrl && avatarUploadService.isLocalTempPath(finalAvatarUrl)) {
          console.log('[登录] 启动头像后台上传服务')
          avatarUploadService.start()
        }

        Taro.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })

        setTimeout(() => {
          // 通知各页刷新并解除未登录提示
          try {
            Taro.setStorageSync('refresh_flea_market', Date.now())
            Taro.setStorageSync('refresh_lost_found', Date.now())
          } catch {}
          // 统一回到首页（tabBar）
          Taro.switchTab({ url: '/pages/schedule/index' })
        }, 800)

      } catch (error: any) {
        console.error('登录错误:', error)
        Taro.showToast({
          title: error.message || '登录失败',
          icon: 'none',
          duration: 2000
        })
      } finally {
        this.setState({ isLoading: false })
      }
    }
  }

  render() {
    const { mode, username, password, confirmPassword, studentId, jwxtPassword, isLoading, passwordStrength, passwordError } = this.state

    return (
      <View className="auth-page">
        {/* 顶部装饰 */}
        <View className="auth-header">
          <View className="header-decoration"></View>
          <View className="header-content">
            <Text className="app-logo">🎓</Text>
            <Text className="app-title">知外助手</Text>
            <Text className="app-subtitle">{mode === 'login' ? '欢迎回来' : '创建账号'}</Text>
          </View>
        </View>

        {/* 表单区域 */}
        <View className="auth-form">
          <View className="form-container">
            {/* 模式切换标签 */}
            <View className="mode-tabs">
              <View 
                className={`mode-tab ${mode === 'login' ? 'active' : ''}`}
                onClick={() => this.setState({ mode: 'login' })}
              >
                <Text className="tab-text">登录</Text>
                {mode === 'login' && <View className="tab-indicator"></View>}
              </View>
              <View 
                className={`mode-tab ${mode === 'register' ? 'active' : ''}`}
                onClick={() => this.setState({ mode: 'register' })}
              >
                <Text className="tab-text">注册</Text>
                {mode === 'register' && <View className="tab-indicator"></View>}
              </View>
            </View>

            {/* 注册头像：放在容器内顶部，圆形且可点击，无多余文字 */}
            {mode === 'register' && (
              <View className='avatar-top' style={{display:'flex',justifyContent:'center',marginTop:'20rpx',marginBottom:'8rpx'}}>
                <Button
                  openType='chooseAvatar'
                  onChooseAvatar={(e:any)=>{ const p=e?.detail?.avatarUrl; if(p){ this.setState({ avatarUrl: p }); this.getWeChatAvatarFromTemp(p); } }}
                  style={{ width:'160rpx', height:'160rpx', borderRadius:'80rpx', overflow:'hidden', padding:0, background:'#f3f4f6', border:'2rpx solid #e5e7eb' }}
                >
                  {this.state.avatarUrl ? (
                    <Image src={this.state.avatarUrl} style={{ width:'160rpx', height:'160rpx' }} mode='aspectFill' />
                  ) : (
                    <View style={{width:'160rpx',height:'160rpx',display:'flex',alignItems:'center',justifyContent:'center'}}>
                      <Text style={{fontSize:'60rpx',color:'#9ca3af'}}>👤</Text>
                    </View>
                  )}
                </Button>
              </View>
            )}

            {/* 登录/注册表单 */}
            <View className="form-fields">
              <View className="form-item">
                <View className="input-label">
                  <Text className="label-icon">👤</Text>
                  <Text className="label-text">用户名</Text>
                </View>
                <Input
                  type="text"
                  placeholder={mode === 'register' ? '只能大小写字母、数字' : '请输入用户名'}
                  value={username}
                  onInput={this.onUsernameChange}
                  className="form-input"
                  placeholderClass="input-placeholder"
                />
              </View>

              <View className="form-item">
                <View className="input-label">
                  <Text className="label-icon">🔒</Text>
                  <Text className="label-text">密码</Text>
                </View>
                <Input
                  type="text"
                  password
                  placeholder={mode === 'register' ? '至少8位，包含大小写字母、数字' : '请输入密码'}
                  value={password}
                  onInput={this.onPasswordChange}
                  className="form-input"
                  placeholderClass="input-placeholder"
                />
                {mode === 'register' && password && (
                  <View className="password-strength-container">
                    <View className="strength-bars">
                      <View className={`strength-bar ${passwordStrength >= 1 ? 'weak' : ''}`}></View>
                      <View className={`strength-bar ${passwordStrength >= 2 ? 'medium' : ''}`}></View>
                      <View className={`strength-bar ${passwordStrength >= 3 ? 'strong' : ''}`}></View>
                    </View>
                    <Text className={`strength-text ${passwordError ? 'error' : ''}`}>
                      {passwordError || (passwordStrength === 1 ? '弱' : passwordStrength === 2 ? '中等' : passwordStrength === 3 ? '强' : '')}
                    </Text>
                  </View>
                )}
              </View>

              {mode === 'register' && (
                <>
                  <View className="form-item">
                    <View className="input-label">
                      <Text className="label-icon">🔐</Text>
                      <Text className="label-text">确认密码</Text>
                    </View>
                    <Input
                      type="text"
                      password
                      placeholder="请再次输入密码"
                      value={confirmPassword}
                      onInput={this.onConfirmPasswordChange}
                      className="form-input"
                      placeholderClass="input-placeholder"
                    />
                  </View>

                  <View className="form-item">
                    <View className="input-label">
                      <Text className="label-icon">🎓</Text>
                      <Text className="label-text">学号</Text>
                    </View>
                    <Input
                      type="text"
                      placeholder="请输入学号"
                      value={studentId}
                      onInput={this.onStudentIdChange}
                      className="form-input"
                      placeholderClass="input-placeholder"
                    />
                  </View>

                  <View className="form-item">
                    <View className="input-label">
                      <Text className="label-icon">🔑</Text>
                      <Text className="label-text">网办大厅密码</Text>
                    </View>
                    <Input
                      type="text"
                      password
                      placeholder="请输入网办大厅密码"
                      value={jwxtPassword}
                      onInput={this.onJwxtPasswordChange}
                      className="form-input"
                      placeholderClass="input-placeholder"
                    />
                  </View>
                </>
              )}
            </View>

            {/* 提交按钮 */}
            <View className="submit-section">
              <View 
                className={`submit-button ${isLoading ? 'loading' : ''}`}
                onClick={this.onSubmit}
              >
                <Text className="submit-text">
                  {isLoading ? (mode === 'register' ? '注册中...' : '登录中...') : (mode === 'register' ? '注册' : '登录')}
                </Text>
              </View>
              {mode === 'login' && (
                <View className="forgot-password-link" onClick={this.onForgotPassword}>
                  <Text className="link-text">忘记密码？</Text>
                </View>
              )}
            </View>

            {/* 提示信息 */}
            <View className="form-tips">
              <Text className="tip-item">💡 {mode === 'login' ? '首次使用请先注册账号' : '已有账号？点击上方登录'}</Text>
              {mode === 'register' && (
                <Text className="tip-item">🔑 网办大厅密码用于自动获取课表和成绩</Text>
              )}
              <Text className="tip-item">🔒 您的信息将安全保存在本地</Text>
            </View>
          </View>
        </View>
      </View>
    )
  }
}