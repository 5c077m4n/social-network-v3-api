'use strict';
const router = require('express').Router();
const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const jwtSignPromise = Promise.promisify(jwt.sign);
const resErr = require('../../utils/respond-error');
const User = require('../../models/user');
const secret = require('../../utils/secret').secret;

router.route('/')
.all((req, res, next) => res.status(200).json({"message": "Test successful"}));

router.route('/login')
.post((req, res, next) => {
	return new Promise((resolve, reject) => {
		resolve(User.authenticate(req, res, next));
	})
	.then(user => {
		return jwtSignPromise(
			{_id: user._id, username: user.username,  secret: user.secret, isAdmin: user.isAdmin},
			secret,
			{expiresIn: 24 * 60 * 60, algorithm: 'HS512'}
		)
		.then(decoded => decoded)
		.catch(error => Promise.reject(error));
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
		new User(req.body)
		.save()
		.then(user => {
			if(!user) resErr(res, 500, 'The user has not been created.');
			const token = jwt.sign(
				{_id: user._id, username: user.username, secret: user.secret, isAdmin: user.isAdmin},
				secret,
				{expiresIn: 24 * 60 * 60, algorithm: 'HS512'}
			)
			Promise.resolve([user, token]);
		})
		.catch(err => resErr(res, err.status, err.message));
	}).then(([user, token]) => {
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
