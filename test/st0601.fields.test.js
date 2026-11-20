const st0601 = require('../src/st0601.js')
const klv = require('../src/klv.js')

// Values from Kitware KWIVER test_data/videos/h264_klv.ts (ST 0601.19), first packet
const packet = st0601.assemble([
	{key: 2, packet: '000459f4a6aa4aa8'},
	{key: 58, packet: 'a45d'},
	{key: 90, packet: 'ff62e2f2'},
	{key: 91, packet: '04d804df'},
	{key: 92, packet: 'f3ab48ef'},
	{key: 93, packet: 'de179323'},
	{key: 96, packet: '00d92a'},
	{key: 125, packet: '09'},
	{key: 65, packet: '13'},
])

const parsed = st0601.parse(packet)
const value = (key) => parsed.find(item => item.key === key).value

test('Platform Fuel Remaining (58) is unsigned', () => {
	expect(value(58)).toBeCloseTo(6420.5386, 3)
})

test('Platform Pitch, Roll and Angle of Attack (Full) (90, 91, 92) read all 4 bytes', () => {
	expect(value(90)).toBeCloseTo(-0.4315251, 6)
	expect(value(91)).toBeCloseTo(3.4058140, 6)
	expect(value(92)).toBeCloseTo(-8.6701770, 6)
})

test('Platform Sideslip Angle (Full) (93) maps onto -180..180', () => {
	expect(value(93)).toBeCloseTo(-47.683, 6)
})

test('Target Width Extended (96) uses ST 1201 IMAPB(0, 1500000)', () => {
	expect(value(96)).toBe(13898.5)
})

test('Platform Status (125) is a uint8 enumeration', () => {
	expect(value(125)).toBe(9)
	expect(parsed.find(item => item.key === 125).name).toBe('Platform Status')
})

test('checksum of the assembled packet is valid', () => {
	expect(parsed.find(item => item.key === 1).valid).toBe(true)
})

test('IMAPB special values return null', () => {
	expect(klv.imapb(Buffer.from('c00000', 'hex'), 0, 1500000)).toBe(null)
})

test('IMAPB with a negative minimum starts at the minimum', () => {
	expect(klv.imapb(Buffer.from('000000', 'hex'), -900, 19000)).toBe(-900)
})

test('a packet without a checksum throws a clear error', () => {
	const noChecksum = Buffer.from('060e2b34020b01010e01030101000000' + '18' + '0208000459f4a6aa4aa8' + '03094d495353494f4e3031' + '410113', 'hex')
	expect(() => st0601.parse(noChecksum)).toThrow('no checksum')
})
