import React, { useRef, useCallback } from 'react';

interface WheelPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
  format?: (value: string) => string;
}

const ITEM_HEIGHT = 40;

const WheelPicker: React.FC<WheelPickerProps> = ({ 
  value, 
  onChange, 
  options, 
  label,
  format = (v) => v 
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const currentIndex = options.indexOf(value);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    const startY = e.clientY;
    const startScrollTop = containerRef.current?.scrollTop || 0;
    
    const handleMouseMove = (moveEvent: MouseEvent) => {
      const deltaY = startY - moveEvent.clientY;
      const newScroll = startScrollTop + deltaY;
      const maxScroll = options.length * ITEM_HEIGHT;
      const clampedScroll = Math.max(-ITEM_HEIGHT, Math.min(maxScroll, newScroll));
      
      if (containerRef.current) {
        containerRef.current.scrollTop = clampedScroll;
      }
    };
    
    const handleMouseUp = () => {
      if (containerRef.current) {
        const snappedIndex = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT);
        const clampedIndex = Math.max(0, Math.min(options.length - 1, snappedIndex));
        containerRef.current.scrollTo({
          top: clampedIndex * ITEM_HEIGHT,
          behavior: 'smooth'
        });
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

  React.useEffect(() => {
    if (containerRef.current && currentIndex >= 0) {
      containerRef.current.scrollTop = currentIndex * ITEM_HEIGHT;
    }
  }, [currentIndex]);

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="text-xs text-[#B19CD9] mb-1">{label}</span>
      )}
      <div 
        ref={containerRef}
        className="h-[120px] w-16 overflow-hidden relative rounded-lg bg-black/20 border border-[#B19CD9]/30 cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onClick={handleClick}
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        <style>{`
          .scrollbar-hide::-webkit-scrollbar { display: none; }
        `}</style>
        
        <div className="absolute inset-x-0 top-0 h-[60px] pointer-events-none z-10 bg-gradient-to-b from-[#0d0a15] via-transparent to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[60px] pointer-events-none z-10 bg-gradient-to-t from-[#0d0a15] via-transparent to-transparent" />
        <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-10 pointer-events-none z-10 border-y border-[#B19CD9]/50" />
        
        <div className="py-[60px]">
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
    </div>
  );
};

export default WheelPicker;
