import React, { useRef, useCallback, useEffect, useState } from 'react';

interface WheelPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
  format?: (value: string) => string;
}

const ITEM_HEIGHT = 40;
const VISIBLE_HEIGHT = 120;

const WheelPicker: React.FC<WheelPickerProps> = ({ 
  value, 
  onChange, 
  options, 
  label,
  format = (v) => v 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [currentIndex, setCurrentIndex] = useState(() => {
    const idx = options.indexOf(value);
    return idx >= 0 ? idx : 0;
  });
  const isDragging = useRef(false);
  const lastUpdateRef = useRef(0);

  useEffect(() => {
    const idx = options.indexOf(value);
    if (idx >= 0 && idx !== currentIndex) {
      setCurrentIndex(idx);
    } else if (idx < 0 && options.length > 0) {
      setCurrentIndex(0);
      onChange(options[0]);
    }
  }, [value, options, currentIndex, onChange]);

  useEffect(() => {
    if (containerRef.current && !isDragging.current) {
      const targetScroll = currentIndex * ITEM_HEIGHT;
      containerRef.current.scrollTop = targetScroll;
    }
  }, [currentIndex]);

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !isDragging.current) return;
    
    const now = Date.now();
    if (now - lastUpdateRef.current < 16) return;
    lastUpdateRef.current = now;
    
    const scrollTop = containerRef.current.scrollTop;
    const newIndex = Math.round(scrollTop / ITEM_HEIGHT);
    
    if (newIndex >= 0 && newIndex < options.length && newIndex !== currentIndex) {
      setCurrentIndex(newIndex);
      onChange(options[newIndex]);
    }
  }, [options, currentIndex, onChange]);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    lastUpdateRef.current = 0;
    const startY = e.clientY;
    const startScrollTop = containerRef.current?.scrollTop || 0;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newScroll = startScrollTop + deltaY;
      const maxScroll = (options.length - 1) * ITEM_HEIGHT;
      const clampedScroll = Math.max(0, Math.min(maxScroll, newScroll));
      
      if (containerRef.current) {
        containerRef.current.scrollTop = clampedScroll;
      }
    };
    
    const handleMouseUp = () => {
      isDragging.current = false;
      if (containerRef.current) {
        const snappedIndex = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(options.length - 1, snappedIndex));
        containerRef.current.scrollTo({
          top: clampedIndex * ITEM_HEIGHT,
          behavior: 'smooth'
        });
        setCurrentIndex(clampedIndex);
        if (clampedIndex >= 0 && clampedIndex < options.length) {
          onChange(options[clampedIndex]);
        }
      }
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
    
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
  }, [options, onChange]);

  const handleClick = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    
    const rect = containerRef.current.getBoundingClientRect();
    const clickY = e.clientY - rect.top;
    const clickedIndex = Math.floor(clickY / ITEM_HEIGHT);
    
    if (clickedIndex >= 0 && clickedIndex < options.length) {
      onChange(options[clickedIndex]);
      containerRef.current.scrollTo({
        top: clickedIndex * ITEM_HEIGHT,
        behavior: 'smooth'
      });
    }
  }, [options, onChange]);

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="text-xs text-[#B19CD9] mb-1">{label}</span>
      )}
      <div className="relative">
        {/* Scrollable content */}
        <div 
          ref={containerRef}
          className="h-[120px] w-16 overflow-hidden relative rounded-lg bg-black/20 border border-[#B19CD9]/30 cursor-grab active:cursor-grabbing"
          onMouseDown={handleMouseDown}
          onClick={handleClick}
          onScroll={handleScroll}
          style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
        >
          <style>{`
            .scrollbar-hide::-webkit-scrollbar { display: none; }
          `}</style>
          
          {/* Top gradient */}
          <div className="absolute inset-x-0 top-0 h-[60px] pointer-events-none z-10 bg-gradient-to-b from-[#0d0a15] via-transparent to-transparent" />
          
          {/* Bottom gradient */}
          <div className="absolute inset-x-0 bottom-0 h-[60px] pointer-events-none z-10 bg-gradient-to-t from-[#0d0a15] via-transparent to-transparent" />
          
          {/* Items */}
          <div className="py-[60px]" style={{ paddingTop: VISIBLE_HEIGHT / 2 - ITEM_HEIGHT / 2 }}>
            {options.map((option, index) => (
              <div
                key={option}
                className={`flex items-center justify-center text-sm font-medium transition-all duration-150 ${
                  index === currentIndex 
                    ? 'text-white text-base' 
                    : index === currentIndex - 1 || index === currentIndex + 1
                      ? 'text-[#B19CD9]/60'
                      : 'text-[#B19CD9]/30'
                }`}
                style={{ height: ITEM_HEIGHT }}
              >
                {format(option)}
              </div>
            ))}
          </div>
        </div>
        
        {/* Center selection indicator - fixed overlay */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-10 pointer-events-none z-20 border-y-2 border-[#B19CD9]/60" />
      </div>
    </div>
  );
};

export default WheelPicker;
