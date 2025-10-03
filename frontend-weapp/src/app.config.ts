export default {
  pages: [
    'pages/schedule/index',
    'pages/index/index', 
    'pages/profile/index',
    'pages/login/index',
    'pages/grades/index',
    'pages/update-jwxt-password/index',
    'pages/change-app-password/index',
    'pages/forgot-password/index',
    'pages/flea-market/index',
    'pages/flea-market-publish/index',
    'pages/lost-found/index',
    'pages/lost-found-publish/index'
  ],
  window: {
    navigationStyle: 'custom'
  },
  tabBar: {
    color: '#9ca3af',
    selectedColor: '#3b82f6', 
    backgroundColor: '#ffffff',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/schedule/index',
        text: '首页',
        iconPath: 'assets/tabbar/home.png',
        selectedIconPath: 'assets/tabbar/home-active.png'
      },
      {
        pagePath: 'pages/index/index',
        text: '应用',
        iconPath: 'assets/tabbar/apps.png',
        selectedIconPath: 'assets/tabbar/apps-active.png'
      },
      {
        pagePath: 'pages/profile/index',
        text: '个人',
        iconPath: 'assets/tabbar/profile.png',
        selectedIconPath: 'assets/tabbar/profile-active.png'
      }
    ]
  },
  style: 'v2'
}
