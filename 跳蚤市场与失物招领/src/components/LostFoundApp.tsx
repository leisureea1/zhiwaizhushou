import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { LostFoundCard } from "./LostFoundCard";
import { Button } from "./ui/button";
import { Plus, Filter, ArrowLeft, Home, Search, MessageCircle, User } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./ui/tabs";

const mockLostItems = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1595320464284-b01e77e0785b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb3N0JTIwZm91bmQlMjBpdGVtcyUyMHBob25lJTIwd2FsbGV0fGVufDF8fHx8MTc1OTI2OTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "iPhone 14 Pro 深空黑",
    type: "lost" as const,
    location: "三里屯地铁站",
    time: "昨天下午3点",
    description: "黑色手机壳，屏幕有贴膜，对我很重要，有重酬",
    contact: "张同学",
    publishTime: "6小时前"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1595320464284-b01e77e0785b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb3N0JTIwZm91bmQlMjBpdGVtcyUyMHBob25lJTIwd2FsbGV0fGVufDF8fHx8MTc1OTI2OTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "黑色钱包",
    type: "lost" as const,
    location: "望京SOHO",
    time: "今天上午10点",
    description: "黑色皮质钱包，内有身份证和银行卡",
    contact: "李先生",
    publishTime: "2小时前"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1595320464284-b01e77e0785b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb3N0JTIwZm91bmQlMjBpdGVtcyUyMHBob25lJTIwd2FsbGV0fGVufDF8fHx8MTc1OTI2OTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "蓝色背包",
    type: "lost" as const,
    location: "北京大学图书馆",
    time: "前天晚上9点",
    description: "蓝色运动背包，内有笔记本电脑和课本",
    contact: "王同学",
    publishTime: "1天前"
  }
];

const mockFoundItems = [
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1595320464284-b01e77e0785b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb3N0JTIwZm91bmQlMjBpdGVtcyUyMHBob25lJTIwd2FsbGV0fGVufDF8fHx8MTc1OTI2OTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "银色耳机",
    type: "found" as const,
    location: "国贸地铁站B口",
    time: "今天中午12点",
    description: "银色无线耳机，品牌不详，在地铁口捡到",
    contact: "王女士",
    publishTime: "1小时前"
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1595320464284-b01e77e0785b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb3N0JTIwZm91bmQlMjBpdGVtcyUyMHBob25lJTIwd2FsbGV0fGVufDF8fHx8MTc1OTI2OTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "学生卡",
    type: "found" as const,
    location: "清华大学图书馆",
    time: "昨天晚上8点",
    description: "清华大学学生卡，姓名为王某某",
    contact: "图书管理员",
    publishTime: "12小时前"
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1595320464284-b01e77e0785b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb3N0JTIwZm91bmQlMjBpdGVtcyUyMHBob25lJTIwd2FsbGV0fGVufDF8fHx8MTc1OTI2OTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "红色保温杯",
    type: "found" as const,
    location: "朝阳公园",
    time: "今天上午9点",
    description: "红色不锈钢保温杯，有卡通贴纸",
    contact: "公园管理员",
    publishTime: "4小时前"
  }
];

const tabs = [
  { id: "home", label: "首页", icon: Home },
  { id: "search", label: "搜索", icon: Search },
  { id: "messages", label: "消息", icon: MessageCircle },
  { id: "profile", label: "我的", icon: User },
];

interface LostFoundAppProps {
  onBack: () => void;
}

export function LostFoundApp({ onBack }: LostFoundAppProps) {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "search":
        return (
          <div className="space-y-4">
            <h2>高级搜索</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm mb-2">物品类型</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">手机</Button>
                  <Button variant="outline" size="sm">钱包</Button>
                  <Button variant="outline" size="sm">钥匙</Button>
                  <Button variant="outline" size="sm">证件</Button>
                  <Button variant="outline" size="sm">背包</Button>
                  <Button variant="outline" size="sm">其他</Button>
                </div>
              </div>
              <div>
                <label className="block text-sm mb-2">地点范围</label>
                <div className="grid grid-cols-2 gap-2">
                  <Button variant="outline" size="sm">朝阳区</Button>
                  <Button variant="outline" size="sm">海淀区</Button>
                  <Button variant="outline" size="sm">西城区</Button>
                  <Button variant="outline" size="sm">东城区</Button>
                </div>
              </div>
            </div>
          </div>
        );
      case "messages":
        return (
          <div className="flex flex-col items-center justify-center h-64 text-muted-foreground">
            <MessageCircle className="h-12 w-12 mb-4" />
            <h3>消息中心</h3>
            <p className="text-sm mt-2">暂无新消息</p>
          </div>
        );
      case "profile":
        return (
          <div className="space-y-4">
            <div className="bg-card p-4 rounded-lg border">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center">
                  <User className="h-8 w-8 text-primary" />
                </div>
                <div>
                  <h3>用户昵称</h3>
                  <p className="text-sm text-muted-foreground">点击设置个人信息</p>
                </div>
              </div>
            </div>
            <div className="space-y-2">
              <Button variant="outline" className="w-full justify-start">我发布的信息</Button>
              <Button variant="outline" className="w-full justify-start">我的关注</Button>
              <Button variant="outline" className="w-full justify-start">联系记录</Button>
              <Button variant="outline" className="w-full justify-start">设置</Button>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2>失物招领</h2>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" className="h-8">
                  <Filter className="h-4 w-4 mr-1" />
                  筛选
                </Button>
                <Button size="sm" className="h-8">
                  <Plus className="h-4 w-4 mr-1" />
                  发布
                </Button>
              </div>
            </div>
            
            <Tabs defaultValue="lost" className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-9">
                <TabsTrigger value="lost" className="text-sm">寻物启事</TabsTrigger>
                <TabsTrigger value="found" className="text-sm">失物招领</TabsTrigger>
              </TabsList>
              
              <TabsContent value="lost" className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {mockLostItems.map(item => (
                    <LostFoundCard key={item.id} {...item} />
                  ))}
                </div>
              </TabsContent>
              
              <TabsContent value="found" className="mt-4">
                <div className="grid grid-cols-2 gap-3">
                  {mockFoundItems.map(item => (
                    <LostFoundCard key={item.id} {...item} />
                  ))}
                </div>
              </TabsContent>
            </Tabs>
            
            <Button variant="outline" className="w-full">
              查看更多信息
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-sm border-b border-border px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" onClick={onBack} className="h-8 w-8 p-0">
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1>失物招领</h1>
          </div>
          <Button size="sm" className="h-8">
            <Plus className="h-4 w-4 mr-1" />
            发布
          </Button>
        </div>
        <SearchBar placeholder="搜索失物信息..." />
      </div>

      {/* Content */}
      <div className="px-4 py-4 pb-20">
        {renderContent()}
      </div>

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border">
        <div className="flex">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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
    </div>
  );
}