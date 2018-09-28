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
validateAddress = async(request, response, next) => {
	try {
		const starRegistry = new StarRegistry(request);
		starRegistry.validateAddress();
		next();
	} catch {
		response.status(404).json({
			"status": 404,
			"message": error.message
		});
	}
}
/*
 * Using middleware pattern for validating signature is passed in the request
 */
validateSignature = async(request, response, next) => {
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
validateNewRequest = async(request, response, next) => {
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
		const result = await starRegistry.verifyMessageSignature(address, signature);

		if (result.registerStar) {
			response.json(result);
		} else {
			response.status(401).json(result);
		}
	} catch (error) {
		console.log("error caught");
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

	try {
		const isSignatureValid = await starRegistry.isMessageSignatureValid();

		console.log(`isSignatureValid: ${isSignatureValid}`);
		if (!isSignatureValid) {
			console.log("Block 3");
			throw new Error("Message Signature is not valid");
		}

	} catch(error) {
		response.status(401).json({
			"status": 401,
			"message": error.message
		});

		return;
	}

	const starRequest = {address, star} = request.body;
	const story = star.story;

	starRequest.star = {
		dec: star.dec,
		ra: star.ra,
		story: new Buffer.from(story).toString('hex'),
		mag: star.mag,
		con: star.con
	}

	await blockchain.addBlock(new Block(starRequest));
	const blockHeight = await blockchain.getBlockHeight();
	const block = await blockchain.getBlockByHeight(blockHeight);

	console.log("Block 8");
	await starRegistry.invalidateAddress(address);

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
		const address = request.params.address.slice(1);
		const blocks = await blockchain.getBlockByAddress(address);

		response.send(blocks);
	} catch (error) {
		response.status(401).json({
			"status": 401,
			"message": "Star(s) Not Found"
		});
	}

});

/*
 * CRITERIA: Get star block by hash with JSON response.
 */
app.get('/stars/hash:hash', async (request, response) => {

	try {
		const hash = request.params.hash.slice(1);
		const blocks = await blockchain.getBlockByHash(hash);

		response.send(blocks);
	} catch(error)  {
		response.status(404).json({
			"status": 404,
			"message": `No Star Registered for this hash: ${hash}`
		});
	}
});

/*
 * CRITERIA: Get star block by star block height with JSON response.
 */
app.get('/block/:height', async (request, response) => {
	try {
		let blockHeight = await blockchain.getBlockHeight();
		let height = parseInt(request.params.height);

		if (height < 0 || height === undefined) {
			throw new Error(`Invalid Height: ${height} passed`);
		}

		if (height > blockHeight) {
			throw new Error("Height passed is greater then max height");
		} else {
			let block = await blockchain.getBlockByHeight(request.params.height);
			response.send(block);
		}
	} catch (error) {
		response.status(404).json ({
			"status": 404,
			"message": error.message
		});
	}
});
