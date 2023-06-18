const st0102 = require('./st0102')
const st0806 = require('./st0806')
const st0903 = require('./st0903')
const klv = require('./klv')

module.exports.name = 'st0601'
module.exports.key = Buffer.from('060e2b34020b01010e01030101000000', 'hex')
module.exports.minSize = 31

module.exports.parse = (buffer, options = {}) => {
	const packet = typeof buffer === 'string' ? Buffer.from(buffer, 'hex') : buffer

	options.debug === true && console.debug('-------Start Parse 0601-------')
	options.debug === true && process.stdout.write(`Packet ${packet.toString('hex')} ${packet.length}\n`)

	if (packet.length < module.exports.minSize) { // must have a 16 byte key, 1 byte BER, 10 byte timestamp, 4 byte checksum
		throw new Error('Buffer has no content to read')
	}

	const val = module.exports.key.compare(packet, 0, module.exports.key.length) // compare first 16 bytes before BER
	if (val !== 0) {
		throw new Error('Not ST0601')
	}

	let {berHeader, berLength, contentLength} = klv.getBer(packet[module.exports.key.length])
	if (contentLength === null) {
		contentLength = klv.getContentLength(packet.subarray(module.exports.key.length + berHeader, module.exports.key.length + berHeader + berLength))// read content after key and length)
	}

	const parsedLength = module.exports.key.length + berHeader + berLength + contentLength
	if (parsedLength > packet.length) {  // buffer length isn't long enough to read content
		throw new Error('Buffer includes ST0601 key and BER but not content')
	}

	const values = []

	let i = module.exports.key.length + berHeader + berLength //index of first content key
	while (i < parsedLength) {
		const {key, keyLength} = klv.getKey(packet.subarray(i, packet.length))

		let {berHeader, berLength, contentLength} = klv.getBer(packet[i + keyLength])
		if (contentLength === null) {
			contentLength = klv.getContentLength(packet.subarray(i + keyLength + berHeader, i + keyLength + berHeader + berLength))// read content after key and length // i + key.length
		}

		const valueBuffer = packet.subarray(i + keyLength + berHeader + berLength, i + keyLength + berHeader + berLength + contentLength) // read content after key and length

		if (parsedLength < i + keyLength + berHeader + berLength + contentLength) {
			throw new Error(`Invalid ST0601 buffer, not enough content key: ${key}, key length: ${keyLength}, content length: ${contentLength}`)
		}

		const parsed = options.value !== false ? convert({key, buffer: valueBuffer, options}) : {key}

		if (typeof parsed.value === 'string') parsed.value = parsed.value.replace(/[^\x20-\x7E]+/g, '')

		if (options.debug === true) {
			if (key === 2) {
				console.debug(key, contentLength, parsed.name, `${new Date(parsed.value / 1000)}${parsed.unit || ''}`, valueBuffer)
			} else {
				console.debug(key, contentLength, parsed.name, `${parsed.value}${parsed.unit || ''}`, valueBuffer)
			}
		}
		if (options.debug || options.payload || options.value === false) {
			parsed.packet = valueBuffer
		}

		values.push(parsed)

		i += keyLength + berHeader + berLength + contentLength // advance past key, length and value bytes
	}

	const checksum = values.find(klv => klv.key === 1)
	const checksumValue = checksum.value !== undefined ? checksum.value : checksum.packet.readUInt16BE(0)
	if (!klv.isChecksumValid(packet.subarray(0, parsedLength), checksumValue)) {
		checksum.valid = false
		console.debug('Invalid checksum')
		//throw new Error(`Invalid checksum`)
	}

	return values
}

module.exports.encode = (items) => {
	const chunks = items.map(klv => {
		if (klv.key == 2) {
			const uint = bnToBuf(klv.value, st0601data(klv.key).length)
			return {
				key: klv.key,
				packet: uint
			}
		}
		return klv
	})

	return module.exports.assemble(chunks)
}

module.exports.assemble = (chunks) => {
	const header = module.exports.key.toString('hex')
	let payload = ''
	for (const chunk of chunks) {
		if (chunk.key === 1) {
			continue
		}
		const packet = typeof chunk.packet === 'string' ? chunk.packet : chunk.packet.toString('hex')
		payload += chunk.key.toString(16).padStart(2, '0') + (packet.length / 2).toString(16).padStart(2, '0') + packet
	}
	const payloadWithCheckSum = payload + `01020000`
	const completePacketForChecksum = header + getPayloadLengthBer(payloadWithCheckSum) + payloadWithCheckSum
	const checksum = klv.calculateChecksum(completePacketForChecksum) // pad the ending with a fake checksum
	return completePacketForChecksum.slice(0, -4) + checksum.toString(16).padStart(4, '0') // remove 4 blank characters, 2 bytes
}

const getPayloadLengthBer = (payload) => {
	const byteLength = payload.length / 2
	if (byteLength > 127) { // BER long form
		const berLength = Math.ceil(byteLength / 255)
		return `8${berLength}${byteLength.toString(16).padStart(berLength * 2, '0')}`
	} else { // BER short form
		return byteLength.toString(16).padStart(2, '0')
	}
}

const bnToBuf = (bn, size) => {
	let hex = BigInt(bn).toString(16)
	hex = hex.padStart(size * 2, '0')
	return hex
}

const two16SignedMax = 2 ** 15 - 1
const two16SignedMin = -1 * two16SignedMax
const two16Unsigned = 2 ** 16 - 1
const two32max = 2 ** 32 - 1
const two32SignedMax = 2 ** 31 - 1
const two32SignedMin = -1 * two32SignedMax

const convert = ({key, buffer, options}) => {
	try {
		switch (key) {
			case 1:
				klv.checkRequiredSize(key, buffer, st0601data(key).length)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.readUInt16BE(0),
					valid: true
				}
			case 2:
				klv.checkRequiredSize(key, buffer, st0601data(key).length)
				return {
					key,
					name: st0601data(key).name,
					value: parseFloat(buffer.readBigUInt64BE(0)),
					unit: 'µs'
				}
			case 3:
				return {
					key,
					name: st0601data(key).name,
					value: buffer.toString()
				}
			case 4:
				return {
					key,
					name: st0601data(key).name,
					value: buffer.toString()
				}
			case 5:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt16BE(0), [0, two16Unsigned], [0, 360]),
					unit: '°'
				}
			case 6:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-20, 20]),
					unit: '°'
				}
			case 7:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-50, 50]),
					unit: '°'
				}
			case 8:
				klv.checkRequiredSize(key, buffer, 1)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.readUInt8(0),
					unit: 'm/s'
				}
			case 9:
				klv.checkRequiredSize(key, buffer, 1)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.readUInt8(0),
					unit: 'm/s'
				}
			case 10:
				return {
					key,
					name: st0601data(key).name,
					value: buffer.toString()
				}
			case 11:
				return {
					key,
					name: st0601data(key).name,
					value: buffer.toString()
				}
			case 12:
				return {
					key,
					name: st0601data(key).name,
					value: buffer.toString()
				}
			case 13:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-90, 90]),
					unit: '°'
				}
			case 14:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-180, 180]),
					unit: '°'
				}
			case 15:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt16BE(0), [0, two16Unsigned], [-900, 19000]),
					unit: 'm'
				}
			case 16:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt16BE(0), [0, two16Unsigned], [0, 180]),
					unit: '°'
				}
			case 17:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt16BE(0), [0, two16Unsigned], [0, 180]),
					unit: '°'
				}
			case 18:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt32BE(0), [0, two32max], [0, 360]),
					unit: '°'
				}
			case 19:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-180, 180]),
					unit: '°'
				}
			case 20:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt32BE(0), [0, two32max], [0, 360]),
					unit: '°'
				}
			case 21:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt32BE(0), [0, two32max], [0, 5000000]),
					unit: 'm'
				}
			case 22:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt16BE(0), [0, two16Unsigned], [0, 10000]),
					unit: 'm'
				}
			case 23:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-90, 90]),
					unit: '°'
				}
			case 24:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-180, 180]),
					unit: '°'
				}
			case 25:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt16BE(0), [0, two16Unsigned], [-900, 19000]),
					unit: 'm'
				}
			case 26:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.compare(Buffer.from('8000', 'hex')) === 0 ? null : klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-0.075, 0.075]),
					unit: '°'
				}
			case 27:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.compare(Buffer.from('8000', 'hex')) === 0 ? null : klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-0.075, 0.075]),
					unit: '°'
				}
			case 28:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.compare(Buffer.from('8000', 'hex')) === 0 ? null : klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-0.075, 0.075]),
					unit: '°'
				}
			case 29:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.compare(Buffer.from('8000', 'hex')) === 0 ? null : klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-0.075, 0.075]),
					unit: '°'
				}
			case 30:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.compare(Buffer.from('8000', 'hex')) === 0 ? null : klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-0.075, 0.075]),
					unit: '°'
				}
			case 31:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.compare(Buffer.from('8000', 'hex')) === 0 ? null : klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-0.075, 0.075]),
					unit: '°'
				}
			case 32:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.compare(Buffer.from('8000', 'hex')) === 0 ? null : klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-0.075, 0.075]),
					unit: '°'
				}
			case 33:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.compare(Buffer.from('8000', 'hex')) === 0 ? null : klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-0.075, 0.075]),
					unit: '°'
				}
			case 34:
				klv.checkRequiredSize(key, buffer, 1)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.readUInt8(0),
					//unit: 'code'
				}
			case 35:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt16BE(0), [0, two16Unsigned], [0, 360]),
					unit: '°'
				}
			case 36:
				klv.checkRequiredSize(key, buffer, 1)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt8(0), [0, 255], [0, 100]),
					unit: 'm/s'
				}
			case 37:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt16BE(0), [0, two16Unsigned], [0, 5000]),
					unit: 'mbar'
				}
			case 38:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt16BE(0), [0, two16Unsigned], [-900, 19000]),
					unit: 'm'
				}
			case 39:
				klv.checkRequiredSize(key, buffer, 1)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.readInt8(0),
					unit: '°C'
				}
			case 40:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-90, 90]),
					unit: '°'
				}
			case 41:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-180, 180]),
					unit: '°'
				}
			case 42:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt16BE(0), [0, two16Unsigned], [-900, 19000]),
					unit: 'm'
				}
			case 43:
				return {
					key,
					name: st0601data(key).name,
					value: 2 * buffer.readUInt8(0),
					unit: 'pixels'
				}
			case 44:
				return {
					key,
					name: st0601data(key).name,
					value: 2 * buffer.readUInt8(0),
					unit: 'pixels'
				}
			case 45:
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt16BE(0), [0, two16Unsigned], [0, 4095]),
					unit: 'm'
				}
			case 46:
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt16BE(0), [0, two16Unsigned], [0, 4095]),
					unit: 'm'
				}
			case 47:
				return {
					key,
					name: st0601data(key).name,
					value: buffer.readUInt8(0),
				}
			case 48:
				return {
					key,
					name: st0601data(key).name,
					value: st0102.parse(buffer, options)
				}
			case 50:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-20, 20]),
					unit: '°'
				}
			case 51:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-180, 180]),
					unit: 'm/s'
				}
			case 52:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-20, 20]),
					unit: '°'
				}
			case 55:
				klv.checkRequiredSize(key, buffer, 1)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt8(0), [0, 255], [0, 100]),
					unit: '%'
				}
			case 56:
				klv.checkRequiredSize(key, buffer, 1)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.readUInt8(0),
					unit: 'm/s'
				}
			case 57:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt32BE(0), [0, two32max], [0, 5000000]),
					unit: 'm'
				}
			case 58:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt16BE(0), [0, two16Unsigned], [0, 10000]),
					unit: 'kg'
				}
			case 59:
				return {
					key,
					name: st0601data(key).name,
					value: buffer.toString()
				}
			case 62:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.readUInt16BE(0)
				}
			case 63:
				klv.checkRequiredSize(key, buffer, 1)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.readUInt8(0),
				}
			case 64:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt16BE(0), [0, two16Unsigned], [0, 360]),
					unit: '°'
				}
			case 65:
				klv.checkRequiredSize(key, buffer, 1)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.readUInt8(0),
				}
			case 70:
				return {
					key,
					name: st0601data(key).name,
					value: buffer.toString()
				}
			case 71:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt16BE(0), [0, two16Unsigned], [0, 360]),
					unit: '°'
				}
			case 72:
				klv.checkRequiredSize(key, buffer, 8)
				return {
					key,
					name: st0601data(key).name,
					value: parseFloat(buffer.readBigUInt64BE(0)),
					unit: 'µs'
				}
			case 73:
				return {
					key,
					name: st0601data(key).name,
					value: st0806.parseLS(buffer, options)
				}
			case 74:
				return {
					key,
					name: st0601data(key).name,
					value: st0903.parseLS(buffer, options)
				}
			case 75:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt16BE(0), [0, two16Unsigned], [-900, 19000]),
					unit: 'm'
				}
			case 77:
				klv.checkRequiredSize(key, buffer, 1)
				return {
					key,
					name: st0601data(key).name,
					value: buffer.readUInt8(0),
				}
			case 78:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readUInt16BE(0), [0, two16Unsigned], [-900, 19000]),
					unit: 'm'
				}
			case 79:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-327, 327]),
					unit: '°'
				}
			case 80:
				klv.checkRequiredSize(key, buffer, 2)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt16BE(0), [two16SignedMin, two16SignedMax], [-327, 327]),
					unit: '°'
				}
			case 82:
				klv.checkRequiredSize(key, buffer, 4)
				if (buffer.compare(Buffer.from('8000', 'hex')) === 0) {
					return null
				}
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-90, 90]),
					unit: '°'
				}
			case 83:
				klv.checkRequiredSize(key, buffer, 4)
				if (buffer.compare(Buffer.from('8000', 'hex')) === 0) {
					return null
				}
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-180, 180]),
					unit: '°'
				}
			case 84:
				klv.checkRequiredSize(key, buffer, 4)
				if (buffer.compare(Buffer.from('8000', 'hex')) === 0) {
					return null
				}
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-90, 90]),
					unit: '°'
				}
			case 85:
				klv.checkRequiredSize(key, buffer, 4)
				if (buffer.compare(Buffer.from('8000', 'hex')) === 0) {
					return null
				}
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-180, 180]),
					unit: '°'
				}
			case 86:
				klv.checkRequiredSize(key, buffer, 4)
				if (buffer.compare(Buffer.from('8000', 'hex')) === 0) {
					return null
				}
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-90, 90]),
					unit: '°'
				}
			case 87:
				klv.checkRequiredSize(key, buffer, 4)
				if (buffer.compare(Buffer.from('8000', 'hex')) === 0) {
					return null
				}
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-180, 180]),
					unit: '°'
				}
			case 88:
				klv.checkRequiredSize(key, buffer, 4)
				if (buffer.compare(Buffer.from('8000', 'hex')) === 0) {
					return null
				}
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-90, 90]),
					unit: '°'
				}
			case 89:
				klv.checkRequiredSize(key, buffer, 4)
				if (buffer.compare(Buffer.from('8000', 'hex')) === 0) {
					return null
				}
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt32BE(0), [two32SignedMin, two32SignedMax], [-180, 180]),
					unit: '°'
				}
			case 90:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt16BE(0), [two32SignedMin, two32SignedMax], [-90, 90]),
					unit: '°'
				}
			case 91:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt16BE(0), [two32SignedMin, two32SignedMax], [-90, 90]),
					unit: '°'
				}
			case 92:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt16BE(0), [two32SignedMin, two32SignedMax], [-90, 90]),
					unit: '°'
				}
			case 93:
				klv.checkRequiredSize(key, buffer, 4)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(buffer.readInt16BE(0), [two32SignedMin, two32SignedMax], [-90, 90]),
					unit: '°'
				}
			case 94:
				return {
					key,
					name: st0601data(key).name,
					value: buffer.toString('hex') // todo verify this is supposed to have unicode in it
				}
			case 96:
				klv.checkMaxSize(key, buffer, 8)
				return {
					key,
					name: st0601data(key).name,
					value: klv.scale(klv.readVariableUInt(buffer), [0, 2 ** (buffer.length * 8)], [0, 1500000]), //todo this is not correct
					unit: 'm'
				}
			case 116:
				return {
					key,
					name: st0601data(key).name,
					value: 'Not Implemented'
				}
			case 117:
				return {
					key,
					name: st0601data(key).name,
					value: 'Not Implemented',
					unit: 'dps'
				}
			case 118:
				return {
					key,
					name: st0601data(key).name,
					value: 'Not Implemented',
					unit: 'dps'
				}
			case 119:
				return {
					key,
					name: st0601data(key).name,
					value: 'Not Implemented',
					unit: 'dps'
				}
			case 120:
				return {
					key,
					name: st0601data(key).name,
					value: 'Not Implemented',
					unit: '%'
				}
			case 123:
				return {
					key,
					name: st0601data(key).name,
					value: 'Not Implemented'
				}
			case 124:
				return {
					key,
					name: st0601data(key).name,
					value: 'Not Implemented'
				}
			case 125:
				return {
					key,
					name: st0601data(key).name,
					value: 'Not Implemented'
				}
			case 129:
				return {
					key,
					name: st0601data(key).name,
					value: 'Not Implemented'
				}
			default:
				if (options.strict === true) {
					throw Error(`st0601 key ${key} not found`)
				}
				return {
					key,
					name: st0601data(key).name,
					value: 'Not Implemented'
				}
		}
	} catch (e) {
		throw e
	}
}

module.exports.keys = (key) => {
	return st0601data(key)
}

const st0601data = (key) => {
	if (typeof key === 'string') {
		key = parseInt(key)
	}
	switch (key) {
		case 1:
			return {name: 'Checksum', length: 2}
		case 2:
			return {name: 'Precision Time Stamp', length: 8}
		case 3:
			return {name: 'Mission ID'}
		case 4:
			return {name: 'Platform Tail Number'}
		case 5:
			return {name: 'Platform Heading Angle'}
		case 6:
			return {name: 'Platform Pitch Angle'}
		case 7:
			return {name: 'Platform Roll Angle'}
		case 8:
			return {name: 'Platform True Airspeed'}
		case 9:
			return {name: 'Platform Indicated Airspeed'}
		case 10:
			return {name: 'Platform Designation'}
		case 11:
			return {name: 'Image Source Sensor'}
		case 12:
			return {name: 'Image Coordinate System'}
		case 13:
			return {name: 'Sensor Latitude'}
		case 14:
			return {name: 'Sensor Longitude'}
		case 15:
			return {name: 'Sensor True Altitude'}
		case 16:
			return {name: 'Sensor Horizontal Field of View'}
		case 17:
			return {name: 'Sensor Vertical Field of View'}
		case 18:
			return {name: 'Sensor Relative Azimuth Angle'}
		case 19:
			return {name: 'Sensor Relative Elevation Angle'}
		case 20:
			return {name: 'Sensor Relative Roll Angle'}
		case 21:
			return {name: 'Slant Range'}
		case 22:
			return {name: 'Target Width'}
		case 23:
			return {name: 'Frame Center Latitude'}
		case 24:
			return {name: 'Frame Center Longitude'}
		case 25:
			return {name: 'Frame Center Elevation'}
		case 26:
			return {name: 'Offset Corner Latitude Point 1'}
		case 27:
			return {name: 'Offset Corner Longitude Point 1'}
		case 28:
			return {name: 'Offset Corner Latitude Point 2'}
		case 29:
			return {name: 'Offset Corner Longitude Point 2'}
		case 30:
			return {name: 'Offset Corner Latitude Point 3'}
		case 31:
			return {name: 'Offset Corner Longitude Point 3'}
		case 32:
			return {name: 'Offset Corner Latitude Point 4'}
		case 33:
			return {name: 'Offset Corner Longitude Point 4'}
		case 34:
			return {name: 'Icing Detected'}
		case 35:
			return {name: 'Wind Direction'}
		case 36:
			return {name: 'Wind Speed'}
		case 37:
			return {name: 'Static Pressure'}
		case 38:
			return {name: 'Density Altitude'}
		case 39:
			return {name: 'Outside Air Temperature'}
		case 40:
			return {name: 'Target Location Latitude'}
		case 41:
			return {name: 'Target Location Longitude'}
		case 42:
			return {name: 'Target Location Elevation'}
		case 43:
			return {name: 'Target Track Gate Width'}
		case 44:
			return {name: 'Target Track Gate Height'}
		case 45:
			return {name: 'Target Error Estimate - CE90'}
		case 46:
			return {name: 'Target Error Estimate - LE90'}
		case 47:
			return {name: 'Generic Flag Data'}
		case 48:
			return {name: 'Security Local Set'}
		case 50:
			return {name: 'Platform Angle of Attack'}
		case 51:
			return {name: 'Platform Vertical Speed'}
		case 52:
			return {name: 'Platform Sideslip Angle'}
		case 55:
			return {name: 'Relative Humidity'}
		case 56:
			return {name: 'Platform Ground Speed'}
		case 57:
			return {name: 'Ground Range'}
		case 58:
			return {name: 'Platform Fuel Remaining'}
		case 59:
			return {name: 'Platform Call Sign'}
		case 62:
			return {name: 'Laser PRF Code'}
		case 63:
			return {name: 'Sensor Field of View Name'}
		case 64:
			return {name: 'Platform Magnetic Heading'}
		case 65:
			return {name: 'UAS Datalink LS Version Number'}
		case 70:
			return {name: 'Alternate Platform Name'}
		case 71:
			return {name: 'Alternate Platform Heading'}
		case 72:
			return {name: 'Event Start Time'}
		case 73:
			return {name: 'RVT Local Set'}
		case 74:
			return {name: 'VMTI Local Set'}
		case 75:
			return {name: 'Sensor Ellipsoid Height'}
		case 77:
			return {name: 'Operational Mode'}
		case 78:
			return {name: 'Frame Center Height Above Ellipsoid'}
		case 79:
			return {name: 'Sensor North Velocity'}
		case 80:
			return {name: 'Sensor East Velocity'}
		case 81:
			return {name: 'Image Horizon Pixel Pack'}
		case 82:
			return {name: 'Corner Latitude Point 1'}
		case 83:
			return {name: 'Corner Longitude Point 1'}
		case 85:
			return {name: 'Corner Longitude Point 2'}
		case 84:
			return {name: 'Corner Latitude Point 2'}
		case 86:
			return {name: 'Corner Latitude Point 3'}
		case 87:
			return {name: 'Corner Longitude Point 3'}
		case 88:
			return {name: 'Corner Latitude Point 4 '}
		case 89:
			return {name: 'Corner Longitude Point 4'}
		case 90:
			return {name: 'Platform Pitch Angle (Full)'}
		case 91:
			return {name: 'Platform Roll Angle (Full)'}
		case 92:
			return {name: 'Platform Angle of Attack (Full)'}
		case 93:
			return {name: 'Platform Sideslip Angle (Full)'}
		case 94:
			return {name: 'MIIS Core Identifier'}
		case 96:
			return {name: 'Target Width Extended'}
		case 98:
			return {name: 'Geo-Registration Local Set'}
		case 104:
			return {name: 'Sensor Ellipsoid Height Extended'}
		case 113:
			return {name: 'Altitude AGL'}
		case 116:
			return {name: 'Control Command Verification List'}
		case 117:
			return {name: 'Sensor Azimuth Rate'}
		case 118:
			return {name: 'Sensor Elevation Rate'}
		case 119:
			return {name: 'Sensor Roll Rate'}
		case 120:
			return {name: 'On-board MI Storage Percent Full'}
		default:
			return {name: 'Unknown'}
	}
}
