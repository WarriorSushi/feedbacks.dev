"use client";

import React from "react";

interface SparklineProps {
  data: number[];
  width?: number;
  height?: number;
  stroke?: string;
  fill?: string;
  className?: string;
}

export function Sparkline({ data, width = 200, height = 48, stroke = "hsl(var(--primary))", fill = "hsla(var(--primary),0.15)", className = "" }: SparklineProps) {
  if (!data || data.length === 0) return <svg width={width} height={height} className={className} />;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = Math.max(1, max - min);
  const step = width / Math.max(1, data.length - 1);
  const points = data.map((d, i) => {
    const x = i * step;
    const y = height - ((d - min) / range) * (height - 4) - 2; // padding 2px
    return `${x},${y}`;
  }).join(" ");

  // area path
  const areaPath = `M 0,${height} L ${points} L ${width},${height} Z`;

  return (
    <svg width={width} height={height} className={className} viewBox={`0 0 ${width} ${height}`}>
      <path d={areaPath} fill={fill} stroke="none" />
      <polyline points={points} fill="none" stroke={stroke} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

