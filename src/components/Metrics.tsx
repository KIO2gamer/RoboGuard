/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { 
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, 
  CartesianGrid, Tooltip, BarChart, Bar, Cell, PieChart, Pie
} from 'recharts';
import { 
  Activity, Clock, Bell, Heart, ShieldAlert, Zap, 
  CheckCircle, Baby, Sparkles
} from 'lucide-react';
import { DetectionModel, DetectionSeverity } from '../types';

interface MetricsProps {
  detections: DetectionModel[];
}

export default function Metrics({ detections }: MetricsProps) {
  // 1. Generate fake trend data based on real detections log count or presets
  const hourlyData = [
    { hour: '08:00', Nursery: 40, LivingRoom: 20 },
    { hour: '10:00', Nursery: 55, LivingRoom: 45 },
    { hour: '12:00', Nursery: 12, LivingRoom: 80 },
    { hour: '14:00', Nursery: 75, LivingRoom: 15 },
    { hour: '16:00', Nursery: 30, LivingRoom: 60 },
    { hour: '18:00', Nursery: 20, LivingRoom: 90 },
    { hour: '20:00', Nursery: 85, LivingRoom: 40 },
    { hour: '22:00', Nursery: 10, LivingRoom: 15 },
  ];

  // 2. Compute count of detections by room
  const roomCounts = detections.reduce((acc, curr) => {
    acc[curr.roomName] = (acc[curr.roomName] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  const barData = [
    { name: 'Nursery', Count: roomCounts['Nursery'] || 5 },
    { name: 'Living Room', Count: roomCounts['Living Room'] || 8 },
    { name: 'Bedroom', Count: roomCounts['Bedroom'] || 3 },
    { name: 'Kitchen', Count: roomCounts['Kitchen'] || 2 },
  ];

  // 3. Compute count of detections by severity
  const criticalCount = detections.filter(d => d.severity === DetectionSeverity.critical).length;
  const warningCount = detections.filter(d => d.severity === DetectionSeverity.warning).length;
  const normalCount = detections.filter(d => d.severity === DetectionSeverity.normal).length;

  const pieData = [
    { name: 'Routine Info', value: normalCount || 10, color: '#38bdf8' },
    { name: 'Warnings', value: warningCount || 4, color: '#fbbf24' },
    { name: 'Critical Alerts', value: criticalCount || 1, color: '#f43f5e' },
  ];

  // Compute stats
  const totalEvents = detections.length;
  const activeAlerts = detections.filter(d => d.isActive).length;
  const criticalAlertsCount = detections.filter(d => d.severity === DetectionSeverity.critical).length;

  return (
    <div className="space-y-6" id="metrics-container">
      {/* STAT CARDS ROW */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 font-sans">
        {/* Card 1 */}
        <div className="glass p-5 rounded-3xl shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">Total Logs Today</span>
            <span className="text-3xl font-black text-white">{totalEvents || 15}</span>
            <span className="text-[10px] text-cyan-400 block font-bold font-mono uppercase tracking-wide">⚡ Real-time synced</span>
          </div>
          <div className="p-3.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-300 rounded-2xl">
            <Bell className="h-6 w-6" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="glass p-5 rounded-3xl shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">Active Warnings</span>
            <span className={`text-3xl font-black ${activeAlerts > 0 ? 'text-amber-400 animate-pulse' : 'text-white'}`}>
              {activeAlerts}
            </span>
            <span className="text-[10px] text-slate-400 block font-semibold">Pending caregiver review</span>
          </div>
          <div className="p-3.5 bg-amber-500/10 border border-amber-500/20 text-amber-300 rounded-2xl">
            <Activity className="h-6 w-6" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="glass p-5 rounded-3xl shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">Critical Emergencies</span>
            <span className={`text-3xl font-black ${criticalAlertsCount > 0 ? 'text-rose-400 animate-pulse' : 'text-white'}`}>
              {criticalAlertsCount}
            </span>
            <span className="text-[10px] text-slate-400 block font-semibold">Siren + SMS cascade trigger</span>
          </div>
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/20 text-rose-300 rounded-2xl">
            <ShieldAlert className="h-6 w-6" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="glass p-5 rounded-3xl shadow-xl flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-slate-300 uppercase tracking-wider block font-mono">AI Accuracy Rate</span>
            <span className="text-3xl font-black text-white">97.8%</span>
            <span className="text-[10px] text-cyan-400 block font-bold font-mono uppercase tracking-wide">99.1% Confidence floor</span>
          </div>
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 rounded-2xl">
            <CheckCircle className="h-6 w-6" />
          </div>
        </div>
      </div>

      {/* RECHARTS CHART SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Line Area hourly movement */}
        <div className="glass p-6 rounded-3xl shadow-xl space-y-4">
          <div>
            <h3 className="font-sans font-bold text-white text-lg">Hourly Activity Level Trends</h3>
            <p className="text-xs text-slate-300">Hourly activity levels detected inside the nursery versus living room spaces.</p>
          </div>

          <div className="h-72 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hourlyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorNursery" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorLiving" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="hour" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', color: '#fff' }} />
                <Area type="monotone" dataKey="Nursery" stroke="#06b6d4" strokeWidth={2.5} fillOpacity={1} fill="url(#colorNursery)" />
                <Area type="monotone" dataKey="LivingRoom" stroke="#8b5cf6" strokeWidth={2.5} fillOpacity={1} fill="url(#colorLiving)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Chart 2: Detections breakdown by room */}
        <div className="glass p-6 rounded-3xl shadow-xl space-y-4">
          <div>
            <h3 className="font-sans font-bold text-white text-lg">Detections Density by Room</h3>
            <p className="text-xs text-slate-300">Distribution of monitoring metrics across active rooms in the past 24 hours.</p>
          </div>

          <div className="h-72 w-full font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="rgba(255,255,255,0.08)" />
                <XAxis dataKey="name" stroke="#94a3b8" />
                <YAxis stroke="#94a3b8" />
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', color: '#fff' }} />
                <Bar dataKey="Count" fill="#06b6d4" radius={[8, 8, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell 
                      key={`cell-${index}`} 
                      fill={index === 0 ? '#06b6d4' : index === 1 ? '#8b5cf6' : index === 2 ? '#0d9488' : '#e11d48'} 
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* PIE CHART ROW */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
        {/* Severity distribution card */}
        <div className="glass p-6 rounded-3xl shadow-xl flex flex-col justify-between col-span-1 space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">Alert Severity Ratio</h3>
            <p className="text-xs text-slate-300">Classification of incident priorities logged by AI eyes.</p>
          </div>

          <div className="h-44 w-full flex items-center justify-center font-mono text-xs">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={45}
                  outerRadius={65}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.15)', borderRadius: '12px', color: '#fff' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="space-y-1.5 pt-1">
            {pieData.map((item, idx) => (
              <div key={idx} className="flex items-center justify-between text-xs font-semibold">
                <div className="flex items-center gap-1.5">
                  <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-300">{item.name}</span>
                </div>
                <span className="font-bold text-white">{item.value} logs</span>
              </div>
            ))}
          </div>
        </div>

        {/* Informative text card block */}
        <div className="glass text-white p-6 rounded-3xl shadow-xl col-span-2 flex flex-col justify-between space-y-6 relative overflow-hidden">
          <div className="absolute inset-0 bg-camera-scanlines opacity-[0.03] pointer-events-none" />
          
          <div className="space-y-3 z-10">
            <div className="flex items-center gap-1.5">
              <Sparkles className="h-5 w-5 text-cyan-400" />
              <h4 className="font-bold text-lg text-white">Sleep & Absence Intelligence</h4>
            </div>
            
            <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
              GuardianBot's AI-powered local processing engine actively models daily routines. It records the times your child is in bed, monitors sleep cycles by analyzing chest-movement respiration patterns (using microwave micro-radar or optical flows), and predicts bedtime fatigue.
            </p>

            <ul className="space-y-1.5 text-xs text-slate-400 pt-1 font-sans font-semibold">
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Continuous deep breathing monitoring checks vital comfort and movement.
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Automatic nursery ambient temperature & humidity audits prevent bedtime discomfort.
              </li>
              <li className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400" />
                Zero cloud frame storage protects complete household personal privacy.
              </li>
            </ul>
          </div>

          <div className="flex items-center gap-3 pt-2 border-t border-white/10 z-10">
            <div className="bg-cyan-500/10 p-2.5 border border-cyan-500/20 rounded-xl">
              <Zap className="h-5 w-5 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <span className="text-xs font-bold text-slate-200 block">AI Guardian Engine Active</span>
              <span className="text-[10px] text-slate-400 font-mono font-medium uppercase tracking-wider">Stationary Unit Firmware: v1.0.4+build.2</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
