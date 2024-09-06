const klv = require('./klv')

module.exports.name = 'st0102'

module.exports.parse = function (buffer, options = {}) {
	const packet = typeof buffer === 'string' ? Buffer.from(buffer, 'hex') : buffer

	options.debug === true && console.debug('-------Start Parse 0102-------')
	options.debug === true && process.stdout.write(`Packet ${packet.toString('hex')} ${packet.length}\n`)

	const values = []

	let i = 0
	while (i < packet.length) {
		const key = packet[i]
		const length = packet[i + 1] // todo follow BER encoding
		const valueBuffer = packet.subarray(i + 2, i + 2 + length) // read content after key and length
		const parsed = convert(key, valueBuffer, options)
		if (parsed !== null) {
			if (typeof parsed.value === 'string') {
				parsed.value = parsed.value.replace(/[^\x20-\x7E]+/g, '')
			}

			if (options.debug === true) {
				console.debug(key, length, parsed.name, `${parsed.value}${parsed.unit || ''}`, valueBuffer)
				parsed.packet = valueBuffer
			}

			values.push(parsed)
		} else {
			options.debug === true && console.debug(key, length, 'NULL')
		}

		i += 1 + 1 + length // advance past key, length and value bytes
	}
	options.debug === true && console.debug('-------End Parse 0102---------')
	return values
}

function convert(key, buffer, options) {
	const data = {
		key
	}

	switch (key) {
		case 1:
			klv.checkRequiredSize(key, buffer, 1)
			data.name = st0102data(key).name
			const classificationEnum = buffer.readUInt8(0)
			switch (classificationEnum) {
				case 0:
					data.value = 'UNKNOWN//'
					break
				case 1:
					data.value = 'UNCLASSIFIED//'
					break
				case 2:
					data.value = 'RESTRICTED//'
					break
				case 3:
					data.value = 'CONFIDENTIAL//'
					break
				case 4:
					data.value = 'SECRET//'
					break
				case 5:
					data.value = 'TOP SECRET//'
					break
				default:
					data.value = 'INVALID//'
					break
			}
			return data
		case 2:
			klv.checkRequiredSize(key, buffer, 1)
			data.name = st0102data(key).name
			const countryCodingEnum = buffer.readUInt8(0)
			switch (countryCodingEnum) {
				case 1:
					data.value = 'ISO-3166 Two Letter'
					break
				case 2:
					data.value = 'ISO-3166 Three Letter'
					break
				case 3:
					data.value = 'FIPS 10-4 Two Letter'
					break
				case 4:
					data.value = 'FIPS 10-4 Four Letter'
					break
				case 5:
					data.value = 'ISO-3166 Numeric'
					break
				case 6:
					data.value = '1059 Two Letter'
					break
				case 7:
					data.value = '1059 Three Letter'
					break
				case 8:
					data.value = 'Omitted Value'
					break
				case 9:
					data.value = 'Omitted Value'
					break
				case 10:
					data.value = 'FIPS 10-4 Mixed'
					break
				case 11:
					data.value = 'ISO 3166 Mixed'
					break
				case 12:
					data.value = 'STANAG 1059 Mixed'
					break
				case 13:
					data.value = 'GENC Two Letter'
					break
				case 14:
					data.value = 'GENC Three Letter'
					break
				case 15:
					data.value = 'GENC Numeric'
					break
				case 16:
					data.value = 'GENC Mixed'
					break
				default:
					data.value = `No reference for ${countryCodingEnum}`
			}
			return data
		case 3:
			return {
				key,
				name: st0102data(key).name,
				value: buffer.toString()
			}
		case 4:
			return {
				key,
				name: st0102data(key).name,
				value: buffer.toString()
			}
		case 5:
			return {
				key,
				name: st0102data(key).name,
				value: buffer.toString()
			}
		case 6:
			return {
				key,
				name: st0102data(key).name,
				value: buffer.toString()
			}
		case 7:
			return {
				key,
				name: st0102data(key).name,
				value: buffer.toString()
			}
		case 8:
			return {
				key,
				name: st0102data(key).name,
				value: buffer.toString()
			}
		case 9:
			return {
				key,
				name: st0102data(key).name,
				value: buffer.toString()
			}
		case 11:
			return {
				key,
				name: st0102data(key).name,
				value: buffer.toString()
			}
		case 12:
			klv.checkRequiredSize(key, buffer, 1)
			data.name = st0102data(key).name
			const objectCountryCodingEnum = buffer.readUInt8(0)
			switch (objectCountryCodingEnum) {
				case 1:
					data.value = 'ISO-3166 Two Letter'
					break
				case 2:
					data.value = 'ISO-3166 Three Letter'
					break
				case 3:
					data.value = 'ISO-3166 Numeric'
					break
				case 4:
					data.value = 'FIPS 10-4 Two Letter'
					break
				case 5:
					data.value = 'FIPS 10-4 Four Letter'
					break
				case 6:
					data.value = '1059 Two Letter'
					break
				case 7:
					data.value = '1059 Three Letter'
					break
				case 8:
					data.value = 'Omitted Value'
					break
				case 9:
					data.value = 'Omitted Value'
					break
				case 10:
					data.value = 'Omitted Value'
					break
				case 11:
					data.value = 'Omitted Value'
					break
				case 12:
					data.value = 'Omitted Value'
					break
				case 13:
					data.value = 'GENC Two Letter'
					break
				case 14:
					data.value = 'GENC Three Letter'
					break
				case 15:
					data.value = 'GENC Numeric'
					break
				case 64:
					data.value = 'GENC AdminSub'
					break
				default:
					data.value = `No reference for ${objectCountryCodingEnum}`
			}
			return data
		case 13:
			let value
			if (buffer[0] === 0 && buffer.length > 1) {
				value = buffer.swap16().toString('utf16le') // node.js only supports little endian reading
				buffer.swap16() // return to original order
			} else {
				value = buffer.toString() // encoding error, utf8
			}

			return {
				key,
				name: st0102data(key).name,
				value
			}
		case 14:
			return {
				key,
				name: st0102data(key).name,
				value: buffer.toString()
			}
		case 19:
			klv.checkRequiredSize(key, buffer, 1)
			return {
				key,
				name: st0102data(key).name,
				value: buffer.readUInt8(0)
			}
		case 20:
			klv.checkRequiredSize(key, buffer, 2)
			return {
				key,
				name: st0102data(key).name,
				value: buffer.readUInt16BE(0)
			}
		case 21:
			klv.checkRequiredSize(key, buffer, 16)
			return {
				key,
				name: st0102data(key).name,
				value: buffer.toString()
			}
		case 22:
			return {
				key,
				name: st0102data(key).name,
				value: buffer.readUInt16BE(0)
			}
		default:
			if (options.strict === true) {
				throw Error(`st0102 key ${key} not found`)
			}
			return {
				key,
				name: st0102data(key).name,
				value: 'Not Implemented'
			}
	}
}

exports.getLength = (key) => {
	return st0102data(key).length ?? 2
}

const st0102data = (key) => {
	if (typeof key === 'string') {
		key = parseInt(key)
	}
	switch (key) {
		case 1:
			return {name: 'Security Classification'}
		case 2:
			return {name: 'Classifying Country Coding Method'}
		case 3:
			return {name: 'Classifying Country'}
		case 4:
			return {name: 'Security Information'}
		case 5:
			return {name: 'Caveats'}
		case 6:
			return {name: 'Releasing Instructions'}
		case 7:
			return {name: 'Classified By'}
		case 8:
			return {name: 'Derived From'}
		case 9:
			return {name: 'Classification Reason'}
		case 11:
			return {name: 'Classification and Marking System'}
		case 12:
			return {name: 'Object Country Coding Method'}
		case 13:
			return {name: 'Object Country Codes'}
		case 19:
			return {name: 'Stream ID'}
		case 20:
			return {name: 'Transport Stream ID'}
		case 21:
			return {name: 'Item Designator ID'}
		case 22:
			return {name: 'Version', length: 4}
		default:
			return {name: 'Unknown'}
	}
}