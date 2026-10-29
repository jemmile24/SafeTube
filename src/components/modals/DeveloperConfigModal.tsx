import React, { useState } from 'react';
import { X, Settings, RotateCcw } from 'lucide-react';
import { APP_CONFIG } from '../../config/app.config';
import { CustomConfig, saveCustomConfig, clearCustomConfig } from '../../services/storageService';

interface DeveloperConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentConfig: CustomConfig;
  onApplyConfig: (config: CustomConfig) => void;
  onResetToDefault: () => void;
  stats: {
    totalVideos: number;
    duplicateCount: number;
    rejectedCount: number;
    source: string;
    lastSynced: Date;
  };
}

export const DeveloperConfigModal: React.FC<DeveloperConfigModalProps> = ({
  isOpen,
  onClose,
  currentConfig,
  onApplyConfig,
  onResetToDefault,
  stats,
}) => {
  const [sheetId, setSheetId] = useState(currentConfig.sheetId);
  const [range, setRange] = useState(currentConfig.range || 'A2:C');
  const [apiKey, setApiKey] = useState(currentConfig.apiKey || '');
  const [youtubeApiKey, setYoutubeApiKey] = useState(currentConfig.youtubeApiKey || '');
  const [savedSuccess, setSavedSuccess] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const newConfig: CustomConfig = {
      sheetId: sheetId.trim(),
      range: range.trim() || 'A2:C',
      apiKey: apiKey.trim(),
      youtubeApiKey: youtubeApiKey.trim(),
    };
    saveCustomConfig(newConfig);
    onApplyConfig(newConfig);
    setSavedSuccess(true);
    setTimeout(() => {
      setSavedSuccess(false);
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    clearCustomConfig();
    setSheetId(APP_CONFIG.GOOGLE_SHEETS_ID);
    setRange(APP_CONFIG.GOOGLE_SHEETS_RANGE);
    setApiKey('');
    setYoutubeApiKey('');
    onResetToDefault();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-xl bg-safetube-card border border-safetube-border rounded-2xl sm:rounded-3xl p-4 sm:p-8 shadow-2xl overflow-y-auto max-h-[88vh]">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 sm:top-6 sm:right-6 p-2 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-3 mb-5 pr-8">
          <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-2xl bg-purple-500/10 border border-purple-500/20 text-purple-400 flex items-center justify-center shrink-0">
            <Settings className="w-5 h-5 sm:w-6 sm:h-6" />
          </div>
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-white">Developer Configuration</h2>
            <p className="text-xs text-purple-400 font-medium">Google Sheets & API Integration</p>
          </div>
        </div>

        {/* Current Sync Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-2.5 sm:p-3 mb-4 sm:mb-6 rounded-xl sm:rounded-2xl bg-white/5 border border-white/10 text-center">
          <div>
            <span className="block text-[10px] sm:text-[11px] text-gray-400">Approved</span>
            <span className="text-sm font-bold text-emerald-400">{stats.totalVideos}</span>
          </div>
          <div>
            <span className="block text-[10px] sm:text-[11px] text-gray-400">Duplicates</span>
            <span className="text-sm font-bold text-amber-400">{stats.duplicateCount}</span>
          </div>
          <div>
            <span className="block text-[10px] sm:text-[11px] text-gray-400">Rejected</span>
            <span className="text-sm font-bold text-rose-400">{stats.rejectedCount}</span>
          </div>
          <div>
            <span className="block text-[10px] sm:text-[11px] text-gray-400">Source</span>
            <span className="text-xs font-semibold text-gray-300 truncate block">
              {stats.source === 'seed_fallback' ? 'Demo Seed' : 'Live Sheet'}
            </span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3.5">
          {/* Sheet ID */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Google Sheet ID
            </label>
            <input
              type="text"
              value={sheetId}
              onChange={(e) => setSheetId(e.target.value)}
              placeholder="e.g. 1VN2RStsFIAJbuKg3ixsTjo8gO5QLqE2TrIkPCG3ofAQ"
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-black/40 border border-safetube-border focus:border-safetube-red text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none"
            />
            <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1">
              Share sheet with <em>"Anyone with the link can view"</em>.
            </p>
          </div>

          {/* Range */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Range / Columns
            </label>
            <input
              type="text"
              value={range}
              onChange={(e) => setRange(e.target.value)}
              placeholder="A2:C or Videos!A2:A"
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-black/40 border border-safetube-border focus:border-safetube-red text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none"
            />
          </div>

          {/* Optional YouTube Data API v3 Key */}
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              Optional YouTube Data API v3 Key
            </label>
            <input
              type="password"
              value={youtubeApiKey}
              onChange={(e) => setYoutubeApiKey(e.target.value)}
              placeholder="Leave blank for automatic oEmbed fallback"
              className="w-full px-3 py-2 sm:px-3.5 sm:py-2.5 rounded-xl bg-black/40 border border-safetube-border focus:border-safetube-red text-xs sm:text-sm text-white placeholder-gray-500 focus:outline-none"
            />
            <p className="text-[10px] sm:text-[11px] text-gray-400 mt-1">
              If left blank, SafeTube automatically uses official no-key oEmbed metadata.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex items-center justify-between pt-3 border-t border-safetube-border">
            <button
              type="button"
              onClick={handleReset}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 text-xs font-medium transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Defaults</span>
            </button>

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-3.5 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 text-xs font-medium transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-1.5 rounded-xl bg-safetube-red hover:bg-safetube-crimson text-white text-xs font-semibold shadow-md transition-all"
              >
                {savedSuccess ? 'Saved!' : 'Save & Sync'}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
