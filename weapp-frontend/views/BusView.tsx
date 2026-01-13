import React from 'react';
import { Screen, CURRENT_USER } from '../types';

interface BusViewProps {
  setScreen: (screen: Screen) => void;
}

const BusView: React.FC<BusViewProps> = ({ setScreen }) => {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-800 dark:text-slate-100 flex flex-col">
      <header className="sticky top-0 z-50 bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 pt-12 pb-4 shrink-0">
        <div className="flex items-center justify-between">
          <div>
             <button 
              onClick={() => setScreen(Screen.APPS)}
              className="flex items-center text-sm text-gray-500 mb-1 hover:text-primary transition-colors"
            >
              <span className="material-icons-round text-sm mr-1">arrow_back</span>
              返回
            </button>
            <h1 className="text-2xl font-bold">校区通勤班车</h1>
            <p className="text-sm text-gray-500 mt-1">智外助手 · 直达通勤班次</p>
          </div>
          <div className="h-9 w-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700">
            <img alt="User Avatar" className="w-full h-full object-cover" src={CURRENT_USER.avatar} />
          </div>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-6 space-y-6 no-scrollbar pb-20">
        <div className="bg-surface-light dark:bg-surface-dark p-1 rounded-2xl flex shadow-sm border border-gray-100 dark:border-gray-800">
          <button className="flex-1 py-3 text-sm font-bold text-primary bg-blue-50 dark:bg-blue-900/30 rounded-xl transition-all flex items-center justify-center space-x-1">
            <span className="material-icons-round text-sm">location_on</span>
            <span>前往A校区</span>
          </button>
          <button className="flex-1 py-3 text-sm font-medium text-gray-500 hover:text-gray-900 dark:hover:text-white transition-all flex items-center justify-center space-x-1">
            <span className="material-icons-round text-sm">near_me</span>
            <span>前往B校区</span>
          </button>
        </div>

        {/* Hero Card */}
        <section className="relative bg-gradient-to-br from-blue-600 to-blue-500 rounded-3xl p-6 text-white shadow-lg shadow-blue-500/20 overflow-hidden shrink-0">
          <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -mr-20 -mt-20 blur-2xl"></div>
          <div className="absolute bottom-0 left-0 w-32 h-32 bg-white/10 rounded-full -ml-16 -mb-16 blur-2xl"></div>
          
          <div className="relative z-10">
            <div className="flex justify-between items-start mb-6">
              <div>
                <span className="inline-flex items-center px-3 py-1 bg-white/20 backdrop-blur-md rounded-full text-xs font-medium mb-3 border border-white/10">
                  <span className="w-1.5 h-1.5 bg-green-300 rounded-full mr-1.5 animate-pulse"></span>
                  最近班次 (Next)
                </span>
                <div className="flex items-baseline space-x-1">
                  <h2 className="text-5xl font-bold tracking-tight">14:30</h2>
                  <span className="text-blue-100 text-lg font-medium opacity-80">发车</span>
                </div>
              </div>
              <div className="text-right bg-white/10 p-3 rounded-2xl backdrop-blur-sm border border-white/10">
                <div className="text-3xl font-bold">12<span className="text-sm font-normal ml-1 opacity-80">min</span></div>
                <p className="text-blue-100 text-xs text-center mt-1">倒计时</p>
              </div>
            </div>
            
            <div className="flex items-center justify-between bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-full bg-white text-blue-600 flex items-center justify-center shadow-sm">
                  <span className="material-icons-round text-xl">directions_bus</span>
                </div>
                <div>
                  <p className="text-sm font-bold">校区专线 (A ⇄ B)</p>
                  <p className="text-xs text-blue-100 opacity-90">预计 15:15 到达 · 耗时 45min</p>
                </div>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-[10px] font-bold bg-green-400 text-blue-900 px-2 py-0.5 rounded uppercase">有位</span>
                <span className="text-[10px] text-blue-100 mt-1 opacity-70">剩余 18 座</span>
              </div>
            </div>
          </div>
        </section>

        {/* Schedule List */}
        <section className="space-y-4">
          <div className="flex items-center justify-between px-2">
            <h3 className="font-bold text-lg flex items-center">
              <span className="material-symbols-outlined text-primary mr-2 text-xl">schedule</span>
              今日班次计划
            </h3>
            <span className="text-xs text-gray-500">共 12 个班次</span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            <BusItem time="15:00" arrive="15:45" status="有位" statusColor="green" />
            <BusItem time="15:30" arrive="16:15" status="有位" statusColor="green" />
            <BusItem time="16:00" arrive="16:45" status="紧俏" statusColor="orange" />
            <BusItem time="16:30" arrive="17:15" status="已满" statusColor="red" opacity={true} />
            <BusItem time="17:00" arrive="17:45" status="有位" statusColor="green" />
          </div>
          
          <div className="pt-4 text-center">
            <p className="text-[10px] text-gray-400">班次仅供参考，请提前5分钟到达上车点</p>
          </div>
        </section>
      </main>
    </div>
  );
};

const BusItem = ({ time, arrive, status, statusColor, opacity }: any) => {
  const statusColors: any = {
    green: "text-green-600 bg-green-50 dark:bg-green-900/20",
    orange: "text-orange-600 bg-orange-50 dark:bg-orange-900/20",
    red: "text-red-600 bg-red-50 dark:bg-red-900/20",
  };

  return (
    <div className={`bg-surface-light dark:bg-surface-dark p-4 rounded-2xl flex items-center justify-between border border-gray-100 dark:border-gray-800 shadow-sm transition-transform ${opacity ? 'opacity-60' : 'active:scale-[0.98]'}`}>
      <div className="flex items-center space-x-4">
        <div className="text-2xl font-bold">{time}</div>
        <div className="h-8 w-px bg-gray-100 dark:bg-gray-700"></div>
        <div>
          <div className="text-xs text-gray-400">预计到达</div>
          <div className="text-sm font-medium">{arrive}</div>
        </div>
      </div>
      <div className="flex items-center space-x-3">
        <span className={`text-xs font-medium px-3 py-1 rounded-full ${statusColors[statusColor]}`}>{status}</span>
        <span className="material-icons-round text-gray-300 text-lg">chevron_right</span>
      </div>
    </div>
  );
};

export default BusView;