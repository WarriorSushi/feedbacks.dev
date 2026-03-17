"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { ProjectSettingsSheet } from '@/components/project-settings';
import { cn } from '@/lib/utils';

interface ProjectSettingsLauncherProps {
  projectId: string;
  projectName: string;
  className?: string;
  variant?: 'default' | 'icon';
}

export function ProjectSettingsLauncher({
  projectId,
  projectName,
  className = '',
  variant = 'default',
}: ProjectSettingsLauncherProps) {
  const [open, setOpen] = useState(false);
  const label = 'Project Settings';

  return (
    <>
      <Button
        variant={variant === 'icon' ? 'ghost' : 'outline'}
        size={variant === 'icon' ? 'icon' : 'sm'}
        className={cn(variant === 'icon' ? 'h-8 w-8 rounded-full p-0' : 'gap-2', className)}
        onClick={() => setOpen(true)}
        aria-label={label}
        title={label}
      >
        <Settings className="h-4 w-4" />
        {variant !== 'icon' && <span>{label}</span>}
      </Button>
      <ProjectSettingsSheet
        projectId={projectId}
        projectName={projectName}
        open={open}
        onOpenChange={setOpen}
      />
    </>
  );
}
