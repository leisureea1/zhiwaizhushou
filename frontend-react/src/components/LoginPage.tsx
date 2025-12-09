import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { GraduationCap } from 'lucide-react';
import ApiService from '../services/api';

interface LoginPageProps {
  onLogin: () => void;
}

export function LoginPage({ onLogin }: LoginPageProps) {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.username && formData.password) {
      try {
        const result = await ApiService.adminLogin(formData.username, formData.password);
        if (result.message === '登录成功') {
          // 登录成功，保存token和用户信息到localStorage
          localStorage.setItem('adminToken', result.token);
          localStorage.setItem('adminUser', JSON.stringify({
            user_id: result.user_id,
            username: result.username,
            name: result.name,
            role: result.role
          }));
          // 设置登录状态标记
          localStorage.setItem('isLoggedIn', 'true');
          onLogin();
        } else {
          alert('登录失败：' + result.error);
        }
      } catch (error) {
        console.error('登录失败:', error);
        alert('登录失败，请检查网络连接');
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-xl">
        <CardHeader className="space-y-1 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-primary">
              <GraduationCap className="w-8 h-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">校园管理系统</CardTitle>
          <CardDescription>请登录您的管理员账户</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username">学号/用户名</Label>
              <Input
                id="username"
                type="text"
                placeholder="请输入学号或用户名"
                value={formData.username}
                onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                placeholder="请输入密码"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                required
              />
            </div>
            <Button type="submit" className="w-full bg-primary hover:bg-primary/90">
              登录
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}