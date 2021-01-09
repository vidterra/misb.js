const klv = require('./klv')

module.exports.parse = function (buffer, options = {}) {
	const packet = typeof buffer === 'string' ? Buffer.from(buffer, 'hex') : buffer
	const values = {}

	options.debug === true && console.debug('-------Start Parse Location-------')
	options.debug === true && process.stdout.write(`Buffer ${buffer.toString('hex')} ${buffer.length}\n`)

	values.lat = klv.scale(packet.readUInt32BE(0, 4), [0, 2 ** 32 - 1], [-90, 90])  // todo fix this
	values.lon = klv.scale(packet.readUInt32BE(5, 8), [0, 2 ** 32 - 1], [-180, 180])
	values.hae = klv.scale(packet.readUInt16BE(9, 10), [0, 2 ** 16 - 1], [-900, 19000])

	options.debug === true && console.debug('lat', values.lat, packet.slice(0, 4))
	options.debug === true && console.debug('lon', values.lon, packet.slice(4, 8))
	options.debug === true && console.debug('hae', values.hae, packet.slice(8, 10))

	// todo add Standard Deviations and Correlation Coefficients pg 51 0903.5

	options.debug === true && console.debug('-------End Parse Location---------')
	return values
}
