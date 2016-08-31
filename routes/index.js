var express = require('express');
var router = express.Router();

var Server = require('../model/server.js');
var ServerStat = require('../model/serverStat.js');
var NodeCountStat = require('../model/nodeCountStat.js');
var Env = require('../config/env.js');
var request = require('request');

var ReadWriteLock = require('rwlock');
var lock = new ReadWriteLock();

var ipRegex = require('ip-regex');

var Env = require('../config/env.js');

/* GET home page. */
router.get('/', function(req, res, next) {

  res.render('index', { title: '', AdCentsE16Token: Env.AdCentsE16Token});

});

router.get('/apps/adcentse16', function(req, res, next) {

  res.render('apps/adcentse16', { title: 'Services', AdCentsE16Token: Env.AdCentsE16Token});

});

router.get('/apps/aliensearche16', function(req, res, next) {

  res.render('apps/aliensearche16', { title: 'Services'});

});

router.get('/apps/dnse16', function(req, res, next) {

  res.render('apps/dnse16', { title: 'Services'});

});

router.get('/apps/elastice16', function(req, res, next) {

  res.render('apps/elastice16', { title: 'Services'});

});

router.get('/apps/sensore16', function(req, res, next) {

  res.render('apps/sensore16', { title: 'Services'});

});

router.get('/apps/statse16', function(req, res, next) {

  res.render('apps/statse16', { title: 'Services'});

});

router.get('/apps/speede16', function(req, res, next) {

  res.render('apps/speede16', { title: 'Services'});

});

router.get('/apps/transcodee16', function(req, res, next) {

  res.render('apps/transcodee16', { title: 'Services'});

});


router.get('/learn', function(req, res, next) {

  res.render('learn', { title: 'Learn'});

});

function showRegisterPage(res, errorMessage, successMessage){
  res.render('register', { title: 'Register', RECAPTCHA_SITE_KEY: Env.RECAPTCHA_SITE_KEY, error: errorMessage, success: successMessage});
}

router.get('/register', function(req, res, next) {
  return showRegisterPage(res);
});

router.post('/register', function(req, res, next) {

  var ip = req.body.inputIp;

  if(!ipRegex({exact: true}).test(ip)){
      console.log("Invalid IP submitted: " + ip);
      return showRegisterPage(res, "Invalid IP submitted: " + ip);
  }

  if(ip.indexOf("10.244.") != 0){
    console.log("Invalid Zero Tier IP submitted: " + ip);
    return showRegisterPage(res, "Zero Tier IP address must start with \'10.244.\' ");
  }

  console.log(JSON.stringify(req.body))

  request.post({url:'https://www.google.com/recaptcha/api/siteverify',
                  form: {
                    secret: Env.RECAPTCHA_PRIVATE_KEY,
                    response: req.body['g-recaptcha-response'],
                    remoteip: req.connection.remoteAddress
                  }
                }, function(err,httpResponse,body){

                  // Check if recaptcha succeeded
                  if(err){
                      // Redisplay the form with an error message.
                      console.log("Invalid Recaptcha submitted from IP: " + req.connection.remoteAddress + " with error: " + err);
                      return showRegisterPage(res, "You have failed to calm my fears of Robot Overlords... Please try again.");
                  }

                  // Google tells us this isn't a robot - continut to register the IP
                  Server.findOne({'latestStat.zeroTierIp' : ip}, function(error, foundServer){

                      if(error){
                        console.log(error);
                        return showRegisterPage(res, error);
                      }

                      // If we already have one for this IP just show success
                      if(foundServer){
                        console.log("Request to submit an IP address that is already found:" + ip);
                        return showRegisterPage(res, null, "Server IP was successfully registered.");
                      }

                      var tempServer = {
                        ip : ip,
                        latestStat : {
                          zeroTierIp : ip
                        }
                      };

                      Server(tempServer).save(function(error){
                        if(error){
                          console.log(error);
                          return showRegisterPage(res, error);
                        }
                        return showRegisterPage(res, null, "Server IP was successfully registered.");
                      });

                  });

    });

});


/* GET map page. */
router.get('/map', function(req, res, next) {

  Server.find({}, function(err, servers) {

   var serverList = [];

   for (var i = 0; i < servers.length; i++) {
     var loc = servers[i].loc;
     var latlong = {};
     latlong['lat'] = loc.split(',')[0];
     latlong['long'] = loc.split(',')[1];
     serverList.push(latlong);
   }

   res.render('map', { title: 'Locations', key: Env.MAP_API_KEY, navPoints: serverList });

 });
});

/* GET count page. */
router.get('/count', function(req, res, next) {

 NodeCountStat.find({}, 'count', {sort: 'recordDate'}, function(err, stats) {

   console.log(JSON.stringify(stats));
   var data = [];
   for (var i = 0; i < stats.length; i++) {
     data.push(stats[i].count);
   }

   res.render('counts', { title: 'Counts', data: data });

 });
});

router.post('/upload', function(req, res){

  //console.log(JSON.stringify(req.headers));

  if(req.headers.client != Env.SECRET){
    console.log("Failed client header check");
    return res.json({success: false, error: "Failed client header check"});
  }

  var arrayLength = req.body.pings.length;

  req.body.pings.forEach(function(ping) {
    lock.writeLock(function (release) {

      Server.findOne({ip : ping.server.ip}, function(error, foundServer){

        if(error){
          console.log(error);
          release();
          return res.json({success: false, error: error});
        }

        console.log(JSON.stringify("ping.server: " + JSON.stringify(ping.server)));
        console.log(JSON.stringify("foundServer: " + JSON.stringify(foundServer)));

        if(!foundServer){

          Server(ping.server).save(function(error){
            if(error){
              console.log(error);
              release();
              return res.json({success: false, error: error});
            }

            release();
          });
        }else{
          release();
        }
      });

    });
  });


  // Get the total count of Nodes found to date
  Server.where({}).count(function(error, count){

    if(error){
      console.log("Failed to count nodes: " + error);
      return res.json({success: false, error: error});
    }

    NodeCountStat({count: count}).save(function(error){
      if(error){
        console.log(error);
        return res.json({success: false, error: error});
      }

      console.log("Saved a new record with count: " + count);
      res.json ({success: true});

    });
  });

});

module.exports = router;
