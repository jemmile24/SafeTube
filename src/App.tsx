import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { VideoItem, ViewMode, CatalogFilter } from './types/video';
import { APP_CONFIG } from './config/app.config';
import { fetchApprovedCatalog } from './services/googleSheetsService';
import { filterApprovedCatalog } from './services/catalogFilter';
import {
  getBookmarks,
  toggleBookmark,
  getWatchHistory,
  addToWatchHistory,
  getStoredTheme,
  setStoredTheme
} from './services/storageService';
import { setupPwaInstallPrompt, promptPwaInstall } from './services/pwaService';

// Layout & UI components
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { VideoGrid } from './components/catalog/VideoGrid';
import { SafePlayer } from './components/player/SafePlayer';
import { AudioModeView } from './components/player/AudioModeView';

export const App: React.FC = () => {
  // Theme state: dark (pure OLED black) vs light (pure crisp white)
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getStoredTheme());

  // Navigation and view state
  const [viewMode, setViewMode] = useState<ViewMode>('catalog');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [sidebarOpen] = useState(false);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CatalogFilter>('all');

  // Bookmarks and watch history state
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => getBookmarks());
  const [historyIds, setHistoryIds] = useState<string[]>(() => getWatchHistory());

  // PWA install state
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  // Catalog state
  const [catalog, setCatalog] = useState<VideoItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);

  // Apply dark/light class to root HTML element (ডার্ক মুড অন করলে পুরা ডার্ক, অফ করলে পুরা অফ)
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    setStoredTheme(theme);
  }, [theme]);

  // Setup PWA install prompt handler
  useEffect(() => {
    const cleanup = setupPwaInstallPrompt(() => {
      setCanInstallPwa(true);
    });
    return cleanup;
  }, []);

  // Fetch approved video catalog (silently in background)
  const syncCatalog = useCallback(
    async (showLoadingSpinner = false) => {
      if (showLoadingSpinner) setIsLoadingCatalog(true);

      try {
        const result = await fetchApprovedCatalog(
          APP_CONFIG.GOOGLE_SHEETS_ID,
          APP_CONFIG.GOOGLE_SHEETS_RANGE,
          APP_CONFIG.GOOGLE_SHEETS_API_KEY,
          APP_CONFIG.YOUTUBE_API_KEY
        );

        setCatalog(result.videos);
        // Default selected video for audio mode if none selected yet
        if (!selectedVideo && result.videos.length > 0) {
          setSelectedVideo(result.videos[0]);
        }
      } catch (err) {
        console.error('Catalog synchronization failed:', err);
      } finally {
        setIsLoadingCatalog(false);
      }
    },
    [selectedVideo]
  );

  // Initial catalog load on mount
  useEffect(() => {
    syncCatalog(true);
  }, [syncCatalog]);

  // Background auto-refresh timer (without interrupting active playback)
  useEffect(() => {
    const interval = setInterval(() => {
      syncCatalog(false);
    }, APP_CONFIG.REFRESH_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [syncCatalog]);

  // Filter approved catalog strictly
  const filteredVideos = useMemo(() => {
    return filterApprovedCatalog(catalog, {
      searchQuery,
      activeFilter,
      bookmarkedIds,
      historyIds,
    });
  }, [catalog, searchQuery, activeFilter, bookmarkedIds, historyIds]);

  // Video selection handler
  const handleSelectVideo = useCallback((video: VideoItem) => {
    setSelectedVideo(video);
    setViewMode('player');
    addToWatchHistory(video.id);
    setHistoryIds((prev) => [video.id, ...prev.filter((id) => id !== video.id)]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Audio mode selection handler
  const handleSelectAudioMode = useCallback((video: VideoItem) => {
    setSelectedVideo(video);
    setViewMode('audio-mode');
    addToWatchHistory(video.id);
    setHistoryIds((prev) => [video.id, ...prev.filter((id) => id !== video.id)]);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, []);

  // Bookmark toggle
  const handleToggleBookmark = useCallback((videoId: string) => {
    const updated = toggleBookmark(videoId);
    setBookmarkedIds(new Set(updated));
  }, []);

  // Return to catalog
  const handleBackToCatalog = useCallback(() => {
    setViewMode('catalog');
  }, []);

  // Theme toggle
  const handleToggleTheme = useCallback(() => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  }, []);

  // PWA install trigger
  const handleInstallPwa = useCallback(async () => {
    const installed = await promptPwaInstall();
    if (installed) {
      setCanInstallPwa(false);
    }
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-safetube-darker text-gray-100 transition-colors">
      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        canInstallPwa={canInstallPwa}
        onInstallPwa={handleInstallPwa}
      />

      {/* Main Container */}
      <div className="flex-1 flex w-full max-w-7xl mx-auto">
        {/* Desktop Sidebar */}
        <Sidebar
          isOpen={sidebarOpen}
          activeView={viewMode}
          onNavigateHome={() => {
            setViewMode('catalog');
            setActiveFilter('all');
            setSearchQuery('');
          }}
          onNavigateAudio={() => {
            if (selectedVideo || catalog.length > 0) {
              if (!selectedVideo && catalog.length > 0) {
                setSelectedVideo(catalog[0]);
              }
              setViewMode('audio-mode');
            }
          }}
          onNavigateBookmarks={() => {
            setViewMode('catalog');
            setActiveFilter('bookmarked');
            setSearchQuery('');
          }}
          totalCount={catalog.length}
          bookmarkedCount={bookmarkedIds.size}
        />

        {/* Content Viewport */}
        <main className="flex-1 px-3 sm:px-6 py-3 sm:py-6 pb-24 md:pb-8 min-w-0 overflow-x-hidden">
          {viewMode === 'player' && selectedVideo ? (
            <SafePlayer
              video={selectedVideo}
              onBackToCatalog={handleBackToCatalog}
              onSwitchToAudioMode={() => setViewMode('audio-mode')}
              isBookmarked={bookmarkedIds.has(selectedVideo.id)}
              onToggleBookmark={() => handleToggleBookmark(selectedVideo.id)}
            />
          ) : viewMode === 'audio-mode' && (selectedVideo || catalog.length > 0) ? (
            <AudioModeView
              video={selectedVideo || catalog[0]}
              onBackToCatalog={handleBackToCatalog}
              onSwitchToVideoMode={() => setViewMode('player')}
              isBookmarked={selectedVideo ? bookmarkedIds.has(selectedVideo.id) : false}
              onToggleBookmark={() => selectedVideo && handleToggleBookmark(selectedVideo.id)}
            />
          ) : (
            <VideoGrid
              videos={filteredVideos}
              allVideos={catalog}
              isLoading={isLoadingCatalog}
              searchQuery={searchQuery}
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
              onClearSearch={() => setSearchQuery('')}
              onSelectVideo={handleSelectVideo}
              onSelectAudioMode={handleSelectAudioMode}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
            />
          )}
        </main>
      </div>

      {/* Mobile App Bottom Navigation */}
      <MobileNav
        activeView={viewMode}
        onNavigateHome={() => {
          setViewMode('catalog');
          setActiveFilter('all');
          setSearchQuery('');
        }}
        onNavigateAudio={() => {
          if (selectedVideo || catalog.length > 0) {
            if (!selectedVideo && catalog.length > 0) {
              setSelectedVideo(catalog[0]);
            }
            setViewMode('audio-mode');
          }
        }}
        onNavigateBookmarks={() => {
          setViewMode('catalog');
          setActiveFilter('bookmarked');
          setSearchQuery('');
        }}
        bookmarkedCount={bookmarkedIds.size}
      />
    </div>
  );
};

export default App;
