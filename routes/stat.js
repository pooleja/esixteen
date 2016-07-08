var express = require('express');
var router = express.Router();

var Server = require('../model/server.js');
var ServerStat = require('../model/serverStat.js');
var NodeCountStat = require('../model/nodeCountStat.js');

var Env = require('../config/env.js');

router.get('/', function(req, res, next) {

  res.render('stat', { title: 'Stats'});

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

   res.render('map', { title: 'Stats', key: Env.MAP_API_KEY, navPoints: serverList });

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

   res.render('counts', { title: 'Stats', data: data });

 });
});

router.post('/', function(req, res){

  //console.log(JSON.stringify(req.headers) + "\n\n");
  console.log(JSON.stringify(req.body));

  if(req.headers.client != Env.SECRET){
    console.log("Failed client header check");
    return res.json({success: false, error: "Failed client header check"});
  }

  // If the server is up then we have full stats about it
  if(req.body.isUp){

    console.log("Server is up");

    // Save off a latest stats object that will be embedded in the server object
    var latestStat = {
      cpu_count: req.body.cpu_count,
      cpu_used_percent: req.body.cpu_used_percent,
      disk_total: req.body.disk_total,
      disk_used_percent: req.body.disk_used_percent,
      memory_total: req.body.memory_total,
      memory_used_percent: req.body.memory_used_percent,
      platform_dist: req.body.platform_dist,
      platform_release: req.body.platform_release,
      platform_system: req.body.platform_system,
      isUp: true,
      zeroTierIp: req.body.zeroTierIp
    };

    // Find the server by external IP address
    Server.findOne({ip : req.body.server.ip}, function(error, foundServer){

      if(error){
        console.log(error);
        return res.json({success: false, error: error});
      }

      //console.log(JSON.stringify("req.body.server: " + JSON.stringify(req.body.server)));
      //console.log(JSON.stringify("foundServer: " + JSON.stringify(foundServer)));

      if(!foundServer){

        // Save the latest stat object for the server too
        req.body.server.latestStat = latestStat;

        // Save the new server that we have discovered
        Server(req.body.server).save(function(error){
          if(error){
            console.log(error);
            return res.json({success: false, error: error});
          }

        });
      } else {

        // Since we found an existing server object, update the location/stats
        foundServer.region = req.body.server.region;
        foundServer.city = req.body.server.city;
        foundServer.country = req.body.server.country;
        foundServer.org = req.body.server.org;
        foundServer.hostname = req.body.server.hostname;
        foundServer.loc = req.body.server.loc;
        foundServer.latestStat = latestStat;

        // Save it off
        foundServer.save(function(error){
          if(error){
            console.log(error);
            return res.json({success: false, error: error});
          }

        });
      }
    });
  }else{

    console.log("Server is not up");

    // Since the server is down, see if we can find it by the zeroTier IP (we won't get its external IP when it is down)
    Server.findOne({'latestStat.zeroTierIp' : req.body.zeroTierIp}, function(error, foundServer){

      if(error){
        console.log(error);
        return res.json({success: false, error: error});
      }

      // If we found one, mark it as down and save it
      if(foundServer){
        foundServer.latestStat.isUp = false;
        foundServer.save(function(error){

          if(error){
            console.log(error);
            return res.json({success: false, error: error});
          }

        });
      }
    });
  }

  // Set the server IP for the stats object
  if(req.body.isUp){
    req.body.serverIp = req.body.server.ip;
  }

  // Save the server stat info too for historical reasons
  ServerStat(req.body).save(function(error){

    if(error){
      console.log(error);
      return res.json({success: false, error: error});
    }

    return res.json ({success: true});
  });


});

router.get('/oscounts', function(req, res, next) {

  console.log("Getting OS counts.");
  Server.aggregate([
    {
      $group: {
          _id: "$latestStat.platform_system",
          count : { $sum : 1 },
      },
    }
  ], function(err, result){

      if(err){
        console.log(err);
        return res.json({success: false, error : err});
      }

      //console.log("Aggregation: " + JSON.stringify(result));
      return res.json({success: true, result : result});

  });

});

router.get('/current-uptime', function(req, res, next) {

  Server.where({'latestStat.isUp' : true}).count(function(error, upCount){
      Server.where({'latestStat.isUp' : false}).count(function(error, downCount){

        var percentage = ((upCount / (downCount + upCount)) * 100).toFixed(2);

        return res.json({success: true, result : {uptime : percentage}});
      });
  });

});

router.get('/historical-uptime', function(req, res, next) {

  ServerStat.where({'isUp' : true}).count(function(error, upCount){
      ServerStat.where({'isUp' : false}).count(function(error, downCount){

        var percentage = ((upCount / (downCount + upCount)) * 100).toFixed(2);

        return res.json({success: true, result : {uptime : percentage}});
      });
  });
});

router.get('/cpu-capacity', function(req, res, next) {

  Server.aggregate([
    {
      $match: {'latestStat.cpu_count': {$exists: true}}
    },
    {
      $group: {
        _id: null,
        count : { $sum : '$latestStat.cpu_count' },
      },
    }
  ], function(err, result){

      if(err){
        console.log(err);
        return res.json({success: false, error : err});
      }

      console.log("cpu count: " + JSON.stringify(result));
      return res.json({success: true, result : result[0]});

  });

});

router.get('/cpu-utilization', function(req, res, next) {

  Server.aggregate([
    {
      $match: {'latestStat.cpu_used_percent': {$exists: true}}
    },
    {
      $group: {
        _id: null,
        utilization : { $avg : '$latestStat.cpu_used_percent' },
      },
    }
  ], function(err, result){

      if(err){
        console.log(err);
        return res.json({success: false, error : err});
      }

      console.log("cpu_used_percent: " + JSON.stringify(result));
      return res.json({success: true, result : result[0]});

  });

});

router.get('/memory-capacity', function(req, res, next) {

  Server.aggregate([
    {
      $match: {'latestStat.memory_total': {$exists: true}}
    },
    {
      $group: {
        _id: null,
        count : { $sum : '$latestStat.memory_total' },
      },
    }
  ], function(err, result){

      if(err){
        console.log(err);
        return res.json({success: false, error : err});
      }

      console.log("memory count: " + JSON.stringify(result));
      return res.json({success: true, result : result[0]});

  });

});

router.get('/memory-utilization', function(req, res, next) {

  Server.aggregate([
    {
      $match: {'latestStat.memory_used_percent': {$exists: true}}
    },
    {
      $group: {
        _id: null,
        utilization : { $avg : '$latestStat.memory_used_percent' },
      },
    }
  ], function(err, result){

      if(err){
        console.log(err);
        return res.json({success: false, error : err});
      }

      console.log("memory_used_percent: " + JSON.stringify(result));
      return res.json({success: true, result : result[0]});

  });

});

router.get('/disk-capacity', function(req, res, next) {

  Server.aggregate([
    {
      $match: {'latestStat.disk_total': {$exists: true}}
    },
    {
      $group: {
        _id: null,
        count : { $sum : '$latestStat.disk_total' },
      },
    }
  ], function(err, result){

      if(err){
        console.log(err);
        return res.json({success: false, error : err});
      }

      console.log("memory count: " + JSON.stringify(result));
      return res.json({success: true, result : result[0]});

  });

});

router.get('/disk-utilization', function(req, res, next) {

  Server.aggregate([
    {
      $match: {'latestStat.disk_used_percent': {$exists: true}}
    },
    {
      $group: {
        _id: null,
        utilization : { $avg : '$latestStat.disk_used_percent' },
      },
    }
  ], function(err, result){

      if(err){
        console.log(err);
        return res.json({success: false, error : err});
      }

      console.log("memory_used_percent: " + JSON.stringify(result));
      return res.json({success: true, result : result[0]});

  });

});

module.exports = router;
