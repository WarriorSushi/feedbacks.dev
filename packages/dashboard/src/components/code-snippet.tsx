'use client';

import { useState } from 'react';
import { Copy, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CodeSnippetProps {
  code: string;
  language?: string;
  className?: string;
}

export function CodeSnippet({ code, language = 'html', className = '' }: CodeSnippetProps) {
  const [copied, setCopied] = useState(false);

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className={`relative rounded-xl border shadow-lg bg-background text-foreground dark:bg-slate-950 dark:border-slate-800 ${className}`}>
      {/* macOS Window Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-muted/50 dark:bg-slate-900/50 rounded-t-xl border-b border-border dark:border-slate-800 backdrop-blur-sm">
        <div className="flex items-center space-x-2">
          {/* Traffic Light Buttons */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-[#ff5f57] shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-[#ffbd2e] shadow-sm"></div>
            <div className="w-3 h-3 rounded-full bg-[#28ca42] shadow-sm"></div>
          </div>
        </div>
        <span className="text-xs font-medium text-muted-foreground ml-4">{language}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={copyToClipboard}
          className="h-7 px-2 text-xs text-muted-foreground hover:text-foreground hover:bg-muted-foreground/10 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              <span className="text-xs">Copied</span>
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              <span className="text-xs">Copy</span>
            </>
          )}
        </Button>
      </div>
      <pre className="p-4 overflow-hidden text-sm leading-relaxed bg-card dark:bg-slate-950 rounded-b-xl">
        <code className="text-left text-card-foreground dark:text-slate-300 whitespace-pre-wrap">{code}</code>
      </pre>
    </div>
  );
}