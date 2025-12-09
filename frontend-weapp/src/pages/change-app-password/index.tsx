import { Component } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { apiService } from '../../services/api'
import './index.scss'

interface PasswordState {
  oldPassword: string
  newPassword: string
  confirmPassword: string
  isLoading: boolean
  passwordStrength: number
  passwordError: string
}

export default class ChangeAppPasswordPage extends Component<{}, PasswordState> {

  state: PasswordState = {
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
    isLoading: false,
    passwordStrength: 0,
    passwordError: ''
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

  onOldPasswordChange = (e: any) => {
    this.setState({ oldPassword: e.detail.value })
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

  onSubmit = async () => {
    const { oldPassword, newPassword, confirmPassword, passwordStrength, passwordError } = this.state

    if (!oldPassword) {
      Taro.showToast({
        title: '请输入当前密码',
        icon: 'none'
      })
      return
    }

    if (!newPassword) {
      Taro.showToast({
        title: '请输入新密码',
        icon: 'none'
      })
      return
    }

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
      const userInfo = Taro.getStorageSync('userInfo')
      
      if (!userInfo) {
        Taro.showToast({
          title: '请先登录',
          icon: 'none'
        })
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
        return
      }

      await apiService.changePassword(userInfo.userId, oldPassword, newPassword)
      
      Taro.showModal({
        title: '修改成功',
        content: '密码修改成功，请重新登录',
        showCancel: false,
        success: () => {
          // 退出登录
          Taro.removeStorageSync('userToken')
          Taro.removeStorageSync('userInfo')
          Taro.reLaunch({
            url: '/pages/login/index'
          })
        }
      })
    } catch (error: any) {
      Taro.showModal({
        title: '修改失败',
        content: error.message || '密码修改失败，请检查当前密码是否正确',
        showCancel: false
      })
    } finally {
      this.setState({ isLoading: false })
    }
  }

  onBack = () => {
    Taro.navigateBack()
  }

  render() {
    const { oldPassword, newPassword, confirmPassword, isLoading, passwordStrength, passwordError } = this.state

    return (
      <View className="change-password-page">
        {/* 状态栏占位 */}
        <View className="status-bar-placeholder"></View>

        {/* 顶部栏 */}
        <View className="header">
          <View className="header-back" onClick={this.onBack}>
            <Text className="back-icon">←</Text>
          </View>
          <View className="header-content">
            <Text className="header-title">修改登录密码</Text>
          </View>
          <View className="header-placeholder"></View>
        </View>

        {/* 表单区域 */}
        <View className="form-container">
          <View className="form-card">
            <View className="info-section">
              <Text className="info-icon">🔒</Text>
              <Text className="info-title">修改知外助手密码</Text>
              <Text className="info-desc">
                修改小程序登录密码{'\n'}
                修改成功后需要重新登录
              </Text>
            </View>

            <View className="form-item">
              <View className="input-label">
                <Text className="label-text">当前密码</Text>
              </View>
              <Input
                type="text"
                password
                placeholder="请输入当前密码"
                value={oldPassword}
                onInput={this.onOldPasswordChange}
                className="form-input"
                placeholderClass="input-placeholder"
              />
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
                <Text className="label-text">确认新密码</Text>
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
              <Text className="tip-item">✅ 修改成功后将自动退出登录</Text>
            </View>
          </View>

          {/* 提交按钮 */}
          <View 
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            onClick={this.onSubmit}
          >
            <Text className="submit-text">
              {isLoading ? '修改中...' : '确认修改'}
            </Text>
          </View>
        </View>
      </View>
    )
  }
}
