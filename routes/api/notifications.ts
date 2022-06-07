// Notification routes

import express from 'express';
import {
  newCallNotification,
  newNotification,
} from '../../controllers/notificationsController';

const router = express.Router();

router.route('/').post(newNotification);
router.route('/call').post(newCallNotification);

export = router;
