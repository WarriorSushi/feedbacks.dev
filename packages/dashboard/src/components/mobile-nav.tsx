'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, Home, FolderPlus, Settings, LogOut } from 'lucide-react';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => setIsOpen(!isOpen);

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden p-2"
        onClick={toggleMenu}
        aria-label="Open navigation menu"
      >
        <Menu className="h-5 w-5" />
      </Button>
    );
  }

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/50 z-40 md:hidden"
        onClick={toggleMenu}
      />
      
      {/* Mobile Menu */}
      <div className="fixed left-0 top-0 h-full w-64 bg-background border-r z-50 md:hidden">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Navigation</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={toggleMenu}
            aria-label="Close navigation menu"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="p-4 space-y-2">
          <Link
            href="/dashboard"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={toggleMenu}
          >
            <Home className="h-4 w-4" />
            <span>Dashboard</span>
          </Link>
          
          <Link
            href="/projects/new"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={toggleMenu}
          >
            <FolderPlus className="h-4 w-4" />
            <span>New Project</span>
          </Link>
          
          <Link
            href="/settings"
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground"
            onClick={toggleMenu}
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </Link>
          
          <button
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground w-full text-left"
            onClick={() => {
              // Add logout functionality later
              toggleMenu();
            }}
          >
            <LogOut className="h-4 w-4" />
            <span>Sign Out</span>
          </button>
        </nav>
      </div>
    </>
  );
}