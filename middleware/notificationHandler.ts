import fs from 'fs';
import path from 'path';
import * as apn from 'apn';
import type { NotificationData } from '../types/types';
import { NOTIFICATIONS } from '../constants';
import axios from 'axios';

const FCM_URL = 'https://fcm.googleapis.com/fcm/send';

/**
 * send VoIP notification to apple APN, using certificate stored in certificates folder
 * @param {NotificationData} data notification to be send to apple APN 
 * @returns APN response converted into success or fail message
 */
export const sendCallNotificationIos = async (
  data: NotificationData
): Promise<any> => {
  const myCert = fs.readFileSync(
    path.join(__dirname, '..', 'certificates', 'VOIP.pem'),
    'utf8'
  );
  const myKey = fs
    .readFileSync(
      path.join(__dirname, '..', 'certificates', 'VOIP.pem'),
      'utf8'
    )
    .replace(/(.|\n)+?(?=-----BEGIN PRIVATE KEY-----)/, '')
    .trim();

  const service = new apn.Provider({
    cert: myCert,
    key: myKey,
  });

  const note = new apn.Notification({
    id: data.uuid,
    payload: {
      uuid: data.uuid,
      callerName: data.caller,
      handle: data.caller,
    },
    topic: data.bundle,
  });
  

  const response = service
    .send(note, data.iosDeviceToken as string)
    .then((result: any) => {
      if (JSON.stringify(result.sent).length > 4) {
        console.log('notification sent');
        // let the phone know that notification has been sent
        return 'success';
      } else {
        console.log('notification not sent', result);
        return 'fail';
      }
    });
  service.shutdown();
  return response;
};

/**
 * send Incoming call notification to Google FCM, using FCM Key
 * @param {NotificationData} data notification to be send to FCM
 * @returns FCM response converted into success or data message
 */
export const sendCallNotificationAndroid = async (
  data: NotificationData
): Promise<any> => {
  const response = axios({
    method: 'post',
    url: FCM_URL,
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json',
      'topic': data.bundle,
      'Authorization': `key=${NOTIFICATIONS.FCM_KEY}`,
    },
    data: {
      to: data.fcmDeviceToken,
      data: {
        channel_id: 'acu_incoming_call',
        title: 'Incoming Call',
        body: data.caller,
        uuid: data.uuid,
      },
      priority: 'high',
      topic: 'all',
      time_to_live: 0,
    },
  })
    .then((res) => {
      if (res.data.success > 0) {
        return 'success'
      }
      return res.data;
    })
    .catch((error) => {
      console.error('[ sendNotification ] error:', error);
    });
  return response;
};

/**
 * send silent notification to iOS, using Google FCM and FCM Key
 * @param {NotificationData} data notification to be send to FCM
 * @returns FCM response converted into success or data message
 */
export const sendNotificationIos = async (
  data: NotificationData
): Promise<any> => {
  const response = axios({
    method: 'post',
    url: FCM_URL,
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json',
      'topic': data.bundle,
      'Authorization': `key=${NOTIFICATIONS.FCM_KEY}`,
    },
    data: {
      to: data.fcmDeviceToken,
      data: {
        title: 'Notification',
        body: data.callee,
        uuid: data.uuid,
        webrtc_ready: data.webrtc_ready,
      },
      content_available: true,
      topic: 'all',
      time_to_live: 0,
    },
  })
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      console.error('[ sendNotification ] error:', error);
    });
  return response;
};

/**
 * send silent notification to Android, using Google FCM and FCM Key
 * @param {NotificationData} data notification to be send to FCM
 * @returns FCM response converted into success or data message
 */
export const sendNotificationAndroid = async (
  data: NotificationData
): Promise<any> => {
  const response = axios({
    method: 'post',
    url: FCM_URL,
    headers: {
      'Accept': '*/*',
      'Content-Type': 'application/json',
      'topic': data.bundle,
      'Authorization': `key=${NOTIFICATIONS.FCM_KEY}`,
    },
    data: {
      to: data.fcmDeviceToken,
      data: {
        title: 'Notification',
        body: data.callee,
        uuid: data.uuid,
        webrtc_ready: data.webrtc_ready,
      },
      priority: 'high',
      topic: 'all',
      time_to_live: 0,
    },
  })
    .then((res) => {
      return res.data;
    })
    .catch((error) => {
      console.error('[ sendNotification ] error:', error);
    });
  return response;
};

// inspirational code
// curl -v
//  --header "apns-topic: org.reactjs.native.example.AculabCallNExample.voip"
//  --header "apns-push-type: voip"
//  --header "apns-id: 123e4567-e89b-12d3-a456-4266554400a0"
//  --cert VOIP.pem:password
//  --data '{"uuid":"123e4567-e89b-12d3-a456-4266554400a0", "callerName":"test", "handle":"some handle"}'
//  --http2  https://api.sandbox.push.apple.com/3/device/2354trgdgs45g4565rstsg564t6wt
