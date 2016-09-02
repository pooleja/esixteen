var express = require('express');
var router = express.Router();

var Env = require('../config/env.js');

router.get('/adcentse16', function(req, res, next) {

  res.render('apps/adcentse16', { title: 'Services', AdCentsE16Token: Env.AdCentsE16Token});

});

router.get('/aliensearche16', function(req, res, next) {

  res.render('apps/aliensearche16', { title: 'Services'});

});

router.get('/dnse16', function(req, res, next) {

  res.render('apps/dnse16', { title: 'Services'});

});

router.get('/elastice16', function(req, res, next) {

  res.render('apps/elastice16', { title: 'Services'});

});

router.get('/reve16', function(req, res, next) {

  res.render('apps/reve16', { title: 'Services'});

});

router.get('/sensore16', function(req, res, next) {

  res.render('apps/sensore16', { title: 'Services'});

});

router.get('/statse16', function(req, res, next) {

  res.render('apps/statse16', { title: 'Services'});

});

router.get('/speede16', function(req, res, next) {

  res.render('apps/speede16', { title: 'Services'});

});

router.get('/transcodee16', function(req, res, next) {

  res.render('apps/transcodee16', { title: 'Services'});

});

module.exports = router;
