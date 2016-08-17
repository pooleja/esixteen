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

router.get('/:adId', function(req, res) {
  key = req.params.adId;

  // Get midnight date
  var d = new Date();
  d.setHours(0,0,0,0);

  console.log(d);

  Ad.findOne({siteKey : key, createdDate: {"$lt" : d}}, null, {sort: {createdDate: -1}}, function(error, foundAd){

    if(error || !foundAd){

      if(error)
        console.log(error);

      console.log("Did not find an ad for " + key + " so using default.")
      // Use a default ad
      foundAd = {
        title: "Find Aliens with Bitcoin",
        description: "AlienSearchE16 is a bitcoin payable web app designed for the 21 Marketplace to allow clients to pay for the server to run SETI@home.",
        targetUrl: "https://www.esixteen.co/apps/aliensearche16",
        imageUrl: "https://www.esixteen.co/img/network.png"
      };
    }

    res.render('ad', { ad: foundAd});

  });

});


module.exports = router;
