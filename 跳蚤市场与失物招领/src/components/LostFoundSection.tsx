import { LostFoundCard } from "./LostFoundCard";
import { Button } from "./ui/button";
import { Plus, Filter } from "lucide-react";
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
  }
];

const mockFoundItems = [
  {
    id: 3,
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
    id: 4,
    image: "https://images.unsplash.com/photo-1595320464284-b01e77e0785b?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsb3N0JTIwZm91bmQlMjBpdGVtcyUyMHBob25lJTIwd2FsbGV0fGVufDF8fHx8MTc1OTI2OTc1MXww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
    title: "学生卡",
    type: "found" as const,
    location: "清华大学图书馆",
    time: "昨天晚上8点",
    description: "清华大学学生卡，姓名为王某某",
    contact: "图书管理员",
    publishTime: "12小时前"
  }
];

export function LostFoundSection() {
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