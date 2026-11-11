import React, { useState } from 'react';

interface AudienceDonutChartProps {
  positivePct: number;
  neutralPct: number;
  negativePct: number;
  totalCount: number;
  netSentimentScore: number;
  size?: number;
}

export const AudienceDonutChart: React.FC<AudienceDonutChartProps> = ({
  positivePct,
  neutralPct,
  negativePct,
  totalCount,
  netSentimentScore,
  size = 230,
}) => {
  const [hoveredSegment, setHoveredSegment] = useState<'positive' | 'neutral' | 'negative' | null>(null);

  // SVG Geometry
  const strokeWidth = 32;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const center = size / 2;

  // Arc lengths
  const posStroke = (positivePct / 100) * circumference;
  const neuStroke = (neutralPct / 100) * circumference;
  const negStroke = (negativePct / 100) * circumference;

  // Offsets
  // Starting at top (-90 degrees)
  const posOffset = 0;
  const neuOffset = -posStroke;
  const negOffset = -(posStroke + neuStroke);

  return (
    <div className="flex flex-col sm:flex-row items-center gap-6 justify-center">
      {/* Donut SVG */}
      <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="transform -rotate-90"
        >
          {/* Base Track */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="transparent"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth={strokeWidth}
          />

          {/* Positive Segment - Green */}
          {positivePct > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#10b981"
              strokeWidth={hoveredSegment === 'positive' ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${posStroke} ${circumference}`}
              strokeDashoffset={posOffset}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredSegment('positive')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}

          {/* Neutral Segment - Slate */}
          {neutralPct > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#64748b"
              strokeWidth={hoveredSegment === 'neutral' ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${neuStroke} ${circumference}`}
              strokeDashoffset={neuOffset}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredSegment('neutral')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}

          {/* Negative Segment - Red */}
          {negativePct > 0 && (
            <circle
              cx={center}
              cy={center}
              r={radius}
              fill="transparent"
              stroke="#f43f5e"
              strokeWidth={hoveredSegment === 'negative' ? strokeWidth + 4 : strokeWidth}
              strokeDasharray={`${negStroke} ${circumference}`}
              strokeDashoffset={negOffset}
              className="cursor-pointer transition-all duration-200"
              onMouseEnter={() => setHoveredSegment('negative')}
              onMouseLeave={() => setHoveredSegment(null)}
            />
          )}
        </svg>

        {/* Center Aggregate Score Hub */}
        <div className="absolute inset-0 flex flex-col items-center justify-center text-center pointer-events-none">
          {hoveredSegment ? (
            <div>
              <span className="text-3xl font-bold font-mono tabular-nums text-white block">
                {hoveredSegment === 'positive'
                  ? `${positivePct}%`
                  : hoveredSegment === 'neutral'
                  ? `${neutralPct}%`
                  : `${negativePct}%`}
              </span>
              <span className="text-xs uppercase font-semibold tracking-wider text-[#9b978f]">
                {hoveredSegment}
              </span>
            </div>
          ) : (
            <div>
              <span
                className={`text-3xl font-bold font-mono tabular-nums block ${
                  netSentimentScore > 0
                    ? 'text-emerald-400'
                    : netSentimentScore < 0
                    ? 'text-rose-400'
                    : 'text-[#dedad3]'
                }`}
              >
                {netSentimentScore > 0 ? `+${netSentimentScore}` : netSentimentScore}
              </span>
              <span className="text-xs uppercase font-semibold tracking-wider text-[#9b978f]">
                Net Score (NSS)
              </span>
              <span className="text-[11px] text-[#6e6b65] font-mono block mt-0.5">
                {totalCount} comments
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Explicit Percentage Metrics Breakdown Card */}
      <div className="flex flex-col gap-2.5 min-w-[220px]">
        {/* Positive Metric */}
        <div
          onMouseEnter={() => setHoveredSegment('positive')}
          onMouseLeave={() => setHoveredSegment(null)}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            hoveredSegment === 'positive'
              ? 'bg-emerald-500/15 border-emerald-500/40'
              : 'bg-[#181920] border-white/10 hover:border-emerald-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#9b978f] mb-1.5">
            <span className="flex items-center gap-1.5 font-medium text-[#f5f3ef]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
              Positive Opinion
            </span>
            <span className="font-mono tabular-nums font-semibold text-emerald-400 text-sm">
              {positivePct}%
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-emerald-500 h-full rounded-full"
              style={{ width: `${positivePct}%` }}
            />
          </div>
        </div>

        {/* Neutral Metric */}
        <div
          onMouseEnter={() => setHoveredSegment('neutral')}
          onMouseLeave={() => setHoveredSegment(null)}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            hoveredSegment === 'neutral'
              ? 'bg-white/10 border-white/30'
              : 'bg-[#181920] border-white/10 hover:border-white/20'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#9b978f] mb-1.5">
            <span className="flex items-center gap-1.5 font-medium text-[#f5f3ef]">
              <span className="w-2 h-2 rounded-full bg-slate-400 inline-block" />
              Neutral / Inquiries
            </span>
            <span className="font-mono tabular-nums font-semibold text-[#dedad3] text-sm">
              {neutralPct}%
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-slate-400 h-full rounded-full"
              style={{ width: `${neutralPct}%` }}
            />
          </div>
        </div>

        {/* Negative Metric */}
        <div
          onMouseEnter={() => setHoveredSegment('negative')}
          onMouseLeave={() => setHoveredSegment(null)}
          className={`p-3 rounded-xl border transition-all cursor-pointer ${
            hoveredSegment === 'negative'
              ? 'bg-rose-500/15 border-rose-500/40'
              : 'bg-[#181920] border-white/10 hover:border-rose-500/30'
          }`}
        >
          <div className="flex items-center justify-between text-xs text-[#9b978f] mb-1.5">
            <span className="flex items-center gap-1.5 font-medium text-[#f5f3ef]">
              <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
              Negative / Grievance
            </span>
            <span className="font-mono tabular-nums font-semibold text-rose-400 text-sm">
              {negativePct}%
            </span>
          </div>
          <div className="w-full bg-white/5 rounded-full h-1.5 overflow-hidden">
            <div
              className="bg-rose-500 h-full rounded-full"
              style={{ width: `${negativePct}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};
