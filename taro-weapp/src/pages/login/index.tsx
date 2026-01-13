import { View, Text, Input } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { useState } from 'react'
import './index.scss'

export default function Login() {
  const [studentId, setStudentId] = useState('2021004562')
  const [password, setPassword] = useState('password')
  const [showPassword, setShowPassword] = useState(false)

  const handleLogin = () => {
    // 模拟登录，跳转到首页
    Taro.switchTab({ url: '/pages/home/index' })
  }

  return (
    <View className='login-page'>
      {/* 背景点阵 */}
      <View className='dot-pattern' />

      <View className='login-content'>
        {/* Logo */}
        <View className='logo-section'>
          <View className='logo-box'>
            <View className='logo-inner'>
              <Text className='iconfont icon-school' />
            </View>
          </View>
          <View className='logo-text'>
            <Text className='app-title'>Zhiwai Assistant</Text>
            <Text className='app-subtitle'>欢迎回来，请登录继续</Text>
          </View>
        </View>

        {/* 表单 */}
        <View className='form-section'>
          <View className='input-group'>
            <View className='input-icon'>
              <Text className='iconfont icon-badge' />
            </View>
            <Input
              className='input-field'
              placeholder='学号 / Student ID'
              value={studentId}
              onInput={(e) => setStudentId(e.detail.value)}
            />
          </View>

          <View className='input-group'>
            <View className='input-icon'>
              <Text className='iconfont icon-lock' />
            </View>
            <Input
              className='input-field'
              placeholder='密码 / Password'
              password={!showPassword}
              value={password}
              onInput={(e) => setPassword(e.detail.value)}
            />
            <View className='toggle-password' onClick={() => setShowPassword(!showPassword)}>
              <Text className={`iconfont ${showPassword ? 'icon-visibility-off' : 'icon-visibility'}`} />
            </View>
          </View>

          <View className='forgot-password'>
            <Text>忘记密码?</Text>
          </View>
        </View>

        {/* 按钮 */}
        <View className='button-section'>
          <View className='btn-login' onClick={handleLogin}>
            <Text>登录</Text>
          </View>
          <View className='btn-register'>
            <Text>注册</Text>
          </View>
        </View>

        {/* 底部协议 */}
        <View className='footer-text'>
          <Text>登录即代表您同意 </Text>
          <Text className='link'>服务条款</Text>
          <Text> & </Text>
          <Text className='link'>隐私政策</Text>
        </View>
      </View>
    </View>
  )
}
