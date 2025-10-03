import { ProductCard } from "./ProductCard";
import { Button } from "./ui/button";
import { Plus, Filter } from "lucide-react";

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
    image: "https://images.unsplash.com/photo-1750341472956-e69e84cc71a9?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxiaWN5Y2xlJTIwc2Vjb25kJTIwaGFuZHxlbnwxfHx8fDE3NTkyNjk3NTV8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral",
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
  }
];

export function MarketplaceSection() {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2>跳蚤市场</h2>
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