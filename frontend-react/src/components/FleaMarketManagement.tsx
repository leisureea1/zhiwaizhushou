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
import { Textarea } from './ui/textarea';
import { 
  Search, 
  Eye,
  CheckCircle,
  XCircle,
  Trash2,
  Calendar,
  User,
  DollarSign,
  Tag,
  MapPin
} from 'lucide-react';
import ApiService from '../services/api';

interface FleaMarketItem {
  id: string;
  title: string;
  description: string;
  price: number;
  category: string;
  condition_level: string;
  image_url: string;
  image_urls?: string[];
  location: string;
  contact_info: string;
  publisher_uid: string;
  publisher_name: string;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
}

const FleaMarketManagement: React.FC = () => {
  const [items, setItems] = useState<FleaMarketItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<FleaMarketItem | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    fetchItems();
  }, [statusFilter]);

  const fetchItems = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getFleaMarketList({ 
        status: statusFilter,
        limit: 100 
      });
      
      // 处理图片数组 - 如果 image_urls 是字符串,解析为数组
      const processedItems = (data.data || []).map((item: any) => {
        let imageUrls = item.image_urls;
        
        // 如果是字符串,尝试解析为JSON数组
        if (typeof imageUrls === 'string') {
          try {
            imageUrls = JSON.parse(imageUrls);
          } catch (e) {
            console.error('解析图片数组失败:', e);
            imageUrls = [];
          }
        }
        
        // 确保是数组
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
      console.error('获取商品列表失败:', error);
      setItems([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = items.filter(item =>
    item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.publisher_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 查看商品详情
  const handleView = (item: FleaMarketItem) => {
    setSelectedItem(item);
    setIsViewDialogOpen(true);
  };

  // 审核通过
  const handleApprove = async (item: FleaMarketItem) => {
    if (!confirm(`确定审核通过商品"${item.title}"吗？`)) {
      return;
    }
    
    try {
      await ApiService.approveFleaMarketItem(item.id);
      alert('审核通过成功！');
      await fetchItems();
    } catch (error: any) {
      console.error('审核通过失败:', error);
      const errorMsg = error.message || '审核通过失败，请稍后重试';
      if (errorMsg.includes('未登录') || errorMsg.includes('会话已过期')) {
        alert('您的登录已过期，请重新登录');
        window.location.href = '/login';
      } else {
        alert(errorMsg);
      }
    }
  };

  // 审核拒绝
  const handleReject = async (item: FleaMarketItem) => {
    const reason = prompt(`请输入拒绝原因（将通知发布者）：`);
    if (!reason) {
      return;
    }
    
    try {
      await ApiService.rejectFleaMarketItem(item.id, reason);
      alert('已拒绝该商品');
      await fetchItems();
    } catch (error: any) {
      console.error('拒绝失败:', error);
      const errorMsg = error.message || '拒绝失败，请稍后重试';
      if (errorMsg.includes('未登录') || errorMsg.includes('会话已过期')) {
        alert('您的登录已过期，请重新登录');
        window.location.href = '/login';
      } else {
        alert(errorMsg);
      }
    }
  };

  // 删除商品
  const handleDelete = async (item: FleaMarketItem) => {
    if (!confirm(`确定要删除商品"${item.title}"吗？此操作不可恢复。`)) {
      return;
    }
    
    try {
      await ApiService.deleteFleaMarketItem(item.id);
      alert('删除成功！');
      await fetchItems();
    } catch (error: any) {
      console.error('删除失败:', error);
      const errorMsg = error.message || '删除失败，请稍后重试';
      if (errorMsg.includes('未登录') || errorMsg.includes('会话已过期')) {
        alert('您的登录已过期，请重新登录');
        window.location.href = '/login';
      } else {
        alert(errorMsg);
      }
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'approved':
        return <Badge className="bg-green-500">已通过</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-500">待审核</Badge>;
      case 'rejected':
        return <Badge className="bg-red-500">已拒绝</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getCategoryLabel = (category: string) => {
    const categories: Record<string, string> = {
      'electronics': '电子产品',
      'books': '图书教材',
      'daily': '生活用品',
      'sports': '运动器材',
      'clothing': '服装配饰',
      'other': '其他'
    };
    return categories[category] || category;
  };

  const getConditionLabel = (condition: string) => {
    const conditions: Record<string, string> = {
      'new': '全新',
      'like-new': '几乎全新',
      'good': '良好',
      'fair': '一般',
      'poor': '较差'
    };
    return conditions[condition] || condition;
  };

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <Card>
        <CardHeader>
          <CardTitle>二手市场管理</CardTitle>
          <CardDescription>管理已发布的商品和处理商品审核</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row flex-1 gap-2 sm:items-center sm:space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索商品..."
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
                  <SelectItem value="pending">待审核</SelectItem>
                  <SelectItem value="approved">已通过</SelectItem>
                  <SelectItem value="rejected">已拒绝</SelectItem>
                  <SelectItem value="all">全部</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 商品表格 */}
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
                    <TableHead>商品信息</TableHead>
                    <TableHead>价格</TableHead>
                    <TableHead>分类</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>发布者</TableHead>
                    <TableHead>发布时间</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.map((item) => (
                    <TableRow key={item.id} className="hover:bg-gray-50">
                      <TableCell>
                        <div className="max-w-xs">
                          <div className="font-medium truncate">{item.title}</div>
                          <div className="text-sm text-gray-500 truncate">{item.description}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <DollarSign className="w-4 h-4 text-gray-400" />
                          <span className="font-semibold text-green-600">¥{item.price}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Tag className="w-4 h-4 text-gray-400" />
                          <span>{getCategoryLabel(item.category)}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(item.status)}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <User className="w-4 h-4 text-gray-400" />
                          <span>{item.publisher_name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span>{item.created_at.split(' ')[0]}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleView(item)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          {item.status === 'pending' && (
                            <>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-green-600 hover:text-green-700"
                                onClick={() => handleApprove(item)}
                              >
                                <CheckCircle className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="text-red-600 hover:text-red-700"
                                onClick={() => handleReject(item)}
                              >
                                <XCircle className="w-4 h-4" />
                              </Button>
                            </>
                          )}
                          <Button 
                            variant="ghost" 
                            size="sm" 
                            className="text-red-600 hover:text-red-700"
                            onClick={() => handleDelete(item)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                  {filteredItems.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                        暂无商品
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* 查看商品详情对话框 */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle>商品详情</DialogTitle>
          </DialogHeader>
          {selectedItem && (
            <div className="space-y-4 overflow-y-auto pr-2" style={{ maxHeight: 'calc(90vh - 120px)' }}>
              <div>
                <Label>商品名称</Label>
                <div className="mt-1 text-lg font-semibold">{selectedItem.title}</div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>价格</Label>
                  <div className="mt-1 text-green-600 font-semibold text-xl">¥{selectedItem.price}</div>
                </div>
                <div>
                  <Label>审核状态</Label>
                  <div className="mt-1">{getStatusBadge(selectedItem.status)}</div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label>分类</Label>
                  <div className="mt-1">{getCategoryLabel(selectedItem.category)}</div>
                </div>
                <div>
                  <Label>成色</Label>
                  <div className="mt-1">{getConditionLabel(selectedItem.condition_level)}</div>
                </div>
                <div>
                  <Label>位置</Label>
                  <div className="mt-1 flex items-center space-x-1">
                    <MapPin className="w-4 h-4 text-gray-400" />
                    <span>{selectedItem.location || '未填写'}</span>
                  </div>
                </div>
              </div>

              <div>
                <Label>商品描述</Label>
                <div className="mt-2 p-4 border rounded-lg bg-gray-50">
                  {selectedItem.description}
                </div>
              </div>

              {selectedItem.image_urls && selectedItem.image_urls.length > 0 && (
                <div>
                  <Label>商品图片 ({selectedItem.image_urls.length}张)</Label>
                  <div className="mt-2 grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {selectedItem.image_urls.map((url, index) => (
                      <div key={index} className="relative group aspect-square">
                        <img 
                          src={url} 
                          alt={`商品图片 ${index + 1}`}
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

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>发布者</Label>
                  <div className="mt-1">{selectedItem.publisher_name}</div>
                </div>
                <div>
                  <Label>联系方式</Label>
                  <div className="mt-1">{selectedItem.contact_info || '未填写'}</div>
                </div>
              </div>

              <div>
                <Label>发布时间</Label>
                <div className="mt-1 text-gray-600">{selectedItem.created_at}</div>
              </div>

              {selectedItem.status === 'pending' && (
                <div className="flex justify-end space-x-2 pt-4 border-t">
                  <Button 
                    variant="outline" 
                    className="text-red-600 border-red-600 hover:bg-red-50"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleReject(selectedItem);
                    }}
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    拒绝
                  </Button>
                  <Button 
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => {
                      setIsViewDialogOpen(false);
                      handleApprove(selectedItem);
                    }}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    通过
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export { FleaMarketManagement };
