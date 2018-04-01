'use strict';
const router = require('express').Router();
const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const jwtSignPromise = Promise.promisify(jwt.sign);
const resErr = require('../../utils/respond-error');
const User = require('../../models/user');
const secret = require('../../utils/secret').secret;

router.route('/')
.all((req, res, next) => res.status(200).json({"message": "Great success!"}));

router.route('/login')
.post((req, res, next) => {
	User.authenticate(req, res, next)
	.then(user => {
		return jwt.sign(
			{_id: user._id, username: user.username,  secret: user.secret, isAdmin: user.isAdmin},
			secret,
			{expiresIn: 24 * 60 * 60, algorithm: 'HS512'}
		);
	})
	.then(token => res.status(200).json({
		auth: true,
		token
	}))
	.catch(err => resErr(res, err.status, err.message));
});

router.route('/register')
.post((req, res, next) => {
	return new Promise((resolve, reject) => {
		resolve(
			new User(req.body)
			.save()
			.then(user => user)
			.catch('MongoError', err => resErr(res, 500, `This user already exists. (MongoDB code: ${err.status})`))
			.catch('BulkWriteError', err => resErr(res, 500, `This user already exists. (MongoDB code: ${err.status})`))
			.catch(err => Promise.reject(err))
		);
	})
	.then(user => {
		if(!user) resErr(res, 500, 'The user has NOT been created.');
		const token = jwt.sign(
			{_id: user._id, username: user.username, secret: user.secret, isAdmin: user.isAdmin},
			secret,
			{expiresIn: 24 * 60 * 60, algorithm: 'HS512'}
		)
		return([user, token]);
	})
	.then(([user, token]) => {
		user.password = undefined;
		user.secret = undefined;
		res.status(201).json({
			user,
			auth: true,
			token
		});
	})
	.catch(err => resErr(res, err.status, err.message));
});

module.exports = router;
