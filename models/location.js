var mongoose = require('mongoose');
var Schema = mongoose.Schema;

var locationSchema = new Schema({
	_id: String,
	name: String,
	attendees: Number,
	image: String,
	rating: Number
});

module.exports = mongoose.model('Location', locationSchema);