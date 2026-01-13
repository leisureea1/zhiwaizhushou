import { View, Text, Image, ScrollView } from '@tarojs/components'
import './index.scss'

const EVALUATIONS = [
  {
    title: '高等数学 (下)',
    dept: '理学院 · 数学系',
    prof: '王力 教授',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDoehYoH6QQGxhYQmujHmfs9g-RlpfSL5ChhjF2GT6bJIE-D4AYdWfzZMKWG8K62X-mmUm4Mk1VtDZgFGtg816XvKJisbHDPn-VRXmLPIaB857SoWQyv4WEXsrbVH4Mpwnib2R56jTEHT9c-ntCbJTF1CCyPuCUBHWwMvDkUIKEqtUX2gHIsCcNq6nGf7Sx8zVY29LZ1FI9hc3SNb7HaOcgRgkn_pxRt_Qq42p9lU5JWf43lHd7sgkaVVXtP0sc0cRel0pbbOiuOXA',
    icon: 'icon-math',
    color: 'blue'
  },
  {
    title: '计算机科学导论',
    dept: '计算机学院',
    prof: '陈莎 教授',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC41pJVmqoF9k4OmBnRPukBvz9enZbVUqqVHvbztDHN2SfM3IvRLIZcVaQvtRgjW_GCsTQm-8hf-piz66PPZ3ssA2USGXNEI_0cxIkO9uwbSnHjuHaeU49FDuBAATf1M5yBE3qleNX44WxSsjIBmCU6MRtVu9u7IRIbwvlJe9iqDXAFiSsQdEwgsN5sHBV2H5WWwqSCCjIw8pefY3fWURLu42tA-zYYQ8nzyobYJYPZXAtO3YCwy7sF56KBRgsa4sYF04kXLfDikzk',
    icon: 'icon-code',
    color: 'purple'
  },
  {
    title: '中国近代史纲要',
    dept: '马克思主义学院',
    prof: '张伟 教授',
    avatar: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDFjw9k9oRLi9sTS2K4RsrgFZ0Eq1_RFjzdoYYMYs_-Hb0SAxJsb8qdZQUKkuY1IiAFOeWsZz8vh-qQuj2L_sjeYyY9yhdZ9z5JM9UW-HhT2psc41UwbB52OfbVtohplpt7B5rmHIwBG7Np0hzjM7bZnVJ5OMIcGr-k0AqFZ6aqGLtGwzJQs_4YqfedqeDDvGecDpOYReQcRS7KtWosf5MPplMmiOS-CyD9LRr5AaCqUbjX2OC6SusNUPPTywFTfQV7PQg2yrmyzL0',
    icon: 'icon-history',
    color: 'red'
  }
]

export default function Evaluation() {
  return (
    <View className='evaluation-page'>
      <ScrollView className='main-content' scrollY>
        <View className='section-header'>
          <Text className='section-title'>待评教课程</Text>
          <Text className='section-badge'>3 门待办</Text>
        </View>

        <View className='eval-list'>
          {EVALUATIONS.map((item, idx) => (
            <View key={idx} className='eval-card'>
              <View className='eval-header'>
                <View className='eval-info'>
                  <View className='pending-badge'>
                    <Text>待评教</Text>
                  </View>
                  <Text className='eval-title'>{item.title}</Text>
                  <Text className='eval-dept'>{item.dept}</Text>
                </View>
                <View className={`eval-icon ${item.color}`}>
                  <Text className={`iconfont ${item.icon}`} />
                </View>
              </View>
              <View className='eval-divider' />
              <View className='eval-teacher'>
                <Image className='teacher-avatar' src={item.avatar} mode='aspectFill' />
                <View className='teacher-info'>
                  <Text className='teacher-name'>{item.prof}</Text>
                  <Text className='teacher-role'>主讲教师</Text>
                </View>
              </View>
            </View>
          ))}
        </View>

        <Text className='empty-text'>已加载全部待评教课程</Text>
      </ScrollView>

      <View className='bottom-action'>
        <View className='action-btn'>
          <Text className='iconfont icon-ai' />
          <Text>一键评教</Text>
        </View>
      </View>
    </View>
  )
}
