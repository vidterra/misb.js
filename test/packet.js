const path = require('path')
const fs = require('fs')

module.exports.DynamicConstantMISMMSPacketData = {
	file: fs.readFileSync(path.join(__dirname, './DynamicConstantMISMMSPacketData.bin')),
	json: {
		"1": { "key": 1, "name": "Checksum", "value": 15902 }, "2": { "key": 2, "name": "Precision Time Stamp", "value": 1231798102000000, "unit": "µs" }, "3": { "key": 3, "name": "Mission ID", "value": "Mission 12" },
		"5": { "key": 5, "name": "Platform Heading Angle", "value": 159.97436484321355, "unit": "°" }, "6": { "key": 6, "name": "Platform Pitch Angle", "value": -0.43153172399060225, "unit": "°" },
		"7": { "key": 7, "name": "Platform Roll Angle", "value": 3.4058656575212893, "unit": "°" }, "10": { "key": 10, "name": "Platform Designation", "value": "Predator" }, "11": {
			"key": 11, "name": "Image Source Sensor",
			"value": "EO Nose"
		}, "12": { "key": 12, "name": "Image Coordinate System", "value": "Geodetic WGS84" }, "13": { "key": 13, "name": "Sensor Latitude", "value": 60.176822966978335, "unit": "°" },
		"14": { "key": 14, "name": "Sensor Longitude", "value": 128.42675904204452, "unit": "°" }, "15": { "key": 15, "name": "Sensor True Altitude", "value": 14190.719462882429, "unit": "m" },
		"16": { "key": 16, "name": "Sensor Horizontal Field of View", "value": 144.5712977798123, "unit": "°" }, "17": { "key": 17, "name": "Sensor Vertical Field of View", "value": 152.64362554360264, "unit": "°" },
		"18": { "key": 18, "name": "Sensor Relative Azimuth Angle", "value": 160.71921143697557, "unit": "°" }, "19": { "key": 19, "name": "Sensor Relative Elevation Angle", "value": -168.79232483394085, "unit": "°" },
		"20": { "key": 20, "name": "Sensor Relative Roll Angle", "value": 176.86543764939194, "unit": "°" }, "21": { "key": 21, "name": "Slant Range", "value": 68590.98329874477, "unit": "m" },
		"22": { "key": 22, "name": "Target Width", "value": 722.8198672465096, "unit": "m" }, "23": { "key": 23, "name": "Frame Center Latitude", "value": -10.542388633146132, "unit": "°" }, "24": {
			"key": 24, "name": "Frame Center Longitude",
			"value": 29.15789012292302, "unit": "°"
		}, "25": { "key": 25, "name": "Frame Center Elevation", "value": 3216.0372320134275, "unit": "m" }, "48": {
			"key": 48, "name": "Security Local Set", "value": {
				"1": { "key": 1, "name": "Security Classification", "value": "UNCLASSIFIED//" }, "2": { "key": 2, "name": "Classifying Country Coding Method", "value": "1059 Three Letter" },
				"3": { "key": 3, "name": "Classifying Country", "value": "//USA" }, "12": { "key": 12, "name": "Object Country Coding Method", "value": "1059 Three Letter" },
				"13": { "key": 13, "name": "Object Country Codes", "value": "USA" }, "22": { "key": 22, "name": "Version", "value": 10 }
			}
		}, "65": { "key": 65, "name": "UAS Datalink LS Version Number", "value": 6 }, "94": { "key": 94, "name": "MIIS Core Identifier", "value": "0170f592f02373364af8aa9162c00f2eb2da16b74341000841a0be365b5ab96a3645" }
	}
}

module.exports.DynamicOnlyMISMMSPacketData = {
	file: fs.readFileSync(path.join(__dirname, './DynamicOnlyMISMMSPacketData.bin')),
	json: {
		"1": { "key": 1, "name": "Checksum", "value": 51280 }, "2": { "key": 2, "name": "Precision Time Stamp", "value": 1231798102000000, "unit": "µs" },
		"5": { "key": 5, "name": "Platform Heading Angle", "value": 159.97436484321355, "unit": "°" }, "6": { "key": 6, "name": "Platform Pitch Angle", "value": -0.43153172399060225, "unit": "°" },
		"7": { "key": 7, "name": "Platform Roll Angle", "value": 3.4058656575212893, "unit": "°" }, "13": { "key": 13, "name": "Sensor Latitude", "value": 60.176822966978335, "unit": "°" },
		"14": { "key": 14, "name": "Sensor Longitude", "value": 128.42675904204452, "unit": "°" }, "15":
			{ "key": 15, "name": "Sensor True Altitude", "value": 14190.719462882429, "unit": "m" }, "16": { "key": 16, "name": "Sensor Horizontal Field of View", "value": 144.5712977798123, "unit": "°" },
		"17": { "key": 17, "name": "Sensor Vertical Field of View", "value": 152.64362554360264, "unit": "°" }, "18":
			{ "key": 18, "name": "Sensor Relative Azimuth Angle", "value": 160.71921143697557, "unit": "°" }, "19": { "key": 19, "name": "Sensor Relative Elevation Angle", "value": -168.79232483394085, "unit": "°" },
		"20": { "key": 20, "name": "Sensor Relative Roll Angle", "value": 0, "unit": "°" }, "21": {
			"key": 21
			, "name": "Slant Range", "value": 68590.98329874477, "unit": "m"
		}, "22": { "key": 22, "name": "Target Width", "value": 722.8198672465096, "unit": "m" }, "23": { "key": 23, "name": "Frame Center Latitude", "value": -10.542388633146132, "unit": "°" },
		"24": { "key": 24, "name": "Frame Center Longitude", "value": 29.15789012292302, "unit": "°" }, "25": { "key": 25, "name": "Frame Center Elevation", "value": 3216.0372320134275, "unit": "m" },
		"65": { "key": 65, "name": "UAS Datalink LS Version Number", "value": 6 }
	}
}
