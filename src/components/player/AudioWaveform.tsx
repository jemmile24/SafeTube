import React, { useMemo } from 'react';

interface AudioWaveformProps {
  isPlaying: boolean;
  barCount?: number;
}

export const AudioWaveform: React.FC<AudioWaveformProps> = ({
  isPlaying,
  barCount = 32,
}) => {
  // Precompute wave frequencies and natural heights
  const bars = useMemo(() => {
    return Array.from({ length: barCount }).map((_, index) => {
      // Create a smooth bell curve wave contour
      const normalized = index / (barCount - 1);
      const bell = Math.sin(normalized * Math.PI);
      const randomJitter = 0.7 + (Math.sin(index * 2.3) * 0.3);
      const maxHeight = Math.max(25, Math.min(100, Math.round(bell * randomJitter * 100)));
      const duration = 0.75 + (Math.abs(Math.sin(index * 1.7)) * 0.6);
      const delay = (index * 0.045) % 0.8;

      return {
        maxHeight,
        duration: `${duration.toFixed(2)}s`,
        delay: `${delay.toFixed(2)}s`,
      };
    });
  }, [barCount]);

  return (
    <div className="w-full max-w-md h-24 sm:h-28 flex items-center justify-center gap-1 sm:gap-1.5 px-4 my-3 select-none">
      {bars.map((bar, i) => (
        <div
          key={i}
          className="flex-1 max-w-[8px] h-full flex items-center justify-center"
        >
          <div
            className={`w-full rounded-full transition-all duration-300 ${
              isPlaying
                ? 'bg-gradient-to-t from-safetube-red via-rose-500 to-amber-400 shadow-sm shadow-red-500/30'
                : 'bg-gray-600/40'
            }`}
            style={{
              height: isPlaying ? undefined : '12%',
              animation: isPlaying
                ? `waveAnimation ${bar.duration} ease-in-out infinite alternate`
                : 'none',
              animationDelay: bar.delay,
              transformOrigin: 'bottom',
            }}
          />
        </div>
      ))}
    </div>
  );
};
