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
  setStoredTheme,
  getCustomConfig,
  CustomConfig
} from './services/storageService';
import { setupPwaInstallPrompt, promptPwaInstall } from './services/pwaService';

// Layout & UI components
import { Header } from './components/layout/Header';
import { Sidebar } from './components/layout/Sidebar';
import { MobileNav } from './components/layout/MobileNav';
import { VideoGrid } from './components/catalog/VideoGrid';
import { SafePlayer } from './components/player/SafePlayer';
import { AudioModeView } from './components/player/AudioModeView';

// Modals
import { PolicyModal } from './components/modals/PolicyModal';
import { PlatformLimitationsModal } from './components/modals/PlatformLimitationsModal';
import { DeveloperConfigModal } from './components/modals/DeveloperConfigModal';

export const App: React.FC = () => {
  // Theme state
  const [theme, setTheme] = useState<'dark' | 'light'>(() => getStoredTheme());

  // Navigation and view state
  const [viewMode, setViewMode] = useState<ViewMode>('catalog');
  const [selectedVideo, setSelectedVideo] = useState<VideoItem | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<CatalogFilter>('all');

  // Bookmarks and watch history state
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(() => getBookmarks());
  const [historyIds, setHistoryIds] = useState<string[]>(() => getWatchHistory());

  // Modals state
  const [isPolicyModalOpen, setIsPolicyModalOpen] = useState(false);
  const [isLimitationsModalOpen, setIsLimitationsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);

  // PWA install state
  const [canInstallPwa, setCanInstallPwa] = useState(false);

  // Catalog state
  const [catalog, setCatalog] = useState<VideoItem[]>([]);
  const [isLoadingCatalog, setIsLoadingCatalog] = useState(true);
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncStats, setSyncStats] = useState({
    totalVideos: 0,
    duplicateCount: 0,
    rejectedCount: 0,
    source: 'initial',
    lastSynced: new Date(),
  });

  // Developer configuration (allows custom sheet testing)
  const [config, setConfig] = useState<CustomConfig>(() => {
    const saved = getCustomConfig();
    return (
      saved || {
        sheetId: APP_CONFIG.GOOGLE_SHEETS_ID,
        range: APP_CONFIG.GOOGLE_SHEETS_RANGE,
        apiKey: APP_CONFIG.GOOGLE_SHEETS_API_KEY,
        youtubeApiKey: APP_CONFIG.YOUTUBE_API_KEY,
      }
    );
  });

  // Apply dark/light class to root HTML element
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

  // Fetch approved video catalog from Google Sheets
  const syncCatalog = useCallback(
    async (showLoadingSpinner = false) => {
      if (showLoadingSpinner) setIsLoadingCatalog(true);
      setIsSyncing(true);

      try {
        const result = await fetchApprovedCatalog(
          config.sheetId,
          config.range,
          config.apiKey,
          config.youtubeApiKey
        );

        setCatalog(result.videos);
        setSyncStats({
          totalVideos: result.totalApproved,
          duplicateCount: result.duplicateCount,
          rejectedCount: result.rejectedCount,
          source: result.source,
          lastSynced: result.lastSynced,
        });
      } catch (err) {
        console.error('Catalog synchronization failed:', err);
      } finally {
        setIsLoadingCatalog(false);
        setIsSyncing(false);
      }
    },
    [config]
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
    <div className="min-h-screen flex flex-col bg-safetube-dark text-gray-100 transition-colors">
      {/* Top Header */}
      <Header
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        onClearSearch={() => setSearchQuery('')}
        theme={theme}
        onToggleTheme={handleToggleTheme}
        onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        onOpenPolicy={() => setIsPolicyModalOpen(true)}
        canInstallPwa={canInstallPwa}
        onInstallPwa={handleInstallPwa}
        isSyncing={isSyncing}
        onRefreshCatalog={() => syncCatalog(false)}
        approvedCount={catalog.length}
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
          onNavigateBookmarks={() => {
            setViewMode('catalog');
            setActiveFilter('bookmarked');
            setSearchQuery('');
          }}
          onOpenPolicy={() => setIsPolicyModalOpen(true)}
          onOpenLimitations={() => setIsLimitationsModalOpen(true)}
          onOpenSettings={() => setIsSettingsModalOpen(true)}
          approvedCount={catalog.length}
          bookmarkedCount={bookmarkedIds.size}
          catalogSource={syncStats.source}
        />

        {/* Content Viewport */}
        <main className="flex-1 p-4 sm:p-6 pb-20 md:pb-8 min-w-0">
          {viewMode === 'player' && selectedVideo ? (
            <SafePlayer
              video={selectedVideo}
              onBackToCatalog={handleBackToCatalog}
              onSwitchToAudioMode={() => setViewMode('audio-mode')}
              isBookmarked={bookmarkedIds.has(selectedVideo.id)}
              onToggleBookmark={() => handleToggleBookmark(selectedVideo.id)}
            />
          ) : viewMode === 'audio-mode' && selectedVideo ? (
            <AudioModeView
              video={selectedVideo}
              onBackToCatalog={handleBackToCatalog}
              onSwitchToVideoMode={() => setViewMode('player')}
              isBookmarked={bookmarkedIds.has(selectedVideo.id)}
              onToggleBookmark={() => handleToggleBookmark(selectedVideo.id)}
            />
          ) : (
            <VideoGrid
              videos={filteredVideos}
              isLoading={isLoadingCatalog}
              searchQuery={searchQuery}
              activeFilter={activeFilter}
              onSelectFilter={setActiveFilter}
              onClearSearch={() => setSearchQuery('')}
              onSelectVideo={handleSelectVideo}
              onSelectAudioMode={handleSelectAudioMode}
              bookmarkedIds={bookmarkedIds}
              onToggleBookmark={handleToggleBookmark}
              onRefreshSheet={() => syncCatalog(false)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileNav
        activeView={viewMode}
        onNavigateHome={() => {
          setViewMode('catalog');
          setActiveFilter('all');
          setSearchQuery('');
        }}
        onNavigateBookmarks={() => {
          setViewMode('catalog');
          setActiveFilter('bookmarked');
          setSearchQuery('');
        }}
        onOpenPolicy={() => setIsPolicyModalOpen(true)}
        onOpenSettings={() => setIsSettingsModalOpen(true)}
        bookmarkedCount={bookmarkedIds.size}
      />

      {/* Modals */}
      <PolicyModal
        isOpen={isPolicyModalOpen}
        onClose={() => setIsPolicyModalOpen(false)}
      />

      <PlatformLimitationsModal
        isOpen={isLimitationsModalOpen}
        onClose={() => setIsLimitationsModalOpen(false)}
      />

      <DeveloperConfigModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        currentConfig={config}
        onApplyConfig={(newConf) => {
          setConfig(newConf);
          syncCatalog(true);
        }}
        onResetToDefault={() => {
          setConfig({
            sheetId: APP_CONFIG.GOOGLE_SHEETS_ID,
            range: APP_CONFIG.GOOGLE_SHEETS_RANGE,
            apiKey: '',
            youtubeApiKey: '',
          });
          syncCatalog(true);
        }}
        stats={syncStats}
      />
    </div>
  );
};

export default App;
