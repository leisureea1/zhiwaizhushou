import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Badge } from './ui/badge';
import ApiService from '../services/api';

interface SystemLog {
  id: number;
  user_id: number | null;
  action: string;
  description: string;
  ip_address: string;
  user_agent: string;
  created_at: string;
  edu_system_username: string | null;
  user_name: string | null;
  avatar_url: string | null;
}

interface SystemStats {
  today_logs: number;
  week_logs: number;
  month_logs: number;
  total_logs: number;
  active_users_today: number;
  top_actions: Array<{ action: string; count: number }>;
}

export function SystemManagement() {
  const [logs, setLogs] = useState<SystemLog[]>([]);
  const [stats, setStats] = useState<SystemStats | null>(null);
  const [actionTypes, setActionTypes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalLogs, setTotalLogs] = useState(0);
  
  // 筛选条件
  const [filters, setFilters] = useState({
    action: '__all__',
    startDate: '',
    endDate: '',
  });

  useEffect(() => {
    fetchLogs();
    fetchStats();
    fetchActionTypes();
  }, [currentPage]);

  useEffect(() => {
    setCurrentPage(1);
    fetchLogs();
  }, [filters]);

  const fetchLogs = async () => {
    try {
      setLoading(true);
      const params: any = {
        page: currentPage,
        limit: 50,
      };
      
      if (filters.action && filters.action !== '__all__') params.action = filters.action;
      if (filters.startDate) params.start_date = filters.startDate;
      if (filters.endDate) params.end_date = filters.endDate;

      const data = await ApiService.getSystemLogs(params);
      setLogs(data.data || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalLogs(data.pagination?.total || 0);
    } catch (error) {
      console.error('获取系统日志失败:', error);
      setLogs([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const data = await ApiService.getSystemLogStats();
      setStats(data.data);
    } catch (error) {
      console.error('获取系统统计失败:', error);
    }
  };

  const fetchActionTypes = async () => {
    try {
      const data = await ApiService.getSystemLogActionTypes();
      setActionTypes(data.data || []);
    } catch (error) {
      console.error('获取操作类型失败:', error);
    }
  };

  const handleFilterChange = (key: string, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const handleResetFilters = () => {
    setFilters({
      action: '__all__',
      startDate: '',
      endDate: '',
    });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString('zh-CN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
  };

  const getActionBadgeColor = (action: string) => {
    if (action.includes('login')) return 'bg-blue-500';
    if (action.includes('create')) return 'bg-green-500';
    if (action.includes('update') || action.includes('edit')) return 'bg-yellow-500';
    if (action.includes('delete')) return 'bg-red-500';
    if (action.includes('review')) return 'bg-purple-500';
    if (action.includes('error')) return 'bg-red-600';
    return 'bg-gray-500';
  };

  return (
    <div className="space-y-6">
      {/* 页面标题 */}
      <div>
        <h1 className="text-3xl font-bold">系统管理</h1>
        <p className="text-gray-600 mt-2">查看系统日志和统计信息</p>
      </div>

      {/* 统计卡片 */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">今日日志</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.today_logs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">本周日志</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.week_logs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">本月日志</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.month_logs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">总日志数</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total_logs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600">今日活跃用户</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.active_users_today}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Top 操作统计 */}
      {stats && stats.top_actions.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>热门操作</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {stats.top_actions.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Badge className={getActionBadgeColor(item.action)}>
                      {item.action}
                    </Badge>
                  </div>
                  <span className="text-sm font-medium">{item.count} 次</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 筛选区域 */}
      <Card>
        <CardHeader>
          <CardTitle>筛选条件</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <Label htmlFor="action">操作类型</Label>
              <Select value={filters.action} onValueChange={(value: string) => handleFilterChange('action', value)}>
                <SelectTrigger id="action">
                  <SelectValue placeholder="全部操作" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__">全部操作</SelectItem>
                  {actionTypes.map(action => (
                    <SelectItem key={action} value={action}>{action}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="startDate">开始日期</Label>
              <Input
                id="startDate"
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
              />
            </div>

            <div>
              <Label htmlFor="endDate">结束日期</Label>
              <Input
                id="endDate"
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
              />
            </div>

            <div className="flex items-end">
              <Button variant="outline" onClick={handleResetFilters} className="w-full">
                重置筛选
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 日志列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>系统日志 (共 {totalLogs} 条)</CardTitle>
            <Button variant="outline" onClick={fetchLogs} disabled={loading}>
              {loading ? '加载中...' : '刷新'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[80px]">ID</TableHead>
                  <TableHead className="w-[150px]">用户</TableHead>
                  <TableHead className="w-[180px]">操作类型</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead className="w-[140px]">IP地址</TableHead>
                  <TableHead className="w-[180px]">时间</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      暂无日志记录
                    </TableCell>
                  </TableRow>
                ) : (
                  logs.map(log => (
                    <TableRow key={log.id}>
                      <TableCell className="font-mono text-xs">{log.id}</TableCell>
                      <TableCell>
                        {log.user_id ? (
                          <div className="flex items-center space-x-2">
                            {log.avatar_url && (
                              <img 
                                src={log.avatar_url} 
                                alt={log.user_name || '用户'} 
                                className="w-6 h-6 rounded-full"
                              />
                            )}
                            <div className="min-w-0">
                              <div className="text-sm font-medium truncate">
                                {log.user_name || '未知用户'}
                              </div>
                              {log.edu_system_username && (
                                <div className="text-xs text-gray-500 truncate">
                                  {log.edu_system_username}
                                </div>
                              )}
                            </div>
                          </div>
                        ) : (
                          <span className="text-gray-400">系统</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge className={getActionBadgeColor(log.action)}>
                          {log.action}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="max-w-md truncate" title={log.description}>
                          {log.description}
                        </div>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{log.ip_address}</TableCell>
                      <TableCell className="text-xs">{formatDate(log.created_at)}</TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>

          {/* 分页 */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4">
              <div className="text-sm text-gray-600">
                第 {currentPage} 页，共 {totalPages} 页
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1 || loading}
                >
                  上一页
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages || loading}
                >
                  下一页
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
