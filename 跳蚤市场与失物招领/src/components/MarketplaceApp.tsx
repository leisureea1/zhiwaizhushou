import { useState } from "react";
import { SearchBar } from "./SearchBar";
import { ProductCard } from "./ProductCard";
import { Button } from "./ui/button";
import { Plus, Filter, ArrowLeft, Home, ShoppingBag, MessageCircle, User } from "lucide-react";

const mockProducts = [
  {
    id: 1,
    image: "https://images.unsplash.com/photo-1758779529327-4cbf5f8989b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWNvbmQlMjBoYW5kJTIwbWFya2V0JTIwaXRlbXN8ZW58MXx8fHwxNzU5MjY5NzQ4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "佳能EOS相机 九成新 送镜头",
    price: "1280",
    location: "朝阳区",
    condition: "九成新",
    seller: "摄影爱好者",
    publishTime: "1小时前"
  },
  {
    id: 2,
    image: "https://images.unsplash.com/photo-1750341472956-e69e84cc71a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxiaWN5Y2xlJTIwc2Vjb25kJTIwaGFuZHxlbnwxfHx8fDE3NTkyNjk3NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "山地自行车 轻度使用 学生价",
    price: "450",
    location: "海淀区",
    condition: "八成新",
    seller: "大学生",
    publishTime: "2小时前"
  },
  {
    id: 3,
    image: "https://images.unsplash.com/photo-1633345136287-23889e21db00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx2aW50YWdlJTIwY2FtZXJhJTIwZWxlY3Ryb25pY3N8ZW58MXx8fHwxNzU5MjU5MzI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "复古胶片相机 收藏品级别",
    price: "890",
    location: "西城区",
    condition: "收藏级",
    seller: "古董收藏家",
    publishTime: "3小时前"
  },
  {
    id: 4,
    image: "https://images.unsplash.com/photo-1758779529327-4cbf5f8989b5?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxzZWNvbmQlMjBoYW5kJTIwbWFya2V0JTIwaXRlbXN8ZW58MXx8fHwxNzU5MjY5NzQ4fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "MacBook Pro 13寸 2022款",
    price: "8500",
    location: "东城区",
    condition: "九五成新",
    seller: "程序员",
    publishTime: "5小时前"
  },
  {
    id: 5,
    image: "https://images.unsplash.com/photo-1750341472956-e69e84cc71a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxiaWN5Y2xlJTIwc2Vjb25kJTIwaGFuZHxlbnwxfHx8fDE3NTkyNjk3NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "游戏手柄 PS5 DualSense",
    price: "380",
    location: "丰台区",
    condition: "九成新",
    seller: "游戏玩家",
    publishTime: "8小时前"
  },
  {
    id: 6,
    image: "https://images.unsplash.com/photo-1633345136287-23889e21db00?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHx2aW50YWdlJTIwY2FtZXJhJTIwZWxlY3Ryb25pY3N8ZW58MXx8fHwxNzU5MjU5MzI3fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "iPad Air 64GB WiFi版",
    price: "2800",
    location: "石景山区",
    condition: "八五成新",
    seller: "设计师",
    publishTime: "1天前"
  }
];

const tabs = [
  { id: "home", label: "首页", icon: Home },
  { id: "category", label: "分类", icon: ShoppingBag },
  { id: "messages", label: "消息", icon: MessageCircle },
  { id: "profile", label: "我的", icon: User },
];

interface MarketplaceAppProps {
  onBack: () => void;
}

export function MarketplaceApp({ onBack }: MarketplaceAppProps) {
  const [activeTab, setActiveTab] = useState("home");

  const renderContent = () => {
    switch (activeTab) {
      case "category":
        return (
          <div className="space-y-4">
            <h2>商品分类</h2>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-4 bg-card rounded-lg border text-center">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-primary" />
                <span>电子产品</span>
              </div>
              <div className="p-4 bg-card rounded-lg border text-center">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-primary" />
                <span>生活用品</span>
              </div>
              <div className="p-4 bg-card rounded-lg border text-center">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-primary" />
                <span>书籍文具</span>
              </div>
              <div className="p-4 bg-card rounded-lg border text-center">
                <ShoppingBag className="h-8 w-8 mx-auto mb-2 text-primary" />
                <span>运动户外</span>
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
              <Button variant="outline" className="w-full justify-start">我发布的商品</Button>
              <Button variant="outline" className="w-full justify-start">我的收藏</Button>
              <Button variant="outline" className="w-full justify-start">交易记录</Button>
              <Button variant="outline" className="w-full justify-start">设置</Button>
            </div>
          </div>
        );
      default:
        return (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2>推荐商品</h2>
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
            
            <div className="grid grid-cols-2 gap-3">
              {mockProducts.map(product => (
                <ProductCard key={product.id} {...product} />
              ))}
            </div>
            
            <Button variant="outline" className="w-full">
              查看更多商品
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
            <h1>跳蚤市场</h1>
          </div>
          <Button size="sm" className="h-8">
            <Plus className="h-4 w-4 mr-1" />
            发布
          </Button>
        </div>
        <SearchBar placeholder="搜索商品..." />
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