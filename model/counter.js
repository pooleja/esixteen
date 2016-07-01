var mongoose = require('mongoose');

var counterSchema = mongoose.Schema({
  name: {type: String, required: true},
  count: {type: Number, default: 2}
});

module.exports = mongoose.model('Counter', counterSchema);
