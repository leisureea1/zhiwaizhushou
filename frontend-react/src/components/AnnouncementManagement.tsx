import React, { useState, useEffect, useMemo } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
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
  author: string;
  publishDate: string;
  images?: string[]; // 图片URL数组
}

const AnnouncementManagement: React.FC = () => {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddAnnouncementOpen, setIsAddAnnouncementOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);
  const [newAnnouncement, setNewAnnouncement] = useState({
    title: '',
    content: '',
    images: [] as string[] // 图片URL数组
  });
  const [editingAnnouncement, setEditingAnnouncement] = useState({
    title: '',
    content: '',
    images: [] as string[]
  });
  const [uploadingImages, setUploadingImages] = useState(false);
  const quillRef = React.useRef<any>(null);
  const editQuillRef = React.useRef<any>(null);

  // 自定义图片上传处理器
  const imageHandler = React.useCallback(() => {
    const input = document.createElement('input');
    input.setAttribute('type', 'file');
    input.setAttribute('accept', 'image/*');
    input.click();

    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;

      // 验证文件大小（最大 5MB）
      if (file.size > 5 * 1024 * 1024) {
        alert('图片大小不能超过 5MB');
        return;
      }

      // 验证文件类型
      if (!file.type.startsWith('image/')) {
        alert('请选择图片文件');
        return;
      }

      try {
        setUploadingImages(true);
        
        // 上传图片到服务器
        const result = await ApiService.uploadImage(file, true);
        
        // 获取编辑器实例
        const quill = quillRef.current?.getEditor();
        if (!quill) return;

        // 获取当前光标位置
        const range = quill.getSelection(true);
        
        // 在光标位置插入图片
        quill.insertEmbed(range.index, 'image', result.url);
        
        // 移动光标到图片后面
        quill.setSelection(range.index + 1);
        
        console.log('图片上传成功:', result.url);
      } catch (error) {
        console.error('图片上传失败:', error);
        alert('图片上传失败，请重试');
      } finally {
        setUploadingImages(false);
      }
    };
  }, []);

  // Quill 编辑器配置
  const quillModules = React.useMemo(() => ({
    toolbar: {
      container: [
        [{ 'header': [1, 2, 3, false] }],
        ['bold', 'italic', 'underline', 'strike'],
        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
        [{ 'indent': '-1'}, { 'indent': '+1' }],
        [{ 'color': [] }, { 'background': [] }],
        [{ 'align': [] }],
        ['link', 'image', 'video'], // 添加图片和视频按钮
        ['blockquote', 'code-block'],
        ['clean']
      ],
      handlers: {
        image: imageHandler // 自定义图片上传处理器
      }
    }
  }), [imageHandler]);

  const quillFormats = [
    'header',
    'bold', 'italic', 'underline', 'strike',
    'list', 'bullet', 'indent',
    'color', 'background',
    'align',
    'link', 'image', 'video', // 添加图片和视频格式
    'blockquote', 'code-block'
  ];

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
          author: '系统管理员',
          publishDate: '2024-01-15'
        },
        {
          id: '2',
          title: '新学期课程安排',
          content: '新学期课程安排已发布，请同学们及时查看',
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
  );

  const handleAddAnnouncement = async () => {
    try {
      // 调用创建公告API
      await ApiService.createAnnouncement(newAnnouncement);
      alert('创建成功！');
      // 重新获取公告列表
      await fetchAnnouncements();
      setIsAddAnnouncementOpen(false);
      setNewAnnouncement({ title: '', content: '', images: [] });
    } catch (error: any) {
      console.error('创建公告失败:', error);
      const errorMsg = error.message || '创建公告失败，请稍后重试';
      if (errorMsg.includes('未登录') || errorMsg.includes('会话已过期')) {
        alert('您的登录已过期，请重新登录');
        window.location.href = '/login';
      } else {
        alert(errorMsg);
      }
    }
  };

  // 查看公告
  const handleView = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setIsViewDialogOpen(true);
  };

  // 编辑公告
  const handleEdit = (announcement: Announcement) => {
    setSelectedAnnouncement(announcement);
    setEditingAnnouncement({
      title: announcement.title,
      content: announcement.content,
      images: announcement.images || []
    });
    setIsEditDialogOpen(true);
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!selectedAnnouncement) return;
    
    try {
      await ApiService.updateAnnouncement(selectedAnnouncement.id, editingAnnouncement);
      alert('更新成功！');
      await fetchAnnouncements();
      setIsEditDialogOpen(false);
      setSelectedAnnouncement(null);
      setEditingAnnouncement({ title: '', content: '', images: [] });
    } catch (error: any) {
      console.error('更新公告失败:', error);
      const errorMsg = error.message || '更新公告失败，请稍后重试';
      if (errorMsg.includes('未登录') || errorMsg.includes('会话已过期')) {
        alert('您的登录已过期，请重新登录');
        window.location.href = '/login';
      } else if (errorMsg.includes('只有管理员')) {
        alert('权限不足：只有管理员可以修改公告');
      } else {
        alert(errorMsg);
      }
    }
  };

  // 删除公告
  const handleDelete = async (announcement: Announcement) => {
    if (!confirm(`确定要删除公告"${announcement.title}"吗？此操作不可恢复。`)) {
      return;
    }
    
    try {
      await ApiService.deleteAnnouncement(announcement.id);
      alert('删除成功！');
      await fetchAnnouncements();
    } catch (error: any) {
      console.error('删除公告失败:', error);
      const errorMsg = error.message || '删除公告失败，请稍后重试';
      if (errorMsg.includes('未登录') || errorMsg.includes('会话已过期')) {
        alert('您的登录已过期，请重新登录');
        // 可以在这里跳转到登录页
        window.location.href = '/login';
      } else if (errorMsg.includes('只有管理员')) {
        alert('权限不足：只有管理员可以删除公告');
      } else {
        alert(errorMsg);
      }
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
                    <div className="border rounded-md">
                      <ReactQuill 
                        ref={quillRef}
                        theme="snow"
                        value={newAnnouncement.content}
                        onChange={(value: string) => setNewAnnouncement({ ...newAnnouncement, content: value })}
                        modules={quillModules}
                        formats={quillFormats}
                        placeholder="请输入公告内容，支持富文本格式和图片..."
                        style={{ minHeight: '200px' }}
                      />
                    </div>
                    {uploadingImages && (
                      <p className="text-sm text-blue-600">正在上传图片...</p>
                    )}
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
                        <Button variant="ghost" size="sm" onClick={() => handleView(announcement)}>
                          <Eye className="w-4 h-4" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(announcement)}>
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600 hover:text-red-700"
                          onClick={() => handleDelete(announcement)}
                        >
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

      {/* 查看公告对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>查看公告</DialogTitle>
          </DialogHeader>
          {selectedAnnouncement && (
            <div className="space-y-4">
              <div>
                <Label>标题</Label>
                <div className="mt-1 text-lg font-semibold">{selectedAnnouncement.title}</div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>作者</Label>
                  <div className="mt-1">{selectedAnnouncement.author}</div>
                </div>
                <div>
                  <Label>发布日期</Label>
                  <div className="mt-1">{selectedAnnouncement.publishDate}</div>
                </div>
              </div>
              <div>
                <Label>内容</Label>
                <div 
                  className="mt-2 p-4 border rounded-lg prose max-w-none"
                  dangerouslySetInnerHTML={{ __html: selectedAnnouncement.content }}
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* 编辑公告对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>编辑公告</DialogTitle>
            <DialogDescription>修改公告信息</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">标题</Label>
              <Input
                id="edit-title"
                value={editingAnnouncement.title}
                onChange={(e) => setEditingAnnouncement({ ...editingAnnouncement, title: e.target.value })}
                placeholder="请输入公告标题"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-content">内容</Label>
              <div className="border rounded-lg overflow-hidden">
                <ReactQuill
                  ref={editQuillRef}
                  theme="snow"
                  value={editingAnnouncement.content}
                  onChange={(content) => setEditingAnnouncement({ ...editingAnnouncement, content })}
                  modules={{
                    toolbar: {
                      container: [
                        [{ 'header': [1, 2, 3, false] }],
                        ['bold', 'italic', 'underline', 'strike'],
                        [{ 'list': 'ordered'}, { 'list': 'bullet' }],
                        [{ 'color': [] }, { 'background': [] }],
                        [{ 'align': [] }],
                        ['link', 'image'],
                        ['clean']
                      ],
                      handlers: {
                        image: imageHandler
                      }
                    }
                  }}
                  className="bg-white"
                  style={{ minHeight: '300px' }}
                />
              </div>
              {uploadingImages && (
                <div className="text-sm text-blue-600">正在上传图片...</div>
              )}
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              取消
            </Button>
            <Button onClick={handleSaveEdit} className="bg-primary hover:bg-primary/90">
              保存
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { AnnouncementManagement };