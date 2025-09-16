'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, BarChart3, MessageSquare, Settings, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface MobileBottomNavProps {
  projectsCount?: number;
}

export function MobileBottomNav({ projectsCount = 0 }: MobileBottomNavProps) {
  const pathname = usePathname();

  const navItems = [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: Home,
    },
    {
      title: "Projects",
      url: "/projects",
      icon: BarChart3,
      badge: projectsCount > 0 ? projectsCount.toString() : undefined,
    },
    {
      title: "New",
      url: "/projects/new",
      icon: Plus,
      isAction: true,
    },
    {
      title: "Feedback",
      url: "/feedback",
      icon: MessageSquare,
    },
    {
      title: "Settings",
      url: "/settings",
      icon: Settings,
    },
  ];

  return (
    <div className="md:hidden">
      {/* Fixed bottom navigation */}
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-md border-t border-border">
        {/* Safe area padding for iOS */}
        <div className="pb-safe-area-inset-bottom">
          <div className="flex items-center justify-around px-2 py-2">
            {navItems.map((item) => {
              const isActive = pathname === item.url || 
                (item.url !== '/dashboard' && pathname.startsWith(item.url));
              
              return (
                <Link
                  key={item.url}
                  href={item.url}
                  className={cn(
                    "flex flex-col items-center justify-center min-h-[48px] px-2 py-1 rounded-lg transition-all duration-200 relative group flex-1 max-w-[80px]",
                    isActive 
                      ? "bg-primary/10 text-primary" 
                      : "text-muted-foreground hover:text-foreground hover:bg-accent/50"
                  )}
                >
                  <div className="relative">
                    <item.icon 
                      className={cn(
                        "h-5 w-5 transition-all duration-200",
                        isActive ? "text-primary" : "group-hover:scale-110",
                        item.isAction && "bg-primary text-primary-foreground p-1 rounded-full h-6 w-6"
                      )} 
                    />
                    
                    {/* Mobile: Hide projects count badge for cleaner UI */}
                    
                    {/* Active indicator */}
                    {isActive && (
                      <div className="absolute -bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-primary rounded-full" />
                    )}
                  </div>
                  
                  {/* Label */}
                  <span className={cn(
                    "text-xs mt-1 font-medium leading-none transition-all duration-200",
                    isActive ? "text-primary" : "text-muted-foreground"
                  )}>
                    {item.title}
                  </span>
                  
                  {/* Haptic feedback area */}
                  <div className="absolute inset-0 rounded-lg" />
                </Link>
              );
            })}
          </div>
        </div>
      </div>
      
      {/* Bottom padding to account for fixed nav */}
      <div className="h-[80px]" />
    </div>
  );
}
