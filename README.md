# misb.js

Lightweight JavaScript library for parsing and manipulating [MISB](https://nsgreg.nga.mil/misb.jsp) KLV metadata

## About

misb.js is a dependency free library to parse and create KLV metadata in JavaScript. It supports both front-end web browsers and back-end Node.js implementations. misb.js is not affiliated with or endorsed by the Motion Imagery Standards Board.    

### Supported standards
- [ST 0601 UAS Datalink Local Set](https://nsgreg.nga.mil/doc/view?i=5093): Partial
- [ST 0102 Security Metadata](https://nsgreg.nga.mil/doc/view?i=4422): Partial
- [ST 0903 VMTI and Track Metadata](https://nsgreg.nga.mil/doc/view?i=5310): Partial
- [ST 0806 Remote Video Terminal Metadata Set](https://nsgreg.nga.mil/doc/view?i=4162): Partial

## Installation
### NPM

To install `misb.js` with npm run

```bash
npm install @vidterra/misb.js
```

`misb.js` currently requires the use of Node.js 14.x LTS and higher

### Web Browser

```
Not started
```

## Usage Examples

### Basic Usage

```
const { st0601 } = require('@vidterra/misb.js')
const klv =[ 
    '060E2B34020B01010E0103010100000081D2020800046050584E0180030A4D697373696F6E20',
    '3132050271C20602FD3D070208B80A085072656461746F720B07454F204E6F73650C0E47656F',
    '64657469632057475338340D045595B66D0E045B5360C40F02C2211002CD9C1102D917120472',
    '4A0A20130487F84B86140400000000150403830926160212811704F101A229180414BC082B19',
    '0234F3301C01010102010703052F2F5553410C01070D060055005300411602000A4101065E22',
    '0170F592F02373364AF8AA9162C00F2EB2DA16B74341000841A0BE365B5AB96A36450102AA43'
]
const json = st0601.parse(klv.join(''), { debug: true })
console.log(json)
```

### Advanced Usage

See `scripts/file.js` for an example of programmatically reading KLV from a MPEG-TS transport file. The conceptual workflow looks like:

1. Extract KLV metadata with ffmpeg using `ffmpeg -i <input filename> -map 0:d:0 -codec copy -f data <output filename>`
1. Read the extracted metadata file bytes and search for MISB ST keys
1. When a matching key is found, parse the KLV
1. Advance to the next bytes
1. Repeat steps 2-4 until file end

See `scripts/stdin.js` for an example of programmatically reading KLV from a ffmpeg pipe

1. Run the single command `ffmpeg -i <input filename> -map 0:d:0 -codec copy -f data - | node stdin.js`

## Roadmap

- [ ] Tests
- [ ] Browser support
- [ ] JSON to KLV encoding

## Modules

The exported `misb.js` object contains the following modules:

```
const misb = require('misb.js') // export all modules
const { st0601, st0102, st0903, klv } = require('misb.js') // export the modules you want to use
```

- st0601: a module to parse ST 0601 data
- st0102: a module to parse ST 0102 data
- st0903: a module to parse ST 0903 data
- st0806: a module to parse ST 0806 data
- klv: a module for generic KLV helper functions

### ST 0601
```
st0601.key
```

Returns a 16 byte `Buffer` with the ST0601 key

```
st0601.parse(buffer, options)
```

Returns a JSON object of parsed metadata

#### buffer 

A string or Node.js `Buffer` that starts with a fully formed packet of ST 0601 KLV. Embedded KLV within ST 0601, such as ST 0102, will also be parsed. 

Invalid KLV will cause an exception to be thrown. The KLV may have extra trailing content after the complete KLV packet, it will be ignored.  

#### options 

An object with additional options.
- debug (default: `false`): print parsed metadata to standard output

### ST 0102

```
st0102.parse(buffer, options)
```

Returns a JSON object of parsed metadata

#### buffer

A string or Node.js `Buffer` that only contains valid ST 0102 KLV content. Invalid KLV will cause an exception to be thrown. Any additional content other than ST 0102 KLV will cause an exception to be thrown.

#### options

An object with additional options.
- debug (default: `false`): print parsed metadata to standard output

### ST 0903
```
st0903.key
```

Returns a 16 byte `Buffer` with the ST0903 key

```
st0903.parse(buffer, options)
```

Returns a JSON object of parsed metadata

#### buffer

A string or Node.js `Buffer` that starts with a fully formed packet of ST 0903 KLV.

Invalid KLV will cause an exception to be thrown. The KLV may have extra trailing content after the complete KLV packet, it will be ignored.

#### options

An object with additional options.
- debug (default: `false`): print parsed metadata to standard output

### KLV

```
klv.getBer(buffer)
```

Parses the BER for long-form or short-form encoding. 

A short-form encoded BER will return `{ berHeader: 0, berLength: 1, contentLength: <length of KLV content> }`

A long-form encoded BER will return `{ berHeader: 1, berLength: <length of BER in addition to header>, contentLength: null }`. This requires further parsing using the `getContentLength` function.

#### buffer

A `Buffer` with a single byte. Any additional content than the single byte of BER header will cause an exception to be thrown.

```
klv.getContentLength(buffer)
```

Parses the content length of a long-form BER.

#### buffer

A `Buffer` of bytes that sum to the length of the KLV content. Pass the number of bytes returned by `klv.getBer(buffer).berLength` into this function.

## Contact us
Contact us at info@vidterra.com.
