// 校区标注数据：将此文件中的经纬度替换为真实坐标即可生效
// 注意：微信地图使用国测局 GCJ-02（火星坐标系），请确保坐标源正确

export const CAMPUS_MARKERS = {
  changan: [
    { id: 1, latitude: 34.137355, longitude: 108.873348, title: '大学生活动中心体育场', width: 28, height: 28, callout: { content: '大学生活动中心体育场', color: '#111827', fontSize: 14, borderRadius: 6, padding: 6, display: 'BYCLICK', borderColor: '#e5e7eb', borderWidth: 1, bgColor: '#ffffff' } },
    { id: 2, latitude: 34.135609, longitude: 108.870662, title: '一操场', width: 28, height: 28, callout: { content: '一操场', color: '#111827', fontSize: 14, borderRadius: 6, padding: 6, display: 'BYCLICK', borderColor: '#e5e7eb', borderWidth: 1, bgColor: '#ffffff' } },
    { id: 3, latitude: 34.135824, longitude: 108.871949, title: '二操场', width: 28, height: 28, callout: { content: '二操场', color: '#111827', fontSize: 14, borderRadius: 6, padding: 6, display: 'BYCLICK', borderColor: '#e5e7eb', borderWidth: 1, bgColor: '#ffffff' } },
    { id: 4, latitude: 34.135129, longitude: 108.875225, title: '实验楼区', width: 28, height: 28, callout: { content: '实验楼区', color: '#111827', fontSize: 14, borderRadius: 6, padding: 6, display: 'BYCLICK', borderColor: '#e5e7eb', borderWidth: 1, bgColor: '#ffffff' } },
    { id: 5, latitude: 34.136192, longitude: 108.875520, title: '教学楼区', width: 28, height: 28, callout: { content: '教学楼区', color: '#111827', fontSize: 14, borderRadius: 6, padding: 6, display: 'BYCLICK', borderColor: '#e5e7eb', borderWidth: 1, bgColor: '#ffffff' } },
    { id: 6, latitude: 34.140443, longitude: 108.877378, title: '二食堂', width: 28, height: 28, callout: { content: '二食堂', color: '#111827', fontSize: 14, borderRadius: 6, padding: 6, display: 'BYCLICK', borderColor: '#e5e7eb', borderWidth: 1, bgColor: '#ffffff' } },
    { id: 7, latitude: 34.138120, longitude: 108.873233, title: '一食堂', width: 28, height: 28, callout: { content: '一食堂', color: '#111827', fontSize: 14, borderRadius: 6, padding: 6, display: 'BYCLICK', borderColor: '#e5e7eb', borderWidth: 1, bgColor: '#ffffff' } },
    { id: 8, latitude: 34.136982, longitude: 108.870757, title: '文体馆', width: 28, height: 28, callout: { content: '文体馆', color: '#111827', fontSize: 14, borderRadius: 6, padding: 6, display: 'BYCLICK', borderColor: '#e5e7eb', borderWidth: 1, bgColor: '#ffffff' } },
    { id: 9, latitude: 34.137257, longitude: 108.876964, title: '图书馆行政办公楼', width: 28, height: 28, callout: { content: '图书馆行政办公楼', color: '#111827', fontSize: 14, borderRadius: 6, padding: 6, display: 'BYCLICK', borderColor: '#e5e7eb', borderWidth: 1, bgColor: '#ffffff' } },
    { id: 10, latitude: 34.137962, longitude: 108.879090, title: '校务楼', width: 28, height: 28, callout: { content: '校务楼', color: '#111827', fontSize: 14, borderRadius: 6, padding: 6, display: 'BYCLICK', borderColor: '#e5e7eb', borderWidth: 1, bgColor: '#ffffff' } },
    { id: 11, latitude: 34.140815, longitude: 108.878958, title: '七号宿舍楼', width: 28, height: 28, callout: { content: '七号宿舍楼', color: '#111827', fontSize: 14, borderRadius: 6, padding: 6, display: 'BYCLICK', borderColor: '#e5e7eb', borderWidth: 1, bgColor: '#ffffff' } }
  ],
  yanta: []
} as const
