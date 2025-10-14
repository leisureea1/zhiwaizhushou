import React, { Component } from 'react'
import { View, Image, Button } from '@tarojs/components'
import Taro from '@tarojs/taro'
import './index.scss'

interface ShareState {
  imgPath: string
}

export default class SharePreviewPage extends Component<any, ShareState> {
  state: ShareState = {
    imgPath: ''
  }

  componentDidMount() {
    // 从缓存读取图片路径
    const imgPath = Taro.getStorageSync('shareImagePath') || ''
    this.setState({ imgPath })
  }

  onSave = () => {
    const { imgPath } = this.state
    if (!imgPath) {
      Taro.showToast({ title: '图片不存在', icon: 'none' })
      return
    }

    Taro.saveImageToPhotosAlbum({
      filePath: imgPath,
      success: () => {
        Taro.showToast({ title: '已保存到相册', icon: 'success' })
      },
      fail: (err) => {
        if (err.errMsg.includes('auth')) {
          Taro.showModal({
            title: '需要相册权限',
            content: '请在设置中允许访问相册',
            confirmText: '去设置',
            success: (res) => {
              if (res.confirm) {
                Taro.openSetting()
              }
            }
          })
        } else {
          Taro.showToast({ title: '保存失败', icon: 'none' })
        }
      }
    })
  }

  render() {
    const { imgPath } = this.state
    return (
      <View className='share-page'>
        <View className='preview-wrap'>
          {imgPath && <Image className='preview-img' mode='widthFix' src={imgPath} show-menu-by-longpress />}
          {!imgPath && <View className='empty-tip'>图片加载中...</View>}
        </View>
        <View className='bottom-bar'>
          <Button onClick={this.onSave} type='primary' disabled={!imgPath}>
            保存到相册
          </Button>
        </View>
      </View>
    )
  }
}
