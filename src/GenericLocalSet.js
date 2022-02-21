const klv = require('./klv')

module.exports.getKeyName = function (key) {
	switch (key) {
		default:
			return 'User Defined LS'
	}
}

module.exports.decodeValue = function (key, type, buffer) {
	switch (type) {
		case 0:
			return buffer.toString()
		case 64:
			return klv.readVariableUInt(buffer)
		case 128:
			return klv.readVariableInt(buffer)
		case 192:
			return buffer.toString('hex')
		default:
			return buffer.toString('hex')
	}
}
