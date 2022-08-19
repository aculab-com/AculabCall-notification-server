import { Request, Response } from 'express';
import {
  sendCallNotificationAndroid,
  sendCallNotificationIos,
  sendNotificationAndroid,
  sendNotificationIos,
} from '../middleware/notificationHandler';
import { NOTIFICATIONS } from '../constants';
import { connectDb, getUser } from '../middleware/dbHandler';
import EventEmitter from 'events';

import type { User, Notification } from '../types/types';

// let callOut = false;
export const notificationEvent = new EventEmitter();

/**
 * send call notification ios/android
 * @param {Request} req request from route (requires uuid, caller and callee)
 * @param {Request} res response to route
 * @returns information about sent call notification
 */
export const newCallNotification = async (
  req: Request,
  res: Response
): Promise<any> => {
  // console.log('newCallNotification', req.body);

  const notification: Notification = {
    uuid: req.body.uuid,
    caller: req.body.caller,
    callee: req.body.callee,
  };

  if (!notification.uuid || !notification.caller || !notification.callee) {
    return res
      .status(400)
      .json({ message: 'uuid, caller and callee are required' });
  }

  const db = connectDb();
  const callee: User | undefined = await getUser(db, notification.callee)
    .then(data => {
      return data
    })
    .catch(err => {
      console.error(err);
      return err
    });

  db.close(); //closing connection

  if (
    !callee ||
    (callee.platform !== 'web' && !callee.fcmDeviceToken) ||
    (callee.platform === 'ios' && !callee.iosDeviceToken)
  ) {
    return res
      .status(400)
      .json({ error: `callee ${notification.callee} is not registered` });
  }

  let notificationResponse;
  switch (callee.platform) {
    case 'ios':
      notificationResponse = await sendCallNotificationIos({
        uuid: notification.uuid,
        caller: notification.caller,
        iosDeviceToken: callee.iosDeviceToken,
        bundle: `${NOTIFICATIONS.IOS_BUNDLE}.voip`,
      });
      break;
    case 'android':
      notificationResponse = await sendCallNotificationAndroid({
        uuid: notification.uuid,
        caller: notification.caller,
        fcmDeviceToken: callee.fcmDeviceToken,
        bundle: `${NOTIFICATIONS.IOS_BUNDLE}.voip`,
      });
      break;
    default:
      // web browser
      return res.status(200).json({ message: 'calling_web_interface' });
  }
  // console.log('notification', notificationResponse);

  if (notificationResponse === 'success') {
    res.status(200).json({ message: notificationResponse });
  } else {
    res.status(400).json({ error: notificationResponse });
  }
};

/**
 * send a silent notification ios/android
 * @param {Request} req request from route (requires uuid, caller, callee and webrtc_ready)
 * @param {Request} res response to route
 * @returns information about sent notification 
 */
export const newNotification = async (
  req: Request,
  res: Response
): Promise<any> => {
  // console.log('newNotification', req.body);
  let receivingUser: User | undefined

  const notification: Notification = {
    uuid: req.body.uuid,
    caller: req.body.caller,
    callee: req.body.callee,
    webrtc_ready: req.body.webrtc_ready,
    call_rejected: req.body.call_rejected,
    call_cancelled: req.body.call_cancelled,
  };
  if (!notification.uuid || !notification.caller || !notification.callee) {
    return res
      .status(400)
      .json({ message: 'uuid, caller and callee are required' });
  }

  const db = connectDb();
  if (req.body.call_cancelled) {
    receivingUser = await getUser(db, notification.callee)
    .then(data => {
      return data
    })
    .catch(err => {
      console.error(err);
      return err
    });
  } else {
    receivingUser = await getUser(db, notification.caller)
    .then(data => {
      return data
    })
    .catch(err => {
      console.error(err);
      return err
    });
  }
  

  db.close(); //closing connection
  
  if (!receivingUser || (!receivingUser.fcmDeviceToken && receivingUser.platform !== 'web')) {
    return res
      .status(400)
      .json({ message: `caller ${notification.caller} is not registered` });
  }
  
  let notificationResponse;
  switch (receivingUser.platform) {
    case 'ios':
      notificationResponse = await sendNotificationIos({
        uuid: notification.uuid,
        callee: notification.callee,
        fcmDeviceToken: receivingUser.fcmDeviceToken,
        bundle: NOTIFICATIONS.ANDROID_BUNDLE,
        webrtc_ready: notification.webrtc_ready,
        call_rejected: notification.call_rejected,
        call_cancelled: notification.call_cancelled,
      });
      break;
    case 'android':
      notificationResponse = await sendNotificationAndroid({
        uuid: notification.uuid,
        callee: notification.callee,
        fcmDeviceToken: receivingUser.fcmDeviceToken,
        bundle: NOTIFICATIONS.ANDROID_BUNDLE,
        webrtc_ready: notification.webrtc_ready,
        call_rejected: notification.call_rejected,
        call_cancelled: notification.call_cancelled,
      });
      break;
    default:
      // web browser
      // send data to the browser client via socket
      notificationEvent.emit('silent_notification', notification);
      if (notification.webrtc_ready === true) {
        console.log('Place the WebRTC call now');
      } else if (notification.call_rejected === true) {
        console.log('Display that the call was rejected');
      }
      return res.status(200).json({ message: 'calling_web_interface' });
  }

  try {
    if (notificationResponse.success > 0 ) {
      res.status(200).json({ message: notificationResponse });
      } else {
      res.status(400).json({ message: notificationResponse });
    }
  } catch (err) {
    console.error('FCM response error:', err);
  }
};

/**
 * send a notification to iOS or Android from web browser
 * @param {Notification} notification notification object
 * @returns object with message
 */
export const socketNewCallNotification = async (
  notification: Notification
): Promise<any> => {
  console.log('socketNewCallNotification', notification);

  if (!notification.uuid || !notification.caller || !notification.callee) {
    return { message: 'uuid, caller and callee are required' };
  }

  const db = connectDb();
  const callee: User | undefined = await getUser(db, notification.callee)
    .then(data => {
      return data
    })
    .catch(err => {
      console.error(err);
      return err
    });

  db.close(); //closing connection

  if (
    !callee ||
    (callee.platform !== 'web' && !callee.fcmDeviceToken) ||
    (callee.platform === 'ios' && !callee.iosDeviceToken)
  ) {
    return { message: `callee ${notification.callee} is not in the database` };
  }

  let notificationResponse;
  switch (callee.platform) {
    case 'ios':
      notificationResponse = await sendCallNotificationIos({
        uuid: notification.uuid,
        caller: notification.caller,
        iosDeviceToken: callee.iosDeviceToken,
        bundle: `${NOTIFICATIONS.IOS_BUNDLE}.voip`,
      });
      break;
    case 'android':
      notificationResponse = await sendCallNotificationAndroid({
        uuid: notification.uuid,
        caller: notification.caller,
        fcmDeviceToken: callee.fcmDeviceToken,
        bundle: `${NOTIFICATIONS.IOS_BUNDLE}.voip`,
      });
      break;
    default:
      // web browser
      // TODO ??
      return { message: 'calling_web_interface' };
  }
  // console.log('notification', notificationResponse);

  if (notificationResponse) {
    return { message: notificationResponse };
  }
};

/**
 * send a silent notification ios/android
 * @param {Notification} data notification data object
 * @returns information about sent notification 
 */
 export const socketNewNotification = async (data: Notification): Promise<any> => {
  // console.log('socketNewNotification', data);
  let receivingUser: User | undefined

  const notification: Notification = {
    uuid: data.uuid,
    caller: data.caller,
    callee: data.callee,
    webrtc_ready: data.webrtc_ready,
    call_rejected: data.call_rejected,
    call_cancelled: data.call_cancelled,
  };
  if (!notification.uuid || !notification.caller || !notification.callee) {
    return { message: 'uuid, caller and callee are required' };
  }

  const db = connectDb();
  if (data.call_cancelled) {
    receivingUser = await getUser(db, notification.callee)
    .then(data => {
      return data
    })
    .catch(err => {
      console.error(err);
      return err
    });
  } else {
    receivingUser = await getUser(db, notification.caller)
    .then(data => {
      return data
    })
    .catch(err => {
      console.error(err);
      return err
    });
  }
  

  db.close(); //closing connection
  
  if (!receivingUser || (!receivingUser.fcmDeviceToken && receivingUser.platform !== 'web')) {
    return { message: `caller ${notification.caller} is not registered` };
  }
  
  let notificationResponse;
  switch (receivingUser.platform) {
    case 'ios':
      notificationResponse = await sendNotificationIos({
        uuid: notification.uuid,
        callee: notification.callee,
        fcmDeviceToken: receivingUser.fcmDeviceToken,
        bundle: NOTIFICATIONS.ANDROID_BUNDLE,
        webrtc_ready: notification.webrtc_ready,
        call_rejected: notification.call_rejected,
        call_cancelled: notification.call_cancelled,
      });
      break;
    case 'android':
      notificationResponse = await sendNotificationAndroid({
        uuid: notification.uuid,
        callee: notification.callee,
        fcmDeviceToken: receivingUser.fcmDeviceToken,
        bundle: NOTIFICATIONS.ANDROID_BUNDLE,
        webrtc_ready: notification.webrtc_ready,
        call_rejected: notification.call_rejected,
        call_cancelled: notification.call_cancelled,
      });
      break;
    default:
      notificationResponse = {success: 1, message: 'sent to web browser'}
      // web browser
      // TODO deal with webBrowser option
      notificationEvent.emit('silent_notification', notification);
  }

  try {
    if (notificationResponse.success > 0 ) {
      return { message: notificationResponse };
      } else {
      return { message: notificationResponse } ;
    }
  } catch (err) {
    console.error('FCM response error:', err);
  }
};
