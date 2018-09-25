/*
 * Star Database for storing the request before they can be validated
 * and entered in the blockchain
 */
const starDB = require('./starSandbox')

/* Define class to validate all the parameter for star and update the star database */
class starRegistry {
	/*
	 * constructor for the class that takes request as parameter.
	 */
	constructor(request) {
		this.request = request;
	}

	/*
	 * Validate the address parameter passed in the endpoints is correct.
	 */
	validateAddress() {
		if (!this.request.body.address) {
			throw new Error("Address cannot be empty. Please provide a valid address");
		}
	}

	/*
	 * Validate the signature parameter passed in the endpoints is correct.
	 */
	validateSignature() {
		if (!this.request.body.signature) {
			throw new Error("Signature cannot be empty. Please provide valid signature");
		}
	}

	/*
	 * Get the pending request from the database for this address.
	 */
	async getPendingRequest(address) {
		return await starDB.getPendingRequestFromDB(address);
	}

	/*
	 * Verfiy the message signature for the pending request from the address.
	 */
	async verifyMessageSignature(address, signature) {
		return await starDB.verifySignatureFromDB(address, signature);
	}

	/*
	 * Save the pending request in the database.
	 */
	async saveNewRequest(address) {
		return await starDB.saveNewRequestToDB(address);
	}
}

module.exports = starRegistry;
