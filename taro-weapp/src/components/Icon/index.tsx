import { View, Text } from '@tarojs/components'
import './index.scss'

interface IconProps {
  name: string
  size?: number
  color?: string
  className?: string
}

// Material Icons 映射表
const ICON_MAP: Record<string, string> = {
  // 导航
  'menu': 'menu',
  'arrow_back': 'arrow_back',
  'arrow_back_ios_new': 'arrow_back_ios_new',
  'chevron_right': 'chevron_right',
  'arrow_drop_down': 'arrow_drop_down',
  'close': 'close',
  'search': 'search',
  'sync': 'sync',
  'send': 'send',

  // 用户
  'school': 'school',
  'badge': 'badge',
  'lock': 'lock',
  'lock_reset': 'lock_reset',
  'vpn_key': 'vpn_key',
  'visibility': 'visibility',
  'visibility_off': 'visibility_off',
  'person': 'person',
  'edit_note': 'edit_note',
  'notifications_none': 'notifications_none',
  
  // 日历
  'calendar_today': 'calendar_today',
  'schedule': 'schedule',
  'event_note': 'event_note',
  
  // 学习
  'restaurant_menu': 'restaurant_menu',
  'auto_awesome': 'auto_awesome',
  'fact_check': 'fact_check',
  'assignment_ind': 'assignment_ind',
  'class': 'class',
  'workspace_premium': 'workspace_premium',
  'menu_book': 'menu_book',
  'rate_review': 'rate_review',
  'history_edu': 'history_edu',
  'functions': 'functions',
  'terminal': 'terminal',
  'translate': 'translate',
  'biotech': 'biotech',
  'sports_basketball': 'sports_basketball',
  'code': 'code',

  // 生活
  'map': 'map',
  'directions_bus': 'directions_bus',
  'wifi': 'wifi',
  'local_laundry_service': 'local_laundry_service',
  'local_post_office': 'local_post_office',
  'qr_code': 'qr_code',
  'location_on': 'location_on',
  'near_me': 'near_me',
  'room': 'room',
  
  // 信息
  'campaign': 'campaign',
  'account_balance': 'account_balance',
  'contact_phone': 'contact_phone',
  'settings': 'settings',
  'info': 'info',
  
  // 天气
  'wb_sunny': 'wb_sunny',
  'nights_stay': 'nights_stay'
}

export default function Icon({ name, size = 24, color, className = '' }: IconProps) {
  const iconName = ICON_MAP[name] || name
  
  return (
    <Text
      className={`material-icon ${className}`}
      style={{
        fontSize: `${size * 2}rpx`,
        color: color || 'inherit'
      }}
    >
      {iconName}
    </Text>
  )
}
