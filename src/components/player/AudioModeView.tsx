import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Play,
  Pause,
  Volume2,
  VolumeX,
  Video,
  ArrowLeft,
  Bookmark,
  Share2
} from 'lucide-react';
import { VideoItem } from '../../types/video';
import { YTPlayerState, PlayerStats } from '../../types/player';
import { formatSeconds } from '../../utils/duration';
import { updateMediaSession, updateMediaSessionPositionState, clearMediaSession } from '../../services/mediaSessionService';
import { backgroundAudio } from '../../services/backgroundAudioService';
import { AudioWaveform } from './AudioWaveform';

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

  const [copiedLink, setCopiedLink] = useState(false);

  // Control handlers
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
              const newState = e.data;
              setStats((prev) => ({ ...prev, state: newState }));

              if (newState === YTPlayerState.PLAYING) {
                backgroundAudio.startAudioSession();
              } else if (newState === YTPlayerState.PAUSED || newState === YTPlayerState.ENDED) {
                backgroundAudio.stopAudioSession();
              }
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
      backgroundAudio.stopAudioSession();
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
    <div className="w-full max-w-2xl mx-auto px-0 sm:px-4 py-2 sm:py-4 animate-fade-in">
      {/* Top Bar */}
      <div className="flex items-center justify-between gap-1.5 mb-3 px-1">
        <button
          onClick={onBackToCatalog}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 text-gray-200 border border-white/10 text-xs sm:text-sm font-medium transition-all"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back</span>
        </button>

        <div className="flex items-center gap-1.5 sm:gap-2">
          <button
            onClick={onSwitchToVideoMode}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-safetube-red/10 hover:bg-safetube-red/20 text-safetube-red border border-safetube-red/30 text-xs sm:text-sm font-medium transition-all"
            title="Switch to Video Mode"
          >
            <Video className="w-4 h-4" />
            <span>Video Mode</span>
          </button>

          <button
            onClick={onToggleBookmark}
            className={`p-2 rounded-xl border text-xs sm:text-sm font-medium transition-all ${
              isBookmarked
                ? 'bg-safetube-red/20 border-safetube-red/40 text-safetube-red'
                : 'bg-white/5 border-white/10 text-gray-300 hover:text-white'
            }`}
          >
            <Bookmark className={`w-4 h-4 ${isBookmarked ? 'fill-current' : ''}`} />
          </button>

          <button
            onClick={handleShare}
            className="flex items-center gap-1 p-2 sm:px-2.5 sm:py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-gray-300 text-xs sm:text-sm font-medium"
            title={copiedLink ? 'Copied' : 'Share'}
          >
            <Share2 className="w-4 h-4" />
            {copiedLink && <span className="text-[10px] text-emerald-400">Copied</span>}
          </button>
        </div>
      </div>

      {/* Audio Focused Card */}
      <div className="relative bg-safetube-card p-5 sm:p-8 rounded-2xl sm:rounded-3xl border border-safetube-border shadow-2xl flex flex-col items-center text-center overflow-hidden">
        {/* Subtle background ambient blur */}
        <div
          className="absolute inset-0 opacity-15 filter blur-3xl pointer-events-none scale-150 transition-opacity"
          style={{
            backgroundImage: `url(${video.thumbnailHighUrl || video.thumbnailUrl})`,
            backgroundPosition: 'center',
            backgroundSize: 'cover',
          }}
        />

        {/* Stationary Album Cover (ঘুরবে না - stationary rounded cover) */}
        <div className="relative my-2 sm:my-4">
          <div className="w-44 h-44 sm:w-56 sm:h-56 rounded-2xl sm:rounded-3xl overflow-hidden shadow-2xl border-2 border-white/10">
            <img
              src={video.thumbnailHighUrl || video.thumbnailUrl}
              alt={video.title}
              className="w-full h-full object-cover"
            />
          </div>
        </div>

        {/* Audio Waveform (উচু নিচু হতে থাকবে তরঙ্গের মত) */}
        <AudioWaveform isPlaying={isPlaying} />

        {/* Title and Channel */}
        <div className="relative z-10 max-w-lg mb-3 px-2">
          <h2 className="text-base sm:text-xl font-bold text-white mb-1 leading-snug">
            {video.title}
          </h2>
          <p className="text-xs sm:text-sm font-medium text-safetube-red">
            {video.channelTitle}
          </p>
        </div>

        {/* Audio Timeline Scrubber */}
        <div className="relative z-10 w-full max-w-md mb-3 px-2">
          <div className="flex items-center justify-between text-[11px] font-mono text-gray-400 mb-1">
            <span>{formatSeconds(stats.currentTime)}</span>
            <span>{formatSeconds(stats.duration)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={stats.duration || 100}
            value={stats.currentTime}
            onChange={(e) => handleSeek(parseFloat(e.target.value))}
            className="w-full h-1.5 sm:h-2 bg-gray-700/60 rounded-lg appearance-none cursor-pointer accent-safetube-red"
          />
        </div>

        {/* Playback Controls */}
        <div className="relative z-10 flex items-center gap-5 sm:gap-6 mb-4">
          <button
            onClick={() => handleSeek(Math.max(0, stats.currentTime - 10))}
            className="p-2.5 sm:p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-[11px] sm:text-xs font-semibold"
            title="Rewind 10 seconds"
          >
            -10s
          </button>

          <button
            onClick={isPlaying ? handlePause : handlePlay}
            className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-safetube-red hover:bg-safetube-crimson text-white flex items-center justify-center shadow-xl shadow-red-600/30 transition-transform hover:scale-105 active:scale-95"
          >
            {isPlaying ? <Pause className="w-7 h-7 sm:w-8 sm:h-8" /> : <Play className="w-7 h-7 sm:w-8 sm:h-8 ml-0.5" />}
          </button>

          <button
            onClick={() => handleSeek(Math.min(stats.duration, stats.currentTime + 10))}
            className="p-2.5 sm:p-3 rounded-full bg-white/5 hover:bg-white/10 text-gray-300 hover:text-white transition-all text-[11px] sm:text-xs font-semibold"
            title="Forward 10 seconds"
          >
            +10s
          </button>
        </div>

        {/* Secondary controls: Volume & Speed */}
        <div className="relative z-10 flex flex-wrap items-center justify-center gap-3 sm:gap-6 w-full max-w-md pt-3 border-t border-white/10">
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
              className="w-16 sm:w-20 h-1 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-safetube-red"
            />
          </div>

          <div className="flex items-center gap-1.5 text-xs text-gray-400">
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
        </div>

        {/* Hidden Official YouTube player frame in DOM */}
        <div className="absolute top-0 left-0 w-1 h-1 opacity-0 pointer-events-none overflow-hidden">
          <div id={playerIdRef.current} className="w-full h-full" />
        </div>
      </div>
    </div>
  );
};
