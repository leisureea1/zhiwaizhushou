import { Component } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { apiService } from '../../services/api'
import './index.scss'

export default class LoginPage extends Component {

  state = {
    mode: 'login', // 'login' 或 'register'
    username: '',
    password: '',
    confirmPassword: '',
    studentId: '',
    jwxtPassword: '',
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
      Taro.navigateBack()
    }
  }

  switchMode = () => {
    this.setState({
      mode: this.state.mode === 'login' ? 'register' : 'login',
      username: '',
      password: '',
      confirmPassword: '',
      studentId: '',
      jwxtPassword: ''
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

  // 验证学号和密码
  verifyJwxtCredentials = async (studentId: string, jwxtPassword: string) => {
    try {
      this.setState({ isVerifying: true })
      
      // 调用后端验证接口
      const response = await apiService.verifyJwxtCredentials(studentId, jwxtPassword) as any
      
      return response.valid === true
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
        const isValid = await this.verifyJwxtCredentials(studentId, jwxtPassword)
        
        Taro.hideLoading()

        if (!isValid) {
          Taro.showModal({
            title: '验证失败',
            content: '学号或网办大厅密码错误，请检查后重试',
            showCancel: false
          })
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

    this.setState({ isLoading: true })

    try {
      if (mode === 'register') {
        // 调用注册API
        const response = await apiService.register({
          username,
          password,
          studentId,
          jwxtPassword
        }) as any

        Taro.showToast({
          title: '注册成功',
          icon: 'success'
        })
        
        // 切换到登录模式
        this.setState({
          mode: 'login',
          username: '',
          password: '',
          confirmPassword: '',
          studentId: '',
          jwxtPassword: '',
          passwordStrength: 0,
          passwordError: ''
        })
      } else {
        // 调用登录API
        const response = await apiService.login(username, password) as any

        // 保存登录信息
        Taro.setStorageSync('userToken', response.token)
        Taro.setStorageSync('userInfo', {
          userId: response.user_id,
          studentId: response.student_id,
          name: response.name,
          role: response.role,
          eduUsername: response.edu_system_username,
          eduPassword: response.edu_system_password
        })

        Taro.showToast({
          title: '登录成功',
          icon: 'success',
          duration: 1500
        })

        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      }

    } catch (error: any) {
      console.error(`${mode === 'register' ? '注册' : '登录'}错误:`, error)
      Taro.showToast({
        title: error.message || (mode === 'register' ? '注册失败' : '登录失败'),
        icon: 'none',
        duration: 2000
      })
    } finally {
      this.setState({ isLoading: false })
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
            <Text className="app-title">西外小助手</Text>
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

            {/* 登录/注册表单 */}
            <View className="form-fields">
              <View className="form-item">
                <View className="input-label">
                  <Text className="label-icon">👤</Text>
                  <Text className="label-text">用户名</Text>
                </View>
                <Input
                  type="text"
                  placeholder="请输入用户名"
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
              
              {/* 忘记密码链接 - 仅在登录模式显示 */}
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