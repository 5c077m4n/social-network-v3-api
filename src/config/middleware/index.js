'use strict';
const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const jwtVerifyPromise = Promise.promisify(jwt.verify);
const User = require('../../models/user');
const resErr = require('../../utils/respond-error');
const secret = require('../../utils/secret').secret;

const decodeToken = (req, res, next) => {
	return new Promise((resolve, reject) => {
		if(!req.headers['x-access-token']) return resError(res, 403, 'No token provided.');
		const token = req.headers['x-access-token'];
		const decoded = jwt.verify(token, secret, {algorithms: ['HS512']});
		User
		.findById(decoded._id)
		.select('+secret')
		.exec()
		.then(user => {
			if(decoded.secret === user.secret) resolve(decoded);
			return resError(res, 401, null);
		})
		.catch(error => resErr(res, error.status, error.message));
	});
};

module.exports.validVote = (req, res, next) => {
	if(req.params.direction.search(/^(up|down)$/) === -1) return resError(res, 404, 'Undefined direction inserted.');
	else req.vote = req.params.direction;
	next();
};

module.exports.isAdmin = (req, res, next) => {
	const token = req.headers['x-access-token'];
	jwtVerifyPromise(
		token,
		secret,
		{algorithms: ['HS512']}
	)
	.then(decoded => {
		if(decoded.isAdmin) next();
		else resError(res, 401, null);
	})
	.catch(err => resErr(res, err.status, err.message));
};

module.exports.verifyToken = (req, res, next) => {
	decodeToken(req, res, next)
	.then(next)
	.catch(err => resErr(res, err.status, err.message));
};

module.exports.verifyUser = (req, res, next) => {
	decodeToken(req, res, next)
	.then(decoded => {
		if(decoded.isAdmin) return next();
		if(req.params.username !== decoded.username) return resError(res, 401, null);
		else next();
	})
	.catch(err => resErr(res, err.status, err.message));
};

module.exports.verifyAdmin = (req, res, next) => {
	decodeToken(req, res, next)
	.then((decoded) => {
		if(req.params.adminUsername !== decoded.username) resError(res, 401, null);
		else next();
	})
	.catch(err => resErr(res, err.status, err.message));
};
