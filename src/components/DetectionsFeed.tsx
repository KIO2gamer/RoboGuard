/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Search, ShieldAlert, AlertTriangle, Info, Bell, Trash2, 
  CheckCircle, Filter, Baby, UserMinus, Flame, Shield, 
  Compass, Eye, Clock, Sparkles
} from 'lucide-react';
import { DetectionModel, DetectionType, DetectionSeverity, DETECTION_DISPLAY_NAMES } from '../types';

interface DetectionsFeedProps {
  detections: DetectionModel[];
  onClearAll: () => void;
  onAcknowledgeAll: () => void;
  onAcknowledgeItem: (id: string) => void;
}

export default function DetectionsFeed({
  detections,
  onClearAll,
  onAcknowledgeAll,
  onAcknowledgeItem
}: DetectionsFeedProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [severityFilter, setSeverityFilter] = useState<string>('all');
  const [roomFilter, setRoomFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');

  const getDetectionIcon = (type: DetectionType) => {
    switch (type) {
      case DetectionType.fire:
      case DetectionType.smoke:
        return <Flame className="h-5 w-5 text-rose-400 animate-pulse" />;
      case DetectionType.fallDetected:
        return <AlertTriangle className="h-5 w-5 text-rose-400 animate-bounce" />;
      case DetectionType.childCrying:
      case DetectionType.loudDistress:
        return <AlertTriangle className="h-5 w-5 text-amber-400 animate-pulse" />;
      case DetectionType.unknownPerson:
        return <UserMinus className="h-5 w-5 text-amber-400" />;
      case DetectionType.childPresence:
        return <Baby className="h-5 w-5 text-cyan-400" />;
      case DetectionType.dangerousObject:
        return <ShieldAlert className="h-5 w-5 text-rose-400" />;
      default:
        return <Eye className="h-5 w-5 text-indigo-400" />;
    }
  };

  const getSeverityBadge = (severity: DetectionSeverity) => {
    switch (severity) {
      case DetectionSeverity.critical:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-rose-500/20 text-rose-300 px-2.5 py-1 rounded-full animate-pulse border border-rose-500/30">
            <ShieldAlert className="h-3 w-3" /> Critical Alert
          </span>
        );
      case DetectionSeverity.warning:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-amber-500/20 text-amber-300 px-2.5 py-1 rounded-full border border-amber-500/30">
            <AlertTriangle className="h-3 w-3" /> Urgent Warn
          </span>
        );
      case DetectionSeverity.normal:
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider bg-white/5 text-slate-300 px-2.5 py-1 rounded-full border border-white/10">
            <Info className="h-3 w-3 text-cyan-400" /> Routine Info
          </span>
        );
    }
  };

  // Filter computations
  const filteredDetections = detections.filter(item => {
    // 1. Search Query
    const searchMatch = DETECTION_DISPLAY_NAMES[item.type].toLowerCase().includes(searchQuery.toLowerCase()) || 
                        item.roomName.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 2. Severity Filter
    const severityMatch = severityFilter === 'all' || item.severity === severityFilter;

    // 3. Room Filter
    const roomMatch = roomFilter === 'all' || item.roomName === roomFilter;

    // 4. Type Filter
    const typeMatch = typeFilter === 'all' || item.type === typeFilter;

    return searchMatch && severityMatch && roomMatch && typeMatch;
  });

  return (
    <div className="space-y-6" id="detections-feed-container">
      {/* FILTER PANEL */}
      <div className="glass rounded-3xl p-6 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <h3 className="font-sans font-bold text-white text-lg">Smart Surveillance Logs</h3>
            <p className="text-xs text-slate-300 mt-0.5 font-sans">Filter, review, and acknowledge continuous care detections logged by GuardianBot.</p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={onAcknowledgeAll}
              disabled={filteredDetections.length === 0}
              className="text-xs px-3.5 py-2.5 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shadow-lg shadow-cyan-500/15"
            >
              <CheckCircle className="h-4 w-4" />
              Acknowledge All
            </button>
            <button
              onClick={onClearAll}
              disabled={detections.length === 0}
              className="text-xs px-3.5 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 text-rose-300 hover:text-rose-200 font-bold rounded-xl transition-all duration-200 flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
            >
              <Trash2 className="h-4 w-4" />
              Clear Logs
            </button>
          </div>
        </div>

        {/* Filters and search grids */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-sans pt-1">
          {/* Search Box */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-400" />
            </span>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-950/40 border border-white/10 rounded-xl text-sm text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-cyan-500/50 focus:border-cyan-500/50 transition-all duration-200"
            />
          </div>

          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300 shrink-0">Severity:</span>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950/40 border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer transition-all duration-200"
            >
              <option value="all" className="bg-slate-900">All Severities</option>
              <option value={DetectionSeverity.critical} className="bg-slate-900">Critical Only</option>
              <option value={DetectionSeverity.warning} className="bg-slate-900">Warnings Only</option>
              <option value={DetectionSeverity.normal} className="bg-slate-900">Routine Only</option>
            </select>
          </div>

          {/* Room Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300 shrink-0">Room:</span>
            <select
              value={roomFilter}
              onChange={(e) => setRoomFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950/40 border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer transition-all duration-200"
            >
              <option value="all" className="bg-slate-900">All Rooms</option>
              <option value="Nursery" className="bg-slate-900">Nursery</option>
              <option value="Living Room" className="bg-slate-900">Living Room</option>
              <option value="Bedroom" className="bg-slate-900">Bedroom</option>
              <option value="Kitchen" className="bg-slate-900">Kitchen</option>
            </select>
          </div>

          {/* Detection Type Filter */}
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-slate-300 shrink-0">Type:</span>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full py-2 px-3 bg-slate-950/40 border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 cursor-pointer transition-all duration-200"
            >
              <option value="all" className="bg-slate-900">All Events</option>
              {Object.entries(DETECTION_DISPLAY_NAMES).map(([key, label]) => (
                <option key={key} value={key} className="bg-slate-900">{label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* LOG LIST */}
      <div className="glass rounded-3xl overflow-hidden font-sans shadow-xl">
        <div className="px-6 py-4 bg-white/3 border-b border-white/10 flex items-center justify-between">
          <span className="text-xs font-bold uppercase text-slate-300 tracking-wider flex items-center gap-1.5 font-mono">
            <Compass className="h-4 w-4 text-cyan-400" />
            Showing {filteredDetections.length} log {filteredDetections.length === 1 ? 'record' : 'records'}
          </span>
          {detections.length > 0 && (
            <span className="text-[10px] font-mono font-bold bg-cyan-500/10 text-cyan-400 px-2.5 py-1 rounded-lg border border-cyan-500/20">
              Active Stream Interval: 15s
            </span>
          )}
        </div>

        {filteredDetections.length === 0 ? (
          <div className="text-center p-12 space-y-4">
            <div className="p-4 bg-white/5 rounded-full inline-block text-slate-400 border border-dashed border-white/15">
              <Bell className="h-8 w-8 text-cyan-400/80" />
            </div>
            <div>
              <h4 className="text-white font-bold">No Records Match Filters</h4>
              <p className="text-slate-300 text-xs max-w-sm mx-auto mt-1">
                Try searching for a different keyword or updating your active room and severity filters.
              </p>
            </div>
          </div>
        ) : (
          <div className="divide-y divide-white/5">
            {filteredDetections.map((item) => {
              const dateObj = new Date(item.timestamp);
              const formattedTime = dateObj.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
              const elapsedSeconds = Math.max(0, Math.floor((Date.now() - dateObj.getTime()) / 1000));
              let relativeString = 'Just now';
              if (elapsedSeconds >= 60) {
                const minutes = Math.floor(elapsedSeconds / 60);
                relativeString = `${minutes}m ago`;
              } else if (elapsedSeconds > 5) {
                relativeString = `${elapsedSeconds}s ago`;
              }

              return (
                <div 
                  key={item.id} 
                  className={`p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 transition-all duration-200 ${
                    item.isActive 
                      ? item.severity === DetectionSeverity.critical 
                        ? 'bg-rose-500/5 hover:bg-rose-500/10' 
                        : 'bg-cyan-500/5 hover:bg-cyan-500/10'
                      : 'hover:bg-white/3'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    {/* Circle icon with color corresponding to type */}
                    <div className={`p-3 rounded-2xl border ${
                      item.severity === DetectionSeverity.critical ? 'bg-rose-500/10 border-rose-500/30 text-rose-400' :
                      item.severity === DetectionSeverity.warning ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' :
                      'bg-white/5 border-white/10 text-slate-300'
                    }`}>
                      {getDetectionIcon(item.type)}
                    </div>

                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h4 className="text-white font-bold text-sm">
                          {DETECTION_DISPLAY_NAMES[item.type]}
                        </h4>
                        {getSeverityBadge(item.severity)}
                        {item.isActive && (
                          <span className="h-1.5 w-1.5 rounded-full bg-rose-500 animate-pulse inline-block" title="Active Event" />
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-300">
                        <span className="font-bold text-cyan-300 bg-cyan-500/10 px-2 py-0.5 rounded-lg font-mono">
                          📍 {item.roomName}
                        </span>
                        <span className="flex items-center gap-1 font-semibold text-slate-400">
                          <Clock className="h-3.5 w-3.5" />
                          {formattedTime} ({relativeString})
                        </span>
                        <span className="font-mono bg-white/5 text-white px-2 py-0.5 rounded-lg border border-white/10">
                          AI Confidence: <strong className="text-cyan-400">{(item.confidence * 100).toFixed(1)}%</strong>
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-end gap-3 shrink-0 self-end md:self-center">
                    {item.isActive ? (
                      <button
                        onClick={() => onAcknowledgeItem(item.id)}
                        className="px-3.5 py-2 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-black text-xs rounded-xl shadow-md transition-all duration-200 cursor-pointer"
                      >
                        <CheckCircle className="h-3.5 w-3.5" />
                        Acknowledge
                      </button>
                    ) : (
                      <span className="text-xs font-semibold text-slate-400 flex items-center gap-1 py-1.5 px-3 bg-white/5 rounded-xl border border-white/10">
                        <CheckCircle className="h-3.5 w-3.5 text-slate-400" />
                        Archived
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DISPATCH NOTES */}
      <div className="glass text-white rounded-3xl p-6 shadow-xl border border-white/10 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1.5 text-center md:text-left">
          <div className="flex items-center justify-center md:justify-start gap-2">
            <Sparkles className="h-5 w-5 text-cyan-400 animate-pulse" />
            <h4 className="font-sans font-bold text-lg">AI Smart Filtering</h4>
          </div>
          <p className="text-slate-300 text-xs max-w-2xl leading-relaxed font-sans font-medium">
            GuardianBot uses advanced local visual and sound analysis pipelines to prevent false alarms. You can configure custom alerts and SMS emergency cascades in the settings panel to tailor detection alerts to your schedule.
          </p>
        </div>
      </div>
    </div>
  );
}
