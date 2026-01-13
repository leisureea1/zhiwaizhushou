import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { CURRENT_USER } from '../../types'
import './index.scss'

export default function Profile() {
  const handleLogout = () => {
    Taro.reLaunch({ url: '/pages/login/index' })
  }

  return (
    <View className='profile-page'>
      {/* Header */}
      <View className='header'>
        <Text className='title'>个人中心</Text>
        <View className='notify-btn'>
          <Text className='iconfont icon-notification' />
        </View>
      </View>

      <View className='main-content'>
        {/* Profile Card */}
        <View className='profile-card'>
          <View className='avatar-wrapper'>
            <View className='avatar-ring'>
              <Image className='avatar' src={CURRENT_USER.avatar} mode='aspectFill' />
            </View>
            <View className='online-dot' />
          </View>
          <View className='user-info'>
            <Text className='user-name'>{CURRENT_USER.name}</Text>
            <View className='user-id'>
              <Text className='iconfont icon-badge' />
              <Text>{CURRENT_USER.id}</Text>
            </View>
            <View className='tags'>
              <Text className='tag blue'>{CURRENT_USER.major}</Text>
              <Text className='tag purple'>{CURRENT_USER.type}</Text>
            </View>
          </View>
          <View className='edit-btn'>
            <Text className='iconfont icon-edit' />
          </View>
        </View>

        {/* Security Section */}
        <View className='menu-section'>
          <View className='menu-item'>
            <View className='menu-left'>
              <View className='menu-icon orange'>
                <Text className='iconfont icon-lock' />
              </View>
              <Text className='menu-text'>修改门户密码</Text>
            </View>
            <View className='menu-right'>
              <Text className='iconfont icon-arrow-right arrow-icon' />
            </View>
          </View>
          <View className='menu-item'>
            <View className='menu-left'>
              <View className='menu-icon teal'>
                <Text className='iconfont icon-key' />
              </View>
              <Text className='menu-text'>修改知外助手密码</Text>
            </View>
            <View className='menu-right'>
              <Text className='iconfont icon-arrow-right arrow-icon' />
            </View>
          </View>
        </View>

        {/* App Settings */}
        <View className='menu-section'>
          <View className='menu-item'>
            <View className='menu-left'>
              <View className='menu-icon gray'>
                <Text className='iconfont icon-settings' />
              </View>
              <Text className='menu-text'>设置</Text>
            </View>
            <View className='menu-right'>
              <Text className='iconfont icon-arrow-right arrow-icon' />
            </View>
          </View>
          <View className='menu-item'>
            <View className='menu-left'>
              <View className='menu-icon indigo'>
                <Text className='iconfont icon-info' />
              </View>
              <Text className='menu-text'>关于我们</Text>
            </View>
            <View className='menu-right'>
              <Text className='version-tag'>v2.4.1</Text>
              <Text className='iconfont icon-arrow-right arrow-icon' />
            </View>
          </View>
        </View>

        {/* Logout */}
        <View className='logout-btn' onClick={handleLogout}>
          <Text>退出登录</Text>
        </View>
      </View>
    </View>
  )
}
