// root routes

import express from 'express';
import path from 'path';

const router = express.Router();

// router.get('^/$|/index(.html)?', (req, res) => {
//   //res.sendFile('./views/index.html', { root: __dirname });
//   res.sendFile(path.join(__dirname, '..', 'views', 'index.html'));
// });

router.get('^/$|/index(.html)?', (req, res) => {
  //res.sendFile('./views/index.html', { root: __dirname });
  res.sendFile(path.join(__dirname, '..', 'views', 'test_page.html'));
});

export = router;
