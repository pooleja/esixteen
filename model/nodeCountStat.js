var mongoose = require('mongoose');

var nodeCountStatSchema = mongoose.Schema({
  count: {type: Number},
  recordDate: {type: Date, default: Date.now}
});

module.exports = mongoose.model('NodeCountStat', nodeCountStatSchema);
