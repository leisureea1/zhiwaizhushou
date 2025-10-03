import { Component } from 'react'
import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { apiService } from '../../services/api'
import './index.scss'

export default class UpdateJwxtPasswordPage extends Component {

  state = {
    newPassword: '',
    isLoading: false
  }

  onPasswordChange = (e: any) => {
    this.setState({ newPassword: e.detail.value })
  }

  onSubmit = async () => {
    const { newPassword } = this.state

    if (!newPassword) {
      Taro.showToast({
        title: '请输入新密码',
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

      // 验证新密码是否正确
      const verifyResponse = await apiService.verifyJwxtCredentials(
        userInfo.eduUsername || userInfo.studentId,
        newPassword
      ) as any

      if (verifyResponse.valid) {
        // 验证成功，更新本地存储
        const updatedUserInfo = {
          ...userInfo,
          eduPassword: newPassword
        }
        Taro.setStorageSync('userInfo', updatedUserInfo)
        
        Taro.showToast({
          title: '更新成功',
          icon: 'success'
        })
        
        setTimeout(() => {
          Taro.navigateBack()
        }, 1500)
      } else {
        Taro.showModal({
          title: '验证失败',
          content: '网办大厅密码错误，请检查后重试',
          showCancel: false
        })
      }
    } catch (error: any) {
      Taro.showModal({
        title: '更新失败',
        content: error.message || '无法验证密码，请稍后重试',
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
    const { newPassword, isLoading } = this.state

    return (
      <View className="update-password-page">
        {/* 状态栏占位 */}
        <View className="status-bar-placeholder"></View>

        {/* 顶部栏 */}
        <View className="header">
          <View className="header-back" onClick={this.onBack}>
            <Text className="back-icon">←</Text>
          </View>
          <View className="header-content">
            <Text className="header-title">更新网办大厅密码</Text>
          </View>
          <View className="header-placeholder"></View>
        </View>

        {/* 表单区域 */}
        <View className="form-container">
          <View className="form-card">
            <View className="info-section">
              <Text className="info-icon">🔑</Text>
              <Text className="info-title">更新网办大厅密码</Text>
              <Text className="info-desc">
                此密码用于自动获取课表和成绩信息{'\n'}
                请输入您在网办大厅的最新密码
              </Text>
            </View>

            <View className="form-item">
              <View className="input-label">
                <Text className="label-text">新密码</Text>
              </View>
              <Input
                type="text"
                password
                placeholder="请输入网办大厅密码"
                value={newPassword}
                onInput={this.onPasswordChange}
                className="form-input"
                placeholderClass="input-placeholder"
              />
            </View>

            <View className="tips-section">
              
              <Text className="tip-item">🔒 用于自动获取教务系统数据</Text>
              <Text className="tip-item">✅ 更新后即可正常使用课表和成绩功能</Text>
            </View>
          </View>

          {/* 提交按钮 */}
          <View 
            className={`submit-button ${isLoading ? 'loading' : ''}`}
            onClick={this.onSubmit}
          >
            <Text className="submit-text">
              {isLoading ? '验证中...' : '确认更新'}
            </Text>
          </View>
        </View>
      </View>
    )
  }
}
