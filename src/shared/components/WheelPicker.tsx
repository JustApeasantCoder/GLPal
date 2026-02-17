import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useTheme } from '../../contexts/ThemeContext';

interface WheelPickerProps {
  value: string;
  onChange: (value: string) => void;
  options: string[];
  label?: string;
  format?: (value: string) => string;
}

const ITEM_HEIGHT = 44;
const VISIBLE_HEIGHT = 132;

const WheelPicker: React.FC<WheelPickerProps> = ({
  value,
  onChange,
  options,
  label,
  format = (v) => v,
}) => {
  const { isDarkMode } = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);

  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, options.indexOf(value))
  );

  const [isTouchDevice, setIsTouchDevice] = useState(false);
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice(
        'ontouchstart' in window || navigator.maxTouchPoints > 0
      );
    }
  }, []);

useEffect(() => {
    const idx = options.indexOf(value);
    if (idx >= 0 && idx !== currentIndex) {
      setCurrentIndex(idx);

      if (isTouchDevice && containerRef.current) {
        containerRef.current.scrollTo({
          top: idx * ITEM_HEIGHT,
          behavior: 'auto',
        });
      }
    }
  }, [value, options, isTouchDevice]);

  const handleWheel = useCallback(
    (e: React.WheelEvent<HTMLDivElement>) => {
      e.preventDefault();
      const direction = e.deltaY > 0 ? 1 : -1;
      setCurrentIndex((prev) => {
        let next = prev + direction;
        if (next < 0) next = 0;
        if (next >= options.length) next = options.length - 1;
        onChange(options[next]);
        return next;
      });
    },
    [options, onChange]
  );

  const isDragging = useRef(false);
  const startY = useRef(0);

  const handlePointerDown = (e: React.PointerEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    isDragging.current = true;
    startY.current = e.clientY;
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current) return;
    e.preventDefault();
    const delta = startY.current - e.clientY;
    if (Math.abs(delta) >= ITEM_HEIGHT) {
      const steps = Math.floor(Math.abs(delta) / ITEM_HEIGHT);
      const direction = delta > 0 ? 1 : -1;
      setCurrentIndex((prev) => {
        let next = prev + direction * steps;
        
        if (next < 0 || next >= options.length) {
          return prev;
        }
        
        onChange(options[next]);
        return next;
      });
      startY.current = e.clientY;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    e.currentTarget.releasePointerCapture(e.pointerId);
  };

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !isTouchDevice) return;
    const idx = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT);
    if (idx >= 0 && idx < options.length && idx !== currentIndex) {
      setCurrentIndex(idx);
      onChange(options[idx]);
    }
  }, [currentIndex, options, onChange, isTouchDevice]);

  const getItemStyle = (index: number) => {
    const distance = Math.abs(index - currentIndex);
    const maxDistance = 2;
    const clampedDistance = Math.min(distance, maxDistance);
    
    const scale = 1 - clampedDistance * 0.15;
    const opacity = 1 - clampedDistance * 0.05;
    const translateZ = -clampedDistance * 10;
    
    const isSelected = index === currentIndex;
    
    const selectedColor = isDarkMode ? '#fff' : '#1a1625';
    const unselectedColor = isDarkMode 
      ? `rgba(177, 156, 217, ${0.35 + (1 - clampedDistance / maxDistance) * 0.45})`
      : `rgba(107, 114, 128, ${0.35 + (1 - clampedDistance / maxDistance) * 0.45})`;
    
    return {
      transform: `scale(${scale}) translateZ(${translateZ}px)`,
      opacity,
      color: isSelected ? selectedColor : unselectedColor,
      fontWeight: isSelected ? 700 : 400,
    };
  };

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className={`text-xs mb-2 font-medium tracking-wider uppercase ${isDarkMode ? 'text-[#B19CD9]' : 'text-gray-500'}`}>{label}</span>
      )}

      <div
        ref={containerRef}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={`relative h-[132px] w-20 rounded-2xl border select-none shadow-lg ${
          isDarkMode
            ? 'border-[#B19CD9]/40 bg-gradient-to-b from-[#1a1625]/80 to-[#0d0a15]/90 shadow-purple-900/20'
            : 'border-gray-300 bg-gradient-to-b from-gray-50 to-white shadow-gray-200/50'
        } ${
          !isTouchDevice
            ? 'cursor-grab active:cursor-grabbing overflow-hidden'
            : 'overflow-y-scroll snap-y snap-mandatory'
        }`}
        onWheel={!isTouchDevice ? handleWheel : undefined}
        onPointerDown={!isTouchDevice ? handlePointerDown : undefined}
        onPointerMove={!isTouchDevice ? handlePointerMove : undefined}
        onPointerUp={!isTouchDevice ? handlePointerUp : undefined}
        onScroll={isTouchDevice ? handleScroll : undefined}
        style={
          isTouchDevice
            ? {
                scrollSnapType: 'y mandatory',
                scrollbarWidth: 'none',
                msOverflowStyle: 'none',
                paddingTop: VISIBLE_HEIGHT / 2 - ITEM_HEIGHT / 2,
                paddingBottom: VISIBLE_HEIGHT / 2 - ITEM_HEIGHT / 2,
              }
            : { 
                userSelect: 'none',
                perspective: '500px',
              }
        }
      >
        {!isTouchDevice && (
<div
            ref={innerRef}
            style={{
              transform: `translateY(${
                VISIBLE_HEIGHT / 2 -
                currentIndex * ITEM_HEIGHT -
                ITEM_HEIGHT / 2
              }px)`,
              transition: 'transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              transformStyle: 'preserve-3d',
            }}
          >
            {options.map((option, index) => (
              <div
                key={option}
                draggable={false}
                className="flex items-center justify-center text-base font-bold h-[44px] transition-all duration-200 select-none"
                style={getItemStyle(index)}
              >
                {format(option)}
              </div>
            ))}
          </div>
        )}

        {isTouchDevice &&
          options.map((option, index) => {
            const distance = Math.abs(index - currentIndex);
            const scale = 1 - Math.min(distance, 2) * 0.15;
            const opacity = 1 - Math.min(distance, 2) * 0.05;
            const isSelected = index === currentIndex;
            
            const selectedColor = isDarkMode ? '#fff' : '#1a1625';
            const unselectedColor = isDarkMode 
              ? `rgba(177, 156, 217, ${0.35 + (1 - Math.min(distance, 2) / 2) * 0.45})`
              : `rgba(107, 114, 128, ${0.35 + (1 - Math.min(distance, 2) / 2) * 0.45})`;
            
            return (
              <div
                key={option}
                draggable={false}
                className="snap-center flex items-center justify-center text-base font-bold h-[44px] transition-all duration-200 select-none"
                style={{
                  transform: `scale(${scale})`,
                  opacity,
                  color: isSelected ? selectedColor : unselectedColor,
                  fontWeight: isSelected ? 700 : 400,
                }}
              >
                {format(option)}
              </div>
            );
          })}

        {/* <div draggable={false} onDragStart={(e) => e.preventDefault()} className="absolute inset-x-0 top-0 h-[36px] pointer-events-none bg-gradient-to-b from-[#0d0a15] via-[#0d0a15]/70 to-transparent select-none" />
        <div draggable={false} onDragStart={(e) => e.preventDefault()} className="absolute inset-x-0 bottom-0 h-[36px] pointer-events-none bg-gradient-to-t from-[#0d0a15] via-[#0d0a15]/70 to-transparent select-none" /> */}
      </div>
    </div>
  );
};

export default WheelPicker;
