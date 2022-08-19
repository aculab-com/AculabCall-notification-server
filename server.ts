import express, { Express } from 'express';
import path from 'path';
import cors from 'cors';
import { Server, Socket } from 'socket.io';

// import corsOptions from './config/cordOptions';
import { logger } from './middleware/logEvents';
import errorHandler from './middleware/errorHandler';

import root from './routes/root';
import users from './routes/api/users';
import notifications from './routes/api/notifications';
import { connectDb } from './middleware/dbHandler';
import {
  socketCreateNewUser,
  socketDeleteUser,
} from './controllers/usersController';
import {
  notificationEvent,
  socketNewCallNotification,
  socketNewNotification,
} from './controllers/notificationsController';
import {
  CallNotification,
  OutboundCall,
  RegResponse,
  unRegResponse,
  User,
} from './types/types';

const CLIENT_URL = 'http://localhost:3000';

const db = connectDb();

db.serialize(function () {
  // create users table if it does not exist
  db.run(
    'CREATE TABLE IF NOT EXISTS users(username, webrtcToken, platform, fcmDeviceToken, iosDeviceToken)'
  );
});
db.close();

const PORT = process.env.PORT || 3500;
const app: Express = express();
// express works like a waterfall, therefore higher lines of code are executed before lower lines of code

// custom middleware logger
app.use(logger);

app.use(
  '/aculab_webrtc',
  express.static(__dirname + '/node_modules/aculab-webrtc')
);
app.use('/root', express.static(__dirname + '/'));

// Cross Origin Resource Sharing
// app.use(cors(corsOptions));
app.use(cors());

// built-in middleware to handle urlencoded data
// in other words, form data:
// ‘content-type: application/x-www-form-urlencoded’
app.use(express.urlencoded({ extended: false }));

// built-in middleware for json
app.use(express.json());

//serve static files
app.use('/', express.static(path.join(__dirname, '/public')));

app.use('/', root);
app.use('/users', users);
app.use('/notifications', notifications);

// app.all applies to all http methods (GET, POST, etc.)
app.all('*', (req, res) => {
  res.status(404);
  if (req.accepts('html')) {
    res.sendFile(path.join(__dirname, 'views', '404.html'));
  } else if (req.accepts('json')) {
    res.json({ error: '404 Not Found' });
  } else {
    res.type('txt').send('404 Not Found');
  }
});

app.use(errorHandler);

const server = app.listen(PORT, () =>
  console.log(`Server running on port ${PORT}`)
);

// create is server
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

// io socket connected
io.on('connection', (socket: Socket) => {
  console.log('socket.io id:', socket.id);

  // register user received via socket.io
  socket.on('register', async (newUser: User, callBack) => {
    // console.log('socket.io registered data:', newUser);
    const userCreated = await socketCreateNewUser(newUser);
    let data: RegResponse;

    if (userCreated) {
      if (userCreated.message) {
        data = {
          status: 'error',
          data: userCreated,
        };
      } else {
        data = {
          status: 'userCreated',
          data: userCreated as User,
        };
      }
    } else {
      data = {
        status: 'error',
        data: { message: 'User not created' },
      };
    }
    // return response 
    callBack(data);
  });

  // unregister user received via socket.io
  socket.on('unregister_user', async (username: string, callBack) => {
    console.log('socket.io unregister user:', username);
    const response = await socketDeleteUser(username);
    let data: unRegResponse;

    if (response) {
      data = {
        status: 'deleted',
        message: response.message,
      };
    } else {
      data = {
        status: 'error',
        message: 'user not deleted',
      };
    }
    // return response
    callBack(data);
  });

  // send call notification received via socket.io
  socket.on(
    'call_notification',
    async (callNotification: CallNotification, callBack) => {
      // console.log('call_notification from socket', callNotification);
      const response: { message: string } = await socketNewCallNotification(
        callNotification
      );

      if (response) {
        callBack(response.message);
      } else {
        callBack('problems sending notification');
      }
    }
  );

  // transmit via socket.io, used for letting browser know that iOS or Android
  // WebRTC module is ready to receive WebRTC call
  notificationEvent.on('silent_notification', (data) => {
    // console.log('server silent notification emitted data', data);
    socket.emit('silent_notification', data);
  });

  // send cancel call notification to ios/android
  // used when call canceled in browser before WebRTC connection is established
  socket.on('call_canceled', async (data: OutboundCall, callBack) => {
    // console.log('call_canceled emitted data', data);
    const result = await socketNewNotification(data);

    if (result) {
      callBack(result);
    }
  });

  // disconnect the socket
  socket.on('disconnect', () => {
    notificationEvent.removeAllListeners();
    console.log('socket.id: user disconnected');
  });
});
