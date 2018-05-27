'use strict';

const router = require('express').Router();
const https = require('https');
const http = require('http');
const fs = require('fs');
const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const helmet = require('helmet');
const Limiter = require('express-rate-limit');
const compress = require('compression');
const cors = require('cors');

const middleware = require('./middleware');

const dbURI = 'mongodb://social:qwerty_123@ds111319.mlab.com:11319/social';
// const dbURI = 'mongodb://127.0.0.1:27017/social';

router.use(helmet());
router.options('*', cors());
router.use(cors());

mongoose.connect(dbURI)
	.then(() => {console.log('You have been successfully connected to the database.')})
	.catch(err => console.error(`connection error: ${err}`));
const db = mongoose.connection;
db.on('error', (err) => console.error(`connection error: ${err}`));

router.use((req, res, next) => {
	req.connection.setNoDelay(true);
	next();
});

router.use(compress({
	filter: (req, res) => (req.headers['x-no-compression'])? false : compress.filter(req, res),
	level: 6
}));

router.use(new Limiter({
	windowMs: 5 * 60 * 1000, // 5 minutes
	max: 200, // limit each IP to 200 requests per windowMs
	delayMs: 2 * 1000, // disable delaying - full speed until the max limit is reached
	delayAfter: 5
}));

router.use(bodyParser.json());

router.use('/', require('./routes'));
router.use('/users', middleware.verifyToken, require('../controllers/userRoutes'));
router.use('/admins', middleware.verifyToken, middleware.isAdmin, require('../controllers/adminRoutes'));

router.use((req, res, next) => {
	const err = new Error('The requested page cannot be found.');
	err.status = 404;
	next(err);
});
router.use((err, req, res, next) => {
	return res.status((err.status >= 100 && err.status < 600)? err.status : 500).json({
		error: {
			status: err.status,
			message: err.message
		}
	});
});

module.exports = router;
