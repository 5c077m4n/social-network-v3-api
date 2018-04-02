'use strict';

const Promise = require('bluebird');
const jwt = Promise.promisifyAll(require('jsonwebtoken'));

const User = require('../../models/user');
const resErr = require('../../utils/respond-error');
const secret = require('../../utils/secret').secret;

const decodeToken = (req, res, next) => {
	if(!req.headers['x-access-token']) return resErr(res, 403, 'No token provided.');
	const token = req.headers['x-access-token'];
	const decoded = jwt.verify(token, secret, {algorithms: ['HS512']})
		.then(decoded => decoded)
		.catch(error => resErr(res, error.status, error.message));

	User
		.findById(decoded._id)
		.select('+secret')
		.exec()
		.then(user => {
			if(decoded.secret === user.secret) return resolve(decoded);
			resErr(res, 401, null);
		})
		.catch(error => resErr(res, error.status, error.message))
};

module.exports.validVote = (req, res, next) => {
	if(req.params.direction.search(/^(up|down)$/) === -1) return resErr(res, 404, 'Undefined direction inserted.');
	else req.vote = req.params.direction;
	next();
};

module.exports.isAdmin = (req, res, next) => {
	const token = req.headers['x-access-token'];
	jwt.verify(
		token,
		secret,
		{algorithms: ['HS512']}
	)
		.then(decoded => {
			if(decoded.isAdmin) next();
			else resErr(res, 401, null);
		})
		.catch(err => resErr(res, err.status, err.message));
};

module.exports.verifyToken = (req, res, next) => {
	decodeToken(req, res, next)
		.then(decoded => next())
		.catch(err => resErr(res, err.status, err.message));
};

module.exports.verifyUser = (req, res, next) => {
	decodeToken(req, res, next)
		.then(decoded => {
			if(decoded.isAdmin) return next();
			if(req.params.username !== decoded.username) return resErr(res, 401, null);
			else next();
		})
		.catch(err => resErr(res, err.status, err.message));
};

module.exports.verifyAdmin = (req, res, next) => {
	decodeToken(req, res, next)
		.then(decoded => {
			if(req.params.adminUsername !== decoded.username) resErr(res, 401, null);
			else next();
		})
		.catch(err => resErr(res, err.status, err.message));
};
