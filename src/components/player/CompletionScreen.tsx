import React from 'react';
import { RotateCcw, ArrowLeft, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { VideoItem } from '../../types/video';

interface CompletionScreenProps {
  video: VideoItem;
  onReplay: () => void;
  onBackToCatalog: () => void;
}

export const CompletionScreen: React.FC<CompletionScreenProps> = ({
  video,
  onReplay,
  onBackToCatalog,
}) => {
  return (
    <div className="absolute inset-0 bg-black/95 backdrop-blur-md z-30 flex flex-col items-center justify-center p-6 text-center animate-fade-in">
      <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center mb-4 shadow-lg shadow-emerald-500/5">
        <CheckCircle2 className="w-8 h-8" />
      </div>

      <h2 className="text-2xl font-bold text-white mb-2">
        Playback Finished
      </h2>
      <p className="text-gray-300 text-sm max-w-md mb-1 font-medium">
        {video.title}
      </p>
      <p className="text-gray-400 text-xs mb-6">
        {video.channelTitle}
      </p>

      {/* Strict Safety Notice */}
      <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-xs text-gray-300 max-w-lg mb-8">
        <ShieldCheck className="w-4 h-4 text-emerald-400 shrink-0" />
        <span>
          <strong>SafeTube Strict Control:</strong> Autoplay and external recommended videos are strictly disabled to protect your browsing environment.
        </span>
      </div>

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center justify-center gap-4">
        <button
          onClick={onReplay}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-safetube-red hover:bg-safetube-crimson text-white font-medium shadow-lg shadow-red-600/30 transition-all hover:scale-105 active:scale-95"
        >
          <RotateCcw className="w-4 h-4" />
          Replay Video
        </button>

        <button
          onClick={onBackToCatalog}
          className="flex items-center gap-2 px-6 py-3 rounded-full bg-white/10 hover:bg-white/20 text-white font-medium border border-white/10 transition-all hover:scale-105 active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Approved Library
        </button>
      </div>
    </div>
  );
};
