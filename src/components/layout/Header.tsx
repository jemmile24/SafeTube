import React, { useRef, useEffect, useState } from 'react';
import {
  Search,
  X,
  Menu,
  Moon,
  Sun,
  ShieldCheck,
  Settings,
  Download,
  RotateCw,
  ArrowLeft
} from 'lucide-react';

interface HeaderProps {
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onClearSearch: () => void;
  theme: 'dark' | 'light';
  onToggleTheme: () => void;
  onToggleSidebar: () => void;
  onOpenSettings: () => void;
  onOpenPolicy: () => void;
  canInstallPwa: boolean;
  onInstallPwa: () => void;
  isSyncing: boolean;
  onRefreshCatalog: () => void;
  approvedCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  searchQuery,
  onSearchChange,
  onClearSearch,
  theme,
  onToggleTheme,
  onToggleSidebar,
  onOpenSettings,
  onOpenPolicy,
  canInstallPwa,
  onInstallPwa,
  isSyncing,
  onRefreshCatalog,
  approvedCount,
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
    <header className="sticky top-0 z-40 w-full bg-safetube-dark/95 backdrop-blur-md border-b border-safetube-border px-3 sm:px-6 py-2.5 transition-colors">
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
                placeholder="Search approved videos..."
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
            {/* Left: Brand & Sidebar Toggle */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0">
              <button
                onClick={onToggleSidebar}
                className="hidden md:flex p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Toggle Menu"
              >
                <Menu className="w-5 h-5" />
              </button>

              {/* SafeTube Logo */}
              <div
                onClick={onClearSearch}
                className="flex items-center gap-2 cursor-pointer select-none group"
              >
                <div className="relative w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-gradient-to-tr from-safetube-red to-rose-600 flex items-center justify-center shadow-md shadow-red-600/30 group-hover:scale-105 transition-transform">
                  <div className="w-0 h-0 border-y-[4px] sm:border-y-[5px] border-y-transparent border-l-[8px] sm:border-l-[9px] border-l-white ml-0.5" />
                  <div className="absolute -top-1 -right-1 w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-emerald-500 border-2 border-safetube-dark flex items-center justify-center">
                    <ShieldCheck className="w-1.5 h-1.5 sm:w-2 sm:h-2 text-white" />
                  </div>
                </div>

                <div className="flex flex-col">
                  <span className="text-base sm:text-lg font-black tracking-tight text-white flex items-center leading-none">
                    Safe<span className="text-safetube-red">Tube</span>
                  </span>
                  <span className="text-[8px] sm:text-[9px] font-bold tracking-wider text-emerald-400 uppercase leading-none mt-0.5">
                    {approvedCount} Approved
                  </span>
                </div>
              </div>
            </div>

            {/* Center: Desktop / Tablet Search Bar (Hidden on small mobile) */}
            <div className="hidden sm:flex flex-1 max-w-xl mx-3 sm:mx-6">
              <div className="relative flex items-center w-full">
                <div className="absolute left-3 text-gray-400 pointer-events-none">
                  <Search className="w-4 h-4" />
                </div>

                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => onSearchChange(e.target.value)}
                  placeholder="Search approved videos... (Press '/' to focus)"
                  className="w-full pl-9 pr-14 py-2 bg-safetube-card hover:bg-safetube-cardHover focus:bg-safetube-card border border-safetube-border focus:border-safetube-red rounded-full text-sm text-gray-100 placeholder-gray-500 focus:outline-none transition-all shadow-inner"
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
            <div className="flex items-center gap-1 sm:gap-2 shrink-0">
              {/* Mobile Search Button */}
              <button
                onClick={openMobileSearch}
                className="sm:hidden p-2 rounded-xl text-gray-300 hover:text-white hover:bg-white/10 transition-colors"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>

              {/* Refresh Sheet Sync Button */}
              <button
                onClick={onRefreshCatalog}
                disabled={isSyncing}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors disabled:opacity-50"
                title="Refresh approved sheet catalog"
              >
                <RotateCw className={`w-4 h-4 ${isSyncing ? 'animate-spin text-safetube-red' : ''}`} />
              </button>

              {/* PWA Install Button (Desktop & Tablet) */}
              {canInstallPwa && (
                <button
                  onClick={onInstallPwa}
                  className="hidden md:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-safetube-red hover:bg-safetube-crimson text-white text-xs font-semibold shadow-md shadow-red-600/20 transition-all hover:scale-105"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Install App</span>
                </button>
              )}

              {/* Theme toggle */}
              <button
                onClick={onToggleTheme}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} mode`}
              >
                {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              </button>

              {/* Policy Info (Desktop) */}
              <button
                onClick={onOpenPolicy}
                className="hidden sm:flex p-2 rounded-xl text-emerald-400 hover:bg-emerald-500/10 transition-colors"
                title="SafeTube Content Policy & Safety Guarantee"
              >
                <ShieldCheck className="w-4 h-4" />
              </button>

              {/* Developer Sheet Configuration Cog */}
              <button
                onClick={onOpenSettings}
                className="p-2 rounded-xl text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                title="Configure Google Sheet & API Keys"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>
          </>
        )}
      </div>
    </header>
  );
};
