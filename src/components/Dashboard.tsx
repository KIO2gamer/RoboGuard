/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { 
  Camera, CameraOff, Mic, MicOff, Volume2, VolumeX, Brain, 
  Battery, Cpu, Wifi, MapPin, Play, Square, AlertTriangle, 
  RefreshCw, Activity, ShieldAlert, HeartPulse, UserCheck, Flame,
  Grid, ZoomIn, Eye, EyeOff, Sparkles, ChevronUp, ChevronDown, 
  ChevronLeft, ChevronRight, Image as ImageIcon, Crosshair, Bell
} from 'lucide-react';
import { RobotModel, DetectionModel, DetectionType, DETECTION_DISPLAY_NAMES } from '../types';

interface DashboardProps {
  robot: RobotModel;
  latestDetection: DetectionModel | null;
  onToggleCamera: (active: boolean) => void;
  onToggleMicrophone: (active: boolean) => void;
  onToggleSpeaker: (active: boolean) => void;
  onToggleAI: (active: boolean) => void;
  onToggleCharging: (charging: boolean) => void;
  onChangeRoom: (room: string) => void;
  onTriggerSimulatedDetection: (type: DetectionType) => void;
  onReconnect: () => void;
}

interface CameraChannel {
  id: string;
  name: string;
  room: string;
  resolution: string;
  baseFps: number;
  icon: React.ReactNode;
}

const CAMERA_CHANNELS: CameraChannel[] = [
  { id: 'cam_nursery', name: 'Nursery Cam 01', room: 'Nursery', resolution: '1080p', baseFps: 30, icon: <UserCheck className="h-4 w-4" /> },
  { id: 'cam_living', name: 'Lounge Cam 02', room: 'Living Room', resolution: '1080p', baseFps: 30, icon: <Activity className="h-4 w-4" /> },
  { id: 'cam_kitchen', name: 'Stove Cam 03', room: 'Kitchen', resolution: '4K', baseFps: 60, icon: <Flame className="h-4 w-4" /> },
  { id: 'cam_bedroom', name: 'Suite Cam 04', room: 'Bedroom', resolution: '1080p', baseFps: 30, icon: <HeartPulse className="h-4 w-4" /> },
  { id: 'cam_door', name: 'Porch Cam 05', room: 'Front Door', resolution: '1080p', baseFps: 24, icon: <Eye className="h-4 w-4" /> }
];

export default function Dashboard({
  robot,
  latestDetection,
  onToggleCamera,
  onToggleMicrophone,
  onToggleSpeaker,
  onToggleAI,
  onToggleCharging,
  onChangeRoom,
  onTriggerSimulatedDetection,
  onReconnect
}: DashboardProps) {
  const [viewMode, setViewMode] = useState<'grid' | 'focus'>('grid');
  const [focusedCameraId, setFocusedCameraId] = useState<string>('cam_nursery');
  const [timestamp, setTimestamp] = useState(new Date());
  
  // High-tech customization states
  const [nightVisionMap, setNightVisionMap] = useState<Record<string, boolean>>({
    cam_nursery: false,
    cam_living: false,
    cam_kitchen: false,
    cam_bedroom: true, // defaulted for rest
    cam_door: false
  });
  
  const [ptzOffsets, setPtzOffsets] = useState<Record<string, { x: number, y: number, zoom: number }>>({
    cam_nursery: { x: 0, y: 0, zoom: 1.0 },
    cam_living: { x: 0, y: 0, zoom: 1.0 },
    cam_kitchen: { x: 0, y: 0, zoom: 1.0 },
    cam_bedroom: { x: 0, y: 0, zoom: 1.0 },
    cam_door: { x: 0, y: 0, zoom: 1.0 }
  });

  const [shutterFlash, setShutterFlash] = useState(false);
  const [snapshots, setSnapshots] = useState<Array<{ id: string, cameraName: string, timestamp: string }>>([]);
  const [sirenActive, setSirenActive] = useState(false);

  // Keep a running clock in the video feed
  useEffect(() => {
    const timer = setInterval(() => {
      setTimestamp(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync focused camera's room with robot location
  const focusedCamera = CAMERA_CHANNELS.find(c => c.id === focusedCameraId) || CAMERA_CHANNELS[0];
  
  const selectCamera = (id: string, room: string) => {
    setFocusedCameraId(id);
    onChangeRoom(room);
    setViewMode('focus');
  };

  // Take Snapshot trigger
  const triggerSnapshot = () => {
    setShutterFlash(true);
    const newSnapshot = {
      id: `snap_${Date.now()}`,
      cameraName: focusedCamera.name,
      timestamp: new Date().toLocaleTimeString()
    };
    setSnapshots(prev => [newSnapshot, ...prev].slice(0, 4));
    setTimeout(() => setShutterFlash(false), 250);
  };

  // Warning Siren trigger
  const triggerLocalSiren = () => {
    setSirenActive(true);
    setTimeout(() => setSirenActive(false), 4000);
  };

  const getWifiIcon = (strength: number) => {
    return <Wifi className={`h-4 w-4 ${strength > 80 ? 'text-cyan-400' : strength > 50 ? 'text-amber-400' : 'text-rose-400'}`} />;
  };

  const getBatteryIcon = (percentage: number, charging: boolean) => {
    let color = 'text-emerald-400';
    if (percentage < 25) color = 'text-rose-400 animate-pulse';
    else if (percentage < 60) color = 'text-amber-400';

    return (
      <div className="flex items-center gap-1.5 font-mono">
        <Battery className={`h-4.5 w-4.5 ${color} ${charging ? 'animate-bounce' : ''}`} />
        <span className="text-xs font-bold text-white">{percentage}%</span>
        {charging && <span className="text-[10px] text-amber-400 font-bold animate-pulse">⚡</span>}
      </div>
    );
  };

  // Check if active detection belongs to a specific room and is fresh (< 12s)
  const isDetectionActiveForRoom = (room: string) => {
    return latestDetection && 
      latestDetection.roomName === room && 
      (Date.now() - new Date(latestDetection.timestamp).getTime() < 12000);
  };

  const activeDetectionIsCritical = latestDetection && latestDetection.severity === 'critical';

  return (
    <div className="space-y-6" id="dashboard-main-view">
      
      {/* HIGH-LEVEL WARNING PANEL IF DANGER DETECTED */}
      {latestDetection && isDetectionActiveForRoom(latestDetection.roomName) && latestDetection.severity === 'critical' && (
        <div className="bg-gradient-to-r from-rose-950/90 to-slate-950/90 border-2 border-rose-500 rounded-3xl p-5 shadow-2xl flex flex-col md:flex-row items-center justify-between gap-4 animate-pulse backdrop-blur-md">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="p-3 bg-rose-500/20 rounded-2xl border border-rose-500 text-rose-400 animate-bounce">
              <ShieldAlert className="h-8 w-8" />
            </div>
            <div>
              <h4 className="text-rose-400 font-black tracking-wider text-base uppercase font-mono">⚠️ PRIORITY RESCUE FEED ALARM</h4>
              <p className="text-white text-sm font-semibold mt-0.5 leading-relaxed">
                Critical incident <strong className="text-rose-400">"{DETECTION_DISPLAY_NAMES[latestDetection.type]}"</strong> logged in <strong className="text-cyan-300 font-bold">{latestDetection.roomName}</strong>. Automatic safety sequence engaged!
              </p>
            </div>
          </div>
          <button 
            onClick={() => selectCamera(CAMERA_CHANNELS.find(c => c.room === latestDetection.roomName)?.id || 'cam_nursery', latestDetection.roomName)}
            className="px-5 py-2.5 bg-rose-600 hover:bg-rose-500 text-white font-black text-xs uppercase tracking-wider rounded-xl shadow-lg shadow-rose-600/30 transition-all duration-150 flex items-center gap-1.5 cursor-pointer"
          >
            <Crosshair className="h-4 w-4 animate-spin-slow" />
            Intercept Camera Stream
          </button>
        </div>
      )}

      {/* TOP VIEW MODE TOGGLES BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white/3 border border-white/5 p-4 rounded-3xl backdrop-blur-xl">
        <div className="space-y-1">
          <h2 className="text-white text-lg font-black tracking-tight flex items-center gap-2">
            <Camera className="h-5.5 w-5.5 text-cyan-400 animate-pulse" />
            Guardian Surveillance Center
          </h2>
          <p className="text-xs text-slate-300 font-medium">Coordinate live feeds, manage stationary thermal checks, and monitor robot telemetry.</p>
        </div>
        
        <div className="flex items-center gap-2 font-sans">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'grid' 
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/15' 
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <Grid className="h-4 w-4" />
            Multi-Camera Grid
          </button>
          <button
            onClick={() => setViewMode('focus')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer ${
              viewMode === 'focus' 
                ? 'bg-cyan-500 text-slate-950 font-black shadow-lg shadow-cyan-500/15' 
                : 'bg-white/5 text-slate-300 hover:bg-white/10'
            }`}
          >
            <ZoomIn className="h-4 w-4" />
            Focus View ({focusedCamera.room})
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* LEFT COMPONENT: STREAMS WALL OR DETAILED FOCUS FEED */}
        <div className="lg:col-span-8 space-y-6">
          
          {/* MULTI-CAMERA GRID MATRIX VIEW */}
          {viewMode === 'grid' && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6" id="cameras-grid-wall">
              {CAMERA_CHANNELS.map((cam) => {
                const isAlarmActive = isDetectionActiveForRoom(cam.room);
                const isCriticalAlarm = isAlarmActive && latestDetection?.severity === 'critical';
                const isNightVision = nightVisionMap[cam.id];
                const ptz = ptzOffsets[cam.id];

                return (
                  <div 
                    key={cam.id}
                    onClick={() => selectCamera(cam.id, cam.room)}
                    className={`glass rounded-2xl overflow-hidden shadow-xl border cursor-pointer group relative flex flex-col justify-between transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl ${
                      isCriticalAlarm 
                        ? 'border-rose-500 animate-[siren-strobe_1s_infinite_alternate]' 
                        : isAlarmActive 
                          ? 'border-amber-400 bg-amber-500/5' 
                          : 'border-white/10 hover:border-cyan-500/40 bg-slate-950/20'
                    }`}
                  >
                    {/* Thumbnail camera scan lines */}
                    <div className="absolute inset-0 pointer-events-none bg-camera-scanlines opacity-[0.05] z-10" />

                    {/* Channel Header overlay */}
                    <div className="bg-black/40 px-4 py-2.5 flex items-center justify-between z-10 border-b border-white/5">
                      <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                        <span className={`h-2 w-2 rounded-full ${
                          isCriticalAlarm ? 'bg-rose-500 animate-ping' : isAlarmActive ? 'bg-amber-400 animate-pulse' : 'bg-emerald-400'
                        }`} />
                        {cam.name}
                      </span>
                      <span className="text-[9px] font-mono font-bold text-white/40 bg-white/5 px-2 py-0.5 rounded-md">
                        {cam.resolution} • {cam.baseFps} FPS
                      </span>
                    </div>

                    {/* Camera stream snapshot canvas rendering */}
                    <div className="aspect-video w-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
                      
                      {/* Active green night-vision matrix tint */}
                      <div className={`absolute inset-0 transition-opacity duration-300 pointer-events-none z-10 ${
                        isNightVision ? 'bg-emerald-950/25 border-emerald-500/10' : 'bg-transparent'
                      }`} />

                      {/* Graphic representations depending on room */}
                      <div 
                        style={{ transform: `translate(${ptz.x}px, ${ptz.y}px) scale(${ptz.zoom})` }}
                        className={`absolute inset-0 bg-slate-900 flex items-center justify-center transition-transform duration-300 ${
                          isNightVision ? 'grayscale sepia-green brightness-125 contrast-125 text-emerald-300' : 'text-slate-300'
                        }`}
                      >
                        <div className="text-center space-y-2 z-10 scale-90">
                          {cam.room === 'Nursery' && (
                            <>
                              <div className={`w-10 h-10 bg-gradient-to-tr rounded-full shadow-lg mx-auto ${
                                isNightVision ? 'from-emerald-700 to-emerald-500 shadow-emerald-500/10' : 'from-amber-400 to-amber-200 shadow-amber-400/10 animate-bounce'
                              }`} />
                              <p className="text-[10px] font-mono tracking-wider font-bold">Emma's Crib View</p>
                            </>
                          )}
                          {cam.room === 'Living Room' && (
                            <>
                              <div className="w-12 h-6 bg-slate-800/60 rounded border border-white/15 mx-auto" />
                              <p className="text-[10px] font-mono tracking-wider font-bold">Lounge Area</p>
                            </>
                          )}
                          {cam.room === 'Kitchen' && (
                            <>
                              <div className="w-8 h-8 bg-orange-950/20 border border-orange-500/30 rounded-lg mx-auto flex items-center justify-center">
                                <Flame className="h-4.5 w-4.5 text-orange-400 animate-pulse" />
                              </div>
                              <p className="text-[10px] font-mono tracking-wider font-bold">Stove Safety Feed</p>
                            </>
                          )}
                          {cam.room === 'Bedroom' && (
                            <>
                              <div className="w-10 h-10 bg-indigo-950/20 border border-indigo-500/20 rounded-full mx-auto flex items-center justify-center">
                                <HeartPulse className="h-5 w-5 text-indigo-400 animate-pulse" />
                              </div>
                              <p className="text-[10px] font-mono tracking-wider font-bold">Sleep Rest Monitor</p>
                            </>
                          )}
                          {cam.room === 'Front Door' && (
                            <>
                              <div className="w-8 h-8 bg-cyan-950/20 border border-cyan-500/20 rounded-md mx-auto flex items-center justify-center">
                                <Eye className="h-4 w-4 text-cyan-400 animate-pulse" />
                              </div>
                              <p className="text-[10px] font-mono tracking-wider font-bold">Porch Entrance</p>
                            </>
                          )}
                        </div>
                      </div>

                      {/* Active Alarm indicators */}
                      {isAlarmActive && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
                          <div className={`w-32 h-24 border border-dashed rounded-lg flex flex-col justify-between p-2 animate-pulse ${
                            isCriticalAlarm ? 'border-rose-500 bg-rose-500/10' : 'border-amber-500 bg-amber-500/10'
                          }`}>
                            <span className="text-[8px] font-bold bg-rose-600 text-white px-1 py-0.5 rounded w-fit uppercase tracking-widest font-mono">
                              {latestDetection!.severity === 'critical' ? '⚠️ DANGER' : '🔍 ALARM'}
                            </span>
                            <span className="text-[9px] font-bold text-white text-center tracking-wider bg-black/60 rounded">
                              {DETECTION_DISPLAY_NAMES[latestDetection!.type]}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Camera Footer */}
                    <div className="bg-black/30 px-4 py-2 text-slate-400 text-[10px] font-semibold border-t border-white/5 flex items-center justify-between">
                      <span className="flex items-center gap-1 text-slate-300">
                        <MapPin className="h-3.5 w-3.5 text-cyan-400 shrink-0" />
                        {cam.room} Station
                      </span>
                      <span className="text-cyan-400 group-hover:underline flex items-center gap-1 font-bold">
                        Open Feed <ChevronRight className="h-3 w-3" />
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* SINGLE TARGET DETAILED FOCUS VIEW */}
          {viewMode === 'focus' && (
            <div className="space-y-6">
              <div className="glass rounded-3xl overflow-hidden shadow-2xl relative" id="single-focus-feed-box">
                {/* Header bar */}
                <div className="bg-white/3 px-5 py-4 border-b border-white/10 flex items-center justify-between z-10">
                  <div className="flex items-center gap-2.5">
                    <button 
                      onClick={() => setViewMode('grid')}
                      className="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition cursor-pointer flex items-center gap-1"
                    >
                      <Grid className="h-3.5 w-3.5 text-cyan-400" />
                      Back to Grid
                    </button>
                    <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-300">
                      Channel Focused: {focusedCamera.name}
                    </span>
                  </div>
                  <div className="flex items-center gap-4 text-xs font-mono text-slate-300 font-bold">
                    <span className="flex items-center gap-1 bg-cyan-500/10 px-2 py-0.5 rounded-lg text-cyan-400">
                      <MapPin className="h-3.5 w-3.5" />
                      {focusedCamera.room}
                    </span>
                    <span>{timestamp.toISOString().replace('T', ' ').substring(0, 19)} UTC</span>
                  </div>
                </div>

                {/* Shutter flash overlay effect */}
                {shutterFlash && (
                  <div className="absolute inset-0 bg-white z-40 animate-pulse pointer-events-none" />
                )}

                {/* Stream monitor frame */}
                <div className="aspect-video w-full bg-slate-950 relative flex items-center justify-center overflow-hidden">
                  <div className="absolute inset-0 pointer-events-none bg-camera-scanlines opacity-[0.06] z-20" />
                  
                  {/* PTZ and Night-Vision simulated stream canvas */}
                  <div 
                    style={{ 
                      transform: `translate(${ptzOffsets[focusedCameraId].x}px, ${ptzOffsets[focusedCameraId].y}px) scale(${ptzOffsets[focusedCameraId].zoom})` 
                    }}
                    className={`absolute inset-0 bg-slate-900 flex flex-col justify-between p-6 transition-transform duration-300 ${
                      nightVisionMap[focusedCameraId] ? 'grayscale sepia-green brightness-125 contrast-125 text-emerald-300' : 'text-slate-300'
                    }`}
                  >
                    <div className="absolute inset-0 bg-gradient-to-b from-indigo-950/20 via-slate-900/40 to-slate-950/80 pointer-events-none" />

                    {/* Room Layout graphics */}
                    <div className="w-full h-full flex flex-col items-center justify-center relative">
                      <div className="text-center space-y-3 z-10">
                        {focusedCamera.room === 'Nursery' && (
                          <>
                            <div className={`w-16 h-16 rounded-full shadow-lg mx-auto ${
                              nightVisionMap[focusedCameraId] ? 'bg-emerald-500/20 animate-pulse' : 'bg-gradient-to-tr from-amber-400 to-amber-200 shadow-amber-400/30 animate-bounce'
                            }`} />
                            <p className="text-xs font-mono font-bold tracking-wider">Emma's Crib Security Area</p>
                          </>
                        )}
                        {focusedCamera.room === 'Living Room' && (
                          <>
                            <div className="w-20 h-10 bg-indigo-950/40 border border-indigo-500/30 rounded-xl mx-auto" />
                            <p className="text-xs font-mono font-bold tracking-wider">Living Lounge Main Floor</p>
                          </>
                        )}
                        {focusedCamera.room === 'Kitchen' && (
                          <>
                            <div className="w-14 h-14 bg-orange-950/20 border border-orange-500/20 rounded-lg mx-auto flex items-center justify-center">
                              <Flame className="h-7 w-7 text-orange-400 animate-pulse" />
                            </div>
                            <p className="text-xs font-mono font-bold tracking-wider">Kitchen Cooker Zone</p>
                          </>
                        )}
                        {focusedCamera.room === 'Bedroom' && (
                          <>
                            <div className="w-16 h-16 bg-indigo-950/40 border border-indigo-500/20 rounded-full mx-auto flex items-center justify-center">
                              <HeartPulse className="h-8 w-8 text-indigo-400 animate-pulse" />
                            </div>
                            <p className="text-xs font-mono font-bold tracking-wider">Bedtime Sleep Monitor</p>
                          </>
                        )}
                        {focusedCamera.room === 'Front Door' && (
                          <>
                            <div className="w-12 h-12 bg-cyan-950/20 border border-cyan-500/20 rounded-lg mx-auto flex items-center justify-center">
                              <Eye className="h-6 w-6 text-cyan-400 animate-pulse" />
                            </div>
                            <p className="text-xs font-mono font-bold tracking-wider">Entrance Security Zone</p>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Active detection overlay */}
                  {isDetectionActiveForRoom(focusedCamera.room) && (
                    <div className="absolute inset-0 flex items-center justify-center z-10 pointer-events-none">
                      <div className={`w-64 h-64 border-2 rounded-2xl flex flex-col justify-between p-3.5 animate-pulse ${
                        latestDetection!.severity === 'critical' ? 'border-rose-500 bg-rose-500/15' : 'border-amber-500 bg-amber-500/15'
                      }`}>
                        <div className="flex justify-between items-start">
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono text-white ${
                            latestDetection!.severity === 'critical' ? 'bg-rose-600' : 'bg-amber-600'
                          }`}>
                            {DETECTION_DISPLAY_NAMES[latestDetection!.type]} ({(latestDetection!.confidence * 100).toFixed(1)}%)
                          </span>
                          <span className="text-white text-[10px] font-bold bg-black/60 px-1.5 py-0.5 rounded-lg backdrop-blur-sm">
                            CONFIRMED LOG
                          </span>
                        </div>
                        <div className="text-center text-xs tracking-widest font-mono text-white font-bold py-1 uppercase opacity-90">
                          {latestDetection!.severity === 'critical' ? '⚠️ CRITICAL RISK' : '🔍 ANOMALY DETECTED'}
                        </div>
                      </div>
                    </div>
                  )}



                  {/* High level siren active flashing */}
                  {sirenActive && (
                    <div className="absolute inset-0 bg-rose-500/10 border-4 border-rose-500 z-30 animate-pulse pointer-events-none flex items-center justify-center">
                      <div className="bg-slate-950/90 border border-rose-500/40 text-rose-400 font-bold px-5 py-3 rounded-2xl flex items-center gap-2 shadow-2xl font-mono text-sm animate-bounce">
                        <ShieldAlert className="h-5 w-5 text-rose-500 animate-ping" />
                        Robot Warning Siren Emitting...
                      </div>
                    </div>
                  )}

                  {/* Rec indicators overlay */}
                  <div className="absolute top-4 left-4 z-10 pointer-events-none flex flex-col gap-1 font-mono">
                    <div className="text-white text-xs font-bold bg-slate-950/80 px-2.5 py-1 rounded-xl backdrop-blur-md shadow border border-white/15 flex items-center gap-1.5">
                      <span className="h-2 w-2 rounded-full bg-rose-500 animate-pulse" />
                      REC FEED
                    </div>
                  </div>
                </div>

                {/* Tactical Camera Toolbar Controls */}
                <div className="bg-white/3 px-5 py-4 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setNightVisionMap(prev => ({ ...prev, [focusedCameraId]: !prev[focusedCameraId] }))}
                      className={`text-xs px-3.5 py-2 rounded-xl border font-bold transition flex items-center gap-1.5 cursor-pointer ${
                        nightVisionMap[focusedCameraId]
                          ? 'bg-emerald-500/15 border-emerald-500/40 text-emerald-300 font-black shadow-lg shadow-emerald-500/5'
                          : 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                      }`}
                    >
                      {nightVisionMap[focusedCameraId] ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                      Night Vision Mode
                    </button>

                    <button
                      onClick={triggerSnapshot}
                      className="text-xs px-3.5 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer"
                    >
                      <ImageIcon className="h-4 w-4 text-cyan-400" />
                      Take Live Snapshot
                    </button>
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={triggerLocalSiren}
                      className="text-xs px-3.5 py-2 bg-rose-500/10 hover:bg-rose-500/25 border border-rose-500/30 text-rose-200 font-bold rounded-xl transition flex items-center gap-1.5 cursor-pointer animate-pulse"
                    >
                      <ShieldAlert className="h-4 w-4 text-rose-400" />
                      Trigger Warning Siren
                    </button>
                  </div>
                </div>
              </div>


            </div>
          )}

        </div>

        {/* RIGHT COLUMN: TELEMETRY CONTROL PANEL & PANIC BUTTON */}
        <div className="lg:col-span-4 space-y-6">
          
          {/* CRITICAL SOS PANIC BUTTON PANEL (Requirement 2) */}
          <div className="bg-gradient-to-br from-rose-950/70 to-slate-950/80 rounded-3xl p-6 shadow-2xl border border-rose-500/25 space-y-4 text-center relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="absolute inset-0 bg-camera-scanlines opacity-[0.03] pointer-events-none" />
            
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-1.5 text-rose-400 font-bold">
                <ShieldAlert className="h-5 w-5 animate-pulse" />
                <span className="text-xs font-black tracking-widest font-mono uppercase">EMERGENCY CORE CODES</span>
              </div>
              <h3 className="text-white font-extrabold text-lg leading-tight font-sans">Caregiver SOS Panic Manual Switch</h3>
              <p className="text-slate-300 text-xs font-sans font-medium">
                Instantly trigger a manual critical hazard state. GuardianBot will automatically compile incident details, broadcast voice instructions inside the house, and sequentially dial help.
              </p>
            </div>

            <button
              onClick={() => onTriggerSimulatedDetection(DetectionType.fallDetected)}
              disabled={!robot.isOnline}
              className="w-full py-4 bg-gradient-to-r from-rose-600 to-red-500 hover:from-rose-500 hover:to-red-400 text-white font-black text-sm uppercase tracking-widest rounded-2xl shadow-xl shadow-rose-600/30 hover:scale-102 transition duration-200 cursor-pointer disabled:opacity-40"
            >
              🔥 ACTIVATE MANUAL SOS PANIC
            </button>
          </div>

          {/* TELEMETRY CONTROLS */}
          <div className="glass rounded-3xl p-6 shadow-xl space-y-4" id="telemetry-controls-box">
            <h3 className="font-sans font-bold text-white text-lg">Nursery Telemetry</h3>
            
            <div className="space-y-3 font-sans">
              <div className="flex items-center justify-between p-3 bg-white/3 border border-white/5 rounded-2xl">
                <span className="text-slate-300 text-xs font-bold">Hardware Connection</span>
                <span className={`text-[10px] font-bold uppercase px-3 py-0.5 rounded-full ${
                  robot.isOnline ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 animate-pulse'
                }`}>
                  {robot.isOnline ? 'ONLINE' : 'OFFLINE'}
                </span>
              </div>

              {/* Station select dropdown */}
              <div className="flex items-center justify-between p-3 bg-white/3 border border-white/5 rounded-2xl">
                <label htmlFor="dashboard-room-select" className="text-slate-300 text-xs font-bold">Primary Camera Channel</label>
                <select
                  id="dashboard-room-select"
                  value={robot.currentRoom}
                  onChange={(e) => {
                    onChangeRoom(e.target.value);
                    const matchedCam = CAMERA_CHANNELS.find(c => c.room === e.target.value);
                    if (matchedCam) {
                      setFocusedCameraId(matchedCam.id);
                    }
                  }}
                  disabled={!robot.isOnline}
                  className="bg-slate-900/90 text-white text-xs font-bold py-1.5 px-3 border border-white/10 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-cyan-500 cursor-pointer transition"
                >
                  {['Nursery', 'Living Room', 'Bedroom', 'Kitchen'].map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              {/* Battery */}
              <div className="flex items-center justify-between p-3 bg-white/3 border border-white/5 rounded-2xl">
                <span className="text-slate-300 text-xs font-bold">Robot Battery</span>
                <div className="flex items-center gap-3">
                  {getBatteryIcon(robot.batteryPercentage, robot.isCharging)}
                  {robot.isOnline && (
                    <button 
                      onClick={() => onToggleCharging(!robot.isCharging)}
                      className="text-[9px] bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black px-2 py-1 rounded-lg transition"
                    >
                      {robot.isCharging ? 'Unplug' : 'Plug in'}
                    </button>
                  )}
                </div>
              </div>

              {/* CPU Temp */}
              <div className="flex items-center justify-between p-3 bg-white/3 border border-white/5 rounded-2xl">
                <span className="text-slate-300 text-xs font-bold">CPU Core Heat</span>
                <span className="font-mono text-xs font-bold text-white">
                  {robot.isOnline ? `${robot.cpuTemperature.toFixed(1)}°C` : '--'}
                </span>
              </div>

              {/* WiFi */}
              <div className="flex items-center justify-between p-3 bg-white/3 border border-white/5 rounded-2xl">
                <span className="text-slate-300 text-xs font-bold">WiFi Signal</span>
                <div className="flex items-center gap-2">
                  {getWifiIcon(robot.wifiSignalStrength)}
                  <span className="font-mono text-xs font-bold text-white">
                    {robot.isOnline ? `${robot.wifiSignalStrength}%` : '--'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* RECENT CAPTURES/SNAPSHOTS BOX */}
          <div className="glass rounded-3xl p-5 shadow-xl space-y-4">
            <div className="flex items-center justify-between border-b border-white/10 pb-3">
              <span className="text-[11px] font-bold text-slate-400 tracking-wider uppercase font-mono flex items-center gap-1.5">
                <ImageIcon className="h-4 w-4 text-cyan-400" />
                Logged Snapshots ({snapshots.length})
              </span>
            </div>

            {snapshots.length === 0 ? (
              <div className="text-center py-4 font-sans text-xs text-white/30 font-semibold italic">
                No active snapshots captured this session.
              </div>
            ) : (
              <div className="space-y-2.5">
                {snapshots.map((snap) => (
                  <div key={snap.id} className="p-3 bg-white/3 rounded-xl border border-white/5 flex items-center justify-between text-xs font-sans">
                    <div>
                      <span className="text-white font-bold block">{snap.cameraName}</span>
                      <span className="text-[10px] text-slate-400 font-mono font-medium block">Timestamp: {snap.timestamp}</span>
                    </div>
                    <span className="text-[10px] bg-cyan-500/10 text-cyan-300 px-2 py-0.5 rounded-lg border border-cyan-500/20 font-bold">
                      SAVED
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
