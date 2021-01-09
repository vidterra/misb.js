const klv = require('./klv')

module.exports.parse = function (buffer, options = {}) {
	const packet = typeof buffer === 'string' ? Buffer.from(buffer, 'hex') : buffer
	const values = {}

	options.debug === true && console.debug('-------Start Parse vObject-------')
	options.debug === true && process.stdout.write(`Buffer ${buffer.toString('hex')} ${buffer.length}\n`)

	const keyPlusLength = 2
	let i = 0
	while (i < packet.length) {
		const key = packet[i]
		const valueLength = packet[i+1]

		if(packet.length < i + keyPlusLength + valueLength) {
			throw new Error('Invalid vObject buffer, not enough content')
		}

		const valueBuffer = packet.subarray(i + keyPlusLength, i + keyPlusLength + valueLength)
		const parsed = convert(key, valueBuffer)

		if(typeof parsed.value === 'string') {
			parsed.value = parsed.value.replace(/[^\x20-\x7E]+/g, '')
		}

		if (options.debug === true) {
			console.debug(key, valueLength, parsed.name, `${parsed.value}${parsed.unit || ''}`, valueBuffer)
			parsed.packet = valueBuffer
		}

		if(options.verbose) {
			values[key] = parsed
		} else {
			values[key] = parsed.value
		}

		i += keyPlusLength + valueLength // advance past key, length and value bytes
	}
	options.debug === true && console.debug('-------End Parse vObject---------')
	return values
}

function convert(key, buffer) {
	const data = {
		key,
	}
	try {
		switch (key) {
			case 1:
				return {
					...data,
					name: 'Ontology',
					value: buffer.toString()
				}
			case 2:
				return {
					...data,
					name: 'Ontology Class',
					value: buffer.toString()
				}
			case 3:
				klv.checkMaxSize(key, buffer, 3)
				return {
					...data,
					name: 'Ontology ID',
					value: klv.readVariableUInt(buffer, buffer.length)
				}
			case 4: // todo this is not correct
				klv.checkMaxSize(key, buffer, 6)
				return {
					...data,
					name: 'Confidence',
					value: klv.readVariableUInt(buffer, buffer.length)
				}
			default:
				throw Error(`Key ${key} not found`)
		}
	} catch (e) {
		throw e
	}
}
