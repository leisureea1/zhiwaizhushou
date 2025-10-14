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
  Edit, 
  Eye,
  Trash2, 
  Filter,
  Download,
  MoreHorizontal
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import ApiService from '../services/api';

interface User {
  id: string;
  username: string;
  name: string;
  studentId: string; // edu_system_username (学号)
  eduPassword?: string; // edu_system_password (教务系统密码)
  avatarUrl?: string;
  role: string;
  status: string;
  createdAt: string;
  lastLoginAt: string | null;
  lastLoginIp: string | null;
}

interface UserDetail extends User {
  eduPassword: string;
}

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<UserDetail | null>(null);
  const [isViewOpen, setIsViewOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    username: '',
    name: '',
    studentId: '',
    eduPassword: '',
    password: '', // 新增：小程序登录密码
    role: 'user',
  });

  // 获取用户数据
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const data = await ApiService.getUsers();
      setUsers(data);
    } catch (error) {
      console.error('获取用户数据失败:', error);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.studentId?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 查看用户详情
  const handleViewUser = async (user: User) => {
    try {
      // 调用后端获取完整用户信息（包含教务系统密码）
      const detail = await ApiService.getUserDetail(user.id);
      setSelectedUser(detail);
      setIsViewOpen(true);
    } catch (error) {
      console.error('获取用户详情失败:', error);
      alert('获取用户详情失败');
    }
  };

  // 打开编辑弹窗
  const handleEditUser = async (user: User) => {
    try {
      // 获取完整用户信息
      const detail = await ApiService.getUserDetail(user.id);
      setSelectedUser(detail);
      setEditForm({
        username: detail.username,
        name: detail.name,
        studentId: detail.studentId,
        eduPassword: detail.eduPassword || '',
        password: '', // 留空，只有填写时才修改
        role: detail.role,
      });
      setIsEditOpen(true);
    } catch (error) {
      console.error('获取用户详情失败:', error);
      alert('获取用户详情失败');
    }
  };

  // 保存编辑
  const handleSaveEdit = async () => {
    if (!selectedUser) return;
    
    try {
      await ApiService.updateUser(selectedUser.id, editForm);
      alert('用户信息更新成功');
      setIsEditOpen(false);
      await fetchUsers();
    } catch (error: any) {
      console.error('更新用户失败:', error);
      const errorMessage = error?.response?.data?.error || error?.message || '更新用户失败';
      alert(errorMessage);
    }
  };

  const handleToggleRole = async (user: User) => {
    try {
      const newRole = user.role === 'admin' ? 'user' : 'admin';
      await ApiService.updateUserRole(user.id, newRole);
      await fetchUsers();
    } catch (error) {
      console.error('更新用户角色失败:', error);
    }
  };

  const handleDeleteUser = async (userId: string) => {
    if (!confirm('确定要删除该用户吗？此操作不可恢复。')) return;
    try {
      await ApiService.deleteUser(userId);
      alert('用户删除成功');
      await fetchUsers();
    } catch (error: any) {
      console.error('删除用户失败:', error);
      const errorMessage = error?.response?.data?.error || error?.message || '删除用户失败';
      alert(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      {/* 操作栏 */}
      <Card>
        <CardHeader>
          <CardTitle>用户管理</CardTitle>
          <CardDescription>管理系统用户和权限</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-col sm:flex-row flex-1 gap-2 sm:items-center sm:space-x-2">
              <div className="relative flex-1 max-w-sm">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="搜索用户..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Button variant="outline" size="sm" className="w-full sm:w-auto">
                <Filter className="w-4 h-4 mr-2" />
                筛选
              </Button>
            </div>
            <div className="flex items-center space-x-2">
              <Button variant="outline" size="sm" className="hidden sm:flex">
                <Download className="w-4 h-4 mr-2" />
                导出
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 用户表格 */}
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
                    <TableHead>学号</TableHead>
                    <TableHead>用户名</TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>创建时间</TableHead>
                    <TableHead>最后登录时间</TableHead>
                    <TableHead>登录IP</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{user.studentId}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>
                        <Badge variant={user.role === 'admin' ? 'default' : 'secondary'}>
                          {user.role === 'admin' ? '管理员' : '学生'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {user.status === 'active' && <Badge className="bg-green-500">活跃</Badge>}
                        {user.status === 'inactive' && <Badge variant="secondary">非活跃</Badge>}
                        {user.status === 'pending' && <Badge className="bg-yellow-500">待审核</Badge>}
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? new Date(user.createdAt).toLocaleString('zh-CN') : '-'}
                      </TableCell>
                      <TableCell>
                        {user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleString('zh-CN') : '从未登录'}
                      </TableCell>
                      <TableCell>
                        {user.lastLoginIp || '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center justify-end space-x-2">
                          <Button variant="ghost" size="sm" onClick={() => handleViewUser(user)}>
                            <Eye className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleEditUser(user)}>
                            <Edit className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600 hover:text-red-700" onClick={() => handleDeleteUser(user.id)}>
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

      {/* 查看用户详情弹窗 */}
      <Dialog open={isViewOpen} onOpenChange={setIsViewOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>用户详情</DialogTitle>
            <DialogDescription>查看用户完整信息</DialogDescription>
          </DialogHeader>
          {selectedUser && (
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right font-semibold">学号:</Label>
                <div className="col-span-2">{selectedUser.studentId}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right font-semibold">用户名:</Label>
                <div className="col-span-2">{selectedUser.username}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right font-semibold">姓名:</Label>
                <div className="col-span-2">{selectedUser.name}</div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right font-semibold">教务系统密码:</Label>
                <div className="col-span-2 font-mono text-sm bg-gray-100 p-2 rounded">
                  {selectedUser.eduPassword || '未设置'}
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right font-semibold">角色:</Label>
                <div className="col-span-2">
                  <Badge variant={selectedUser.role === 'admin' ? 'default' : 'secondary'}>
                    {selectedUser.role === 'admin' ? '管理员' : '学生'}
                  </Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right font-semibold">状态:</Label>
                <div className="col-span-2">
                  <Badge className="bg-green-500">{selectedUser.status === 'active' ? '活跃' : '非活跃'}</Badge>
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right font-semibold">创建时间:</Label>
                <div className="col-span-2">
                  {selectedUser.createdAt ? new Date(selectedUser.createdAt).toLocaleString('zh-CN') : '-'}
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right font-semibold">最后登录:</Label>
                <div className="col-span-2">
                  {selectedUser.lastLoginAt ? new Date(selectedUser.lastLoginAt).toLocaleString('zh-CN') : '从未登录'}
                </div>
              </div>
              <div className="grid grid-cols-3 items-center gap-4">
                <Label className="text-right font-semibold">登录IP:</Label>
                <div className="col-span-2">{selectedUser.lastLoginIp || '-'}</div>
              </div>
            </div>
          )}
          <div className="flex justify-end">
            <Button variant="outline" onClick={() => setIsViewOpen(false)}>
              关闭
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑用户弹窗 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>编辑用户</DialogTitle>
            <DialogDescription>修改用户信息</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-username">用户名</Label>
              <Input
                id="edit-username"
                value={editForm.username}
                onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                placeholder="请输入用户名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-name">姓名</Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="请输入姓名"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-studentId">学号</Label>
              <Input
                id="edit-studentId"
                value={editForm.studentId}
                onChange={(e) => setEditForm({ ...editForm, studentId: e.target.value })}
                placeholder="请输入学号"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-eduPassword">教务系统密码</Label>
              <Input
                id="edit-eduPassword"
                type="password"
                value={editForm.eduPassword}
                onChange={(e) => setEditForm({ ...editForm, eduPassword: e.target.value })}
                placeholder="请输入教务系统密码"
              />
              <p className="text-xs text-gray-500">留空则不修改</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-password">小程序登录密码</Label>
              <Input
                id="edit-password"
                type="password"
                value={editForm.password}
                onChange={(e) => setEditForm({ ...editForm, password: e.target.value })}
                placeholder="请输入新密码"
              />
              <p className="text-xs text-gray-500">留空则不修改密码</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-role">角色</Label>
              <Select 
                value={editForm.role}
                onValueChange={(value: string) => setEditForm({ ...editForm, role: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">学生</SelectItem>
                  <SelectItem value="admin">管理员</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setIsEditOpen(false)}>
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
}