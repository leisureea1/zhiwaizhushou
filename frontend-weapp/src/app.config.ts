export default {
  pages: [
    // 仅保留 TabBar 页面在主包，其他移入分包以降低主包体积
    'pages/schedule/index',
    'pages/index/index',
    'pages/profile/index'
  ],
  // 启用组件按需注入，减少主包体积
  lazyCodeLoading: 'requiredComponents',
  subPackages: [
    { root: 'pages/schedule-share', pages: ['index'] },
    { root: 'pages/map', pages: ['index'] },
    { root: 'pages/commute', pages: ['index'] },
    { root: 'pages/privacy', pages: ['index'] },
    { root: 'pages/login', pages: ['index'] },
    { root: 'pages/grades', pages: ['index'] },
    { root: 'pages/update-jwxt-password', pages: ['index'] },
    { root: 'pages/change-app-password', pages: ['index'] },
    { root: 'pages/forgot-password', pages: ['index'] },
    { root: 'pages/flowcard', pages: ['index'] },
    // 公告详情页面
    { root: 'pages/announcement-detail', pages: ['index'] },
    // 跳蚤市场各页面为独立目录
    { root: 'pages/flea-market', pages: ['index'] },
    { root: 'pages/flea-market-mine', pages: ['index'] },
    { root: 'pages/flea-market-my-list', pages: ['index'] },
    { root: 'pages/flea-market-my-messages', pages: ['index'] },
    { root: 'pages/flea-market-publish', pages: ['index'] },
    { root: 'pages/flea-market-detail', pages: ['index'] },
    // 失物招领各页面为独立目录
    { root: 'pages/lost-found', pages: ['index'] },
    { root: 'pages/lost-found-publish', pages: ['index'] },
    { root: 'pages/lost-found-detail', pages: ['index'] },
    { root: 'pages/lost-found-mine', pages: ['index'] },
    { root: 'pages/lost-found-my-list', pages: ['index'] },
    { root: 'pages/lost-found-my-messages', pages: ['index'] }
  ],
  window: {
    navigationStyle: 'custom'
  },
  permission: {
    'scope.userLocation': {
      desc: '用于在校内地图显示您的当前位置，便于在校园内导航定位'
    }
  },
  requiredPrivateInfos: ['getLocation'],
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
