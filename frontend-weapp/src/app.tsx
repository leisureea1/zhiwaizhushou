import { Component } from 'react'
import './app.scss'

class App extends Component {
  componentDidMount() {
    // 应用启动时，尝试使用上次账号无感登录（仅刷新token与本地信息，不跳转）
    try {
      const token = wx.getStorageSync('userToken')
      const userInfo = wx.getStorageSync('userInfo')
      if (token && userInfo) {
        // 可在此添加“静默续期”逻辑；当前仅作为占位，确保启动就具备登录态
      }
    } catch {}
  }

  componentDidShow() {}

  componentDidHide() {}

  render() {
    // 注意这里，在 Taro 中，不需要渲染任何内容
    // 各个页面会自动根据路由进行渲染
    return this.props.children
  }
}

export default App
