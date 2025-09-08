"use client";
import { cn } from "@/lib/utils";
import { motion } from "motion/react";

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
    <motion.div
      whileHover={{ 
        scale: 1.02,
        y: -4,
      }}
      transition={{
        type: "spring",
        stiffness: 300,
        damping: 20,
      }}
      className={cn(
        "group relative bg-card border border-border rounded-xl p-4 md:p-6 transition-all duration-300 hover:shadow-lg hover:border-primary/30 overflow-hidden cursor-pointer",
        className,
      )}
    >
      {/* Background gradient on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      
      {/* Subtle animated border */}
      <div className="absolute inset-0 rounded-xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="absolute inset-0 rounded-xl border-2 border-primary/20 animate-pulse" />
      </div>
      
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-xs md:text-sm font-medium text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
            {title}
          </h3>
          <div className="text-muted-foreground group-hover:text-primary transition-colors duration-300">
            {icon}
          </div>
        </div>
        
        <div className="space-y-2">
          <motion.div 
            className="text-xl md:text-2xl lg:text-3xl font-bold text-foreground group-hover:text-primary transition-colors duration-300"
            whileHover={{ scale: 1.05 }}
            transition={{ type: "spring", stiffness: 400, damping: 10 }}
          >
            {value}
          </motion.div>
          <p className="text-xs text-muted-foreground group-hover:text-muted-foreground/80 transition-colors">
            {description}
          </p>
        </div>
        
        {children}
      </div>
    </motion.div>
  );
}