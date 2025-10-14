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
} from './ui/dialog';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { 
  Search, 
  Eye,
  Trash2,
  Calendar,
  User,
  MapPin,
  Tag,
  Clock
} from 'lucide-react';
import ApiService from '../services/api';

interface LostFoundItem {
  id: string;
  description: string;
  category: string;
  location: string;
  lost_time: string;
  contact_info: string;
  image_url: string;
  image_urls?: string[];
  wechat_qr_url?: string;
  publisher_uid: string;
  publisher_name: string;
  status: string;
  created_at: string;
}

const LostFoundManagement: React.FC = () => {
  const [items, setItems] = useState<LostFoundItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<LostFoundItem | null>(null);

  useEffect(() => {
    fetchItems();
  }, [categoryFilter]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const params: any = { limit: 100 };
      
      if (categoryFilter !== 'all') {
        params.category = categoryFilter;
      }
      
      const data = await ApiService.getLostFoundList(params);
      
      // 处理图片数组
      const processedItems = (data.data || []).map((item: any) => {
        let imageUrls = item.image_urls;
        
        if (typeof imageUrls === 'string') {
          try {
            imageUrls = JSON.parse(imageUrls);
          } catch (e) {
            console.error('解析图片数组失败:', e);
            imageUrls = [];
          }
        }
        
        if (!Array.isArray(imageUrls)) {
          imageUrls = item.image_url ? [item.image_url] : [];
        }
        
        return {
          ...item,
          image_urls: imageUrls
        };
      });
      
      setItems(processedItems);
    } catch (error) {
      console.error('获取失物招领列表失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleView = (item: LostFoundItem) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定要删除这条失物招领信息吗？')) return;
    
    try {
      await ApiService.deleteLostFoundItem(id);
      fetchItems();
    } catch (error) {
      console.error('删除失败:', error);
      alert('删除失败，请重试');
    }
  };

  const getCategoryBadge = (category: string) => {
    const categoryMap: { [key: string]: { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' } } = {
      'lost': { label: '失物', variant: 'destructive' },
      'found': { label: '招领', variant: 'default' },
    };
    
    const config = categoryMap[category] || { label: category, variant: 'outline' as const };
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const filteredItems = items.filter(item => {
    const matchesSearch = searchTerm === '' || 
      item.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.location.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.publisher_name.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>失物招领管理</CardTitle>
          <CardDescription>查看和管理所有失物招领信息</CardDescription>
        </CardHeader>
        <CardContent>
          {/* 搜索和筛选 */}
          <div className="flex gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="搜索描述、地点或发布者..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="筛选类别" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">全部类别</SelectItem>
                <SelectItem value="lost">失物</SelectItem>
                <SelectItem value="found">招领</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 统计信息 */}
          <div className="grid grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">{items.length}</div>
                <p className="text-xs text-muted-foreground">总数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {items.filter(i => i.category === 'lost').length}
                </div>
                <p className="text-xs text-muted-foreground">失物</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">
                  {items.filter(i => i.category === 'found').length}
                </div>
                <p className="text-xs text-muted-foreground">招领</p>
              </CardContent>
            </Card>
          </div>

          {/* 列表 */}
          <div className="rounded-md border">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>类别</TableHead>
                  <TableHead>描述</TableHead>
                  <TableHead>地点</TableHead>
                  <TableHead>时间</TableHead>
                  <TableHead>发布者</TableHead>
                  <TableHead>发布时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      加载中...
                    </TableCell>
                  </TableRow>
                ) : filteredItems.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center">
                      暂无数据
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredItems.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell>{getCategoryBadge(item.category)}</TableCell>
                      <TableCell className="max-w-xs">
                        <div className="truncate">{item.description}</div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <MapPin className="h-3 w-3 text-gray-400" />
                          {item.location}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3 text-gray-400" />
                          {item.lost_time || '-'}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <User className="h-3 w-3 text-gray-400" />
                          {item.publisher_name}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3 text-gray-400" />
                          {new Date(item.created_at).toLocaleString('zh-CN')}
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex gap-2 justify-end">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleView(item)}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            查看
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleDelete(item.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            删除
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* 查看详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>失物招领详情</DialogTitle>
            <DialogDescription>
              查看详细信息
            </DialogDescription>
          </DialogHeader>
          
          {selectedItem && (
            <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">类别</Label>
                  <div className="mt-1">{getCategoryBadge(selectedItem.category)}</div>
                </div>
                <div>
                  <Label className="text-gray-500">发布者</Label>
                  <div className="mt-1">{selectedItem.publisher_name}</div>
                </div>
              </div>

              <div>
                <Label className="text-gray-500">描述</Label>
                <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                  {selectedItem.description}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-gray-500">地点</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    {selectedItem.location}
                  </div>
                </div>
                <div>
                  <Label className="text-gray-500">时间</Label>
                  <div className="mt-1 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400" />
                    {selectedItem.lost_time || '未填写'}
                  </div>
                </div>
              </div>

              <div>
                <Label className="text-gray-500">联系方式</Label>
                <div className="mt-1">{selectedItem.contact_info}</div>
              </div>

              {/* 图片展示 */}
              {selectedItem.image_urls && selectedItem.image_urls.length > 0 && (
                <div>
                  <Label className="text-gray-500">图片 ({selectedItem.image_urls.length}张)</Label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedItem.image_urls.map((url, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img 
                          src={url} 
                          alt={`图片 ${index + 1}`}
                          className="w-full h-full object-contain rounded border bg-white cursor-pointer"
                          style={{ maxHeight: '200px' }}
                          onClick={() => {
                            window.open(url, '_blank');
                          }}
                          onError={(e) => {
                            console.error('[图片加载失败]', url);
                            const target = e.target as HTMLImageElement;
                            target.style.backgroundColor = '#f3f4f6';
                            target.alt = '图片加载失败';
                          }}
                        />
                        <div className="absolute bottom-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity">
                          点击查看
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 微信二维码 */}
              {selectedItem.wechat_qr_url && (
                <div>
                  <Label className="text-gray-500">微信二维码</Label>
                  <div className="mt-2 flex justify-center">
                    <img
                      src={selectedItem.wechat_qr_url}
                      alt="微信二维码"
                      className="w-48 h-48 object-contain border rounded bg-white cursor-pointer"
                      onClick={() => {
                        window.open(selectedItem.wechat_qr_url, '_blank');
                      }}
                    />
                  </div>
                </div>
              )}

              <div>
                <Label className="text-gray-500">发布时间</Label>
                <div className="mt-1 text-gray-600">
                  {new Date(selectedItem.created_at).toLocaleString('zh-CN')}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default LostFoundManagement;
