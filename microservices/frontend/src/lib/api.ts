import axios, { AxiosError, AxiosInstance } from 'axios';
import type {
  Device,
  DeviceRegistrationRequest,
  PushNotificationRequest,
  PushNotificationResult,
  BulkPushNotificationRequest,
  WaterIntakeRequest,
  WaterIntakeResponse,
  DailyGoalResponse,
} from '@/types';

class ApiError extends Error {
  constructor(
    message: string,
    public statusCode?: number,
    public response?: unknown
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

const handleError = (error: AxiosError): never => {
  if (error.response) {
    const data = error.response.data as { error?: string; message?: string };
    throw new ApiError(
      data.error || data.message || `HTTP ${error.response.status}: ${error.response.statusText}`,
      error.response.status,
      data
    );
  }
  if (error.request) {
    throw new ApiError('Network error - no response received');
  }
  throw new ApiError(error.message);
};

const createClient = (): AxiosInstance => {
  const client = axios.create({
    headers: {
      'Content-Type': 'application/json',
    },
  });

  client.interceptors.response.use(
    (response) => response,
    (error: AxiosError) => handleError(error)
  );

  return client;
};

const client = createClient();

// Device Service APIs
export const deviceApi = {
  register: async (request: DeviceRegistrationRequest): Promise<Device> => {
    const { data } = await client.post<Device>('/api/devices/register', request);
    return data;
  },

  getByIdentifier: async (deviceIdentifier: string): Promise<Device> => {
    const { data } = await client.get<Device>(`/api/devices/${deviceIdentifier}`);
    return data;
  },

  getByStore: async (storeId: string): Promise<Device[]> => {
    const { data } = await client.get<Device[]>(`/api/devices/store/${storeId}`);
    return data;
  },

  deactivate: async (deviceIdentifier: string): Promise<void> => {
    await client.put(`/api/devices/${deviceIdentifier}/deactivate`);
  },
};

// Push Service APIs
export const pushApi = {
  sendToDevice: async (
    deviceIdentifier: string,
    notification: PushNotificationRequest
  ): Promise<PushNotificationResult> => {
    const { data } = await client.post<PushNotificationResult>(
      `/api/push-notifications/send/${deviceIdentifier}`,
      notification
    );
    return data;
  },

  sendToStore: async (
    storeId: string,
    notification: PushNotificationRequest
  ): Promise<PushNotificationResult[]> => {
    const { data } = await client.post<PushNotificationResult[]>(
      `/api/push-notifications/send/store/${storeId}`,
      notification
    );
    return data;
  },

  sendBulk: async (
    request: BulkPushNotificationRequest
  ): Promise<PushNotificationResult[]> => {
    const { data } = await client.post<PushNotificationResult[]>(
      '/api/push-notifications/send/bulk',
      request
    );
    return data;
  },

  sendHydrationReminder: async (
    deviceIdentifier: string
  ): Promise<PushNotificationResult> => {
    const { data } = await client.post<PushNotificationResult>(
      `/api/push-notifications/send/hydration-reminder/${deviceIdentifier}`
    );
    return data;
  },
};

// Water Service APIs
export const waterApi = {
  recordIntake: async (request: WaterIntakeRequest): Promise<WaterIntakeResponse> => {
    const { data } = await client.post<WaterIntakeResponse>('/api/water/intake', request);
    return data;
  },

  getTodayIntake: async (deviceIdentifier: string): Promise<WaterIntakeResponse> => {
    const { data } = await client.get<WaterIntakeResponse>(
      `/api/water/intake/${deviceIdentifier}/today`
    );
    return data;
  },

  getDailyGoal: async (deviceIdentifier: string): Promise<DailyGoalResponse> => {
    const { data } = await client.get<DailyGoalResponse>(
      `/api/water/intake/${deviceIdentifier}/goal`
    );
    return data;
  },

  sendReminder: async (deviceIdentifier: string): Promise<{ reminderQueued: boolean }> => {
    const { data } = await client.post<{ reminderQueued: boolean }>(
      `/api/water/reminder/${deviceIdentifier}`
    );
    return data;
  },
};

export { ApiError };
