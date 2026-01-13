import React from 'react';
import { Screen } from '../types';

interface GradesViewProps {
  setScreen: (screen: Screen) => void;
}

const GradesView: React.FC<GradesViewProps> = ({ setScreen }) => {
  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-800 dark:text-slate-100 transition-colors duration-300">
      <header className="sticky top-0 z-50 bg-background-light/95 dark:bg-background-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 pt-12 pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => setScreen(Screen.APPS)}
              className="p-1 -ml-1 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              <span className="material-icons-round">arrow_back</span>
            </button>
            <h1 className="text-xl font-bold">成绩查询</h1>
          </div>
          <button className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors">
            <span className="material-icons-round text-gray-400 dark:text-gray-500">filter_list</span>
          </button>
        </div>
      </header>

      <main className="px-4 py-6 space-y-6 pb-24">
        {/* GPA Card */}
        <section className="relative overflow-hidden bg-gradient-to-br from-primary to-blue-600 rounded-3xl p-8 shadow-lg shadow-blue-500/20 text-white">
          <div className="absolute top-0 right-0 -mt-4 -mr-4 w-32 h-32 bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-4 -ml-4 w-24 h-24 bg-white/10 rounded-full blur-xl"></div>
          <div className="relative z-10 flex justify-around items-center">
            <div className="text-center">
              <p className="text-blue-100 text-sm font-medium mb-1 opacity-90">平均绩点 (GPA)</p>
              <h2 className="text-5xl font-bold tracking-tight">3.86</h2>
            </div>
            <div className="w-px h-12 bg-white/20"></div>
            <div className="text-center">
              <p className="text-blue-100 text-sm font-medium mb-1 opacity-90">平均分</p>
              <h2 className="text-5xl font-bold tracking-tight">91.5</h2>
            </div>
          </div>
        </section>

        {/* Term Selector */}
        <section>
          <div className="flex space-x-3 overflow-x-auto no-scrollbar pb-2">
            <button className="flex-none px-5 py-2.5 rounded-full bg-slate-800 dark:bg-white text-white dark:text-slate-900 text-sm font-bold shadow-md">
              2023-2024 秋
            </button>
            <button className="flex-none px-5 py-2.5 rounded-full bg-white dark:bg-surface-dark text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-sm font-medium shadow-sm whitespace-nowrap">
              2023-2024 春
            </button>
            <button className="flex-none px-5 py-2.5 rounded-full bg-white dark:bg-surface-dark text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-700 text-sm font-medium shadow-sm whitespace-nowrap">
              2022-2023 秋
            </button>
          </div>
        </section>

        {/* Grades List */}
        <section className="space-y-4">
          <GradeCard 
            title="高等数学 (上)" type="必修" credit="5.0" score="95" gpa="4.0" 
            color="pastel-blue" icon="functions" 
          />
          <GradeCard 
            title="大学英语 III" type="必修" credit="3.0" score="92" gpa="4.0" 
            color="pastel-pink" icon="translate" 
          />
          <GradeCard 
            title="C语言程序设计" type="专选" credit="4.0" score="98" gpa="4.0" 
            color="pastel-purple" icon="code" 
          />
          <GradeCard 
            title="中国近代史纲要" type="通识" credit="2.0" score="88" gpa="3.7" 
            color="pastel-orange" icon="history_edu" 
          />
          <GradeCard 
            title="大学体育 I" type="必修" credit="1.0" score="A" gpa="4.0" 
            color="pastel-green" icon="sports_basketball" 
          />
          <GradeCard 
            title="大学物理 (下)" type="必修" credit="4.0" score="91" gpa="4.0" 
            color="pastel-blue" icon="biotech" 
          />
        </section>
      </main>
    </div>
  );
};

const GradeCard = ({ title, type, credit, score, gpa, color, icon }: any) => {
  const colorMap: Record<string, string> = {
    "pastel-blue": "bg-pastel-blue text-pastel-blue-text border-l-pastel-blue-text",
    "pastel-pink": "bg-pastel-pink text-pastel-pink-text border-l-pastel-pink-text",
    "pastel-purple": "bg-pastel-purple text-pastel-purple-text border-l-pastel-purple-text",
    "pastel-orange": "bg-pastel-orange text-pastel-orange-text border-l-pastel-orange-text",
    "pastel-green": "bg-pastel-green text-pastel-green-text border-l-pastel-green-text",
  };
  
  const textClass = colorMap[color].split(' ')[1]; // Extract text color class

  return (
    <div className="bg-surface-light dark:bg-surface-dark rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex items-center justify-between relative overflow-hidden">
      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${colorMap[color].split(' ')[2].replace('border-l-', 'bg-')}`}></div>
      <div className="flex items-start space-x-4 pl-3">
        <div className={`w-12 h-12 rounded-2xl ${colorMap[color].split(' ')[0]} flex items-center justify-center ${textClass}`}>
          <span className="material-icons-round text-2xl">{icon}</span>
        </div>
        <div>
          <h3 className="text-base font-bold">{title}</h3>
          <div className="flex items-center space-x-2 mt-1">
            <span className="text-xs px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400">{type}</span>
            <span className="text-xs text-gray-500 dark:text-gray-400">{credit} 学分</span>
          </div>
        </div>
      </div>
      <div className="flex flex-col items-end">
        <span className={`text-2xl font-bold ${textClass}`}>{score}</span>
        <span className="text-xs text-gray-400 mt-0.5">{gpa}</span>
      </div>
    </div>
  );
};

export default GradesView;