var mongoose = require('mongoose');

var serverSchema = mongoose.Schema({
  ip: {type: String, required: true, unique: true},
  region: String,
  city: String,
  country: String,
  org: String,
  hostname: String,
  loc: String,
  latestStat : {
    cpu_count: Number,
    cpu_used_percent: Number,
    disk_total: Number,
    disk_used_percent: Number,
    memory_total: Number,
    memory_used_percent: Number,
    platform_dist: String,
    platform_release: String,
    platform_system: String,
    isUp: {type : Boolean, default : true},
    zeroTierIp: String,
  }
});

module.exports = mongoose.model('Server', serverSchema);
