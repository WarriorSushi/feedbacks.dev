"use client";
import { cn } from "@/lib/utils";

export function StatsCard({
  className,
  title,
  value,
  description,
  icon,
  children,
}: {
  className?: string;
  title: string;
  value: string | number;
  description: string;
  icon?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "group relative bg-card border rounded-xl p-4 md:p-6 cursor-pointer",
        className,
      )}
    >
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs md:text-sm font-medium text-muted-foreground">
            {title}
          </h3>
          <div className="text-muted-foreground">
            {icon}
          </div>
        </div>
        
        <div className="space-y-2">
          <div className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground">
            {value}
          </div>
          <p className="text-xs text-muted-foreground">
            {description}
          </p>
        </div>
        
        {children}
      </div>
    </div>
  );
}