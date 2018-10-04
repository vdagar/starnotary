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

		return true;
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
	 * Validate the new star registery request is has all the parameter required to register star
	 */
	validateNewRequest () {
		const MAX_BYTES_STORY = 500;
		const { star } = this.request.body;
		const { dec, ra, story } = star;

		if (!this.validateAddress()) {
			throw new Error("Address cannot be empty. Please provide a valid address");
		}

		if (!this.request.body.star) {
			throw new Error("Star cannot be empty. Please provide valid star");
		}

		if (typeof dec !== 'string' || typeof ra !== 'string' || typeof story !== 'string' || !dec.length || !ra.length || !story.length) {
			throw new Error("Star information should include string properties dec, ra and story");
		}

		if (new Buffer.from(story).length > MAX_BYTES_STORY) {
			throw new Error("Story size cannot be more than 500 bytes");
		}

		const isValid = ((str) => /^[\x00-\x7F]*$/.test(str))

		if (!isValid) {
			throw new Error("Story can only contain ASCII characters. Please remove non ASCII charaters");
		}
	}

	/*
	 * Get the pending request from the database for this address.
	 */
	async getPendingRequest(address) {
		try {
			return await starDB.getPendingRequest(address);
		} catch (error) {
			throw error;
		}
	}

	/*
	 * Verfiy the message signature for the pending request from the address.
	 */
	async verifyMessageSignature(address, signature) {
		try {
			return await starDB.verifySignature(address, signature);
		} catch (error) {
			throw error;
		}
	}

	/*
	 * Save the pending request in the database.
	 */
	async saveNewRequest(address) {
		return await starDB.saveNewRequestToDB(address);
	}

	async isMessageSignatureValid(address) {
		return await starDB.isSignatureValid(this.request.body.address);
	}

	async invalidateAddress(address) {
		return await starDB.invalidateAddress(address);
	}
}

module.exports = starRegistry;
