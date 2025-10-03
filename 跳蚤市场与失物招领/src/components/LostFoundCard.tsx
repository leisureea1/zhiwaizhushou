import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { MapPin, Clock } from "lucide-react";

interface LostFoundCardProps {
  image: string;
  title: string;
  type: "lost" | "found";
  location: string;
  time: string;
  description: string;
  contact: string;
  publishTime: string;
}

export function LostFoundCard({ 
  image, 
  title, 
  type, 
  location, 
  time, 
  description, 
  contact, 
  publishTime 
}: LostFoundCardProps) {
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
        <div className="flex items-center justify-between">
          <h3 className="font-medium line-clamp-1">{title}</h3>
          <Badge 
            variant={type === "lost" ? "destructive" : "default"}
            className="text-xs"
          >
            {type === "lost" ? "寻物" : "招领"}
          </Badge>
        </div>
        
        <div className="space-y-1 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <MapPin className="h-3 w-3" />
            <span>{location}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-3 w-3" />
            <span>{time}</span>
          </div>
        </div>
        
        <p className="text-sm line-clamp-2">{description}</p>
        
        <div className="text-sm text-muted-foreground flex justify-between">
          <span>联系人: {contact}</span>
          <span>{publishTime}</span>
        </div>
      </div>
    </Card>
  );
}