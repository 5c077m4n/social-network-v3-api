'use strict';
const router = require('express').Router();
const Promise = require('bluebird');
const resErr = require('../utils/respond-error');
const middleware = require('../config/middleware');
const User = require('../models/user');
const Post = require('../models/post');

let localTemp = {};

router.param('adminUsername', (req, res, next, adminUsername) => {
	User
		.findOne({username: req.params.adminUsername})
		.exec()
		.then(admin => {
			localTemp.admin = admin;
			req.locals = {user: {_id: admin._id}};
			next();
		})
		.catch(err => resErr(res, err.status, err.message));
});
router.param('username', (req, res, next, username) => {
	User
		.findOne({username: req.params.username})
		.exec()
		.then(user => {
			localTemp.admin.user = user;
			req.locals.user = {user: {_id: user._id}};
			next();
		})
		.catch(err => resErr(res, err.status, err.message));
});

router.route('/')
.get((req, res, next) => {
	User
		.find({isAdmin: true})
		.sort({name: 1})
		.exec()
		.then(admins => res.status(200).json(admins))
		.catch((err) => resErr(res, err.status, err.message));
});

router.route('/:adminUsername')
.get((req, res, next) => res.json(localTemp.admin))
.put(middleware.verifyAdmin, (req, res, next) => {
	localTemp.admin
		.update(req.body)
		.then(admin => res.json(admin))
		.catch(err => resErr(res, err.status, err.message));
})
.delete(middleware.verifyAdmin, (req, res, next) => {
	localTemp.admin
		.remove()
		.then(user => res.json({"deleted": user}))
		.catch(err => resErr(res, err.status, err.message));
});

router.use('/:adminUsername/users', require('./userRoutes'));
router.use('/:adminUsername/posts', require('./postRoutes'));

module.exports = router;
