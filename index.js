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

/*
 * CRITERIA: GET Block Endpoint. The web API contains a GET endpoint that responds to a request using a URL
 * path with a block height parameter or properly handles an error if the height parameter is out of bounds.
 */
app.get('/block/:height', async (request, response) => {
	try {
		let blockHeight = await blockchain.getBlockHeight();
		let height = parseInt(request.params.height);

		if (height < 0 || height === undefined) {
			console.log("Height passed is : " + height);
		}

		if (height > blockHeight) {
			response.send("Height passed is greater then max height in the database");
		} else {
			let block = await blockchain.getBlock(request.params.height);
			response.send(block);
		}
	} catch (error) {
		response.status(404).json ({
			"status": 404,
			"message": "Block Not Found. Please check passed block height\n"
		});
	}
});

/*
 * CRITERIA: POST Block Endpoint. The web API contains a POST endpoint that allows posting a new block with
 * the data payload option to add data to the block body. Block body should support a string of text.
 */
app.post('/block', async (request, response) => {
	try {
		if (request.body.body === "" || request.body.body === undefined) {
			response.status(404).json({
				"status": 404,
				"message": "Block Body can not be empty. Please fill the body and try again"
			});
		}

		await blockchain.addBlock(new Block(request.body.body));
		let height = await blockchain.getBlockHeight();
		let block  = await blockchain.getBlock(height);

		response.send(block);
	} catch(error) {
		response.status(404).json({
			"status": 404,
			"message": "Block could not be added to the blockchain. Please try again"
		});
	}
});

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
			"message": error
		});
	}
});
