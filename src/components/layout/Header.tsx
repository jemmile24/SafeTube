import React, { useRef, useEffect, useState } from 'react';
import {
  Search,
  X,
  Moon,
  Sun,
  Download,
  ArrowLeft
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  canInstallPwa: boolean;
  onInstallPwa: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  theme,
  onToggleTheme,
  canInstallPwa,
  onInstallPwa,
}) => {
  const searchInputRef = useRef<HTMLInputElement>(null);
  const mobileInputRef = useRef<HTMLInputElement>(null);
  const [isMobileSearchOpen, setIsMobileSearchOpen] = useState(false);

  // Global keyboard shortcut '/' to focus search field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === '/' && document.activeElement !== searchInputRef.current) {
        e.preventDefault();
        if (window.innerWidth < 640) {
          setIsMobileSearchOpen(true);
          setTimeout(() => mobileInputRef.current?.focus(), 50);
        } else {
          searchInputRef.current?.focus();
        }
      } else if (e.key === 'Escape') {
        searchInputRef.current?.blur();
        mobileInputRef.current?.blur();
        setIsMobileSearchOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const openMobileSearch = () => {
    setIsMobileSearchOpen(true);
    setTimeout(() => mobileInputRef.current?.focus(), 50);
  };

  const closeMobileSearch = () => {
    setIsMobileSearchOpen(false);
  };

  return (
    <header className="sticky top-0 z-40 w-full bg-safetube-darker/95 backdrop-blur-md border-b border-safetube-border px-3 sm:px-6 py-2.5 transition-colors">
      <div className="flex items-center justify-between gap-2 max-w-7xl mx-auto min-h-[38px]">
        {/* Mobile Full-Width Search Overlay */}
        {isMobileSearchOpen ? (
          <div className="flex items-center gap-2 w-full animate-fade-in sm:hidden">
            <button
              onClick={closeMobileSearch}
              className="p-2 -ml-1 rounded-full text-gray-300 hover:text-white hover:bg-white/10"
              title="Close search"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>

            <div className="relative flex-1 flex items-center">
              <input
                ref={mobileInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange(e.target.value)}
                placeholder="Search videos..."
                className="w-full pl-3 pr-9 py-2 bg-safetube-card border border-safetube-border focus:border-safetube-red rounded-full text-sm text-gray-100 placeholder-gray-500 focus:outline-none"
              />
              {searchQuery && (
                <button
                  onClick={onClearSearch}
                  className="absolute right-2.5 p-1 rounded-full text-gray-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
          </div>
        ) : (
          <>
            {/* Left: Brand */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <div
                onClick={onClearSearch}
                className="flex items-center gap-2 cursor-pointer select-none group"
              >
                <div className="relative w-8 h-8 rounded-xl bg-gradient-to-tr from-safetube-red to-rose-600 flex items-center justify-center shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
                  <div className="w-0 h-0 border-y-[5px] border-y-transparent border-l-[9px] border-l-white ml-0.5" />
                </div>

                <span className="text-lg sm:text-xl font-black tracking-tight text-white flex items-center leading-none">
                  Safe<span className="text-safetube-red">Tube</span>
                </span>
              </div>
            </div>

            {/* Center: Desktop / Tablet Search Bar */}
            <div className="hidden sm:flex flex-1 max-w-xl mx-4 sm:mx-8">
              <div className="relative flex items-center w-full">
                <div className="absolute left-3.5 text-gray-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>

                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search videos... (Press '/' to focus)"
                  className="w-full pl-10 pr-12 py-2 bg-safetube-card hover:bg-safetube-cardHover focus:bg-safetube-card border border-safetube-border focus:border-safetube-red rounded-full text-sm text-gray-100 placeholder-gray-500 focus:outline-none transition-all shadow-inner"
                />

                <div className="absolute right-3 flex items-center gap-1.5">
                  {searchQuery ? (
                    <button
                      onClick={onClearSearch}
                      className="p-1 rounded-full text-gray-400 hover:text-white hover:bg-white/10 transition-colors"
                      title="Clear search"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <kbd className="hidden sm:inline-block px-1.5 py-0.5 text-[10px] font-mono text-gray-400 bg-white/5 border border-white/10 rounded">
                      /
                    </kbd>
                  )}
                </div>
              </div>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
              {/* Mobile Search Button */}
              <button
                onClick={openMobileSearch}
                className="sm:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Search"
              >
                <Search className="w-5 h-5" />
              </button>

              {/* PWA Install Button */}
              {canInstallPwa && (
                <button
                  onClick={onInstallPwa}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-safetube-red hover:bg-safetube-crimson text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all hover:scale-105"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
              )}

              {/* Theme toggle (Pure OLED Dark / Pure Crisp Light) */}
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-5 h-5 text-amber-400" /> : <Moon className="w-5 h-5 text-gray-700" />}
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
