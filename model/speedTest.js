var mongoose = require('mongoose');

var speedTestSchema = mongoose.Schema({
  serverIp: String,
  clientIp: String,
  speedMbps: Number,
  createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('SpeedTest', speedTestSchema);
