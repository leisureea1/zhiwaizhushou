import React from 'react';
import { Screen } from '../types';

interface EvaluationViewProps {
  setScreen: (screen: Screen) => void;
}

const EvaluationView: React.FC<EvaluationViewProps> = ({ setScreen }) => {
  return (
    <div className="bg-background-light dark:bg-background-dark font-sans text-slate-800 dark:text-white min-h-screen flex flex-col">
      <div className="sticky top-0 z-50 bg-background-light/90 dark:bg-background-dark/90 backdrop-blur-md border-b border-gray-200/50 dark:border-gray-800/50">
        <div className="h-2 w-full"></div>
        <div className="flex items-center justify-between px-4 py-3">
          <button 
            onClick={() => setScreen(Screen.APPS)}
            className="flex items-center justify-center p-2 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors"
          >
            <span className="material-symbols-outlined text-2xl">arrow_back_ios_new</span>
          </button>
          <h1 className="text-lg font-bold leading-tight tracking-tight absolute left-1/2 -translate-x-1/2">评教系统</h1>
          <div className="w-10"></div>
        </div>
      </div>

      <main className="flex-1 flex flex-col w-full max-w-md mx-auto px-4 pb-32">
        <div className="pt-6 pb-2 px-1 flex justify-between items-end">
          <h2 className="text-xl font-bold">待评教课程</h2>
          <span className="text-sm font-medium text-primary dark:text-blue-400 bg-primary/10 dark:bg-primary/20 px-2 py-0.5 rounded-md">3 门待办</span>
        </div>

        <div className="flex flex-col gap-4 mt-2">
          <EvalCard 
            title="高等数学 (下)" 
            dept="理学院 · 数学系" 
            prof="王力 教授" 
            avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuDoehYoH6QQGxhYQmujHmfs9g-RlpfSL5ChhjF2GT6bJIE-D4AYdWfzZMKWG8K62X-mmUm4Mk1VtDZgFGtg816XvKJisbHDPn-VRXmLPIaB857SoWQyv4WEXsrbVH4Mpwnib2R56jTEHT9c-ntCbJTF1CCyPuCUBHWwMvDkUIKEqtUX2gHIsCcNq6nGf7Sx8zVY29LZ1FI9hc3SNb7HaOcgRgkn_pxRt_Qq42p9lU5JWf43lHd7sgkaVVXtP0sc0cRel0pbbOiuOXA"
            icon="functions"
            color="bg-blue-50 dark:bg-blue-900/30 text-primary dark:text-blue-400"
          />
          <EvalCard 
            title="计算机科学导论" 
            dept="计算机学院" 
            prof="陈莎 教授" 
            avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuC41pJVmqoF9k4OmBnRPukBvz9enZbVUqqVHvbztDHN2SfM3IvRLIZcVaQvtRgjW_GCsTQm-8hf-piz66PPZ3ssA2USGXNEI_0cxIkO9uwbSnHjuHaeU49FDuBAATf1M5yBE3qleNX44WxSsjIBmCU6MRtVu9u7IRIbwvlJe9iqDXAFiSsQdEwgsN5sHBV2H5WWwqSCCjIw8pefY3fWURLu42tA-zYYQ8nzyobYJYPZXAtO3YCwy7sF56KBRgsa4sYF04kXLfDikzk"
            icon="terminal"
            color="bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400"
          />
          <EvalCard 
            title="中国近代史纲要" 
            dept="马克思主义学院" 
            prof="张伟 教授" 
            avatar="https://lh3.googleusercontent.com/aida-public/AB6AXuDFjw9k9oRLi9sTS2K4RsrgFZ0Eq1_RFjzdoYYMYs_-Hb0SAxJsb8qdZQUKkuY1IiAFOeWsZz8vh-qQuj2L_sjeYyY9yhdZ9z5JM9UW-HhT2psc41UwbB52OfbVtohplpt7B5rmHIwBG7Np0hzjM7bZnVJ5OMIcGr-k0AqFZ6aqGLtGwzJQs_4YqfedqeDDvGecDpOYReQcRS7KtWosf5MPplMmiOS-CyD9LRr5AaCqUbjX2OC6SusNUPPTywFTfQV7PQg2yrmyzL0"
            icon="history_edu"
            color="bg-red-50 dark:bg-red-900/30 text-red-600 dark:text-red-400"
          />

          <div className="flex flex-col items-center justify-center py-8 opacity-60">
            <p className="text-xs text-center text-gray-400">已加载全部待评教课程</p>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 right-0 z-40 bg-gradient-to-t from-background-light dark:from-background-dark via-background-light/95 dark:via-background-dark/95 to-transparent pt-10 pb-safe">
        <div className="max-w-md mx-auto px-6 pb-4">
          <button className="w-full group bg-primary hover:bg-blue-600 text-white font-bold text-lg py-4 rounded-2xl shadow-xl shadow-blue-500/30 active:scale-[0.98] transition-all flex items-center justify-center gap-2">
            <span className="material-symbols-outlined">auto_awesome</span>
            <span>一键评教</span>
          </button>
        </div>
      </div>
    </div>
  );
};

const EvalCard = ({ title, dept, prof, avatar, icon, color }: any) => {
  return (
    <div className="group relative flex flex-col gap-4 rounded-2xl bg-surface-light dark:bg-surface-dark p-5 shadow-sm border border-gray-100 dark:border-gray-700/50 transition-all active:scale-[0.99]">
      <div className="flex justify-between items-start gap-4">
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-flex items-center rounded-full bg-orange-50 dark:bg-orange-900/20 px-2.5 py-0.5 text-xs font-medium text-orange-600 dark:text-orange-300 ring-1 ring-inset ring-orange-500/20">
              待评教
            </span>
          </div>
          <h3 className="text-lg font-bold leading-tight mb-1">{title}</h3>
          <p className="text-xs text-gray-500 dark:text-gray-400 font-medium tracking-wide">{dept}</p>
        </div>
        <div className={`size-12 rounded-full ${color} flex items-center justify-center shrink-0`}>
          <span className="material-symbols-outlined" style={{ fontSize: '24px' }}>{icon}</span>
        </div>
      </div>
      <div className="w-full h-px bg-gray-100 dark:bg-gray-700"></div>
      <div className="flex items-center gap-3">
        <div className="size-9 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden">
          <img alt="Instructor Avatar" className="w-full h-full object-cover" src={avatar} />
        </div>
        <div className="flex flex-col">
          <span className="text-sm font-bold">{prof}</span>
          <span className="text-[10px] text-gray-400">主讲教师</span>
        </div>
      </div>
    </div>
  );
};

export default EvaluationView;