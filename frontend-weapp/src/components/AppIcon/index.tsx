import { FC } from 'react'
import { Image } from '@tarojs/components'
import './index.scss'

export type AppIconName =
  | 'grades'
  | 'map'
  | 'subscribe'
  | 'phone'
  | 'more'
  | 'email'
  | 'bus'
  | 'freshman'
  | 'coupon'
  | 'admission'
  | 'refresh'
  | 'market'
  | 'lost'
  | 'eleme'
  | 'flowcard'

interface Props {
  name: AppIconName
  color?: string
  size?: string
}

const base64Encode = (input: string) => {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='
  let str = input
  let output = ''
  let i = 0

  while (i < str.length) {
    const chr1 = str.charCodeAt(i++)
    const chr2Raw = str.charCodeAt(i++)
    const chr3Raw = str.charCodeAt(i++)

    const hasChr2 = !Number.isNaN(chr2Raw)
    const hasChr3 = !Number.isNaN(chr3Raw)
    const chr2 = hasChr2 ? chr2Raw : 0
    const chr3 = hasChr3 ? chr3Raw : 0

    const enc1 = chr1 >> 2
    const enc2 = ((chr1 & 3) << 4) | (chr2 >> 4)
    let enc3 = ((chr2 & 15) << 2) | (chr3 >> 6)
    let enc4 = chr3 & 63

    if (!hasChr2) {
      enc3 = 64
      enc4 = 64
    } else if (!hasChr3) {
      enc3 = ((chr2 & 15) << 2)
      enc4 = 64
    }

    output += chars.charAt(enc1) + chars.charAt(enc2) + chars.charAt(enc3) + chars.charAt(enc4)
  }

  return output
}

const toDataUri = (pathD: string, fillColor: string) => {
  const svg = `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='${fillColor}'><path d='${pathD}'/></svg>`
  const base64 = base64Encode(svg)
  return `data:image/svg+xml;base64,${base64}`
}

const AppIcon: FC<Props> = ({ name, color = '#3b82f6', size = '48rpx' }) => {
  const fill = color
  const map: Record<AppIconName, string> = {
    grades: toDataUri("M15 3h4a2 2 0 0 1 2 2v1a5 5 0 0 1-5 5h-1a6 6 0 0 1-12 0V5a2 2 0 0 1 2-2h4V2h6v1Zm-2 10.917A4.002 4.002 0 0 1 12 19a4 4 0 0 1-1-7.858V5H7v4a3 3 0 0 1-3-3v-1h3V5h10v0h3v1a3 3 0 0 1-3 3V5h-4v8.917Z", fill),
    map: toDataUri("M9.5 3 3 5.5v15l6.5-2.5L15 20l6-2.5v-15L15 5 9.5 3Zm0 2.118L14 6.5v11.382l-4.5-1.382V5.118ZM5 7.118l2.5-.955v11.719L5 18.837V7.118Zm14 10.764-2 .833V7.882l2-.833v10.833Z", fill),
    subscribe: toDataUri("M4 4h16v4H4V4Zm0 6h16v10H4V10Zm2 2v6h12v-6H6Z", fill),
    phone: toDataUri("M6.62 10.79a15.05 15.05 0 0 0 6.59 6.59l2.2-2.2a1 1 0 0 1 1.01-.24 11.36 11.36 0 0 0 3.57.57 1 1 0 0 1 1 1V21a1 1 0 0 1-1 1A17 17 0 0 1 3 7a1 1 0 0 1 1-1h3.5a1 1 0 0 1 1 1c0 1.23.2 2.42.57 3.57a1 1 0 0 1-.24 1.01l-2.21 2.21Z", fill),
    more: toDataUri("M6 12a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Zm8 0a2 2 0 1 1-4 0 2 2 0 0 1 4 0Z", fill),
    email: toDataUri("M2 6a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v0l-10 6L2 6Zm0 2.236 9.553 5.732a1 1 0 0 0 .894 0L22 8.236V18a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V8.236Z", fill),
    bus: toDataUri("M4 6a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v9a3 3 0 0 1-3 3v2a1 1 0 1 1-2 0v-2H9v2a1 1 0 1 1-2 0v-2a3 3 0 0 1-3-3V6Zm2 0v5h12V6a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2Zm0 7v2h12v-2H6Zm1 3.5a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Zm10 0a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3Z", fill),
    freshman: toDataUri("M12 3 2 7l10 4 10-4-10-4Zm-8 6v6l8 4 8-4V9l-8 3-8-3Z", fill),
    coupon: toDataUri("M3 7a2 2 0 0 1 2-2h14v4a2 2 0 0 0 0 4v4H5a2 2 0 0 1-2-2v-2a2 2 0 1 0 0-4V7Zm10 1-6 8h2l6-8h-2Z", fill),
    admission: toDataUri("M12 2a5 5 0 0 1 5 5v1h3v12H4V8h3V7a5 5 0 0 1 5-5Zm3 6V7a3 3 0 1 0-6 0v1h6Z", fill),
    refresh: toDataUri("M12 3.75a.75.75 0 0 1 .75.75v1.22a6.75 6.75 0 0 1 5.63 5.341l.173.96a.75.75 0 1 1-1.48.267l-.173-.96a5.25 5.25 0 0 0-4.43-4.157V8.25a.75.75 0 0 1-1.5 0V4.5a.75.75 0 0 1 .75-.75Zm-7.076 6.682a.75.75 0 0 1 .877.606l.173.96a5.25 5.25 0 0 0 4.43 4.158V15.75a.75.75 0 0 1 1.5 0V19.5a.75.75 0 0 1-.75.75A6.75 6.75 0 0 1 5.024 13.26l-.173-.96a.75.75 0 0 1 .073-.868Z", fill),
    market: toDataUri("M3 7.5 4.2 4.2A1.5 1.5 0 0 1 5.6 3h12.8a1.5 1.5 0 0 1 1.4 1.2L21 7.5v3a3.5 3.5 0 0 1-3 3.465V18a1.5 1.5 0 0 1-1.5 1.5H7.5A1.5 1.5 0 0 1 6 18v-4.035A3.5 3.5 0 0 1 3 10.5v-3Zm2 3a1.5 1.5 0 0 0 3 0h2a1.5 1.5 0 0 0 3 0h2a1.5 1.5 0 0 0 3 0V9H5v1.5ZM8.5 16v2h7v-2h-7Z", fill),
    lost: toDataUri("M11 4a7 7 0 1 1 4.9 11.9l3.2 3.2a.75.75 0 1 1-1.06 1.06l-3.2-3.2A7 7 0 0 1 11 4Zm0 1.5a5.5 5.5 0 1 0 0 11 5.5 5.5 0 0 0 0-11Zm0 2a.75.75 0 0 1 .75.75v1.5h1.5a.75.75 0 0 1 0 1.5h-2.25A.75.75 0 0 1 11 10V7.5a.75.75 0 0 1 .75-.75Zm0 5.75a.9.9 0 1 1 0 1.8.9.9 0 0 1 0-1.8Z", fill),
    eleme: toDataUri("M12 3a9 9 0 1 1 0 18 9 9 0 0 1 0-18Zm0 1.5a7.5 7.5 0 1 0 0 15 7.5 7.5 0 0 0 0-15Zm-2.75 4.25h5.5a.75.75 0 0 1 0 1.5h-3.95l3.2 2.47a.75.75 0 0 1-.45 1.34H9.5a.75.75 0 0 1 0-1.5h3.95l-3.2-2.47a.75.75 0 0 1 .45-1.34Z", fill),
    flowcard: toDataUri("M12 2a10 10 0 1 1 0 20 10 10 0 0 1 0-20Zm0 2a8 8 0 1 0 0 16 8 8 0 0 0 0-16Zm-2 8a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm6 0a2 2 0 1 1 4 0 2 2 0 0 1-4 0Zm-8 4a1 1 0 0 1 1-1h6a1 1 0 0 1 0 2h-6a1 1 0 0 1-1-1Z", fill)
  }

  const src = map[name]
  return <Image className="icon-img" src={src} mode="widthFix" style={{ width: size, height: size }} />
}

export default AppIcon

