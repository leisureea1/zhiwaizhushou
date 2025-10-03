import { Search } from "lucide-react";
import { Input } from "./ui/input";

interface SearchBarProps {
  placeholder?: string;
  onSearch?: (query: string) => void;
}

export function SearchBar({ placeholder = "搜索商品...", onSearch }: SearchBarProps) {
  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
      <Input
        type="text"
        placeholder={placeholder}
        className="pl-10 bg-input-background rounded-full border-0 h-10"
        onChange={(e) => onSearch?.(e.target.value)}
      />
    </div>
  );
}