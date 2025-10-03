import { View } from '@tarojs/components'
import { ReactNode } from 'react'
import './Card.scss'

interface CardProps {
  className?: string
  children: ReactNode
  onClick?: () => void
}

export function Card({ className = '', children, onClick }: CardProps) {
  return (
    <View
      className={`ui-card ${className}`}
      onClick={onClick}
    >
      {children}
    </View>
  )
}

export function CardImage({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <View className={`ui-card-image ${className}`}>
      {children}
    </View>
  )
}

export function CardContent({ className = '', children }: { className?: string; children: ReactNode }) {
  return (
    <View className={`ui-card-content ${className}`}>
      {children}
    </View>
  )
}

