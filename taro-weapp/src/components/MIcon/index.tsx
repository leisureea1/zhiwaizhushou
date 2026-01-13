import { Text } from '@tarojs/components'
import './index.scss'

interface MIconProps {
  name: string
  size?: number
  color?: string
  className?: string
}

export default function MIcon({ name, size = 24, color, className = '' }: MIconProps) {
  return (
    <Text
      className={`micon micon-${name} ${className}`}
      style={{
        fontSize: `${size * 2}rpx`,
        width: `${size * 2}rpx`,
        height: `${size * 2}rpx`,
        color: color || 'currentColor'
      }}
    />
  )
}
