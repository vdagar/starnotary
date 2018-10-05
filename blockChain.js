"use strict";
/**
 * CRITERIA: Configure simpleChain.js with levelDB to persist blockchain dataset using the level Node.js library.
 */

const chaindb = require('./levelSandbox')
const Block = require('./block');

/* ================= SHA256 with Crypto-js ===================
|  Learn more: Crypto-js: https://github.com/brix/crypto-js  |
|  =========================================================*/

const SHA256 = require('crypto-js/sha256');

/* ================ Blockchain Class ===============
|  Class with a constructor for new blockchain     |
|  ================================================*/

class Blockchain {
	constructor() {
		/*
		 * CRITERIA : Genesis block persist as the first block in the blockchain using LevelDB
		 */

		this.blockHeight;
		this.getBlockHeight().then((height) => {
			this.blockHeight = height;
			if (height === -1) {
				const star = {
					ra: "0h 0m 0.0s",
					dec: "0° 29'\'' 24.9",
					story: new Buffer.from("First block in the chain - Genesis block").toString('hex'),
				}

				const body = {
					address: "Gensis Block - Dummy Address",
					star: star
				}
				this.addBlock(new Block(body));
			}

		}).catch(error => { console.log(error) });
	}

	/*
	 * CRITERIA : addBlock(newBlock) function includes a method to store newBlock with LevelDB.
	 */

	async addBlock(newBlock) {
		let res = '';
		// Block height
		newBlock.height = this.blockHeight + 1;

		// UTC timestamp
		newBlock.time = new Date().getTime().toString().slice(0, -3);

		// previous block hash
		if (newBlock.height > 0) {
			const prevBlock = await this.getBlockByHeight(this.blockHeight);
			newBlock.previousBlockHash = prevBlock.hash;
		}

		// Block hash with SHA256 using newBlock and converting to a string
		newBlock.hash = SHA256(JSON.stringify(newBlock)).toString();

		this.blockHeight = newBlock.height;

		// Adding block object to levelDB
		await chaindb.addBlock(newBlock.height, JSON.stringify(newBlock)).then((result) => {
			res = result;
		}).catch(error => { res = error; });

		return res;
	}

	/*
	 * CRITERIA : Modify getBlockHeight() function to retrieve current block height within the LevelDB chain.
	 */
	async getBlockHeight() {
		return await chaindb.getBlockHeight().then((height) => { return height; }).catch(error => { throw error; });
	}

	/*
	 * CRITERIA : Get star block by star block height with JSON response.
	 */
	async getBlockByHeight(blockHeight) {
		// return object as a single string
		return await chaindb.getBlockByKey(blockHeight).then((block) => {
			return block;
		}).catch(error => {
			throw error;
		});
	}

	/*
	 * CRITERIA: Get star block by wallet address (blockchain identity) with JSON response.
	 */
	async getBlockByAddress(address) {
		try {
			return await chaindb.getBlockByAddress(address);
		} catch(error) {
			throw error;
		}
	}

	/*
	 * CRITERIA: Get star block by hash with JSON response.
	 */
	async getBlockByHash(hash) {
		try {
			return await chaindb.getBlockByHash(hash);
		} catch (error) {
			throw error;
		}
	}

	/*
	 * CRITERIA : Modify the validateBlock() function to validate a block stored within levelDB
	 */
	async validateBlock(blockHeight) {
		// get block from level db
		let block = await this.getBlockByHeight(blockHeight);

		// save block hash
		let blockHash = block.hash;

		// remove block hash to test block integrity
		block.hash = '';

		// generate block hash
		let validBlockHash = SHA256(JSON.stringify(block)).toString();

		// Compare
		if (blockHash === validBlockHash) {
			return true;
		} else {
			console.log('Block #' + blockHeight + ' invalid hash:\n' + blockHash + '<>' + validBlockHash);
			return false;
		}
	}

	/*
	 * CRITERIA : Modify the validateChain() function to validate blockchain stored within levelDB
	 */
	async validateChain() {
		let isValid = false;
		let errorLog = [];
		let previousHash = '';
		let height = this.blockHeight;

		for (var i = 0; i <= height; i++) {
			// get block from levelDB
			let block = await this.getBlockByHeight(i);

			// validate block
			isValid = await this.validateBlock(block.height);

			if (!isValid) {
				errorLog.push(block.height);
			}

			// compare blocks hash link
			if (block.previousBlockHash !== previousHash) {
				errorLog.push(block.height);
			}

			// save current block hash for comparision with next block's previous Hash
			previousHash = block.hash;

			if (this.blockHeight === block.height) {
				console.log("BlockChain Validation completed \n");
				if (errorLog.length > 0) {
					console.log('Block errors = ' + errorLog.length);
					console.log('Blocks: ' + errorLog);
				} else {
					console.log('No errors detected\n\n');
				}
			}
		}

		// uncomment these 3 lines to display chain after its validated
		/*await leveldb.getChainFromLevelDB().then((blocks) => {
			console.log(blocks);
		}).catch(error => { console.log(error) });*/
	}
}

/*
 * export the module as it is required in other files
 */
module.exports = Blockchain
