export interface User {
  username: string;
  webrtcToken?: string;
  fcmDeviceToken?: string;
  iosDeviceToken?: string;
  platform?: string;
  logLevel?: string | number;
}

export interface UsersData {
  users: Array<User>;
  setUsers: (data: Array<User>) => void;
}

export interface Notification {
  uuid: string;
  caller: string;
  callee: string;
  webrtc_ready?: boolean;
  call_rejected?: boolean;
  call_cancelled?: boolean;
}

export interface NotificationData {
  uuid: string;
  caller?: string;
  callee?: string;
  fcmDeviceToken?: string;
  iosDeviceToken?: string;
  bundle: string;
  webrtc_ready?: boolean;
  call_rejected?: boolean;
  call_cancelled?: boolean;
}

export interface NotificationDataAndroid {
  to: string;
  data: {
    channel_id: string;
    title: string;
    body: string;
    callee: string;
    uuid: string;
  };
  priority: string;
  topic: string;
  time_to_live: number;
}

export interface WebRTCToken {
  registerClientId: string;
  tokenLifeTime: number; //time(ms)
  enableIncomingCall: boolean;
  callClientRange: string;
  cloudRegionId: string;
  cloudUsername: string;
  apiAccessKey: string;
}
