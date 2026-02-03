import React from 'react';

interface TimerRingProps {
  progress: number; // 0 to 100
  radius?: number;
  stroke?: number;
  color?: string;
}

export const TimerRing: React.FC<TimerRingProps> = ({
  progress,
  radius = 100,
  stroke = 2,
  color = "stroke-focus-accent"
}) => {
  const normalizedRadius = radius - stroke * 2;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  return (
    <div className="relative flex items-center justify-center">
      <svg
        height={radius * 2}
        width={radius * 2}
        className="transform -rotate-90 transition-all duration-500 ease-in-out"
      >
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className="text-focus-ring-bg"
        />
        <circle
          stroke="currentColor"
          fill="transparent"
          strokeWidth={stroke}
          strokeDasharray={circumference + ' ' + circumference}
          style={{ strokeDashoffset }}
          strokeLinecap="round"
          r={normalizedRadius}
          cx={radius}
          cy={radius}
          className={`${color} transition-all duration-1000 ease-linear`}
        />
      </svg>
    </div>
  );
};
