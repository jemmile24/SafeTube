import React from 'react';
import { X, ShieldCheck, CheckCircle2, Lock, EyeOff, Radio } from 'lucide-react';

interface PolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PolicyModal: React.FC<PolicyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-safetube-card border border-safetube-border rounded-3xl p-6 sm:p-8 shadow-2xl overflow-y-auto max-h-[90vh]">
        <button
          onClick={onClose}
          className="absolute top-6 right-6 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">SafeTube Content Control Policy</h2>
            <p className="text-xs text-emerald-400 font-medium">100% Curated & Strictly Enforced</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <p>
            SafeTube is built specifically for users, families, classrooms, and organizations that demand
            complete control over their video viewing environment without distracting rabbit holes or inappropriate algorithmic suggestions.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Lock className="w-4 h-4 text-safetube-red" />
                <span>Single Source of Truth</span>
              </div>
              <p className="text-xs text-gray-400">
                Only video links explicitly added to the administrator's Google Sheet can ever appear in the library.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <EyeOff className="w-4 h-4 text-emerald-400" />
                <span>Zero Recommendations</span>
              </div>
              <p className="text-xs text-gray-400">
                No trending feeds, suggested videos, related video sidebars, or automated watch-next queues.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <Radio className="w-4 h-4 text-blue-400" />
                <span>Local Bounded Search</span>
              </div>
              <p className="text-xs text-gray-400">
                Search matches strictly against approved videos in the sheet. Global YouTube search is blocked.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-2">
              <div className="flex items-center gap-2 text-white font-semibold">
                <CheckCircle2 className="w-4 h-4 text-amber-400" />
                <span>Clean Playback End</span>
              </div>
              <p className="text-xs text-gray-400">
                When a video concludes, SafeTube stops immediately and displays an approved completion screen.
              </p>
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-200 mt-4">
            <h4 className="font-bold text-white mb-1">Developer & Admin Note:</h4>
            To add new videos, simply open your Google Sheet and paste YouTube links into Column A. SafeTube automatically parses the video IDs and pulls title and thumbnail data.
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-safetube-red hover:bg-safetube-crimson text-white text-sm font-semibold transition-all shadow-md"
          >
            I Understand
          </button>
        </div>
      </div>
    </div>
  );
};
