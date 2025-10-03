import { Component } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { apiService } from '../../services/api'
import './index.scss'

interface ForgotPasswordState {
  step: number  // 1: 验证身份, 2: 设置新密码
  username: string
  studentId: string
  jwxtPassword: string
  newPassword: string
  confirmPassword: string
  isLoading: boolean
  passwordStrength: number
  passwordError: string
  userId: string  // 验证通过后保存的用户ID
}

export default class ForgotPasswordPage extends Component<{}, ForgotPasswordState> {

  state: ForgotPasswordState = {
    step: 1,
    username: '',
    studentId: '',
    jwxtPassword: '',
    newPassword: '',
    confirmPassword: '',
    isLoading: false,
    passwordStrength: 0,
    passwordError: '',
    userId: ''
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

  onUsernameChange = (e: any) => {
    this.setState({ username: e.detail.value })
  }

  onStudentIdChange = (e: any) => {
    this.setState({ studentId: e.detail.value })
  }

  onJwxtPasswordChange = (e: any) => {
    this.setState({ jwxtPassword: e.detail.value })
  }

  onNewPasswordChange = (e: any) => {
    const password = e.detail.value
    const { strength, error } = this.checkPasswordStrength(password)
    this.setState({ 
      newPassword: password,
      passwordStrength: strength,
      passwordError: error
    })
  }

  onConfirmPasswordChange = (e: any) => {
    this.setState({ confirmPassword: e.detail.value })
  }

  // 第一步：验证身份
  onVerifyIdentity = async () => {
    const { username, studentId, jwxtPassword } = this.state

    if (!username) {
      Taro.showToast({
        title: '请输入用户名',
        icon: 'none'
      })
      return
    }

    if (!studentId) {
      Taro.showToast({
        title: '请输入学号',
        icon: 'none'
      })
      return
    }

    if (!jwxtPassword) {
      Taro.showToast({
        title: '请输入网办大厅密码',
        icon: 'none'
      })
      return
    }

    this.setState({ isLoading: true })

    try {
      // 1. 验证网办大厅密码
      const verifyResponse = await apiService.verifyJwxtCredentials(studentId, jwxtPassword) as any
      
      if (!verifyResponse.valid) {
        Taro.showModal({
          title: '验证失败',
          content: '学号或网办大厅密码错误',
          showCancel: false
        })
        this.setState({ isLoading: false })
        return
      }

      // 2. 验证用户名和学号是否匹配
      const validateResponse = await apiService.validateUserCredentials(username, studentId) as any
      
      if (!validateResponse.valid) {
        Taro.showModal({
          title: '验证失败',
          content: validateResponse.message || '用户名与学号不匹配',
          showCancel: false
        })
        this.setState({ isLoading: false })
        return
      }

      // 验证成功，进入下一步
      this.setState({ 
        step: 2,
        userId: validateResponse.user_id,
        isLoading: false 
      })

      Taro.showToast({
        title: '验证成功',
        icon: 'success'
      })
    } catch (error: any) {
      Taro.showModal({
        title: '验证失败',
        content: error.message || '验证过程出错，请稍后重试',
        showCancel: false
      })
      this.setState({ isLoading: false })
    }
  }

  // 第二步：重置密码
  onResetPassword = async () => {
    const { newPassword, confirmPassword, passwordStrength, passwordError, userId } = this.state

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

    if (newPassword !== confirmPassword) {
      Taro.showToast({
        title: '两次密码不一致',
        icon: 'none'
      })
      return
    }

    this.setState({ isLoading: true })

    try {
      await apiService.resetPassword(userId, newPassword)
      
      Taro.showModal({
        title: '重置成功',
        content: '密码重置成功，请使用新密码登录',
        showCancel: false,
        success: () => {
          Taro.navigateBack()
        }
      })
    } catch (error: any) {
      Taro.showModal({
        title: '重置失败',
        content: error.message || '密码重置失败，请稍后重试',
        showCancel: false
      })
    } finally {
      this.setState({ isLoading: false })
    }
  }

  onBack = () => {
    if (this.state.step === 2) {
      // 如果在第二步，返回第一步
      this.setState({ step: 1 })
    } else {
      // 如果在第一步，返回登录页
      Taro.navigateBack()
    }
  }

  render() {
    const { 
      step, 
      username, 
      studentId, 
      jwxtPassword, 
      newPassword, 
      confirmPassword, 
      isLoading,
      passwordStrength,
      passwordError
    } = this.state

    return (
      <View className="forgot-password-page">
        {/* 状态栏占位 */}
        <View className="status-bar-placeholder"></View>

        {/* 顶部栏 */}
        <View className="header">
          <View className="header-back" onClick={this.onBack}>
            <Text className="back-icon">←</Text>
          </View>
          <View className="header-content">
            <Text className="header-title">找回密码</Text>
          </View>
          <View className="header-placeholder"></View>
        </View>

        {/* 步骤指示器 */}
        <View className="steps-indicator">
          <View className={`step ${step >= 1 ? 'active' : ''}`}>
            <View className="step-number">1</View>
            <Text className="step-text">验证身份</Text>
          </View>
          <View className="step-line"></View>
          <View className={`step ${step >= 2 ? 'active' : ''}`}>
            <View className="step-number">2</View>
            <Text className="step-text">设置密码</Text>
          </View>
        </View>

        {/* 表单区域 */}
        <View className="form-container">
          {step === 1 ? (
            // 第一步：验证身份
            <View className="form-card">
              <View className="info-section">
                <Text className="info-icon">🔐</Text>
                <Text className="info-title">验证身份信息</Text>
                <Text className="info-desc">
                  请输入您的账户信息进行身份验证
                </Text>
              </View>

              <View className="form-item">
                <View className="input-label">
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

              <View className="tips-section">
                <Text className="tip-item">💡 请输入注册时使用的用户名</Text>
                <Text className="tip-item">🎓 学号和网办大厅密码用于验证身份</Text>
                <Text className="tip-item">🔒 验证成功后即可重置密码</Text>
              </View>

              <View 
                className={`submit-button ${isLoading ? 'loading' : ''}`}
                onClick={this.onVerifyIdentity}
              >
                <Text className="submit-text">
                  {isLoading ? '验证中...' : '验证身份'}
                </Text>
              </View>
            </View>
          ) : (
            // 第二步：设置新密码
            <View className="form-card">
              <View className="info-section">
                <Text className="info-icon">🔑</Text>
                <Text className="info-title">设置新密码</Text>
                <Text className="info-desc">
                  请设置您的新登录密码
                </Text>
              </View>

              <View className="form-item">
                <View className="input-label">
                  <Text className="label-text">新密码</Text>
                </View>
                <Input
                  type="text"
                  password
                  placeholder="至少8位，包含大小写字母、数字"
                  value={newPassword}
                  onInput={this.onNewPasswordChange}
                  className="form-input"
                  placeholderClass="input-placeholder"
                />
                {newPassword && (
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

              <View className="form-item">
                <View className="input-label">
                  <Text className="label-text">确认密码</Text>
                </View>
                <Input
                  type="text"
                  password
                  placeholder="请再次输入新密码"
                  value={confirmPassword}
                  onInput={this.onConfirmPasswordChange}
                  className="form-input"
                  placeholderClass="input-placeholder"
                />
              </View>

              <View className="tips-section">
                <Text className="tip-item">💡 密码长度至少8位</Text>
                <Text className="tip-item">🔐 需包含大小写字母、数字、特殊字符中的至少3种</Text>
                <Text className="tip-item">✅ 设置成功后请使用新密码登录</Text>
              </View>

              <View 
                className={`submit-button ${isLoading ? 'loading' : ''}`}
                onClick={this.onResetPassword}
              >
                <Text className="submit-text">
                  {isLoading ? '重置中...' : '确认重置'}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    )
  }
}
