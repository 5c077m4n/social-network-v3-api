module.exports = (res, status, message) => {
	if(!message)
		switch(status) {
			case 400:
				message = '400 Bad Request.';
				break;
			case 401:
				message = '401 Unauthorized.';
				break;
			case 403:
				message = '403 Forbidden.';
				break;
			case 404:
				message = '404 Not Found.';
				break;
			case 500:
				message = '500 Internal Server Error.';
				break;
			default:
				message = 'Unknown Error.';
		}
	res.status(status).json({status, message});
};
