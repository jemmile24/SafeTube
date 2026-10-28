import React from 'react';
import { X, Info, Smartphone, Monitor, ShieldAlert } from 'lucide-react';

interface PlatformLimitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PlatformLimitationsModal: React.FC<PlatformLimitationsModalProps> = ({
  isOpen,
  onClose,
}) => {
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
          <div className="w-12 h-12 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-400 flex items-center justify-center">
            <Info className="w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white">Audio & Playback Disclosures</h2>
            <p className="text-xs text-blue-400 font-medium">Platform Standards & OS Limitations</p>
          </div>
        </div>

        <div className="space-y-4 text-sm text-gray-300 leading-relaxed">
          <p>
            SafeTube operates strictly within Google and YouTube Platform Terms of Service, utilizing the official
            <strong> YouTube IFrame Player API</strong> and modern <strong>W3C Media Session API</strong>.
          </p>

          <div className="space-y-3">
            {/* Desktop Browsers */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-white font-semibold mb-1">
                <Monitor className="w-4 h-4 text-emerald-400" />
                <span>Desktop Browsers (Chrome, Edge, Firefox, Safari)</span>
              </div>
              <p className="text-xs text-gray-400">
                Playback seamlessly continues in the background when switching tabs or minimizing the browser window. Media keys and lock screen controls are fully supported via the Media Session API.
              </p>
            </div>

            {/* Android Chrome & Android PWA */}
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
              <div className="flex items-center gap-2 text-white font-semibold mb-1">
                <Smartphone className="w-4 h-4 text-amber-400" />
                <span>Android Chrome & Installed SafeTube PWA</span>
              </div>
              <p className="text-xs text-gray-400">
                Audio continues while switching between apps or navigating other tabs in Android Chrome. Media controls appear in the Android notification shade and Quick Settings tile.
              </p>
            </div>

            {/* Screen-Off Policy Notice */}
            <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20">
              <div className="flex items-center gap-2 text-amber-300 font-semibold mb-1">
                <ShieldAlert className="w-4 h-4 text-amber-400" />
                <span>Screen-Off / Device Lock Policy Notice</span>
              </div>
              <p className="text-xs text-amber-200/90 leading-relaxed">
                When the Android device screen is completely turned off or locked, Android battery-saver policies and YouTube player constraints automatically pause video stream rendering. SafeTube does <strong>not</strong> employ unauthorized stream extraction or circumvent platform DRM. If guaranteed screen-off playback is required, a native Android media player architecture with authorized non-YouTube direct audio feeds or YouTube Music Premium must be utilized.
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-safetube-red hover:bg-safetube-crimson text-white text-sm font-semibold transition-all shadow-md"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
