import React, { useState, useEffect } from 'react';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { UserManagement } from './components/UserManagement';
import { AnnouncementManagement } from './components/AnnouncementManagement';
import { FleaMarketManagement } from './components/FleaMarketManagement';
import LostFoundManagement from './components/LostFoundManagement';
import { SystemManagement } from './components/SystemManagement';
import { NotificationManagement } from './components/NotificationManagement';
import ApiService from './services/api';

export default function App() {
  // 从 localStorage 初始化登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    return !!(adminToken && adminUser);
  });
  const [currentPage, setCurrentPage] = useState('dashboard');

  // 监听登录状态变化
  useEffect(() => {
    const checkLoginStatus = () => {
      const adminToken = localStorage.getItem('adminToken');
      const adminUser = localStorage.getItem('adminUser');
      const isValid = !!(adminToken && adminUser);
      
      if (isValid !== isLoggedIn) {
        setIsLoggedIn(isValid);
      }
    };

    // 立即检查一次
    checkLoginStatus();

    // 监听 storage 事件（跨标签页同步）
    window.addEventListener('storage', checkLoginStatus);
    
    return () => {
      window.removeEventListener('storage', checkLoginStatus);
    };
  }, [isLoggedIn]);

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await ApiService.adminLogout();
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      // 清除 localStorage 中的登录信息
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      setIsLoggedIn(false);
    }
  };

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <Dashboard />;
      case 'users':
        return <UserManagement />;
      case 'announcements':
        return <AnnouncementManagement />;
      case 'marketplace':
        return <FleaMarketManagement />;
      case 'lostfound':
        return <LostFoundManagement />;
      case 'system':
        return <SystemManagement />;
      case 'notifications':
        return <NotificationManagement />;
      case 'api':
        return <NotificationManagement />;
      default:
        return <Dashboard />;
    }
  };

  if (!isLoggedIn) {
    return <LoginPage onLogin={handleLogin} />;
  }

  return (
    <Layout currentPage={currentPage} onPageChange={setCurrentPage} onLogout={handleLogout}>
      {renderPage()}
    </Layout>
  );
}