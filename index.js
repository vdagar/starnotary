/*
 * CRITERIA: Project uses one of these 3 Node.js frameworks. Project is using express.js framework.
 */

const express = require('express');
const bodyParser = require('body-parser');
const Block = require('./block');
const Blockchain = require('./simpleChain');
const blockchain = new Blockchain();
const app = express();
const PORT = 8000;

/*
 * CRITERIA: API Service Port Configuration. The project’s API service is configured to run on port 8000.
 * The default URL should remain private facing using localhost for connectivity (example: http://localhost:8000).
 */
app.listen(PORT, () => console.log("Server is listening on Port " + PORT));
app.use(bodyParser.json());

/* Send an error message if user tries to access root */
app.get('/', (request, response) => response.status(404).json({
	"status": 404,
	"message": "Accepted endpoints for Server are: POST /block or GET /block/{BLOCK_HEIGHT} " + 
				"For Example: " +
  				"    To get Block use: curl http://localhost:8000/block/0"
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
