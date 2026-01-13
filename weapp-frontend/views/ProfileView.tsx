import React from 'react';
import { Screen, CURRENT_USER } from '../types';

interface ProfileViewProps {
  setScreen: (screen: Screen) => void;
}

const ProfileView: React.FC<ProfileViewProps> = ({ setScreen }) => {
  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 pb-24">
      <header className="px-6 pt-12 pb-6 flex justify-between items-center sticky top-0 z-10 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-sm">
        <h1 className="text-2xl font-bold tracking-tight">个人中心</h1>
        <button className="p-2 rounded-full bg-surface-light dark:bg-surface-dark shadow-sm text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
          <span className="material-icons-round text-xl">notifications_none</span>
        </button>
      </header>

      <main className="flex-1 px-4 space-y-6">
        {/* Profile Card */}
        <section className="bg-surface-light dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center space-x-5">
          <div className="relative">
            <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary to-blue-300 p-1 flex items-center justify-center overflow-hidden shadow-md">
              <img alt="User Avatar" className="w-full h-full bg-white rounded-full object-cover" src={CURRENT_USER.avatar} />
            </div>
            <div className="absolute bottom-1 right-1 w-4 h-4 bg-green-500 border-2 border-surface-light dark:border-surface-dark rounded-full"></div>
          </div>
          <div className="flex-1">
            <h2 className="text-xl font-bold mb-1">{CURRENT_USER.name}</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400 flex items-center gap-1 mb-1">
              <span className="material-icons-round text-base opacity-70">badge</span>
              {CURRENT_USER.id}
            </p>
            <div className="flex flex-wrap gap-2 mt-2">
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
                {CURRENT_USER.major}
              </span>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
                {CURRENT_USER.type}
              </span>
            </div>
          </div>
          <button className="text-gray-400 dark:text-gray-500 hover:text-primary transition-colors">
            <span className="material-icons-round text-2xl">edit_note</span>
          </button>
        </section>

        {/* Security Section */}
        <section className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/20 flex items-center justify-center text-orange-500 dark:text-orange-400">
                  <span className="material-icons-round">lock_reset</span>
                </div>
                <span className="text-base font-medium group-hover:text-primary transition-colors">修改门户密码</span>
              </div>
              <span className="material-icons-round text-gray-300 dark:text-gray-600">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-teal-100 dark:bg-teal-900/20 flex items-center justify-center text-teal-500 dark:text-teal-400">
                  <span className="material-icons-round">vpn_key</span>
                </div>
                <span className="text-base font-medium group-hover:text-primary transition-colors">修改知外助手密码</span>
              </div>
              <span className="material-icons-round text-gray-300 dark:text-gray-600">chevron_right</span>
            </button>
          </div>
        </section>

        {/* App Settings */}
        <section className="bg-surface-light dark:bg-surface-dark rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 overflow-hidden">
          <div className="divide-y divide-gray-100 dark:divide-gray-800">
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 dark:text-gray-400">
                  <span className="material-icons-round">settings</span>
                </div>
                <span className="text-base font-medium group-hover:text-primary transition-colors">设置</span>
              </div>
              <span className="material-icons-round text-gray-300 dark:text-gray-600">chevron_right</span>
            </button>
            <button className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors group">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-indigo-100 dark:bg-indigo-900/20 flex items-center justify-center text-indigo-500 dark:text-indigo-400">
                  <span className="material-icons-round">info</span>
                </div>
                <span className="text-base font-medium group-hover:text-primary transition-colors">关于我们</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded-md">v2.4.1</span>
                <span className="material-icons-round text-gray-300 dark:text-gray-600">chevron_right</span>
              </div>
            </button>
          </div>
        </section>

        <button 
          onClick={() => setScreen(Screen.LOGIN)}
          className="w-full p-4 rounded-2xl text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-900/10 hover:bg-red-100 dark:hover:bg-red-900/20 font-bold text-center transition-colors shadow-sm"
        >
          退出登录
        </button>
      </main>
    </div>
  );
};

export default ProfileView;