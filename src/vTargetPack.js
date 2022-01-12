const klv = require('./klv')
const Location = require('./Location')
const vObject = require('./vObject')
const vObjectSeries = require('./vObjectSeries')
const vTracker = require('./vTracker')

module.exports.parse = function (buffer, options = {}) {
	const packet = typeof buffer === 'string' ? Buffer.from(buffer, 'hex') : buffer
	const values = {}

	options.debug === true && console.debug('-------Start Parse vTarget Pack-------')
	options.debug === true && process.stdout.write(`Buffer ${buffer.toString('hex')} ${buffer.length}\n`)
	let i = 0

	let targetId = 0
	let read
	do {
		read = packet[i]
		const highBits = targetId << 7
		const lowBits = read & 0x7F
		targetId = highBits + lowBits
		i++
	} while (read >>> 7 === 1)

	if(options.verbose) {
		values.targetId = {
			key: 0,
			name: 'Target ID',
			value: targetId
		}
	} else {
		values.targetId = targetId
	}
	options.debug === true && console.debug('Target', targetId)

	while (i < packet.length) {
		const key = packet[i]
		const length = packet[i+1]

		if(packet.length < i + 2 + length) {
			throw new Error('Invalid vTargetPack buffer, not enough content')
		}

		const valueBuffer = packet.subarray(i + 2, i + 2 + length)
		const parsed = convert(key, valueBuffer, options)

		if(typeof parsed.value === 'string') {
			parsed.value = parsed.value.replace(/[^\x20-\x7E]+/g, '')
		}

		if (options.debug === true) {
			console.debug(key, length, parsed.name, `${parsed.value}${parsed.unit || ''}`, valueBuffer)
			parsed.packet = valueBuffer
		}

		if(options.verbose) {
			values[key] = parsed
		} else {
			values[key] = parsed.value
		}

		i += 1 + 1 + length // advance past key, length and value bytes
	}
	options.debug === true && console.debug('-------End Parse vTarget Pack---------')
	return values
}

function convert(key, buffer, options) {
	const data = {
		key,
	}
	try {
		switch (key) {
			case 1:
				klv.checkMaxSize(key, buffer, 6)
				return {
					...data,
					name: 'Target Centroid',
					value: klv.readVariableUInt(buffer, buffer.length)
				}
			case 2:
				klv.checkMaxSize(key, buffer, 6)
				return {
					...data,
					name: 'Boundary Top Left',
					value: klv.readVariableUInt(buffer, buffer.length)
				}
			case 3:
				klv.checkMaxSize(key, buffer, 6)
				return {
					...data,
					name: 'Boundary Bottom Right',
					value: klv.readVariableUInt(buffer, buffer.length)
				}
			case 5:
				klv.checkMaxSize(key, buffer, 6)
				return {
					...data,
					name: 'Target Confidence Level',
					value: buffer.readUInt8(0)
				}
			case 17:
				klv.checkRequiredSize(key, buffer, 22)
				return {
					...data,
					name: 'Target Location',
					value: Location.parse(buffer, options)
				}
			case 19:
				klv.checkMaxSize(key, buffer, 4)
				return {
					...data,
					name: 'Centroid Pix Row',
					value: klv.readVariableUInt(buffer, buffer.length)
				}
			case 20:
				klv.checkMaxSize(key, buffer, 4)
				return {
					...data,
					name: 'Centroid Pix Col',
					value: klv.readVariableUInt(buffer, buffer.length)
				}
			case 22:
				klv.checkMaxSize(key, buffer, 4)
				return {
					...data,
					name: 'Algorithm ID',
					value: klv.readVariableUInt(buffer, buffer.length)
				}
			case 102:
				return {
					...data,
					name: 'VObject',
					value: vObject.parse(buffer, options)
				}
			case 104:
				return {
					...data,
					name: 'VTracker',
					value: vTracker.parse(buffer, options)
				}
			case 107:
				return {
					...data,
					name: 'vObjectSeries',
					value: vObjectSeries.parse(buffer, options)
				}
			default:
				if (options.debug === true) {
					throw Error(`Key ${key} not found`)
				}
				return null
		}
	} catch (e) {
		throw e
	}
}
