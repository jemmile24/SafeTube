// YouTube IFrame Player API states
export enum YTPlayerState {
  UNSTARTED = -1,
  ENDED = 0,
  PLAYING = 1,
  PAUSED = 2,
  BUFFERING = 3,
  CUED = 5,
}

export interface PlayerStats {
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  state: YTPlayerState;
}

export interface PlayerOptions {
  autoPlay?: boolean;
  startTime?: number;
  audioOnlyUi?: boolean;
}
