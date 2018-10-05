"use strict";
/*
 * Configure bitcoin and bitcoin message to generate random keypair address
 */
const bitcoin = require('bitcoinjs-lib');
const bitcoinMessage = require('bitcoinjs-message');
const chai = require('chai');
const expect = require('chai').expect;
const assert = require('assert');
const fs = require('fs');
const app = require('../index');

chai.use(require('chai-http'));
chai.config.includeStack = true;
/*
 * Define the base URL to send the request to.
 */
const baseUrl = 'http://localhost:8000';

/*
 * Get the wallet address to send the registration request and sign the messages
 */
const keyPair = bitcoin.ECPair.makeRandom();
const privateKey = keyPair.d.toBuffer(32);
const address = keyPair.getAddress();

describe('POST /requestValidation', () => {

	it('Should respond with message details, request timestamp and time remaining for validation window', () => {
		return chai.request(baseUrl)
			.post('/requestValidation')
			.send({address: address})
			.set('Content-Type', 'application/json')
			.set('Accept', 'application/json')
			.then((response) => {
				expect(response).to.have.status(200);
				expect(response).to.be.json;
				expect(response.body).to.be.an('object');
				expect(response.body.address).to.be.eql(address);
				expect(response.body).to.have.property('requestTimeStamp');
				expect(response.body).to.have.property('message');
				expect(response.body).to.have.property('validationWindow');
				expect(response.body.message).to.be.an('string');
				expect(response.body.validationWindow).to.be.lte(300);

				const message = response.body.message;
				const signature = bitcoinMessage.sign(message, privateKey, keyPair.compressed).toString('base64');

				fs.writeFileSync('database/signature.txt', signature);
			});
	});
});

describe('POST /message-signature/validate', function() {

	this.timeout(1000);
	it('Should respond with messageSignature valid', (done) => {

		const signature = fs.readFileSync('database/signature.txt').toString();

		chai.request(baseUrl)
			.post('/message-signature/validate')
			.send({address: address, signature: signature})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.body.registerStar).to.be.true;
				expect(response.body.status.messageSignature).to.be.eql('valid');
				done();
			});
	});

	it('Should respond with error because of wrong address', (done) => {
		const signature = fs.readFileSync('database/signature.txt').toString();
		chai.request(baseUrl)
			.post('/message-signature/validate')
			.send({address: "address", signature: signature})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Not Found');
				done();
			});
	});
});

describe('POST /block', function() {

	this.timeout(1000);

	it('Should respond with block added in the block chain with the star data', () => {
		return chai.request(baseUrl)
			.post('/block')
			.send({
				address: address,
				star: {
					ra: "16h 29m 1.0s",
					dec: "-26° 29'\'' 24.9",
					story: "Found star using https://www.google.com/sky/"
				}
			})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(201);
				expect(response.body).to.have.property('hash');
				expect(response.body).to.have.property('height');
				expect(response.body).to.have.property('time');
				expect(response.body).to.have.property('previousBlockHash');
				expect(response.body.body).to.have.property('address');
				expect(response.body.body.address).to.be.eql(address);
				expect(response.body.body).to.have.property('star');
				expect(response.body.body.star).to.have.property('ra');
				expect(response.body.body.star).to.have.property('dec');
				expect(response.body.body.star).to.have.property('story');

				fs.writeFileSync('./database/hash.txt', response.body.hash);
			});
	});

	it('Should not register star because of address is Not Authorized', () => {
		return chai.request(baseUrl)
			.post('/block')
			.send({
				address: address,
				star: {
					ra: "16h 29m 1.0s",
					dec: "-26° 29'\'' 24.9",
					story: "Found star using https://www.google.com/sky/"
				}
			})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(401);
				expect(response.body.message).to.be.eql('Not Authorized');
			});
	});

	it('Should not register star because of wrong address', () => {
		return chai.request(baseUrl)
			.post('/block')
			.send({
				address: "address",
				star: {
					ra: "16h 29m 1.0s",
					dec: "-26° 29'\'' 24.9",
					story: "Found star using https://www.google.com/sky/"
				}
			})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(401);
				expect(response.body.message).to.be.eql('Not Authorized');
			});
	});


	it('Should not register star because of missing ra', () => {
		return chai.request(baseUrl)
			.post('/block')
			.send({
				address: address,
				star: {
					dec: "-26° 29'\'' 24.9",
					story: "Found star using https://www.google.com/sky/"
				}
			})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Star information should include non empty string properties dec, ra and story');
			});
	});

	it('Should not register star because of missing dec', () => {
		return chai.request(baseUrl)
			.post('/block')
			.send({
				address: address,
				star: {
					ra: "16h 29m 1.0s",
					story: "Found star using https://www.google.com/sky/"
				}
			})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Star information should include non empty string properties dec, ra and story');
			});
	});

	it('Should not register star because of missing story', () => {
		return chai.request(baseUrl)
			.post('/block')
			.send({
				address: address,
				star: {
					ra: "16h 29m 1.0s",
					dec: "-26° 29'\'' 24.9",
				}
			})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Star information should include non empty string properties dec, ra and story');
			});
	});

	it('Should not register star because of null address', () => {
		return chai.request(baseUrl)
			.post('/block')
			.send({
				address: "",
				star: {
					ra: "16h 29m 1.0s",
					dec: "-26° 29'\'' 24.9",
					story: "Found star using https://www.google.com/sky/"
				}
			})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Address cannot be empty. Please provide a valid address');
			});
	}); 

	it('Should not register star because of null ra', () => {
		return chai.request(baseUrl)
			.post('/block')
			.send({
				address: address,
				star: {
					ra: "",
					dec: "-26° 29'\'' 24.9",
					story: "Found star using https://www.google.com/sky/"
				}
			})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Star information should include non empty string properties dec, ra and story');
			});
	});

	it('Should not register star because of null dec', () => {
		return chai.request(baseUrl)
			.post('/block')
			.send({
				address: address,
				star: {
					ra: "16h 29m 1.0s",
					dec: "",
					story: "Found star using https://www.google.com/sky/"
				}
			})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Star information should include non empty string properties dec, ra and story');
			});
	});

	it('Should not register star because of null story', () => {
		return chai.request(baseUrl)
			.post('/block')
			.send({
				address: address,
				star: {
					ra: "16h 29m 1.0s",
					dec: "-26° 29'\'' 24.9",
					story: ""
				}
			})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Star information should include non empty string properties dec, ra and story');
			});
	});

	it('Should not register star because of missing star', () => {
		return chai.request(baseUrl)
			.post('/block')
			.send({
				address: address,
			})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Star cannot be empty. Please provide valid star');
			});
	});

	it('Should not register star because of story length is > 500 bytes', () => {
		return chai.request(baseUrl)
			.post('/block')
			.send({
				address: address,
				star: {
					ra: "16h 29m 1.0s",
					dec: "-26° 29'\'' 24.9",
					story: "Found star using https://www.google.com/sky/.mfvMZ3BwfvZ22sewTjrybwVW6ni46dq5eomwgauVBP8LuPgJRW99nR4gXVirRQEzHpHumxMZeqAhkGLTqQhzHm6RZxNuiZjd9hDpLpmxhvqT6TV82mPXkLZzA76qrLkTm7ut9PgkmysR4UbdqzezMGih43aD7pcgj8vQh9CVVSmz1vRWt95mw9Kb6mVaLTVAG7jiuUUzvTEdn1uYPN9yuS547KvjDdPoxpoezqndY1V6j6mfvMZ3BwfvZ22sewTjrybwVW6ni46dq5eomwgauVBP8LuPgJRW99nR4gXVirRQEzHpHumxMZeqAhkGLTqQhzHm6RZxNuiZjd9hDpLpmxhvqT6TV82mPXkLZzA76qrLkTm7ut9PgkmysR4UbdqzezMGih43aD7pcgj8vQh9CVVSmz1vRWt95mw9Kb6mVaLTVAG7jiuUUzvTEdn1uYPN9yuS547KvjDdPoxpoezqndY1V6j6mfvMZ3BwfvZ22sewTjrybwVW6ni46dq5eomwgauVBP8LuPgJRW99nR4gXVirRQEzHpHumxMZeqAhkGLTqQhzHm6RZxNuiZjd9hDpLpmxhvqT6TV82mPXkLZzA76qrLkTm7ut9PgkmysR4UbdqzezMGih43aD7pcgj8vQh9CVVSmz1vRWt95mw9Kb6mVaLTVAG7jiuUUzvTEdn1uYPN9yuS547KvjDdPoxpoezqndY1V6j6"
				}
			})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Story size cannot be more than 500 bytes');
			});
	});

	it('Should not register star because of story containing non ASCII charaters', () => {
		return chai.request(baseUrl)
			.post('/block')
			.send({
				address: address,
				star: {
					ra: "16h 29m 1.0s",
					dec: "-26° 29'\'' 24.9",
					story: "Found star using https://www.google.com/sky/.£¥"
				}
			})
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Story can only contain ASCII characters. Please remove non ASCII charaters');
			});
	});
});

describe('GET /stars/address:address', function() {

	this.timeout(1000);

	it('Should return with valid block from the blockchain', (done) => {
		chai.request(baseUrl)
			.get(`/stars/address:${address}`)
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(200);
				expect(response.body).to.be.an('array').that.is.not.empty;
				for(let i in response.body) {
					expect(response.body[i]).to.have.property('hash');
					expect(response.body[i]).to.have.property('height');
					expect(response.body[i]).to.have.property('body');
					expect(response.body[i]).to.have.property('time');
					expect(response.body[i]).to.have.property('previousBlockHash');
				}
				done();
			});
	});

	it('Should return with with an error message', (done) => {
		chai.request(baseUrl)
			.get(`/stars/address:${"address"}`)
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(401);
				expect(response.body.message).to.be.eql('Star(s) Not Found');
				done();
			});
	});
});

describe('GET /stars/hash:hash', function() {

	this.timeout(2000);

	it('Should return with valid block from the blockchain', (done) => {

		const hash = fs.readFileSync('./database/hash.txt');

		chai.request(baseUrl)
			.get(`/stars/hash:${hash}`)
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(200);
				expect(response.body).to.have.property('hash');
				expect(response.body).to.have.property('height');
				expect(response.body).to.have.property('body');
				expect(response.body).to.have.property('time');
				expect(response.body).to.have.property('previousBlockHash');
				done();
			});
	});

	it('Should return with with an error message', (done) => {
		chai.request(baseUrl)
			.get(`/stars/hash:${"hash"}`)
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Not Found');
				done();
			});
	});
});

describe('GET /block/:height', function() {

	this.timeout(2000);

	it('Should return with valid block from the blockchain', (done) => {

		chai.request(baseUrl)
			.get('/block/1')
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(200);
				expect(response.body).to.have.property('hash');
				expect(response.body).to.have.property('height');
				expect(response.body).to.have.property('body');
				expect(response.body).to.have.property('time');
				expect(response.body).to.have.property('previousBlockHash');
				done();
			});
	});

	it('Should return with with an error message because block height is too big', (done) => {
		chai.request(baseUrl)
			.get(`/block/1000`)
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Height passed is greater then max numbers of blocks in blockchain');
				done();
			});
	});

	it('Should return with with an error message because height passed in -1', (done) => {
		chai.request(baseUrl)
			.get(`/block/-1`)
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Invalid height passed');
				done();
			});
	});
});

describe('GET /', function() {
	it('Should return with with an error message because root url is not valid', (done) => {
		chai.request(baseUrl)
			.get(`/`)
			.set('Content-Type', 'application/json')
			.set('Accept', 'applicaton/json')
			.then((response) => {
				expect(response.status).to.be.eql(404);
				expect(response.body.message).to.be.eql('Check README file for accepted endpoints');
				done();
			});
	});
});