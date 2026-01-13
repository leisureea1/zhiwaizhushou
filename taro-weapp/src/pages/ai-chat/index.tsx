import { View, Text, Input, ScrollView } from '@tarojs/components'
import { useState, useRef } from 'react'
import Taro from '@tarojs/taro'
import { CURRENT_USER, Message } from '../../types'
import './index.scss'

export default function AiChat() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      text: `Hi ${CURRENT_USER.name}! I'm your Zhiwai Smart Assistant. Ask me about your schedule, campus events, or study tips!`,
      timestamp: new Date()
    }
  ])
  const [inputText, setInputText] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const scrollViewRef = useRef<any>(null)

  const handleSend = async () => {
    if (!inputText.trim() || isLoading) return

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: inputText,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMsg])
    setInputText('')
    setIsLoading(true)

    // 模拟 AI 响应（微信小程序中需要使用云函数或后端 API）
    setTimeout(() => {
      const botMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        text: getSimulatedResponse(userMsg.text),
        timestamp: new Date()
      }
      setMessages(prev => [...prev, botMsg])
      setIsLoading(false)
    }, 1000)
  }

  const getSimulatedResponse = (input: string): string => {
    const lowerInput = input.toLowerCase()
    if (lowerInput.includes('课程') || lowerInput.includes('课表')) {
      return '您本周有5门课程，包括实践俄语、俄语语法、国际法学等。建议您查看首页课程表获取详细信息。'
    }
    if (lowerInput.includes('成绩') || lowerInput.includes('绩点')) {
      return '您当前的平均绩点为3.86，平均分91.5分。继续保持！'
    }
    if (lowerInput.includes('考试')) {
      return '您最近的考试是概率论与数理统计，还有3天，加油复习！'
    }
    if (lowerInput.includes('校车') || lowerInput.includes('班车')) {
      return '最近一班校车14:30发车，预计15:15到达，目前还有18个座位。'
    }
    return '感谢您的提问！我是知外助手，可以帮您查询课程、成绩、考试安排、校车时刻等信息。请问有什么可以帮您的？'
  }

  return (
    <View className='chat-page'>
      <ScrollView
        className='messages-container'
        scrollY
        scrollIntoView={`msg-${messages.length - 1}`}
      >
        {messages.map((msg, idx) => (
          <View
            key={msg.id}
            id={`msg-${idx}`}
            className={`message-wrapper ${msg.role}`}
          >
            <View className={`message-bubble ${msg.role}`}>
              <Text>{msg.text}</Text>
            </View>
          </View>
        ))}
        {isLoading && (
          <View className='message-wrapper assistant'>
            <View className='message-bubble assistant loading'>
              <View className='dot' />
              <View className='dot' />
              <View className='dot' />
            </View>
          </View>
        )}
      </ScrollView>

      <View className='input-container'>
        <View className='input-wrapper'>
          <Input
            className='chat-input'
            placeholder='Ask anything...'
            value={inputText}
            onInput={(e) => setInputText(e.detail.value)}
            onConfirm={handleSend}
            confirmType='send'
          />
          <View
            className={`send-btn ${inputText.trim() ? 'active' : ''}`}
            onClick={handleSend}
          >
            <Text className='iconfont icon-send' />
          </View>
        </View>
      </View>
    </View>
  )
}
