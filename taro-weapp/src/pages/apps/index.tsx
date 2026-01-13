import { View, Text, Image } from '@tarojs/components'
import Taro from '@tarojs/taro'
import { CURRENT_USER } from '../../types'
import './index.scss'

// SVG 图标导入
import iconCalendar from '@/assets/icons/calendar_today_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconRestaurant from '@/assets/icons/flight_class_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconAi from '@/assets/icons/auto_awesome_mosaic_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconSchool from '@/assets/icons/school_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconExam from '@/assets/icons/fact_check_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconSelect from '@/assets/icons/assignment_ind_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconAward from '@/assets/icons/workspace_premium_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconBook from '@/assets/icons/menu_book_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconRate from '@/assets/icons/rate_review_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconMap from '@/assets/icons/map_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconBus from '@/assets/icons/directions_bus_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconWifi from '@/assets/icons/wifi_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconSports from '@/assets/icons/sports_basketball_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconLaundry from '@/assets/icons/local_laundry_service_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconPackage from '@/assets/icons/local_post_office_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconQrcode from '@/assets/icons/qr_code_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconNotice from '@/assets/icons/campaign_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconBuilding from '@/assets/icons/account_balance_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconPhone from '@/assets/icons/contact_phone_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconEventNote from '@/assets/icons/event_note_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'
import iconArrowForward from '@/assets/icons/arrow_forward_24dp_1F1F1F_FILL0_wght400_GRAD0_opsz24.svg'

export default function Apps() {
  const navigateTo = (page: string) => {
    Taro.navigateTo({ url: `/pages/${page}/index` })
  }

  return (
    <View className='apps-page'>
      {/* Header */}
      <View className='header'>
        <View className='header-content'>
          <View className='header-left'>
            <Text className='title'>应用中心</Text>
            <Text className='subtitle'>发现更多校园服务</Text>
          </View>
          <View className='header-right'>
            <View className='search-btn'>
              <Text className='icon-emoji'>🔍</Text>
            </View>
            <Image className='avatar' src={CURRENT_USER.avatar} mode='aspectFill' />
          </View>
        </View>
      </View>

      <View className='main-content'>
        {/* 最近使用 */}
        <View className='section'>
          <View className='section-header'>
            <Text className='section-title'>最近使用</Text>
            <Text className='section-action'>编辑</Text>
          </View>
          <View className='app-grid'>
            <View className='app-icon' onClick={() => Taro.switchTab({ url: '/pages/home/index' })}>
              <View className='icon-box blue'>
                <Image src={iconCalendar} className='svg-icon' mode='aspectFit' />
              </View>
              <Text className='icon-label'>课程表</Text>
            </View>
            <View className='app-icon'>
              <View className='icon-box orange'>
                <Image src={iconRestaurant} className='svg-icon' mode='aspectFit' />
              </View>
              <Text className='icon-label'>饭卡充值</Text>
            </View>
            <View className='app-icon' onClick={() => navigateTo('ai-chat')}>
              <View className='icon-box indigo'>
                <Image src={iconAi} className='svg-icon' mode='aspectFit' />
              </View>
              <Text className='icon-label'>AI 助手</Text>
            </View>
            <View className='app-icon' onClick={() => navigateTo('grades')}>
              <View className='icon-box purple'>
                <Image src={iconSchool} className='svg-icon' mode='aspectFit' />
              </View>
              <Text className='icon-label'>成绩查询</Text>
            </View>
          </View>
        </View>

        {/* 教务教学 */}
        <View className='card-section'>
          <View className='card-title'>
            <View className='title-bar blue' />
            <Text>教务教学</Text>
          </View>
          <View className='mini-app-grid'>
            <View className='mini-app-icon' onClick={() => navigateTo('exams')}>
              <View className='mini-icon-box'>
                <Image src={iconExam} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>考试安排</Text>
            </View>
            <View className='mini-app-icon'>
              <View className='mini-icon-box'>
                <Image src={iconSelect} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>选课系统</Text>
            </View>
            <View className='mini-app-icon'>
              <View className='mini-icon-box'>
                <Image src={iconBuilding} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>空教室</Text>
            </View>
            <View className='mini-app-icon'>
              <View className='mini-icon-box'>
                <Image src={iconAward} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>素拓分</Text>
            </View>
            <View className='mini-app-icon'>
              <View className='mini-icon-box'>
                <Image src={iconBook} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>教材预订</Text>
            </View>
            <View className='mini-app-icon' onClick={() => navigateTo('evaluation')}>
              <View className='mini-icon-box'>
                <Image src={iconRate} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>评教系统</Text>
            </View>
          </View>
        </View>

        {/* 校园生活 */}
        <View className='card-section'>
          <View className='card-title'>
            <View className='title-bar orange' />
            <Text>校园生活</Text>
          </View>
          <View className='mini-app-grid'>
            <View className='mini-app-icon'>
              <View className='mini-icon-box'>
                <Image src={iconMap} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>校园导览</Text>
            </View>
            <View className='mini-app-icon' onClick={() => navigateTo('bus')}>
              <View className='mini-icon-box'>
                <Image src={iconBus} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>校车时刻</Text>
            </View>
            <View className='mini-app-icon'>
              <View className='mini-icon-box'>
                <Image src={iconWifi} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>网络报修</Text>
            </View>
            <View className='mini-app-icon'>
              <View className='mini-icon-box'>
                <Image src={iconSports} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>场馆预约</Text>
            </View>
            <View className='mini-app-icon'>
              <View className='mini-icon-box'>
                <Image src={iconLaundry} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>洗衣机</Text>
            </View>
            <View className='mini-app-icon'>
              <View className='mini-icon-box'>
                <Image src={iconPackage} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>快递查询</Text>
            </View>
            <View className='mini-app-icon'>
              <View className='mini-icon-box'>
                <Image src={iconQrcode} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>出入码</Text>
            </View>
          </View>
        </View>

        {/* 行政资讯 */}
        <View className='card-section'>
          <View className='card-title'>
            <View className='title-bar teal' />
            <Text>行政资讯</Text>
          </View>
          <View className='mini-app-grid'>
            <View className='mini-app-icon'>
              <View className='mini-icon-box'>
                <Image src={iconNotice} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>通知公告</Text>
            </View>
            <View className='mini-app-icon'>
              <View className='mini-icon-box'>
                <Image src={iconBuilding} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>学校概况</Text>
            </View>
            <View className='mini-app-icon'>
              <View className='mini-icon-box'>
                <Image src={iconPhone} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>黄页电话</Text>
            </View>
            <View className='mini-app-icon'>
              <View className='mini-icon-box'>
                <Image src={iconEventNote} className='svg-icon-sm' mode='aspectFit' />
              </View>
              <Text className='mini-icon-label'>校历</Text>
            </View>
          </View>
        </View>

        {/* Banner */}
        <View className='banner'>
          <Image
            className='banner-image'
            src='https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80'
            mode='aspectFill'
          />
          <View className='banner-overlay'>
            <View>
              <Text className='banner-title'>新生入学指南</Text>
              <View className='banner-subtitle'>
                <Text>点击查看详细流程</Text>
                <Image src={iconArrowForward} className='svg-icon-xs' mode='aspectFit' />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  )
}
