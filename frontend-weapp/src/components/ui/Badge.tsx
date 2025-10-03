import { View, Text } from '@tarojs/components'
import { ReactNode } from 'react'
import './Badge.scss'

interface BadgeProps {
  className?: string
  variant?: 'default' | 'secondary' | 'destructive' | 'outline'
  children: ReactNode
}

// 从示例 badge.tsx 移植
export function Badge({ className = '', variant = 'default', children }: BadgeProps) {
  const variantClass = `ui-badge-${variant}`
  
  return (
    <View className={`ui-badge ${variantClass} ${className}`}>
      <Text className="ui-badge-text">{children}</Text>
    </View>
  )
}

