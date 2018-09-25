
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');

/*
 * Configure levelDB and define the function to get and put data into DB
 */
const level = require('level');
const starDB = './database/star';
const db = level(starDB);

/* ================== Persist data with LevelDB =================
|  Learn more: level: https://github.com/Level/level     		|
|  =============================================================*/

/*
 * Add data to levelDB with key/value pair
 */
exports.saveNewRequestToDB = function (address) {
	return new Promise((resolve, reject) => {
		const requestTimeStamp = Date.now();
		const message = `${address}:${requestTimeStamp}:starRegistry`;
		const validationWindow = 300;

		const value = {
			address: address,
			requestTimeStamp: requestTimeStamp,
			message: message,
			validationWindow: validationWindow
		}

		db.put(address, JSON.stringify(value), function (error) {
			if (error) {
				reject(error);
			}

			resolve(value);
		});
	});
}

// Get data from levelDB with key
exports.getPendingRequestFromDB = function (address) {
	return new Promise((resolve, reject) => {
		db.get(address, (error, result) => {
			if (result == undefined) {
				return reject(new Error("Not Found"));
			}

			if (error) {
				return reject(error);
			}

			result = JSON.parse(result);
			const nowSubValidationWindow = Date.now() - (300 * 1000);
			const hasWindowExpired = result.requestTimeStamp < nowSubValidationWindow;

			if (hasWindowExpired) {
				resolve(this.saveNewRequestToDB(address));
			} else {
				const response = {
					address: address,
					requestTimeStamp: result.requestTimeStamp,
					message: result.message,
					validationWindow: Math.floor((result.requestTimeStamp - nowSubValidationWindow)/1000)
				}
				resolve(response);
			}
		});
	});
}

exports.verifySignatureFromDB = function(address, signature) {
	return new Promise((resolve, reject) => {
		db.get(address, (error, result) => {
			if (result === undefined) {
				return reject(new Error("Not Found"));
			} else if (error) {
				return reject(error);
			}

			result = JSON.parse(result);

			if (result.messageSignature === 'valid') {
				return resolve({
					registerStar: true,
					status: result
				});
			} else {
				const nowSubValidationWindow = Date.now() - (300 * 1000)
				const hasWindowExpired = result.requestTimeStamp < nowSubValidationWindow;
				let isSignatureValid = false;

				if (hasWindowExpired) {
					result.validationWindow = 0;
					result.message = "Validation window expired. Try again"
				} else{
					result.validationWindow = Math.floor((result.requestTimeStamp - nowSubValidationWindow) / 1000);
					try {
						isSignatureValid = bitcoinMessage.verify(result.message, address, signature);
					} catch (error) {
						isSignatureValid = false;
					}

					result.messageSignature = isSignatureValid ? 'valid' : 'invalid';
				}

				db.put(address, JSON.stringify(result));

				resolve({
					registerStar: !hasWindowExpired && isSignatureValid,
					status: result
				});
			}
		});
	});
}
