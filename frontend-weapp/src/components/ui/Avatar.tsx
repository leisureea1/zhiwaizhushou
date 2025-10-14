import { View, Text, Image } from '@tarojs/components'
import { ReactNode } from 'react'
import './Avatar.scss'

interface AvatarProps {
  className?: string
  children: ReactNode
  size?: 'sm' | 'md' | 'lg'
}

export function Avatar({ className = '', children, size = 'md' }: AvatarProps) {
  const sizeClass = `ui-avatar-${size}`
  
  return (
    <View className={`ui-avatar ${sizeClass} ${className}`}>
      {children}
    </View>
  )
}

interface AvatarFallbackProps {
  className?: string
  children: ReactNode
}

export function AvatarFallback({ className = '', children }: AvatarFallbackProps) {
  return (
    <View className={`ui-avatar-fallback ${className}`}>
      {typeof children === 'string' ? (
        <Text className="ui-avatar-text">{children}</Text>
      ) : (
        children
      )}
    </View>
  )
}