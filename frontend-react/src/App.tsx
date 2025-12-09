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
import { FeatureManagement } from './components/FeatureManagement';
import ApiService from './services/api';

export default function App() {
  // 从 localStorage 初始化登录状态
  const [isLoggedIn, setIsLoggedIn] = useState(() => {
    // 检查 isLoggedIn 标记和 token、用户信息
    const loginFlag = localStorage.getItem('isLoggedIn') === 'true';
    const adminToken = localStorage.getItem('adminToken');
    const adminUser = localStorage.getItem('adminUser');
    // 必须同时满足三个条件
    return loginFlag && !!(adminToken && adminUser);
  });
  
  // 从 localStorage 初始化当前页面，默认为 dashboard
  const [currentPage, setCurrentPage] = useState(() => {
    const savedPage = localStorage.getItem('currentPage');
    return savedPage || 'dashboard';
  });

  // 保存当前页面到 localStorage
  useEffect(() => {
    if (isLoggedIn) {
      localStorage.setItem('currentPage', currentPage);
    }
  }, [currentPage, isLoggedIn]);

  // 监听登录状态变化
  useEffect(() => {
    const checkLoginStatus = async () => {
      const loginFlag = localStorage.getItem('isLoggedIn') === 'true';
      const adminToken = localStorage.getItem('adminToken');
      const adminUser = localStorage.getItem('adminUser');
      const hasLocalCredentials = loginFlag && !!(adminToken && adminUser);
      
      // 如果本地有登录标记，验证后端 session 是否有效
      if (hasLocalCredentials) {
        const sessionResult = await ApiService.validateAdminSession();
        
        if (!sessionResult.valid) {
          // Session 无效，清除本地状态
          console.warn('后端 session 已失效，清除本地登录状态');
          localStorage.removeItem('isLoggedIn');
          localStorage.removeItem('adminToken');
          localStorage.removeItem('adminUser');
          localStorage.removeItem('currentPage');
          setIsLoggedIn(false);
          setCurrentPage('dashboard');
          return;
        }
      }
      
      // 本地没有凭证，确保登录状态为 false
      if (!hasLocalCredentials && isLoggedIn) {
        setIsLoggedIn(false);
        localStorage.removeItem('currentPage');
        setCurrentPage('dashboard');
      }
    };

    // 立即检查一次
    checkLoginStatus();

    // 监听 storage 事件（跨标签页同步）
    const handleStorageChange = () => {
      checkLoginStatus();
    };

    // 监听未授权事件
    const handleUnauthorized = () => {
      console.warn('收到未授权事件，清除本地登录状态');
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('currentPage');
      setIsLoggedIn(false);
      setCurrentPage('dashboard');
    };
    
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth:unauthorized', handleUnauthorized);
    
    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth:unauthorized', handleUnauthorized);
    };
  }, [isLoggedIn]);

  const handleLogin = () => {
    setIsLoggedIn(true);
    // 登录成功后，恢复之前的页面或默认到 dashboard
    const savedPage = localStorage.getItem('currentPage');
    if (savedPage) {
      setCurrentPage(savedPage);
    }
  };

  const handleLogout = async () => {
    try {
      await ApiService.adminLogout();
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
      // 清除 localStorage 中的所有登录信息和页面记录
      localStorage.removeItem('isLoggedIn');
      localStorage.removeItem('adminToken');
      localStorage.removeItem('adminUser');
      localStorage.removeItem('currentPage');
      setIsLoggedIn(false);
      setCurrentPage('dashboard');
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
      case 'features':
        return <FeatureManagement />;
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