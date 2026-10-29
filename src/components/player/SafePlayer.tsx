import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Maximize,
  Headphones,
  ArrowLeft,
  AlertTriangle,
  RotateCcw,
  CheckCircle2,
  Bookmark,
  Share2
} from 'lucide-react';
import { VideoItem } from '../../types/video';
import { YTPlayerState, PlayerStats } from '../../types/player';
import { formatSeconds } from '../../utils/duration';
import { updateMediaSession, updateMediaSessionPositionState, clearMediaSession } from '../../services/mediaSessionService';
import { backgroundAudio } from '../../services/backgroundAudioService';
import { CompletionScreen } from './CompletionScreen';

interface SafePlayerProps {
  video: VideoItem;
  onBackToCatalog: () => void;
  onSwitchToAudioMode: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export const SafePlayer: React.FC<SafePlayerProps> = ({
  video,
  onBackToCatalog,
  onSwitchToAudioMode,
  isBookmarked,
  onToggleBookmark,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<any>(null);
  const playerIdRef = useRef<string>(`yt-player-${video.id}-${Math.random().toString(36).substring(2, 9)}`);

  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [playerError, setPlayerError] = useState<string | null>(null);
  const [isCompleted, setIsCompleted] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [isDescriptionExpanded, setIsDescriptionExpanded] = useState(false);

  const [stats, setStats] = useState<PlayerStats>({
    currentTime: 0,
    duration: video.durationSeconds || 0,
    volume: 100,
    isMuted: false,
    playbackRate: 1,
    state: YTPlayerState.UNSTARTED,
  });

  // Playback control handlers
  const handlePlay = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.playVideo === 'function') {
      playerRef.current.playVideo();
    }
    backgroundAudio.startAudioSession();
  }, []);

  const handlePause = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
    backgroundAudio.stopAudioSession();
  }, []);

  const handleSeek = useCallback((seconds: number) => {
    if (playerRef.current && typeof playerRef.current.seekTo === 'function') {
      playerRef.current.seekTo(seconds, true);
      setStats((prev) => ({ ...prev, currentTime: seconds }));
      setIsCompleted(false);
    }
  }, []);

  const handleToggleMute = useCallback(() => {
    if (!playerRef.current) return;
    if (stats.isMuted) {
      playerRef.current.unMute();
      setStats((prev) => ({ ...prev, isMuted: false }));
    } else {
      playerRef.current.mute();
      setStats((prev) => ({ ...prev, isMuted: true }));
    }
  }, [stats.isMuted]);

  const handleVolumeChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const newVol = parseInt(e.target.value, 10);
    if (!playerRef.current) return;
    playerRef.current.setVolume(newVol);
    setStats((prev) => ({
      ...prev,
      volume: newVol,
      isMuted: newVol === 0,
    }));
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(rate);
      setStats((prev) => ({ ...prev, playbackRate: rate }));
    }
  }, []);

  const handleToggleFullscreen = useCallback(() => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().catch((err) => {
        console.warn('Fullscreen request failed:', err);
      });
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  const handleReplay = useCallback(() => {
    setIsCompleted(false);
    if (playerRef.current) {
      playerRef.current.seekTo(0, true);
      playerRef.current.playVideo();
    }
    backgroundAudio.startAudioSession();
  }, []);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(video.originalUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  }, [video.originalUrl]);

  // Initialize YouTube IFrame API
  useEffect(() => {
    let isCancelled = false;

    const initPlayer = () => {
      if (isCancelled || !window.YT || !window.YT.Player) return;

      try {
        const player = new window.YT.Player(playerIdRef.current, {
          videoId: video.id,
          playerVars: {
            autoplay: 1,
            controls: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            enablejsapi: 1,
            iv_load_policy: 3,
            origin: window.location.origin,
          },
          events: {
            onReady: (event: any) => {
              if (isCancelled) return;
              playerRef.current = event.target;
              setIsPlayerReady(true);
              setPlayerError(null);

              const duration = event.target.getDuration() || 0;
              const volume = event.target.getVolume() || 100;
              const isMuted = event.target.isMuted() || false;

              setStats((prev) => ({
                ...prev,
                duration: duration || prev.duration,
                volume,
                isMuted,
              }));
            },
            onStateChange: (event: any) => {
              if (isCancelled) return;
              const newState: YTPlayerState = event.data;

              setStats((prev) => ({ ...prev, state: newState }));

              if (newState === YTPlayerState.ENDED) {
                setIsCompleted(true);
                backgroundAudio.stopAudioSession();
                clearMediaSession();
              } else if (newState === YTPlayerState.PLAYING) {
                setIsCompleted(false);
                backgroundAudio.startAudioSession();
              } else if (newState === YTPlayerState.PAUSED) {
                backgroundAudio.stopAudioSession();
              }
            },
            onError: (event: any) => {
              if (isCancelled) return;
              console.warn('YouTube Player error code:', event.data);
              let msg = 'Playback error occurred.';
              if (event.data === 101 || event.data === 150) {
                msg = 'Playback in embedded player is restricted.';
              } else if (event.data === 100) {
                msg = 'This video is unavailable or private.';
              } else if (event.data === 2) {
                msg = 'Invalid video ID parameter.';
              }
              setPlayerError(msg);
            },
          },
        });

        playerRef.current = player;
      } catch (err) {
        console.error('Failed to create YouTube Player instance:', err);
        setPlayerError('Could not initialize video player.');
      }
    };

    if (!window.YT) {
      const existingScript = document.getElementById('yt-iframe-api');
      if (!existingScript) {
        const tag = document.createElement('script');
        tag.id = 'yt-iframe-api';
        tag.src = 'https://www.youtube.com/iframe_api';
        const firstScriptTag = document.getElementsByTagName('script')[0];
        firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      }

      const previousCallback = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (previousCallback) previousCallback();
        initPlayer();
      };
    } else {
      initPlayer();
    }

    return () => {
      isCancelled = true;
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        try {
          playerRef.current.destroy();
        } catch {
          // Ignore
        }
      }
      playerRef.current = null;
      backgroundAudio.stopAudioSession();
      clearMediaSession();
    };
  }, [video.id]);

  // Polling loop for current playback time
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === 'function' &&
        stats.state === YTPlayerState.PLAYING
      ) {
        const time = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || stats.duration;

        setStats((prev) => ({
          ...prev,
          currentTime: time,
          duration: dur || prev.duration,
        }));

        updateMediaSessionPositionState(dur, time, stats.playbackRate);
      }
    }, 500);

    return () => clearInterval(interval);
  }, [stats.state, stats.duration, stats.playbackRate]);

  // Hook into MediaSession API
  useEffect(() => {
    updateMediaSession(video, {
      onPlay: handlePlay,
      onPause: handlePause,
      onSeekTo: handleSeek,
      onSeekBackward: () => handleSeek(Math.max(0, stats.currentTime - 10)),
      onSeekForward: () => handleSeek(Math.min(stats.duration, stats.currentTime + 10)),
    });

    return () => clearMediaSession();
  }, [video, handlePlay, handlePause, handleSeek, stats.currentTime, stats.duration]);

  const isPlaying = stats.state === YTPlayerState.PLAYING;

  return (
    <div className="w-full max-w-5xl mx-auto px-0 sm:px-4 py-2 sm:py-4 animate-fade-in">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between gap-2 mb-3 px-1">
        <button
          onClick={onBackToCatalog}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white border border-white/10 text-xs sm:text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Library</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onSwitchToAudioMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-xs sm:text-sm font-medium transition-all shadow-sm"
            title="Switch to Audio Mode"
          >
            <Headphones className="w-4 h-4" />
            <span>Audio Mode</span>
          </button>

          <button
            onClick={onToggleBookmark}
            className={`p-2 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
              isBookmarked
                ? 'bg-safetube-red/20 border-safetube-red/40 text-safetube-red'
                : 'bg-white/5 border-white/10 text-gray-300 hover:text-white hover:bg-white/10'
            }`}
            title={isBookmarked ? 'Remove Bookmark' : 'Bookmark Video'}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1 p-2 sm:px-3 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-xs sm:text-sm font-medium transition-all"
            title="Copy URL"
          >
            <Share2 className="w-4 h-4" />
            <span className="hidden sm:inline text-xs">{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-xl sm:rounded-2xl overflow-hidden shadow-2xl border border-white/10 group"
      >
        <div id={playerIdRef.current} className="w-full h-full" />

        {/* Loading Spinner */}
        {!isPlayerReady && !playerError && (
          <div className="absolute inset-0 bg-safetube-dark flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-8 h-8 sm:w-10 sm:h-10 border-4 border-safetube-red border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-xs sm:text-sm font-medium">Loading Player...</span>
          </div>
        )}

        {/* Error Screen */}
        {playerError && (
          <div className="absolute inset-0 bg-safetube-dark/95 z-20 flex flex-col items-center justify-center p-4 text-center">
            <AlertTriangle className="w-10 h-10 text-amber-500 mb-2" />
            <h3 className="text-base sm:text-lg font-bold text-white mb-1">Video Unavailable</h3>
            <p className="text-gray-400 text-xs sm:text-sm max-w-md mb-4">{playerError}</p>
            <div className="flex gap-2">
              <button
                onClick={handleReplay}
                className="px-4 py-2 rounded-xl bg-safetube-red hover:bg-safetube-crimson text-white text-xs sm:text-sm font-medium transition-all"
              >
                Try Again
              </button>
              <button
                onClick={onBackToCatalog}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs sm:text-sm font-medium border border-white/10 transition-all"
              >
                Return to Library
              </button>
            </div>
          </div>
        )}

        {/* Playback Completion Overlay */}
        {isCompleted && (
          <CompletionScreen
            video={video}
            onReplay={handleReplay}
            onBackToCatalog={onBackToCatalog}
          />
        )}
      </div>

      {/* Custom Control Bar & Actions */}
      <div className="mt-3 sm:mt-4 bg-safetube-card dark:bg-safetube-card light:bg-white p-3 sm:p-4 rounded-xl sm:rounded-2xl border border-safetube-border shadow-sm">
        {/* Timeline Scrubber */}
        <div className="flex items-center gap-2 sm:gap-3 mb-2 sm:mb-3">
          <span className="text-[11px] sm:text-xs font-mono text-gray-400 min-w-[38px] sm:min-w-[45px]">
            {formatSeconds(stats.currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={stats.duration || 100}
            value={stats.currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-safetube-red transition-all"
          />
          <span className="text-[11px] sm:text-xs font-mono text-gray-400 min-w-[38px] sm:min-w-[45px]">
            {formatSeconds(stats.duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 sm:gap-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-safetube-red hover:bg-safetube-crimson text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md shadow-red-500/20"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-4 h-4 sm:w-5 sm:h-5" /> : <Play className="w-4 h-4 sm:w-5 sm:h-5 ml-0.5" />}
            </button>

            <button
              onClick={handleReplay}
              className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Replay from start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-1.5 sm:gap-2">
              <button
                onClick={handleToggleMute}
                className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
                title={stats.isMuted ? 'Unmute' : 'Mute'}
              >
                {stats.isMuted || stats.volume === 0 ? (
                  <VolumeX className="w-4 h-4" />
                ) : (
                  <Volume2 className="w-4 h-4" />
                )}
              </button>
              <input
                type="range"
                min={0}
                max={100}
                value={stats.isMuted ? 0 : stats.volume}
                onChange={handleVolumeChange}
                className="w-14 sm:w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-safetube-red"
                title={`Volume: ${stats.volume}%`}
              />
            </div>
          </div>

          <div className="flex items-center gap-2 sm:gap-3">
            {/* Playback Speed selector */}
            <div className="flex items-center gap-1 text-[11px] sm:text-xs text-gray-400">
              <span className="hidden sm:inline">Speed:</span>
              <select
                value={stats.playbackRate}
                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                className="bg-black/40 border border-white/10 text-gray-200 text-[11px] sm:text-xs rounded-lg px-1.5 py-1 sm:px-2 sm:py-1.5 focus:outline-none focus:border-safetube-red cursor-pointer"
              >
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>1.0x</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2.0x</option>
              </select>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={handleToggleFullscreen}
              className="p-1.5 sm:p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Details Section */}
      <div className="mt-3 sm:mt-4 bg-safetube-card p-4 sm:p-6 rounded-xl sm:rounded-2xl border border-safetube-border">
        <h1 className="text-lg sm:text-2xl font-bold text-white mb-2 leading-snug">
          {video.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-safetube-border mb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-full bg-gradient-to-tr from-safetube-red to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md shrink-0">
              {video.channelTitle ? video.channelTitle.charAt(0).toUpperCase() : 'Y'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-xs sm:text-sm font-semibold text-white">{video.channelTitle}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-[10px] sm:text-xs text-gray-400">Verified</span>
            </div>
          </div>

          {video.category && (
            <span className="px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[11px] font-medium">
              {video.category}
            </span>
          )}
        </div>

        {/* Video Description */}
        {video.description && (
          <div className="bg-white/5 p-3 sm:p-4 rounded-xl text-xs sm:text-sm text-gray-300">
            <p className={`whitespace-pre-line leading-relaxed ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
              {video.description}
            </p>
            {video.description.length > 150 && (
              <button
                onClick={() => setIsDescriptionExpanded(!isDescriptionExpanded)}
                className="mt-2 text-xs font-semibold text-safetube-red hover:underline focus:outline-none"
              >
                {isDescriptionExpanded ? 'Show less' : 'Show more'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
