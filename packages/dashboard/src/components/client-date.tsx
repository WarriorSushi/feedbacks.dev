'use client';

import { useEffect, useState } from 'react';

interface ClientDateProps {
  date: string;
  prefix?: string;
  suffix?: string;
  format?: 'date' | 'datetime' | 'time';
  className?: string;
}

export function ClientDate({
  date,
  prefix = '',
  suffix = '',
  format = 'date',
  className
}: ClientDateProps) {
  const [formattedDate, setFormattedDate] = useState<string>('');

  useEffect(() => {
    const dateObj = new Date(date);
    let formatted = '';

    switch (format) {
      case 'datetime':
        formatted = dateObj.toLocaleString();
        break;
      case 'time':
        formatted = dateObj.toLocaleTimeString();
        break;
      case 'date':
      default:
        formatted = dateObj.toLocaleDateString();
        break;
    }

    setFormattedDate(formatted);
  }, [date, format]);

  // Render nothing during server-side rendering to avoid hydration mismatch
  if (!formattedDate) {
    return <span className={className}>{prefix}Loading...{suffix}</span>;
  }

  return (
    <span className={className}>
      {prefix}{formattedDate}{suffix}
    </span>
  );
}