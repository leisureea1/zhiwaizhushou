import React from 'react';
import { Screen, CURRENT_USER } from '../types';

interface AppsViewProps {
  setScreen: (screen: Screen) => void;
}

const AppsView: React.FC<AppsViewProps> = ({ setScreen }) => {
  const AppIcon = ({ icon, color, label, onClick }: { icon: string, color: string, label: string, onClick?: () => void }) => (
    <div onClick={onClick} className="flex flex-col items-center space-y-2 group cursor-pointer">
      <div className={`w-14 h-14 rounded-2xl ${color} flex items-center justify-center shadow-sm group-hover:scale-105 transition-transform duration-200`}>
        <span className="material-icons-round text-2xl">{icon}</span>
      </div>
      <span className="text-xs text-gray-600 dark:text-gray-400 text-center font-medium">{label}</span>
    </div>
  );

  const MiniAppIcon = ({ icon, label, onClick }: { icon: string, label: string, onClick?: () => void }) => (
    <div onClick={onClick} className="flex flex-col items-center space-y-2 cursor-pointer active:opacity-70">
      <div className="w-10 h-10 rounded-full bg-gray-50 dark:bg-gray-700 text-gray-700 dark:text-gray-300 flex items-center justify-center border border-gray-100 dark:border-gray-600">
        <span className="material-icons-round text-xl">{icon}</span>
      </div>
      <span className="text-xs text-gray-700 dark:text-gray-300 text-center">{label}</span>
    </div>
  );

  return (
    <div className="flex flex-col min-h-screen bg-background-light dark:bg-background-dark text-slate-800 dark:text-slate-100 pb-24">
      <header className="sticky top-0 z-40 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">应用中心</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">发现更多校园服务</p>
          </div>
          <div className="flex items-center space-x-2">
            <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
              <span className="material-icons-round">search</span>
            </button>
            <div className="h-8 w-8 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
              <img alt="User Avatar" className="w-full h-full object-cover" src={CURRENT_USER.avatar} />
            </div>
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-8">
        {/* Recent Apps */}
        <section>
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold">最近使用</h2>
            <button className="text-xs text-primary font-medium hover:text-blue-600 dark:hover:text-blue-400">编辑</button>
          </div>
          <div className="grid grid-cols-4 gap-4">
            <AppIcon icon="calendar_today" color="bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400" label="课程表" onClick={() => setScreen(Screen.HOME)} />
            <AppIcon icon="restaurant_menu" color="bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400" label="饭卡充值" />
            <AppIcon icon="auto_awesome" color="bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400" label="AI 助手" onClick={() => setScreen(Screen.AI_CHAT)} />
            <AppIcon icon="school" color="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400" label="成绩查询" onClick={() => setScreen(Screen.GRADES)} />
          </div>
        </section>

        {/* Academic */}
        <section className="bg-surface-light dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold mb-5 flex items-center">
            <span className="w-1 h-4 bg-primary rounded-full mr-2"></span>
            教务教学
          </h2>
          <div className="grid grid-cols-4 gap-y-6 gap-x-2">
            <MiniAppIcon icon="fact_check" label="考试安排" onClick={() => setScreen(Screen.EXAMS)} />
            <MiniAppIcon icon="assignment_ind" label="选课系统" />
            <MiniAppIcon icon="class" label="空教室" />
            <MiniAppIcon icon="workspace_premium" label="素拓分" />
            <MiniAppIcon icon="menu_book" label="教材预订" />
            <MiniAppIcon icon="rate_review" label="评教系统" onClick={() => setScreen(Screen.EVALUATION)} />
          </div>
        </section>

        {/* Campus Life */}
        <section className="bg-surface-light dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold mb-5 flex items-center">
            <span className="w-1 h-4 bg-orange-500 rounded-full mr-2"></span>
            校园生活
          </h2>
          <div className="grid grid-cols-4 gap-y-6 gap-x-2">
            <MiniAppIcon icon="map" label="校园导览" />
            <MiniAppIcon icon="directions_bus" label="校车时刻" onClick={() => setScreen(Screen.BUS)} />
            <MiniAppIcon icon="wifi" label="网络报修" />
            <MiniAppIcon icon="sports_basketball" label="场馆预约" />
            <MiniAppIcon icon="local_laundry_service" label="洗衣机" />
            <MiniAppIcon icon="local_post_office" label="快递查询" />
            <MiniAppIcon icon="qr_code" label="出入码" />
          </div>
        </section>

        {/* Info */}
        <section className="bg-surface-light dark:bg-surface-dark rounded-3xl p-5 shadow-sm border border-gray-100 dark:border-gray-800">
          <h2 className="text-base font-bold mb-5 flex items-center">
            <span className="w-1 h-4 bg-teal-500 rounded-full mr-2"></span>
            行政资讯
          </h2>
          <div className="grid grid-cols-4 gap-y-6 gap-x-2">
            <MiniAppIcon icon="campaign" label="通知公告" />
            <MiniAppIcon icon="account_balance" label="学校概况" />
            <MiniAppIcon icon="contact_phone" label="黄页电话" />
            <MiniAppIcon icon="event_note" label="校历" />
          </div>
        </section>
        
        {/* Banner */}
        <section className="mt-4">
          <div className="relative w-full h-28 rounded-2xl overflow-hidden shadow-sm group cursor-pointer">
            <img alt="University Library" className="w-full h-full object-cover group-hover:scale-105 transition duration-500" src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1000&q=80" />
            <div className="absolute inset-0 bg-gradient-to-r from-blue-900/90 to-transparent flex items-center pl-6">
              <div>
                <h3 className="text-white font-bold text-lg">新生入学指南</h3>
                <p className="text-blue-100 text-xs mt-1 flex items-center">
                  点击查看详细流程 
                  <span className="material-icons-round text-sm ml-1">arrow_forward</span>
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default AppsView;