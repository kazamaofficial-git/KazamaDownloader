'use strict';
const express = require('express');
const { catalog } = require('../platforms');
const components = require('../../licenses/components.json');

const router = express.Router();

router.get('/', (req, res) => {
  res.render('index', { title: 'DownloadIn — Download video, MP3 & foto gratis', catalog: catalog(), page: 'home' });
});

router.get('/lisensi', (req, res) => {
  res.render('licenses', { title: 'Lisensi — DownloadIn', page: 'licenses', web: components.web, trademarks: components.trademarks });
});

module.exports = router;
