import React from 'react';
import { SentimentLabel } from '../types/sentiment';

interface ConfidenceGaugeProps {
  value: number; // For compound: -1.0 to +1.0; for confidence: 0.0 to 1.0
  type?: 'compound' | 'confidence';
  label?: SentimentLabel;
  title?: string;
  size?: number;
}

export const ConfidenceGauge: React.FC<ConfidenceGaugeProps> = ({
  value,
  type = 'compound',
  label = 'neutral',
  title = 'Compound Score',
  size = 180,
}) => {
  // Angle maps:
  // For compound (-1 to +1): -1 maps to -90 deg, 0 maps to 0 deg, +1 maps to +90 deg
  // For confidence (0 to 1): 0 maps to -90 deg, 1 maps to +90 deg
  let angle = 0;
  let formattedDisplay = '';

  if (type === 'compound') {
    // Clamped -1 to 1
    const clamped = Math.max(-1, Math.min(1, value));
    angle = clamped * 90;
    formattedDisplay = clamped > 0 ? `+${clamped.toFixed(3)}` : clamped.toFixed(3);
  } else {
    const clamped = Math.max(0, Math.min(1, value));
    angle = -90 + clamped * 180;
    formattedDisplay = `${Math.round(clamped * 100)}%`;
  }

  // Strict color consistency: Green for positive, Slate for neutral, Red for negative
  let activeColor = '#64748b'; // Slate for neutral
  if (label === 'positive') activeColor = '#16a34a'; // Green
  else if (label === 'negative') activeColor = '#dc2626'; // Red

  // Semi-circle SVG geometry
  const radius = 70;
  const cx = size / 2;
  const cy = size * 0.58;

  // Track arc from -90 deg to +90 deg (top half semi-circle)
  // Arc path: starts at (cx - radius, cy), ends at (cx + radius, cy)
  const arcPath = `M ${cx - radius} ${cy} A ${radius} ${radius} 0 0 1 ${cx + radius} ${cy}`;

  // Needle length
  const needleLen = radius - 10;
  const rad = (angle - 90) * (Math.PI / 180);
  const nx = cx + needleLen * Math.cos(rad);
  const ny = cy + needleLen * Math.sin(rad);

  // Dynamic gradient ID to prevent SVG ID collisions across multiple gauges
  const gradientId = `gaugeGrad-${type}-${label}`;

  return (
    <div className="flex flex-col items-center">
      <div className="relative" style={{ width: size, height: size * 0.65 }}>
        <svg
          width={size}
          height={size * 0.65}
          viewBox={`0 0 ${size} ${size * 0.65}`}
          className="overflow-visible"
        >
          <defs>
            {type === 'compound' ? (
              // Bipolar compound gradient: Red (-1.0) -> Slate (0.0) -> Green (+1.0)
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#dc2626" />
                <stop offset="42%" stopColor="#f87171" />
                <stop offset="48%" stopColor="#94a3b8" />
                <stop offset="52%" stopColor="#94a3b8" />
                <stop offset="58%" stopColor="#4ade80" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
            ) : label === 'negative' ? (
              // Monopolar negative confidence gradient: Slate (0%) -> Rose -> Deep Red (100%)
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="35%" stopColor="#fda4af" />
                <stop offset="70%" stopColor="#f43f5e" />
                <stop offset="100%" stopColor="#dc2626" />
              </linearGradient>
            ) : label === 'positive' ? (
              // Monopolar positive confidence gradient: Slate (0%) -> Mint -> Deep Green (100%)
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#cbd5e1" />
                <stop offset="35%" stopColor="#86efac" />
                <stop offset="70%" stopColor="#22c55e" />
                <stop offset="100%" stopColor="#16a34a" />
              </linearGradient>
            ) : (
              // Monopolar neutral confidence gradient: Light Slate (0%) -> Deep Slate (100%)
              <linearGradient id={gradientId} x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#e2e8f0" />
                <stop offset="50%" stopColor="#94a3b8" />
                <stop offset="100%" stopColor="#475569" />
              </linearGradient>
            )}
          </defs>

          {/* Background track */}
          <path
            d={arcPath}
            fill="none"
            stroke="rgba(255, 255, 255, 0.08)"
            strokeWidth="12"
            strokeLinecap="round"
          />

          {/* Colored spectrum arc */}
          <path
            d={arcPath}
            fill="none"
            stroke={`url(#${gradientId})`}
            strokeWidth="10"
            strokeLinecap="round"
            opacity="0.95"
          />

          {/* Gauge Tick Marks */}
          <g className="text-[10px] font-mono select-none">
            {type === 'compound' ? (
              <>
                <text x={cx - radius - 2} y={cy + 16} textAnchor="middle" fill="#f43f5e">-1.0</text>
                <text x={cx} y={cy - radius - 6} textAnchor="middle" fill="#94a3b8">0.0</text>
                <text x={cx + radius + 2} y={cy + 16} textAnchor="middle" fill="#10b981">+1.0</text>
              </>
            ) : (
              <>
                <text x={cx - radius} y={cy + 16} textAnchor="middle" fill="#64748b">0%</text>
                <text x={cx} y={cy - radius - 6} textAnchor="middle" fill="#94a3b8">50%</text>
                <text x={cx + radius} y={cy + 16} textAnchor="middle" fill={activeColor}>100%</text>
              </>
            )}
          </g>

          {/* Pivot Center Hub */}
          <circle cx={cx} cy={cy} r="6" fill="#2d303a" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />

          {/* Needle */}
          <line
            x1={cx}
            y1={cy}
            x2={nx}
            y2={ny}
            stroke={activeColor}
            strokeWidth="3"
            strokeLinecap="round"
            className="transition-all duration-300 ease-out"
          />
          <circle cx={cx} cy={cy} r="3" fill="#ffffff" />
        </svg>
      </div>

      {/* Numerical Metric & Title */}
      <div className="text-center -mt-2">
        <span
          className="text-xl font-bold font-mono tabular-nums tracking-tight"
          style={{ color: activeColor }}
        >
          {formattedDisplay}
        </span>
        <p className="text-[11px] text-[#9b978f] font-medium tracking-wider uppercase mt-0.5">
          {title}
        </p>
      </div>
    </div>
  );
};
