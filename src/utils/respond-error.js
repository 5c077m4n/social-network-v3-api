module.exports = (res, statusCode, message) => {
	if(!message) {
		switch(statusCode) {
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
	}
	return res.status((statusCode >= 100 && statusCode < 600)? statusCode : 500).json({
		statusCode,
		message
	});
};
