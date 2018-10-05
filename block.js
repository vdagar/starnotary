"use strict";
/* ===== Block Class ==============================
|  Class with a constructor for block		   |
|  ===============================================*/

class Block {
	constructor(data) {
		this.hash = "",
			this.height = 0,
			this.body = data,
			this.time = 0,
			this.previousBlockHash = ""
	}
}

/*
 * export the module as it is required in other files
 */
module.exports = Block;
