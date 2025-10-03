import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Users, Megaphone, ShoppingBag, Package, TrendingUp, Activity } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import ApiService from '../services/api';

const statsData = [
  {
    title: '用户总数',
    value: '2,847',
    change: '+12%',
    changeType: 'positive',
    icon: Users,
    color: 'bg-blue-500'
  },
  {
    title: '公告数量',
    value: '156',
    change: '+8%',
    changeType: 'positive',
    icon: Megaphone,
    color: 'bg-green-500'
  },
  {
    title: '二手物品',
    value: '1,234',
    change: '+23%',
    changeType: 'positive',
    icon: ShoppingBag,
    color: 'bg-orange-500'
  },
  {
    title: '失物招领',
    value: '89',
    change: '-5%',
    changeType: 'negative',
    icon: Package,
    color: 'bg-purple-500'
  }
];

const chartData = [
  { name: '1月', users: 400, announcements: 24, items: 240 },
  { name: '2月', users: 300, announcements: 13, items: 220 },
  { name: '3月', users: 200, announcements: 98, items: 229 },
  { name: '4月', users: 278, announcements: 39, items: 200 },
  { name: '5月', users: 189, announcements: 48, items: 218 },
  { name: '6月', users: 239, announcements: 38, items: 250 },
  { name: '7月', users: 349, announcements: 43, items: 210 }
];

const activityData = [
  { name: '周一', value: 400 },
  { name: '周二', value: 300 },
  { name: '周三', value: 500 },
  { name: '周四', value: 280 },
  { name: '周五', value: 590 },
  { name: '周六', value: 320 },
  { name: '周日', value: 200 }
];

export function Dashboard() {
  const [loading, setLoading] = React.useState(false);
  const [stats, setStats] = React.useState({
    totalUsers: 0,
    totalCourses: 0,
    totalAnnouncements: 0,
    totalLostItems: 0
  });

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getDashboardStats();
      setStats(data);
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
      // 如果API调用失败，使用示例数据
      setStats({
        totalUsers: 1250,
        totalCourses: 85,
        totalAnnouncements: 32,
        totalLostItems: 15
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsData.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <div className={`p-2 rounded-lg ${stat.color}`}>
                  <Icon className="w-4 h-4 text-white" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Badge variant={stat.changeType === 'positive' ? 'default' : 'destructive'} className="text-xs">
                    {stat.change}
                  </Badge>
                  <span>较上月</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 图表区域 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 趋势图 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="w-5 h-5" />
              <span>活动趋势</span>
            </CardTitle>
            <CardDescription>最近7个月的系统活动趋势</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="users" 
                  stroke="#4F46E5" 
                  strokeWidth={2}
                  name="用户活动"
                />
                <Line 
                  type="monotone" 
                  dataKey="announcements" 
                  stroke="#10B981" 
                  strokeWidth={2}
                  name="公告发布"
                />
                <Line 
                  type="monotone" 
                  dataKey="items" 
                  stroke="#F59E0B" 
                  strokeWidth={2}
                  name="物品交易"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 活动统计 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Activity className="w-5 h-5" />
              <span>周活动统计</span>
            </CardTitle>
            <CardDescription>本周各日活跃度统计</CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={activityData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#4F46E5" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* 快速操作 */}
      <Card>
        <CardHeader>
          <CardTitle>快速操作</CardTitle>
          <CardDescription>常用功能快速入口</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Users className="w-8 h-8 text-blue-500 mb-2" />
              <h3 className="font-medium">添加用户</h3>
              <p className="text-sm text-gray-500">添加新的系统用户</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Megaphone className="w-8 h-8 text-green-500 mb-2" />
              <h3 className="font-medium">发布公告</h3>
              <p className="text-sm text-gray-500">发布系统公告</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <ShoppingBag className="w-8 h-8 text-orange-500 mb-2" />
              <h3 className="font-medium">商品审核</h3>
              <p className="text-sm text-gray-500">审核二手商品</p>
            </div>
            <div className="p-4 border rounded-lg hover:bg-gray-50 cursor-pointer transition-colors">
              <Package className="w-8 h-8 text-purple-500 mb-2" />
              <h3 className="font-medium">处理失物</h3>
              <p className="text-sm text-gray-500">处理失物招领</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}