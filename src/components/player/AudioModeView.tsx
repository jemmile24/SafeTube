import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Video,
  ArrowLeft,
  Info,
  Disc3,
  Bookmark,
  Share2
} from 'lucide-react';
import { VideoItem } from '../../types/video';
import { YTPlayerState, PlayerStats } from '../../types/player';
import { formatSeconds } from '../../utils/duration';
import { updateMediaSession, updateMediaSessionPositionState, clearMediaSession } from '../../services/mediaSessionService';

interface AudioModeViewProps {
  video: VideoItem;
  onBackToCatalog: () => void;
  onSwitchToVideoMode: () => void;
  isBookmarked: boolean;
  onToggleBookmark: () => void;
}

export const AudioModeView: React.FC<AudioModeViewProps> = ({
  video,
  onBackToCatalog,
  onSwitchToVideoMode,
  isBookmarked,
  onToggleBookmark,
}) => {
  const playerRef = useRef<any>(null);
  const playerIdRef = useRef<string>(`yt-audio-player-${video.id}`);

  const [stats, setStats] = useState<PlayerStats>({
    currentTime: 0,
    duration: video.durationSeconds || 0,
    volume: 100,
    isMuted: false,
    playbackRate: 1,
    state: YTPlayerState.UNSTARTED,
  });

  const [showPlatformInfo, setShowPlatformInfo] = useState(false);
  const [showVideoFrame, setShowVideoFrame] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);

  // Control handlers
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
    const val = parseInt(e.target.value, 10);
    if (!playerRef.current) return;
    playerRef.current.setVolume(val);
    setStats((prev) => ({ ...prev, volume: val, isMuted: val === 0 }));
  }, []);

  const handlePlaybackRateChange = useCallback((rate: number) => {
    if (playerRef.current && typeof playerRef.current.setPlaybackRate === 'function') {
      playerRef.current.setPlaybackRate(rate);
      setStats((prev) => ({ ...prev, playbackRate: rate }));
    }
  }, []);

  const handleShare = useCallback(() => {
    navigator.clipboard.writeText(video.originalUrl).then(() => {
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    });
  }, [video.originalUrl]);

  // Initialize official YouTube player
  useEffect(() => {
    let isCancelled = false;

    const initAudioPlayer = () => {
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
            origin: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              if (isCancelled) return;
              playerRef.current = e.target;
              const duration = e.target.getDuration() || 0;
              setStats((prev) => ({ ...prev, duration: duration || prev.duration }));
            },
            onStateChange: (e: any) => {
              if (isCancelled) return;
              setStats((prev) => ({ ...prev, state: e.data }));
            },
          },
        });
        playerRef.current = player;
      } catch (err) {
        console.error('Audio player init failed:', err);
      }
    };

    if (!window.YT) {
      const existing = document.getElementById('yt-iframe-api');
      if (!existing) {
        const script = document.createElement('script');
        script.id = 'yt-iframe-api';
        script.src = 'https://www.youtube.com/iframe_api';
        document.body.appendChild(script);
      }
      const prev = window.onYouTubeIframeAPIReady;
      window.onYouTubeIframeAPIReady = () => {
        if (prev) prev();
        initAudioPlayer();
      };
    } else {
      initAudioPlayer();
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
      clearMediaSession();
    };
  }, [video.id]);

  // Sync position with MediaSession
  useEffect(() => {
    const interval = setInterval(() => {
      if (
        playerRef.current &&
        typeof playerRef.current.getCurrentTime === 'function' &&
        stats.state === YTPlayerState.PLAYING
      ) {
        const time = playerRef.current.getCurrentTime() || 0;
        const dur = playerRef.current.getDuration() || stats.duration;
        setStats((prev) => ({ ...prev, currentTime: time, duration: dur || prev.duration }));
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
    <div className="w-full max-w-4xl mx-auto px-4 py-4 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={onBackToCatalog}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Library</span>
        </button>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowPlatformInfo(!showPlatformInfo)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 text-gray-300 border border-white/10 text-xs font-medium transition-all"
            title="Read Android & Browser background playback limitations"
          >
            <Info className="w-3.5 h-3.5 text-blue-400" />
            <span className="hidden sm:inline">Platform Audio Info</span>
          </button>

          <button
            onClick={onSwitchToVideoMode}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-safetube-red/10 hover:bg-safetube-red/20 text-safetube-red border border-safetube-red/30 text-sm font-medium transition-all"
            title="Switch to Full Video Mode"
          >
            <Video className="w-4 h-4" />
            <span className="hidden sm:inline">Video Mode</span>
          </button>

          <button
            onClick={onToggleBookmark}
            className={`p-2 rounded-xl border text-sm font-medium transition-all ${
              isBookmarked
                ? 'bg-safetube-red/20 border-safetube-red/40 text-safetube-red'
                : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-sm font-medium"
          >
            <Share2 className="w-4 h-4" />
            <span className="text-xs">{copiedLink ? 'Copied' : 'Share'}</span>
          </button>
        </div>
      </div>

      {/* Platform Limitations Notice Drawer */}
      {showPlatformInfo && (
        <div className="mb-6 p-4 rounded-2xl bg-blue-500/10 border border-blue-500/20 text-blue-200 text-xs space-y-2">
          <div className="flex items-center gap-2 font-semibold text-blue-300 text-sm">
            <Info className="w-4 h-4" />
            Android & Browser Background Playback Disclosure
          </div>
          <p>
            SafeTube uses the official YouTube IFrame Player API combined with the browser
            <strong> MediaSession API</strong> to enable notification bar controls and desktop media keys.
          </p>
          <ul className="list-disc list-inside space-y-1 text-blue-200/90 pl-1">
            <li><strong>Desktop & Android Chrome:</strong> Audio continues while navigating other browser tabs.</li>
            <li><strong>Screen-Off Playback:</strong> Under Android Chrome and YouTube platform policy, screen-off audio may pause when the device locks unless an approved native Android audio service is utilized. SafeTube strictly respects YouTube terms and never employs prohibited stream scraping tricks.</li>
          </ul>
        </div>
      )}

      {/* Audio Focused Vinyl / Artwork Card */}
      <div className="relative bg-gradient-to-b from-safetube-card to-safetube-darker p-8 sm:p-12 rounded-3xl border border-safetube-border shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Ambient background artwork blur */}
        <div
          className="absolute inset-0 opacity-15 filter blur-3xl pointer-events-none scale-150 transition-opacity"
          style={{
            backgroundImage: `url(${video.thumbnailHighUrl || video.thumbnailUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />

        {/* Artwork / Vinyl Showcase */}
        <div className="relative mb-8 group">
          <div
            className={`w-48 h-48 sm:w-64 sm:h-64 rounded-full p-2 bg-gradient-to-tr from-gray-800 to-gray-950 shadow-2xl border-4 border-gray-800 flex items-center justify-center transition-transform duration-1000 ${
              isPlaying ? 'animate-spin-slow' : ''
            }`}
          >
            {/* Album Cover inside Vinyl */}
            <div className="relative w-40 h-40 sm:w-52 sm:h-52 rounded-full overflow-hidden border-2 border-black/40 shadow-inner">
              <img
                src={video.thumbnailHighUrl || video.thumbnailUrl}
                alt={video.title}
                className="w-full h-full object-cover"
              />
              {/* Vinyl center hole */}
              <div className="absolute inset-0 m-auto w-8 h-8 rounded-full bg-safetube-dark border-4 border-gray-900 shadow-md flex items-center justify-center">
                <Disc3 className="w-4 h-4 text-gray-500" />
              </div>
            </div>
          </div>
        </div>

        {/* Title and Channel */}
        <div className="relative z-10 max-w-lg mb-6">
          <h2 className="text-xl sm:text-2xl font-bold text-white mb-2 leading-tight">
            {video.title}
          </h2>
          <p className="text-sm font-medium text-safetube-red">
            {video.channelTitle}
          </p>
        </div>

        {/* Audio Timeline Scrubber */}
        <div className="relative z-10 w-full max-w-md mb-6">
          <div className="flex items-center justify-between text-xs font-mono text-gray-400 mb-2">
            <span>{formatSeconds(stats.currentTime)}</span>
            <span>{formatSeconds(stats.duration)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={stats.duration || 100}
            value={stats.currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-2 bg-gray-700/60 rounded-lg appearance-none cursor-pointer accent-safetube-red"
          />
        </div>

        {/* Playback Controls */}
        <div className="relative z-10 flex items-center gap-6 mb-8">
          <button
            onClick={() => handleSeek(Math.max(0, stats.currentTime - 10))}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-xs font-semibold"
            title="Rewind 10 seconds"
          >
            -10s
          </button>

          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="w-16 h-16 rounded-full bg-safetube-red hover:bg-safetube-crimson text-white flex items-center justify-center shadow-xl shadow-red-600/30 transition-transform hover:scale-105 active:scale-95"
          >
            {isPlaying ? <Pause className="w-8 h-8" /> : <Play className="w-8 h-8 ml-1" />}
          </button>

          <button
            onClick={() => handleSeek(Math.min(stats.duration, stats.currentTime + 10))}
            className="p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-xs font-semibold"
            title="Forward 10 seconds"
          >
            +10s
          </button>
        </div>

        {/* Secondary controls: Volume & Speed */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-6 w-full max-w-md pt-4 border-t border-white/10">
          <div className="flex items-center gap-2">
            <button
              onClick={handleToggleMute}
              className="text-gray-400 hover:text-white transition-colors"
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
              className="w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-safetube-red"
            />
          </div>

          <div className="flex items-center gap-2 text-xs text-gray-400">
            <span>Speed:</span>
            <select
              value={stats.playbackRate}
              onChange={(e) => handlePlaybackRateChange(parseFloat(e.target.value))}
              className="bg-black/50 border border-white/10 text-gray-200 text-xs rounded-lg px-2 py-1 focus:outline-none focus:border-safetube-red"
            >
              <option value={0.5}>0.5x</option>
              <option value={0.75}>0.75x</option>
              <option value={1}>1.0x</option>
              <option value={1.25}>1.25x</option>
              <option value={1.5}>1.5x</option>
              <option value={2}>2.0x</option>
            </select>
          </div>

          <button
            onClick={() => setShowVideoFrame(!showVideoFrame)}
            className="text-xs text-gray-400 hover:text-white underline"
          >
            {showVideoFrame ? 'Hide Frame' : 'Inspect Frame'}
          </button>
        </div>

        {/* Official YouTube player frame (Kept active in DOM per YouTube Terms of Service) */}
        <div
          className={`mt-6 w-full max-w-md transition-all duration-300 ${
            showVideoFrame ? 'opacity-100 max-h-96' : 'opacity-0 max-h-0 pointer-events-none'
          } overflow-hidden rounded-xl border border-white/10`}
        >
          <div className="aspect-video w-full">
            <div id={playerIdRef.current} className="w-full h-full" />
          </div>
        </div>
      </div>
    </div>
  );
};
