'use strict';
const https = require('https');
const http = require('http');
const fs = require('fs');
const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
mongoose.Promise = require('bluebird');
const logger = require('morgan');

const app = express();
const [HOST, PORT] = ['127.0.0.1', process.env.PORT || 3000];
// const dbURI = 'mongodb://social:qwerty_123@ds111319.mlab.com:11319/social';
const dbURI = 'mongodb://127.0.0.1:27017/social';
const accessLogStream = fs.createWriteStream(
	path.join(__dirname, './utils/logStream.log'),
	{flags: 'a'}
);

app.use(logger('dev', {stream: accessLogStream}));
mongoose.set('debug', (collectionName, methodName) => {
	accessLogStream.write(`Mongoose: ${collectionName}.${methodName}()`);
});
mongoose.connect(dbURI)
	.then(() => {console.log('You have been successfully connected to the database.')})
	.catch((err) => console.error(`connection error: ${err}`));
const db = mongoose.connection;
db.on('error', (err) => console.error(`connection error: ${err}`));

app.use('/', require('./config/express'));

http
	.createServer(app)
	.listen(PORT, HOST, () => console.log(`Express is now running on http://${HOST}:${PORT}`))
	.on('error', function(err) {
		console.error(`Connection error: ${err}`);
		this.close(() => {
			console.error(`The connection has been closed.`);
			process.exit(-2);
		});
	});
// https
// 	.createServer({
// 		key: fs.readFileSync(__dirname + '/utils/privatekey.pem'),
// 		ca: fs.readFileSync(__dirname + '/utils/certauthority.pem'),
// 		cert: fs.readFileSync(__dirname + '/utils/certificate.pem')
// 	}, app)
// 	.listen(PORT+10, HOST, () => console.log(`Express is now running on https://${HOST}:${PORT+10}`))
// 	.on('error', function(err) {
// 		console.error(`connection error: ${err}`);
// 		this.close(() => {
// 			console.error(`The connection has been closed.`);
// 			process.exit(-2);
// 		});
// 	});
