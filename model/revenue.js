var mongoose = require('mongoose');

var daySchema = new mongoose.Schema({
  day: String,
  revenue: Number,
  num_transactions: Number,
});

var revenueSchema = mongoose.Schema({
  totalRevenue: Number,
  totalTransactions: Number,
  createdDate: { type: Date, default: Date.now },
  dailyStats: [daySchema]
});

module.exports = mongoose.model('Revenue', revenueSchema);
