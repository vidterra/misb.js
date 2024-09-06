const { klv } = require('../index.js')

console.log('92', klv.getKey(Buffer.from('5C', 'hex')))
console.log('134', klv.getKey(Buffer.from('8106', 'hex')))
console.log('139', klv.getKey(Buffer.from('810B', 'hex')))