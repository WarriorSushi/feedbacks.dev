"use client";

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Settings } from 'lucide-react';
import { ProjectSettingsSheet } from '@/components/project-settings';

export function ProjectSettingsLauncher({ projectId, projectName, className = '' }: { projectId: string; projectName: string; className?: string }) {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button variant="outline" className={`gap-2 ${className}`} onClick={() => setOpen(true)}>
        <Settings className="h-4 w-4" />
        Project Settings
      </Button>
      <ProjectSettingsSheet projectId={projectId} projectName={projectName} open={open} onOpenChange={setOpen} />
    </>
  );
}

