var mongoose = require('mongoose');

var adSchema = mongoose.Schema({
  title: String,
  description: String,
  imageUrl: String, // The target of the image to show for the url
  targetUrl: String, // The target url of the ad - user clicks on ad and is taken to this url
  hostedUrl: String, // The website URL where this should be allow to be hosted
  siteKey: String,
  createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Ad', adSchema);
