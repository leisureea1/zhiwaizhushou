import React from 'react';

const HomeView: React.FC = () => {
  return (
    <div className="flex flex-col h-screen overflow-hidden bg-background-light dark:bg-background-dark">
      {/* Header */}
      <header className="flex-none bg-surface-light dark:bg-surface-dark px-3 pt-4 pb-1 shadow-sm z-30">
        <div className="flex items-center justify-between mb-3">
          <button className="p-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition active:scale-95">
            <span className="material-icons-round text-lg">menu</span>
          </button>
          <div className="flex flex-col items-center cursor-pointer active:opacity-70 transition">
            <div className="flex items-center gap-1">
              <span className="text-base font-bold text-gray-900 dark:text-white tracking-tight">第2周</span>
              <span className="material-icons-round text-xs text-gray-900 dark:text-white">arrow_drop_down</span>
            </div>
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium">当前第-33周</span>
          </div>
          <button className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-[10px] font-medium text-gray-600 dark:text-gray-300 shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition active:scale-95">
            <span className="material-icons-round text-xs animate-spin-slow">sync</span>
            <span>刷新</span>
          </button>
        </div>
        {/* Date Grid Header */}
        <div className="grid grid-cols-[2rem_repeat(7,1fr)] gap-0.5 text-center">
          <div className="text-[10px] text-gray-400 font-medium self-end pb-0.5"></div>
          {[
            { day: "周一", date: "9/8" },
            { day: "周二", date: "9/9" },
            { day: "周三", date: "9/10" },
            { day: "周四", date: "9/11" },
            { day: "周五", date: "9/12" },
            { day: "周六", date: "9/13" },
            { day: "周日", date: "9/14" }
          ].map((item, idx) => (
            <div key={idx} className="flex flex-col items-center pb-0.5">
              <span className="text-[10px] font-bold text-gray-700 dark:text-gray-300">{item.day}</span>
              <span className="text-[8px] text-gray-400 dark:text-gray-500 font-medium mt-px">{item.date}</span>
            </div>
          ))}
        </div>
      </header>

      {/* Schedule Grid */}
      <main className="flex-1 overflow-y-auto relative bg-surface-light dark:bg-background-dark no-scrollbar pb-20">
        <div className="grid grid-cols-[2rem_repeat(7,1fr)] grid-rows-[repeat(12,minmax(3.5rem,1fr))] gap-0.5 p-1 pb-1 text-xs min-h-[800px]">
          
          {/* Time Sidebar */}
          {[
            { i: 1, t: "8:00\n8:50" }, { i: 2, t: "9:00\n9:50" }, { i: 3, t: "10:10\n11:00" }, { i: 4, t: "11:10\n12:00" },
            { i: "午休", t: "12:00\n14:00" }, // Special row
            { i: 6, t: "14:00\n14:50" }, { i: 7, t: "15:00\n15:50" }, { i: 8, t: "16:10\n17:00" }, { i: 9, t: "17:10\n18:00" },
            { i: "晚休", t: "18:00\n19:10" }, // Special row
            { i: 11, t: "19:10\n20:00" }, { i: 12, t: "20:10\n21:00" }
          ].map((slot, index) => {
            if (typeof slot.i === 'string') {
               // Break rows handled separately in grid placement
               return null; 
            }
            return (
              <div key={index} className="flex flex-col items-center justify-center h-full text-gray-400 dark:text-gray-500 border-r border-dashed border-gray-100 dark:border-gray-800" style={{ gridRowStart: index + 1 }}>
                <span className="text-xs font-semibold leading-none text-gray-600 dark:text-gray-400">{slot.i}</span>
                <span className="text-[0.5rem] leading-none mt-0.5 opacity-70 whitespace-pre text-center">{slot.t}</span>
              </div>
            );
          })}

          {/* Courses */}
          {/* 1. Practical Russian III */}
          <div className="col-start-2 row-start-1 bg-sky-50 dark:bg-sky-900/20 p-1 rounded-md flex flex-col border-l-[3px] border-sky-300 dark:border-sky-500 shadow-sm transition hover:brightness-95 dark:hover:brightness-110">
            <h3 className="font-bold text-[0.65rem] text-gray-800 dark:text-sky-100 line-clamp-2 leading-tight mb-0.5">实践俄语 III</h3>
            <p className="text-[0.55rem] text-gray-500 dark:text-sky-300 leading-none">李小彤</p>
            <p className="text-[0.55rem] text-gray-500 dark:text-sky-300 leading-none">JB107</p>
          </div>

          {/* 2. Russian Grammar I */}
          <div className="col-start-4 row-start-1 bg-pink-50 dark:bg-pink-900/20 p-1 rounded-md flex flex-col border-l-[3px] border-pink-300 dark:border-pink-500 shadow-sm transition hover:brightness-95 dark:hover:brightness-110">
            <h3 className="font-bold text-[0.65rem] text-gray-800 dark:text-pink-100 line-clamp-2 leading-tight mb-0.5">俄语语法 I</h3>
            <p className="text-[0.55rem] text-gray-500 dark:text-pink-300 leading-none">刘珏</p>
            <p className="text-[0.55rem] text-gray-500 dark:text-pink-300 leading-none">JB107</p>
          </div>

           {/* 3. Practical Russian III (Wed) */}
           <div className="col-start-5 row-start-1 bg-amber-50 dark:bg-amber-900/20 p-1 rounded-md flex flex-col border-l-[3px] border-amber-300 dark:border-amber-500 shadow-sm transition hover:brightness-95 dark:hover:brightness-110">
            <h3 className="font-bold text-[0.65rem] text-gray-800 dark:text-amber-100 line-clamp-2 leading-tight mb-0.5">实践俄语 III</h3>
            <p className="text-[0.55rem] text-gray-500 dark:text-amber-300 leading-none">李小彤</p>
            <p className="text-[0.55rem] text-gray-500 dark:text-amber-300 leading-none">JB107</p>
          </div>

          {/* 4. Russian Grammar I (Mon 3-4) */}
          <div className="col-start-2 row-start-3 bg-pink-50 dark:bg-pink-900/20 p-1 rounded-md flex flex-col border-l-[3px] border-pink-300 dark:border-pink-500 shadow-sm transition hover:brightness-95 dark:hover:brightness-110">
             <h3 className="font-bold text-[0.65rem] text-gray-800 dark:text-pink-100 line-clamp-2 leading-tight mb-0.5">俄语语法 I</h3>
             <p className="text-[0.55rem] text-gray-500 dark:text-pink-300 leading-none">刘珏</p>
             <p className="text-[0.55rem] text-gray-500 dark:text-pink-300 leading-none">JB107</p>
          </div>

           {/* 5. Practical Russian III (Wed 3-4) */}
           <div className="col-start-4 row-start-3 bg-sky-50 dark:bg-sky-900/20 p-1 rounded-md flex flex-col border-l-[3px] border-sky-300 dark:border-sky-500 shadow-sm transition hover:brightness-95 dark:hover:brightness-110">
            <h3 className="font-bold text-[0.65rem] text-gray-800 dark:text-sky-100 line-clamp-2 leading-tight mb-0.5">实践俄语 III</h3>
            <p className="text-[0.55rem] text-gray-500 dark:text-sky-300 leading-none">李小彤</p>
            <p className="text-[0.55rem] text-gray-500 dark:text-sky-300 leading-none">JB107</p>
          </div>

          {/* Lunch Break */}
          <div className="col-span-full row-start-5 bg-orange-50/50 dark:bg-orange-900/10 flex items-center h-full rounded border border-orange-100 dark:border-orange-900/30 my-0.5">
            <div className="w-[2rem] flex flex-col items-center justify-center text-orange-400 dark:text-orange-500 font-medium border-r border-orange-100 dark:border-orange-900/30 h-full">
                <span className="text-[10px] font-bold">午休</span>
            </div>
            <div className="flex-1 flex justify-center items-center gap-1.5 text-[10px] text-orange-400 dark:text-orange-500 font-medium tracking-wide">
                <span className="material-icons-round text-xs">wb_sunny</span>
                午休 12:00-14:00
            </div>
          </div>

          {/* 6. International Law */}
          <div className="col-start-3 row-start-6 row-span-2 bg-indigo-50 dark:bg-indigo-900/20 p-1 rounded-md flex flex-col border-l-[3px] border-indigo-300 dark:border-indigo-500 shadow-sm z-10 transition hover:brightness-95 dark:hover:brightness-110">
            <h3 className="font-bold text-[0.65rem] text-gray-800 dark:text-indigo-100 line-clamp-2 leading-tight mb-0.5">国际法学</h3>
            <p className="text-[0.55rem] text-gray-500 dark:text-indigo-300 leading-none">王阳</p>
            <p className="text-[0.55rem] text-gray-500 dark:text-indigo-300 leading-none">JB107</p>
          </div>

          {/* 7. Civil Procedure Law */}
          <div className="col-start-4 row-start-6 row-span-2 bg-yellow-50 dark:bg-yellow-900/20 p-1 rounded-md flex flex-col border-l-[3px] border-yellow-300 dark:border-yellow-500 shadow-sm z-10 transition hover:brightness-95 dark:hover:brightness-110">
            <h3 className="font-bold text-[0.65rem] text-gray-800 dark:text-yellow-100 line-clamp-2 leading-tight mb-0.5">民事诉讼法学</h3>
            <p className="text-[0.55rem] text-gray-500 dark:text-yellow-300 leading-none">张妮</p>
            <p className="text-[0.55rem] text-gray-500 dark:text-yellow-300 leading-none">JB107</p>
          </div>

          {/* Dinner Break */}
          <div className="col-span-full row-start-10 bg-orange-50/50 dark:bg-orange-900/10 flex items-center h-full rounded border border-orange-100 dark:border-orange-900/30 my-0.5">
            <div className="w-[2rem] flex flex-col items-center justify-center text-orange-400 dark:text-orange-500 font-medium border-r border-orange-100 dark:border-orange-900/30 h-full">
                <span className="text-[10px] font-bold">晚休</span>
            </div>
            <div className="flex-1 flex justify-center items-center gap-1.5 text-[10px] text-orange-400 dark:text-orange-500 font-medium tracking-wide">
                <span className="material-icons-round text-xs">nights_stay</span>
                晚休 18:00-19:10
            </div>
          </div>

          {/* 8. Mao Zedong Thought */}
          <div className="col-start-4 row-start-11 row-span-2 bg-emerald-50 dark:bg-emerald-900/20 p-1 rounded-md flex flex-col border-l-[3px] border-emerald-300 dark:border-emerald-500 shadow-sm z-10 transition hover:brightness-95 dark:hover:brightness-110">
            <h3 className="font-bold text-gray-800 dark:text-emerald-100 line-clamp-2 leading-tight mb-0.5 text-[0.6rem]">毛泽东思想和中国特色社会主义理论体系概论</h3>
            <p className="text-[0.55rem] text-gray-500 dark:text-emerald-300 leading-none">梁东亮</p>
            <p className="text-[0.55rem] text-gray-500 dark:text-emerald-300 leading-none">JA410</p>
          </div>

        </div>
      </main>
    </div>
  );
};

export default HomeView;