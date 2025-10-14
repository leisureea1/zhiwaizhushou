import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Users, Megaphone, ShoppingBag, Package, AlertCircle } from 'lucide-react';
import ApiService from '../services/api';

export function Dashboard() {
  const [loading, setLoading] = React.useState(true);
  const [stats, setStats] = React.useState({
    user_count: 0,
    announcement_count: 0,
    item_count: 0
  });
  const [recentAnnouncements, setRecentAnnouncements] = React.useState<any[]>([]);
  const [pendingItems, setPendingItems] = React.useState<any[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // 并行获取所有数据
      const [statsData, announcementsData, itemsData] = await Promise.all([
        ApiService.getDashboardStats(),
        ApiService.getRecentAnnouncements(),
        ApiService.getPendingItems()
      ]);
      
      // 处理统计数据
      if (statsData.error) {
        setError(statsData.error);
      } else {
        setStats({
          user_count: statsData.user_count || 0,
          announcement_count: statsData.announcement_count || 0,
          item_count: statsData.item_count || 0
        });
      }

      // 处理最近公告
      if (announcementsData.announcements) {
        setRecentAnnouncements(announcementsData.announcements);
      }

      // 处理待审核物品
      if (itemsData.items) {
        setPendingItems(itemsData.items);
      }
    } catch (error) {
      console.error('获取仪表板数据失败:', error);
      setError('获取数据失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const statsData = [
    {
      title: '用户总数',
      value: loading ? '...' : stats.user_count.toString(),
      icon: Users,
      color: 'bg-blue-500',
      description: '平台注册用户'
    },
    {
      title: '公告数量',
      value: loading ? '...' : stats.announcement_count.toString(),
      icon: Megaphone,
      color: 'bg-green-500',
      description: '已发布公告'
    },
    {
      title: '二手物品',
      value: loading ? '...' : stats.item_count.toString(),
      icon: ShoppingBag,
      color: 'bg-orange-500',
      description: '跳蚤市场商品'
    }
  ];

  return (
    <div className="space-y-6">
      {/* 错误提示 */}
      {error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="w-5 h-5" />
              <span>{error}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* 统计数据卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                <p className="text-xs text-muted-foreground mt-1">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* 最近活动 */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* 最近公告 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Megaphone className="w-5 h-5" />
              <span>最近公告</span>
            </CardTitle>
            <CardDescription>最近发布的5条公告</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : recentAnnouncements.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无公告</div>
            ) : (
              <div className="space-y-4">
                {recentAnnouncements.map((announcement) => (
                  <div key={announcement.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{announcement.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        发布时间: {new Date(announcement.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* 待审核物品 */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <ShoppingBag className="w-5 h-5" />
              <span>待审核物品</span>
            </CardTitle>
            <CardDescription>等待审核的跳蚤市场商品</CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="text-center py-8 text-muted-foreground">加载中...</div>
            ) : pendingItems.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无待审核物品</div>
            ) : (
              <div className="space-y-4">
                {pendingItems.map((item) => (
                  <div key={item.id} className="flex items-start justify-between p-3 border rounded-lg hover:bg-gray-50 transition-colors">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{item.title}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        提交时间: {new Date(item.created_at).toLocaleDateString('zh-CN')}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}