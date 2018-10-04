/*
 * Configure bitcoin and bitcoin message to verify the message signature
 */
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
exports.saveNewRequest = function (address) {
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

/*
 * Get validation request pending for the address. If no request is
 * pending a new request will be created and saved in the database.
 * If there is a request pending for the address then time left in
 * validation window will be updated and sent to the user.
 */
exports.getPendingRequest = function (address) {
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
				return resolve(this.saveNewRequest(address));
			} else {
				const response = {
					address: address,
					requestTimeStamp: result.requestTimeStamp,
					message: result.message,
					validationWindow: Math.floor((result.requestTimeStamp - nowSubValidationWindow)/1000)
				}
				return resolve(response);
			}
		});
	});
}

/*
 * Verfiy the message signature for the pending request for the address
 */
exports.verifySignature = function(address, signature) {
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
					result.message = "Validation window expired. Try again";
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

/*
 * Check if message signature is valid for the address star is registered against
 */
exports.isSignatureValid = function(address) {
	return new Promise((resolve, reject) => {
		db.get(address).then((result) => {
			result = JSON.parse(result);
			resolve(result.messageSignature === 'valid');
		}).catch ((error) => {
			reject(new Error("Not Authorized"));
		});
	});
}

/*
 * Remove the address from the database once a star is registered for that address.
 */
exports.invalidateAddress = function(address) {
	return new Promise((resolve, reject) => {
		db.del(address, (error) => {
			if (error) {
				reject(error);
			}

			resolve();
		})
	});
}
