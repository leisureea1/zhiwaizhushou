import { View, Text } from '@tarojs/components'
import { ReactNode } from 'react'
import './Tabs.scss'

interface TabsProps {
  defaultValue: string
  value?: string
  onValueChange?: (value: string) => void
  children: ReactNode
  className?: string
}

interface TabsListProps {
  children: ReactNode
  className?: string
}

interface TabsTriggerProps {
  value: string
  children: ReactNode
  className?: string
  activeValue?: string
  onTrigger?: (value: string) => void
}

// 从示例 tabs.tsx 移植
export function Tabs({ 
  defaultValue, 
  value, 
  onValueChange, 
  children,
  className = ''
}: TabsProps) {
  return (
    <View className={`ui-tabs ${className}`}>
      {children}
    </View>
  )
}

export function TabsList({ children, className = '' }: TabsListProps) {
  return (
    <View className={`ui-tabs-list ${className}`}>
      {children}
    </View>
  )
}

export function TabsTrigger({ 
  value, 
  children, 
  className = '',
  activeValue,
  onTrigger
}: TabsTriggerProps) {
  const isActive = value === activeValue
  
  return (
    <View 
      className={`ui-tabs-trigger ${isActive ? 'ui-tabs-trigger-active' : ''} ${className}`}
      onClick={() => onTrigger && onTrigger(value)}
    >
      <Text className="ui-tabs-trigger-text">{children}</Text>
    </View>
  )
}

