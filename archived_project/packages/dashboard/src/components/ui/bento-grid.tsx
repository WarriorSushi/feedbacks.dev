import { cn } from "@/lib/utils";

export const BentoGrid = ({
  className,
  children,
}: {
  className?: string;
  children?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "mx-auto grid max-w-7xl grid-cols-1 gap-4 md:auto-rows-[18rem] md:grid-cols-3",
        className,
      )}
    >
      {children}
    </div>
  );
};

export const BentoGridItem = ({
  className,
  title,
  description,
  header,
  icon,
}: {
  className?: string;
  title?: string | React.ReactNode;
  description?: string | React.ReactNode;
  header?: React.ReactNode;
  icon?: React.ReactNode;
}) => {
  return (
    <div
      className={cn(
        "group/bento hover-lift bg-card border border-border rounded-xl p-4 transition-all duration-300 hover:shadow-lg hover:border-primary/30 hover:bg-accent/5 relative overflow-hidden",
        className,
      )}
    >
      {/* Subtle hover glow effect */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 opacity-0 group-hover/bento:opacity-100 transition-opacity duration-300" />
      
      {header}
      <div className="relative transition-all duration-300 group-hover/bento:translate-y-[-2px] group-hover/bento:scale-[1.02]">
        <div className="flex items-center justify-between mb-3">
          <div className="transition-colors duration-300 group-hover/bento:text-primary">
            {icon}
          </div>
        </div>
        <div className="space-y-1">
          <div className="transition-colors duration-300 group-hover/bento:text-primary">
            {title}
          </div>
          {description}
        </div>
      </div>
    </div>
  );
};