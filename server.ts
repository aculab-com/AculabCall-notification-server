import express, { Express } from 'express';
import path from 'path';
import cors from 'cors';
import { Server, Socket } from 'socket.io';

import corsOptions from './config/cordOptions';
import { logger } from './middleware/logEvents';
import errorHandler from './middleware/errorHandler';

import root from './routes/root';
import users from './routes/api/users';
import notifications from './routes/api/notifications';
import { connectDb } from './middleware/dbHandler';
import { socketCreateNewUser } from './controllers/usersController';

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
app.use(cors(corsOptions));

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

const io = new Server(server, {
  cors: {
    origin: CLIENT_URL
  }
});

io.on ('connection', (socket: Socket) => {
  console.log('socket.io id:', socket.id);

  socket.on('register', async (data: any) => {
    socket.join(data);
    console.log('socket.io registered data:', data);
    const userCreated = await socketCreateNewUser(data);

    if (userCreated) {
      socket.emit('register_user_response', userCreated);
    }
  })

  socket.on('disconnect', () => {
    console.log('socket.id: user disconnected');
  });
});