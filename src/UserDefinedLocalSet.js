let LocalSet
try {
	LocalSet = require('./CustomLocalSet')
} catch (e) {
	LocalSet = require('./GenericLocalSet')
}

let id = null

module.exports.parse = function (buffer, options = {}) {
	const packet = typeof buffer === 'string' ? Buffer.from(buffer, 'hex') : buffer
	const values = {}

	//options.debug === true && console.debug('-------Start Parse User Defined Local Set-------')
	//options.debug === true && process.stdout.write(`Buffer ${buffer.toString('hex')} ${buffer.length}\n`)

	const keyPlusLength = 2
	let i = 0
	while (i < packet.length) {
		const key = packet[i]
		const valueLength = packet[i + 1]

		if (packet.length < i + keyPlusLength + valueLength) {
			throw new Error('Invalid User Defined Local Set buffer, not enough content')
		}

		const valueBuffer = packet.subarray(i + keyPlusLength, i + keyPlusLength + valueLength)
		const parsed = convert(key, valueBuffer, options)

		if (parsed !== null) {
			if (typeof parsed.value === 'string') {
				parsed.value = parsed.value.replace(/[^\x20-\x7E]+/g, '')
			}

			if (options.debug === true) {
				console.debug(key, valueLength, parsed.name, `${parsed.value}${parsed.unit || ''}`, valueBuffer)
				parsed.packet = valueBuffer
			}
		} else {
			options.debug === true && console.debug(key, contentLength, 'NULL')
		}
		values[key] = parsed

		i += keyPlusLength + valueLength // advance past key, length and value bytes
	}
	//options.debug === true && console.debug('-------End Parse User Defined Local Set---------')

	return values
}

function convert(key, buffer, options) {
	try {
		switch (key) {
			case 1:
				id = buffer.readUInt8(0) & 0b00111111 // this must be set before key 2 is read
				return {
					key,
					name: 'ID',
					value: id
				}
			case 2:
				return {
					key,
					name: LocalSet.getKeyName(id),
					value: LocalSet.decodeValue(id, buffer)
				}
			default:
				if (options.debug === true) {
					//throw Error(`Key ${key} not found`)
				}
				return {
					key,
					name: 'Unknown',
					value: buffer.toString()
				}
		}
	} catch (e) {
		throw e
	}
}
