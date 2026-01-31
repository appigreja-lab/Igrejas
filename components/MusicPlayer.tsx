
import React, { useState, useRef, useEffect } from 'react';
import { LibraryItem } from '../types';
import { LOGO_URL } from '../constants';

interface MusicPlayerProps {
  track: LibraryItem;
  onClose: () => void;
}

type SkinType = 'classic' | 'dark' | 'nature' | 'crimson' | 'sky';

interface SkinConfig {
  bg: string;
  accent: string;
  text: string;
  subtext: string;
  progressBg: string;
  buttonBg: string;
}

const SKINS: Record<SkinType, SkinConfig> = {
  classic: {
    bg: 'bg-gradient-to-br from-blue-900 via-blue-800 to-indigo-900',
    accent: 'bg-orange-500',
    text: 'text-white',
    subtext: 'text-blue-300',
    progressBg: 'bg-blue-800',
    buttonBg: 'bg-orange-500',
  },
  dark: {
    bg: 'bg-gradient-to-br from-black via-gray-900 to-black',
    accent: 'bg-yellow-600',
    text: 'text-white',
    subtext: 'text-gray-500',
    progressBg: 'bg-gray-800',
    buttonBg: 'bg-yellow-600',
  },
  nature: {
    bg: 'bg-gradient-to-br from-emerald-900 via-green-800 to-teal-900',
    accent: 'bg-white',
    text: 'text-white',
    subtext: 'text-green-200',
    progressBg: 'bg-green-950',
    buttonBg: 'bg-white',
  },
  crimson: {
    bg: 'bg-gradient-to-br from-red-950 via-red-900 to-rose-950',
    accent: 'bg-slate-200',
    text: 'text-white',
    subtext: 'text-red-300',
    progressBg: 'bg-red-800',
    buttonBg: 'bg-slate-200',
  },
  sky: {
    bg: 'bg-gradient-to-br from-sky-400 via-blue-400 to-sky-600',
    accent: 'bg-white',
    text: 'text-white',
    subtext: 'text-sky-100',
    progressBg: 'bg-sky-700',
    buttonBg: 'bg-white',
  }
};

const MusicPlayer: React.FC<MusicPlayerProps> = ({ track, onClose }) => {
  // Load persistent states from LocalStorage
  const [isPlaying, setIsPlaying] = useState(false); // Iniciar pausado por padrão se for restore
  const [isExpanded, setIsExpanded] = useState(false);
  
  const [currentSkin, setCurrentSkin] = useState<SkinType>(() => {
    return (localStorage.getItem('fu_player_skin') as SkinType) || 'classic';
  });
  
  const [volume, setVolume] = useState(() => {
    const saved = localStorage.getItem('fu_player_volume');
    return saved ? parseFloat(saved) : 0.8;
  });
  
  const [playbackRate, setPlaybackRate] = useState(() => {
    const saved = localStorage.getItem('fu_player_rate');
    return saved ? parseFloat(saved) : 1;
  });
  
  const [repeatMode, setRepeatMode] = useState<'off' | 'one'>(() => {
    return (localStorage.getItem('fu_player_repeat') as 'off' | 'one') || 'off';
  });

  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [showSkinPicker, setShowSkinPicker] = useState(false);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const timerIntervalRef = useRef<number | null>(null);
  const skin = SKINS[currentSkin];

  // Restore playback position on track load
  useEffect(() => {
    const savedTime = localStorage.getItem(`fu_progress_${track.id}`);
    if (savedTime && audioRef.current) {
      audioRef.current.currentTime = parseFloat(savedTime);
      setCurrentTime(parseFloat(savedTime));
    }
  }, [track.id]);

  // Persist Volume, Rate, Skin, Repeat
  useEffect(() => localStorage.setItem('fu_player_skin', currentSkin), [currentSkin]);
  useEffect(() => localStorage.setItem('fu_player_volume', volume.toString()), [volume]);
  useEffect(() => localStorage.setItem('fu_player_rate', playbackRate.toString()), [playbackRate]);
  useEffect(() => localStorage.setItem('fu_player_repeat', repeatMode), [repeatMode]);

  // Save current time periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (audioRef.current && isPlaying) {
        localStorage.setItem(`fu_progress_${track.id}`, audioRef.current.currentTime.toString());
      }
    }, 2000);
    return () => clearInterval(interval);
  }, [track.id, isPlaying]);

  // Sleep Timer Logic
  useEffect(() => {
    if (sleepTimer !== null) {
      setTimeLeft(sleepTimer * 60);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = window.setInterval(() => {
        setTimeLeft(prev => {
          if (prev !== null && prev <= 1) {
            setIsPlaying(false);
            setSleepTimer(null);
            clearInterval(timerIntervalRef.current!);
            return 0;
          }
          return prev !== null ? prev - 1 : null;
        });
      }, 1000);
    } else {
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
      setTimeLeft(null);
    }
    return () => { if (timerIntervalRef.current) clearInterval(timerIntervalRef.current); };
  }, [sleepTimer]);

  // Media Session Sync
  useEffect(() => {
    if ('mediaSession' in navigator) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: track.title,
        artist: 'Família Unida',
        album: 'Devocionais e Louvores',
        artwork: [{ src: LOGO_URL, sizes: '512x512', type: 'image/png' }]
      });

      navigator.mediaSession.setActionHandler('play', () => setIsPlaying(true));
      navigator.mediaSession.setActionHandler('pause', () => setIsPlaying(false));
      navigator.mediaSession.setActionHandler('seekbackward', () => {
        if (audioRef.current) audioRef.current.currentTime = Math.max(audioRef.current.currentTime - 10, 0);
      });
      navigator.mediaSession.setActionHandler('seekforward', () => {
        if (audioRef.current) audioRef.current.currentTime = Math.min(audioRef.current.currentTime + 10, duration);
      });
    }
  }, [track, duration]);

  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
      audioRef.current.playbackRate = playbackRate;
      if (isPlaying) {
        audioRef.current.play().catch(() => setIsPlaying(false));
      } else {
        audioRef.current.pause();
      }
    }
    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying, volume, playbackRate, track.id]);

  const togglePlay = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setIsPlaying(!isPlaying);
  };

  const onTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
      setDuration(audioRef.current.duration);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
      localStorage.setItem(`fu_progress_${track.id}`, time.toString());
    }
  };

  const handleDownload = async () => {
    try {
      const response = await fetch(track.url);
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${track.title}.mp3`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (e) {
      const link = document.createElement('a');
      link.href = track.url;
      link.download = track.title;
      link.target = "_blank";
      link.click();
    }
  };

  const formatTime = (time: number) => {
    if (isNaN(time)) return "0:00";
    const mins = Math.floor(time / 60);
    const secs = Math.floor(time % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const cycleRepeat = () => setRepeatMode(prev => prev === 'off' ? 'one' : 'off');

  const cycleRate = () => {
    const rates = [1, 1.25, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    setPlaybackRate(rates[(currentIndex + 1) % rates.length]);
  };

  const toggleSleepTimer = () => {
    const options: (number | null)[] = [null, 15, 30, 60];
    const currentIndex = options.indexOf(sleepTimer);
    setSleepTimer(options[(currentIndex + 1) % options.length]);
  };

  // Expanded View
  if (isExpanded) {
    return (
      <div className={`fixed inset-0 z-[120] ${skin.bg} ${skin.text} flex flex-col animate-slide-up transition-all duration-700 overflow-hidden`}>
        {/* Header */}
        <div className="flex justify-between items-center p-8">
          <button onClick={() => setIsExpanded(false)} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-xl backdrop-blur-md">↓</button>
          <div className="text-center">
            <p className={`text-[10px] font-black uppercase tracking-widest ${skin.subtext} mb-1`}>Família Unida Player</p>
            {timeLeft !== null && (
              <p className="text-[9px] font-bold bg-white/20 px-2 py-0.5 rounded-full animate-pulse">🌙 Desliga em: {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}</p>
            )}
          </div>
          <button onClick={() => setShowSkinPicker(!showSkinPicker)} className="w-10 h-10 flex items-center justify-center bg-white/10 rounded-full text-lg backdrop-blur-md">🎨</button>
        </div>

        {/* Skin Picker Overlay */}
        {showSkinPicker && (
          <div className="px-8 mb-4">
            <div className="p-4 bg-black/20 backdrop-blur-xl rounded-2xl flex justify-around items-center animate-fade-in border border-white/10">
              {(Object.keys(SKINS) as SkinType[]).map(s => (
                <button 
                  key={s} 
                  onClick={() => setCurrentSkin(s)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${currentSkin === s ? 'scale-125 border-white ring-4 ring-white/20' : 'border-transparent opacity-60'}`}
                  style={{ backgroundColor: SKINS[s].buttonBg.includes('bg-') ? '' : 'white' }}
                />
              ))}
            </div>
          </div>
        )}

        {/* Main Content (Visualizer & Info) */}
        <div className="flex-1 flex flex-col items-center justify-center px-8 relative">
          <div className="flex items-end gap-1 mb-12 h-20">
            {[1,2,3,4,5,6,7,8,9,10,11,12].map(i => (
              <div 
                key={i} 
                className={`w-1.5 rounded-full ${skin.accent} transition-all duration-300`}
                style={{ 
                  height: isPlaying ? `${20 + Math.random() * 80}%` : '10%',
                  opacity: 0.3 + (i/12) * 0.7,
                  animation: isPlaying ? `audio-bar 1.${i}s infinite ease-in-out` : 'none'
                }}
              />
            ))}
          </div>

          <div className={`w-64 h-64 ${skin.accent} rounded-[40px] shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex items-center justify-center text-8xl transform transition-transform duration-700 hover:scale-105 active:scale-95 group overflow-hidden`}>
             <span className="z-10">{currentSkin === 'nature' ? '🌿' : currentSkin === 'dark' ? '🎹' : '🎵'}</span>
             <div className="absolute inset-0 bg-white/5 group-hover:bg-transparent transition-colors"></div>
          </div>
          
          <div className="text-center mt-10 space-y-2 w-full">
            <h2 className="text-2xl font-black truncate drop-shadow-lg">{track.title}</h2>
            <div className={`flex items-center justify-center gap-2 text-xs font-bold ${skin.subtext} uppercase tracking-widest`}>
               <span>Devocional</span>
               <span className="w-1 h-1 rounded-full bg-current opacity-50"></span>
               <span>Audio</span>
            </div>
          </div>

          {track.description && (
            <div className="mt-6 max-h-24 overflow-y-auto px-4 w-full">
              <p className="text-sm text-white/70 italic leading-relaxed text-center">"{track.description}"</p>
            </div>
          )}
        </div>

        {/* Controls Area */}
        <div className="p-8 space-y-8 bg-black/10 backdrop-blur-sm rounded-t-[40px] border-t border-white/5">
          <div className="space-y-2">
            <input 
              type="range" min="0" max={duration || 100} value={currentTime} onChange={handleSeek}
              className={`w-full h-1.5 rounded-full appearance-none cursor-pointer bg-white/10 accent-white transition-all`}
            />
            <div className={`flex justify-between text-[10px] font-black uppercase tracking-tighter opacity-70`}>
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <button onClick={cycleRepeat} className={`text-xl transition-all ${repeatMode === 'one' ? 'text-orange-400 scale-110' : 'opacity-40'}`}>🔁</button>
            <div className="flex items-center gap-6">
              <button className="text-3xl opacity-60 active:scale-90 transition">⏮</button>
              <button 
                onClick={() => togglePlay()}
                className={`w-20 h-20 ${skin.buttonBg} rounded-full flex items-center justify-center text-4xl shadow-2xl active:scale-95 transition-all group relative`}
              >
                <div className="absolute inset-0 rounded-full bg-white/20 scale-0 group-hover:scale-110 transition-transform duration-500"></div>
                <span className={currentSkin === 'classic' || currentSkin === 'dark' ? 'text-white' : 'text-blue-900'}>
                  {isPlaying ? '⏸' : '▶️'}
                </span>
              </button>
              <button className="text-3xl opacity-60 active:scale-90 transition">⏭</button>
            </div>
            <button onClick={cycleRate} className="text-[10px] font-black w-10 h-10 border border-white/20 rounded-full flex items-center justify-center active:scale-90 transition">
              {playbackRate}x
            </button>
          </div>

          <div className="flex items-center justify-between gap-4 pt-4">
            <div className="flex-1 flex items-center gap-3">
               <span className="text-xs">🔈</span>
               <input 
                 type="range" min="0" max="1" step="0.01" value={volume} onChange={(e) => setVolume(parseFloat(e.target.value))}
                 className="flex-1 h-1 rounded-full appearance-none bg-white/10 accent-white"
               />
               <span className="text-xs">🔊</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={handleDownload} className="w-10 h-10 flex items-center justify-center bg-white/10 text-white rounded-xl text-lg hover:bg-white/20 transition" title="Baixar">📥</button>
              <button onClick={toggleSleepTimer} className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-[10px] font-black transition-all ${sleepTimer ? 'bg-orange-500 text-white shadow-lg' : 'bg-white/10 text-white/60'}`}>
                <span>🌙</span> {sleepTimer ? `${sleepTimer}m` : 'Timer'}
              </button>
            </div>
          </div>
        </div>

        <audio 
          ref={audioRef} src={track.url} loop={repeatMode === 'one'}
          onTimeUpdate={onTimeUpdate} onEnded={() => repeatMode === 'off' && setIsPlaying(false)}
        />
        <style dangerouslySetInnerHTML={{ __html: `
          @keyframes audio-bar {
            0%, 100% { transform: scaleY(1); }
            50% { transform: scaleY(1.8); }
          }
        `}} />
      </div>
    );
  }

  // Mini Player View
  return (
    <div 
      onClick={() => setIsExpanded(true)}
      className={`fixed bottom-16 left-2 right-2 z-[90] ${skin.bg} backdrop-blur-xl border border-white/10 shadow-[0_10px_30px_rgba(0,0,0,0.3)] rounded-2xl p-3 flex items-center gap-3 animate-slide-up cursor-pointer group transition-all`}
    >
      <div className={`w-12 h-12 ${skin.accent} rounded-xl flex items-center justify-center text-xl shadow-lg group-hover:scale-105 transition-transform duration-300 relative overflow-hidden`}>
        🎵
        {isPlaying && <div className="absolute inset-0 bg-white/20 animate-pulse"></div>}
      </div>
      
      <div className="flex-1 overflow-hidden">
        <p className={`text-xs font-black truncate ${skin.text}`}>{track.title}</p>
        <p className={`${skin.subtext} text-[8px] uppercase font-bold tracking-widest flex items-center gap-1`}>
          Família Unida Player {playbackRate > 1 && `• ${playbackRate}x`}
        </p>
        <div className={`w-full ${skin.progressBg} h-1 mt-1.5 rounded-full overflow-hidden relative`}>
          <div className={`${currentSkin === 'classic' ? 'bg-orange-500' : 'bg-white'} h-full transition-all`} style={{ width: `${(currentTime / (duration || 1)) * 100}%` }} />
        </div>
      </div>

      <div className="flex items-center gap-1">
        <button onClick={(e) => { e.stopPropagation(); togglePlay(); }} className={`w-10 h-10 bg-white ${currentSkin === 'dark' ? 'text-black' : 'text-blue-900'} rounded-full flex items-center justify-center text-sm shadow-inner active:scale-90 transition`}>
          {isPlaying ? '⏸' : '▶️'}
        </button>
        <button onClick={(e) => { e.stopPropagation(); onClose(); }} className="w-8 h-8 flex items-center justify-center text-white/40 hover:text-white transition text-lg">✕</button>
      </div>

      <audio ref={audioRef} src={track.url} loop={repeatMode === 'one'} onTimeUpdate={onTimeUpdate} onEnded={() => repeatMode === 'off' && setIsPlaying(false)} />
    </div>
  );
};

export default MusicPlayer;
