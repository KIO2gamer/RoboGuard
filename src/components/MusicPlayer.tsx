/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Pause, SkipForward, SkipBack, Timer, Music, Music2, 
  Baby, Heart, RotateCcw, Volume2, VolumeX, Sparkles, ShieldAlert
} from 'lucide-react';
import { RobotModel, UserModel } from '../types';

interface MusicPlayerProps {
  robot: RobotModel;
  user: UserModel | null;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  duration: string;
  audioUrl?: string; // Standard public royalty-free placeholders or synthetic chime
}

const KIDS_PLAYLIST: Song[] = [
  { id: 'k1', title: 'Twinkle Twinkle Little Star', artist: 'Guardian Lullabies', duration: '2:15' },
  { id: 'k2', title: 'The Wheels on the Bus', artist: 'Playtime Bots', duration: '1:50' },
  { id: 'k3', title: 'Alphabet Phonics Bounce', artist: 'Nursery Tech', duration: '2:04' },
  { id: 'k4', title: 'Humpty Dumpty Cozy Chime', artist: 'Sweet Dreams AI', duration: '1:45' },
  { id: 'k5', title: 'Baa Baa Black Sheep Lullaby', artist: 'Sleepy Robot', duration: '2:30' }
];

const ELDERS_PLAYLIST: Song[] = [
  { id: 'e1', title: 'Moonlight Sonata (Adagio)', artist: 'Ludwig van Beethoven', duration: '5:40' },
  { id: 'e2', title: 'Nocturne in E-Flat Major', artist: 'Frédéric Chopin', duration: '4:30' },
  { id: 'e3', title: 'Clair de Lune', artist: 'Claude Debussy', duration: '5:05' },
  { id: 'e4', title: 'The Four Seasons: Spring', artist: 'Antonio Vivaldi', duration: '3:15' },
  { id: 'e5', title: 'Soothing Forest Rain & Piano', artist: 'Natural Resonance', duration: '8:00' }
];

export default function MusicPlayer({ robot, user }: MusicPlayerProps) {
  const [activePlaylist, setActivePlaylist] = useState<'kids' | 'elders'>('kids');
  const [currentSongIndex, setCurrentSongIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [rotationTimerEnabled, setRotationTimerEnabled] = useState(true);
  const [timerInterval, setTimerInterval] = useState(30); // in seconds
  const [timeLeft, setTimeLeft] = useState(30);
  const [isTransitioning, setIsTransitioning] = useState(false);
  const [transitionMessage, setTransitionMessage] = useState<string | null>(null);

  // Sound Visualizer simulation
  const [visualizerBars, setVisualizerBars] = useState<number[]>(Array(18).fill(4));
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const playlist = activePlaylist === 'kids' ? KIDS_PLAYLIST : ELDERS_PLAYLIST;
  const currentSong = playlist[currentSongIndex];

  // 1. Telemetry Sound Visualizer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && !isTransitioning) {
      timer = setInterval(() => {
        setVisualizerBars(
          Array(18).fill(0).map(() => {
            const base = activePlaylist === 'kids' 
              ? Math.floor(Math.sin(Date.now() / 150) * 12) + 20  // more energetic
              : Math.floor(Math.sin(Date.now() / 400) * 8) + 12; // slow waves
            return Math.max(4, Math.min(36, base + Math.floor(Math.random() * 8)));
          })
        );
      }, 100);
    } else {
      setVisualizerBars(Array(18).fill(3));
    }
    return () => clearInterval(timer);
  }, [isPlaying, activePlaylist, isTransitioning]);

  // 2. Countdown Timer Effect
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying && rotationTimerEnabled && !isTransitioning) {
      timer = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            // Trigger automatic playlist rotation!
            triggerRotationTransition();
            return timerInterval;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, rotationTimerEnabled, timerInterval, activePlaylist, isTransitioning]);

  // Initialize time left if interval changes
  useEffect(() => {
    setTimeLeft(timerInterval);
  }, [timerInterval]);

  // Synthesize soft chime to verify hardware action
  const playSynthesizedChime = (type: 'kids' | 'elders') => {
    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === 'suspended') {
        ctx.resume();
      }

      // Stop previous
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        oscillatorRef.current.disconnect();
      }

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'kids') {
        // High playful cute jump chimes
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
        osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
        osc.frequency.setValueAtTime(783.99, ctx.currentTime + 0.3); // G5
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
        osc.start();
        osc.stop(ctx.currentTime + 0.65);
      } else {
        // Warm rich ambient wave
        osc.type = 'sine';
        osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
        osc.frequency.setValueAtTime(392.00, ctx.currentTime + 0.2); // G4
        osc.frequency.setValueAtTime(493.88, ctx.currentTime + 0.4); // B4
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 1.2);
        osc.start();
        osc.stop(ctx.currentTime + 1.25);
      }

      oscillatorRef.current = osc;
    } catch (e) {
      console.warn("Audio synthesis not supported or blocked by user interaction gesture yet:", e);
    }
  };

  // 3. Trigger Rotation Transition
  const triggerRotationTransition = async () => {
    setIsTransitioning(true);
    setIsPlaying(false);
    
    const nextMode = activePlaylist === 'kids' ? 'elders' : 'kids';
    const recipientName = nextMode === 'kids' ? (user?.childName || 'Emma') : 'Arthur';
    const genreText = nextMode === 'kids' ? 'playful nursery rhymes' : 'relaxing classical piano';
    
    const announcement = nextMode === 'kids'
      ? `Attention: Switching playlist to Nursery mode for ${recipientName}. Let's play some happy songs!`
      : `Transitioning music to classical therapeutic mode for ${recipientName}. Enjoy these peaceful melodies.`;

    setTransitionMessage(announcement);
    playSynthesizedChime(nextMode);

    // Speak announcement via browser TTS or display vocal action
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(announcement);
      utterance.rate = 0.95;
      utterance.onend = () => {
        completeRotation(nextMode);
      };
      utterance.onerror = () => {
        completeRotation(nextMode);
      };
      window.speechSynthesis.speak(utterance);
    } else {
      // Simulation timeout if TTS not available
      setTimeout(() => {
        completeRotation(nextMode);
      }, 4000);
    }
  };

  const completeRotation = (nextMode: 'kids' | 'elders') => {
    setActivePlaylist(nextMode);
    setCurrentSongIndex(0);
    setIsTransitioning(false);
    setTransitionMessage(null);
    setTimeLeft(timerInterval);
    setIsPlaying(true);
  };

  // Core player functions
  const togglePlay = () => {
    if (isTransitioning) return;
    if (!isPlaying) {
      playSynthesizedChime(activePlaylist);
    }
    setIsPlaying(!isPlaying);
  };

  const handleNext = () => {
    if (isTransitioning) return;
    setCurrentSongIndex((prev) => (prev + 1) % playlist.length);
    playSynthesizedChime(activePlaylist);
  };

  const handlePrev = () => {
    if (isTransitioning) return;
    setCurrentSongIndex((prev) => (prev - 1 + playlist.length) % playlist.length);
    playSynthesizedChime(activePlaylist);
  };

  const forceSwitchMode = (mode: 'kids' | 'elders') => {
    if (activePlaylist === mode || isTransitioning) return;
    triggerRotationTransition();
  };

  const resetTimer = () => {
    setTimeLeft(timerInterval);
  };

  // Calc progress bar percent
  const percentLeft = (timeLeft / timerInterval) * 100;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="music-hub-container">
      {/* LEFT COLUMN: ACTIVE PLAYER & VINYL DOCK */}
      <div className="lg:col-span-7 space-y-6">
        <div className="glass rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col justify-between min-h-[460px] bg-gradient-to-br from-indigo-950/20 via-slate-900/10 to-slate-950/40">
          <div className="absolute inset-0 bg-camera-scanlines opacity-[0.03] pointer-events-none" />
          
          {/* Header */}
          <div className="flex items-center justify-between z-10">
            <span className="text-[10px] font-mono font-bold tracking-widest text-cyan-400 uppercase bg-cyan-500/10 border border-cyan-500/20 px-3 py-1 rounded-full flex items-center gap-1.5">
              <span className={`h-1.5 w-1.5 rounded-full bg-cyan-400 ${isPlaying ? 'animate-pulse' : ''}`} />
              {activePlaylist === 'kids' ? "MODE: TODDLER RHYMES" : "MODE: ELDER THERAPY"}
            </span>
            <div className="flex items-center gap-1">
              <Timer className="h-4 w-4 text-slate-400" />
              <span className="text-xs font-mono font-bold text-slate-300">
                Auto-Rotate: {rotationTimerEnabled ? `${timeLeft}s` : 'OFF'}
              </span>
            </div>
          </div>

          {/* TRANSITION OVERLAY SCREEN */}
          {isTransitioning ? (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-6 space-y-4 z-10 animate-fade-in bg-slate-950/80 rounded-2xl border border-cyan-500/20 my-4">
              <div className="p-4 bg-cyan-500/10 rounded-full inline-block border border-cyan-500/30 animate-bounce">
                <Volume2 className="h-10 w-10 text-cyan-400" />
              </div>
              <div className="space-y-1">
                <h4 className="text-cyan-400 font-extrabold text-base tracking-widest uppercase font-mono">GuardianBot Dispatching Voice</h4>
                <p className="text-white text-sm font-semibold max-w-sm mx-auto leading-relaxed italic">
                  "{transitionMessage}"
                </p>
              </div>
              <span className="text-[10px] text-white/40 font-bold tracking-wider uppercase font-mono animate-pulse">
                Speaking over Robot Speaker...
              </span>
            </div>
          ) : (
            /* ACTIVE ALBUM ART & SPINNING VINYL */
            <div className="flex-1 flex flex-col md:flex-row items-center justify-center gap-8 py-6 z-10">
              {/* Spinning Vinyl Disk */}
              <div className="relative shrink-0">
                <div className={`w-40 h-40 rounded-full bg-slate-950 border-4 border-slate-800 flex items-center justify-center relative shadow-2xl transition-transform duration-1000 ${
                  isPlaying ? 'animate-[spin_6s_linear_infinite]' : ''
                }`}>
                  {/* Vinyl grooves lines */}
                  <div className="absolute inset-4 rounded-full border border-white/5" />
                  <div className="absolute inset-8 rounded-full border border-white/5" />
                  <div className="absolute inset-12 rounded-full border border-white/5" />
                  
                  {/* Center Sticker */}
                  <div className={`w-14 h-14 rounded-full flex items-center justify-center ${
                    activePlaylist === 'kids' 
                      ? 'bg-gradient-to-tr from-cyan-400 to-amber-300 text-slate-950' 
                      : 'bg-gradient-to-tr from-indigo-500 to-purple-400 text-white'
                  }`}>
                    {activePlaylist === 'kids' ? <Baby className="h-6 w-6" /> : <Heart className="h-6 w-6" />}
                  </div>
                  {/* Center pin-hole */}
                  <div className="w-2.5 h-2.5 bg-slate-900 rounded-full absolute z-20" />
                </div>
                {/* Tone arm needle */}
                <div className={`absolute top-0 -right-2 h-20 w-1.5 bg-slate-500 origin-top transform transition-all duration-300 ${
                  isPlaying ? 'rotate-[25deg]' : 'rotate-0'
                }`} />
              </div>

              {/* Song Information & Equalizer Wave */}
              <div className="text-center md:text-left space-y-4 flex-1">
                <div className="space-y-1">
                  <h3 className="text-white font-extrabold text-xl font-serif tracking-tight">{currentSong.title}</h3>
                  <p className="text-slate-300 text-xs font-semibold">{currentSong.artist}</p>
                  <p className="text-white/40 text-[10px] font-mono font-bold uppercase tracking-wider">Length: {currentSong.duration} • Track {currentSongIndex + 1}/5</p>
                </div>

                {/* Simulated Equalizer wave */}
                <div className="flex items-end justify-center md:justify-start gap-1 h-12 bg-slate-950/40 p-2.5 rounded-xl border border-white/10 w-fit backdrop-blur-md">
                  {visualizerBars.map((h, i) => (
                    <span 
                      key={i} 
                      style={{ height: `${h}px` }}
                      className={`w-1.5 rounded-full transition-all duration-100 ${
                        activePlaylist === 'kids' 
                          ? 'bg-gradient-to-t from-cyan-400 to-amber-400' 
                          : 'bg-gradient-to-t from-indigo-500 to-purple-400'
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Controls Bar */}
          <div className="bg-slate-950/60 px-5 py-4 border border-white/5 rounded-2xl flex items-center justify-between z-10 font-sans">
            <button 
              onClick={handlePrev}
              disabled={isTransitioning}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/15 text-white hover:text-cyan-400 transition cursor-pointer disabled:opacity-40"
            >
              <SkipBack className="h-4 w-4" />
            </button>

            <button 
              onClick={togglePlay}
              disabled={isTransitioning}
              className={`p-4 rounded-full text-slate-950 shadow-lg shadow-cyan-500/10 hover:scale-105 transition duration-200 cursor-pointer disabled:opacity-40 ${
                activePlaylist === 'kids' ? 'bg-cyan-400 hover:bg-cyan-300' : 'bg-indigo-400 hover:bg-indigo-300'
              }`}
            >
              {isPlaying ? <Pause className="h-5 w-5" fill="currentColor" /> : <Play className="h-5 w-5" fill="currentColor" />}
            </button>

            <button 
              onClick={handleNext}
              disabled={isTransitioning}
              className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/15 text-white hover:text-cyan-400 transition cursor-pointer disabled:opacity-40"
            >
              <SkipForward className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* RIGHT COLUMN: TIMER SETTINGS & LISTS */}
      <div className="lg:col-span-5 space-y-6">
        {/* TIMER CONFIGURATION BLOCK */}
        <div className="glass rounded-3xl p-6 shadow-xl space-y-4 font-sans">
          <div className="flex items-center gap-2 border-b border-white/10 pb-3">
            <Timer className="h-5 w-5 text-cyan-400" />
            <h3 className="font-bold text-white text-base">Smart Generation Switcher</h3>
          </div>

          <p className="text-xs text-slate-300 leading-relaxed font-medium">
            This timer automatically alternates play between energetic kids rhymes and soothing elder therapy, broadcasting vocal reminders into the home during switches.
          </p>

          <div className="space-y-4 pt-1">
            {/* Auto Timer Toggle switch */}
            <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-2xl">
              <div>
                <span className="text-xs font-bold text-slate-200 block">Automatic Rotation Timer</span>
                <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Automatically rotate playlists when countdown completes</p>
              </div>
              <input
                type="checkbox"
                checked={rotationTimerEnabled}
                onChange={(e) => setRotationTimerEnabled(e.target.checked)}
                className="h-4.5 w-4.5 accent-cyan-400 cursor-pointer text-cyan-500 border-white/20 rounded-md focus:ring-cyan-500"
              />
            </div>

            {/* Countdown Interval length selector */}
            <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-2xl">
              <label htmlFor="interval-select" className="text-xs font-bold text-slate-200">Switch Interval</label>
              <select
                id="interval-select"
                value={timerInterval}
                onChange={(e) => setTimerInterval(Number(e.target.value))}
                disabled={isTransitioning}
                className="bg-slate-900 text-white text-xs font-bold py-1.5 px-3 border border-white/10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer transition-all duration-200"
              >
                <option value={10}>10 Seconds (Demo)</option>
                <option value={30}>30 Seconds</option>
                <option value={60}>1 Minute</option>
                <option value={300}>5 Minutes</option>
                <option value={600}>10 Minutes</option>
                <option value={1800}>30 Minutes</option>
              </select>
            </div>

            {/* Visual Countdown Progress Ring / Bar */}
            {rotationTimerEnabled && (
              <div className="space-y-2">
                <div className="flex justify-between items-center text-[10px] font-mono font-bold text-slate-400 uppercase">
                  <span>Countdown progression</span>
                  <span className="text-cyan-400">{timeLeft} seconds left</span>
                </div>
                <div className="w-full bg-white/5 h-2.5 rounded-full overflow-hidden border border-white/10 relative">
                  <div 
                    style={{ width: `${percentLeft}%` }}
                    className={`h-full rounded-full transition-all duration-1000 ${
                      activePlaylist === 'kids' 
                        ? 'bg-gradient-to-r from-cyan-400 to-indigo-500' 
                        : 'bg-gradient-to-r from-indigo-500 to-purple-400'
                    }`}
                  />
                </div>
                <div className="flex justify-end gap-2 pt-1">
                  <button 
                    onClick={resetTimer}
                    className="text-[10px] bg-white/5 hover:bg-white/10 text-white font-bold py-1.5 px-3 rounded-lg border border-white/10 transition flex items-center gap-1 cursor-pointer"
                  >
                    <RotateCcw className="h-3 w-3" />
                    Reset Countdown
                  </button>
                </div>
              </div>
            )}

            {/* Quick Switch Modes */}
            <div className="grid grid-cols-2 gap-3 pt-1">
              <button
                onClick={() => forceSwitchMode('kids')}
                disabled={activePlaylist === 'kids' || isTransitioning}
                className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer ${
                  activePlaylist === 'kids'
                    ? 'bg-cyan-500/10 border border-cyan-500/30 text-cyan-300 font-extrabold cursor-default'
                    : 'bg-white/3 hover:bg-white/8 border border-white/5 text-slate-300'
                }`}
              >
                <Baby className="h-3.5 w-3.5" />
                Nursery Rhymes
              </button>
              <button
                onClick={() => forceSwitchMode('elders')}
                disabled={activePlaylist === 'elders' || isTransitioning}
                className={`py-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition duration-200 cursor-pointer ${
                  activePlaylist === 'elders'
                    ? 'bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 font-extrabold cursor-default'
                    : 'bg-white/3 hover:bg-white/8 border border-white/5 text-slate-300'
                }`}
              >
                <Heart className="h-3.5 w-3.5" />
                Elder Serenade
              </button>
            </div>
          </div>
        </div>

        {/* SONG LIST PREVIEW */}
        <div className="glass rounded-3xl p-5 shadow-xl space-y-3 font-sans">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase font-mono">
              {activePlaylist === 'kids' ? "Rhymes for Emma" : "Classical for Arthur"}
            </span>
            <span className="text-[10px] font-mono font-bold bg-white/5 px-2 py-0.5 rounded-lg text-slate-300 border border-white/10">
              {playlist.length} Tracks
            </span>
          </div>

          <div className="space-y-1.5 divide-y divide-white/5">
            {playlist.map((song, index) => {
              const isActive = index === currentSongIndex;
              return (
                <button
                  key={song.id}
                  onClick={() => { if(!isTransitioning) { setCurrentSongIndex(index); playSynthesizedChime(activePlaylist); } }}
                  className={`w-full py-2.5 px-3 rounded-xl text-left flex items-center justify-between transition group cursor-pointer ${
                    isActive 
                      ? activePlaylist === 'kids' 
                        ? 'bg-cyan-500/10 text-cyan-300 font-bold' 
                        : 'bg-indigo-500/10 text-indigo-300 font-bold'
                      : 'text-slate-300 hover:bg-white/3 hover:text-white'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="relative flex items-center justify-center shrink-0">
                      {isActive && isPlaying ? (
                        <div className="flex items-end gap-0.5 h-3.5 w-3.5 mr-1.5">
                          <span className={`w-0.5 rounded-full bg-current animate-[pulse_0.6s_infinite_alternate] h-3`} />
                          <span className={`w-0.5 rounded-full bg-current animate-[pulse_0.4s_infinite_alternate] h-2`} />
                          <span className={`w-0.5 rounded-full bg-current animate-[pulse_0.5s_infinite_alternate] h-4`} />
                        </div>
                      ) : (
                        <span className="text-xs font-mono text-white/30 group-hover:text-cyan-400 font-bold mr-2">
                          {(index + 1).toString().padStart(2, '0')}
                        </span>
                      )}
                    </div>
                    <div className="truncate pr-2">
                      <span className="text-xs font-bold block truncate">{song.title}</span>
                      <span className="text-[10px] text-slate-400 font-medium block truncate">{song.artist}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 text-xs font-mono text-white/30 shrink-0">
                    <span>{song.duration}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
