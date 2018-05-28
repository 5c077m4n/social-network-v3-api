'use strict';

const path = require('path');

const router = require('express').Router();
const Promise = require('bluebird');
const jwt = Promise.promisifyAll(require('jsonwebtoken'), {suffix: 'Promise'});
const fs = Promise.promisifyAll(require('fs'), {suffix: 'Promise'});

const resErr = require('../../utils/respond-error');
const User = require('../../models/user');
const secret = require('../../utils/secret').secret;


router.route('/')
.all((req, res, next) => res.status(200).json({
	"message": "Great success!"
}));

router.route('/logs')
.get((req, res, next) => {
	return fs.readFilePromise(path.join(__dirname, '../../utils/webapp.log'), 'utf8')
		.then(content => res.status(200).json({content}))
		.catch(error => resErr(res, error.status, error.message));
})
.post((req, res, next) => {
	const webappLogStream = fs.createWriteStream(
		path.join(__dirname, '../../utils/webapp.log'), {'flags': 'a'}
	);
	return fs.readFilePromise(path.join(__dirname, '../../utils/webapp.log'), 'utf8')
		.then(content => req.body.log.forEach(msg => {
			if(content.indexOf(msg) === (-1)) webappLogStream.write(`${msg}\n`);
		}))
		.then(() => res.status(200).json({message: 'Log written.'}))
		.catch(error => resErr(res, error.status, error.message));
})
.put((req, res, next) => {
	return fs.appendFilePromise(
		path.join(__dirname, '../../utils/webapp.log'),
		`${req.body.log}\n`,
		'utf8'
	)
		.then(() => res.status(200).json({message: `${req.body.log} logged.`}))
		.catch(error => resErr(res, error.status, error.message));
})
.delete((req, res, next) => {
	return fs.truncatePromise(path.join(__dirname, '../../utils/webapp.log'), 0)
		.then(() => res.status(200).json({message: 'Log cleared.'}))
		.catch(error => resErr(res, error.status, error.message));
});

router.route('/login')
.post((req, res, next) => {
	User
		.authenticate(res, req.body.username, req.body.password)
		.then(user => {
			return jwt.signPromise(
					{_id: user._id, username: user.username,  secret: user.secret, isAdmin: user.isAdmin},
					secret,
					{expiresIn: 24 * 60 * 60, algorithm: 'HS512'}
				)
				.then(token => token)
				.catch(Promise.reject);
		})
		.then(token => {
			// res.status(200).cookie(
			// 	'token',
			// 	token,
			// 	{httpOnly: true, secure: false}
			// );
			return res.status(200).json({
				token,
				expiration: (new Date().getTime() + 24 * 60 * 60 * 1000)
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
			return jwt.signPromise(
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
			// res.status(201).cookie(
			// 	'token',
			// 	token,
			// 	{httpOnly: true, secure: false}
			// );
			return res.status(201).json({
				token,
				expiration: new Date().getTime() + 24 * 60 * 60 * 1000
			});
		})
		.catch(err => resErr(res, err.status, err.message));
});

module.exports = router;
