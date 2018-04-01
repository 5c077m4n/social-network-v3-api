'use strict';
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const Promise = require('bluebird');

const resErr = require('../utils/respond-error');
const secret = require('../utils/secret').generateSecret;

const Schema = mongoose.Schema;
const ObjectId = mongoose.Schema.Types.ObjectId;
const bcryptComparePromise = Promise.promisify(bcrypt.compare);
const bcryptHashPromise = Promise.promisify(bcrypt.hash);

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
	bcryptHashPromise(user.password, 14)
	.then(hash => {
		user.password = hash;
		next();
	})
	.catch(err => resErr(res, err.status, err.message));
});
UserSchema.method('update', function(updates, callback) {
	Object.assign(this, updates, {modifiedAt: new Date()});
	this.save(callback);
});

UserSchema.statics.authenticate = function(req, res, next) {
	if(!req.body.username || !req.body.password) resErr(res, 401, 'Both the username and password are required.');
	return new Promise(function(resolve, reject) {
		this
		.findOne({username: req.body.username})
		.select('+password')
		.select('+secret')
		.exec()
		.then(user => {
			if(!user) resErr(res, 401, 'Incorrect username/password inserted.');
			return bcryptComparePromise(req.body.password, user.password)
			.then(same => {
				if(!same) resErr(res, 401, 'Incorrect username/password inserted.');
				user.password = undefined;
				Promise.resolve(user);
			})
			.catch(error => Promise.reject(error));
		})
		.catch(err => resErr(res, err.status, err.message));
	});
};

module.exports = mongoose.model('User', UserSchema);
