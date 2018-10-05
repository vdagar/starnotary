/*
 * Using strict mode to avoid some unwanted errors
 */
"use strict";

/*
 * CRITERIA: Project uses one of these 3 Node.js frameworks. Project is using express.js framework.
 */

const express = require('express');
const bodyParser = require('body-parser');
const Block = require('./block');
const Blockchain = require('./blockChain');
const blockchain = new Blockchain();
const StarRegistry = require('./starRegistry');
const app = express();
const PORT = 8000;

/*
 * Using middleware pattern for validating address is passed in the request
 */
const validateAddress = async(request, response, next) => {
	try {
		const starRegistry = new StarRegistry(request);
		starRegistry.validateAddress();
		next();
	} catch (error) {
		response.status(404).json({
			"status": 404,
			"message": error.message
		});
	}
}
/*
 * Using middleware pattern for validating signature is passed in the request
 */
const validateSignature = async(request, response, next) => {
	try {
		const starRegistry = new StarRegistry(request);
		starRegistry.validateSignature();
		next();
	} catch (error) {
		response.status(404).json({
			"status": 404,
			"message": error.message
		});
	}
}

/*
 * Using middleware pattern for validating new star registry is passed in the request as per the requirements
 */
const validateNewRequest = async(request, response, next) => {
	try {
		const starRegistry = new StarRegistry(request);
		starRegistry.validateNewRequest();
		next();
	} catch (error) {
		response.status(404).json({
			"status": 404,
			"message": error.message
		});
	}
}

/*
 * CRITERIA: API Service Port Configuration. The project’s API service is configured to run on port 8000.
 * The default URL should remain private facing using localhost for connectivity (example: http://localhost:8000).
 */
app.listen(PORT, () => console.log("Server is listening on Port " + PORT));
app.use(bodyParser.json());

/*
 * Send an error message if user tries to access root
 */
app.get('/', (request, response) => response.status(404).json({
	"status": 404,
	"message": "Check README file for accepted endpoints"
}));


/* ==============================================================================
 * |			Blockchain ID validation routine			|
 * =============================================================================*/

/*
 * CRITERIA: Web API post endpoint validates request with JSON response.
 */
app.post('/requestValidation', [validateAddress], async(request, response) => {
	const starRegistry = new StarRegistry(request);
	const address = request.body.address;
	let value;

	try {
		/*
		 * Check if the request for the address already exist. If the request alread exist then send
		 * response with the time left in the validation window.
		 */
		value = await starRegistry.getPendingRequest(address);
	} catch (error) {
		/*
		 * If this is the first request from the address then save this request to validate the signature
		 */
		value = await starRegistry.saveNewRequest(address);
	}

	response.send(value);
});

/*
 * CRITERIA: Web API post endpoint validates message signature with JSON response.
 */
app.post('/message-signature/validate', [validateAddress, validateSignature], async (request, response) => {
	const starRegistry = new StarRegistry(request);

	try {
		const {address, signature} = request.body;

		/* Verfiy the message signature of the validation request */
		const result = await starRegistry.verifyMessageSignature(address, signature);

		/* Return ture if the message verification successful other wise return false */
		if (result.registerStar) {
			response.status(200).json(result);
		} else {
			response.status(401).json(result);
		}
	} catch (error) {
		response.status(404).json({
			"status": 404,
			"message": error.message
		});
	}
});

/* ======================================================================
 * |			Star registration Endpoint			|
 * =====================================================================*/

/*
 * CRITERIA: Web API Post Endpoint with JSON response.
 */
app.post('/block', [validateNewRequest], async (request, response) => {
	const starRegistry = new StarRegistry(request);
	let address;
	let star = {};

	try {
		/* Check if the message signaure is valid */
		const isSignatureValid = await starRegistry.isMessageSignatureValid();

		/* Throw error if message signature is not valid */
		if (!isSignatureValid) {
			throw new Error("Message Signature is not valid");
		}

	} catch(error) {
		response.status(401).json({
			"status": 401,
			"message": error.message
		});

		/* Return in case of any errors */
		return;
	}

	/* extract address, star and star story from the request body */
	const starRequest = {address, star} = request.body;
	const story = star.story;

	/* Create star request to add the same in the blockchain */
	starRequest.star = {
		dec: star.dec,
		ra: star.ra,
		story: new Buffer.from(story).toString('hex'), /* Encode the story in hex form */
		mag: star.mag,
		con: star.con
	}

	/* Add block in the blockchain */
	await blockchain.addBlock(new Block(starRequest));

	/* Get the max height of the block from the blockchain */
	const blockHeight = await blockchain.getBlockHeight();

	/* Get the block by block height from the database */
	const block = await blockchain.getBlockByHeight(blockHeight);

	/* Once a star is registered against the address remove that address from the star database */
	await starRegistry.invalidateAddress(address);

	/* send the added block block */
	response.status(201).send(block);
});

/* ======================================================================
 * |				Star Lookup				|
 * =====================================================================*/

/*
 * CRITERIA: Get star block by hash with JSON response.
 */
app.get('/stars/address:address', async (request, response) => {
	try {
		/* Get the address from the request body */
		const address = request.params.address.slice(1);

		/* Reterive array of blocks based on the address from the blockchain database */
		const blocks = await blockchain.getBlockByAddress(address);

		/* If everything goes right send back the array of blocks */
		response.send(blocks);
	} catch (error) {
		/* Return error in case of any */
		response.status(401).json({
			"status": 401,
			"message": error.message
		});
	}

});

/*
 * CRITERIA: Get star block by hash with JSON response.
 */
app.get('/stars/hash:hash', async (request, response) => {

	try {
		/* Extract hash from the request */
		const hash = request.params.hash.slice(1);

		/* Get the block based on hash from the blockchain database */
		const blocks = await blockchain.getBlockByHash(hash);

		/* Return block from to the client */
		response.send(blocks);
	} catch(error)  {
		/* Return error in case of any */
		response.status(404).json({
			"status": 404,
			"message": error.message
		});
	}
});

/*
 * CRITERIA: Get star block by star block height with JSON response.
 */
app.get('/block/:height', async (request, response) => {
	try {
		/* Get the max height of the block from the blockchain database */
		let blockHeight = await blockchain.getBlockHeight();

		/* Extract height from the request */
		let height = parseInt(request.params.height);

		/* Check if height is less then zero or undefined. If so throw error */
		if (height < 0 || height === undefined) {
			throw new Error('Invalid height passed');
		}

		/* Throw error is the height passed is larger then the max height */
		if (height > blockHeight) {
			throw new Error("Height passed is greater then max numbers of blocks in blockchain");
		} else {
			/* If height is in the range then get the block from the data base and return */
			let block = await blockchain.getBlockByHeight(request.params.height);
			response.send(block);
		}
	} catch (error) {
		/* Return Error in case of any */
		response.status(404).json ({
			"status": 404,
			"message": error.message
		});
	}
});
