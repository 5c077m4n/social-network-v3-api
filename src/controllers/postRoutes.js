'use strict';
const router = require('express').Router();
const Promise = require('bluebird');
const jwt = require('jsonwebtoken');
const resErr = require('../utils/respond-error');
const middleware = require('../config/middleware');
const User = require('../models/user');
const Post = require('../models/post');

let localTemp = {};

router.param('postID', (req, res, next, postID) => {
	Post
	.findById(req.params.postID)
	.exec()
	.then((post) => {
		localTemp.post = post;
		next();
	})
	.catch((err) => resErr(res, err.status, err.message));
});
router.param('commentID', (req, res, next, commentID) => {
	Post
	.findById(req.params.commentID)
	.exec()
	.then((comment) => {
		localTemp.post.comment = comment;
		return next();
	})
	.catch((err) => resErr(res, err.status, err.message));
});

router.route('/')
.get((req, res, next) => {
	Post
	.find({userID: req.userID})
	.sort({createdAt: -1})
	.exec()
	.then(posts => res.json(posts))
	.catch(err => resErr(res, err.status, err.message));v
})
.post((req, res, next) => {
	new Post(req.body)
	.save()
	.then(post => res.status(201).json(post))
	.catch(err => resErr(res, err.status, err.message));
});

router.route('/:postID')
.get((req, res, next) => res.status(200).json(localTemp.post))
.put(middleware.verifyUser, (req, res, next) => {
	localTemp.post.comment
	.update(req.body)
	.then(comment => res.json(comment))
	.catch(err => resErr(res, err.status, err.message));
})
.delete(middleware.verifyUser, (req, res, next) => {
	localTemp.post.comment
	.remove()
	.then(comment => res.json({"deleted": comment}))
	.catch(err => resErr(res, err.status, err.message));
});

router.route('/:postID/vote-:direction')
.all(middleware.validVote)
.get((req, res, next) => {
	localTemp.post
	.vote(req.params.direction)
	.then(post => res.json(post))
	.catch(err => resErr(res, err.status, err.message));
})
.post((req, res, next) => {
	localTemp.post
	.vote(req.params.direction)
	.then(post => res.json(post))
	.catch(err => resErr(res, err.status, err.message));
});

router.route('/:postID/comments')
.get((req, res, next) => {
	Post
	.find({parentPostID: localTemp.post._id})
	.sort({createdAt: -1})
	.exec()
	.then(posts => res.status(201).json(posts))
	.catch(err => resErr(res, err.status, err.message));
})
.post((req, res, next) => {
	req.body.userID = localTemp.post.userID;
	req.body.parentPostID = localTemp.post._id;
	new Post(req.body)
	.save()
	.then(post => res.status(201).json(post))
	.catch(err => resErr(res, err.status, err.message));
});

router.route('/:postID/comments/:commentID')
.get((req, res, next) => res.json(localTemp.post.comment))
.put(middleware.verifyUser, (req, res, next) => {
	localTemp.post.comment
	.update(req.body)
	.then(comment => res.json(comment))
	.catch(err => resErr(res, err.status, err.message));
})
.delete(middleware.verifyUser, (req, res, next) => {
	localTemp.post.comment
	.remove()
	.then(comment => res.json({"deleted": comment}))
	.catch(err => resErr(res, err.status, err.message));
});

router.route('/:postID/comments/:commentID/vote-:direction')
.all(middleware.validVote)
.get((req, res, next) => {
	localTemp.post.comment
	.vote(req.params.direction)
	.then(comment => res.json(comment))
	.catch(err => resErr(res, err.status, err.message));
})
.post((req, res, next) => {
	localTemp.post.comment
	.vote(req.params.direction)
	.then(comment => res.json(comment))
	.catch(err => resErr(res, err.status, err.message));
});

module.exports = router;
