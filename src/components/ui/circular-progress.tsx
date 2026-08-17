"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

interface CircularProgressProps extends React.HTMLAttributes<HTMLDivElement> {
  value: number;
  size?: number;
  strokeWidth?: number;
  color?: string;
  trackColor?: string;
}

export function CircularProgress({
  value,
  size = 120,
  strokeWidth = 10,
  color = "#8B5CF6", // AI violet by default
  trackColor = "currentColor",
  className,
  ...props
}: CircularProgressProps) {
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  const offset = circumference - (value / 100) * circumference;

  return (
    <div
      className={cn("relative flex items-center justify-center", className)}
      style={{ width: size, height: size }}
      {...props}
    >
      <svg width={size} height={size} className="rotate-[-90deg]">
        {/* Track */}
        <circle
          className="text-muted/30"
          stroke={trackColor}
          fill="transparent"
          strokeWidth={strokeWidth}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
        {/* Indicator */}
        <circle
          className="transition-all duration-1000 ease-out"
          stroke={color}
          fill="transparent"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          r={radius}
          cx={size / 2}
          cy={size / 2}
        />
      </svg>
      {/* Percentage Text Centered */}
      <div className="absolute flex flex-col items-center justify-center">
        <span className="text-3xl font-bold tracking-tighter text-foreground">
          {value}<span className="text-lg text-muted-foreground">%</span>
        </span>
      </div>
    </div>
  );
}
