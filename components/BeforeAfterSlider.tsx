
import React, { useState, useRef, useEffect, useCallback } from 'react';

interface BeforeAfterSliderProps {
  originalImageSrc: string;
  enhancedImageSrc: string;
  imageWidth: number;
  imageHeight: number;
}

const BeforeAfterSlider: React.FC<BeforeAfterSliderProps> = ({
  originalImageSrc,
  enhancedImageSrc,
  imageWidth,
  imageHeight,
}) => {
  const [sliderPosition, setSliderPosition] = useState(50); // 0-100 percentage
  const containerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);

  // Calculate scaled width and height to fit the display container
  const maxDisplayWidth = 800; // Max width for comparison area
  const maxDisplayHeight = 600; // Max height for comparison area

  const aspectRatio = imageWidth / imageHeight;
  let displayWidth = imageWidth;
  let displayHeight = imageHeight;

  if (displayWidth > maxDisplayWidth) {
    displayWidth = maxDisplayWidth;
    displayHeight = displayWidth / aspectRatio;
  }
  if (displayHeight > maxDisplayHeight) {
    displayHeight = maxDisplayHeight;
    displayWidth = displayHeight * aspectRatio;
  }

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    isDragging.current = true;
  }, []);

  const handleMouseUp = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const { left, width } = containerRef.current.getBoundingClientRect();
    const clientX = e.clientX;
    const newPosition = ((clientX - left) / width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, newPosition)));
  }, []);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    isDragging.current = true;
  }, []);

  const handleTouchEnd = useCallback(() => {
    isDragging.current = false;
  }, []);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isDragging.current || !containerRef.current) return;

    const { left, width } = containerRef.current.getBoundingClientRect();
    const clientX = e.touches[0].clientX;
    const newPosition = ((clientX - left) / width) * 100;
    setSliderPosition(Math.max(0, Math.min(100, newPosition)));
  }, []);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDragging.current = false;
    };
    window.addEventListener('mouseup', handleGlobalMouseUp);
    window.addEventListener('touchend', handleGlobalMouseUp);

    return () => {
      window.removeEventListener('mouseup', handleGlobalMouseUp);
      window.removeEventListener('touchend', handleGlobalMouseUp);
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden cursor-ew-resize select-none bg-gray-700 rounded-lg shadow-inner"
      style={{ width: `${displayWidth}px`, height: `${displayHeight}px` }}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseUp}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Original Image */}
      <img
        src={originalImageSrc}
        alt="Before"
        className="absolute inset-0 w-full h-full object-contain"
        draggable="false"
        style={{ pointerEvents: 'none' }}
      />

      {/* Enhanced Image (clipped by slider) */}
      <img
        src={enhancedImageSrc}
        alt="After"
        className="absolute inset-0 w-full h-full object-contain"
        draggable="false"
        style={{
          clipPath: `inset(0 ${100 - sliderPosition}% 0 0)`,
          pointerEvents: 'none',
        }}
      />

      {/* Slider Handle */}
      <div
        className="absolute top-0 bottom-0 w-1 bg-gray-300 flex items-center justify-center shadow-lg cursor-ew-resize z-10"
        style={{ left: `${sliderPosition}%`, transform: 'translateX(-50%)' }}
        onMouseDown={handleMouseDown}
        onTouchStart={handleTouchStart}
      >
        <div className="absolute w-8 h-8 rounded-full bg-gray-200 border-2 border-blue-500 flex items-center justify-center -ml-4">
          <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7h8m-4 5h4m-4 4h4M4 8l4-4v16l-4-4zm16-4l-4 4v16l4-4z"></path></svg>
        </div>
      </div>
    </div>
  );
};

export default BeforeAfterSlider;