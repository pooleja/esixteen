var mongoose = require('mongoose');

var serverSchema = mongoose.Schema({
  ip: {type: String, required: true, unique: true},
  region: String,
  city: String,
  country: String,
  org: String,
  hostname: String,
  loc: String,  
});

module.exports = mongoose.model('Server', serverSchema);
