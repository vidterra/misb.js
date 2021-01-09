const klv = require('./klv')

module.exports.name = 'st0104'
module.exports.key = Buffer.from('060e2b34020101010e01010201010000', 'hex')
module.exports.minSize = 31

module.exports.parse = function (buffer, options = {}) {
	const packet = typeof buffer === 'string' ? Buffer.from(buffer, 'hex') : buffer
	const values = {}

	options.debug === true && console.debug('-------Start Parse 0104-------')
	options.debug === true && process.stdout.write(`Packet ${packet.toString('hex')} ${packet.length}\n`)

	if (packet.length < module.exports.minSize) { // must have a 16 byte key, 1 byte BER, 10 byte timestamp, 4 byte checksum
		throw new Error('Buffer has no content to read')
	}

	const val = module.exports.key.compare(packet, 0, module.exports.key.length) // compare first 16 bytes before BER
	if (val !== 0) {
		throw new Error('Not ST0104')
	}

	let {berHeader, berLength, contentLength} = klv.getBer(packet[module.exports.key.length])
	if (contentLength === null) {
		contentLength = klv.getContentLength(packet.subarray(module.exports.key.length + berHeader, module.exports.key.length + berHeader + berLength))// read content after key and length)
	}

	const parsedLength = module.exports.key.length + berHeader + berLength + contentLength
	if (parsedLength > packet.length) {  // buffer length isn't long enough to read content
		throw new Error('Buffer includes ST0104 key and BER but not content')
	}

	let i = module.exports.key.length + berHeader + berLength //index of first content key
	while (i < parsedLength) {
		const key = packet.subarray(i, i + 16)

		let {berHeader, berLength, contentLength} = klv.getBer(packet[i + key.length])
		if (contentLength === null) {
			contentLength = klv.getContentLength(packet.subarray(i + key.length + berHeader, i + 1 + berHeader + berLength))// read content after key and length
		}

		const valueBuffer = packet.subarray(i + key.length + berHeader + berLength, i + key.length + berHeader + berLength + contentLength) // read content after key and length

		if (parsedLength < i + berHeader + berLength + contentLength + 1) {
			throw new Error('Invalid ST0104 buffer, not enough content')
		}

		const keyString = key.toString('hex')
		const parsed = convert(keyString, valueBuffer, options)

		if (parsed !== null) {
			if (typeof parsed.value === 'string') {
				parsed.value = parsed.value.replace(/[^\x20-\x7E]+/g, '')
			}
			if (options.debug === true) {
				console.debug(keyString, contentLength, parsed.name, `${parsed.value}${parsed.unit || ''}`, valueBuffer)
				parsed.packet = valueBuffer
			}
			if (options.verbose) {
				values[keyString] = parsed
			} else {
				values[keyString] = parsed.value
			}
		} else {
			options.debug === true && console.debug(keyString, contentLength, 'NULL')
		}

		i += key.length + berHeader + berLength + contentLength // advance past key, length and value bytes
	}
/*
	if (!klv.isChecksumValid(packet.subarray(0, parsedLength), values[1]?.value || values[1])) {
		throw new Error('Invalid checksum')
	}
*/
	return values
}

function convert(key, buffer, options) {
	const data = {
		key,
	}

	try {
		switch (key) {
			case '060e2b34010101030702010101050000':
				return {
					...data,
					name: 'User Defined Time Stamp',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010702010201010000':
				return {
					...data,
					name: 'Start Date Time - UTC',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010702010207010000':
				return {
					...data,
					name: 'Event Start Date Time - UTC',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010420010201010000':
				return {
					...data,
					name: 'Image Source Device',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010701020103020000':
				return {
					...data,
					name: 'Frame Center Latitude',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010701020103040000':
				return {
					...data,
					name: 'Frame Center Longitude',
					value: buffer.toString('hex')
				}
			case '060e2b340101010a0701020103160000':
				return {
					...data,
					name: '???',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010701090201000000':
				return {
					...data,
					name: 'Target Width',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010701020102020000':
				return {
					...data,
					name: 'Device Altitude',
					value: buffer.toString('hex')
				}
			case '060e2b34010101030701020102060200':
				return {
					...data,
					name: 'Device Longitude',
					value: buffer.toString('hex')
				}
			case '060e2b34010101030701020102040200':
				return {
					...data,
					name: 'Device Latitude',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010701080101000000':
				return {
					...data,
					name: 'Slant Range',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010701100102000000':
				return {
					...data,
					name: 'Angle to North',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010701100101000000':
				return {
					...data,
					name: 'Sensor Roll Angle',
					value: buffer.toString('hex')
				}
			case '060e2b34010101020420020101080000':
				return {
					...data,
					name: 'Field of View (Horizontal)',
					value: buffer.toString('hex')
				}
			case '060e2b340101010704200201010a0100':
				return {
					...data,
					name: 'Field of View (Vertical)',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010701100103000000':
				return {
					...data,
					name: 'Obliquity Angle',
					value: buffer.toString('hex')
				}
			case '060e2b34010101070701100106000000':
				return {
					...data,
					name: 'Platform Heading Angle',
					value: buffer.toString('hex')
				}
			case '060e2b34010101070701100104000000':
				return {
					...data,
					name: 'Platform Roll Angle',
					value: buffer.toString('hex')
				}
			case '060e2b34010101070701100105000000':
				return {
					...data,
					name: 'Platform Pitch Angle',
					value: buffer.toString('hex')
				}
			case '060e2b34010101030701020103070100':
				return {
					...data,
					name: 'Corner Latitude Point 1',
					value: buffer.toString('hex')
				}
			case '060e2b34010101030701020103080100':
				return {
					...data,
					name: 'Corner Latitude Point 2',
					value: buffer.toString('hex')
				}
			case '060e2b34010101030701020103090100':
				return {
					...data,
					name: 'Corner Latitude Point 3',
					value: buffer.toString('hex')
				}
			case '060e2b340101010307010201030a0100':
				return {
					...data,
					name: 'Corner Latitude Point 4',
					value: buffer.toString('hex')
				}
			case '060e2b340101010307010201030b0100':
				return {
					...data,
					name: 'Corner Longitude Point 1',
					value: buffer.toString('hex')
				}
			case '060e2b340101010307010201030c0100':
				return {
					...data,
					name: 'Corner Longitude Point 2',
					value: buffer.toString('hex')
				}
			case '060e2b340101010307010201030d0100':
				return {
					...data,
					name: 'Corner Longitude Point 3',
					value: buffer.toString('hex')
				}
			case '060e2b340101010307010201030e0100':
				return {
					...data,
					name: 'Corner Longitude Point 4',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010701010100000000':
				return {
					...data,
					name: 'Image Coordinate System',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010101200100000000':
				return {
					...data,
					name: 'Device Designation',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010701030101010000':
				return {
					...data,
					name: '???',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010701010200000000':
				return {
					...data,
					name: '???',
					value: buffer.toString('hex')
				}
			case '060e2b34010101010105050000000000':
				return {
					...data,
					name: 'Episode Number',
					value: buffer.toString('hex')
				}
			default:
				if (options.debug === true) {
					throw Error(`Key ${keyString} not found`)
				}
				return null
		}
	} catch (e) {
		throw e
	}
}
