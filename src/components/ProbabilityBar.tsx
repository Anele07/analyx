import React from 'react';

interface ProbabilityBarProps {
  positive: number; // 0 to 1
  neutral: number; // 0 to 1
  negative: number; // 0 to 1
  showLabels?: boolean;
  compact?: boolean;
}

export const ProbabilityBar: React.FC<ProbabilityBarProps> = ({
  positive,
  neutral,
  negative,
  showLabels = true,
  compact = false,
}) => {
  // Ensure percentages round nicely to 100%
  const posPct = Math.round(positive * 100);
  const negPct = Math.round(negative * 100);
  const neuPct = Math.max(0, 100 - posPct - negPct);

  return (
    <div className="w-full">
      {/* Segmented bar */}
      <div
        className={`w-full flex rounded-md overflow-hidden bg-white/5 border border-white/5 ${
          compact ? 'h-2' : 'h-3'
        }`}
      >
        {/* Positive Segment - Green */}
        {posPct > 0 && (
          <div
            style={{ width: `${posPct}%` }}
            className="bg-emerald-500 transition-all duration-300 relative group shadow-xs"
            title={`Positive: ${posPct}%`}
          />
        )}
        {/* Neutral Segment - Slate */}
        {neuPct > 0 && (
          <div
            style={{ width: `${neuPct}%` }}
            className="bg-slate-500 transition-all duration-300 relative group"
            title={`Neutral: ${neuPct}%`}
          />
        )}
        {/* Negative Segment - Red */}
        {negPct > 0 && (
          <div
            style={{ width: `${negPct}%` }}
            className="bg-rose-500 transition-all duration-300 relative group shadow-xs"
            title={`Negative: ${negPct}%`}
          />
        )}
      </div>

      {/* Legend & Exact Percentage Metrics */}
      {showLabels && (
        <div className="flex items-center justify-between text-xs mt-2 text-[#9b978f]">
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
            <span className="font-medium text-[#dedad3]">Positive</span>
            <span className="font-mono tabular-nums font-semibold text-emerald-400 ml-0.5">
              {posPct}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-slate-500 inline-block" />
            <span className="font-medium text-[#dedad3]">Neutral</span>
            <span className="font-mono tabular-nums font-semibold text-slate-400 ml-0.5">
              {neuPct}%
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
            <span className="font-medium text-[#dedad3]">Negative</span>
            <span className="font-mono tabular-nums font-semibold text-rose-400 ml-0.5">
              {negPct}%
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
