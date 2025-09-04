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
    <div className={`relative rounded-lg bg-slate-900 text-slate-50 shadow-2xl border border-slate-800 ${className}`}>
      {/* macOS Window Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-800 rounded-t-lg border-b border-slate-700">
        <div className="flex items-center space-x-2">
          {/* Traffic Light Buttons */}
          <div className="flex space-x-2">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500"></div>
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
          </div>
        </div>
        <span className="text-sm font-medium text-slate-300 absolute left-1/2 transform -translate-x-1/2">{language}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={copyToClipboard}
          className="h-8 px-2 text-slate-400 hover:text-slate-50 hover:bg-slate-700 transition-colors"
        >
          {copied ? (
            <>
              <Check className="h-3 w-3 mr-1" />
              Copied
            </>
          ) : (
            <>
              <Copy className="h-3 w-3 mr-1" />
              Copy
            </>
          )}
        </Button>
      </div>
      <pre className="p-4 overflow-x-auto text-sm text-left bg-slate-900 rounded-b-lg">
        <code className="text-left">{code}</code>
      </pre>
    </div>
  );
}