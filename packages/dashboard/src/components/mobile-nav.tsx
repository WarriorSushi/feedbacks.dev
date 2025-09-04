'use client';

import { useState, useCallback, useMemo } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Menu, X, Home, FolderPlus, Settings, LogOut } from 'lucide-react';

export function MobileNav() {
  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = useCallback(() => setIsOpen(prev => !prev), []);
  const closeMenu = useCallback(() => setIsOpen(false), []);

  const menuItems = useMemo(() => [
    { href: '/dashboard', icon: Home, label: 'Dashboard' },
    { href: '/projects/new', icon: FolderPlus, label: 'New Project' },
    { href: '/settings', icon: Settings, label: 'Settings' }
  ], []);

  if (!isOpen) {
    return (
      <Button
        variant="ghost"
        size="sm"
        className="md:hidden p-2 transition-colors duration-150"
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
        className="fixed inset-0 bg-black/50 z-40 md:hidden transition-opacity duration-200"
        onClick={closeMenu}
      />
      
      {/* Mobile Menu */}
      <div className="fixed left-0 top-0 h-full w-64 bg-background border-r z-50 md:hidden transform translate-x-0 transition-transform duration-200 ease-out">
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="font-semibold">Navigation</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={closeMenu}
            aria-label="Close navigation menu"
            className="transition-colors duration-150"
          >
            <X className="h-5 w-5" />
          </Button>
        </div>
        
        <nav className="p-4 space-y-2">
          {menuItems.map((item) => {
            const IconComponent = item.icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground transition-colors duration-150"
                onClick={closeMenu}
              >
                <IconComponent className="h-4 w-4" />
                <span>{item.label}</span>
              </Link>
            );
          })}
          
          <button
            className="flex items-center space-x-3 rounded-lg px-3 py-2 text-sm hover:bg-accent hover:text-accent-foreground w-full text-left transition-colors duration-150"
            onClick={() => {
              // Add logout functionality later
              closeMenu();
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