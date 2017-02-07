var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var userSchema = new Schema({
	_id: String,
	going: Array
});

module.exports = mongoose.model('User', userSchema);