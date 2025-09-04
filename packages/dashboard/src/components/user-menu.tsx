'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase-client';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { User, LogOut, Settings } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface UserMenuProps {
  user: {
    id: string;
    email?: string;
    user_metadata?: {
      avatar_url?: string;
      full_name?: string;
      name?: string;
    };
  };
}

export function UserMenu({ user }: UserMenuProps) {
  const [isSigningOut, setIsSigningOut] = useState(false);
  const router = useRouter();
  const supabase = createClient();
  const { toast } = useToast();

  const displayName = user.user_metadata?.full_name || user.user_metadata?.name || 'User';
  const displayEmail = user.email || '';
  const avatarUrl = user.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    try {
      setIsSigningOut(true);
      
      // Check if we're on the correct domain for sign-out
      const currentOrigin = typeof window !== 'undefined' ? window.location.origin : '';
      
      if (currentOrigin !== 'https://app.feedbacks.dev') {
        // If we're not on app.feedbacks.dev, redirect there with a sign-out parameter
        toast({
          title: "Signing out...",
          description: "Redirecting to complete sign-out.",
        });
        window.location.href = 'https://app.feedbacks.dev/auth?signout=true';
        return;
      }
      
      // We're on the correct domain, proceed with sign-out
      console.log('=== SIGN OUT: Starting sign out process on app.feedbacks.dev ===');
      
      // Clear server-side session first
      const serverSignOutResponse = await fetch('/api/sign-out', { 
        method: 'POST',
        credentials: 'include'
      });
      
      if (!serverSignOutResponse.ok) {
        const errorData = await serverSignOutResponse.json();
        console.error('SIGN OUT: Server sign-out failed:', errorData);
        throw new Error('Server sign-out failed');
      }
      
      // Then clear client-side session
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('SIGN OUT: Client sign out error:', error);
      }
      
      toast({
        title: "Signed out successfully",
        description: "You have been signed out of your account.",
      });
      
      // Redirect to auth page (already on app subdomain)
      window.location.href = '/auth';
      
    } catch (error) {
      console.error('SIGN OUT: Error during sign out:', error);
      toast({
        title: "Sign out failed",
        description: "There was an error signing out. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSigningOut(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="h-8 w-8 rounded-full">
          <Avatar className="h-8 w-8">
            <AvatarImage src={avatarUrl} alt={displayName} />
            <AvatarFallback>
              {displayName.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end" forceMount>
        <div className="flex items-center justify-start gap-2 p-2">
          <div className="flex flex-col space-y-1 leading-none">
            <p className="font-medium">{displayName}</p>
            <p className="text-xs text-muted-foreground">{displayEmail}</p>
          </div>
        </div>
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled>
          <Settings className="mr-2 h-4 w-4" />
          <span>Settings</span>
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem onClick={handleSignOut} disabled={isSigningOut}>
          <LogOut className="mr-2 h-4 w-4" />
          <span>{isSigningOut ? 'Signing out...' : 'Sign out'}</span>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}