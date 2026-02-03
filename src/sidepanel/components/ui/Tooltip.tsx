import React, { useState, useRef, useEffect } from 'react';

interface TooltipProps {
  content: string;
  children: React.ReactNode;
  delay?: number;
}

export const Tooltip: React.FC<TooltipProps> = ({
  content,
  children,
  delay = 400,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });
  const [resolvedPosition, setResolvedPosition] = useState<'top' | 'bottom'>('top');
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<number | null>(null);

  const showTooltip = () => {
    timeoutRef.current = window.setTimeout(() => {
      setIsVisible(true);
    }, delay);
  };

  const hideTooltip = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsVisible(false);
  };

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const padding = 8;

      // Auto-detect: prefer top, fall back to bottom if not enough space
      const spaceAbove = triggerRect.top - padding;
      const pos = spaceAbove >= tooltipRect.height + 8 ? 'top' : 'bottom';
      setResolvedPosition(pos);

      let x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      let y = pos === 'top'
        ? triggerRect.top - tooltipRect.height - 8
        : triggerRect.bottom + 8;

      // Keep tooltip within viewport
      x = Math.max(padding, Math.min(x, window.innerWidth - tooltipRect.width - padding));
      y = Math.max(padding, Math.min(y, window.innerHeight - tooltipRect.height - padding));

      setCoords({ x, y });
    }
  }, [isVisible]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onMouseEnter={showTooltip}
        onMouseLeave={hideTooltip}
        onFocus={showTooltip}
        onBlur={hideTooltip}
        className="inline-flex"
      >
        {children}
      </div>

      {isVisible && (
        <div
          ref={tooltipRef}
          role="tooltip"
          className="fixed z-50 px-2.5 py-1.5 text-xs font-medium rounded-lg
                     bg-focus-surface/95 text-focus-text-strong
                     border border-focus-border/50 backdrop-blur-sm
                     shadow-lg shadow-black/10
                     animate-tooltip-in
                     pointer-events-none"
          style={{
            left: coords.x,
            top: coords.y,
          }}
        >
          <span className="relative z-10">{content}</span>
          <div
            className={`absolute w-2 h-2 bg-focus-surface/95 border-focus-border/50 rotate-45
              ${resolvedPosition === 'top' ? 'bottom-[-5px] left-1/2 -translate-x-1/2 border-r border-b' : ''}
              ${resolvedPosition === 'bottom' ? 'top-[-5px] left-1/2 -translate-x-1/2 border-l border-t' : ''}
            `}
          />
        </div>
      )}
    </>
  );
};
