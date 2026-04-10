export interface Device {
  id: number;
  deviceIdentifier: string;
  pushToken: string;
  storeId: string;
  deviceName?: string;
  platform?: string;
  osVersion?: string;
  appVersion?: string;
  createdAt: string;
  updatedAt: string;
  isActive: boolean;
  active?: boolean; // Backend compatibility field
  message?: string;
}

export interface DeviceRegistrationRequest {
  deviceIdentifier: string;
  pushToken: string;
  storeId: string;
  deviceName?: string;
  platform?: string;
  osVersion?: string;
  appVersion?: string;
}

export interface PushNotificationRequest {
  title: string;
  subtitle?: string;
  body: string;
  threadId?: string;
  sound?: string;
  category?: string;
  customData?: Record<string, unknown>;
}

export interface PushNotificationTarget {
  deviceIdentifier: string;
  storeId?: string;
}

export interface BulkPushNotificationRequest {
  targets: PushNotificationTarget[];
  notification: PushNotificationRequest;
}

export interface PushNotificationResult {
  success: boolean;
  message: string;
  deviceIdentifier?: string;
  apnsId?: string;
}

export interface WaterIntakeRequest {
  deviceIdentifier: string;
  amount: number;
  timestamp?: string;
}

export interface WaterIntakeResponse {
  deviceIdentifier: string;
  amount: number;
  totalIntake: number;
  dailyGoal: number;
  progressPercentage: number;
  timestamp: string;
  message?: string;
}

export interface DailyGoalResponse {
  deviceIdentifier: string;
  dailyGoal: number;
  unit: string;
}

export type NotificationMode = 'basic' | 'advanced';
export type NotificationTarget = 'device' | 'store' | 'bulk';

export interface P8UploadResponse {
  success: boolean;
  message: string;
  keyId?: string;
  teamId?: string;
  bundleId?: string;
}

export interface DynamicPushNotificationRequest {
  p8KeyId: string;
  teamId: string;
  bundleId: string;
  deviceTokens: string[];
  notification: PushNotificationRequest;
  isProduction?: boolean;
}

export interface DynamicPushNotificationResult {
  success: boolean;
  message: string;
  results?: PushNotificationResult[];
}
