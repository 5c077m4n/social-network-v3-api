'use strict';

const router = require('express').Router();
const Promise = require('bluebird');

const resErr = require('../utils/respond-error');
const middleware = require('../config/middleware');
const User = require('../models/user');
const Post = require('../models/post');

let localTemp = {};
const findUserByUsername = (username) => {
	return User
		.findOne({username})
		.exec()
};
const findNonAdminUsers = () => {
	return User
		.find({isAdmin: false})
		.sort({name: 1})
		.exec()
};

router.param('username', (req, res, next, username) => {
	findUserByUsername(req.params.username)
		.then(user => {
			localTemp.user = user;
			req.locals = {user: {_id: user._id}};
			next();
		})
		.catch((err) => resErr(res, err.status, err.message));
});

router.route('/')
.get((req, res, next) => {
	findNonAdminUsers()
		.then(users => res.status(200).json(users))
		.catch(err => resErr(res, err.status, err.message));
});

router.route('/:username')
.get((req, res, next) => res.json(localTemp.user))
.put(middleware.verifyUser, (req, res, next) => {
	localTemp.user
		.update(req.body)
		.then((user) => res.status(200).json(user))
		.catch((err) => resErr(res, err.status, err.message));
})
.delete(middleware.verifyUser, (req, res, next) => {
	localTemp.user
		.remove()
		.then((user) => res.status(200).json({"deleted": user}))
		.catch((err) => resErr(res, err.status, err.message));
});

router.use('/:username/posts', require('./postRoutes'));

module.exports = router;
