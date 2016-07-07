var mongoose = require('mongoose');

var serverStatSchema = mongoose.Schema({
  serverIp: String,
  zeroTierIp: String,
  cpu_count: Number,
  cpu_used_percent: Number,
  disk_total: Number,
  disk_used_percent: Number,
  memory_total: Number,
  memory_used_percent: Number,
  platform_dist: String,
  platform_release: String,
  platform_system: String,
  isUp: {type : Boolean, default : true}, // will only get set to false if StatsE16 request fails
  createdDate: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ServerStat', serverStatSchema);
