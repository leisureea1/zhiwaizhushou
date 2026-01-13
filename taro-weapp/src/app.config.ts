export default {
  pages: [
    'pages/login/index',
    'pages/home/index',
    'pages/apps/index',
    'pages/profile/index',
    'pages/grades/index',
    'pages/exams/index',
    'pages/bus/index',
    'pages/evaluation/index',
    'pages/ai-chat/index'
  ],
  tabBar: {
    color: '#9ca3af',
    selectedColor: '#3b82f6',
    backgroundColor: '#ffffff',
    list: [
      {
        pagePath: 'pages/home/index',
        text: '首页'
      },
      {
        pagePath: 'pages/apps/index',
        text: '应用'
      },
      {
        pagePath: 'pages/profile/index',
        text: '个人'
      }
    ]
  },
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#ffffff',
    navigationBarTitleText: '知外助手',
    navigationBarTextStyle: 'black'
  }
}
