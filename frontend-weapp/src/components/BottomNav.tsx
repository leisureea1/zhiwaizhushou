import { View, Text } from '@tarojs/components'
import './BottomNav.scss'

interface Tab {
  id: string
  label: string
  icon: string
}

interface BottomNavProps {
  tabs: Tab[]
  activeTab: string
  onTabChange: (tabId: string) => void
}

// 从示例 MarketplaceApp.tsx 的 Bottom Navigation 移植
export function BottomNav({ tabs, activeTab, onTabChange }: BottomNavProps) {
  return (
    <View className="bottom-nav">
      <View className="bottom-nav-container">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id
          
          return (
            <View
              key={tab.id}
              className={`bottom-nav-item ${isActive ? 'bottom-nav-item-active' : ''}`}
              onClick={() => onTabChange(tab.id)}
            >
              <Text className="bottom-nav-icon">{tab.icon}</Text>
              <Text className="bottom-nav-label">{tab.label}</Text>
            </View>
          )
        })}
      </View>
    </View>
  )
}

