'use strict';

const router = require('express').Router();
const Promise = require('bluebird');

const resErr = require('../utils/respond-error');
const middleware = require('../config/middleware');
const User = require('../models/user');
const Post = require('../models/post');

let localTemp = {};
const findPostByID = (postID) => {
	return Post
		.findById(postID)
		.exec()
};
const findPostsByUserID = (userID) => {
	return Post
		.find({userID})
		.sort({createdAt: -1})
		.exec()
};
const findPostsByParentPostID = (parentPostID) => {
	return Post
		.find({parentPostID})
		.sort({createdAt: -1})
		.exec()
};

router.param('postID', (req, res, next, postID) => {
	findPostByID(req.params.postID)
		.then((post) => {
			localTemp.post = post;
			next();
		})
		.catch((err) => resErr(res, err.status, err.message));
});
router.param('commentID', (req, res, next, commentID) => {
	findPostByID(req.params.commentID)
		.then(comment => {
			localTemp.post.comment = comment;
			return next();
		})
		.catch((err) => resErr(res, err.status, err.message));
});

router.route('/')
.get((req, res, next) => {
	findPostsByUserID(req.locals.user._id)
		.then(posts => res.json(posts))
		.catch(err => resErr(res, err.status, err.message));
})
.post((req, res, next) => {
	if(req.locals.user.user) req.body.userID = req.locals.user.user._id;
	else req.body.userID = req.locals.user._id;

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
	localTemp.post
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
	findPostsByParentPostID(localTemp.post._id)
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
