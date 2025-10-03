import { View, Input } from '@tarojs/components'
import './SearchBar.scss'

interface SearchBarProps {
  placeholder?: string
  onSearch?: (value: string) => void
  className?: string
}

// 从示例 SearchBar.tsx 移植
export function SearchBar({ 
  placeholder = '搜索商品...', 
  onSearch,
  className = ''
}: SearchBarProps) {
  const handleInput = (e: any) => {
    if (onSearch) {
      onSearch(e.detail.value)
    }
  }

  return (
    <View className={`ui-search-bar ${className}`}>
      <View className="ui-search-icon">🔍</View>
      <Input
        className="ui-search-input"
        placeholder={placeholder}
        onInput={handleInput}
      />
    </View>
  )
}

