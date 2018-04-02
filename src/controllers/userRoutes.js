'use strict';

const router = require('express').Router();
const Promise = require('bluebird');

const resErr = require('../utils/respond-error');
const middleware = require('../config/middleware');
const User = require('../models/user');
const Post = require('../models/post');
const secret = require('../utils/secret').secret;

let localTemp = {};

router.param('username', (req, res, next, username) => {
	User
	.findOne({username: req.params.username})
	.exec()
	.then((user) => {
		localTemp.user = user;
		next();
	})
	.catch((err) => resErr(res, err.status, err.message));
});

router.route('/')
.get((req, res, next) => {
	User
	.find({isAdmin: false})
	.sort({name: 1})
	.exec()
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
