// Users routes

import express from 'express';
import * as usersController from '../../controllers/usersController';

const router = express.Router();

router
  .route('/')
  .get(usersController.routeAllUsers)
  .post(usersController.routeCreateNewUser)
  .put(usersController.routeUpdateUser)
  .delete(usersController.routeDeleteUser);

  router.route('/user').get(usersController.routeGetUser);

  router.route('/get_token').post(usersController.refreshWebrtcToken);

export = router;
