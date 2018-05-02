'use strict';

var crypto = require('crypto');

/**
 * generates random salt
 * @function
 * @param {number} length - Length of the random string.
 */
module.exports.generateSalt = length => {
    return crypto.randomBytes(Math.ceil(length/2))
        // convert to hexadecimal format
        .toString('hex')
        // return required number of characters
        .slice(0, length);
};

/**
 * hash password with sha512.
 * @function
 * @param {string} password - List of required fields.
 * @param {string} salt - Data to be validated.
 */
module.exports.hash = (password, salt) => {
    // Hashing algorithm sha512
    let hash = crypto.createHmac('sha512', salt);
    hash.update(password);
    const value = hash.digest('hex');
    return {
        salt,
        passwordHash: value
    };
};

module.exports.saltHashPassword = userpassword => {
    // Gives us salt of length 16
    const salt = genRandomString(16);
    return sha512(userpassword, salt);
};