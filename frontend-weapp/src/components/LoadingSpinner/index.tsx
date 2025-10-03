import { Component } from 'react'
import { View, Text } from '@tarojs/components'
import './index.scss'

interface Props {
  text?: string
  size?: 'small' | 'medium' | 'large'
}

export class LoadingSpinner extends Component<Props> {
  static defaultProps = {
    text: '加载中...',
    size: 'medium'
  }

  render() {
    const { text, size } = this.props

    return (
      <View className={`loading-spinner ${size}`}>
        <View className="spinner" />
        {text && <Text className="loading-text">{text}</Text>}
      </View>
    )
  }
}
