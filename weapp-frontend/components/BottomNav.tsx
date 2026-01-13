import React from 'react';
import { Screen } from '../types';

interface BottomNavProps {
  currentScreen: Screen;
  setScreen: (screen: Screen) => void;
}

const BottomNav: React.FC<BottomNavProps> = ({ currentScreen, setScreen }) => {
  const getButtonClass = (isActive: boolean) => 
    `flex flex-col items-center gap-1 w-16 group transition duration-200 ${isActive ? 'text-primary' : 'text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300'}`;

  // Check if we are in a main tab or a sub-app (keep the relevant tab active visually)
  const isHomeActive = currentScreen === Screen.HOME;
  const isAppsActive = currentScreen === Screen.APPS || currentScreen === Screen.GRADES || currentScreen === Screen.EXAMS || currentScreen === Screen.BUS || currentScreen === Screen.EVALUATION || currentScreen === Screen.AI_CHAT;
  const isProfileActive = currentScreen === Screen.PROFILE;

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-surface-light dark:bg-surface-dark border-t border-gray-100 dark:border-gray-800 pb-safe z-50">
      <div className="flex justify-around items-center h-16 max-w-md mx-auto">
        <button 
          onClick={() => setScreen(Screen.HOME)}
          className={getButtonClass(isHomeActive)}
        >
          <span className="material-icons-round text-2xl group-hover:scale-110 transition duration-200">home</span>
          <span className="text-[10px] font-bold">首页</span>
        </button>

        <button 
          onClick={() => setScreen(Screen.APPS)}
          className={getButtonClass(isAppsActive)}
        >
          <span className="material-icons-round text-xl group-hover:scale-110 transition duration-200">grid_view</span>
          <span className="text-[10px] font-bold">应用</span>
        </button>

        <button 
          onClick={() => setScreen(Screen.PROFILE)}
          className={getButtonClass(isProfileActive)}
        >
          <span className="material-icons-round text-xl group-hover:scale-110 transition duration-200">person</span>
          <span className="text-[10px] font-bold">个人</span>
        </button>
      </div>
    </nav>
  );
};

export default BottomNav;