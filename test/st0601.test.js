const st0601 = require('../src/st0601.js')
const packet = require('./packet.js')

test('Parse DynamicConstantMISMMSPacketData 0601 buffer', () => {
	expect(st0601.parse(packet.DynamicConstantMISMMSPacketData.file, {verbose: true})).toStrictEqual(packet.DynamicConstantMISMMSPacketData.json)
})

test('Parse DynamicConstantMISMMSPacketData 0601 string', () => {
	expect(st0601.parse(packet.DynamicConstantMISMMSPacketData.file.toString('hex'), {verbose: true})).toStrictEqual(packet.DynamicConstantMISMMSPacketData.json)
})

test('Parse DynamicOnlyMISMMSPacketData 0601 buffer', () => {
	expect(st0601.parse(packet.DynamicOnlyMISMMSPacketData.file, {verbose: true})).toStrictEqual(packet.DynamicOnlyMISMMSPacketData.json)
})

