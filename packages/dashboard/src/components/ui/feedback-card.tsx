"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";
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
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ 
        duration: 0.4, 
        delay: index * 0.1,
        type: "spring",
        stiffness: 100
      }}
      className={cn(
        "group relative bg-card border border-border rounded-lg p-4 transition-all duration-300 hover:shadow-md hover:border-primary/20 hover:bg-accent/5",
        className,
      )}
    >
      {/* Timeline line */}
      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary via-accent to-primary/50 rounded-l-lg opacity-60 group-hover:opacity-100 transition-opacity" />
      
      {/* Content */}
      <div className="flex items-start gap-3 pl-4">
        <motion.div 
          className="w-8 h-8 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 group-hover:bg-accent/20 transition-colors"
          whileHover={{ scale: 1.1 }}
          transition={{ type: "spring", stiffness: 400, damping: 10 }}
        >
          <UserIcon className="h-4 w-4 text-accent" />
        </motion.div>
        
        <div className="flex-1 min-w-0 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2">
            <div className="flex flex-wrap items-center gap-2 min-w-0">
              <p className="font-medium text-sm truncate group-hover:text-primary transition-colors">
                {feedback.email}
              </p>
              <Badge variant="outline" className="text-xs flex-shrink-0 group-hover:border-primary/30">
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
          
          <motion.p 
            className="text-sm text-muted-foreground line-clamp-2 leading-relaxed group-hover:text-foreground/80 transition-colors"
            initial={{ height: "auto" }}
          >
            {feedback.message}
          </motion.p>
          
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Globe className="h-3 w-3 flex-shrink-0" />
            <span className="truncate group-hover:text-muted-foreground/80 transition-colors">{feedback.url}</span>
          </div>
        </div>
      </div>

      {/* Hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-accent/5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </motion.div>
  );
}