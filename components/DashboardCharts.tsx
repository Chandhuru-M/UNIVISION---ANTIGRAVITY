'use client';

import React from 'react';

// =======================================================
// DONUT CHART
// =======================================================
interface DonutSegment {
  label: string;
  value: number;
  color: string;
}

export function DonutChart({ segments }: { segments: DonutSegment[] }) {
  const total = segments.reduce((sum, s) => sum + s.value, 0);
  let accumulatedAngle = 0;
  
  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center bg-card p-6 rounded-3xl border border-border">
      <div className="relative shrink-0">
        <svg width="140" height="140" viewBox="0 0 40 40" className="transform -rotate-90">
          {/* Base circle background */}
          <circle cx="20" cy="20" r="15.9155" fill="transparent" stroke="var(--border)" strokeWidth="3.5" opacity="0.4" />
          {segments.map((seg, idx) => {
            const percentage = total > 0 ? (seg.value / total) * 100 : 0;
            const strokeDash = `${percentage} ${100 - percentage}`;
            const strokeOffset = 100 - accumulatedAngle;
            accumulatedAngle += percentage;
            
            return (
              <circle
                key={idx}
                cx="20"
                cy="20"
                r="15.9155"
                fill="transparent"
                stroke={seg.color}
                strokeWidth="3.5"
                strokeDasharray={strokeDash}
                strokeDashoffset={strokeOffset}
                className="transition-all duration-300 hover:stroke-[4.5px] cursor-pointer"
                style={{ strokeLinecap: percentage > 1 ? 'round' : 'butt' }}
              />
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <span className="text-xl font-black text-foreground">
            {total.toLocaleString()}
          </span>
          <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">
            Total
          </span>
        </div>
      </div>
      
      {/* Legend list */}
      <div className="flex-1 space-y-2 w-full text-left">
        {segments.map((seg, idx) => {
          const pct = total > 0 ? Math.round((seg.value / total) * 100) : 0;
          return (
            <div key={idx} className="flex items-center justify-between text-xs font-semibold">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full shrink-0" style={{ backgroundColor: seg.color }} />
                <span className="text-muted-foreground truncate max-w-[120px]">{seg.label}</span>
              </div>
              <span className="text-foreground font-bold">{pct}% ({seg.value})</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// =======================================================
// BAR CHART
// =======================================================
interface BarDataItem {
  label: string;
  value: number;
}

export function BarChart({ data }: { data: BarDataItem[] }) {
  const maxValue = Math.max(...data.map(d => d.value), 1);
  
  return (
    <div className="bg-card p-6 rounded-3xl border border-border text-left space-y-4">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">last 6 months</span>
      </div>

      <div className="h-44 flex items-end justify-between gap-2.5 pt-4 border-b border-border">
        {data.map((item, idx) => {
          const heightPercent = (item.value / maxValue) * 90; // scale down slightly to avoid hitting the top ceiling
          return (
            <div key={idx} className="flex-1 flex flex-col items-center group relative h-full justify-end">
              {/* Tooltip */}
              <div className="absolute top-0 bg-primary-foreground text-foreground text-[9px] font-bold px-2 py-0.5 rounded border border-border shadow-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 -translate-y-2">
                ₹{item.value.toLocaleString()}
              </div>
              {/* Vertical Bar */}
              <div 
                className="w-full bg-blue-600 rounded-t-md transition-all duration-300 group-hover:bg-blue-500 cursor-pointer"
                style={{ height: `${Math.max(heightPercent, 4)}%` }}
              />
            </div>
          );
        })}
      </div>
      
      {/* Labels */}
      <div className="flex justify-between text-[10px] font-bold text-muted-foreground">
        {data.map((item, idx) => (
          <span key={idx} className="flex-1 text-center truncate">{item.label}</span>
        ))}
      </div>
    </div>
  );
}
