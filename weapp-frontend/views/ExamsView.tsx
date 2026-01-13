import React from 'react';
import { Screen, CURRENT_USER } from '../types';

interface ExamsViewProps {
  setScreen: (screen: Screen) => void;
}

const ExamsView: React.FC<ExamsViewProps> = ({ setScreen }) => {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 pt-12 pb-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setScreen(Screen.APPS)}
              className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="material-icons-round">arrow_back</span>
            </button>
            <div>
              <h1 className="text-xl font-bold">考试安排</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">2023-2024学年 第一学期</p>
            </div>
          </div>
          <div className="h-9 w-9 rounded-full overflow-hidden border border-gray-200 dark:border-gray-700 shadow-sm">
            <img alt="User Avatar" className="w-full h-full object-cover" src={CURRENT_USER.avatar} />
          </div>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6">
        <ExamCard 
          daysLeft={3} 
          title="概率论与数理统计" 
          code="MATH2003" 
          type="必修" 
          time="09:00 - 11:00" 
          date="1月10日 周三" 
          location="教二 JA101"
          color="red"
        />
        <ExamCard 
          daysLeft={5} 
          title="大学英语 (IV)" 
          code="ENG1004" 
          type="必修" 
          time="14:00 - 16:00" 
          date="1月12日 周五" 
          location="公共楼 A204"
          color="orange"
        />
        <ExamCard 
          daysLeft={8} 
          title="计算机网络原理" 
          code="CS3002" 
          type="选修" 
          time="09:00 - 11:30" 
          date="1月15日 周一" 
          location="信工楼 305"
          color="blue"
        />
        <ExamCard 
          daysLeft={12} 
          title="宏观经济学" 
          code="ECON2001" 
          type="必修" 
          time="14:30 - 16:30" 
          date="1月19日 周五" 
          location="文科楼 B102"
          color="blue"
        />

        <div className="text-center pt-4 pb-12">
          <p className="text-xs text-gray-400 opacity-60">没有更多考试了</p>
        </div>
      </main>
    </div>
  );
};

const ExamCard = ({ daysLeft, title, code, type, time, date, location, color }: any) => {
  const colorClasses: Record<string, string> = {
    red: "bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400",
    orange: "bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400",
    blue: "bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400",
  };

  return (
    <div className="relative group bg-surface-light dark:bg-surface-dark rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 hover:shadow-md transition-all duration-300">
      <div className="absolute top-0 right-0">
        <div className={`${colorClasses[color]} text-xs font-bold px-4 py-1.5 rounded-bl-2xl rounded-tr-2xl`}>
          剩余 {daysLeft} 天
        </div>
      </div>
      <div className="flex flex-col h-full">
        <div className="mb-5 pr-16">
          <h2 className="text-lg font-bold mb-1">{title}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-800 border border-gray-100 dark:border-gray-700 inline-block px-2 py-0.5 rounded-md">
            {code} · {type}
          </p>
        </div>
        <div className="grid grid-cols-2 gap-4 mt-auto">
          <div className="flex flex-col gap-1">
            <span className="text-xs text-gray-400 font-medium">考试时间</span>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <span className="material-icons-round text-primary text-base">schedule</span>
              <span>{time}</span>
            </div>
            <span className="text-xs text-gray-400 pl-6">{date}</span>
          </div>
          <div className="flex flex-col gap-1 pl-4 border-l border-gray-100 dark:border-gray-800">
            <span className="text-xs text-gray-400 font-medium">考试地点</span>
            <div className="flex items-center gap-1.5 text-sm font-semibold">
              <span className="material-icons-round text-primary text-base">room</span>
              <span>{location}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExamsView;