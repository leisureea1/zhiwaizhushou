import { Home, ShoppingBag, Search, MessageCircle, User } from "lucide-react";

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const tabs = [
  { id: "home", label: "首页", icon: Home },
  { id: "marketplace", label: "跳蚤市场", icon: ShoppingBag },
  { id: "lostfound", label: "失物招领", icon: Search },
  { id: "messages", label: "消息", icon: MessageCircle },
  { id: "profile", label: "我的", icon: User },
];

export function TabNavigation({ activeTab, onTabChange }: TabNavigationProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
      <div className="flex">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              className={`flex-1 flex flex-col items-center justify-center py-2 px-1 ${
                isActive 
                  ? "text-primary" 
                  : "text-muted-foreground"
              }`}
            >
              <Icon className="h-5 w-5 mb-1" />
              <span className="text-xs">{tab.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}