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
			data.name = 'Security Classification'
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
			data.name = 'Classifying Country Coding Method'
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
				name: 'Classifying Country',
				value: buffer.toString()
			}
		case 4:
			return {
				key,
				name: 'Security Information',
				value: buffer.toString()
			}
		case 5:
			return {
				key,
				name: 'Caveats',
				value: buffer.toString()
			}
		case 6:
			return {
				key,
				name: 'Releasing Instructions',
				value: buffer.toString()
			}
		case 7:
			return {
				key,
				name: 'Classified By',
				value: buffer.toString()
			}
		case 8:
			return {
				key,
				name: 'Derived From',
				value: buffer.toString()
			}
		case 9:
			return {
				key,
				name: 'Classification Reason',
				value: buffer.toString()
			}
		case 11:
			return {
				key,
				name: 'Classification and Marking System',
				value: buffer.toString()
			}
		case 12:
			klv.checkRequiredSize(key, buffer, 1)
			data.name = 'Object Country Coding Method'
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
			return {
				key,
				name: 'Object Country Codes',
				value: buffer.toString()
			}
		case 14:
			return {
				key,
				name: 'Classification Comments',
				value: buffer.toString()
			}
		case 19:
			klv.checkRequiredSize(key, buffer, 1)
			return {
				key,
				name: 'Stream ID',
				value: buffer.readUInt8(0)
			}
		case 20:
			klv.checkRequiredSize(key, buffer, 2)
			return {
				key,
				name: 'Transport Stream ID',
				value: buffer.readUInt16BE(0)
			}
		case 21:
			klv.checkRequiredSize(key, buffer, 16)
			return {
				key,
				name: 'Item Designator ID',
				value: buffer.toString()
			}
		case 22:
			return {
				key,
				name: 'Version',
				value: buffer.readUInt16BE(0)
			}
		default:
			if (options.strict === true) {
				throw Error(`st0102 key ${key} not found`)
			}
			return {
				key,
				name: 'Unknown',
				value: 'Not Implemented'
			}
	}
}
