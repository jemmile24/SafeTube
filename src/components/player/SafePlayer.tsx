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
  }, []);

  const handlePause = useCallback(() => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
    }
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
            rel: 0, // Disable external related videos
            playsinline: 1, // Crucial for iOS and Android
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
                // Playback finished: enforce strict content control
                setIsCompleted(true);
                clearMediaSession();
              } else if (newState === YTPlayerState.PLAYING) {
                setIsCompleted(false);
              }
            },
            onError: (event: any) => {
              if (isCancelled) return;
              console.warn('YouTube Player error code:', event.data);
              let msg = 'Playback error occurred.';
              if (event.data === 101 || event.data === 150) {
                msg = 'The owner of this video does not permit playback in embedded players.';
              } else if (event.data === 100) {
                msg = 'This video was deleted or marked private on YouTube.';
              } else if (event.data === 2) {
                msg = 'Invalid YouTube video ID parameter.';
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

    // Check if YouTube API script is already on page
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
          // Ignore destruction errors
        }
      }
      playerRef.current = null;
      clearMediaSession();
    };
  }, [video.id]);

  // Polling loop for current playback time and MediaSession sync
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
    <div className="w-full max-w-6xl mx-auto px-4 py-4 animate-fade-in">
      {/* Top Navigation Bar */}
      <div className="flex items-center justify-between mb-4">
        <button
          onClick={onBackToCatalog}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 hover:text-white border border-white/10 text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Library</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={onSwitchToAudioMode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/30 text-sm font-medium transition-all shadow-sm"
            title="Switch to Audio-focused interface"
          >
            <Headphones className="w-4 h-4" />
            <span className="hidden sm:inline">Audio Mode</span>
          </button>

          <button
            onClick={onToggleBookmark}
            className={`p-2 rounded-xl border text-sm font-medium transition-all ${
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
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 hover:text-white text-sm font-medium transition-all"
            title="Copy URL"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs">{copiedLink ? 'Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Main Video Viewport */}
      <div
        ref={containerRef}
        className="relative w-full aspect-video bg-black rounded-2xl overflow-hidden shadow-2xl border border-white/10 group"
      >
        {/* YouTube IFrame target element */}
        <div id={playerIdRef.current} className="w-full h-full" />

        {/* Loading Spinner */}
        {!isPlayerReady && !playerError && (
          <div className="absolute inset-0 bg-safetube-dark flex flex-col items-center justify-center gap-3 z-10">
            <div className="w-10 h-10 border-4 border-safetube-red border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-400 text-sm font-medium">Loading SafeTube Player...</span>
          </div>
        )}

        {/* Error Screen */}
        {playerError && (
          <div className="absolute inset-0 bg-safetube-dark/95 z-20 flex flex-col items-center justify-center p-6 text-center">
            <AlertTriangle className="w-12 h-12 text-amber-500 mb-3" />
            <h3 className="text-lg font-bold text-white mb-2">Video Unavailable</h3>
            <p className="text-gray-400 text-sm max-w-md mb-6">{playerError}</p>
            <div className="flex gap-3">
              <button
                onClick={handleReplay}
                className="px-5 py-2.5 rounded-xl bg-safetube-red hover:bg-safetube-crimson text-white text-sm font-medium transition-all"
              >
                Try Again
              </button>
              <button
                onClick={onBackToCatalog}
                className="px-5 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-sm font-medium border border-white/10 transition-all"
              >
                Return to Library
              </button>
            </div>
          </div>
        )}

        {/* Playback Completion Overlay (Strict Requirement: NO RECOMMENDATIONS) */}
        {isCompleted && (
          <CompletionScreen
            video={video}
            onReplay={handleReplay}
            onBackToCatalog={onBackToCatalog}
          />
        )}
      </div>

      {/* Custom Control Bar & Actions */}
      <div className="mt-4 bg-safetube-card dark:bg-safetube-card light:bg-white p-4 rounded-2xl border border-safetube-border shadow-sm">
        {/* Timeline Scrubber */}
        <div className="flex items-center gap-3 mb-3">
          <span className="text-xs font-mono text-gray-400 min-w-[45px]">
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
          <span className="text-xs font-mono text-gray-400 min-w-[45px]">
            {formatSeconds(stats.duration)}
          </span>
        </div>

        {/* Control Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <button
              onClick={isPlaying ? handlePause : handlePlay}
              className="w-10 h-10 rounded-full bg-safetube-red hover:bg-safetube-crimson text-white flex items-center justify-center transition-transform hover:scale-105 active:scale-95 shadow-md shadow-red-500/20"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>

            <button
              onClick={handleReplay}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Replay from start"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Volume Control */}
            <div className="flex items-center gap-2 group/vol">
              <button
                onClick={handleToggleMute}
                className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
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
                className="w-16 sm:w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-safetube-red"
                title={`Volume: ${stats.volume}%`}
              />
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Playback Speed selector */}
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <span className="hidden sm:inline">Speed:</span>
              <select
                value={stats.playbackRate}
                onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
                className="bg-black/40 border border-white/10 text-gray-200 text-xs rounded-lg px-2 py-1.5 focus:outline-none focus:border-safetube-red cursor-pointer"
              >
                <option value={0.25}>0.25x</option>
                <option value={0.5}>0.5x</option>
                <option value={0.75}>0.75x</option>
                <option value={1}>Normal (1x)</option>
                <option value={1.25}>1.25x</option>
                <option value={1.5}>1.5x</option>
                <option value={2}>2x</option>
              </select>
            </div>

            {/* Fullscreen Button */}
            <button
              onClick={handleToggleFullscreen}
              className="p-2 rounded-lg text-gray-400 hover:text-white hover:bg-white/5 transition-colors"
              title="Toggle Fullscreen"
            >
              <Maximize className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Video Details & Description Section */}
      <div className="mt-4 bg-safetube-card p-6 rounded-2xl border border-safetube-border">
        <h1 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-snug">
          {video.title}
        </h1>

        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-safetube-border mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-tr from-safetube-red to-orange-500 flex items-center justify-center text-white font-bold text-sm shadow-md">
              {video.channelTitle ? video.channelTitle.charAt(0).toUpperCase() : 'Y'}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-semibold text-white">{video.channelTitle}</span>
                <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              </div>
              <span className="text-xs text-gray-400">Approved Creator</span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-medium">
              <CheckCircle2 className="w-3 h-3" />
              Sheet Verified
            </span>
          </div>
        </div>

        {/* Video Description */}
        {video.description && (
          <div className="bg-white/5 p-4 rounded-xl text-sm text-gray-300">
            <p className={`whitespace-pre-line leading-relaxed ${!isDescriptionExpanded ? 'line-clamp-3' : ''}`}>
              {video.description}
            </p>
            {video.description.length > 200 && (
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
