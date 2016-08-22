var express = require('express');
var router = express.Router();
var Env = require('../config/env.js');

var Ad = require('../model/ad.js');

router.post('/', function(req, res, next) {
  console.log("In ad post");

  if(req.headers.client != Env.SECRET){
    console.log("Failed client header check");
    return res.json({success: false, error: "Failed client header check"});
  }

  console.log("Req.body");
  console.log(JSON.stringify(req.body));

  Ad(req.body).save(function(error){
    if(error){
      console.log(error);
      return res.json({success: false, error: error});
    }

    return res.json({success: true, message: "Ad successfully created."});
  });

});

router.get('/demo', function(req, res) {

  foundAd = {};

  var title = req.query.title;
  if(title){
    title = title.substring(0, 126);
    foundAd.title = title;
  }

  var description = req.query.description;
  if(description){
    description = description.substring(0, 1024);
    foundAd.description = description;
  }

  var targetUrl = req.query.targetUrl;
  if(targetUrl){
    targetUrl = targetUrl.substring(0, 2024);
    foundAd.targetUrl = targetUrl;
  }

  var imageUrl = req.query.imageUrl;
  if(imageUrl){
    imageUrl = imageUrl.substring(0, 2024);
    foundAd.imageUrl = imageUrl;
  }

  res.render('apps/adcents/demo', { ad: foundAd, title: 'Services'});
});

router.get('/preview', function(req, res){

  // Use a default ad but allow the user to override it
  foundAd = {
    title: "Find Aliens with Bitcoin",
    description: "AlienSearchE16 is a bitcoin payable web app designed for the 21 Marketplace to allow clients to pay for the server to run SETI@home.",
    targetUrl: "https://www.esixteen.co/apps/aliensearche16",
    imageUrl: "https://www.esixteen.co/img/network.png"
  };

  console.log("Title: " + req.query.title);

  var title = req.query.title;
  if(title){
    title = title.substring(0, 126);
    foundAd.title = title;
  }

  var description = req.query.description;
  if(description){
    description = description.substring(0, 1024);
    foundAd.description = description;
  }

  var targetUrl = req.query.targetUrl;
  if(targetUrl){
    targetUrl = targetUrl.substring(0, 2024);
    foundAd.targetUrl = targetUrl;
  }

  var imageUrl = req.query.imageUrl;
  if(imageUrl){
    imageUrl = imageUrl.substring(0, 2024);
    foundAd.imageUrl = imageUrl;
  }

  res.render('ad', { ad: foundAd});
});

// Get status about a campaign
router.get('/stats/:campaignKey', function(req, res){

  if(req.headers.client != Env.SECRET){
    console.log("Failed client header check");
    return res.json({success: false, error: "Failed client header check"});
  }

  campaignKey = req.params.campaignKey;

  // Find the ad by ID and update the click count for it
  Ad.findOne( {campaignKey : campaignKey}, function(error, foundAd){

    // Check to see if the ad was found
    if(error || !foundAd){

      if(error){
        console.log(error);
        return res.json({success: false, error: error});
      }

      return res.json({success: false, error: "Campaign Key not found."});
    }

    return res.json({
        success: true,
        impressionCount: foundAd.impressionCount,
        clickthroughCount: foundAd.clickthroughCount,
      });
  });
});

router.get('/redirect/:campaignKey', function(req, res){

  key = req.params.campaignKey;

  // Find the ad by ID and update the click count for it
  Ad.findOneAndUpdate( {campaignKey : key}, {$inc: { clickthroughCount: 1 } }, {upsert: false, sort: {createdDate: -1}}, function(error, foundAd){

    // Check to see if the ad was found
    if(error || !foundAd){

      if(error)
        console.log(error);

      // Redirect to home page?
      res.redirect('/');
    }

    res.redirect(foundAd.targetUrl);
  });
});

router.get('/:siteKey', function(req, res) {
  key = req.params.siteKey;

  // Get midnight date - set to hour = 4 due to UTC time from EST
  var d = new Date();
  d.setHours(4,0,0,0);

  console.log(d);

  // Find the ad by ID and update the impression count for it
  Ad.findOneAndUpdate( {siteKey : key, createdDate: {"$lt" : d}}, {$inc: { impressionCount: 1 } }, {upsert: false, sort: {createdDate: -1}}, function(error, foundAd){

    if(error || !foundAd){

      if(error)
        console.log(error);

      console.log("Did not find an ad for " + key + " so using default.")
      // Use a default ad
      foundAd = {
        title: "Find Aliens with Bitcoin",
        description: "AlienSearchE16 is a bitcoin payable web app designed for the 21 Marketplace to allow clients to pay for the server to run SETI@home.",
        targetUrl: "https://www.esixteen.co/apps/aliensearche16",
        imageUrl: "https://www.esixteen.co/img/network.png",
        siteKey: key,
        campaignKey: key, // Use a fake campaignKey
      };
    }

    res.render('ad', { ad: foundAd});

  });

});

module.exports = router;
