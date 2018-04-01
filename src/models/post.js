'use strict';
const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const PostSchema = new Schema({
	content: String,
	contentType: {type: String, enum: ['text', 'picture', 'audio', 'video'], default: 'text'},
	createdAt: {type: Date, default: Date.now},
	modifiedAt: {type: Date, default: Date.now},
	userID: {type: ObjectId, required: true},
	parentPostID: ObjectId,
	votes: {type: Number, default: 0},
	isHidden: {type: Boolean, default: false}
});
PostSchema.method('update', function(updates, callback) {
	Object.assign(this, updates, {modifiedAt: new Date()});
	this.save(callback);
});
PostSchema.method('vote', function(vote, callback) {
	if(vote.toLowerCase() === 'up') this.votes += 1;
	if(vote.toLowerCase() === 'down') this.votes -= 1;
	this.save(callback);
});

module.exports = mongoose.model('Post', PostSchema);
