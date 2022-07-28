import { Request, Response } from 'express';
import { getToken } from '../middleware/userRegistration';
import type { User } from '../types/types';
import { connectDb, createNewUser, deleteUser, getAllUsers, getUser, updateFcmToken, updateIosToken, updatePlatform, updateWebrtcToken } from '../middleware/dbHandler';

import { WEBRTC_REGISTRATION } from '../constants';

/**
 * return all users
 * @param {Request} req request from route
 * @param {Response} res response to route
 */
export const routeAllUsers = (req: Request, res: Response) => {
  const db = connectDb();
  getAllUsers(db, (data: any) => {
    res.status(200).json(data);
  })
};

/**
 * return user if exists
 * @param {Request} req request from route (requires username)
 * @param {Response} res response to route
 */
export const routeGetUser = async (req: Request, res: Response) => {
  if (!req.body.username) {
    return res.status(400).json({message: 'username is required'});
  };
  const db = connectDb();
  const user = await getUser(db, req.body.username)
    .then(data => {
      return data
    })
    .catch(err => {
      console.error(err);
      return err
    });

  db.close(); //closing connection
  if (user) {
    return res.status(200).json(user);
  } else {
    return res.status(400).json({message: 'username not found'});
  }
};

/**
 * creates user if the username is free
 * also it assigns webRTC Token
 * @param {Request} req request from route (requires username and platform)
 * @param {Response} res response to route
 * @returns information about new user created
 */
export const routeCreateNewUser = async (req: Request, res: Response) => {
  if (!req.body.username) {
    return res.status(400).json({message: 'username is required'});
  };
  if (!req.body.platform) {
    return res.status(400).json({message: 'platform is required'});
  };

  const db = connectDb();
  // check if user exist
  const existingUser = await getUser(db, req.body.username)
    .then(data => {
      return data
    })
    .catch(err => {
      console.error(err);
      return err
    });

  if (existingUser) {
    db.close(); //closing connection
    return res.status(400).json({message: 'username already exists'});
  }

  const newUser: User = {
    username: req.body.username,
    fcmDeviceToken: req.body.fcmDeviceToken,
    iosDeviceToken: req.body.iosDeviceToken,
    platform: req.body.platform,
  };

  const webRtcToken = await getToken({
    registerClientId: newUser.username,
    tokenLifeTime: WEBRTC_REGISTRATION.TOKEN_LIFE_TIME,
    enableIncomingCall: WEBRTC_REGISTRATION.ENABLE_INCOMING_CALL,
    callClientRange: WEBRTC_REGISTRATION.CALL_CLIENT_RANGE,
    cloudRegionId: WEBRTC_REGISTRATION.CLOUD_REGION_ID,
    cloudUsername: WEBRTC_REGISTRATION.CLOUD_USER_NAME,
    apiAccessKey: WEBRTC_REGISTRATION.API_ACCESS_KEY,
  });

  if (webRtcToken) {
    newUser.webrtcToken = webRtcToken;

    const createdUser: any = await createNewUser(db, newUser)
    .then(data => {
      return data
    })
    .catch(err => {
      console.error(err);
      return err
    });

    db.close(); //closing connection
    if (createdUser) {
      return res.status(201).json({
        username: createdUser.username,
        webrtcToken: createdUser.webrtcToken,
        webrtcAccessKey: WEBRTC_REGISTRATION.WEBRTC_ACCESS_KEY,
        cloudRegionId: WEBRTC_REGISTRATION.CLOUD_REGION_ID,
        logLevel: WEBRTC_REGISTRATION.LOG_LEVEL
      });
    }
  return res.status(400).json({error: 'user not created'});
  }
};

/**
 * if user exists in the database, it refreshes webRTC Token, saves it to the user on the server
 * and sends the token back to the user
 * @param {Request} req request from route (requires username and platform)
 * @param {Response} res response to route
 * @returns refreshed WebRTC Token
 */
export const refreshWebrtcToken = async (req: Request, res: Response) => {
  if (!req.body.username) {
    return res.status(400).json({message: 'username is required'});
  };
  if (!req.body.platform) {
    return res.status(400).json({message: 'platform is required'});
  };

  const db = connectDb();
  // check if user exist
  const existingUser = await getUser(db, req.body.username)
    .then(data => {
      return data
    })
    .catch(err => {
      console.error(err);
      return err
    });

  if (!existingUser) {
    db.close(); //closing connection
    return res.status(400).json({message: `username ${req.body.username} not found`});
  }

  const webRtcToken = await getToken({
    registerClientId: existingUser.username,
    tokenLifeTime: WEBRTC_REGISTRATION.TOKEN_LIFE_TIME,
    enableIncomingCall: WEBRTC_REGISTRATION.ENABLE_INCOMING_CALL,
    callClientRange: WEBRTC_REGISTRATION.CALL_CLIENT_RANGE,
    cloudRegionId: WEBRTC_REGISTRATION.CLOUD_REGION_ID,
    cloudUsername: WEBRTC_REGISTRATION.CLOUD_USER_NAME,
    apiAccessKey: WEBRTC_REGISTRATION.API_ACCESS_KEY,
  });

  if (webRtcToken) {
    existingUser.webrtcToken = webRtcToken;
    existingUser.platform = req.body.platform

    const updatedUser: any = await updateWebrtcToken(db, existingUser)
    .then(() => updatePlatform(db, existingUser))
    .then(data => {
      return data
    })
    .catch(err => {
      console.error(err);
      return err
    });

    db.close(); //closing connection
    if (updatedUser) {
      return res.status(200).json({
        username: updatedUser.username,
        webrtcToken: updatedUser.webrtcToken,
        webrtcAccessKey: WEBRTC_REGISTRATION.WEBRTC_ACCESS_KEY,
        cloudRegionId: WEBRTC_REGISTRATION.CLOUD_REGION_ID,
        logLevel: WEBRTC_REGISTRATION.LOG_LEVEL
      });
    }
  return res.status(400).json({error: 'Token not refreshed'});
  }
};

/**
 * updates platform and fcmDeviceToken, if iosDevice token in request it gets updated as well
 * @param {Request} req request from route (requires username, platform and fcmDeviceToken)
 * @param {Response} res response to route
 * @returns updated user
 */
export const routeUpdateUser = async (req: Request, res: Response) => {
  if (!req.body.username) {
    return res.status(400).json({message: 'username is required'});
  };
  if (!req.body.platform) {
    return res.status(400).json({message: 'platform is required'});
  };
  if (!req.body.fcmDeviceToken) {
    return res.status(400).json({message: 'fcmDeviceToken is required'});
  };

  const db = connectDb();
  // check if user exist
  const existingUser = await getUser(db, req.body.username)
    .then(data => {
      return data
    })
    .catch(err => {
      console.error(err);
      return err
    });

  if (!existingUser) {
    db.close(); //closing connection
    return res.status(400).json({message: `username ${req.body.username} not found`});
  }

  existingUser.fcmDeviceToken = req.body.fcmDeviceToken;
  existingUser.platform = req.body.platform;
  if (req.body.iosDeviceToken) {
    existingUser.iosDeviceToken = req.body.iosDeviceToken;
  }

  const updatedUser: any = await updateWebrtcToken(db, existingUser)
  .then(() => updatePlatform(db, existingUser))
  .then(() => updateFcmToken(db, existingUser))
  .then(() => updateIosToken(db, existingUser))
  .then(data => {
    return data
  })
  .catch(err => {
    console.error(err);
    return err
  });

  db.close(); //closing connection
  if (updatedUser) {
    return res.status(200).json({message: updatedUser});
  }
  return res.status(400).json({error: 'user was not updated'});
};

/**
 * delete user from database
 * @param {Request} req request from route (requires username)
 * @param {Response} res response to route
 * @returns information if user was or was not deleted
 */
export const routeDeleteUser = async (req: Request, res: Response) => {
  if (!req.body.username) {
    return res.status(400).json({message: 'username is required'});
  }

  const db = connectDb();

  const existingUser = await getUser(db, req.body.username)
    .then(data => {
      if (data) {
        deleteUser(db, req.body.username)
      }
      return data
    })
    .catch(err => {
      console.error(err);
      return err
    });

  db.close(); //closing connection
  if (existingUser) {
    return res.status(200).json({message: `user ${req.body.username} was deleted`});
  }
  return res.status(400).json({error: `user ${req.body.username} was not found`});
};
