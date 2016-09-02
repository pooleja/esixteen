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
