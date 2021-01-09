const klv = require('./klv')
const PoiLocalSet = require('./PoiLocalSet')
const UserDefinedLocalSet = require('./UserDefinedLocalSet')

module.exports.name = 'st0806'
module.exports.key = Buffer.from('060E2B34020B01010E01030102000000', 'hex')
module.exports.minSize = 31

//const keyLength = options.localSet ? 1 : module.exports.key.length
//const val = module.exports.key.compare(packet, 0, module.exports.key.length) // compare first 16 bytes before BER

module.exports.parse = function (buffer, options = {}) {
	const packet = typeof buffer === 'string' ? Buffer.from(buffer, 'hex') : buffer

	options.debug === true && console.debug('-------Start Parse 0806-------')
	options.debug === true && process.stdout.write(`Packet ${packet.toString('hex')} ${packet.length}\n`)

	if (packet.length < module.exports.minSize) { // must have a 16 byte key, 1 byte BER, 10 byte timestamp, 4 byte checksum
		throw new Error('Buffer has no content to read')
	}

	const val = module.exports.key.compare(packet, 0, module.exports.key.length) // compare first 16 bytes before BER
	if (val !== 0) {
		throw new Error('Not ST 0806')
	}

	let {berHeader, berLength, contentLength} = klv.getBer(packet[module.exports.key.length])
	if (contentLength === null) {
		contentLength = klv.getContentLength(packet.subarray(module.exports.key.length + berHeader, module.exports.key.length + berHeader + berLength))// read content after key and length
	}

	const parsedLength = module.exports.key.length + berHeader + berLength + contentLength
	if (parsedLength > packet.length) {  // buffer length isn't long enough to read content
		throw new Error('Buffer includes ST 0806 key and BER but not content')
	}

	let i = module.exports.key.length + berHeader + berLength //index of first content key

	const values = module.exports.parseLS(buffer.slice(i, i + parsedLength), {...options, header: false})

	if (!klv.is0806ChecksumValid(packet.subarray(0, packet.length), values[1].value || values[1])) {
		throw new Error('Invalid checksum')
	}

	return values
}

module.exports.parseLS = function (buffer, options = {}) {
	const packet = typeof buffer === 'string' ? Buffer.from(buffer, 'hex') : buffer
	const values = {}

	options.debug === true && options.header !== false && console.debug('-------Start Parse 0806-------')
	options.debug === true && options.header !== false && process.stdout.write(`Packet ${packet.toString('hex')} ${packet.length}\n`)

	let i = 0

	while (i < packet.length) {
		const key = packet[i]

		let {berHeader, berLength, contentLength} = klv.getBer(packet[i + 1])
		if (contentLength === null) {
			contentLength = klv.getContentLength(packet.subarray(i + 1 + berHeader, i + 1 + berHeader + berLength))// read content after key and length)
		}

		const valueBuffer = packet.subarray(i + berHeader + berLength + 1, i + berHeader + berLength + contentLength + 1) // read content after key and length


		if (packet.length < i + berHeader + berLength + contentLength + 1) {
			throw new Error('Invalid st0806 buffer, not enough content')
		}
		const parsed = convert(key, valueBuffer, options)
		if (typeof parsed.value === 'string') {
			parsed.value = parsed.value.replace(/[^\x20-\x7E]+/g, '')
		}

		if (options.debug === true) {
			console.debug(key, contentLength, parsed.name, `${parsed.value}${parsed.unit || ''}`, valueBuffer)
			parsed.packet = valueBuffer
		}

		if (key === 11) { // handle User Defined LS Key 11 differently
			if (values[key] === undefined) values[key] = []
			values[key].push(options.verbose ? parsed : parsed.value)
		} else {
			values[key] = options.verbose ? parsed : parsed.value
		}

		i += berHeader + berLength + contentLength + 1 // advance past key, length and value bytes
	}

	if (!klv.is0806ChecksumValid(packet.subarray(0, packet.length), values[1].value || values[1])) {
		throw new Error('Invalid checksum')
	}

	options.debug === true && console.debug('-------End Parse 0806---------')
	return values
}

function convert(key, buffer, options) {
	const data = {
		key
	}

	switch (key) {
		case 1:
			klv.checkRequiredSize(key, buffer, 4)
			return {
				...data,
				name: st0806data(key).name,
				value: buffer.readUInt16BE(0)
			}
		case 2:
			klv.checkRequiredSize(key, buffer, 8)
			return {
				...data,
				name: st0806data(key).name,
				value: parseFloat(buffer.readBigUInt64BE(0)),
				unit: 'µs'
			}
		case 7:
			klv.checkRequiredSize(key, buffer, 4)
			return {
				...data,
				name: st0806data(key).name,
				value: buffer.readUInt32BE(0),
			}
		case 8:
			klv.checkRequiredSize(key, buffer, 1)
			return {
				...data,
				name: st0806data(key).name,
				value: buffer.readUInt8(0),
			}
		case 9:
			klv.checkRequiredSize(key, buffer, 4)
			return {
				...data,
				name: st0806data(key).name,
				value: buffer.readUInt32BE(0),
			}
		case 10:
			return {
				...data,
				name: st0806data(key).name,
				value: buffer.toString(),
			}
		case 11:
			const localSet = UserDefinedLocalSet.parse(buffer, options)
			if(localSet['1'] && localSet['2']) {
				return {
					...data,
					name: `${localSet['2'].name} (${localSet['1'].value})`,
					value: localSet['2'].value
				}
			} else {
				return {
					...data,
					name: `Error Bad Metadata`,
					value: JSON.stringify(localSet)
				}
			}
		/*case 12:
			const poiSet = PoiLocalSet.parse(buffer, options)
			return {
				...data,
				name: st0806data(key).name,
				value: poiSet,
			}*/
		case 12:
			return {
				...data,
				name: st0806data(key).name,
				value: buffer.toString(), // todo parse 0806 poi
			}
		case 18:
			klv.checkRequiredSize(key, buffer, 1)
			return {
				...data,
				name: st0806data(key).name,
				value: buffer.readUInt8(0),
			}
		case 19:
			klv.checkRequiredSize(key, buffer, 3)
			return {
				...data,
				name: st0806data(key).name,
				value: buffer.toString()
			}
		case 20:
			klv.checkRequiredSize(key, buffer, 3)
			return {
				...data,
				name: st0806data(key).name,
				value: buffer.readUIntBE(0, 3),
				unit: 'm'
			}
		case 21:
			klv.checkRequiredSize(key, buffer, 3)
			return {
				...data,
				name: st0806data(key).name,
				value: buffer.readUIntBE(0, 3),
				unit: 'm'
			}
		default:
			if (options.debug === true) {
				throw Error(`Key ${key} not found`)
			}
			return null
	}
}

module.exports.keys = (key) => {
	return st0806data(key)
}

const st0806data = (key) => {
	if (typeof key === 'string') {
		key = parseInt(key)
	}
	switch (key) {
		case 1:
			return {name: 'Checksum', length: 2}
		case 2:
			return {name: 'Precision Time Stamp', length: 8}
		case 1:
			return {name: 'Checksum', length: 4}
		case 2:
			return {name: 'Precision Time Stamp', length: 8}
		case 7:
			return {name: 'Frame Code', length: 4}
		case 8:
			return {name: 'RVT LS Version Number', length: 1}
		case 9:
			return {name: 'Video Data Rate', length: 4}
		case 10:
			return {name: 'Digital Video File Format'}
		case 11:
			return {name: 'User Defined LS'}
		case 12:
			return {name: 'Point of Interest LS'}
		case 18:
			return {name: 'MGRS Zone Second Value', length: 1}
		case 19:
			return {name: 'MGRS Latitude Band and Grid Square Second Value', length: 3}
		case 20:
			return {name: 'MGRS Easting Second Value', length: 3}
		case 21:
			return {name: 'MGRS Northing Second Value', length: 3}
		default:
			return {name: 'Unknown'}
	}
}
