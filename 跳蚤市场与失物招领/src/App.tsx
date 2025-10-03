import { useState } from "react";
import { MarketplaceApp } from "./components/MarketplaceApp";
import { LostFoundApp } from "./components/LostFoundApp";
import { Button } from "./components/ui/button";
import { ShoppingBag, Search, ArrowRight } from "lucide-react";
import { Card } from "./components/ui/card";

type AppType = "home" | "marketplace" | "lostfound";

export default function App() {
  const [currentApp, setCurrentApp] = useState<AppType>("home");

  if (currentApp === "marketplace") {
    return <MarketplaceApp onBack={() => setCurrentApp("home")} />;
  }

  if (currentApp === "lostfound") {
    return <LostFoundApp onBack={() => setCurrentApp("home")} />;
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="bg-primary text-primary-foreground px-4 py-8">
        <div className="text-center">
          <h1 className="text-2xl mb-2">校园生活助手</h1>
          <p className="text-sm text-primary-foreground/80">
            让校园生活更便利
          </p>
        </div>
      </div>

      {/* App Selection */}
      <div className="px-4 py-8 space-y-6">
        <div className="space-y-4">
          <h2>选择应用</h2>
          
          <Card 
            className="p-6 cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
            onClick={() => setCurrentApp("marketplace")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
                  <ShoppingBag className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-lg">跳蚤市场</h3>
                  <p className="text-sm text-muted-foreground">
                    买卖二手物品，让闲置变现金
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                二手交易
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                物品出售
              </span>
              <span className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded">
                求购信息
              </span>
            </div>
          </Card>

          <Card 
            className="p-6 cursor-pointer hover:shadow-md transition-shadow border-2 hover:border-primary/20"
            onClick={() => setCurrentApp("lostfound")}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center">
                  <Search className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-lg">失物招领</h3>
                  <p className="text-sm text-muted-foreground">
                    帮助找回丢失物品，传递温暖
                  </p>
                </div>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </div>
            
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                寻物启事
              </span>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                失物招领
              </span>
              <span className="text-xs bg-green-50 text-green-700 px-2 py-1 rounded">
                爱心互助
              </span>
            </div>
          </Card>
        </div>

        {/* Statistics */}
        <div className="bg-muted/50 rounded-lg p-4">
          <h3 className="text-sm mb-3">今日数据</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-xl font-semibold text-blue-600">156</div>
              <div className="text-xs text-muted-foreground">新发布商品</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-semibold text-green-600">23</div>
              <div className="text-xs text-muted-foreground">物品已找回</div>
            </div>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="space-y-3">
          <h3 className="text-sm">快速操作</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button 
              variant="outline" 
              className="h-12 flex-col space-y-1"
              onClick={() => setCurrentApp("marketplace")}
            >
              <ShoppingBag className="h-4 w-4" />
              <span className="text-xs">发布商品</span>
            </Button>
            <Button 
              variant="outline" 
              className="h-12 flex-col space-y-1"
              onClick={() => setCurrentApp("lostfound")}
            >
              <Search className="h-4 w-4" />
              <span className="text-xs">发布寻物</span>
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}