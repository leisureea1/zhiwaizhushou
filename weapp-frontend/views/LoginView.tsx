import React from 'react';
import { Screen } from '../types';

interface LoginViewProps {
  setScreen: (screen: Screen) => void;
}

const LoginView: React.FC<LoginViewProps> = ({ setScreen }) => {
  return (
    <div className="relative flex min-h-screen w-full flex-col overflow-x-hidden bg-background-light dark:bg-background-dark font-display text-[#111418] dark:text-white antialiased">
      {/* Dot Pattern Background */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
        backgroundImage: 'radial-gradient(#9ca3af 1px, transparent 1px)',
        backgroundSize: '24px 24px'
      }}></div>

      <div className="relative z-10 flex flex-1 flex-col items-center justify-center px-6 py-10 w-full max-w-[480px] mx-auto">
        
        {/* Logo Section */}
        <div className="mb-14 flex flex-col items-center gap-6">
          <div className="h-24 w-24 rounded-2xl bg-white dark:bg-gray-800 shadow-xl border border-gray-100 dark:border-gray-700 flex items-center justify-center overflow-hidden p-4">
            <div className="w-full h-full rounded-xl bg-gradient-to-br from-primary to-blue-400 flex items-center justify-center text-white shadow-inner">
              <span className="material-icons-round text-[40px]">school</span>
            </div>
          </div>
          <div className="flex flex-col items-center gap-1 text-center">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-white">Zhiwai Assistant</h1>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium">欢迎回来，请登录继续</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="w-full flex flex-col gap-6">
          <div className="flex flex-col gap-5">
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary pointer-events-none">
                <span className="material-icons-round text-[22px]">badge</span>
              </div>
              <input 
                className="w-full h-14 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-12 pr-4 text-base text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm" 
                placeholder="学号 / Student ID" 
                type="text" 
                defaultValue="2021004562"
              />
            </div>
            
            <div className="relative group">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 transition-colors group-focus-within:text-primary pointer-events-none">
                <span className="material-icons-round text-[22px]">lock</span>
              </div>
              <input 
                className="w-full h-14 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 pl-12 pr-12 text-base text-gray-900 dark:text-white placeholder:text-gray-400 focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all shadow-sm" 
                placeholder="密码 / Password" 
                type="password" 
                defaultValue="password"
              />
              <button className="absolute right-0 top-0 h-full w-12 flex items-center justify-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors cursor-pointer outline-none">
                <span className="material-icons-round text-[22px]">visibility</span>
              </button>
            </div>

            <div className="flex justify-end -mt-1">
              <button className="text-sm font-medium text-gray-500 hover:text-primary transition-colors">忘记密码?</button>
            </div>
          </div>

          <div className="flex flex-col gap-4 mt-2">
            <button 
              onClick={() => setScreen(Screen.HOME)}
              className="flex w-full cursor-pointer items-center justify-center rounded-xl h-14 bg-primary hover:bg-blue-600 text-white text-base font-bold tracking-wide transition-all shadow-lg shadow-blue-500/30 active:scale-[0.98]"
            >
              登录
            </button>
            <button className="flex w-full cursor-pointer items-center justify-center rounded-xl h-14 border border-primary text-primary hover:bg-blue-50 dark:hover:bg-blue-900/20 bg-transparent text-base font-bold tracking-wide transition-all active:scale-[0.98]">
              注册
            </button>
          </div>
        </div>

        <div className="mt-auto pt-10 pb-4">
          <p className="text-xs text-gray-400 text-center leading-relaxed">
            登录即代表您同意 <a className="underline hover:text-primary" href="#">服务条款</a> & <a className="underline hover:text-primary" href="#">隐私政策</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default LoginView;