import React, { useState } from 'react';
import ApiService from '../services/api';
import { 
  LayoutDashboard, 
  Users, 
  Megaphone, 
  ShoppingBag, 
  Package, 
  Settings, 
  TestTube,
  Menu,
  Bell,
  User,
  ChevronLeft
} from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Badge } from './ui/badge';
import { Separator } from './ui/separator';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

interface LayoutProps {
  children: React.ReactNode;
  currentPage: string;
  onPageChange: (page: string) => void;
  onLogout: () => void;
}

const menuItems = [
  { id: 'dashboard', label: '仪表盘', icon: LayoutDashboard },
  { id: 'users', label: '用户管理', icon: Users },
  { id: 'announcements', label: '公告管理', icon: Megaphone },
  { id: 'marketplace', label: '二手市场', icon: ShoppingBag },
  { id: 'lostfound', label: '失物招领', icon: Package },
  { id: 'features', label: '功能开关', icon: Settings },
  { id: 'system', label: '系统管理', icon: Settings },
  { id: 'api', label: '通知管理', icon: Bell },
];

export function Layout({ children, currentPage, onPageChange, onLogout }: LayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  return (
    <div className="h-screen bg-gray-50 flex">
      {/* 移动端遮罩层 */}
      {mobileMenuOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-5 lg:hidden"
          onClick={() => setMobileMenuOpen(false)}
        />
      )}
      
      {/* 左侧导航栏 */}
      <div className={`
        bg-white shadow-lg transition-all duration-300 flex flex-col z-30
        ${sidebarCollapsed ? 'w-16' : 'w-64'}
        lg:relative fixed inset-y-0 left-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
        {/* Logo区域 */}
        <div className="h-16 flex items-center justify-between px-4 border-b">
          {!sidebarCollapsed && (
            <h1 className="text-xl font-semibold text-gray-800">校园管理系统</h1>
          )}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto hidden lg:flex"
          >
            {sidebarCollapsed ? <Menu className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </Button>
          {/* 移动端关闭按钮 */}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setMobileMenuOpen(false)}
            className="ml-auto lg:hidden"
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
        </div>

        {/* 导航菜单 */}
        <nav className="flex-1 p-4">
          <ul className="space-y-2">
            {menuItems.map((item) => {
              const Icon = item.icon;
              return (
                <li key={item.id}>
                  <Button
                    variant={currentPage === item.id ? "default" : "ghost"}
                    className={`w-full justify-start ${sidebarCollapsed ? 'px-2' : 'px-4'} ${
                      currentPage === item.id ? 'bg-primary text-white' : 'hover:bg-gray-100'
                    }`}
                    onClick={() => onPageChange(item.id)}
                  >
                    <Icon className="w-5 h-5" />
                    {!sidebarCollapsed && <span className="ml-3">{item.label}</span>}
                  </Button>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-h-0 relative z-10 bg-gray-50">
        {/* 顶部导航栏 */}
        <header className="h-16 bg-white shadow-sm border-b flex items-center justify-between px-4 lg:px-6">
          <div className="flex items-center">
            {/* 移动端菜单按钮 */}
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMobileMenuOpen(true)}
              className="mr-3 lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </Button>
            <h2 className="text-lg font-medium text-gray-800">
              {menuItems.find(item => item.id === currentPage)?.label || '仪表盘'}
            </h2>
          </div>
          
          <div className="flex items-center space-x-4">
            {/* 通知图标 */}
            <Button variant="ghost" size="sm" className="relative">
              <Bell className="w-5 h-5" />
              <Badge className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-red-500 text-xs flex items-center justify-center">
                3
              </Badge>
            </Button>

            <Separator orientation="vertical" className="h-6" />

            {/* 用户菜单 */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="/avatars/01.png" alt="用户头像" />
                    <AvatarFallback>管理</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">管理员</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      admin@campus.edu
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <User className="mr-2 h-4 w-4" />
                  <span>个人资料</span>
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  <span>设置</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={onLogout}>退出登录</DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* 页面内容 */}
        <main className="flex-1 overflow-auto p-4 lg:p-6 bg-gray-50">
          {children}
        </main>
      </div>
    </div>
  );
}