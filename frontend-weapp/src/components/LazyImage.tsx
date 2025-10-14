import { Image } from '@tarojs/components'
import { FC } from 'react'

interface LazyImageProps {
  src: string
  mode?: "scaleToFill" | "aspectFit" | "aspectFill" | "widthFix" | "heightFix" | "top" | "bottom" | "center" | "left" | "right" | "top left" | "top right" | "bottom left" | "bottom right"
  className?: string
  style?: any
  placeholder?: string
}

/**
 * 基于 Taro Image 的懒加载封装。
 * 微信小程序端默认支持 lazy-load 属性；H5 端使用原生 loading="lazy"。
 */
export const LazyImage: FC<LazyImageProps> = ({ src, mode='aspectFill', className='', style={}, placeholder }) => {
  if (!src) {
    // 渲染占位
    return <Image src={placeholder || ''} mode={mode} className={className} style={style} />
  }
  return (
    <Image
      src={src}
      mode={mode}
      className={className}
      style={style}
      lazy-load
    />
  )
}
