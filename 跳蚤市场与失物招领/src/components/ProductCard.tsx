import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";

interface ProductCardProps {
  image: string;
  title: string;
  price: string;
  location: string;
  condition: string;
  seller: string;
  publishTime: string;
}

export function ProductCard({ 
  image, 
  title, 
  price, 
  location, 
  condition, 
  seller, 
  publishTime 
}: ProductCardProps) {
  return (
    <Card className="overflow-hidden shadow-sm border-0 bg-card">
      <div className="aspect-square overflow-hidden">
        <ImageWithFallback
          src={image}
          alt={title}
          className="w-full h-full object-cover"
        />
      </div>
      <div className="p-3 space-y-2">
        <h3 className="font-medium line-clamp-2">{title}</h3>
        <div className="flex items-center justify-between">
          <span className="text-destructive font-semibold">¥{price}</span>
          <Badge variant="secondary" className="text-xs">{condition}</Badge>
        </div>
        <div className="text-sm text-muted-foreground space-y-1">
          <div>{location}</div>
          <div className="flex justify-between">
            <span>{seller}</span>
            <span>{publishTime}</span>
          </div>
        </div>
      </div>
    </Card>
  );
}