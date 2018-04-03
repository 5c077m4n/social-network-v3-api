'use strict';
const router = require('express').Router();
const Promise = require('bluebird');
const resErr = require('../utils/respond-error');
const middleware = require('../config/middleware');
const User = require('../models/user');
const Post = require('../models/post');

let localTemp = {};
const findAdminByUsername = (username) => {
	return User
		.findOne({username})
		.exec()
};
const findAdmins = () => {
	return User
		.find({isAdmin: true})
		.sort({name: 1})
		.exec()
};

router.param('adminUsername', (req, res, next, adminUsername) => {
	findAdminByUsername(req.params.adminUsername)
		.then(admin => {
			localTemp.admin = admin;
			req.locals = {user: {_id: admin._id}};
			next();
		})
		.catch(err => resErr(res, err.status, err.message));
});

router.route('/')
.get((req, res, next) => {
	findAdmins()
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
