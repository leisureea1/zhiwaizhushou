import React, { useState } from 'react';
import { LoginPage } from './components/LoginPage';
import { Layout } from './components/Layout';
import { Dashboard } from './components/Dashboard';
import { UserManagement } from './components/UserManagement';
import { AnnouncementManagement } from './components/AnnouncementManagement';
import ApiService from './services/api';

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentPage, setCurrentPage] = useState('dashboard');

  const handleLogin = () => {
    setIsLoggedIn(true);
  };

  const handleLogout = async () => {
    try {
      await ApiService.adminLogout();
    } catch (error) {
      console.error('登出失败:', error);
    } finally {
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
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">二手市场管理</h2>
            <p className="text-gray-600">此页面正在开发中...</p>
          </div>
        );
      case 'lostfound':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">失物招领管理</h2>
            <p className="text-gray-600">此页面正在开发中...</p>
          </div>
        );
      case 'system':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">系统管理</h2>
            <p className="text-gray-600">此页面正在开发中...</p>
          </div>
        );
      case 'api':
        return (
          <div className="text-center py-12">
            <h2 className="text-2xl font-semibold mb-4">API 测试</h2>
            <p className="text-gray-600">此页面正在开发中...</p>
          </div>
        );
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