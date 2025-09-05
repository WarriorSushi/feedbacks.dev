'use client';

import { useRouter } from 'next/navigation';
import { useState, useTransition } from 'react';
import Link, { LinkProps } from 'next/link';
import { cn } from '@/lib/utils';
import { LoadingSpinner } from '@/components/route-loading';

interface LoadingLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string;
  showSpinner?: boolean;
}

export function LoadingLink({ 
  children, 
  href, 
  className, 
  showSpinner = false,
  ...props 
}: LoadingLinkProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isNavigating, setIsNavigating] = useState(false);

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    setIsNavigating(true);
    
    startTransition(() => {
      router.push(href.toString());
    });

    // Reset loading state after navigation
    setTimeout(() => {
      setIsNavigating(false);
    }, 1000);
  };

  return (
    <Link
      href={href}
      onClick={handleClick}
      className={cn(
        "relative transition-all duration-200",
        isPending && "pointer-events-none",
        className
      )}
      {...props}
    >
      <span className={cn(
        "transition-opacity duration-200",
        isPending && "opacity-70"
      )}>
        {children}
      </span>
      
      {showSpinner && (isPending || isNavigating) && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/80 backdrop-blur-sm rounded">
          <LoadingSpinner className="p-0" />
        </div>
      )}
    </Link>
  );
}