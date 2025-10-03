import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from './ui/table';
import { 
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye,
  Calendar,
  User
} from 'lucide-react';
import ApiService from '../services/api';

interface Announcement {
  id: string;
  title: string;
  content: string;
  status: string;
  author: string;
  publishDate: string;
}

const AnnouncementManagement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    status: 'draft'
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getAnnouncements();
      setAnnouncements(data);
    } catch (error) {
      console.error('获取公告失败:', error);
      // 如果API调用失败，使用示例数据
      setAnnouncements([
        {
          id: '1',
          title: '系统维护通知',
          content: '系统将于今晚进行维护，预计维护时间2小时',
          status: 'published',
          author: '系统管理员',
          publishDate: '2024-01-15'
        },
        {
          id: '2',
          title: '新学期课程安排',
          content: '新学期课程安排已发布，请同学们及时查看',
          status: 'published',
          author: '教务处',
          publishDate: '2024-01-10'
        }
      ]);
    } finally {
      setLoading(false);
    }
  };

  const filteredAnnouncements = announcements.filter(announcement =>
    announcement.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    announcement.author.toLowerCase().includes(searchTerm.toLowerCase())
  ).filter(announcement => 
    statusFilter === 'all' || announcement.status === statusFilter
  );

  const handleAddAnnouncement = async () => {
    try {
      // 调用创建公告API
      await ApiService.createAnnouncement(newAnnouncement);
      // 重新获取公告列表
      await fetchAnnouncements();
      setIsAddAnnouncementOpen(false);
      setNewAnnouncement({ title: '', content: '', status: 'draft' });
    } catch (error) {
      console.error('创建公告失败:', error);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-500">已发布</Badge>;
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-500">定时发布</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <Card>
        <CardHeader>
          <CardTitle>公告管理</CardTitle>
          <CardDescription>管理系统公告和通知信息</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row flex-1 gap-2 sm:items-center sm:space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索公告..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-32">
                  <SelectValue placeholder="状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部</SelectItem>
                  <SelectItem value="published">已发布</SelectItem>
                  <SelectItem value="draft">草稿</SelectItem>
                  <SelectItem value="scheduled">定时发布</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <Dialog open={isAddAnnouncementOpen} onOpenChange={setIsAddAnnouncementOpen}>
              <DialogTrigger asChild>
                <Button size="sm" className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  新建公告
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>新建公告</DialogTitle>
                  <DialogDescription>
                    创建新的系统公告或通知
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">标题</Label>
                    <Input
                      id="title"
                      value={newAnnouncement.title}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, title: e.target.value })}
                      placeholder="请输入公告标题"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="content">内容</Label>
                    <textarea
                      id="content"
                      value={newAnnouncement.content}
                      onChange={(e) => setNewAnnouncement({ ...newAnnouncement, content: e.target.value })}
                      placeholder="请输入公告内容"
                      rows={6}
                      className="flex w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 min-h-[80px]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="status">状态</Label>
                    <Select 
                      value={newAnnouncement.status}
                      onValueChange={(value) => setNewAnnouncement({ ...newAnnouncement, status: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="draft">保存为草稿</SelectItem>
                        <SelectItem value="published">立即发布</SelectItem>
                        <SelectItem value="scheduled">定时发布</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => setIsAddAnnouncementOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddAnnouncement} className="bg-primary hover:bg-primary/90">
                    创建
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>

      {/* 公告表格 */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-lg">加载中...</div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>标题</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>作者</TableHead>
                  <TableHead>发布日期</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnnouncements.map((announcement) => (
                  <TableRow key={announcement.id} className="hover:bg-gray-50">
                    <TableCell>
                      <div className="max-w-xs lg:max-w-md">
                        <div className="font-medium truncate">{announcement.title}</div>
                        <div className="text-sm text-gray-500 truncate">{announcement.content}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(announcement.status)}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <User className="w-4 h-4 text-gray-400" />
                        <span>{announcement.author}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <Calendar className="w-4 h-4 text-gray-400" />
                        <span>{announcement.publishDate}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end space-x-2">
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700">
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export { AnnouncementManagement };