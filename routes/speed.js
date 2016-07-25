var express = require('express');
var router = express.Router();

var Server = require('../model/server.js');
var SpeedTest = require('../model/speedTest.js');

/* GET the list of IPs. */
router.get('/ips', function(req, res, next) {

  Server.distinct('latestStat.zeroTierIp', function(error, foundIps){
    if(error){
      console.log(error);
      return res.json({success: false, error: error});
    }

    return res.json({success : true, result : foundIps});
  });

});

router.post('/', function(req, res, next) {

  if(req.headers.client != Env.SECRET){
    console.log("Failed client header check");
    return res.json({success: false, error: "Failed client header check"});
  }

  SpeedTest(req.body).save(function(error){
    if(error){
      console.log(error);
      return res.json({success: false, error: error});
    }

    return res.json({success: true});
  });
});
module.exports = router;
