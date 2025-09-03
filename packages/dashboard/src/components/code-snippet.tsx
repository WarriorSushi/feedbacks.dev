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
    <div className={`relative rounded-lg bg-slate-900 text-slate-50 ${className}`}>
      <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700">
        <span className="text-sm font-medium text-slate-400">{language}</span>
        <Button
          size="sm"
          variant="ghost"
          onClick={copyToClipboard}
          className="h-8 px-2 text-slate-400 hover:text-slate-50 hover:bg-slate-800"
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
      <pre className="p-4 overflow-x-auto text-sm text-left">
        <code className="text-left">{code}</code>
      </pre>
    </div>
  );
}