import { View, Text } from '@tarojs/components'
import { ReactNode } from 'react'
import './Button.scss'

interface ButtonProps {
  className?: string
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
  children: ReactNode
  onClick?: () => void
  disabled?: boolean
}

// 从示例 button.tsx 移植
export function Button({ 
  className = '', 
  variant = 'default', 
  size = 'default',
  children, 
  onClick,
  disabled = false
}: ButtonProps) {
  const variantClass = `ui-button-${variant}`
  const sizeClass = `ui-button-${size}`
  
  return (
    <View 
      className={`ui-button ${variantClass} ${sizeClass} ${disabled ? 'ui-button-disabled' : ''} ${className}`}
      onClick={disabled ? undefined : onClick}
    >
      {typeof children === 'string' ? (
        <Text className="ui-button-text">{children}</Text>
      ) : (
        children
      )}
    </View>
  )
}

