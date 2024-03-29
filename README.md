# Simple Node server for Push Notifications

This is an example server for react-native-aculab-client package

Using AculabCall component and VoIP Apple notifications and FCM silent notifications.

Please note that Firebase Cloud Messaging (FCM) notifications can be used for call to iOS and Android, however this example server uses Apple Push Notification services (APNs) for iOS call to demonstrate its use.

**Note:** WebRTCDemo browser interface does not make use of notifications, therefore does work only with an app being open. Furthermore, to call WebRTCDemo browser interface, the browser client must be added as a user in this server database.

- [Simple Node server for Push Notifications](#simple-node-server-for-push-notifications)
  - [Apple APNs](#apple-apns)
  - [Aculab and FCM Constants](#aculab-and-fcm-constants)
  - [Use the Server](#use-the-server)
  - [SQLite Database](#sqlite-database)
  - [End Points](#end-points)
    - [/users](#users)
    - [/users/user](#usersuser)
    - [/users/get_token](#usersget_token)
  - [Sockets data](#sockets-data)
    - [Emit data](#emit-data)
      - ['silent_notification'](#silent_notification)
    - [Receive data](#receive-data)
      - ['register'](#register)
      - ['unregister_user'](#unregister_user)
      - ['call_notification'](#call_notification)
      - ['call_cancelled'](#call_cancelled)
  - [Important Notes](#important-notes)
  - [Testing](#testing)
  - [Register/Login user workflow](#registerlogin-user-workflow)
  - [Call via notifications workflow](#call-via-notifications-workflow)
  - [Troubleshooting](#troubleshooting)

## Apple APNs

1. Set up VoIP notifications

2. Download certificate and make it into VOIP.pem certificate

3. Place the certificate to certificates folder

expected VOIP.pem format:

```pem
Bag Attributes
    friendlyName: VoIP Services: ...
    localKeyID: ... 
-----BEGIN CERTIFICATE-----
...
-----END CERTIFICATE-----
Bag Attributes
    friendlyName: ...
    localKeyID: ... 
Key Attributes: <No Attributes>
-----BEGIN PRIVATE KEY-----
...
-----END PRIVATE KEY-----

```

## Aculab and FCM Constants

Store Aculab constants for WebRTC registration and FCM constants for sending silent notifications.

For example this server uses file constants.ts in format (values in this example are fictional)

```ts
// WebRTC constants
const TOKEN_LIFE_TIME = 6000;
const ENABLE_INCOMING_CALL = true;
const CALL_CLIENT_RANGE = '*';
const CLOUD_REGION_ID = '0-2-0';
const CLOUD_USER_NAME = 'charles.new@business.com';
const API_ACCESS_KEY = '_YVDDzhvbzvv8hUEMBybA';
const WEBRTC_ACCESS_KEY = 'heh0zprmk7okgtl90dx9i0odb';
const LOG_LEVEL = 0;

export const WEBRTC_REGISTRATION = {
  TOKEN_LIFE_TIME,
  ENABLE_INCOMING_CALL,
  CALL_CLIENT_RANGE,
  CLOUD_REGION_ID,
  CLOUD_USER_NAME,
  API_ACCESS_KEY,
  WEBRTC_ACCESS_KEY,
  LOG_LEVEL,
};

// Notifications constants
const IOS_BUNDLE = 'org.reactjs.native.example.AnExample';
const ANDROID_BUNDLE = 'com.example.examplecode.AnExample';
const FCM_KEY =
  'ABBBvP8d37w:APB91bHTQNuFw2KtnKOfgWWzo-ljDcy_obIq8n52aHk0vjhtlZlXQ1haTjYJHZK0-pzfU9kuKP6tPTm1PiVc9J1JHDimqxZVnbCKD2mn6yDXpFaye0VuTMDixJw7AW-bIy4gY-_zzjRH';

export const NOTIFICATIONS = {
  IOS_BUNDLE,
  ANDROID_BUNDLE,
  FCM_KEY,
};
```

## Use the Server

Install dependencies

```terminal
npm install
```

Build WebRTC Demo for testing

```terminal
npm run build-webrtc-demo
```

set up sockets for communication between the server and webrtc-demo-client:  
In root folder in server.ts file edit CLIENT_URL to hold webrtc-demo-client url:port

for example:

```typescript
const CLIENT_URL = 'http://localhost:3000';
```

To run the server use run bellow command from root folder

```terminal
npm run dev
```

## SQLite Database

This server uses SQLite database, it requires empty notificationServer.db file in the root folder, the users table is created when the server runs for the first time.

This database registers users and holds platforms tokens.

This Server is for demonstration purposes, however it can be used for production if security measures are put in place
and proper database is set up.

Please be aware that current PK is username

## End Points

### /users

GET - returns all users
POST - registers user - platform expected is ios/android/web

request

```json
{
    "username": "user1",
    "platform": "web"
}
```

PUT - updates existing user, used for getting device tokens after registering with Aculab WebRTC.

request (iosDeviceToken only for ios devices)

```json
{
    "username": "user2",
    "platform": "ios",
    "fcmDeviceToken": "FCM_token",
    "iosDeviceToken": "APNs_token"
}
```

DELETE - deletes user from db

request

```json
{
    "username": "user1"
}
```

### /users/user

GET - returns user details

request

```json
{
    "username": "user2"
}
```

### /users/get_token

POST - refresh WebRTC Token (token is returned)

request

```json
{
    "username": "user2",
    "platform": "ios"
}
```

## Sockets data

Sockets are used for communication between this server and [front end app](https://github.com/aculab-com/webrtc-demo-client).

### Emit data

example of emitting data:

```ts
socket.emit('silent_notification', data);
```

#### 'silent_notification'

argument: an object

```ts
{
  uuid: string,
  caller: string,
  callee: string,
  webrtc_ready?: boolean, // not required
  call_rejected?: boolean, // not required
  call_cancelled?: boolean, // not required
}
```

callback: no callback

### Receive data

example of receiving data:

```ts
socket.on('register', async (newUser: User, callBack) => {
  // process received data
  const userCreated = await socketCreateNewUser(newUser);

  // send response via callback is present
  if (userCreated) {
      callBack('example: User created');
  } else {
    callBack('example: User not created');
  }
});
```

#### 'register'

receiving data: an object

```ts
{
  username: string,
  webrtcToken?: string, // not required
  fcmDeviceToken?: string, // not required
  iosDeviceToken?: string, // not required
  platform?: string, // not required
  logLevel?: string // not required
}
```

callback:  
if error returns an object

```ts
{
  status: 'error',
  data: {
    message: string
  }
}
```

if success returns an object

```ts
{
  status: 'userCreated',
  data: {
    username: string,
    webrtcToken: string,
    webrtcAccessKey: string,
    cloudRegionId: string,
    logLevel: string
  }
}
```

#### 'unregister_user'

receiving data: username as string  
callback: return an object  

```ts
{
  status: string,
  message: string
}
```

#### 'call_notification'

receiving data: an object

```ts
{
  uuid: string,
  caller: string,
  callee: string
}
```

callback: returns a string message

#### 'call_cancelled'

receiving data: an object

```ts
{
  uuid: string,
  caller: string,
  callee: string,
  call_cancelled: boolean
}
```

callback: returns an object

```ts
{
  message: string
}
```

## Important Notes

You cannot call a non-registered user, therefore if you want to call a web browser it has to be registered using "platform": "web" and it needs to have "webrtcToken" not null (any string is ok, e.g. "fake_token").

## Testing

Please note that application launched from terminal/Xcode/Android Studio behaves as separate instance from app launched from the phone. For example if you run an app from Xcode, register user and then kill the app, calling the user starts an app instance which is not registered (uses different storage, therefore the user credentials are not found in the app and the app takes you to the registration screen, however they exist on the server). In this case you can manually delete the user from the server and register again.

**Best testing practice is to install the app on the phone from terminal/Xcode/Android Studio, kill it and open it on the phone. This way you get the correct behavior.**

## Register/Login user workflow

![Register/Login user workflow](media/docs/images/user_registration_login_flow.png)

## Call via notifications workflow

![Call via notifications workflow diagram](media/docs/images/notification_call_flow.png)

## Troubleshooting

If you make a call to and iOS and incoming call notification is not displayed, your issue is likely in voip setting

If you make a call, iOS displays notification but after accepting the call, WebRTC State is idle and inbound is true and your second device shows outbound true and WebRTC Status idle FCM notifications are not going through. Check setting of your notifications in firebase console. Make sure that your iOS side in firebase console has [APNs Authentication Key](https://developer.clevertap.com/docs/how-to-create-an-ios-apns-auth-key), so firebase can send notifications to iOS via apple APNs (firebase -> your_project -> Project settings -> Cloud Messaging).
