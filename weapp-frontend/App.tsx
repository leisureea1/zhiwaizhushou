import React, { useState } from 'react';
import { Screen } from './types';
import LoginView from './views/LoginView';
import HomeView from './views/HomeView';
import AppsView from './views/AppsView';
import ProfileView from './views/ProfileView';
import GradesView from './views/GradesView';
import ExamsView from './views/ExamsView';
import BusView from './views/BusView';
import EvaluationView from './views/EvaluationView';
import AiChatView from './views/AiChatView';
import BottomNav from './components/BottomNav';

const App: React.FC = () => {
  const [currentScreen, setCurrentScreen] = useState<Screen>(Screen.LOGIN);

  const renderScreen = () => {
    switch (currentScreen) {
      case Screen.LOGIN:
        return <LoginView setScreen={setCurrentScreen} />;
      case Screen.HOME:
        return <HomeView />;
      case Screen.APPS:
        return <AppsView setScreen={setCurrentScreen} />;
      case Screen.PROFILE:
        return <ProfileView setScreen={setCurrentScreen} />;
      case Screen.GRADES:
        return <GradesView setScreen={setCurrentScreen} />;
      case Screen.EXAMS:
        return <ExamsView setScreen={setCurrentScreen} />;
      case Screen.BUS:
        return <BusView setScreen={setCurrentScreen} />;
      case Screen.EVALUATION:
        return <EvaluationView setScreen={setCurrentScreen} />;
      case Screen.AI_CHAT:
        return <AiChatView setScreen={setCurrentScreen} />;
      default:
        return <HomeView />;
    }
  };

  // Determine if we should show the bottom navigation bar
  // Sub-apps typically have their own back button navigation or fullscreen modal feel
  const showBottomNav = [Screen.HOME, Screen.APPS, Screen.PROFILE].includes(currentScreen);

  return (
    <div className="bg-background-light dark:bg-background-dark min-h-screen text-slate-800 dark:text-slate-100 font-sans">
      {renderScreen()}
      {showBottomNav && (
        <BottomNav currentScreen={currentScreen} setScreen={setCurrentScreen} />
      )}
    </div>
  );
};

export default App;