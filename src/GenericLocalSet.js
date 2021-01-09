module.exports.getKeyName = function (key) {
	switch(key) {
		default:
			return 'User Defined LS'
	}
}

module.exports.decodeValue = function (key, buffer) {
	switch(key) {
		default:
			return buffer.toString('hex')
	}
}
