import React, { useState, useEffect, useRef, useCallback } from 'react';

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
  format = (v) => v,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);

  const [currentIndex, setCurrentIndex] = useState(() =>
    Math.max(0, options.indexOf(value))
  );

  // Detect touch device
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsTouchDevice(
        'ontouchstart' in window || navigator.maxTouchPoints > 0
      );
    }
  }, []);

  // Sync external value
  useEffect(() => {
    const idx = options.indexOf(value);

    if (idx >= 0 && idx !== currentIndex) {
      setCurrentIndex(idx);

      if (!isTouchDevice && containerRef.current) {
        containerRef.current.style.transform = `translateY(${
          VISIBLE_HEIGHT / 2 - idx * ITEM_HEIGHT - ITEM_HEIGHT / 2
        }px)`;
      } else if (isTouchDevice && containerRef.current) {
        containerRef.current.scrollTo({
          top: idx * ITEM_HEIGHT,
          behavior: 'smooth',
        });
      }
    }
  }, [value, options, isTouchDevice]);

  // ---------------- Desktop (non-touch) ----------------

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

  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
    startY.current = e.clientY;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return;

    const delta = startY.current - e.clientY;

    if (Math.abs(delta) >= ITEM_HEIGHT) {
      const steps = Math.floor(Math.abs(delta) / ITEM_HEIGHT);
      const direction = delta > 0 ? 1 : -1;

      setCurrentIndex((prev) => {
        let next = prev + direction * steps;

        if (next < 0) next = 0;
        if (next >= options.length) next = options.length - 1;

        onChange(options[next]);
        return next;
      });

      startY.current = e.clientY;
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove, { passive: false });
    document.addEventListener('mouseup', handleMouseUp);
    document.addEventListener('dragstart', (e) => e.preventDefault());

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.removeEventListener('dragstart', (e) => e.preventDefault());
    };
  }, []);

  // ---------------- Mobile Scroll ----------------

  const handleScroll = useCallback(() => {
    if (!containerRef.current || !isTouchDevice) return;

    const idx = Math.round(containerRef.current.scrollTop / ITEM_HEIGHT);

    if (idx >= 0 && idx < options.length && idx !== currentIndex) {
      setCurrentIndex(idx);
      onChange(options[idx]);
    }
  }, [currentIndex, options, onChange, isTouchDevice]);

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="text-xs text-[#B19CD9] mb-1">{label}</span>
      )}

      <div
        ref={containerRef}
        draggable={false}
        onDragStart={(e) => e.preventDefault()}
        className={`relative h-[120px] w-16 rounded-lg border border-[#B19CD9]/30 bg-black/20 select-none ${
          !isTouchDevice
            ? 'cursor-grab active:cursor-grabbing overflow-hidden'
            : 'overflow-y-scroll snap-y snap-mandatory'
        }`}
        onWheel={!isTouchDevice ? handleWheel : undefined}
        onMouseDown={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (!isTouchDevice) handleMouseDown(e);
        }}
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
            : { userSelect: 'none' }
        }
      >
        {/* Desktop Items */}
        {!isTouchDevice && (
          <div
            style={{
              transform: `translateY(${
                VISIBLE_HEIGHT / 2 -
                currentIndex * ITEM_HEIGHT -
                ITEM_HEIGHT / 2
              }px)`,
              transition: 'transform 0.15s',
            }}
          >
            {options.map((option, index) => {
              const isMiddle = index === currentIndex;

              return (
                <div
                  key={option}
                  draggable={false}
                  className="flex items-center justify-center text-sm font-medium h-[40px] transition-all duration-150 select-none"
                  style={{
                    color: isMiddle
                      ? 'white'
                      : 'rgba(177,156,217,0.7)',
                    fontWeight: isMiddle ? 600 : 400,
                    transform: `scale(${isMiddle ? 1.1 : 0.9})`,
                    opacity: isMiddle ? 1 : 0.5,
                  }}
                >
                  {format(option)}
                </div>
              );
            })}
          </div>
        )}

        {/* Mobile Items */}
        {isTouchDevice &&
          options.map((option, index) => {
            const isMiddle = index === currentIndex;

            return (
              <div
                key={option}
                draggable={false}
                className="snap-center flex items-center justify-center text-sm font-medium h-[40px] transition-all duration-150 select-none"
                style={{
                  color: isMiddle
                    ? 'white'
                    : 'rgba(177,156,217,0.7)',
                  fontWeight: isMiddle ? 600 : 400,
                  transform: `scale(${isMiddle ? 1.1 : 0.9})`,
                  opacity: isMiddle ? 1 : 0.5,
                }}
              >
                {format(option)}
              </div>
            );
          })}

        {/* Selection Indicator */}
        <div
          className="absolute left-0 right-0 pointer-events-none border-y-2 border-[#B19CD9]/60 select-none"
          style={{
            top: VISIBLE_HEIGHT / 2 - ITEM_HEIGHT / 2,
            height: ITEM_HEIGHT,
          }}
        />

        {/* Gradients */}
        <div className="absolute inset-x-0 top-0 h-[60px] pointer-events-none bg-gradient-to-b from-[#0d0a15] to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-[60px] pointer-events-none bg-gradient-to-t from-[#0d0a15] to-transparent" />
      </div>
    </div>
  );
};

export default WheelPicker;
