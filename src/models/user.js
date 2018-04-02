'use strict';
const mongoose = require('mongoose');
const Promise = require('bluebird');
const bcrypt = Promise.promisifyAll(require('bcrypt'));

const resErr = require('../utils/respond-error');
const secret = require('../utils/secret').generateSecret;

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;

const UserSchema = new Schema({
	username: {type: String, minlength: 3, maxlength: 100, unique: [true, 'This username has already been taken.'], required: true},
	email: {type: String, trim: true, maxlength: 100, unique: [true, 'This email is currently in use.']},
	password: {type: String, required: true, select: false, minlength: 3, maxlength: 100},
	secret: {type: String, required: true, select: false, default: secret()},
	name: {type: String, default: "", maxlength: 100},
	profilePic: {type: String, default: ""},
	bio: {type: String, maxlength: 200},
	dateOfBirth: {type: Date, default: "1970-01-01"},
	gender: {type: String, enum: ["male", "female"]},
	createdAt: {type: Date, default: Date.now},
	modifiedAt: {type: Date, default: Date.now},
	isAdmin: {type: Boolean, default: false},
	following: [ObjectId]
});
UserSchema.pre('save', function(next) {
	const user = this;
	return bcrypt.hash(user.password, 14)
		.then(hash => {
			user.password = hash;
			return next();
		})
		.catch(next);
});
UserSchema.method('update', function(updates, callback) {
	Object.assign(this, updates, {modifiedAt: new Date()});
	this.save(callback);
});

UserSchema.statics.authenticate = function(res, username, password) {
	if(!username || !password) return resErr(res, 401, 'Both the username and password are required.');
	else return this
		.findOne({username})
		.select('+password')
		.select('+secret')
		.exec()
		.then(user => {
			if(!user) return resErr(res, 401, 'Incorrect username/password inserted.');
			return bcrypt.compare(password, user.password)
				.then(same => {
					if(!same) return resErr(res, 401, 'Incorrect username/password inserted.');
					user.password = undefined;
					return user;
				})
				.catch(Promise.reject);
		})
		.catch(Promise.reject)
};

module.exports = mongoose.model('User', UserSchema);
