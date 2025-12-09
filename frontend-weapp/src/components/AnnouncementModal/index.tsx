import { Component } from 'react'
import { View, Text, Button, ScrollView, RichText } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { apiService } from '../../services/api'
import './index.scss'

interface Announcement {
  id: number
  title: string
  content: string
  author_name: string
  created_at: string
  images?: string
}

interface AnnouncementModalProps {
  announcements: Announcement[]
  currentIndex: number
  onClose: () => void
  onNext: () => void
}

interface AnnouncementModalState {
  loading: boolean
}

export default class AnnouncementModal extends Component<AnnouncementModalProps, AnnouncementModalState> {
  
  state: AnnouncementModalState = {
    loading: false
  }

  // 处理"我知道了"按钮点击
  handleConfirm = async () => {
    const { announcements, currentIndex, onNext, onClose } = this.props
    const currentAnnouncement = announcements[currentIndex]
    
    this.setState({ loading: true })
    
    try {
      // 不需要后端标记，直接本地推进下一条/关闭
      
      // 如果还有下一条公告，显示下一条
      if (currentIndex < announcements.length - 1) {
        onNext()
      } else {
        // 所有公告都看完了，关闭弹窗
        onClose()
      }
    } catch (error) {
      console.error('标记公告已查看失败:', error)
      Taro.showToast({
        title: '操作失败',
        icon: 'error'
      })
    } finally {
      this.setState({ loading: false })
    }
  }

  render() {
    const { announcements, currentIndex } = this.props
    const { loading } = this.state
    
    if (!announcements || announcements.length === 0 || currentIndex >= announcements.length) {
      return null
    }

    const announcement = announcements[currentIndex]
    const isLastOne = currentIndex === announcements.length - 1

    return (
      <View className="announcement-modal">
        <View className="modal-overlay" />
        <View className="modal-content">
          <View className="modal-header">
            <Text className="modal-title">📢 系统公告</Text>
            <View className="modal-counter">
              {announcements.length > 1 && (
                <Text className="counter-text">
                  {currentIndex + 1}/{announcements.length}
                </Text>
              )}
            </View>
          </View>
          
          <ScrollView className="modal-body" scrollY>
            <View className="announcement-item">
              <Text className="announcement-title">{announcement.title}</Text>
              <View className="announcement-meta">
                <Text className="author">发布者：{announcement.author_name}</Text>
                <Text className="date">发布时间：{new Date(announcement.created_at).toLocaleString()}</Text>
              </View>
              <View className="announcement-content">
                <RichText nodes={announcement.content} />
              </View>
            </View>
          </ScrollView>

          <View className="modal-footer">
            <Button 
              className="confirm-button"
              onClick={this.handleConfirm}
              loading={loading}
            >
              {isLastOne ? '我知道了' : '下一条'}
            </Button>
          </View>
        </View>
      </View>
    )
  }
}