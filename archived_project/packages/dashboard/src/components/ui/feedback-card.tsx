"use client";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Clock, Globe, User as UserIcon, Star } from "lucide-react";

export function FeedbackCard({
  feedback,
  index = 0,
  className,
}: {
  feedback: {
    id: string;
    email: string;
    message: string;
    rating: number;
    url: string;
    created_at: string;
    project_name: string;
    status: string;
  };
  index?: number;
  className?: string;
}) {
  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / (1000 * 60));
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    return `${minutes}m ago`;
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`h-3 w-3 ${i < rating ? 'text-accent fill-accent' : 'text-muted-foreground'}`} 
      />
    ));
  };

  return (
    <div 
      className={cn(
        "group relative bg-card border rounded-lg p-4",
        className,
      )}
    >
      {/* Timeline line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-primary/50 rounded-l-lg" />
      
      {/* Content */}
      <div className="flex items-start gap-3 pl-4">
        <div 
          className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0"
        >
          <UserIcon className="h-4 w-4 text-accent" />
        </div>
        
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <p className="font-medium text-sm truncate">
                {feedback.email}
              </p>
              <Badge variant="outline" className="text-xs flex-shrink-0">
                {feedback.project_name}
              </Badge>
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
              <Clock className="h-3 w-3" />
              <span className="whitespace-nowrap">{formatTimeAgo(feedback.created_at)}</span>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1">
              {getRatingStars(feedback.rating)}
            </div>
            <span className="text-xs text-muted-foreground">({feedback.rating}/5)</span>
          </div>
          
          <p 
            className="text-sm text-muted-foreground line-clamp-2 leading-relaxed"
          >
            {feedback.message}
          </p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3 w-3 flex-shrink-0" />
            <span className="truncate">{feedback.url}</span>
          </div>
        </div>
      </div>

    </div>
  );
}