/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useRef, useEffect } from 'react';
import { 
  Volume2, VolumeX, Sparkles, BookOpen, Mic, MicOff, Play, 
  Pause, RotateCcw, HelpCircle, ChevronRight, User, Heart, 
  Baby, Calendar, Smile, Compass, Send, ShieldAlert
} from 'lucide-react';
import { RobotModel, UserModel } from '../types';

interface VoicePlaygroundProps {
  robot: RobotModel;
  user: UserModel | null;
}

const PRESET_COMMANDS = [
  { id: 'clean', label: '🧹 Time to clean up!', text: "Emma, it's time to tidy up your toys! Let's clean up together with GuardianBot.", target: 'child' },
  { id: 'brush', label: '🪥 Brush your teeth', text: "Hey Emma, let's go brush your teeth! Two minutes of bubbles to make them shiny white.", target: 'child' },
  { id: 'bed', label: '🌙 Bedtime reminder', text: "Bedtime is here, little star! Time to hop into your warm cozy bed and close your eyes. Goodnight!", target: 'child' },
  { id: 'dinner', label: '🍽️ Dinner is ready', text: "Emma, wash your hands! Dinner is warm and ready on the kitchen table.", target: 'child' },
  { id: 'meds', label: '💊 Take your medicine', text: "Arthur, this is your friendly GuardianBot. It is time for your afternoon medicine reminder with a glass of water.", target: 'elderly' },
  { id: 'checkin', label: '❤️ Friendly check-in', text: "Hello! Just checking in to see if you are doing well and feeling comfortable. Let me know if you need any help.", target: 'elderly' }
];

export default function VoicePlayground({ robot, user }: VoicePlaygroundProps) {
  const [activeTab, setActiveTab] = useState<'voice' | 'story'>('voice');
  
  // TTS Voice states
  const [customText, setCustomText] = useState('');
  const [selectedVoice, setSelectedVoice] = useState('Kore'); // Kore, Puck, Fenrir, Zephyr
  const [isPlaying, setIsPlaying] = useState(false);
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [ttsFeedback, setTtsFeedback] = useState<string | null>(null);

  // Story generator states
  const [storyName, setStoryName] = useState(user?.childName || 'Emma');
  const [storyAge, setStoryAge] = useState<number>(user?.childAge || 4);
  const [storyTheme, setStoryTheme] = useState('space'); // space, nursery, friendship, hygiene
  const [customDetails, setCustomDetails] = useState('');
  const [generatedStory, setGeneratedStory] = useState<string | null>(null);
  const [isGeneratingStory, setIsGeneratingStory] = useState(false);
  const [isReadingStory, setIsReadingStory] = useState(false);

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [equalizerBars, setEqualizerBars] = useState<number[]>(Array(10).fill(10));

  // Handle equalizer bar animations when playing audio
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (isPlaying || isReadingStory) {
      timer = setInterval(() => {
        setEqualizerBars(
          Array(12).fill(0).map(() => Math.floor(Math.random() * 32) + 8)
        );
      }, 120);
    } else {
      setEqualizerBars(Array(12).fill(4));
    }
    return () => clearInterval(timer);
  }, [isPlaying, isReadingStory]);

  // Clean up audio URL on unmount
  useEffect(() => {
    return () => {
      if (audioUrl) {
        URL.revokeObjectURL(audioUrl);
      }
    };
  }, [audioUrl]);

  // Execute Text-to-Speech broadcast
  const handleBroadcastTTS = async (textToBroadcast: string) => {
    if (!textToBroadcast.trim()) return;
    setIsGeneratingTTS(true);
    setTtsFeedback(null);
    setIsPlaying(false);

    try {
      const response = await fetch('/api/gemini/tts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: textToBroadcast, voice: selectedVoice })
      });

      const data = await response.json();

      if (data.simulated) {
        // Fallback: Browser Local Speech Synthesis so they can actually hear the robot
        setTtsFeedback("No API key configured. Utilizing local browser speech synthesis simulation.");
        
        if ('speechSynthesis' in window) {
          window.speechSynthesis.cancel();
          const utterance = new SpeechSynthesisUtterance(textToBroadcast);
          utterance.onstart = () => setIsPlaying(true);
          utterance.onend = () => setIsPlaying(false);
          utterance.onerror = () => setIsPlaying(false);
          window.speechSynthesis.speak(utterance);
        } else {
          // If no speech support in browser, just animate briefly
          setIsPlaying(true);
          setTimeout(() => setIsPlaying(false), 3000);
        }
      } else if (data.audio) {
        // Real audio bytes received
        setTtsFeedback(`Real Gemini Audio broadcasted successfully using Voice actor [${selectedVoice}]!`);
        
        // Decode base64 and create Blob URL
        const binary = atob(data.audio);
        const bytes = new Uint8Array(binary.length);
        for (let i = 0; i < binary.length; i++) {
          bytes[i] = binary.charCodeAt(i);
        }
        const blob = new Blob([bytes], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        setAudioUrl(url);
        
        setTimeout(() => {
          if (audioRef.current) {
            audioRef.current.src = url;
            audioRef.current.play()
              .then(() => setIsPlaying(true))
              .catch(err => {
                console.error("Audio playback failure:", err);
                setIsPlaying(false);
              });
          }
        }, 50);
      }
    } catch (err: any) {
      console.error(err);
      setTtsFeedback("Failed to trigger audio generator: " + err.message);
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  // Generate Book Story with Gemini
  const handleGenerateStory = async () => {
    setIsGeneratingStory(true);
    setGeneratedStory(null);
    setIsReadingStory(false);
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }

    try {
      const response = await fetch('/api/gemini/story', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: storyName,
          age: storyAge,
          theme: storyTheme,
          customCharacters: customDetails
        })
      });

      const data = await response.json();
      setGeneratedStory(data.story);
    } catch (err: any) {
      console.error(err);
      setGeneratedStory("Once upon a time, the story engine ran into a star block. Please verify your connection and try again!");
    } finally {
      setIsGeneratingStory(false);
    }
  };

  // Read generated story aloud
  const toggleReadStoryAloud = () => {
    if (isReadingStory) {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.pause();
      }
      setIsReadingStory(false);
    } else {
      if (!generatedStory) return;
      setIsReadingStory(true);

      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        // Remove markdown markings for cleaner browser speech
        const cleanText = generatedStory.replace(/[*#_`]/g, '');
        const utterance = new SpeechSynthesisUtterance(cleanText);
        utterance.onend = () => setIsReadingStory(false);
        utterance.onerror = () => setIsReadingStory(false);
        window.speechSynthesis.speak(utterance);
      } else {
        // Fake visual reading if not supported
        setTimeout(() => setIsReadingStory(false), 8000);
      }
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-6" id="voice-playground-container">
      {/* LEFT NAVIGATION COLUMN */}
      <div className="lg:col-span-3 glass rounded-3xl p-4 shadow-xl h-fit space-y-2">
        <button
          onClick={() => { setActiveTab('voice'); setIsReadingStory(false); if('speechSynthesis' in window) window.speechSynthesis.cancel(); }}
          className={`w-full p-3.5 rounded-xl flex items-center gap-3 font-sans font-bold text-sm transition-all duration-200 cursor-pointer ${
            activeTab === 'voice' 
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' 
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <Volume2 className="h-5 w-5" />
          Voice Dispatcher
        </button>
        <button
          onClick={() => { setActiveTab('story'); setIsPlaying(false); if('speechSynthesis' in window) window.speechSynthesis.cancel(); }}
          className={`w-full p-3.5 rounded-xl flex items-center gap-3 font-sans font-bold text-sm transition-all duration-200 cursor-pointer ${
            activeTab === 'story' 
              ? 'bg-cyan-500 text-slate-950 shadow-lg shadow-cyan-500/20' 
              : 'text-slate-300 hover:bg-white/5 hover:text-white'
          }`}
        >
          <BookOpen className="h-5 w-5" />
          Bedtime Storyteller
        </button>

        {robot.isOnline && (
          <div className="pt-4 border-t border-white/10 mt-4 px-2">
            <span className="text-[10px] font-bold text-slate-400 tracking-wider uppercase block font-mono">Speaker Status</span>
            <div className="flex items-center gap-2 mt-2">
              <span className={`h-2.5 w-2.5 rounded-full ${robot.speakerActive ? 'bg-emerald-400 animate-pulse' : 'bg-rose-400'}`} />
              <span className="text-xs font-semibold text-slate-300 font-mono">
                {robot.speakerActive ? 'Speaker Broadcast Armed' : 'Robot Speaker Muted'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* RIGHT CONTENT WORKSPACE */}
      <div className="lg:col-span-9 space-y-6">
        
        {/* TAB 1: VOICE DISPATCHER */}
        {activeTab === 'voice' && (
          <div className="space-y-6">
            {/* Waveform Visualization block */}
            <div className="glass rounded-3xl p-6 shadow-2xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="absolute inset-0 bg-camera-scanlines opacity-[0.04] pointer-events-none" />
              <div className="space-y-2 text-center md:text-left z-10">
                <span className="text-xs font-bold tracking-widest text-cyan-400 uppercase font-mono">Live Broadcast Console</span>
                <h3 className="font-sans font-bold text-xl text-white">GuardianBot Speaker Dispatcher</h3>
                <p className="text-slate-300 text-xs max-w-md font-sans font-medium">
                  Speak directly to your child or elderly companion. Your broadcast is instantly synthesized into high-quality companion vocals and emitted from GuardianBot.
                </p>
              </div>

              {/* Graphical equalizer waveform */}
              <div className="flex items-end justify-center gap-1.5 h-14 w-48 bg-slate-950/40 p-3 rounded-2xl border border-white/10 backdrop-blur-md shrink-0 z-10">
                {equalizerBars.map((barHeight, idx) => (
                  <span 
                    key={idx} 
                    style={{ height: `${barHeight}px` }}
                    className={`w-2 rounded-full transition-all duration-100 ${
                      isPlaying 
                        ? 'bg-gradient-to-t from-cyan-400 to-indigo-400 animate-pulse' 
                        : 'bg-white/10'
                    }`}
                  />
                ))}
              </div>
            </div>

            {/* Main TTS Input and Presets */}
            <div className="glass rounded-3xl p-6 shadow-xl space-y-6">
              {/* Presets segment */}
              <div className="space-y-3 font-sans">
                <div className="flex items-center gap-1.5">
                  <Sparkles className="h-4.5 w-4.5 text-cyan-400" />
                  <span className="text-sm font-bold text-white">Quick Broadcast Presets</span>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {PRESET_COMMANDS.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => { setCustomText(cmd.text); handleBroadcastTTS(cmd.text); }}
                      disabled={!robot.isOnline || isGeneratingTTS}
                      className="p-4 bg-white/3 hover:bg-white/10 border border-white/5 hover:border-white/15 rounded-2xl text-left transition-all duration-200 flex items-center justify-between group disabled:opacity-40 cursor-pointer"
                    >
                      <div className="space-y-1">
                        <span className="text-xs font-bold text-slate-200 block group-hover:text-cyan-300">{cmd.label}</span>
                        <p className="text-[10px] text-slate-400 max-w-xs truncate font-medium">{cmd.text}</p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-slate-400 group-hover:text-cyan-400 shrink-0 ml-2" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Custom Speech Section */}
              <div className="space-y-4 pt-4 border-t border-white/10 font-sans">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">Custom Voice Broadcast</span>
                  </div>
                  
                  {/* Voice actor selection */}
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-slate-300">Robot Voice actor:</span>
                    <div className="flex items-center border border-white/10 rounded-xl overflow-hidden bg-white/3 font-bold">
                      {['Kore', 'Puck', 'Fenrir', 'Zephyr'].map((v) => (
                        <button
                          key={v}
                          onClick={() => setSelectedVoice(v)}
                          className={`px-3 py-1.5 text-[11px] border-r last:border-0 border-white/10 transition-all duration-200 cursor-pointer ${
                            selectedVoice === v 
                              ? 'bg-cyan-500 text-slate-950 font-black' 
                              : 'text-slate-300 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          {v === 'Kore' ? 'Kore (Gentle)' : v === 'Puck' ? 'Puck (Kid)' : v === 'Fenrir' ? 'Fenrir (Old)' : 'Zephyr (Sooth)'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Text area and broadcast trigger */}
                <div className="space-y-3">
                  <textarea
                    id="tts-textarea"
                    placeholder="Type anything you want GuardianBot to speak aloud on the speaker... (e.g., 'Emma, your dinner is warm and ready on the kitchen table!')"
                    value={customText}
                    onChange={(e) => setCustomText(e.target.value)}
                    maxLength={180}
                    disabled={isGeneratingTTS}
                    className="w-full h-24 p-4 bg-slate-950/40 border border-white/10 rounded-2xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 resize-none font-medium"
                  />
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-bold font-mono uppercase tracking-wider">
                      {customText.length}/180 characters maximum
                    </span>
                    <button
                      onClick={() => handleBroadcastTTS(customText)}
                      disabled={!robot.isOnline || isGeneratingTTS || !customText.trim()}
                      className="px-5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/15 transition-all duration-200 flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                    >
                      {isGeneratingTTS ? (
                        <>
                          <span className="h-4 w-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                          Synthesizing Vocals...
                        </>
                      ) : (
                        <>
                          <Send className="h-4 w-4" />
                          Transmit on Robot Speaker
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* TTS Status Logs */}
                {ttsFeedback && (
                  <div className="p-3.5 bg-white/5 border border-white/10 rounded-xl flex items-center gap-2.5 text-xs text-cyan-300 font-medium">
                    <Compass className="h-4 w-4 text-cyan-400 shrink-0" />
                    <span>{ttsFeedback}</span>
                  </div>
                )}
              </div>
            </div>

            {/* Hidden HTML5 audio element */}
            <audio 
              ref={audioRef} 
              onEnded={() => setIsPlaying(false)}
              className="hidden" 
              controls
            />
          </div>
        )}

        {/* TAB 2: BEDTIME STORYTELLER */}
        {activeTab === 'story' && (
          <div className="space-y-6">
            {/* Story Configuration form */}
            <div className="glass rounded-3xl p-6 shadow-xl space-y-6 font-sans">
              <div>
                <h3 className="font-sans font-bold text-white text-lg">GuardianBot AI Bedtime Storyteller</h3>
                <p className="text-xs text-slate-300 mt-0.5">Let Gemini craft unique, comforting bedtime lullabies or educational stories for your loved ones.</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Name */}
                <div className="space-y-1.5">
                  <label htmlFor="companion-name-input" className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <User className="h-3.5 w-3.5 text-cyan-400" /> Name of Companion
                  </label>
                  <input
                    id="companion-name-input"
                    type="text"
                    value={storyName}
                    onChange={(e) => setStoryName(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-200"
                    placeholder="Emma"
                  />
                </div>

                {/* Age */}
                <div className="space-y-1.5">
                  <label htmlFor="companion-age-input" className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-cyan-400" /> Age
                  </label>
                  <input
                    id="companion-age-input"
                    type="number"
                    value={storyAge}
                    onChange={(e) => setStoryAge(Number(e.target.value))}
                    min={1}
                    max={110}
                    className="w-full px-3.5 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-200"
                  />
                </div>

                {/* Theme Selector */}
                <div className="space-y-1.5">
                  <label htmlFor="story-theme-select" className="text-xs font-bold text-slate-300 flex items-center gap-1">
                    <Smile className="h-3.5 w-3.5 text-cyan-400" /> Story Topic Theme
                  </label>
                  <select
                    id="story-theme-select"
                    value={storyTheme}
                    onChange={(e) => setStoryTheme(e.target.value)}
                    className="w-full px-3.5 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer transition-all duration-200"
                  >
                    <option value="nursery" className="bg-slate-900 text-white">🌟 Cozy Bedtime Lullaby</option>
                    <option value="space" className="bg-slate-900 text-white">🚀 Outer Space Rocket Adventure</option>
                    <option value="friendship" className="bg-slate-900 text-white">🐿️ Bear & Squirrel Friendship</option>
                    <option value="hygiene" className="bg-slate-900 text-white">🪥 Toothbrushing Bear Hero</option>
                  </select>
                </div>
              </div>

              {/* Custom Details */}
              <div className="space-y-1.5">
                <label htmlFor="custom-details-textarea" className="text-xs font-bold text-slate-300 flex items-center gap-1">
                  <Sparkles className="h-3.5 w-3.5 text-cyan-400" /> Include Specific Details or Characters (Optional)
                </label>
                <input
                  id="custom-details-textarea"
                  type="text"
                  value={customDetails}
                  onChange={(e) => setCustomDetails(e.target.value)}
                  placeholder="e.g. Include a pink teddy bear named Snuggles, or grandfather talks about gardening"
                  className="w-full px-4 py-3 bg-slate-950/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-200"
                />
              </div>

              <div className="flex justify-end pt-2">
                <button
                  onClick={handleGenerateStory}
                  disabled={isGeneratingStory || !storyName}
                  className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/15 transition-all duration-200 flex items-center gap-2 disabled:opacity-40 cursor-pointer"
                >
                  {isGeneratingStory ? (
                    <>
                      <span className="h-4 w-4 border-2 border-slate-950/30 border-t-slate-950 rounded-full animate-spin" />
                      Gemini Telling Story...
                    </>
                  ) : (
                    <>
                      <BookOpen className="h-4 w-4" />
                      Generate Story with Gemini AI
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Generated Story book render */}
            {generatedStory && (
              <div className="glass rounded-3xl p-8 shadow-2xl border border-white/15 space-y-6 animate-fade-in bg-gradient-to-br from-indigo-950/40 via-slate-900/40 to-slate-950/60 backdrop-blur-xl">
                <div className="flex items-center justify-between border-b border-white/10 pb-4">
                  <div className="flex items-center gap-2.5">
                    <BookOpen className="h-6 w-6 text-cyan-400" />
                    <div>
                      <h4 className="font-serif font-bold text-white text-lg">The Adventures of {storyName}</h4>
                      <p className="text-[10px] text-cyan-400 font-bold uppercase tracking-wider font-mono">Custom Story for {storyAge} yr old</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {/* Equalizer when reading story */}
                    {isReadingStory && (
                      <div className="flex items-end gap-1 h-5 w-16 bg-white/5 px-2 py-1 rounded-xl border border-white/15 mr-2 shrink-0">
                        {equalizerBars.slice(0, 5).map((barHeight, idx) => (
                          <span 
                            key={idx} 
                            style={{ height: `${barHeight / 2}px` }}
                            className="w-1 bg-cyan-400 rounded-full transition-all duration-100"
                          />
                        ))}
                      </div>
                    )}

                    <button
                      onClick={toggleReadStoryAloud}
                      className="px-4 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs rounded-xl shadow transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
                    >
                      {isReadingStory ? (
                        <>
                          <Pause className="h-3.5 w-3.5" /> Stop Narrative
                        </>
                      ) : (
                        <>
                          <Play className="h-3.5 w-3.5" /> Play Story Audio
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Story Body with classical serif look */}
                <div className="font-serif text-slate-200 text-base leading-relaxed space-y-4 max-w-3xl whitespace-pre-line select-text" id="story-body">
                  {generatedStory}
                </div>

                <div className="pt-4 border-t border-white/10 flex items-center justify-between text-xs text-slate-400 font-serif italic">
                  <span>GuardianBot Sleep-Easy Tales</span>
                  <span>Companion Unit: {robot.name}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
