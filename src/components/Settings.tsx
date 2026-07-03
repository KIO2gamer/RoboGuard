/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  User, Shield, Bell, Key, ShieldAlert, Phone, Info, Save, 
  Baby, Heart, Wifi, Radio, AlertTriangle, Eye, Compass
} from 'lucide-react';
import { UserModel, RobotModel } from '../types';

interface SettingsProps {
  user: UserModel | null;
  robot: RobotModel;
  onUpdateUser: (updatedUser: UserModel) => void;
  onUpdateRobot: (updatedRobot: RobotModel) => void;
}

export default function Settings({
  user,
  robot,
  onUpdateUser,
  onUpdateRobot
}: SettingsProps) {
  // Local profile states
  const [userName, setUserName] = useState(user?.name || 'Sarah Vance');
  const [userEmail, setUserEmail] = useState(user?.email || 'sarah@guardianbot.ai');
  const [userPhone, setUserPhone] = useState(user?.phone || '+1 (555) 012-3456');
  const [childName, setChildName] = useState(user?.childName || 'Emma');
  const [childAge, setChildAge] = useState(user?.childAge || 4);

  // Local device states
  const [robotName, setRobotName] = useState(robot.name);
  const [audioSiren, setAudioSiren] = useState(true);
  const [smsCascade, setSmsCascade] = useState(true);
  const [saveSuccess, setSaveSuccess] = useState(false);

  // Quick emergency contacts
  const [contacts, setContacts] = useState([
    { role: 'Primary Guardian (You)', name: 'Sarah Vance', phone: '+1 (555) 012-3456' },
    { role: 'Secondary Contact (Dad)', name: 'Michael Vance', phone: '+1 (555) 012-7890' },
    { role: 'Pediatrician / Family Doctor', name: 'Dr. Elizabeth Chen', phone: '+1 (555) 019-3210' },
    { role: 'Emergency Dispatch', name: 'Local Emergency Services', phone: '911 / 112' }
  ]);

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (user) {
      onUpdateUser({
        ...user,
        name: userName,
        email: userEmail,
        phone: userPhone,
        childName,
        childAge
      });
    }

    onUpdateRobot({
      ...robot,
      name: robotName
    });

    setSaveSuccess(true);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="space-y-6" id="settings-container">
      <form onSubmit={handleSaveSettings} className="space-y-6">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 font-sans">
          
          {/* COLUMN 1: USER & CARE PROFILE */}
          <div className="glass rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <User className="h-5 w-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">Account & Companion Profile</h3>
            </div>

            <div className="space-y-4">
              {/* Caregiver Name */}
              <div className="space-y-1.5">
                <label htmlFor="caregiver-name" className="text-xs font-bold text-slate-300">Caregiver Name</label>
                <input
                  id="caregiver-name"
                  type="text"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-white/10 rounded-xl text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-200"
                  required
                />
              </div>

              {/* Caregiver Phone */}
              <div className="space-y-1.5">
                <label htmlFor="caregiver-phone" className="text-xs font-bold text-slate-300">Caregiver SMS Phone</label>
                <input
                  id="caregiver-phone"
                  type="tel"
                  value={userPhone}
                  onChange={(e) => setUserPhone(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-white/10 rounded-xl text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-200"
                  required
                />
              </div>

              {/* Target Companion */}
              <div className="p-4 bg-white/3 rounded-2xl border border-white/5 space-y-4">
                <div className="flex items-center gap-1.5 text-white">
                  <Baby className="h-4.5 w-4.5 text-cyan-400 animate-pulse" />
                  <span className="text-xs font-black uppercase tracking-wider font-mono">Companion Details</span>
                </div>

                <div className="space-y-3">
                  <div className="space-y-1">
                    <label htmlFor="companion-name" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Child / Elderly Name</label>
                    <input
                      id="companion-name"
                      type="text"
                      value={childName}
                      onChange={(e) => setChildName(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                      required
                    />
                  </div>

                  <div className="space-y-1">
                    <label htmlFor="companion-age" className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Age</label>
                    <input
                      id="companion-age"
                      type="number"
                      value={childAge}
                      onChange={(e) => setChildAge(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-950/60 border border-white/10 rounded-xl text-xs text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition"
                      required
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 2: HARDWARE & AI PARAMS */}
          <div className="glass rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Shield className="h-5 w-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">Stationary Device Settings</h3>
            </div>

            <div className="space-y-4">
              {/* Robot Name */}
              <div className="space-y-1.5">
                <label htmlFor="robot-name" className="text-xs font-bold text-slate-300">Robot Broadcast Alias</label>
                <input
                  id="robot-name"
                  type="text"
                  value={robotName}
                  onChange={(e) => setRobotName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-950/40 border border-white/10 rounded-xl text-sm text-white font-bold focus:outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all duration-200"
                  required
                />
              </div>

              {/* Siren switch */}
              <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Speaker Alarm Siren</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Sound physical hazard alarm on smoke/falls</p>
                </div>
                <input
                  type="checkbox"
                  checked={audioSiren}
                  onChange={(e) => setAudioSiren(e.target.checked)}
                  className="h-4.5 w-4.5 accent-cyan-400 cursor-pointer text-cyan-500 border-white/20 rounded-md focus:ring-cyan-500"
                />
              </div>

              {/* SMS cascade switch */}
              <div className="flex items-center justify-between p-3.5 bg-white/3 border border-white/5 rounded-2xl">
                <div>
                  <span className="text-xs font-bold text-slate-200 block">Critical SMS Cascades</span>
                  <p className="text-[10px] text-slate-400 mt-0.5 font-medium">Send instant emergency texts to all contacts</p>
                </div>
                <input
                  type="checkbox"
                  checked={smsCascade}
                  onChange={(e) => setSmsCascade(e.target.checked)}
                  className="h-4.5 w-4.5 accent-cyan-400 cursor-pointer text-cyan-500 border-white/20 rounded-md focus:ring-cyan-500"
                />
              </div>

              {/* Network specs info */}
              <div className="p-4 bg-white/3 border border-white/5 rounded-2xl flex items-start gap-2.5">
                <Wifi className="h-4.5 w-4.5 text-cyan-400 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-1">
                  <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide block font-mono">Network Signature</span>
                  <span className="text-xs font-mono font-bold text-white block">SSID: Guardian_Net_2.4G</span>
                  <span className="text-[10px] font-mono text-slate-400 block">MAC: D2:44:E1:9C:F8:32</span>
                </div>
              </div>
            </div>
          </div>

          {/* COLUMN 3: EMERGENCY CASCADE CONTACTS */}
          <div className="glass rounded-3xl p-6 shadow-xl space-y-6">
            <div className="flex items-center gap-2 border-b border-white/10 pb-3">
              <Phone className="h-5 w-5 text-cyan-400" />
              <h3 className="font-bold text-white text-base">Emergency Broadcast List</h3>
            </div>

            <p className="text-xs text-slate-300 leading-relaxed font-sans font-medium">
              When a critical incident is detected by the AI core (such as Fire or Falls), GuardianBot automatically attempts to contact these parties in sequential order.
            </p>

            <div className="space-y-3">
              {contacts.map((contact, idx) => (
                <div key={idx} className="p-3.5 bg-white/3 rounded-2xl border border-white/5 flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="text-[9px] font-bold text-cyan-400 block uppercase tracking-wider font-mono">{contact.role}</span>
                    <span className="text-xs font-bold text-white block">{contact.name}</span>
                    <span className="text-[10px] font-mono text-slate-400">{contact.phone}</span>
                  </div>
                  <span className="text-[10px] font-mono font-bold bg-white/5 px-2 py-0.5 border border-white/10 rounded-lg text-slate-300">
                    PRIORITY {idx + 1}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BOTTOM SAVE CONTROLS */}
        <div className="flex items-center justify-between p-4 glass rounded-3xl border border-white/10 shadow-xl font-sans">
          <div className="flex items-center gap-2 text-xs text-slate-300 font-bold font-mono uppercase tracking-wider">
            <Compass className="h-4.5 w-4.5 text-cyan-400 animate-spin-slow" />
            Configures local hardware & parent policies
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && (
              <span className="text-xs font-bold text-emerald-400 animate-pulse">
                ✓ Policies and profile updated successfully!
              </span>
            )}
            <button
              type="submit"
              className="px-6 py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm rounded-xl shadow-lg shadow-cyan-500/15 transition-all duration-200 flex items-center gap-1.5 cursor-pointer"
            >
              <Save className="h-4 w-4" />
              Save Companion Policy
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
