/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export enum RobotStatus {
  online = 'online',
  offline = 'offline',
  connecting = 'connecting'
}

export interface RobotModel {
  id: string;
  name: string;
  isOnline: boolean;
  batteryPercentage: number;
  cpuTemperature: number;
  currentRoom: string;
  wifiSignalStrength: number; // 0-100%
  isCharging: boolean;
  cameraActive: boolean;
  microphoneActive: boolean;
  speakerActive: boolean;
  aiActive: boolean;
  lastUpdated: string;
}

export enum DetectionType {
  childPresence = 'childPresence',
  elderlyPresence = 'elderlyPresence',
  unknownPerson = 'unknownPerson',
  fire = 'fire',
  smoke = 'smoke',
  dangerousObject = 'dangerousObject',
  childCrying = 'childCrying',
  loudDistress = 'loudDistress',
  motionDetected = 'motionDetected',
  fallDetected = 'fallDetected'
}

export enum DetectionSeverity {
  normal = 'normal',
  warning = 'warning',
  critical = 'critical'
}

export interface DetectionModel {
  id: string;
  type: DetectionType;
  confidence: number; // 0.0 - 1.0
  timestamp: string;
  snapshotUrl?: string;
  severity: DetectionSeverity;
  isActive: boolean;
  roomName: string;
}

export interface UserModel {
  id: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  phone: string;
  childName: string;
  childAge: number;
  isProfileSetup: boolean;
}

export interface AuthState {
  user: UserModel | null;
  isLoading: boolean;
  error: string | null;
  isAuthenticated: boolean;
}

export const DETECTION_DISPLAY_NAMES: Record<DetectionType, string> = {
  [DetectionType.childPresence]: 'Child Detected',
  [DetectionType.elderlyPresence]: 'Elderly Detected',
  [DetectionType.unknownPerson]: 'Unknown Person',
  [DetectionType.fire]: 'Fire Detected',
  [DetectionType.smoke]: 'Smoke Detected',
  [DetectionType.dangerousObject]: 'Dangerous Object',
  [DetectionType.childCrying]: 'Child Crying',
  [DetectionType.loudDistress]: 'Loud Distress',
  [DetectionType.motionDetected]: 'Motion Detected',
  [DetectionType.fallDetected]: 'Fall Detected'
};
