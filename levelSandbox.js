"use strict";
/* Configure levelDB and define the function to get and put data into DB */

const level = require('level');
const chainDB = './database/chain';
const db = level(chainDB);

/* ================== Persist data with LevelDB =================
|  Learn more: level: https://github.com/Level/level     	|
|  =============================================================*/

// Add data to levelDB with key/value pair
exports.addBlock = function (key, value) {
	return new Promise(function (resolve, reject) {
		db.put(key, value, function (error) {
			if (error) {
				reject(error);
			}

			resolve("Added Block # " + key);
		});
	});
}

/*
 * Get data from database with key
 */
exports.getBlockByKey = function (key) {
	return new Promise((resolve, reject) => {
		db.get(key, (error, value) => {
			if (error) {
				reject(error);
			}

			let block = JSON.parse(value);
			block.body.star.storyDecoded = new Buffer.from(block.body.star.story, 'hex').toString();
			resolve(block);
		});
	});
}

/*
 * Get the max height of the block in the database
 */
exports.getBlockHeight = function () {
	return new Promise(function (resolve, reject) {
		let height = -1;

		db.createReadStream().on('data', function (data) {
			height++;
		}).on('error', function (error) {
			reject(error);
		}).on('close', function () {
			resolve(height);
		});
	});
}

/*
 * Get the complete blockchain from the database
 */
exports.getBlockChain = function () {
	return new Promise(function (resolve, reject) {
		let dataArray = [];

		db.createReadStream().on('data', function (data) {
			dataArray.push(data);
		}).on('error', function (error) {
			reject(error);
		}).on('close', function () {
			resolve(dataArray);
		});
	});
}

/*
 * Get blocks from the database based on address.
 */
exports.getBlockByAddress = function(address) {
	let addressBlocks = [];
	let block;
	let found = false;

	return new Promise((resolve, reject) => {

		db.createReadStream().on('data', (data) => {
			if (!(parseInt(data.key) === 0)) {
				block = JSON.parse(data.value);

				if (block.body.address === address) {
					block.body.star.storyDecoded = new Buffer.from(block.body.star.story, 'hex').toString();
					addressBlocks.push(block);
					found = true;
				}
			}
		}).on('error', (error) => {
			reject(new Error("Not Found"));
		}).on('close', () => {
			if (found) {
				resolve(addressBlocks);
			} else {
				reject(new Error("Star(s) Not Found"));
			}
		})
	});
}

/*
 * Get blocks from database based on the hash value
 */
exports.getBlockByHash = function(hash) {

	return new Promise((resolve, reject) => {
		db.createReadStream().on('data', (data) => {

			if (!(parseInt(data.key) === 0)) {

				let block = JSON.parse(data.value);

				if (block.hash === hash) {
					block.body.star.storyDecoded = new Buffer.from(block.body.star.story, 'hex').toString();
					return resolve(block);
				}
			}
		}).on('error', (error) => {
			return reject(error);
		}).on('close', () => {
			return reject(new Error("Not Found"));
		});
	});
}
