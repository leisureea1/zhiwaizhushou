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
  studentId: string;
  username: string;
  name: string;
  email: string;
  role: string;
  status: string;
  lastLogin: string | null;
}

const userData: User[] = [
  {
    id: '1',
    studentId: '2021001',
    username: 'zhangsan',
    name: '张三',
    email: 'zhangsan@example.com',
    role: '学生',
    status: 'active',
    lastLogin: '2024-01-15 10:30'
  },
  {
    id: '2',
    studentId: '2021002',
    username: 'lisi',
    name: '李四',
    email: 'lisi@example.com',
    role: '学生',
    status: 'inactive',
    lastLogin: '2024-01-10 14:20'
  },
  {
    id: '3',
    studentId: 'T001',
    username: 'wangteacher',
    name: '王老师',
    email: 'wangteacher@example.com',
    role: '教师',
    status: 'active',
    lastLogin: '2024-01-16 09:15'
  },
  {
    id: '4',
    studentId: '2021003',
    username: 'zhaoliu',
    name: '赵六',
    email: 'zhaoliu@example.com',
    role: '学生',
    status: 'active',
    lastLogin: '2024-01-16 11:45'
  }
];

export function UserManagement() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [newUser, setNewUser] = useState({
    studentId: '',
    username: '',
    name: '',
    email: '',
    role: 'student'
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
      // 如果API调用失败，使用示例数据
      setUsers(userData);
    } finally {
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(user =>
    user.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddUser = async () => {
    try {
      // 调用创建用户API
      await ApiService.createUser(newUser);
      // 重新获取用户列表
      await fetchUsers();
      setIsAddUserOpen(false);
      setNewUser({ studentId: '', username: '', name: '', email: '', role: 'student' });
    } catch (error) {
      console.error('创建用户失败:', error);
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
              <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="bg-primary hover:bg-primary/90">
                    <Plus className="w-4 h-4 mr-2" />
                    添加用户
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
                  <DialogHeader>
                    <DialogTitle>添加用户</DialogTitle>
                    <DialogDescription>
                      添加新的系统用户
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="studentId">学号</Label>
                      <Input
                        id="studentId"
                        value={newUser.studentId}
                        onChange={(e) => setNewUser({ ...newUser, studentId: e.target.value })}
                        placeholder="请输入学号"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="username">用户名</Label>
                      <Input
                        id="username"
                        value={newUser.username}
                        onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                        placeholder="请输入用户名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="name">姓名</Label>
                      <Input
                        id="name"
                        value={newUser.name}
                        onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                        placeholder="请输入姓名"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">邮箱</Label>
                      <Input
                        id="email"
                        type="email"
                        value={newUser.email}
                        onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                        placeholder="请输入邮箱"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">角色</Label>
                      <Select 
                        value={newUser.role}
                        onValueChange={(value) => setNewUser({ ...newUser, role: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="student">学生</SelectItem>
                          <SelectItem value="admin">管理员</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="flex justify-end space-x-2">
                    <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                      取消
                    </Button>
                    <Button onClick={handleAddUser} className="bg-primary hover:bg-primary/90">
                      添加
                    </Button>
                  </div>
                </DialogContent>
              </Dialog>
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
                    <TableHead>邮箱</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>最后登录</TableHead>
                    <TableHead className="text-right">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">{user.studentId}</TableCell>
                      <TableCell>{user.username}</TableCell>
                      <TableCell>{user.name}</TableCell>
                      <TableCell>{user.email}</TableCell>
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
                        {user.lastLogin ? user.lastLogin : '从未登录'}
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
}