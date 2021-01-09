const fs = require('fs')
const { st0601, st0903, st0104, st0806, klv } = require('../index.js')

const start = new Date().getTime() / 1000
const standards = [st0601, st0903, st0806, st0104]
const packets = {}
for(const standard of standards) {
	packets[standard.name] = []
}

async function processFile(file) {
	let data = new Buffer.from('')
	const options = { debug: process.argv[3] === 'debug' }

	for await (const chunk of file) {
		data = Buffer.concat([data, chunk])
	}

	for (let i = 0; i < data.length; i++) {
		const buffer = data.subarray(i, data.length)

		if (klv.startsWithKey(buffer, st0601.key)) {
			const {index, values}  = klv.parseStandard(st0601, buffer, options)
			values && packets.push(values)
			i += index - 1
		} else if (klv.startsWithKey(buffer, st0903.key)) {
			const {index, values}  = klv.parseStandard(st0903, buffer, options)
			values && packets.push(values)
			i += index - 1
		} else if (klv.startsWithKey(buffer, st0104.key)) {
			const {index, values}  = klv.parseStandard(st0104, buffer, options)
			values && packets.push(values)
			i += index - 1
		}
	}

	console.log(JSON.stringify(packets))
}

if (process.argv.length < 3) {
	console.error(`Command: ${process.argv[0]} ${process.argv[1]} filename <debug>`)
	process.exit()
}

const file = fs.createReadStream(process.argv[2])
processFile(file)
