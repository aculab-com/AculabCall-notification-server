import sqlite3, { Database } from 'sqlite3';
import { User } from '../types/types';

/**
 * connect to the db ./notificationServer.db
 */
 export const connectDb = () => {
  const db = new sqlite3.Database('./notificationServer.db', sqlite3.OPEN_READWRITE, err => {
    if (err) return console.error('db error', err.message);

    console.log('db connected');
  });

  return db;
};

/**
 * insert into users table sql command
 * insert takes: username, webrtcToken, platform, fcmDeviceToken, iosDeviceToken
 */
export const usersDb = {
  findUser: `SELECT * FROM users WHERE username = ?`,
  returnAll: `SELECT * FROM users`,
  createUser: `INSERT INTO users (webrtcToken, username, platform)
            VALUES(?,?,?)`,
  updateWebrtcToken: `UPDATE users SET webrtcToken = ? WHERE username = ?`,
  updateFcmToken: `UPDATE users SET fcmDeviceToken = ? WHERE username = ?`,
  updateIosToken: `UPDATE users SET iosDeviceToken = ? WHERE username = ?`,
  updatePlatform: `UPDATE users SET platform = ? WHERE username = ?`,
  delete: `DELETE FROM users WHERE username = ?`
};

/**
 * finds all users in database and stores them in data array
 * @param {Database} db database connection
 * @param {CallableFunction} callback function
 */
export const getAllUsers = (db: Database, callback: CallableFunction) => {
  let data: any = [];
  db.serialize(function() {
    db.each(usersDb.returnAll, (err: Error, row: User) => {
      if (err) return console.error('db error', err.message);
      data.push(row);
    }, function(){ // calling function when all rows have been pulled
      db.close(); //closing connection
      callback(data);
    });
  })
};

/**
 * use to find a user in database
 * @param {Database} db database connection 
 * @param {string} username user to be found in database
 * @returns {Promise} user
 */
export const getUser = async (db: Database, username: string): Promise<any> => {
  return new Promise((resolve, reject) => {
    let user: User | undefined;
    db.each(usersDb.findUser, [username], (err: Error, row: User) => {
      if (err) {
        reject(err.message)
      } else {
        user = row;
      }
    }, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  })
};

/**
 * creates new user
 * @param {Database} db database connection 
 * @param {User} newUser user object (expected webrtcToken, username and platform)
 * @returns {Promise} user if created
 */
export const createNewUser = async (db: Database, newUser: User) => {
  return new Promise((resolve, reject) => {
    db.run(usersDb.createUser, [newUser.webrtcToken, newUser.username, newUser.platform], (err: Error) => {
      if (err) {
        reject(err.message)
      }
    }, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve(newUser);
      }
    });
  })
};

/**
 * use to update platform for a user in db
 * @param {Database} db database connection 
 * @param {User} user user object (expected username and platform)
 * @returns {Promise} updated user
 */
export const updatePlatform = async (db: Database, user: User) => {
  return new Promise((resolve, reject) => {
    db.run(usersDb.updatePlatform, [user.platform, user.username], (err: Error) => {
      if (err) {
        reject(err.message)
      }
    }, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  })
}

/**
 * use to update FCM Token for a user in db
 * @param {Database} db database connection 
 * @param {User} user user object (expected username and fcmDeviceToken)
 * @returns {Promise} updated user
 */
export const updateFcmToken = async (db: Database, user: User) => {
  return new Promise((resolve, reject) => {
    db.run(usersDb.updateFcmToken, [user.fcmDeviceToken, user.username], (err: Error) => {
      if (err) {
        reject(err.message)
      }
    }, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  })
}

/**
 * use to update iOS APN Token for a user in db
 * @param {Database} db database connection 
 * @param {User} user user object (expected username and iosDeviceToken)
 * @returns {Promise} updated user
 */
export const updateIosToken = async (db: Database, user: User) => {
  return new Promise((resolve, reject) => {
    db.run(usersDb.updateIosToken, [user.iosDeviceToken, user.username], (err: Error) => {
      if (err) {
        reject(err.message)
      }
    }, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  })
}

/**
 * use to update WebRTC Token for a user in db
 * @param {Database} db database connection 
 * @param {User} user user object (expected username and webrtcToken)
 * @returns {Promise} updated user
 */
export const updateWebrtcToken = async (db: Database, user: User) => {
  return new Promise((resolve, reject) => {
    db.run(usersDb.updateWebrtcToken, [user.webrtcToken, user.username], (err: Error) => {
      if (err) {
        reject(err.message)
      }
    }, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve(user);
      }
    });
  })
}

/**
 * delete user if exists
 * @param {Database} db 
 * @param {string} username 
 * @returns {Promise} string
 */
export const deleteUser = async (db: Database, username: string) => {
  return new Promise((resolve, reject) => {
    db.run(usersDb.delete, [username], (err: Error) => {
      if (err) {
        reject(err.message)
      }
    }, (err: Error) => {
      if (err) {
        reject(err);
      } else {
        resolve(`user ${username} deleted`);
      }
    });
  })
}
