/* eslint-disable @next/next/no-img-element */
'use client';

import { useEffect, useState } from "react";

interface ImageLightboxProps {
  src: string;
  thumbClassName?: string;
  className?: string;
  alt?: string;
}

export function ImageLightbox({ src, thumbClassName = "h-24 w-auto rounded border", className = "max-h-[90vh] max-w-[95vw]", alt = "Screenshot" }: ImageLightboxProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open]);

  return (
    <>
      <button type="button" onClick={() => setOpen(true)} className="inline-block">
        <img src={src} alt={alt} className={thumbClassName} />
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4" onClick={() => setOpen(false)}>
          {/* Stop propagation to avoid closing when clicking image */}
          <img src={src} alt={alt} className={className} onClick={(e) => e.stopPropagation()} />
          <button type="button" aria-label="Close" className="absolute top-4 right-4 text-white/80 hover:text-white text-sm px-3 py-1 bg-white/10 rounded" onClick={() => setOpen(false)}>Close</button>
        </div>
      )}
    </>
  );
}



