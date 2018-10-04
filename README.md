Project: Build a Private Blockchain Notary Service

Project Introduction
Welcome to Project 4: Build a Private Blockchain Notary Service!

In this project, you'll build a Star Registry service that allows users to claim ownership of their favorite star in the night sky.

To do this, you'll add functionality to the Web API you built in Project 3: Web Services. You'll connect this web service to your
own private blockchain, allowing users to notarize ownership of a digital asset, in this case whichever star they choose.

You'll do this using skills you've learn throughout the program, and by solving some new challenges you haven't quite seen before.
The goal is to apply the tools and knowledge you've developed so far to solve new problems that are relevant to your career as a
blockchain developer.

Why this project?
With this project you will demonstrate your ability to use Node.js Web APIs frameworks to notarize ownership of a digital asset
by implement algorithms to sign and verify messages.

Connecting a web API to a private blockchain is a huge first step toward developing web applications that are consumable by other
of web clients. This is an important way to reach users with your blockchain applications and is a core skill of any blockchain
developer. Including to notarize digital assets using wallet signatures and message verification in code is a huge step to be
able to implement production ready applications.

This project also helps set you up for success later in the program. Later, you’ll be programming blockchain applications that
use similar features using smart contracts. Smart contracts are an exciting blockchain concept that you'll be learning all about
in the next course!

What will I learn?
This project will combine various ideas and skills we’ve been practicing throughout the course as well as require you to solve
new challenges you haven't quite seen before.

You’ll configure the blockchain to:

Notarize ownership of a digital asset using message signatures and validation
	Accept user requests using registration endpoints
	Implement a mempool for the message queue
	Allow search by blockchain wallet address or by specific attribute (e.g.star block hash, star block height)
	This project helps build on the skills you learned throughout Course 3: Web Services. You will apply these
	skills using real-world technologies to get hands-on with the tools used to create web API's.

How does this help my career?
In this project, you’ll demonstrate creating and working with web APIs that notarizes ownership of a digital asset using message
signatures and validation. To do so, you’ll demonstrate your understanding of many core blockchain concepts such as encoding and
decoding transaction data, configuring your blockchain to handle wallet identities, and configuring your blockchain to properly
handle user requests.

This project is a great step toward getting started as a blockchain developer. These skills are important whether it's for
personal interest, to work on more complicated projects, or to use as a great portfolio item to show potential employers.


Getting started
	Open a terminal and install node.js framework.
    	Install crypto.js, level.js, express.js and body-parser.js framworks.

	npm install crypto-js --save
	npm install level --save
	npm install express --save
	npm install body-parser --save

Testing
Run the server using one of the below method

	node index.js
	npm start

Testing can be done manually by using the below mentioned curl commnands or by using the test
automation script located in the test directory. To use the test script for testing use command

	npm run test

Use software like postman or simple CURL on the terminal to send the requests to the server using
curl http://localhost:8000 with one of the below supported endpoints:

=============================================
1. Configure Blockchain ID validation routine
=============================================

POST /requestValidation

example:
	curl -X "POST" "http://localhost:8000/requestValidation" \
		-H 'Content-Type: application/json; charset=utf-8' \
		-d $'{
			"address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"
		}'

POST /message-signature/validate

expample:
	curl -X "POST" "http://localhost:8000/message-signature/validate" \
		-H 'Content-Type: application/json; charset=utf-8' \
		-d $'{
			"address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
			"signature": "H6ZrGrF0Y4rMGBMRT2+hHWGbThTIyhBS0dNKQRov9Yg6GgXcHxtO9GJN4nwD2yNXpnXHTWU9i+qdw5vpsooryLU="
		}'

=======================================
2. Configure Star Registration Endpoint
=======================================

POST /block

example:
	curl -X "POST" "http://localhost:8000/block" \
		-H 'Content-Type: application/json; charset=utf-8' \
		-d $'{
			"address": "142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ",
			"star": {
				"dec": "-26° 29'\'' 24.9",
				"ra": "16h 29m 1.0s",
				"story": "Found star using https://www.google.com/sky/"
			}
		}'

========================
3. Configure Star Lookup
========================

GET /stars/address:[ADDRESS]

example:
	curl "http://localhost:8000/stars/address:142BDCeSGbXjWKaAnYXbMpZ6sbrSAo3DpZ"

GET /stars/hash:[HASH]

example:
	curl "http://localhost:8000/stars/hash:a59e9e399bc17c2db32a7a87379a8012f2c8e08dd661d7c0a6a4845d4f3ffb9f"

GET /block/[HEIGHT]

example:
	curl http://localhost:8000/block/0

