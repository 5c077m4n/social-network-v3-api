'use strict';

const fs = require('fs');

const router = require('express').Router();
const Promise = require('bluebird');
const jwt = Promise.promisifyAll(require('jsonwebtoken'));

const resErr = require('../../utils/respond-error');
const User = require('../../models/user');
const secret = require('../../utils/secret').secret;


router.route('/')
.all((req, res, next) => res.status(200).json({
	"message": "Great success!"
}));

router.route('/logs')
.get((req, res, next) => {
	const file = fs.createReadStream('../../utils/webapp.log');
	file.pipe(res);
})
.post((req, res, next) => {
	const file = fs.createWriteStream('../../utils/webapp.log');
	file.write(req.body.log);
})
.delete((req, res, next) => {})

router.route('/login')
.post((req, res, next) => {
	User
		.authenticate(res, req.body.username, req.body.password)
		.then(user => {
			return jwt.signAsync(
					{_id: user._id, username: user.username,  secret: user.secret, isAdmin: user.isAdmin},
					secret,
					{expiresIn: 24 * 60 * 60, algorithm: 'HS512'}
				)
				.then(token => token)
				.catch(Promise.reject);
		})
		.then(token => {
			return res.status(200).json({
				auth: true,
				token
			});
		})
		.catch(err => resErr(res, err.status, err.message));
});

router.route('/register')
.post((req, res, next) => {
	new User(req.body)
		.save()
		.then(user => {
			if(!user) return resErr(res, 500, 'The user has NOT been created.');
			return jwt.signAsync(
				{_id: user._id, username: user.username, secret: user.secret, isAdmin: user.isAdmin},
				secret,
				{expiresIn: 24 * 60 * 60, algorithm: 'HS512'}
			)
			.then(token => ([user, token]))
			.catch(Promise.reject);
		})
		.then(([user, token]) => {
			user.password = undefined;
			user.secret = undefined;
			return res.status(201).json({
				user,
				auth: true,
				token
			});
		})
		.catch(err => resErr(res, err.status, err.message));
});

module.exports = router;
